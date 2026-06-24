import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import User from './models/User.js';
import ChangeLog from './models/ChangeLog.js';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All registration parameters are mandatory.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User email already registered.' });

    const user = await User.create({ name, email, password });
    res.status(201).json({ message: 'Developer account provisioned successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed.', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign(
        { userId: user._id, name: user.name, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
      );
      res.json({ userId: user._id, name: user.name, email: user.email, token });
    } else {
      res.status(401).json({ message: 'Invalid credentials profile.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server auth failure.', error: error.message });
  }
});

// --- CHANGE REPOSITORY ROUTES ---

// Fetch Logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await ChangeLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Fetch failed.', error: error.message });
  }
});

// Add New Log (Accepts custom string formatting or explicit fields)
app.post('/api/logs', async (req, res) => {
  try {
    const { userId, screenSetName, devName, ticketName, description, backupScreenSet, screenMadeByDev } = req.body;
    
    // Core payload verification safety check
    if (!userId || !screenSetName || !devName || !ticketName || !description) {
      return res.status(400).json({ message: 'Core parameter fields are completely mandatory.' });
    }

    // Fallbacks to parse inline string elements if fields were sent already concatenated
    let parsedBackup = backupScreenSet || 'N/A';
    let parsedMethod = screenMadeByDev || 'N/A';

    if (description.startsWith('[BACKUP:')) {
      try {
        parsedBackup = description.substring(description.indexOf('[BACKUP: ') + 9, description.indexOf('] [METHOD:'));
        parsedMethod = description.substring(description.indexOf('[METHOD: ') + 9, description.indexOf('] —'));
      } catch (e) {
        console.log("Secondary manual metadata parsing skipped.");
      }
    }

    const newLog = new ChangeLog({ 
      userId, 
      screenSetName, 
      devName, 
      ticketName, 
      backupScreenSet: parsedBackup, 
      screenMadeByDev: parsedMethod, 
      description 
    });
    
    const savedLog = await newLog.save();
    res.status(201).json(savedLog);
  } catch (error) {
    res.status(500).json({ message: 'Commit execution rejected.', error: error.message });
  }
});

// Delete Log (Ownership Protected)
app.delete('/api/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body; 

    const log = await ChangeLog.findById(id);
    if (!log) {
      return res.status(404).json({ message: 'Target document log record not found.' });
    }

    if (log.userId !== email) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete logs that you created yourself.' });
    }

    await ChangeLog.findByIdAndDelete(id);
    res.status(200).json({ message: 'Document log deleted from collection cluster safely.' });
  } catch (error) {
    res.status(500).json({ message: 'Delete routing error event triggered.', error: error.message });
  }
});

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`🚀 Core Service active on port ${PORT}`));