import { Router } from 'express';
import { createInspection, getInspections } from '../controllers/inspectionController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getInspections);
router.post('/', authenticate, createInspection);

export default router;
