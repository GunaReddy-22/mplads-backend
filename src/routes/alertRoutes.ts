import { Router } from 'express';
import { getAlerts, updateAlertStatus } from '../controllers/alertController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getAlerts);
router.patch('/:id', authenticate, updateAlertStatus);

export default router;
