import { z } from 'zod';

const paperFormats = [
  'A0','A1','A2','A3','A4','A5',
  'Letter','Legal','Tabloid','Ledger',
] as const;

export const pdfOptionsSchema = z
  .object({
    format: z.enum(paperFormats).optional(),
    printBackground: z.boolean().optional(),
    landscape: z.boolean().optional(),
    margin: z
      .object({ top: z.string().optional(), right: z.string().optional(), bottom: z.string().optional(), left: z.string().optional() })
      .partial()
      .optional(),
    scale: z.number().min(0.1).max(2).optional(),
    preferCSSPageSize: z.boolean().optional(),
  })
  .partial();

export const htmlRequestSchema = z.object({
  html: z.string().min(1),
  options: pdfOptionsSchema.optional(),
});

export const urlRequestSchema = z.object({
  url: z.string().url(),
  options: pdfOptionsSchema.optional(),
});

export function sanitizeHtml(input: string): string {
  // Basic sanitization: drop <script> tags and on* attributes. Not a full sanitizer.
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/ on[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/ on[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/ on[a-z]+\s*=\s*[^\s>]+/gi, '');
}


