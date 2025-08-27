declare module 'papaparse' {
  export function unparse(data: any[]): string;
  export function parse(input: string, config?: any): any;
  export default {
    unparse: (data: any[]) => string,
    parse: (input: string, config?: any) => any
  };
}
