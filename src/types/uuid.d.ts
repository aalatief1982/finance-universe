
declare module 'uuid' {
  export function v1(options?: any, buffer?: any, offset?: number): string;
  export function v3(name: string | Buffer, namespace: string | Buffer): string;
  export function v4(options?: any, buffer?: any, offset?: number): string;
  export function v5(name: string | Buffer, namespace: string | Buffer): string;
  export function parse(id: string, buffer?: any, offset?: number): Buffer;
  export function stringify(buffer: Buffer, offset?: number): string;
  export function validate(id: string): boolean;
  export function version(id: string): number;
}
