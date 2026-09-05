import { Router } from 'express';
import { getMapWorks } from '../controllers/mapController';

const router = Router();

router.get('/works', getMapWorks);

export default router;
