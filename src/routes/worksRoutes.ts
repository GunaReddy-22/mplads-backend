import { Router } from 'express';
import { getWorks, getWorkById } from '../controllers/worksController';

const router = Router();

router.get('/', getWorks);
router.get('/:id', getWorkById);

export default router;
