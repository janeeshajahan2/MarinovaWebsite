const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { sendVerificationEmail } = require('../services/emailService');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
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
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create new user
    const user = new User({
      fullName,
      email,
      password,
      verificationToken
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, user.fullName, verificationToken);
    
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
  } catch (error) {
    console.error('Register error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0]
      });
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
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

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
  } catch (error) {
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
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
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
  } catch (error) {
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
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with this verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
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
  } catch (error) {
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
router.post('/resend-verification', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, user.fullName, verificationToken);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/verify-email/:token
// @desc    Verify user email via GET link (for email verification links)
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with this verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Mark email as verified and reset verification token
    user.isEmailVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully! You now have 5 free credits.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        subscriptionStatus: user.subscriptionStatus,
        usageCredits: user.usageCredits,
        monthlyCredits: user.monthlyCredits,
        creditResetDate: user.creditResetDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
});

module.exports = router;
