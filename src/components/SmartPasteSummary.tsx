
import React from 'react';
import { Card } from './ui/card';

interface Props {
  confidence: number;
  matchedCount: number;
  totalTemplates: number;
  fieldScore?: number;
  keywordScore?: number;
}

const SmartPasteSummary: React.FC<Props> = ({ 
  confidence, 
  matchedCount, 
  totalTemplates, 
  fieldScore,
  keywordScore 
}) => {
  return (
    <Card className="bg-accent/10 border-l-4 border-accent text-accent-foreground p-[var(--card-padding)] text-sm rounded-md">
      <h2 className="font-semibold mb-2 text-accent">
        🧠 SmartPaste Summary
      </h2>
		<ul className="list-disc list-inside">
		  <li>Parsed via <strong>Smart Paste</strong> input</li>
		  <li>Checked against <strong>{totalTemplates}</strong> known templates</li>
		  <li>📂 <strong>{matchedCount}</strong> templates matched</li>
		  {typeof fieldScore === 'number' && (
			<li>🧩 Field Completion Score: <strong>{(fieldScore * 100).toFixed(1)}%</strong></li>
		  )}
		  {typeof keywordScore === 'number' && (
			<li>🏷️ Keyword Match Score: <strong>{(keywordScore * 100).toFixed(1)}%</strong></li>
		  )}
		  <li>📐 Final Confidence Score: <strong>{(confidence * 100).toFixed(1)}%</strong></li>
		</ul>
    </Card>
  );
};

export default SmartPasteSummary;
