import { Router } from 'express';
import { getDataQualityReport } from '../controllers/dataQualityController';

const router = Router();

router.get('/', getDataQualityReport);

export default router;
