/**
 * Weather Routes - Phase 2 Week 5 Implementation
 * Provides weather API endpoints for DSS integration
 * 
 * Routes:
 * - GET /api/v1/weather/current - Current weather data
 * - GET /api/v1/weather/forecast - Weather forecast
 * - GET /api/v1/weather/et0 - FlahaCalc ET₀ data
 * - GET /api/v1/weather/dss - Comprehensive DSS weather data
 * - POST /api/v1/weather/cache/clear - Clear cache (admin)
 * - GET /api/v1/weather/cache/stats - Cache statistics
 * 
 * @format
 */

const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const auth = require('../middleware/auth');
const planAccess = require('../middleware/planAccess');
const { professionalLimit, freeTierLimit } = require('../middleware/rateLimit');

/**
 * Weather API Routes
 * All weather endpoints require authentication for usage tracking
 */

// Current weather data
router.get(
    '/current',
    auth, // Require authentication
    freeTierLimit, // Basic rate limiting
    weatherController.getCurrentWeather
);

// Weather forecast data
router.get(
    '/forecast',
    auth, // Require authentication
    freeTierLimit, // Basic rate limiting
    weatherController.getWeatherForecast
);

// FlahaCalc ET₀ data (Enhanced integration)
router.get(
    '/et0',
    auth, // Require authentication
    professionalLimit, // Higher rate limit for ET₀ data
    weatherController.getFlahaCalcET0
);

// Comprehensive DSS weather data (Professional+ only)
router.get(
    '/dss',
    auth, // Require authentication
    planAccess.requireFeature('advancedCalculations'), // Professional+ only
    professionalLimit, // Professional rate limiting
    weatherController.getDSSWeatherData
);

// Cache management endpoints (Admin only)
router.post(
    '/cache/clear',
    auth, // Require authentication
    planAccess.requireFeature('adminAccess'), // Admin only
    weatherController.clearCache
);

router.get(
    '/cache/stats',
    auth, // Require authentication
    planAccess.requireFeature('adminAccess'), // Admin only
    weatherController.getCacheStats
);

/**
 * Route documentation for API reference
 */
router.get('/docs', (req, res) => {
    res.json({
        title: 'FlahaSoil Weather API',
        version: '1.0.0',
        description: 'Weather data integration for DSS calculations',
        endpoints: {
            'GET /current': {
                description: 'Get current weather data',
                parameters: {
                    lat: 'Latitude (required, -90 to 90)',
                    lon: 'Longitude (required, -180 to 180)',
                    provider: 'Weather provider (optional, default: openweather)'
                },
                example: '/api/v1/weather/current?lat=25.276987&lon=55.296249&provider=openweather'
            },
            'GET /forecast': {
                description: 'Get weather forecast data',
                parameters: {
                    lat: 'Latitude (required, -90 to 90)',
                    lon: 'Longitude (required, -180 to 180)',
                    days: 'Forecast days (optional, 1-14, default: 7)',
                    provider: 'Weather provider (optional, default: openweather)'
                },
                example: '/api/v1/weather/forecast?lat=25.276987&lon=55.296249&days=7'
            },
            'GET /et0': {
                description: 'Get FlahaCalc ET₀ data',
                parameters: {
                    lat: 'Latitude (required, -90 to 90)',
                    lon: 'Longitude (required, -180 to 180)',
                    date: 'Date (optional, YYYY-MM-DD format, default: today)'
                },
                example: '/api/v1/weather/et0?lat=25.276987&lon=55.296249&date=2025-03-03'
            },
            'GET /dss': {
                description: 'Get comprehensive weather data for DSS (Professional+ only)',
                parameters: {
                    lat: 'Latitude (required, -90 to 90)',
                    lon: 'Longitude (required, -180 to 180)',
                    days: 'Forecast days (optional, 1-14, default: 7)'
                },
                example: '/api/v1/weather/dss?lat=25.276987&lon=55.296249&days=7'
            },
            'POST /cache/clear': {
                description: 'Clear weather cache (Admin only)',
                parameters: {},
                example: '/api/v1/weather/cache/clear'
            },
            'GET /cache/stats': {
                description: 'Get cache statistics (Admin only)',
                parameters: {},
                example: '/api/v1/weather/cache/stats'
            }
        },
        authentication: {
            required: true,
            type: 'Bearer token',
            header: 'Authorization: Bearer <token>'
        },
        rateLimit: {
            free: '100 requests per hour',
            professional: '1000 requests per hour',
            enterprise: '10000 requests per hour'
        },
        providers: {
            openweather: {
                name: 'OpenWeatherMap',
                coverage: 'Global',
                features: ['current', 'forecast']
            },
            noaa: {
                name: 'NOAA Weather Service',
                coverage: 'United States',
                features: ['current', 'forecast']
            },
            flahacalc: {
                name: 'FlahaCalc API',
                coverage: 'Global',
                features: ['et0', 'meteorological_data']
            }
        },
        errorCodes: {
            400: 'Bad Request - Invalid parameters',
            401: 'Unauthorized - Authentication required',
            403: 'Forbidden - Insufficient plan access',
            429: 'Too Many Requests - Rate limit exceeded',
            500: 'Internal Server Error - Service unavailable'
        }
    });
});

module.exports = router;
