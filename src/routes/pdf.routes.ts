import { Router } from 'express';
import multer from 'multer';
import { fileToPdf, htmlToPdf, urlToPdf } from '../controllers/pdf.controller.js';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.post('/html', htmlToPdf);
router.post('/url', urlToPdf);
router.post('/file', upload.single('file'), fileToPdf);

export default router;


