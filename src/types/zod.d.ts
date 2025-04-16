
declare module 'zod' {
  export type ZodType<T = any> = {
    _input: T;
    _output: T;
  };
  
  export interface ZodEffects<T extends ZodType> {
    _input: T['_input'];
    _output: T['_output'];
  }
  
  export interface ZodObject<T extends ZodRawShape> {
    _input: { [k in keyof T]: T[k]['_input'] };
    _output: { [k in keyof T]: T[k]['_output'] };
  }
  
  export type ZodRawShape = { [k: string]: ZodType };
  
  export function z<T extends ZodType>(schema: T): ZodEffects<T>;
  
  export function string(): ZodType<string>;
  export function number(): ZodType<number>;
  export function boolean(): ZodType<boolean>;
  export function object(shape: ZodRawShape): ZodObject<ZodRawShape>;
  export function array(schema: ZodType): ZodType<any[]>;
  
  // Fix the enum function declaration to use enum_ to avoid reserved keyword issues
  export function enum_<T extends readonly [string, ...string[]]>(values: T): ZodType<T[number]>;
  
  export function infer<T extends ZodType>(schema: T): T['_output'];
  
  export function coerce(): {
    number(): ZodType<number>;
    string(): ZodType<string>;
    boolean(): ZodType<boolean>;
  };
  
  export function optional<T extends ZodType>(schema: T): ZodType<T['_output'] | undefined>;
  
  export interface objectUtil {
    readonly mergeShapes: (first: ZodRawShape, second: ZodRawShape) => ZodRawShape;
  }
  
  export const NEVER: unique symbol;
}
