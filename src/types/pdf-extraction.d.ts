declare module "pdf-extraction" {
  interface PDFExtractResult {
    text: string;
    numpages: number;
    info?: {
      Title?: string;
      Author?: string;
      [key: string]: any;
    };
    metadata?: {
      Title?: string;
      Author?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }

  function extract(buffer: Buffer): Promise<PDFExtractResult>;
  export = extract;
}
