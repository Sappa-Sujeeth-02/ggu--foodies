import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.post('/save-fcm-token', async (req, res) => {
    const { userId, fcmToken } = req.body;
    try {
        await User.findOneAndUpdate(
            { userId },
            { fcmToken },
            { upsert: true }
        );
        res.status(200).json({ message: 'Token saved successfully' });
    } catch (error) {
        console.error('Error saving FCM token:', error);
        res.status(500).json({ error: 'Failed to save token' });
    }
});

export default router;