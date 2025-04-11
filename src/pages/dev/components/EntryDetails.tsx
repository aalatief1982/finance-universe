
import React from 'react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LearnedEntry } from '@/types/learning';

interface EntryDetailsProps {
  entry: LearnedEntry;
}

const EntryDetails: React.FC<EntryDetailsProps> = ({ entry }) => {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="original-message">
        <AccordionTrigger className="text-sm font-medium">
          Original Learned Message
        </AccordionTrigger>
        <AccordionContent>
          <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap overflow-auto max-h-[150px]">
            {entry.rawMessage}
          </div>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="confirmed-fields">
        <AccordionTrigger className="text-sm font-medium">
          Confirmed Fields
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-2 rounded-md">
            {entry.confirmedFields && Object.entries(entry.confirmedFields).map(([key, value]) => (
              <div key={key} className="bg-muted p-2 rounded">
                <div className="text-xs text-muted-foreground">{key}</div>
                <div className="font-medium">{value !== undefined ? String(value) : "N/A"}</div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default EntryDetails;
