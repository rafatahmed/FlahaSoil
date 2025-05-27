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
		this.userPlan = localStorage.getItem("flahasoil_user_plan") || "FREE";
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
		return (
			this.usageCount >= this.maxFreeUsage &&
			(!this.token || this.userPlan === "FREE")
		);
	}

	/**
	 * Increment usage counter for users
	 */
	incrementUsage() {
		if (!this.token || this.userPlan === "FREE") {
			this.usageCount++;
			localStorage.setItem("flahasoil_usage_count", this.usageCount.toString());
		}
	}

	/**
	 * Get remaining free calculations
	 */
	getRemainingFreeCalculations() {
		if (this.token && this.userPlan !== "FREE") return "Unlimited";
		return Math.max(0, this.maxFreeUsage - this.usageCount);
	}

	/**
	 * Set user authentication and plan info
	 */
	setAuth(token, userPlan = "FREE", usageCount = 0) {
		this.token = token;
		this.userPlan = userPlan;
		this.usageCount = usageCount;
		localStorage.setItem("flahasoil_token", token);
		localStorage.setItem("flahasoil_user_plan", userPlan);
		localStorage.setItem("flahasoil_usage_count", usageCount.toString());
	}

	/**
	 * Clear authentication
	 */
	clearAuth() {
		this.token = null;
		this.userPlan = "FREE";
		this.usageCount = 0;
		localStorage.removeItem("flahasoil_token");
		localStorage.removeItem("flahasoil_user_plan");
		localStorage.removeItem("flahasoil_usage_count");
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

				// Update usage count if provided in response
				if (result.usage && result.usage.current !== undefined) {
					this.usageCount = result.usage.current;
					localStorage.setItem(
						"flahasoil_usage_count",
						this.usageCount.toString()
					);
				} else {
					this.incrementUsage();
				}

				return result;
			} else {
				const errorData = await response.json().catch(() => ({}));

				// Handle plan-based restrictions
				if (response.status === 403 && errorData.upgradeRequired) {
					return {
						success: false,
						error: errorData.error,
						upgradeRequired: true,
						requiredPlan: errorData.requiredPlan,
						currentPlan: errorData.currentPlan,
					};
				}

				// Handle usage limits
				if (response.status === 429) {
					return {
						success: false,
						error: errorData.error || "Usage limit exceeded",
						usageLimitReached: true,
						resetDate: errorData.resetDate,
					};
				}

				return {
					success: false,
					error:
						errorData.error ||
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
	 * Advanced soil analysis for Professional+ users
	 * @param {Object} soilData - Enhanced soil data
	 * @returns {Promise<Object>} Advanced analysis results
	 */
	async analyzeSoilAdvanced(soilData) {
		try {
			if (!this.isOnline) {
				return {
					success: false,
					error: "Internet connection required for advanced analysis.",
					requiresConnection: true,
				};
			}

			if (!this.token) {
				return {
					success: false,
					error: "Authentication required for advanced analysis.",
					upgradeRequired: true,
					requiredPlan: "PROFESSIONAL",
				};
			}

			const response = await fetch(`${this.baseURL}/soil/analyze-advanced`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.token}`,
				},
				body: JSON.stringify(soilData),
			});

			if (response.ok) {
				const result = await response.json();
				return result;
			} else {
				const errorData = await response.json().catch(() => ({}));

				if (response.status === 403 && errorData.upgradeRequired) {
					return {
						success: false,
						error: errorData.error,
						upgradeRequired: true,
						requiredPlan: errorData.requiredPlan,
						currentPlan: errorData.currentPlan,
					};
				}

				return {
					success: false,
					error: errorData.error || "Advanced analysis failed",
					status: response.status,
				};
			}
		} catch (error) {
			console.error("Advanced analysis failed:", error);
			return {
				success: false,
				error: "Failed to connect to FlahaSoil servers.",
				networkError: true,
			};
		}
	}

	/**
	 * Batch soil analysis for Professional+ users
	 * @param {Array} soilDataArray - Array of soil data objects
	 * @returns {Promise<Object>} Batch analysis results
	 */
	async analyzeBatch(soilDataArray) {
		try {
			if (!this.isOnline) {
				return {
					success: false,
					error: "Internet connection required for batch analysis.",
					requiresConnection: true,
				};
			}

			if (!this.token) {
				return {
					success: false,
					error: "Authentication required for batch analysis.",
					upgradeRequired: true,
					requiredPlan: "PROFESSIONAL",
				};
			}

			const response = await fetch(`${this.baseURL}/soil/batch-analyze`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.token}`,
				},
				body: JSON.stringify({ analyses: soilDataArray }),
			});

			if (response.ok) {
				return await response.json();
			} else {
				const errorData = await response.json().catch(() => ({}));

				if (response.status === 403 && errorData.upgradeRequired) {
					return {
						success: false,
						error: errorData.error,
						upgradeRequired: true,
						requiredPlan: errorData.requiredPlan,
						currentPlan: errorData.currentPlan,
					};
				}

				return {
					success: false,
					error: errorData.error || "Batch analysis failed",
					status: response.status,
				};
			}
		} catch (error) {
			console.error("Batch analysis failed:", error);
			return {
				success: false,
				error: "Failed to connect to FlahaSoil servers.",
				networkError: true,
			};
		}
	}

	/**
	 * Get analysis history for Professional+ users
	 * @param {number} page - Page number for pagination
	 * @param {number} limit - Number of items per page
	 * @returns {Promise<Object>} Analysis history
	 */
	async getAnalysisHistory(page = 1, limit = 10) {
		try {
			if (!this.isOnline) {
				return {
					success: false,
					error: "Internet connection required.",
					requiresConnection: true,
				};
			}

			if (!this.token) {
				return {
					success: false,
					error: "Authentication required.",
					upgradeRequired: true,
					requiredPlan: "PROFESSIONAL",
				};
			}

			const response = await fetch(
				`${this.baseURL}/soil/history?page=${page}&limit=${limit}`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${this.token}`,
					},
				}
			);

			if (response.ok) {
				return await response.json();
			} else {
				const errorData = await response.json().catch(() => ({}));

				if (response.status === 403 && errorData.upgradeRequired) {
					return {
						success: false,
						error: errorData.error,
						upgradeRequired: true,
						requiredPlan: errorData.requiredPlan,
						currentPlan: errorData.currentPlan,
					};
				}

				return {
					success: false,
					error: errorData.error || "Failed to get history",
					status: response.status,
				};
			}
		} catch (error) {
			console.error("Get history failed:", error);
			return {
				success: false,
				error: "Failed to connect to FlahaSoil servers.",
				networkError: true,
			};
		}
	}

	/**
	 * Export analysis data for Professional+ users
	 * @param {string} analysisId - Analysis ID to export
	 * @param {string} format - Export format (csv, json)
	 * @returns {Promise<Object>} Export result
	 */
	async exportAnalysis(analysisId, format = "csv") {
		try {
			if (!this.isOnline) {
				return {
					success: false,
					error: "Internet connection required.",
					requiresConnection: true,
				};
			}

			if (!this.token) {
				return {
					success: false,
					error: "Authentication required.",
					upgradeRequired: true,
					requiredPlan: "PROFESSIONAL",
				};
			}

			const response = await fetch(
				`${this.baseURL}/soil/export/${analysisId}?format=${format}`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${this.token}`,
					},
				}
			);

			if (response.ok) {
				const result = await response.json();
				return result;
			} else {
				const errorData = await response.json().catch(() => ({}));

				if (response.status === 403 && errorData.upgradeRequired) {
					return {
						success: false,
						error: errorData.error,
						upgradeRequired: true,
						requiredPlan: errorData.requiredPlan,
						currentPlan: errorData.currentPlan,
					};
				}

				return {
					success: false,
					error: errorData.error || "Export failed",
					status: response.status,
				};
			}
		} catch (error) {
			console.error("Export failed:", error);
			return {
				success: false,
				error: "Failed to connect to FlahaSoil servers.",
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
					error: "Internet connection required for crop recommendations.",
					requiresConnection: true,
				};
			}

			const response = await fetch(`${this.baseURL}/crop/recommendations`, {
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
					error: errorData.error || "Failed to get crop recommendations",
					status: response.status,
				};
			}
		} catch (error) {
			console.error("Get crop recommendations failed:", error);
			return {
				success: false,
				error: "Failed to connect to FlahaSoil servers.",
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
				// Store authentication and plan information
				this.setAuth(result.token, result.user.tier, result.user.usageCount);

				// Store user data
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

			const result = await response.json();

			if (result.success) {
				// Store authentication and plan information
				this.setAuth(result.token, result.user.tier, result.user.usageCount);

				// Store user data
				localStorage.setItem("flahasoil_user", JSON.stringify(result.user));
			}

			return result;
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
		this.clearAuth();
		localStorage.removeItem("flahasoil_user");
	}

	/**
	 * Forgot password
	 * @param {string} email - User email
	 * @returns {Promise<Object>} Result
	 */
	async forgotPassword(email) {
		try {
			const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});

			return await response.json();
		} catch (error) {
			console.error("Forgot password failed:", error);
			return { success: false, error: "Request failed. Please try again." };
		}
	}

	/**
	 * Reset password
	 * @param {string} token - Reset token
	 * @param {string} newPassword - New password
	 * @returns {Promise<Object>} Result
	 */
	async resetPassword(token, newPassword) {
		try {
			const response = await fetch(`${this.baseURL}/auth/reset-password`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token, newPassword }),
			});

			return await response.json();
		} catch (error) {
			console.error("Reset password failed:", error);
			return { success: false, error: "Reset failed. Please try again." };
		}
	}

	/**
	 * Change password for authenticated users
	 * @param {string} currentPassword - Current password
	 * @param {string} newPassword - New password
	 * @returns {Promise<Object>} Result
	 */
	async changePassword(currentPassword, newPassword) {
		try {
			if (!this.token) {
				return { success: false, error: "Authentication required" };
			}

			const response = await fetch(`${this.baseURL}/auth/change-password`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.token}`,
				},
				body: JSON.stringify({ currentPassword, newPassword }),
			});

			return await response.json();
		} catch (error) {
			console.error("Change password failed:", error);
			return {
				success: false,
				error: "Password change failed. Please try again.",
			};
		}
	}

	/**
	 * Get user profile
	 * @returns {Promise<Object>} Profile data
	 */
	async getProfile() {
		try {
			if (!this.token) {
				return { success: false, error: "Authentication required" };
			}

			const response = await fetch(`${this.baseURL}/auth/profile`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.token}`,
				},
			});

			const result = await response.json();

			if (result.success) {
				// Update local usage count if provided
				if (result.user.usageCount !== undefined) {
					this.usageCount = result.user.usageCount;
					localStorage.setItem(
						"flahasoil_usage_count",
						this.usageCount.toString()
					);
				}
			}

			return result;
		} catch (error) {
			console.error("Get profile failed:", error);
			return {
				success: false,
				error: "Failed to get profile. Please try again.",
			};
		}
	}

	/**
	 * Upgrade user plan
	 * @param {string} newPlan - New plan tier
	 * @returns {Promise<Object>} Result
	 */
	async upgradePlan(newPlan) {
		try {
			if (!this.token) {
				return { success: false, error: "Authentication required" };
			}

			const response = await fetch(`${this.baseURL}/auth/upgrade-plan`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.token}`,
				},
				body: JSON.stringify({ newPlan }),
			});

			const result = await response.json();

			if (result.success) {
				// Update local plan information
				this.userPlan = result.user.tier;
				localStorage.setItem("flahasoil_user_plan", this.userPlan);
				localStorage.setItem("flahasoil_user", JSON.stringify(result.user));
			}

			return result;
		} catch (error) {
			console.error("Plan upgrade failed:", error);
			return {
				success: false,
				error: "Plan upgrade failed. Please try again.",
			};
		}
	}
}
