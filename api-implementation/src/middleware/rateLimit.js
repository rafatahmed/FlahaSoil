const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different limits for different tiers
const freeTierLimit = createRateLimit(
  24 * 60 * 60 * 1000, // 24 hours
  50, // 50 requests per day
  'Free tier limit exceeded. Upgrade to Professional for unlimited access.'
);

const professionalLimit = createRateLimit(
  60 * 1000, // 1 minute
  100, // 100 requests per minute
  'Rate limit exceeded. Please try again later.'
);

module.exports = { freeTierLimit, professionalLimit };