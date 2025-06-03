/**
 * Weather Service - Phase 2 Week 5 Implementation
 * Provides weather data integration with multiple APIs and fallback strategies
 *
 * Features:
 * - OpenWeatherMap API integration
 * - NOAA API integration
 * - FlahaCalc API enhanced integration
 * - Fallback strategy with multiple providers
 * - Data caching and normalization
 * - Error handling and retries
 *
 * @format
 */

const axios = require("axios");
const NodeCache = require("node-cache");

class WeatherService {
	constructor() {
		// Initialize cache with 1 hour TTL for weather data
		this.cache = new NodeCache({ stdTTL: 3600 });

		// API configurations
		this.apis = {
			openweather: {
				baseUrl: "https://api.openweathermap.org/data/2.5",
				apiKey: process.env.OPENWEATHER_API_KEY,
				enabled: !!process.env.OPENWEATHER_API_KEY,
			},
			noaa: {
				baseUrl: "https://api.weather.gov",
				apiKey: null, // NOAA doesn't require API key
				enabled: process.env.NOAA_API_ENABLED !== "false", // Enabled by default unless explicitly disabled
			},
			flahacalc: {
				baseUrl: "https://evapotran.flaha.org/api/v1",
				apiKey: process.env.FLAHACALC_API_KEY,
				enabled: process.env.ENABLE_WEATHER_API !== "false", // Always enabled unless explicitly disabled
			},
		};

		// Log API configuration status
		console.log("Weather Service API Configuration:");
		console.log(
			`  OpenWeatherMap: ${
				this.apis.openweather.enabled ? "Enabled" : "Disabled (no API key)"
			}`
		);
		console.log(`  NOAA: ${this.apis.noaa.enabled ? "Enabled" : "Disabled"}`);
		console.log(
			`  FlahaCalc: ${this.apis.flahacalc.enabled ? "Enabled" : "Disabled"}`
		);

		// If no weather providers are available, enable mock mode
		this.mockMode = !this.apis.openweather.enabled && !this.apis.noaa.enabled;
		if (this.mockMode) {
			console.warn(
				"⚠️  No weather providers configured - running in mock mode"
			);
		}

		// Retry configuration
		this.retryConfig = {
			maxRetries: 3,
			retryDelay: 1000, // 1 second
			backoffMultiplier: 2,
		};
	}

	/**
	 * Get current weather data with fallback strategy
	 * @param {number} lat - Latitude
	 * @param {number} lon - Longitude
	 * @param {string} preferredProvider - Preferred weather provider
	 * @returns {Object} Normalized weather data
	 */
	async getCurrentWeather(lat, lon, preferredProvider = "openweather") {
		const cacheKey = `weather_current_${lat}_${lon}`;
		const cached = this.cache.get(cacheKey);

		if (cached) {
			console.log("Returning cached weather data");
			return cached;
		}

		// If in mock mode, return mock data
		if (this.mockMode) {
			console.log("Returning mock weather data (no APIs configured)");
			const mockData = this.generateMockWeatherData(lat, lon);
			this.cache.set(cacheKey, mockData);
			return mockData;
		}

		const providers = this.getProviderOrder(preferredProvider);

		for (const provider of providers) {
			try {
				console.log(`Attempting to fetch weather from ${provider}`);
				const weatherData = await this.fetchWeatherFromProvider(
					provider,
					lat,
					lon
				);

				if (weatherData) {
					const normalizedData = this.normalizeWeatherData(
						weatherData,
						provider
					);
					this.cache.set(cacheKey, normalizedData);
					return normalizedData;
				}
			} catch (error) {
				console.warn(`Weather provider ${provider} failed:`, error.message);
				continue;
			}
		}

		// Fallback to mock data if all providers fail
		console.log("All providers failed, returning mock weather data");
		const mockData = this.generateMockWeatherData(lat, lon);
		this.cache.set(cacheKey, mockData);
		return mockData;
	}

	/**
	 * Get weather forecast with fallback strategy
	 * @param {number} lat - Latitude
	 * @param {number} lon - Longitude
	 * @param {number} days - Number of forecast days (default: 7)
	 * @param {string} preferredProvider - Preferred weather provider
	 * @returns {Object} Normalized forecast data
	 */
	async getWeatherForecast(
		lat,
		lon,
		days = 7,
		preferredProvider = "openweather"
	) {
		const cacheKey = `weather_forecast_${lat}_${lon}_${days}`;
		const cached = this.cache.get(cacheKey);

		if (cached) {
			console.log("Returning cached forecast data");
			return cached;
		}

		// If in mock mode, return mock data
		if (this.mockMode) {
			console.log("Returning mock forecast data (no APIs configured)");
			const mockData = this.generateMockForecastData(lat, lon, days);
			this.cache.set(cacheKey, mockData);
			return mockData;
		}

		const providers = this.getProviderOrder(preferredProvider);

		for (const provider of providers) {
			try {
				console.log(`Attempting to fetch forecast from ${provider}`);
				const forecastData = await this.fetchForecastFromProvider(
					provider,
					lat,
					lon,
					days
				);

				if (forecastData) {
					const normalizedData = this.normalizeForecastData(
						forecastData,
						provider
					);
					this.cache.set(cacheKey, normalizedData);
					return normalizedData;
				}
			} catch (error) {
				console.warn(`Forecast provider ${provider} failed:`, error.message);
				continue;
			}
		}

		// Fallback to mock data if all providers fail
		console.log("All forecast providers failed, returning mock forecast data");
		const mockData = this.generateMockForecastData(lat, lon, days);
		this.cache.set(cacheKey, mockData);
		return mockData;
	}

	/**
	 * Enhanced FlahaCalc API integration for ET₀ data
	 * @param {number} lat - Latitude
	 * @param {number} lon - Longitude
	 * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to today)
	 * @returns {Object} FlahaCalc ET₀ data
	 */
	async getFlahaCalcET0(lat, lon, date = null) {
		const targetDate = date || new Date().toISOString().split("T")[0];
		const cacheKey = `flahacalc_et0_${lat}_${lon}_${targetDate}`;
		const cached = this.cache.get(cacheKey);

		if (cached) {
			console.log("Returning cached FlahaCalc ET₀ data");
			return cached;
		}

		try {
			const response = await this.makeRequestWithRetry(
				`${this.apis.flahacalc.baseUrl}/et0`,
				{
					params: {
						lat,
						lon,
						date: targetDate,
					},
					headers: this.apis.flahacalc.apiKey
						? {
								Authorization: `Bearer ${this.apis.flahacalc.apiKey}`,
						  }
						: {},
				}
			);

			const et0Data = {
				et0: response.data.et0_penman_monteith || response.data.et0,
				temperature: response.data.temperature_avg || response.data.temperature,
				humidity: response.data.relative_humidity || response.data.humidity,
				windSpeed: response.data.wind_speed || response.data.wind,
				solarRadiation:
					response.data.solar_radiation || response.data.radiation,
				atmosphericPressure:
					response.data.atmospheric_pressure || response.data.pressure,
				elevation: response.data.elevation,
				latitude: lat,
				longitude: lon,
				date: targetDate,
				location: response.data.location || `${lat},${lon}`,
				dataSource: "FlahaCalc API",
				calculationMethod: "Penman-Monteith FAO-56",
			};

			// Cache for 6 hours (ET₀ data is more stable)
			this.cache.set(cacheKey, et0Data, 21600);
			return et0Data;
		} catch (error) {
			console.error("FlahaCalc API error:", error.message);

			// Fallback to estimated ET₀ calculation
			const fallbackET0 = await this.calculateFallbackET0(lat, lon, targetDate);
			return {
				...fallbackET0,
				dataSource: "Fallback Calculation",
				note: "FlahaCalc API unavailable - using fallback calculation",
			};
		}
	}

	/**
	 * Fetch weather data from specific provider
	 * @private
	 */
	async fetchWeatherFromProvider(provider, lat, lon) {
		switch (provider) {
			case "openweather":
				return await this.fetchOpenWeatherCurrent(lat, lon);
			case "noaa":
				return await this.fetchNOAACurrent(lat, lon);
			default:
				throw new Error(`Unknown weather provider: ${provider}`);
		}
	}

	/**
	 * Fetch forecast data from specific provider
	 * @private
	 */
	async fetchForecastFromProvider(provider, lat, lon, days) {
		switch (provider) {
			case "openweather":
				return await this.fetchOpenWeatherForecast(lat, lon, days);
			case "noaa":
				return await this.fetchNOAAForecast(lat, lon, days);
			default:
				throw new Error(`Unknown forecast provider: ${provider}`);
		}
	}

	/**
	 * OpenWeatherMap current weather
	 * @private
	 */
	async fetchOpenWeatherCurrent(lat, lon) {
		if (!this.apis.openweather.enabled) {
			throw new Error("OpenWeatherMap API not configured");
		}

		const response = await this.makeRequestWithRetry(
			`${this.apis.openweather.baseUrl}/weather`,
			{
				params: {
					lat,
					lon,
					appid: this.apis.openweather.apiKey,
					units: "metric",
				},
			}
		);

		return response.data;
	}

	/**
	 * OpenWeatherMap forecast
	 * @private
	 */
	async fetchOpenWeatherForecast(lat, lon, days) {
		if (!this.apis.openweather.enabled) {
			throw new Error("OpenWeatherMap API not configured");
		}

		const response = await this.makeRequestWithRetry(
			`${this.apis.openweather.baseUrl}/forecast`,
			{
				params: {
					lat,
					lon,
					appid: this.apis.openweather.apiKey,
					units: "metric",
					cnt: Math.min(days * 8, 40), // 3-hour intervals, max 5 days
				},
			}
		);

		return response.data;
	}

	/**
	 * NOAA current weather (simplified implementation)
	 * @private
	 */
	async fetchNOAACurrent(lat, lon) {
		// NOAA requires grid point lookup first
		const gridResponse = await this.makeRequestWithRetry(
			`${this.apis.noaa.baseUrl}/points/${lat},${lon}`
		);

		const gridData = gridResponse.data.properties;
		const forecastUrl = gridData.forecast;

		const weatherResponse = await this.makeRequestWithRetry(forecastUrl);

		// Return current period (first forecast period)
		return weatherResponse.data.properties.periods[0];
	}

	/**
	 * NOAA forecast
	 * @private
	 */
	async fetchNOAAForecast(lat, lon, days) {
		const gridResponse = await this.makeRequestWithRetry(
			`${this.apis.noaa.baseUrl}/points/${lat},${lon}`
		);

		const gridData = gridResponse.data.properties;
		const forecastUrl = gridData.forecast;

		const forecastResponse = await this.makeRequestWithRetry(forecastUrl);

		return {
			periods: forecastResponse.data.properties.periods.slice(0, days * 2), // Day/night periods
		};
	}

	/**
	 * Get provider order based on preference and availability
	 * @private
	 */
	getProviderOrder(preferredProvider) {
		const availableProviders = Object.keys(this.apis).filter(
			(provider) => this.apis[provider].enabled && provider !== "flahacalc"
		);

		if (availableProviders.includes(preferredProvider)) {
			return [
				preferredProvider,
				...availableProviders.filter((p) => p !== preferredProvider),
			];
		}

		return availableProviders;
	}

	/**
	 * Make HTTP request with retry logic
	 * @private
	 */
	async makeRequestWithRetry(url, config = {}, retryCount = 0) {
		try {
			const response = await axios({
				url,
				timeout: 10000, // 10 second timeout
				...config,
			});
			return response;
		} catch (error) {
			if (retryCount < this.retryConfig.maxRetries) {
				const delay =
					this.retryConfig.retryDelay *
					Math.pow(this.retryConfig.backoffMultiplier, retryCount);
				console.log(
					`Request failed, retrying in ${delay}ms... (attempt ${
						retryCount + 1
					}/${this.retryConfig.maxRetries})`
				);

				await new Promise((resolve) => setTimeout(resolve, delay));
				return this.makeRequestWithRetry(url, config, retryCount + 1);
			}
			throw error;
		}
	}

	/**
	 * Normalize weather data from different providers
	 * @private
	 */
	normalizeWeatherData(data, provider) {
		switch (provider) {
			case "openweather":
				return {
					temperature: data.main.temp,
					humidity: data.main.humidity,
					pressure: data.main.pressure,
					windSpeed: data.wind?.speed || 0,
					windDirection: data.wind?.deg || 0,
					cloudCover: data.clouds?.all || 0,
					visibility: data.visibility || 10000,
					description: data.weather[0]?.description || "",
					icon: data.weather[0]?.icon || "",
					timestamp: new Date(data.dt * 1000).toISOString(),
					location: data.name || `${data.coord.lat},${data.coord.lon}`,
					provider: "OpenWeatherMap",
				};
			case "noaa":
				return {
					temperature: this.parseNOAATemperature(data.temperature),
					humidity: data.relativeHumidity?.value || null,
					pressure: null, // Not always available in NOAA
					windSpeed: this.parseNOAAWind(data.windSpeed),
					windDirection: this.parseNOAAWind(data.windDirection),
					cloudCover: null,
					visibility: null,
					description: data.shortForecast || "",
					icon: data.icon || "",
					timestamp: data.startTime,
					location: data.name || "NOAA Location",
					provider: "NOAA",
				};
			default:
				return data;
		}
	}

	/**
	 * Normalize forecast data from different providers
	 * @private
	 */
	normalizeForecastData(data, provider) {
		switch (provider) {
			case "openweather":
				return {
					daily: data.list.map((item) => ({
						date: new Date(item.dt * 1000).toISOString().split("T")[0],
						temperature: {
							min: item.main.temp_min,
							max: item.main.temp_max,
							avg: item.main.temp,
						},
						humidity: item.main.humidity,
						pressure: item.main.pressure,
						windSpeed: item.wind?.speed || 0,
						cloudCover: item.clouds?.all || 0,
						precipitation: item.rain?.["3h"] || item.snow?.["3h"] || 0,
						description: item.weather[0]?.description || "",
						provider: "OpenWeatherMap",
					})),
					provider: "OpenWeatherMap",
				};
			case "noaa":
				return {
					daily: data.periods.map((period) => ({
						date: new Date(period.startTime).toISOString().split("T")[0],
						temperature: {
							min: null,
							max: null,
							avg: this.parseNOAATemperature(period.temperature),
						},
						humidity: period.relativeHumidity?.value || null,
						pressure: null,
						windSpeed: this.parseNOAAWind(period.windSpeed),
						cloudCover: null,
						precipitation: null,
						description: period.shortForecast || "",
						provider: "NOAA",
					})),
					provider: "NOAA",
				};
			default:
				return data;
		}
	}

	/**
	 * Calculate fallback ET₀ when FlahaCalc is unavailable
	 * @private
	 */
	async calculateFallbackET0(lat, lon, date) {
		try {
			// Get current weather for basic ET₀ estimation
			const weather = await this.getCurrentWeather(lat, lon);

			// Simplified Penman-Monteith estimation
			const temperature = weather.temperature || 25; // °C
			const humidity = weather.humidity || 50; // %
			const windSpeed = weather.windSpeed || 2; // m/s

			// Basic ET₀ estimation (simplified formula)
			const et0 = this.estimateET0Simple(
				temperature,
				humidity,
				windSpeed,
				lat,
				date
			);

			return {
				et0: Math.round(et0 * 100) / 100,
				temperature,
				humidity,
				windSpeed,
				solarRadiation: null,
				atmosphericPressure: weather.pressure || null,
				elevation: null,
				latitude: lat,
				longitude: lon,
				date,
				location: weather.location || `${lat},${lon}`,
				calculationMethod: "Simplified Penman-Monteith",
			};
		} catch (error) {
			console.error("Fallback ET₀ calculation failed:", error.message);

			// Ultimate fallback - use regional averages
			return {
				et0: this.getRegionalET0Average(lat, lon, date),
				temperature: null,
				humidity: null,
				windSpeed: null,
				solarRadiation: null,
				atmosphericPressure: null,
				elevation: null,
				latitude: lat,
				longitude: lon,
				date,
				location: `${lat},${lon}`,
				calculationMethod: "Regional Average",
				note: "All weather sources failed - using regional average",
			};
		}
	}

	/**
	 * Helper methods for data parsing
	 * @private
	 */
	parseNOAATemperature(tempString) {
		if (!tempString) return null;
		const match = tempString.match(/(\d+)/);
		return match ? parseInt(match[1]) : null;
	}

	parseNOAAWind(windString) {
		if (!windString) return null;
		const match = windString.match(/(\d+)/);
		return match ? parseInt(match[1]) : null;
	}

	estimateET0Simple(temp, humidity, windSpeed, lat, date) {
		// Very simplified ET₀ estimation for fallback
		const baseET0 =
			0.0023 *
			(temp + 17.8) *
			Math.sqrt(Math.abs(temp - humidity)) *
			(windSpeed + 1);

		// Seasonal adjustment based on latitude and date
		const dayOfYear = new Date(date).getDayOfYear();
		const seasonalFactor =
			1 + 0.3 * Math.sin(((dayOfYear - 81) * 2 * Math.PI) / 365);

		return Math.max(1, baseET0 * seasonalFactor);
	}

	getRegionalET0Average(lat, lon, date) {
		// Regional ET₀ averages based on climate zones
		const month = new Date(date).getMonth() + 1;

		// GCC/MENA region detection
		if (lat >= 15 && lat <= 35 && lon >= 35 && lon <= 60) {
			// Gulf region - higher ET₀, very hot and dry
			const gccET0 = [6, 7, 8, 10, 12, 14, 15, 14, 12, 10, 8, 6];
			return gccET0[month - 1];
		} else if (lat >= 25 && lat <= 45 && lon >= -10 && lon <= 40) {
			// Mediterranean region - moderate ET₀
			const medET0 = [2, 3, 4, 6, 8, 10, 11, 10, 8, 6, 4, 3];
			return medET0[month - 1];
		} else {
			// Temperate default - lower ET₀
			const tempET0 = [1, 2, 3, 4, 6, 7, 8, 7, 6, 4, 3, 2];
			return tempET0[month - 1];
		}
	}

	/**
	 * Generate mock weather data for testing/fallback
	 * @private
	 */
	generateMockWeatherData(lat, lon) {
		// Generate realistic weather data based on location and season
		const month = new Date().getMonth() + 1;
		const isGCC = lat >= 15 && lat <= 35 && lon >= 35 && lon <= 60;
		const isMediterranean = lat >= 25 && lat <= 45 && lon >= -10 && lon <= 40;

		let baseTemp, baseHumidity, baseWindSpeed;

		if (isGCC) {
			// Gulf region - hot and dry
			baseTemp =
				month >= 5 && month <= 9
					? 35 + Math.random() * 10
					: 20 + Math.random() * 15;
			baseHumidity = 30 + Math.random() * 40;
			baseWindSpeed = 2 + Math.random() * 6;
		} else if (isMediterranean) {
			// Mediterranean - moderate
			baseTemp =
				month >= 6 && month <= 8
					? 25 + Math.random() * 10
					: 15 + Math.random() * 15;
			baseHumidity = 40 + Math.random() * 40;
			baseWindSpeed = 1 + Math.random() * 5;
		} else {
			// Temperate default
			baseTemp =
				month >= 6 && month <= 8
					? 20 + Math.random() * 15
					: 5 + Math.random() * 20;
			baseHumidity = 50 + Math.random() * 30;
			baseWindSpeed = 1 + Math.random() * 4;
		}

		return {
			temperature: Math.round(baseTemp * 10) / 10,
			humidity: Math.round(baseHumidity),
			pressure: 1013 + Math.random() * 20 - 10,
			windSpeed: Math.round(baseWindSpeed * 10) / 10,
			windDirection: Math.round(Math.random() * 360),
			cloudCover: Math.round(Math.random() * 100),
			visibility: 10000,
			description: "Mock weather data",
			icon: "01d",
			timestamp: new Date().toISOString(),
			location: `${lat},${lon}`,
			provider: "Mock Provider",
			note: "Generated mock data - configure weather APIs for real data",
		};
	}

	/**
	 * Generate mock forecast data
	 * @private
	 */
	generateMockForecastData(lat, lon, days) {
		const daily = [];
		const baseWeather = this.generateMockWeatherData(lat, lon);

		for (let i = 0; i < days; i++) {
			const date = new Date();
			date.setDate(date.getDate() + i);

			// Add some variation to the base weather
			const tempVariation = (Math.random() - 0.5) * 10;
			const humidityVariation = (Math.random() - 0.5) * 20;

			daily.push({
				date: date.toISOString().split("T")[0],
				temperature: {
					min:
						Math.round((baseWeather.temperature - 5 + tempVariation) * 10) / 10,
					max:
						Math.round((baseWeather.temperature + 5 + tempVariation) * 10) / 10,
					avg: Math.round((baseWeather.temperature + tempVariation) * 10) / 10,
				},
				humidity: Math.max(
					0,
					Math.min(100, Math.round(baseWeather.humidity + humidityVariation))
				),
				pressure: baseWeather.pressure + (Math.random() - 0.5) * 10,
				windSpeed: Math.max(
					0,
					baseWeather.windSpeed + (Math.random() - 0.5) * 2
				),
				cloudCover: Math.round(Math.random() * 100),
				precipitation: Math.random() < 0.3 ? Math.random() * 10 : 0, // 30% chance of rain
				description: "Mock forecast data",
				provider: "Mock Provider",
			});
		}

		return {
			daily,
			provider: "Mock Provider",
			note: "Generated mock forecast - configure weather APIs for real data",
		};
	}

	/**
	 * Clear cache (useful for testing or manual refresh)
	 */
	clearCache() {
		this.cache.flushAll();
		console.log("Weather service cache cleared");
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats() {
		return {
			keys: this.cache.keys().length,
			hits: this.cache.getStats().hits,
			misses: this.cache.getStats().misses,
		};
	}
}

// Add getDayOfYear method to Date prototype if not exists
if (!Date.prototype.getDayOfYear) {
	Date.prototype.getDayOfYear = function () {
		const start = new Date(this.getFullYear(), 0, 0);
		const diff = this - start;
		const oneDay = 1000 * 60 * 60 * 24;
		return Math.floor(diff / oneDay);
	};
}

module.exports = WeatherService;
