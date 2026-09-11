import { Router } from 'express';
import predictionsRouter from './predictions.js';
import healthRouter from '../controllers/healthController.js';

const router = Router();

router.use('/api/v1', predictionsRouter);
router.use(healthRouter);

export default router;