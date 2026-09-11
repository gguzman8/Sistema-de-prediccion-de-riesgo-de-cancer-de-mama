import { Router } from 'express';
import { checkAiHealth } from '../services/aiService.js';

const router = Router();

router.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    aiService: await checkAiHealth(),
  });
});

export default router;