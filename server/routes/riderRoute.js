import express from 'express';
import { 
    toggleRiderStatus, 
    getAvailableJobs, 
    acceptJob, 
    getMyJobs, 
    completeDelivery,
    dropJob // 🟢 FIXED: Now correctly imported from riderController!
} from '../controllers/riderController.js';

import { protect, authorize } from '../middlewares/authRole.js';

const riderRouter = express.Router();

riderRouter.post('/status', protect, authorize('rider'), toggleRiderStatus);
riderRouter.get('/available', protect, authorize('rider'), getAvailableJobs);
riderRouter.post('/accept', protect, authorize('rider'), acceptJob);
riderRouter.get('/my-jobs', protect, authorize('rider'), getMyJobs);
riderRouter.post('/complete', protect, authorize('rider'), completeDelivery);

// 🟢 The Drop Job Route
riderRouter.post('/drop', protect, authorize('rider'), dropJob); 

export default riderRouter;