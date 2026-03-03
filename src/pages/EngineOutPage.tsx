import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isAdminMode } from '@/utils/admin-utils';
import { canAccessEngineOut } from '@/utils/engineOutAccess';
import type { InferenceDTO } from '@/types/inference';
import {
  displaySensitiveText,
  maskCardDigits,
  maskPhoneNumber,
  maskRawSms,
  maskSensitiveText,
} from '@/utils/engineOutMasking';

interface EngineOutState {
  source: 'smart_entry' | 'notification_review';
  inferenceDTO: InferenceDTO;
  continueState: InferenceDTO & Record<string, unknown>;
}

const hashMessage = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
};

const EngineOutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showRaw, setShowRaw] = React.useState(false);
  const adminEnabled = isAdminMode();
  const state = (location.state || null) as EngineOutState | null;

  const allowed = canAccessEngineOut(adminEnabled, state);

  React.useEffect(() => {
    if (!allowed) {
      navigate('/home', { replace: true });
    }
  }, [allowed, navigate]);

  if (!allowed) return null;

  const { inferenceDTO, source, continueState } = state;
  const senderMasked = maskPhoneNumber(inferenceDTO.senderHint) || maskSensitiveText(inferenceDTO.senderHint);
  const rawSmsDisplay = showRaw ? inferenceDTO.rawMessage : maskRawSms(inferenceDTO.rawMessage);
  const debugTrace = inferenceDTO.debugTrace;
  const dtoPreview = showRaw
    ? JSON.stringify(continueState, null, 2)
    : JSON.stringify(
        {
          ...continueState,
          senderHint: maskPhoneNumber(String(continueState.senderHint || '')),
          rawMessage: maskRawSms(String(continueState.rawMessage || '')),
          transaction: {
            ...continueState.transaction,
            fromAccount: maskCardDigits(String(continueState.transaction?.fromAccount || '')),
            toAccount: maskCardDigits(String(continueState.transaction?.toAccount || '')),
            details: {
              ...continueState.transaction?.details,
              rawMessage: maskRawSms(String(continueState.transaction?.details?.rawMessage || '')),
            },
          },
        },
        null,
        2,
      );

  return (
    <Layout withPadding fullWidth showBack>
      <div className="space-y-4 p-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Engine Out (Debug)</h1>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={showRaw} onChange={(e) => setShowRaw(e.target.checked)} />
            Show raw
          </label>
        </div>

        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><strong>Source:</strong> {source}</p>
            <p><strong>Message hash:</strong> {hashMessage(inferenceDTO.rawMessage || '')}</p>
            <p><strong>Sender:</strong> {senderMasked || 'N/A'}</p>
            <p><strong>Origin:</strong> {inferenceDTO.matchOrigin || inferenceDTO.origin || 'unknown'}</p>
            <p><strong>Parsing status:</strong> {inferenceDTO.parsingStatus || 'unknown'}</p>
            <p><strong>Overall confidence:</strong> {inferenceDTO.confidence ?? 'n/a'}</p>
            <p><strong>Raw SMS:</strong> {displaySensitiveText(rawSmsDisplay, showRaw)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Candidate matches</CardTitle></CardHeader>
          <CardContent>
            {debugTrace?.templateSelection?.candidates?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left"><th>Template</th><th>Similarity</th></tr>
                  </thead>
                  <tbody>
                    {debugTrace.templateSelection.candidates.map((candidate, idx) => (
                      <tr key={`${candidate.template}-${idx}`} className="border-t">
                        <td className="pr-3 py-1">{showRaw ? candidate.template : maskRawSms(candidate.template)}</td>
                        <td>{candidate.similarity.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">not available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Field-by-field decision trace</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {debugTrace?.fields?.length ? debugTrace.fields.map((field) => (
              <div key={field.field} className="rounded border p-2 text-sm">
                <p><strong>{field.field}</strong> • {field.tier}</p>
                <p>finalValue: {showRaw ? String(field.finalValue ?? '') : maskSensitiveText(String(field.finalValue ?? ''))}</p>
                <p>score: {field.score}</p>
                <p>evidence: {(field.evidence || []).join(' | ') || 'none'}</p>
                <p>breakdown: direct={field.breakdown.directScore ?? '-'}, inferred={field.breakdown.inferredScore ?? '-'}, default={field.breakdown.defaultScore ?? '-'}</p>
                <p>alternatives: {(field.alternatives || []).map((alt) => `${showRaw ? alt.value : maskSensitiveText(String(alt.value))} (${alt.score}, ${alt.reason})`).join(' • ') || 'none'}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">No field trace available</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>DTO payload preview</CardTitle></CardHeader>
          <CardContent>
            <details>
              <summary className="cursor-pointer text-sm">Expand payload</summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">{dtoPreview}</pre>
            </details>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
          <Button onClick={() => navigate('/edit-transaction', { state: continueState })}>Continue</Button>
        </div>
      </div>
    </Layout>
  );
};

export default EngineOutPage;
