/**
 * FlahaSoil API Client
 * Handles communication with the backend API
 *
 * @format
 */

class FlahaSoilAPI {
	constructor() {
		this.baseURL = "http://localhost:3001/api/v1";
		this.token = localStorage.getItem("flahasoil_token");
		this.isOnline = navigator.onLine;
		this.usageCount = parseInt(
			localStorage.getItem("flahasoil_usage_count") || "0"
		);
		this.maxFreeUsage = 50;

		// Listen for online/offline events
		window.addEventListener("online", () => (this.isOnline = true));
		window.addEventListener("offline", () => (this.isOnline = false));
	}

	/**
	 * Check if user has exceeded free usage limit
	 */
	hasExceededFreeLimit() {
		return this.usageCount >= this.maxFreeUsage && !this.token;
	}

	/**
	 * Increment usage counter for free users
	 */
	incrementUsage() {
		if (!this.token) {
			this.usageCount++;
			localStorage.setItem("flahasoil_usage_count", this.usageCount.toString());
		}
	}

	/**
	 * Get remaining free calculations
	 */
	getRemainingFreeCalculations() {
		if (this.token) return "Unlimited";
		return Math.max(0, this.maxFreeUsage - this.usageCount);
	}

	/**
	 * Analyze soil composition
	 * @param {Object} soilData - Soil data including sand, clay, organicMatter, densityFactor
	 * @returns {Promise<Object>} Analysis results
	 */
	async analyzeSoil(soilData) {
		// Check free usage limit
		if (this.hasExceededFreeLimit()) {
			return {
				success: false,
				error:
					"Free usage limit exceeded. Please sign up for unlimited calculations.",
				showUpgrade: true,
			};
		}

		try {
			// Try API first if online
			if (this.isOnline) {
				const response = await fetch(`${this.baseURL}/soil/analyze`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: this.token ? `Bearer ${this.token}` : "",
					},
					body: JSON.stringify(soilData),
				});

				if (response.ok) {
					const result = await response.json();
					this.incrementUsage();
					return result;
				}

				// If API fails, fall back to client-side
				console.warn(
					"API unavailable, falling back to client-side calculation"
				);
			}

			// Fallback to client-side calculation
			const result = this.fallbackCalculation(soilData);
			this.incrementUsage();
			return result;
		} catch (error) {
			console.error("API call failed:", error);
			// Fallback to client-side calculation for demo/offline use
			const result = this.fallbackCalculation(soilData);
			this.incrementUsage();
			return result;
		}
	}

	/**
	 * Get crop recommendations
	 * @param {Object} soilData - Soil data including textureClass, paw, om
	 * @returns {Promise<Object>} Crop recommendations
	 */
	async getCropRecommendations(soilData) {
		try {
			const response = await fetch(`${this.baseURL}/soil/recommendations`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.token ? `Bearer ${this.token}` : "",
				},
				body: JSON.stringify(soilData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `API Error: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error("Crop recommendations API call failed:", error);
			return this.fallbackRecommendations(soilData);
		}
	}

	/**
	 * Fallback calculation using client-side algorithms
	 * @param {Object} soilData - Soil data
	 * @returns {Object} Calculation results
	 */
	fallbackCalculation(soilData) {
		const { sand, clay, organicMatter = 2.5, densityFactor = 1.0 } = soilData;

		// Use the existing client-side calculation function
		const result = calculateSoilWaterCharacteristics(
			sand,
			clay,
			organicMatter,
			densityFactor
		);

		return {
			success: true,
			data: result,
			tier: this.token ? "premium" : "free",
			source: "client-side",
			message: this.token
				? null
				: `${this.getRemainingFreeCalculations()} free calculations remaining`,
		};
	}

	/**
	 * Fallback crop recommendations
	 * @param {Object} soilData - Soil data
	 * @returns {Object} Recommendations
	 */
	fallbackRecommendations(soilData) {
		const { textureClass } = soilData;
		const texture = textureClass.toLowerCase();

		let recommendations = {
			suitableCrops: [],
			limitations: [],
			managementTips: [],
		};

		if (texture.includes("sand") && !texture.includes("clay")) {
			recommendations.suitableCrops = [
				"Carrots",
				"Potatoes",
				"Radishes",
				"Peanuts",
			];
			recommendations.limitations = [
				"Low water retention",
				"Low nutrient holding capacity",
			];
			recommendations.managementTips = [
				"Frequent irrigation",
				"Regular organic matter addition",
			];
		} else if (texture.includes("clay")) {
			recommendations.suitableCrops = ["Rice", "Wheat", "Cabbage", "Broccoli"];
			recommendations.limitations = ["Poor drainage", "Slow warming in spring"];
			recommendations.managementTips = [
				"Avoid working when wet",
				"Add organic matter to improve structure",
			];
		} else if (texture.includes("silt") || texture === "loam") {
			recommendations.suitableCrops = [
				"Corn",
				"Soybeans",
				"Most vegetables",
				"Small grains",
			];
			recommendations.limitations = ["Possible crusting", "Moderate drainage"];
			recommendations.managementTips = [
				"Maintain organic matter",
				"Use cover crops",
			];
		}

		return {
			success: true,
			data: recommendations,
			source: "client-side",
		};
	}

	/**
	 * User authentication
	 * @param {string} email - User email
	 * @param {string} password - User password
	 * @returns {Promise<Object>} Authentication result
	 */
	async login(email, password) {
		try {
			const response = await fetch(`${this.baseURL}/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			const result = await response.json();

			if (result.success) {
				this.token = result.token;
				localStorage.setItem("flahasoil_token", this.token);
				localStorage.setItem("flahasoil_user", JSON.stringify(result.user));
			}

			return result;
		} catch (error) {
			console.error("Login failed:", error);
			return { success: false, error: "Login failed. Please try again." };
		}
	}

	/**
	 * User registration
	 * @param {Object} userData - User registration data
	 * @returns {Promise<Object>} Registration result
	 */
	async register(userData) {
		try {
			const response = await fetch(`${this.baseURL}/auth/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(userData),
			});

			return await response.json();
		} catch (error) {
			console.error("Registration failed:", error);
			return {
				success: false,
				error: "Registration failed. Please try again.",
			};
		}
	}

	/**
	 * Logout user
	 */
	logout() {
		this.token = null;
		localStorage.removeItem("flahasoil_token");
		localStorage.removeItem("flahasoil_user");
	}

	/**
	 * Check if user is authenticated
	 */
	isAuthenticated() {
		return !!this.token;
	}

	/**
	 * Get current user info
	 */
	getCurrentUser() {
		const userStr = localStorage.getItem("flahasoil_user");
		return userStr ? JSON.parse(userStr) : null;
	}
}

// Create global API client instance
window.flahaSoilAPI = new FlahaSoilAPI();
