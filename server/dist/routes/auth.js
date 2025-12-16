"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = __importDefault(require("../middleware/auth"));
const emailService_1 = require("../services/emailService");
const router = express_1.default.Router();
// Generate JWT token
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '7d' // Token valid for 7 days
    });
};
// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        // Validate input
        if (!fullName || !email || !password) {
            res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
            return;
        }
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
            return;
        }
        // Generate verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        // Create new user
        const user = new User_1.default({
            fullName,
            email,
            password,
            verificationToken
        });
        await user.save();
        // Generate token
        const token = generateToken(user._id.toString());
        // Send verification email
        const emailResult = await (0, emailService_1.sendVerificationEmail)(user.email, user.fullName, verificationToken);
        if (!emailResult.success) {
            console.warn('Failed to send verification email:', emailResult.error);
            // Continue anyway - user can resend verification
        }
        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                subscriptionStatus: user.subscriptionStatus,
                usageCredits: user.usageCredits
            }
        });
    }
    catch (error) {
        console.error('Register error:', error);
        // Handle validation errors
        if (error instanceof Error && error.name === 'ValidationError') {
            const validationError = error;
            const messages = Object.values(validationError.errors).map(err => err.message);
            res.status(400).json({
                success: false,
                message: messages[0]
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});
// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
            return;
        }
        // Find user
        const user = await User_1.default.findOne({ email });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
            return;
        }
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
            return;
        }
        // Generate token
        const token = generateToken(user._id.toString());
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                subscriptionStatus: user.subscriptionStatus,
                usageCredits: user.usageCredits
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});
// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth_1.default, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        res.json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                subscriptionStatus: user.subscriptionStatus,
                usageCredits: user.usageCredits,
                usageHistory: user.usageHistory
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// @route   POST /api/auth/verify-email
// @desc    Verify user email
// @access  Public
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
            return;
        }
        // Find user with this verification token
        const user = await User_1.default.findOne({ verificationToken: token });
        if (!user) {
            res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
            return;
        }
        // Mark email as verified and reset verification token
        user.isEmailVerified = true;
        user.verificationToken = null;
        await user.save();
        res.json({
            success: true,
            message: 'Email verified successfully! You now have 3 free credits.',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                subscriptionStatus: user.subscriptionStatus,
                usageCredits: user.usageCredits
            }
        });
    }
    catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during verification'
        });
    }
});
// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Private
router.post('/resend-verification', auth_1.default, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        if (user.isEmailVerified) {
            res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
            return;
        }
        // Generate new verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        await user.save();
        // Send verification email
        const emailResult = await (0, emailService_1.sendVerificationEmail)(user.email, user.fullName, verificationToken);
        if (!emailResult.success) {
            res.status(500).json({
                success: false,
                message: 'Failed to send verification email. Please try again.'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Verification email sent! Please check your inbox.'
        });
    }
    catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
exports.default = router;
