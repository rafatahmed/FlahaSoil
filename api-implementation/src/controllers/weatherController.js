/**
 * Weather Controller - Phase 2 Week 5 Implementation
 * Handles weather API endpoints for DSS integration
 * 
 * Features:
 * - Current weather data retrieval
 * - Weather forecast data
 * - Enhanced FlahaCalc ET₀ integration
 * - Multiple provider fallback
 * - Caching and error handling
 * 
 * @format
 */

const WeatherService = require('../services/weatherService');

class WeatherController {
    constructor() {
        this.weatherService = new WeatherService();
    }

    /**
     * Get current weather data
     * GET /api/v1/weather/current?lat=25.276987&lon=55.296249&provider=openweather
     */
    async getCurrentWeather(req, res) {
        try {
            const { lat, lon, provider = 'openweather' } = req.query;

            // Validate required parameters
            if (!lat || !lon) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: lat, lon'
                });
            }

            // Validate coordinates
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);

            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid coordinates: lat and lon must be numbers'
                });
            }

            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid coordinates: lat must be -90 to 90, lon must be -180 to 180'
                });
            }

            const weatherData = await this.weatherService.getCurrentWeather(
                latitude, 
                longitude, 
                provider
            );

            res.json({
                success: true,
                data: weatherData,
                location: {
                    latitude,
                    longitude
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error fetching current weather:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch current weather data',
                details: error.message
            });
        }
    }

    /**
     * Get weather forecast
     * GET /api/v1/weather/forecast?lat=25.276987&lon=55.296249&days=7&provider=openweather
     */
    async getWeatherForecast(req, res) {
        try {
            const { lat, lon, days = 7, provider = 'openweather' } = req.query;

            // Validate required parameters
            if (!lat || !lon) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: lat, lon'
                });
            }

            // Validate coordinates
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);
            const forecastDays = parseInt(days);

            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid coordinates: lat and lon must be numbers'
                });
            }

            if (isNaN(forecastDays) || forecastDays < 1 || forecastDays > 14) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid days parameter: must be between 1 and 14'
                });
            }

            const forecastData = await this.weatherService.getWeatherForecast(
                latitude, 
                longitude, 
                forecastDays, 
                provider
            );

            res.json({
                success: true,
                data: forecastData,
                location: {
                    latitude,
                    longitude
                },
                forecastDays,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error fetching weather forecast:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch weather forecast data',
                details: error.message
            });
        }
    }

    /**
     * Get FlahaCalc ET₀ data (Enhanced integration)
     * GET /api/v1/weather/et0?lat=25.276987&lon=55.296249&date=2025-03-03
     */
    async getFlahaCalcET0(req, res) {
        try {
            const { lat, lon, date } = req.query;

            // Validate required parameters
            if (!lat || !lon) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: lat, lon'
                });
            }

            // Validate coordinates
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);

            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid coordinates: lat and lon must be numbers'
                });
            }

            // Validate date if provided
            let targetDate = date;
            if (date) {
                const dateObj = new Date(date);
                if (isNaN(dateObj.getTime())) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid date format: use YYYY-MM-DD'
                    });
                }
                targetDate = dateObj.toISOString().split('T')[0];
            }

            const et0Data = await this.weatherService.getFlahaCalcET0(
                latitude, 
                longitude, 
                targetDate
            );

            res.json({
                success: true,
                data: et0Data,
                location: {
                    latitude,
                    longitude
                },
                requestedDate: targetDate || 'today',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error fetching FlahaCalc ET₀ data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch ET₀ data',
                details: error.message
            });
        }
    }

    /**
     * Get comprehensive weather data for DSS calculations
     * GET /api/v1/weather/dss?lat=25.276987&lon=55.296249&days=7
     */
    async getDSSWeatherData(req, res) {
        try {
            const { lat, lon, days = 7 } = req.query;

            // Validate required parameters
            if (!lat || !lon) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: lat, lon'
                });
            }

            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);
            const forecastDays = parseInt(days);

            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid coordinates'
                });
            }

            // Get comprehensive weather data for DSS
            const [currentWeather, forecast, et0Data] = await Promise.allSettled([
                this.weatherService.getCurrentWeather(latitude, longitude),
                this.weatherService.getWeatherForecast(latitude, longitude, forecastDays),
                this.weatherService.getFlahaCalcET0(latitude, longitude)
            ]);

            const response = {
                success: true,
                data: {
                    current: currentWeather.status === 'fulfilled' ? currentWeather.value : null,
                    forecast: forecast.status === 'fulfilled' ? forecast.value : null,
                    et0: et0Data.status === 'fulfilled' ? et0Data.value : null
                },
                location: {
                    latitude,
                    longitude
                },
                timestamp: new Date().toISOString(),
                errors: []
            };

            // Collect any errors
            if (currentWeather.status === 'rejected') {
                response.errors.push({
                    type: 'current_weather',
                    message: currentWeather.reason.message
                });
            }
            if (forecast.status === 'rejected') {
                response.errors.push({
                    type: 'forecast',
                    message: forecast.reason.message
                });
            }
            if (et0Data.status === 'rejected') {
                response.errors.push({
                    type: 'et0',
                    message: et0Data.reason.message
                });
            }

            // Return partial success if at least one data source succeeded
            if (response.data.current || response.data.forecast || response.data.et0) {
                res.json(response);
            } else {
                res.status(500).json({
                    success: false,
                    error: 'All weather data sources failed',
                    errors: response.errors
                });
            }

        } catch (error) {
            console.error('Error fetching DSS weather data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch comprehensive weather data',
                details: error.message
            });
        }
    }

    /**
     * Clear weather cache (admin endpoint)
     * POST /api/v1/weather/cache/clear
     */
    async clearCache(req, res) {
        try {
            this.weatherService.clearCache();
            
            res.json({
                success: true,
                message: 'Weather cache cleared successfully',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error clearing weather cache:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to clear weather cache',
                details: error.message
            });
        }
    }

    /**
     * Get cache statistics
     * GET /api/v1/weather/cache/stats
     */
    async getCacheStats(req, res) {
        try {
            const stats = this.weatherService.getCacheStats();
            
            res.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error fetching cache stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch cache statistics',
                details: error.message
            });
        }
    }
}

module.exports = new WeatherController();
