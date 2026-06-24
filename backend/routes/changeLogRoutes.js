import express from 'express';
import ChangeLog from '../models/ChangeLog.js';

const router = express.Router();

// @desc    Get all audit logs (Sorted by newest first)
// @route   GET /api/logs
router.get('/', async (req, res) => {
  try {
    const logs = await ChangeLog.find().sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching audit trail profiles', error: error.message });
  }
});

// @desc    Commit a new configuration change record
// @route   POST /api/logs
router.post('/', async (req, res) => {
  try {
    const { userId, screenSetName, devName, ticketName, description } = req.body;

    // Validate request body parameters
    if (!userId || !screenSetName || !devName || !ticketName || !description) {
      return res.status(400).json({ message: 'All transaction entry inputs are mandatory' });
    }

    const newLog = new ChangeLog({
      userId,
      screenSetName,
      devName,
      ticketName,
      description
    });

    const savedLog = await newLog.save();
    res.status(201).json(savedLog);
  } catch (error) {
    res.status(500).json({ message: 'Failed to commit log to MongoDB document stack', error: error.message });
  }
});

export default router;