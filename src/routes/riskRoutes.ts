import { Router } from 'express';
import { getHighRiskWorks, getRiskByWorkId } from '../controllers/riskController';

const router = Router();

router.get('/high', getHighRiskWorks);
router.get('/:workId', getRiskByWorkId);

export default router;
