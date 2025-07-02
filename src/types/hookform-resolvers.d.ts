
declare module '@hookform/resolvers/zod' {
  import { z } from 'zod';
  
  export function zodResolver<T extends z.ZodType<any, any>>(
    schema: T,
    schemaOptions?: z.ParseParams,
    factoryOptions?: { mode?: 'async' | 'sync' }
  ): (values: any) => Promise<{ values: any; errors: Record<string, any> }>;
}
