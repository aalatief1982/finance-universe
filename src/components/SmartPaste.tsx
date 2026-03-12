/**
 * @file SmartPaste.tsx
 * @description UI component for SmartPaste.
 *
 * @module components/SmartPaste
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Transaction } from '@/types/transaction';
import { Loader2 } from 'lucide-react';
import MicButton from './smart-paste/MicButton';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { isAdminMode } from '@/utils/admin-utils';
import { Label } from './ui/label';
import { Card } from './ui/card';
import DetectedTransactionCard from './smart-paste/DetectedTransactionCard';
import NoTransactionMessage from './smart-paste/NoTransactionMessage';
// parseSmsMessage removed from keystroke path — only used via parseAndInferTransaction on submit
import { parseAndInferTransaction } from '@/lib/smart-paste-engine/parseAndInferTransaction';
import { shouldKeepStructuredResult } from '@/lib/smart-paste-engine/structuredResultPolicy';
import { getTemplateFailureCount } from '@/lib/smart-paste-engine/templateUtils';
import { useNavigate } from 'react-router-dom';
import { isFinancialTransactionMessage } from '@/lib/smart-paste-engine/messageFilter';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';
import { computeCapturedFields } from '@/lib/inference/fieldStatus';
import { useLanguage } from '@/i18n/LanguageContext';
import { parseFreeformTransaction } from '@/lib/freeform-entry';
import { nanoid } from 'nanoid';
import type { InferenceDecisionTrace, InferenceParsingStatus } from '@/types/inference';

const normalizeFieldConfidences = (
  confidences?: Record<string, number>,
): Record<string, number> => {
  const normalized = { ...(confidences || {}) };

  if (
    typeof normalized.account === 'number' &&
    typeof normalized.fromAccount !== 'number'
  ) {
    normalized.fromAccount = normalized.account;
  }

  if (
    typeof normalized.payee === 'number' &&
    typeof normalized.vendor !== 'number'
  ) {
    normalized.vendor = normalized.payee;
  }

  return normalized;
};

// --- i18n helper: simple {var} interpolation ---
const interpolate = (template: string, vars: Record<string, string | number>): string =>
  Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    template,
  );

interface SmartPasteProps {
  senderHint?: string;
  prefillText?: string | null;
  onPrefillConsumed?: () => void;
  onTransactionsDetected?: (
    transactions: Transaction[],
    rawMessage?: string,
    senderHint?: string,
    confidence?: number,
    matchOrigin?: 'template' | 'structure' | 'ml' | 'fallback' | 'freeform',
    parsingStatus?: InferenceParsingStatus,
    matchedCount?: number,
    totalTemplates?: number,
    fieldScore?: number,
    keywordScore?: number,
    fieldConfidences?: Record<string, number>,
    debugTrace?: InferenceDecisionTrace,
  ) => void;
}

const SmartPaste = ({
  senderHint,
  prefillText,
  onPrefillConsumed,
  onTransactionsDetected,
}: SmartPasteProps) => {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedTransactions, setDetectedTransactions] = useState<
    Transaction[]
  >([]);
  const [matchStatus, setMatchStatus] = useState(t('smartEntry.pasteToBegin'));
  const [hasMatch, setHasMatch] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [matchOrigin, setMatchOrigin] = useState<
    'template' | 'structure' | 'ml' | 'fallback' | 'freeform' | null
  >(null);
  const [fieldConfidences, setFieldConfidences] = useState<
    Record<string, number>
  >({});
  const [parsingStatus, setParsingStatus] = useState<InferenceParsingStatus | null>(null);
  const [matchedCount, setMatchedCount] = useState<number | null>(null);
  const [totalTemplates, setTotalTemplates] = useState<number | null>(null);
  const [fieldScore, setFieldScore] = useState<number | null>(null);
  const [keywordScore, setKeywordScore] = useState<number | null>(null);
  const [debugTrace, setDebugTrace] = useState<InferenceDecisionTrace | undefined>();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const blockedSharedTextRef = React.useRef<string | null>(null);
  const pendingPrefillConfirmationRef = React.useRef<string | null>(null);
  const consumedPrefillRef = React.useRef<string | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  const { startListening, isListening, isSupported: micSupported } = useSpeechToText({
    onResult: (transcript) => {
      setText((prev) => (prev ? prev + ' ' + transcript : transcript));
    },
  });

  // --- Origin display helpers (i18n) ---
  const getOriginLabel = (origin: string | null): string => {
    switch (origin) {
      case 'template': return t('smartEntry.originTemplate');
      case 'ml': return t('smartEntry.originMl');
      case 'freeform': return t('smartEntry.originFreeform');
      case 'fallback': return t('smartEntry.originFallback');
      default: return t('smartEntry.originStructure');
    }
  };

  const getOriginShortLabel = (origin: string | null): string => {
    switch (origin) {
      case 'template': return t('smartEntry.originTemplateShort');
      case 'freeform': return t('smartEntry.originFreeformShort');
      case 'fallback': return t('smartEntry.originFallbackShort');
      case 'ml': return t('smartEntry.originMlShort');
      default: return t('smartEntry.originStructureShort');
    }
  };

  useEffect(() => {
    if (!prefillText?.trim()) {
      blockedSharedTextRef.current = null;
      return;
    }

    console.log('[SHARE_FLOW][SMART_PASTE] prefill received');

    if (pendingPrefillConfirmationRef.current === prefillText) {
      return;
    }

    if (!text.trim()) {
      setText(prefillText);
      pendingPrefillConfirmationRef.current = prefillText;
      blockedSharedTextRef.current = null;
      console.log('[SHARE_FLOW][SMART_PASTE] prefill staged');
      return;
    }

    if (blockedSharedTextRef.current === prefillText) {
      return;
    }

    blockedSharedTextRef.current = prefillText;
    console.log('[SHARE_FLOW][SMART_PASTE] prefill blocked due to existing text');
    toast({
      title: t('toast.smartEntry.sharedBlocked'),
      description: t('toast.smartEntry.sharedBlockedDesc'),
    });
  }, [onPrefillConsumed, prefillText, text, toast, t]);

  useEffect(() => {
    const pendingPrefill = pendingPrefillConfirmationRef.current;

    if (!pendingPrefill) {
      return;
    }

    if (text !== pendingPrefill) {
      return;
    }

    console.log('[SHARE_FLOW][SMART_PASTE] prefill confirmed in state');

    if (consumedPrefillRef.current !== pendingPrefill) {
      onPrefillConsumed?.();
      consumedPrefillRef.current = pendingPrefill;
      console.log('[SHARE_FLOW][SMART_PASTE] onPrefillConsumed fired');
    }

    pendingPrefillConfirmationRef.current = null;
  }, [onPrefillConsumed, text]);

  // Match status is now computed only on submit (inside handleSubmit)
  // to avoid running the heavy parseSmsMessage pipeline on every keystroke.
  useEffect(() => {
    if (!text.trim()) {
      setMatchStatus(t('smartEntry.pasteToBegin'));
      setHasMatch(false);
      setIsSubmitted(false);
    }
  }, [text, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitStart = performance.now();
    let gateDuration = 0;

    if (!text.trim()) {
      toast({
        title: t('toast.smartEntry.noMessage'),
        description: t('toast.smartEntry.noMessageDesc'),
        variant: 'destructive',
      });
      return;
    }
    if (import.meta.env.MODE === 'development') {
      // console.log('[SmartPaste] Checking message:', text);
    }
    setIsProcessing(true);
    setIsSubmitted(true);
    setError(null);
    setConfidence(null);
    setMatchOrigin(null);
    setParsingStatus(null);
    setMatchedCount(null);
    setTotalTemplates(null);
    setFieldScore(null);
    setKeywordScore(null);
    logAnalyticsEvent('smart_paste_sms');

    try {
      // --- Primary path: structured/template parser (only if input passes SMS gate) ---
      const gateStart = performance.now();
      const passesStructuredGate = isFinancialTransactionMessage(text);
      gateDuration = Number((performance.now() - gateStart).toFixed(2));
      let usedFreeform = false;

      if (passesStructuredGate) {
        const {
          transaction,
          confidence: conf,
          origin,
          parsed,
          fieldConfidences: fc,
          parsingStatus: ps,
          matchedCount: mc,
          totalTemplates: tt,
          fieldScore: fs,
          keywordScore: ks,
          debugTrace: dt,
        } = await parseAndInferTransaction(text, senderHint);

        dt.operational = dt.operational || {};
        dt.operational.financialGatePassed = passesStructuredGate;
        dt.operational.parseMode = 'structured';
        dt.operational.rawInputLength = text.length;
        dt.operational.freeformFallbackUsed = false;
        dt.operational.stageTimingsMs = {
          ...(dt.operational.stageTimingsMs || {}),
          gate: gateDuration,
        };

        // Keep structured output when it is strong OR materially semi-structured.
        if (shouldKeepStructuredResult({
          transaction,
          confidence: conf,
          origin,
          parsed,
          fieldConfidences: fc,
          parsingStatus: ps,
          matchedCount: mc,
          totalTemplates: tt,
          fieldScore: fs,
          keywordScore: ks,
          debugTrace: dt,
        })) {
          const normalizedFC = normalizeFieldConfidences(fc);
          setDetectedTransactions([transaction]);
          setConfidence(conf);
          setMatchOrigin(origin);
          setFieldConfidences(normalizedFC);
          setParsingStatus(ps);
          setMatchedCount(mc);
          setTotalTemplates(tt);
          setFieldScore(fs);
          setKeywordScore(ks);
          setDebugTrace(dt);

          if (parsed.matched) {
            const bank =
              parsed.inferredFields?.vendor?.value ||
              parsed.directFields?.vendor?.value ||
              parsed.directFields?.fromAccount?.value ||
              '';
            setMatchStatus(
              interpolate(t('smartEntry.matchedTemplate'), {
                bank: bank || t('smartEntry.matchedTemplateFallback'),
              }),
            );
            setHasMatch(true);
          } else {
            setMatchStatus(t('smartEntry.readyToReview'));
            setHasMatch(false);
          }

          if (parsed.matched) {
            const failCount = getTemplateFailureCount(parsed.templateHash, senderHint);
            if (failCount >= 3) {
              toast({ title: t('toast.smartEntry.templateFailing') });
              navigate(
                `/train-model?msg=${encodeURIComponent(text)}&sender=${encodeURIComponent(senderHint || '')}`,
              );
            }
          }
        } else {
          // Structured path weak — try freeform fallback
          usedFreeform = true;
          dt.operational = dt.operational || {};
          dt.operational.freeformFallbackUsed = true;
          dt.operational.parseMode = 'structured';
          setDebugTrace(dt);
        }
      } else {
        // Input doesn't pass SMS triple-gate — try freeform directly
        usedFreeform = true;
      }

      // --- Fallback path: freeform parser ---
      if (usedFreeform) {
        const freeResult = parseFreeformTransaction(text);
        if (freeResult.success) {
          const freeTransaction: Transaction = {
            id: nanoid(),
            title: freeResult.title,
            amount: freeResult.amount,
            category: freeResult.category,
            subcategory: freeResult.subcategory,
            date: freeResult.date,
            type: freeResult.type,
            currency: freeResult.currency,
            source: 'smart-paste-freeform',
            vendor: freeResult.title,
            person: freeResult.counterparty || undefined,
          };

          const freeFC: Record<string, number> = {
            amount: freeResult.fieldConfidences.amount,
            type: freeResult.fieldConfidences.type,
            date: freeResult.fieldConfidences.date,
            vendor: freeResult.fieldConfidences.title,
            category: freeResult.fieldConfidences.category,
            currency: freeResult.fieldConfidences.currency,
          };

          setDetectedTransactions([freeTransaction]);
          setConfidence(freeResult.confidence);
          setMatchOrigin('freeform');
          setFieldConfidences(freeFC);
          setParsingStatus(freeResult.confidence >= 0.5 ? 'partial' : 'failed');
          setMatchedCount(0);
          setTotalTemplates(0);
          setFieldScore(0);
          setKeywordScore(0);
          const fallbackTrace: InferenceDecisionTrace = {
            confidenceBreakdown: {
              fieldScore: 0,
              templateScore: 0,
              keywordScore: 0,
              overallConfidence: freeResult.confidence,
            },
            templateSelection: {
              selected: 'structure',
              reason: 'Freeform fallback path used.',
              candidates: [],
            },
            fields: [],
            operational: {
              rawInputLength: text.length,
              financialGatePassed: passesStructuredGate,
              parseMode: 'freeform',
              freeformFallbackUsed: true,
              finalConfidence: freeResult.confidence,
              stageTimingsMs: {
                gate: gateDuration,
              },
              counters: {
                localMapsConsulted: {
                  templateBank: false,
                  keywordBank: false,
                  vendorMap: false,
                  templateAccountMap: false,
                },
              },
            },
          };
          setDebugTrace(fallbackTrace);
          setMatchStatus(t('smartEntry.readyToReview'));
          setHasMatch(false);
        } else {
          // Both paths failed — no transaction found
          toast({
            title: t('toast.smartEntry.noTransaction'),
            description: t('toast.smartEntry.noTransactionDesc'),
            variant: 'default',
          });
          setDetectedTransactions([]);
          setMatchStatus(t('smartEntry.readyToReview'));
          setHasMatch(false);
        }
      }
    } catch (err: unknown) {
      if (import.meta.env.MODE === 'development') {
        console.error('[SmartPaste] Error in parsing:', err);
      }
      setError(t('smartEntry.parseError'));
      toast({
        title: t('toast.smartEntry.parseFailed'),
        description: t('toast.smartEntry.parseFailedDesc'),
        variant: 'destructive',
      });
      setConfidence(null);
      setMatchOrigin(null);
      setParsingStatus(null);
      setMatchedCount(null);
      setTotalTemplates(null);
      setFieldScore(null);
      setKeywordScore(null);
      setDebugTrace(undefined);
    } finally {
      const submitDuration = Number((performance.now() - submitStart).toFixed(2));
      setDebugTrace((current) => {
        if (!current) return current;
        current.operational = current.operational || {};
        current.operational.totalParseDurationMs = submitDuration;
        current.operational.stageTimingsMs = current.operational.stageTimingsMs || {};
        if (typeof current.operational.stageTimingsMs.gate !== 'number') {
          current.operational.stageTimingsMs.gate = gateDuration;
        }
        return { ...current };
      });
      setIsProcessing(false);
    }
  };

  const capturedFieldStatus = useMemo(
    () =>
      computeCapturedFields(detectedTransactions[0], fieldConfidences, {
        fields: ['amount', 'date', 'vendor', 'category'],
        confidence: confidence ?? undefined,
        origin: matchOrigin ?? undefined,
        matchOrigin: matchOrigin ?? undefined,
      }),
    [detectedTransactions, fieldConfidences, confidence, matchOrigin],
  );

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (import.meta.env.MODE === 'development') {
        // console.log("[SmartPaste] Clipboard text captured:", clipboardText);
      }
      setText(clipboardText);
    } catch (err) {
      toast({
        title: t('toast.smartEntry.clipboardFailed'),
        description: t('toast.smartEntry.clipboardFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleAddTransaction = (transaction: Transaction) => {
    if (import.meta.env.MODE === 'development') {
      // console.log('[SmartPaste] handleAddTransaction called with:', {
      // transaction,
      // currentFieldConfidences: fieldConfidences,
      // currentConfidence: confidence,
      // currentMatchOrigin: matchOrigin,
      // parsedFields: {
      // amount: transaction.amount,
      // currency: transaction.currency,
      // date: transaction.date,
      // type: transaction.type,
      // category: transaction.category,
      // vendor: transaction.vendor,
      // fromAccount: transaction.fromAccount,
      // }
      // });
    }

    if (import.meta.env.MODE === 'development') {
      // console.log("[SmartPaste] Transaction added:", transaction);
    }
    if (onTransactionsDetected) {
      if (import.meta.env.MODE === 'development') {
        // console.log("[SmartPaste] Calling onTransactionsDetected with fieldConfidences:", fieldConfidences);
      }
      onTransactionsDetected(
        [transaction],
        text,
        senderHint,
        confidence || 0.95,
        matchOrigin || 'structure',
        parsingStatus || undefined,
        matchedCount || 0,
        totalTemplates || 0,
        fieldScore ?? undefined,
        keywordScore ?? undefined,
        normalizeFieldConfidences(fieldConfidences),
        debugTrace,
      );
    }

    logAnalyticsEvent('smart_paste_save');
  };

  return (
    <div className="space-y-4 pb-[calc(var(--safe-area-bottom,0px)+var(--bottom-nav-height,72px)+96px)] pt-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('smartEntry.instructions')}
        </p>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="message">{t('smartEntry.label')}</Label>
            <MicButton
              isListening={isListening}
              isSupported={micSupported}
              onClick={startListening}
              size="sm"
            />
          </div>
          <Textarea
            id="message"
            placeholder={t('smartEntry.placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px]"
            dir="auto"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-start gap-2">
          <Button
            type="submit"
            variant={detectedTransactions.length > 0 ? 'outline' : 'default'}
            disabled={isProcessing || !text.trim()}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('smartEntry.reviewButton')}
          </Button>
        </div>

        {confidence !== null && (
          <p
            className={`text-sm mt-2 ${
              confidence >= 0.8
                ? 'text-success'
                : confidence >= 0.5
                  ? 'text-warning'
                  : 'text-destructive'
            }`}
          >
            {t('smartEntry.confidence')} {(confidence * 100).toFixed(0)}% ·{' '}
            {getOriginLabel(matchOrigin)}
          </p>
        )}

        {detectedTransactions.length > 0 && confidence !== null && (
          <Card className="p-3 bg-accent/10 border-accent/30">
            <h3 className="text-sm font-medium mb-2">{t('smartEntry.whatWeFound')}</h3>
            <div className="text-sm space-y-1">
              <p>
                {t('smartEntry.detectionBasis')}{' '}
                <span className="font-medium">
                  {getOriginShortLabel(matchOrigin)}
                </span>
              </p>
              <p>
                {t('smartEntry.fieldsCaptured')}{' '}
                <span className="font-medium">
                  {capturedFieldStatus.capturedCount}/
                  {capturedFieldStatus.totalCount}
                </span>
              </p>
              <p>{t('smartEntry.suggestedNotConfirmed')}</p>
              <p>
                {t('smartEntry.currency')}{' '}
                <span className="font-medium">
                  {detectedTransactions[0].currency || t('smartEntry.currencyUnknown')}
                </span>
              </p>
              <p>
                {t('smartEntry.confidence')}{' '}
                <span className="font-medium">
                  {(confidence * 100).toFixed(0)}%
                </span>
              </p>
              {detectedTransactions[0].category === 'Uncategorized' && (
                <p className="text-warning">
                  {t('smartEntry.categoryNeedsConfirmation')}
                </p>
              )}
            </div>
          </Card>
        )}
      </form>

      {detectedTransactions.length > 0 && (
        <div className="space-y-3 mt-2">
          <h3 className="text-sm font-medium">{t('smartEntry.detectedPreview')}</h3>
          {detectedTransactions.map((txn) => (
            <DetectedTransactionCard
              key={txn.id}
              transaction={txn}
              fieldConfidences={fieldConfidences}
              isSmartMatch={true}
              onAddTransaction={handleAddTransaction}
              origin={matchOrigin ?? undefined}
            />
          ))}
        </div>
      )}

      <NoTransactionMessage
        show={
          isSubmitted &&
          !isProcessing &&
          text.trim() &&
          detectedTransactions.length === 0 &&
          !error
        }
        message={matchStatus}
        matched={hasMatch}
      />
    </div>
  );
};

export default SmartPaste;
