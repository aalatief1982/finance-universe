
import React from 'react';
import { Check, X } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

interface FieldTokenMapProps {
  fieldTokenMap: Record<string, string[]>;
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
          const found = tokens.some(token => messageTokens.includes(token));
          return (
            <TableRow key={field}>
              <TableCell className="font-medium">{field}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {tokens.map((token, i) => (
                    <Badge 
                      key={`${field}-${token}-${i}`} 
                      variant="outline"
                      className={`text-xs ${messageTokens.includes(token) ? 'bg-primary/20 border-primary/30' : 'bg-muted'}`}
                    >
                      {token}
                    </Badge>
                  ))}
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
