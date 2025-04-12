
import React from 'react';
import { Check, X } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { PositionedToken } from '@/types/learning';

// This helper function extracts token text from either string or PositionedToken
const getTokenText = (token: string | PositionedToken): string => {
  if (typeof token === 'string') return token;
  return token.token;
};

// This helper function checks if a token is included in a tokens array
const isTokenInArray = (token: string | PositionedToken, array: string[]): boolean => {
  const tokenText = getTokenText(token);
  return array.includes(tokenText);
};

interface FieldTokenMapProps {
  fieldTokenMap: Record<string, (string | PositionedToken)[]>;
  messageTokens: string[];
  isLabelingMode: boolean;
}

const FieldTokenMap: React.FC<FieldTokenMapProps> = ({ 
  fieldTokenMap, 
  messageTokens,
  isLabelingMode
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Field</TableHead>
          <TableHead>Tokens</TableHead>
          <TableHead className="text-right">Found</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(fieldTokenMap).map(([field, tokens]) => {
          const found = tokens.some(token => isTokenInArray(token, messageTokens));
          return (
            <TableRow key={field}>
              <TableCell className="font-medium">{field}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {tokens.map((token, i) => {
                    const tokenText = getTokenText(token);
                    return (
                      <Badge 
                        key={`${field}-${tokenText}-${i}`} 
                        variant="outline"
                        className={`text-xs ${messageTokens.includes(tokenText) ? 'bg-primary/20 border-primary/30' : 'bg-muted'}`}
                      >
                        {tokenText}
                      </Badge>
                    );
                  })}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {found ? 
                  <Check className="ml-auto h-4 w-4 text-green-600" /> : 
                  <X className="ml-auto h-4 w-4 text-muted-foreground" />
                }
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default FieldTokenMap;
