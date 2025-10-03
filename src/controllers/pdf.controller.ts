import type { Request, Response } from 'express';
import PdfService from '../services/pdf/PdfService.js';
import { htmlRequestSchema, urlRequestSchema } from '../utils/validators.js';
import type { PdfRenderOptions } from '../types/pdf.js';
import { HTTP_STATUS } from '../types/http.js';
import { HEADERS, MIME } from '../constants/index.js';

const pdfService = new PdfService();

export async function htmlToPdf(req: Request, res: Response) {
  const parsed = htmlRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid body', issues: parsed.error.issues });
  }
  const { html, options } = parsed.data as { html: string; options?: PdfRenderOptions };
  const buffer = await pdfService.render({ kind: 'html', html }, options as PdfRenderOptions | undefined);
  res.setHeader(HEADERS.CONTENT_TYPE, MIME.PDF);
  res.status(HTTP_STATUS.OK).send(buffer);
}

export async function urlToPdf(req: Request, res: Response) {
  const parsed = urlRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid body', issues: parsed.error.issues });
  }
  const { url, options } = parsed.data as { url: string; options?: PdfRenderOptions };
  const buffer = await pdfService.render({ kind: 'url', url }, options as PdfRenderOptions | undefined);
  res.setHeader(HEADERS.CONTENT_TYPE, MIME.PDF);
  res.status(HTTP_STATUS.OK).send(buffer);
}

export async function fileToPdf(req: Request, res: Response) {
  if (!req.file) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'File is required' });
  const optsRaw = (req.body.options as string | undefined) ?? undefined;
  let options: any = undefined;
  if (optsRaw) {
    try {
      options = JSON.parse(optsRaw);
    } catch {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid options JSON' });
    }
  }
  const buffer = await pdfService.render({ kind: 'file-html', path: req.file.path }, options);
  // Save buffer to outputs dir with a timestamp-based name
  const pathModule = await import('path');
  const outputsDir = pathModule.resolve(process.cwd(), 'outputs');
  const baseName = (req.file.originalname || 'document.html').replace(/\.html?$/i, '');
  const filename = `${baseName}-${Date.now()}.pdf`;
  const filePath = pathModule.join(outputsDir, filename);
  const { writeFile } = await import('fs/promises');
  await writeFile(filePath, buffer);
  const fileUrl = `/files/${filename}`;
  return res.status(HTTP_STATUS.CREATED).json({ url: fileUrl, filename });
}


