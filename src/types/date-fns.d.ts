
declare module 'date-fns' {
  export function format(date: Date | number, formatStr: string, options?: {}): string;
  export function parseISO(dateString: string): Date;
  export function isValid(date: any): boolean;
  export function isDate(value: any): boolean;
  export function formatDistance(date: Date | number, baseDate: Date | number, options?: {}): string;
  export function differenceInDays(dateLeft: Date | number, dateRight: Date | number): number;
  export function addDays(date: Date | number, amount: number): Date;
  export function subDays(date: Date | number, amount: number): Date;
  export function addMonths(date: Date | number, amount: number): Date;
  export function subMonths(date: Date | number, amount: number): Date;
  export function startOfMonth(date: Date | number): Date;
  export function endOfMonth(date: Date | number): Date;
  export function startOfWeek(date: Date | number, options?: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }): Date;
  export function endOfWeek(date: Date | number, options?: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }): Date;
  export function isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isSameMonth(dateLeft: Date | number, dateRight: Date | number): boolean;
}
