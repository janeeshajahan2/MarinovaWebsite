import express, { Request, Response, Router } from 'express';
import User from '../models/User';
import authMiddleware from '../middleware/auth';
import { TrackUsageRequestBody, SubscribeRequestBody, SubscriptionPlan } from '../types';

const router: Router = express.Router();

// @route   POST /api/usage/track
// @desc    Track feature usage and deduct credits
// @access  Private
router.post('/track', authMiddleware, async (req: Request<object, object, TrackUsageRequestBody>, res: Response): Promise<void> => {
  try {
    const { feature } = req.body;

    if (!feature) {
      res.status(400).json({
        success: false,
        message: 'Feature name is required'
      });
      return;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: 'Please verify your email to use this feature',
        requiresVerification: true
      });
      return;
    }

    // Check if user has subscription for paid features
    const paidFeatures: string[] = ['chat', 'report'];
    if (paidFeatures.includes(feature) && user.subscriptionStatus === 'free') {
      res.status(403).json({
        success: false,
        message: 'This feature requires a subscription',
        requiresSubscription: true
      });
      return;
    }

    // For free tier, check credits
    if (user.subscriptionStatus === 'free') {
      if (user.usageCredits <= 0) {
        res.status(403).json({
          success: false,
          message: 'You have used all your free credits. Please subscribe to continue.',
          requiresSubscription: true,
          usageCredits: 0
        });
        return;
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
router.get('/credits', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
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
router.put('/subscribe', authMiddleware, async (req: Request<object, object, SubscribeRequestBody>, res: Response): Promise<void> => {
  try {
    const { plan } = req.body;

    const validPlans: SubscriptionPlan[] = ['free', 'retail_india', 'international', 'enterprise'];
    if (!plan || !validPlans.includes(plan)) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
      return;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
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

export default router;
