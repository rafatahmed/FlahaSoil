/** @format */

const rateLimit = require("express-rate-limit");

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
	"Free tier limit exceeded. Upgrade to Professional for unlimited access."
);

const professionalLimit = createRateLimit(
	60 * 1000, // 1 minute
	100, // 100 requests per minute
	"Rate limit exceeded. Please try again later."
);

// Authentication-specific rate limits
const authLimit = createRateLimit(
	15 * 60 * 1000, // 15 minutes
	5, // 5 login/register attempts per 15 minutes
	"Too many authentication attempts. Please try again in 15 minutes."
);

const passwordResetLimit = createRateLimit(
	60 * 60 * 1000, // 1 hour
	3, // 3 password reset attempts per hour
	"Too many password reset requests. Please try again in 1 hour."
);

const emailVerificationLimit = createRateLimit(
	60 * 60 * 1000, // 1 hour
	5, // 5 email verification requests per hour
	"Too many verification emails sent. Please try again in 1 hour."
);

module.exports = {
	freeTierLimit,
	professionalLimit,
	authLimit,
	passwordResetLimit,
	emailVerificationLimit,
};
