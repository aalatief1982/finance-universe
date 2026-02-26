/**
 * @file SmartPasteSummary.tsx
 * @description UI component for SmartPasteSummary.
 *
 * @module components/SmartPasteSummary
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

import React from 'react';
import { Card } from './ui/card';

interface Props {
  confidence: number;
  matchedCount?: number;
  totalTemplates?: number;
  fieldScore?: number;
  keywordScore?: number;
}

const SmartPasteSummary: React.FC<Props> = ({
  confidence,
  matchedCount,
  totalTemplates,
  fieldScore,
  keywordScore,
}) => {
  const qualityLabel =
    confidence >= 0.8
      ? 'Looks good'
      : confidence >= 0.5
      ? 'Needs quick review'
      : 'Needs careful review';

  return (
    <Card className="bg-accent/10 border-l-4 border-accent text-accent-foreground p-[var(--card-padding)] text-sm rounded-md">
      <h2 className="font-semibold mb-2 text-accent">
        Review before saving
      </h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          Quality check: <strong>{qualityLabel}</strong>
        </li>
        <li>
          Confidence estimate: <strong>{(confidence * 100).toFixed(0)}%</strong>
        </li>
        {typeof fieldScore === 'number' && fieldScore < 0.75 && (
          <li>Some important details may still need confirmation.</li>
        )}
        {typeof keywordScore === 'number' && keywordScore < 0.5 && (
          <li>Category may need review before you save.</li>
        )}
        <li>Saving helps improve similar message detection on this device.</li>
      </ul>

      {typeof matchedCount === 'number' && typeof totalTemplates === 'number' && (
        <p className="mt-2 text-xs text-muted-foreground">
          We used your past confirmations to improve this suggestion.
        </p>
      )}
    </Card>
  );
};

export default SmartPasteSummary;
