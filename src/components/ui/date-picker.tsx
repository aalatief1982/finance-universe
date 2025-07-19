
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Capacitor } from '@capacitor/core';

interface DatePickerProps {
  date: Date | null;
  setDate: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  isAutoFilled?: boolean;
}

export function DatePicker({
  date,
  setDate,
  placeholder = "Pick a date",
  className,
  isAutoFilled,
}: DatePickerProps) {
  const isNative = Capacitor.isNativePlatform();

  // Handle native date input for mobile devices
  const handleNativeDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value ? new Date(e.target.value) : null;
    setDate(selectedDate);
  };

  // For native platforms, use the native date input
  if (isNative) {
    return (
      <div className={cn("relative", className)}>
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="date"
          className={cn(
            "w-full pl-10 pr-3 py-2 font-normal",
            !date && "text-muted-foreground",
            isAutoFilled ? "bg-[#dfffe0]" : "bg-background",
            "dark:bg-white dark:text-black"
          )}
          data-driven={isAutoFilled || undefined}
          value={date ? format(date, "yyyy-MM-dd") : ""}
          onChange={handleNativeDateSelect}
          placeholder={placeholder}
        />
      </div>
    );
  }

  // For web, use the Popover/Calendar component
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal dark:bg-black dark:text-white",
            !date && "text-muted-foreground",
            isAutoFilled ? "bg-[#dfffe0]" : "bg-background",
            className
          )}
          data-driven={isAutoFilled || undefined}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "PPP")
          ) : (
            <span className={cn(isAutoFilled && "bg-[#dfffe0] rounded-md px-1 py-0.5")}>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 pointer-events-auto dark:bg-black dark:text-white"
        align="start"
      >
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={setDate}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
