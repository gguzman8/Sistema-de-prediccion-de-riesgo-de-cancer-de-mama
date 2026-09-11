import { Router } from 'express';
import multer from 'multer';
import config from '../config.js';
import { createPrediction } from '../controllers/predictionController.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSizeBytes,
    files: 1,
  },
});

router.post(
  '/predictions',
  upload.single('image'),
  createPrediction,
);

export default router;