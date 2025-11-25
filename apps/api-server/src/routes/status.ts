import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

// Maintenance status type
export type MaintenanceStatus = {
  isActive: boolean;
  mode: 'maintenance' | 'update' | 'emergency' | 'none';
  title: string;
  message: string;
  estimatedEndTime?: string;
  progress?: number;
  updates?: Array<{
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'warning' | 'success';
  }>;
};

// In-memory status (in production, this would come from database or config)
let currentStatus: MaintenanceStatus = {
  isActive: false,
  mode: 'none',
  title: '',
  message: '',
  updates: []
};

// Get current maintenance status
router.get('/status', (req, res) => {
  try {
    res.json(currentStatus);
  } catch (error) {
    logger.error('Error fetching maintenance status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// Update maintenance status (admin only - should be protected in production)
router.post('/status', (req, res) => {
  try {
    const { isActive, mode, title, message, estimatedEndTime, progress, updates } = req.body;
    
    currentStatus = {
      isActive: isActive ?? currentStatus.isActive,
      mode: mode ?? currentStatus.mode,
      title: title ?? currentStatus.title,
      message: message ?? currentStatus.message,
      estimatedEndTime: estimatedEndTime ?? currentStatus.estimatedEndTime,
      progress: progress ?? currentStatus.progress,
      updates: updates ?? currentStatus.updates
    };
    
    logger.info('Maintenance status updated', currentStatus);
    res.json(currentStatus);
  } catch (error) {
    logger.error('Error updating maintenance status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;

