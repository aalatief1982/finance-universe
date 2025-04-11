
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CircleDot, CircleCheck, CircleX, Tag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check } from 'lucide-react';

// Token field types available for manual labeling
export const TOKEN_FIELD_TYPES = [
  { value: 'amount', label: 'Amount', color: 'blue' },
  { value: 'currency', label: 'Currency', color: 'green' },
  { value: 'vendor', label: 'Vendor', color: 'orange' },
  { value: 'account', label: 'Account', color: 'purple' },
  { value: 'unlabeled', label: 'Unlabeled', color: 'gray' },
  { value: 'ignore', label: 'Ignore', color: 'red' }
];

interface TokenLabelingProps {
  messageTokens: string[];
  tokenLabels: Record<string, string>;
  isLabelingMode: boolean;
  getTokenFieldMatch: (token: string) => string | null;
  handleTokenLabelChange: (token: string, newLabel: string) => void;
}

const TokenLabeling: React.FC<TokenLabelingProps> = ({
  messageTokens,
  tokenLabels,
  isLabelingMode,
  getTokenFieldMatch,
  handleTokenLabelChange
}) => {
  // Get the token match status and return appropriate styling
  const getTokenStyle = (token: string) => {
    if (isLabelingMode) {
      const labelType = tokenLabels[token] || 'unlabeled';
      
      const fieldColors: Record<string, string> = {
        amount: "bg-blue-100 text-blue-800 border-blue-300",
        currency: "bg-green-100 text-green-800 border-green-300",
        vendor: "bg-orange-100 text-orange-800 border-orange-300",
        account: "bg-purple-100 text-purple-800 border-purple-300",
        unlabeled: "bg-muted text-muted-foreground",
        ignore: "bg-red-100 text-red-800 border-red-300"
      };
      
      return {
        className: fieldColors[labelType] || "bg-muted text-muted-foreground",
        icon: labelType !== 'unlabeled' ? <Tag className="h-3 w-3 mr-1" /> : <CircleDot className="h-3 w-3 mr-1" />,
        field: labelType !== 'unlabeled' ? labelType : null
      };
    }
    
    const fieldMatch = getTokenFieldMatch(token);
    
    if (!fieldMatch) {
      return {
        className: "bg-muted text-muted-foreground",
        icon: <CircleDot className="h-3 w-3 mr-1" />
      };
    }
    
    // Color coding based on field type
    const fieldColors: Record<string, string> = {
      amount: "bg-blue-100 text-blue-800 border-blue-300",
      currency: "bg-green-100 text-green-800 border-green-300",
      vendor: "bg-orange-100 text-orange-800 border-orange-300",
      account: "bg-purple-100 text-purple-800 border-purple-300"
    };
    
    return {
      className: fieldColors[fieldMatch] || "bg-primary/20 text-primary border-primary/30",
      icon: <CircleCheck className="h-3 w-3 mr-1" />,
      field: fieldMatch
    };
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center">
        {isLabelingMode ? (
          <>
            <Tag className="h-4 w-4 mr-1" />
            Token Labeling
          </>
        ) : (
          <>
            <CircleDot className="h-4 w-4 mr-1" />
            Token Analysis
          </>
        )}
      </h3>
      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-md">
        {messageTokens.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No tokens found in message</p>
        ) : (
          messageTokens.map((token, index) => {
            const style = getTokenStyle(token);
            return isLabelingMode ? (
              <DropdownMenu key={`${token}-${index}`}>
                <DropdownMenuTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={`flex items-center gap-1 cursor-pointer ${style.className} border hover:bg-muted/50`}
                  >
                    {style.icon}
                    {token}
                    {style.field && (
                      <span className="ml-1 text-[9px] px-1 bg-background/50 rounded">
                        {style.field}
                      </span>
                    )}
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40">
                  {TOKEN_FIELD_TYPES.map((type) => (
                    <DropdownMenuItem 
                      key={type.value}
                      className={`text-sm flex items-center gap-2 ${
                        tokenLabels[token] === type.value ? 'bg-muted/60' : ''
                      }`}
                      onClick={() => handleTokenLabelChange(token, type.value)}
                    >
                      <div className={`w-2 h-2 rounded-full bg-${type.color}-500`} />
                      {type.label}
                      {tokenLabels[token] === type.value && (
                        <Check className="h-3 w-3 ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Badge 
                key={`${token}-${index}`} 
                variant="outline" 
                className={`flex items-center gap-1 ${style.className} border`}
              >
                {style.icon}
                {token}
                {style.field && (
                  <span className="ml-1 text-[9px] px-1 bg-background/50 rounded">
                    {style.field}
                  </span>
                )}
              </Badge>
            );
          })
        )}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <div className="flex items-center">
          <CircleDot className="h-3 w-3 mr-1 text-muted-foreground" />
          <span className="text-muted-foreground">Unmatched</span>
        </div>
        <div className="flex items-center">
          <CircleCheck className="h-3 w-3 mr-1 text-blue-600" />
          <span className="text-blue-600">amount</span>
        </div>
        <div className="flex items-center">
          <CircleCheck className="h-3 w-3 mr-1 text-green-600" />
          <span className="text-green-600">currency</span>
        </div>
        <div className="flex items-center">
          <CircleCheck className="h-3 w-3 mr-1 text-orange-600" />
          <span className="text-orange-600">vendor</span>
        </div>
        <div className="flex items-center">
          <CircleCheck className="h-3 w-3 mr-1 text-purple-600" />
          <span className="text-purple-600">account</span>
        </div>
        {isLabelingMode && (
          <div className="flex items-center">
            <CircleX className="h-3 w-3 mr-1 text-red-600" />
            <span className="text-red-600">ignore</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenLabeling;
