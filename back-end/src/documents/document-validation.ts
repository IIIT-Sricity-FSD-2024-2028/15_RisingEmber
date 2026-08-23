import { BadRequestException } from '@nestjs/common';

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export interface DocumentPayloadForValidation {
  fileName: string;
  content?: string;
}

export function validateDocumentPayload(payload: DocumentPayloadForValidation) {
  const fileName = String(payload.fileName || '').trim();
  if (!fileName || fileName.includes('/') || fileName.includes('\\') || fileName === '.' || fileName === '..') {
    throw new BadRequestException('fileName must be a safe file name without path separators.');
  }

  if (payload.content === undefined || payload.content === '') return;

  const content = String(payload.content);
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/.exec(content);
  if (!match) {
    throw new BadRequestException('content must be a valid base64 data URL.');
  }

  const mimeType = match[1].toLowerCase();
  const encoded = match[2];
  const extensions = MIME_EXTENSIONS[mimeType];
  if (!extensions) {
    throw new BadRequestException('This document MIME type is not supported.');
  }

  if (encoded.length % 4 === 1) {
    throw new BadRequestException('content contains malformed base64 data.');
  }

  const decoded = Buffer.from(encoded, 'base64');
  const canonicalEncoded = decoded.toString('base64').replace(/=+$/, '');
  if (canonicalEncoded !== encoded.replace(/=+$/, '')) {
    throw new BadRequestException('content contains malformed base64 data.');
  }

  if (decoded.byteLength > MAX_DOCUMENT_BYTES) {
    throw new BadRequestException('Document content must be 25 MiB or smaller after decoding.');
  }

  const extension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  if (!extensions.includes(extension)) {
    throw new BadRequestException('fileName extension does not match the document MIME type.');
  }
}

export function isDataUrlContent(content?: string) {
  return typeof content === 'string' && content.startsWith('data:');
}
