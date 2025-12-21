declare module "eml-parser" {
  import { Readable } from "stream";

  interface ParseEmlOptions {
    ignoreEmbedded?: boolean;
  }

  interface Attachment {
    content: Buffer | string;
    filename?: string;
    fileName?: string;
    contentType?: string;
  }

  interface ParsedEml {
    text?: string;
    textAsHtml?: string;
    html?: string;
    attachments?: Attachment[];
  }

  class EMLParser {
    constructor(stream: Readable);
    parseEml(options?: ParseEmlOptions): Promise<ParsedEml>;
  }

  export default EMLParser;
}
