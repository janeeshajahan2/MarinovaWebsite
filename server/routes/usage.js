const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/usage/track
// @desc    Track feature usage and deduct credits
// @access  Private
router.post('/track', authMiddleware, async (req, res) => {
  try {
    const { feature } = req.body;

    if (!feature) {
      return res.status(400).json({
        success: false,
        message: 'Feature name is required'
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email to use this feature',
        requiresVerification: true
      });
    }

    // Check if user has subscription for paid features
    const paidFeatures = ['chat', 'report'];
    if (paidFeatures.includes(feature) && user.subscriptionStatus === 'free') {
      return res.status(403).json({
        success: false,
        message: 'This feature requires a subscription',
        requiresSubscription: true
      });
    }

    // For free tier, check credits
    if (user.subscriptionStatus === 'free') {
      if (user.usageCredits <= 0) {
        return res.status(403).json({
          success: false,
          message: 'You have used all your free credits. Please subscribe to continue.',
          requiresSubscription: true,
          usageCredits: 0
        });
      }

      // Deduct credit
      user.usageCredits -= 1;
    }

    // Track usage
    user.usageHistory.push({
      feature,
      usedAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Usage tracked',
      usageCredits: user.usageCredits,
      subscriptionStatus: user.subscriptionStatus
    });
  } catch (error) {
    console.error('Track usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/usage/credits
// @desc    Get remaining credits
// @access  Private
router.get('/credits', authMiddleware, async (req, res) => {
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
      usageCredits: user.usageCredits,
      subscriptionStatus: user.subscriptionStatus,
      isEmailVerified: user.isEmailVerified,
      usageHistory: user.usageHistory
    });
  } catch (error) {
    console.error('Get credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/usage/subscribe
// @desc    Update subscription status (mock for now, will integrate payment later)
// @access  Private
router.put('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;

    const validPlans = ['free', 'retail_india', 'international', 'enterprise'];
    if (!plan || !validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.subscriptionStatus = plan;
    
    // Reset credits to unlimited for paid plans (represented as high number)
    if (plan !== 'free') {
      user.usageCredits = 999999;
    }

    await user.save();

    res.json({
      success: true,
      message: `Subscription updated to ${plan}`,
      subscriptionStatus: user.subscriptionStatus,
      usageCredits: user.usageCredits
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
