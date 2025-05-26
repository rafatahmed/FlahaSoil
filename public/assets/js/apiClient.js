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
			// Require API connection - no client-side fallback
			if (!this.isOnline) {
				return {
					success: false,
					error:
						"Internet connection required for soil analysis. Please check your connection and try again.",
					requiresConnection: true,
				};
			}

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
			} else {
				const errorData = await response.json().catch(() => ({}));
				return {
					success: false,
					error:
						errorData.message ||
						"Server error occurred. Please try again later.",
					status: response.status,
				};
			}
		} catch (error) {
			console.error("API call failed:", error);
			return {
				success: false,
				error:
					"Failed to connect to FlahaSoil servers. Please check your internet connection and try again.",
				networkError: true,
			};
		}
	}

	/**
	 * Get crop recommendations
	 * @param {Object} soilData - Soil data including textureClass, paw, om
	 * @returns {Promise<Object>} Crop recommendations
	 */
	async getCropRecommendations(soilData) {
		try {
			if (!this.isOnline) {
				return {
					success: false,
					error:
						"Internet connection required for crop recommendations. Please check your connection and try again.",
					requiresConnection: true,
				};
			}

			const response = await fetch(`${this.baseURL}/soil/recommendations`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.token ? `Bearer ${this.token}` : "",
				},
				body: JSON.stringify(soilData),
			});

			if (response.ok) {
				return await response.json();
			} else {
				const errorData = await response.json().catch(() => ({}));
				return {
					success: false,
					error:
						errorData.message ||
						"Failed to get crop recommendations. Please try again later.",
					status: response.status,
				};
			}
		} catch (error) {
			console.error("Crop recommendations API call failed:", error);
			return {
				success: false,
				error:
					"Failed to connect to FlahaSoil servers for crop recommendations. Please check your internet connection.",
				networkError: true,
			};
		}
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
