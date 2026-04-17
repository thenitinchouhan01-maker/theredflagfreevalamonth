const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const requireCredits = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    if (user.credits < 1) {
      logger.warn('Insufficient credits', {
        userId: userId.toString(),
        credits: user.credits
      });
      throw AppError.forbidden(
        'Insufficient credits. Please purchase a plan to continue.',
        'INSUFFICIENT_CREDITS'
      );
    }

    req.userCredits = user.credits;
    next();
  } catch (error) {
    next(error);
  }
};

const deductCredit = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, credits: { $gte: 1 } },
      { $inc: { credits: -1 } },
      { new: true }
    );

    if (!updatedUser) {
      logger.error('Credit deduction failed - race condition', {
        userId: userId.toString()
      });
      throw AppError.forbidden(
        'Credit deduction failed. Please try again.',
        'CREDIT_DEDUCTION_FAILED'
      );
    }

    logger.info('Credit deducted', {
      userId: userId.toString(),
      remainingCredits: updatedUser.credits
    });

    req.remainingCredits = updatedUser.credits;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireCredits,
  deductCredit
};
