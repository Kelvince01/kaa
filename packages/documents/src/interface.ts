import type { GetDocumentRequest, GetInvoiceOrReceiptResponse } from "./types";

export type Processor = {
  // getDocument: (params: GetDocumentRequest) => Promise<GetDocumentResponse>;
  getInvoiceOrReceipt?: (
    params: GetDocumentRequest
  ) => Promise<GetInvoiceOrReceiptResponse>;
};
