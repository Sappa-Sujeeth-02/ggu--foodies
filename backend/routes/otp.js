import express from 'express';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';
import restaurantModel from '../models/restaurantModel.js'; // Import restaurant model

dotenv.config();
const router = express.Router();

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Store OTPs temporarily (in-memory for this example; use a database in production)
const userOtps = new Map();
const restaurantOtps = new Map();

// User OTP routes
router.post('/generate-otp', async (req, res) => {
    const { email, phone, method } = req.body;

    if (!email && !phone) {
        return res.status(400).json({ message: 'Email or phone is required' });
    }

    if (!method) {
        return res.status(400).json({ message: 'Method (email or phone) is required' });
    }

    const otp = generateOTP();
    const identifier = method === 'email' ? email : phone;
    userOtps.set(identifier, otp);

    try {
        if (method === 'email') {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your OTP for GGU Foodies',
                text: `Your OTP is ${otp}. It is valid for 10 minutes.`
            };

            await transporter.sendMail(mailOptions);
            return res.status(200).json({ message: 'OTP sent successfully' });
        } else if (method === 'phone') {
            await twilioClient.messages.create({
                body: `Your OTP for GGU Foodies is ${otp}. It is valid for 10 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: `+91${phone}`
            });
            return res.status(200).json({ message: 'OTP sent successfully' });
        } else {
            return res.status(400).json({ message: 'Invalid method' });
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        return res.status(500).json({
            message: method === 'email' ? 'Failed to send OTP email' : 'Failed to send OTP SMS'
        });
    }
});

router.post('/verify-otp', (req, res) => {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
        return res.status(400).json({ message: 'Identifier and OTP are required' });
    }

    const storedOtp = userOtps.get(identifier);

    if (!storedOtp) {
        return res.status(400).json({ message: 'OTP not found or expired' });
    }

    if (storedOtp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    userOtps.delete(identifier); // Clear OTP after verification
    return res.status(200).json({ message: 'OTP verified successfully' });
});

// Restaurant OTP routes
router.post('/restaurant-generate-otp', async (req, res) => {
    const { email, phone, method } = req.body;

    if (!email || !phone) {
        return res.status(400).json({ message: 'Both email and phone are required' });
    }

    if (!method) {
        return res.status(400).json({ message: 'Method (email or phone) is required' });
    }

    // Validate restaurant existence
    const restaurant = await restaurantModel.findOne({ restaurantemail: email, phone });
    if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found with provided email and phone' });
    }

    const otp = generateOTP();
    const identifier = method === 'email' ? email : phone;
    restaurantOtps.set(identifier, otp);

    try {
        if (method === 'email') {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your OTP for GGU Foodies Restaurant',
                text: `Your OTP for restaurant password reset is ${otp}. It is valid for 10 minutes.`
            };

            await transporter.sendMail(mailOptions);
            return res.status(200).json({ message: 'OTP sent successfully' });
        } else if (method === 'phone') {
            await twilioClient.messages.create({
                body: `Your OTP for GGU Foodies Restaurant is ${otp}. It is valid for 10 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: `+91${phone}`
            });
            return res.status(200).json({ message: 'OTP sent successfully' });
        } else {
            return res.status(400).json({ message: 'Invalid method' });
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        return res.status(500).json({
            message: method === 'email' ? 'Failed to send OTP email' : 'Failed to send OTP SMS'
        });
    }
});

router.post('/restaurant-verify-otp', (req, res) => {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
        return res.status(400).json({ message: 'Identifier and OTP are required' });
    }

    const storedOtp = restaurantOtps.get(identifier);

    if (!storedOtp) {
        return res.status(400).json({ message: 'OTP not found or expired' });
    }

    if (storedOtp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    restaurantOtps.delete(identifier); // Clear OTP after verification
    return res.status(200).json({ message: 'OTP verified successfully' });
});

export default router;