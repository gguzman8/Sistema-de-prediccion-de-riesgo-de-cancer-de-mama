import * as predictionService from '../services/predictionService.js';

export async function createPrediction(req, res, next) {
  try {
    const payload = await predictionService.runPrediction(req.file, req.body);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
}