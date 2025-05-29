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

			// Use demo endpoint for unauthenticated users
			const endpoint = this.token ? "/soil/analyze" : "/soil/demo/analyze";
			const headers = {
				"Content-Type": "application/json",
			};

			// Only add Authorization header if token exists
			if (this.token) {
				headers.Authorization = `Bearer ${this.token}`;
			}

			const response = await fetch(`${this.baseURL}${endpoint}`, {
				method: "POST",
				headers: headers,
				body: JSON.stringify(soilData),
			});

			if (response.ok) {
				const result = await response.json();

				// Only update usage count for authenticated users, not demo mode
				if (this.token && result.usage && result.usage.current !== undefined) {
					this.usageCount = result.usage.current;
					localStorage.setItem(
						"flahasoil_usage_count",
						this.usageCount.toString()
					);
				} else if (this.token && !result.demo) {
					// Only increment usage for authenticated non-demo calls
					this.incrementUsage();
				}
				// Demo mode: no usage tracking at all

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
			/* eslint-disable */ console.error(
				...oo_tx(`3971099883_169_3_169_43_11`, "API call failed:", error)
			);
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

			const response = await fetch(`${this.baseURL}/soil/analyze/advanced`, {
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
			/* eslint-disable */ console.error(
				...oo_tx(
					`3971099883_235_3_235_52_11`,
					"Advanced analysis failed:",
					error
				)
			);
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

			const response = await fetch(`${this.baseURL}/soil/analyze/batch`, {
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
			/* eslint-disable */ console.error(
				...oo_tx(`3971099883_299_3_299_49_11`, "Batch analysis failed:", error)
			);
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
			/* eslint-disable */ console.error(
				...oo_tx(`3971099883_365_3_365_46_11`, "Get history failed:", error)
			);
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

			const response = await fetch(`${this.baseURL}/soil/export/${format}`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.token}`,
				},
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
					error: errorData.error || "Export failed",
					status: response.status,
				};
			}
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(`3971099883_432_3_432_41_11`, "Export failed:", error)
			);
			return {
				success: false,
				error: "Failed to connect to FlahaSoil servers.",
				networkError: true,
			};
		}
	}

	/**
	 * Get visualization data for charts and graphs
	 * @param {string} analysisId - Analysis ID
	 * @param {string} type - Visualization type (moisture-tension, conductivity, etc.)
	 * @returns {Promise<Object>} Visualization data
	 */
	async getVisualizationData(analysisId, type) {
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
				`${this.baseURL}/soil/moisture-tension/${analysisId}`,
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
				return {
					success: false,
					error: errorData.error || "Failed to get visualization data",
					status: response.status,
				};
			}
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(
					`3971099883_487_3_487_57_11`,
					"Get visualization data failed:",
					error
				)
			);
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

			const response = await fetch(
				`${this.baseURL}/api/v1/soil/recommendations`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: this.token ? `Bearer ${this.token}` : "",
					},
					body: JSON.stringify(soilData),
				}
			);

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
			/* eslint-disable */ console.error(
				...oo_tx(
					`3971099883_531_3_531_59_11`,
					"Get crop recommendations failed:",
					error
				)
			);
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
			if (!this.isOnline) {
				return {
					success: false,
					error: "Internet connection required for authentication.",
					requiresConnection: true,
				};
			}

			const response = await fetch(`${this.baseURL}/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					this.setAuth(
						result.token,
						result.user.tier,
						result.user.usageCount || 0
					);
				}
				return result;
			} else {
				const errorData = await response.json().catch(() => ({}));
				return {
					success: false,
					error: errorData.error || "Authentication failed",
					status: response.status,
				};
			}
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(`3971099883_579_3_579_40_11`, "Login failed:", error)
			);
			return {
				success: false,
				error: "Failed to connect to FlahaSoil servers.",
				networkError: true,
			};
		}
	}

	/**
	/**
	 * User registration
	 * @param {string} email - User email
	 * @param {string} password - User password
	 * @param {string} name - User name
	 * @returns {Promise<Object>} Registration result
	 */
	async register(email, password, name) {
		try {
			if (!this.isOnline) {
				return {
					success: false,
					error: "Internet connection required for registration.",
					requiresConnection: true,
				};
			}

			const response = await fetch(`${this.baseURL}/auth/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password, name }),
			});

			if (response.ok) {
				return await response.json();
			} else {
				const errorData = await response.json().catch(() => ({}));
				return {
					success: false,
					error: errorData.error || "Registration failed",
					status: response.status,
				};
			}
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(`3971099883_625_3_625_47_11`, "Registration failed:", error)
			);
			return {
				success: false,
				error: "Failed to connect to FlahaSoil servers.",
				networkError: true,
			};
		}
	}

	/**
	 * User logout
	 */
	async logout() {
		try {
			// Call backend logout endpoint if token exists
			if (this.token) {
				const response = await fetch(`${this.baseURL}/auth/logout`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${this.token}`,
					},
				});

				// Don't fail if backend call fails - still clear local data
				if (response.ok) {
					/* eslint-disable */ console.log(
						...oo_oo(`3971099883_651_5_651_44_4`, "Server logout successful")
					);
				} else {
					console.warn(
						"Server logout failed, but continuing with local logout"
					);
				}
			}

			// Clear local authentication data
			this.clearAuth();

			// Clear any additional user data
			localStorage.removeItem("flahasoil_user");

			return { success: true, message: "Logout successful" };
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(`3971099883_667_3_667_40_11`, "Logout error:", error)
			);
			// Even if server call fails, clear local data
			this.clearAuth();
			localStorage.removeItem("flahasoil_user");
			return { success: true, message: "Logout successful" };
		}
	}

	/**
	 * Get user profile information
	 * @returns {Promise<Object>} User profile data
	 */
	async getUserProfile() {
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
				};
			}

			const response = await fetch(`${this.baseURL}/auth/profile`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.token}`,
				},
			});

			if (response.ok) {
				const result = await response.json();
				// Update local user data
				if (result.success && result.data) {
					localStorage.setItem("flahasoil_user", JSON.stringify(result.data));
					this.userPlan = result.data.tier || "FREE";
					localStorage.setItem("flahasoil_user_plan", this.userPlan);
				}
				return result;
			} else {
				const errorData = await response.json().catch(() => ({}));
				return {
					success: false,
					error: errorData.error || "Failed to get profile",
					status: response.status,
				};
			}
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(`3971099883_721_3_721_46_11`, "Get profile failed:", error)
			);
			return {
				success: false,
				error: "Failed to connect to FlahaSoil servers.",
				networkError: true,
			};
		}
	}

	/**
	 * Update user profile information
	 * @param {Object} profileData - Profile data to update
	 * @returns {Promise<Object>} Update result
	 */
	async updateUserProfile(profileData) {
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
				};
			}

			const response = await fetch(`${this.baseURL}/auth/profile`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.token}`,
				},
				body: JSON.stringify(profileData),
			});

			if (response.ok) {
				const result = await response.json();
				// Update local user data
				if (result.success && result.data) {
					localStorage.setItem("flahasoil_user", JSON.stringify(result.data));
				}
				return result;
			} else {
				const errorData = await response.json().catch(() => ({}));
				return {
					success: false,
					error: errorData.error || "Failed to update profile",
					status: response.status,
				};
			}
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(`3971099883_777_3_777_49_11`, "Update profile failed:", error)
			);
			return {
				success: false,
				error: "Failed to connect to FlahaSoil servers.",
				networkError: true,
			};
		}
	}

	/**
	 * Get user usage statistics
	 * @returns {Promise<Object>} Usage statistics
	 */
	async getUserUsageStats() {
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
				};
			}

			const response = await fetch(`${this.baseURL}/user/usage`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.token}`,
				},
			});

			if (response.ok) {
				return await response.json();
			} else {
				const errorData = await response.json().catch(() => ({}));
				return {
					success: false,
					error: errorData.error || "Failed to get usage statistics",
					status: response.status,
				};
			}
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(`3971099883_825_3_825_50_11`, "Get usage stats failed:", error)
			);
			return {
				success: false,
				error: "Failed to connect to FlahaSoil servers.",
				networkError: true,
			};
		}
	}

	/**
	 * Upgrade user plan
	 * @param {string} plan - Target plan (PROFESSIONAL, ENTERPRISE)
	 * @returns {Promise<Object>} Upgrade result
	 */
	async upgradePlan(plan) {
		try {
			if (!this.isOnline) {
				return {
					success: false,
					error: "Internet connection required for plan upgrade.",
					requiresConnection: true,
				};
			}

			if (!this.token) {
				return {
					success: false,
					error: "Authentication required for plan upgrade.",
				};
			}

			const response = await fetch(`${this.baseURL}/auth/upgrade`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.token}`,
				},
				body: JSON.stringify({ plan }),
			});

			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					this.userPlan = plan;
					localStorage.setItem("flahasoil_user_plan", plan);
				}
				return result;
			} else {
				const errorData = await response.json().catch(() => ({}));
				return {
					success: false,
					error: errorData.error || "Plan upgrade failed",
					status: response.status,
				};
			}
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(`3971099883_881_3_881_47_11`, "Plan upgrade failed:", error)
			);
			return {
				success: false,
				error: "Plan upgrade failed. Please try again.",
			};
		}
	}

	// Advanced Visualization Methods (Professional+ only)

	/**
	 * Get moisture-tension curve data for visualization
	 * @param {string} analysisId - Analysis ID
	 * @returns {Promise<Object>} Moisture-tension curve data
	 */
	async getMoistureTensionCurve(analysisId) {
		if (this.userPlan === "FREE") {
			return {
				success: false,
				error:
					"Moisture-tension curves are available for Professional+ users only.",
				showUpgrade: true,
			};
		}

		try {
			const response = await fetch(
				`${this.baseURL}/soil/moisture-tension/${analysisId}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: this.token ? `Bearer ${this.token}` : "",
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return { success: true, data };
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(
					`3971099883_925_3_925_56_11`,
					"Moisture-tension curve error:",
					error
				)
			);
			return {
				success: false,
				error: "Failed to fetch moisture-tension curve data.",
			};
		}
	}

	/**
	 * Get 3D soil profile data for visualization
	 * @param {string} analysisId - Analysis ID
	 * @returns {Promise<Object>} 3D profile data
	 */
	async getSoilProfile3D(analysisId) {
		if (this.userPlan === "FREE") {
			return {
				success: false,
				error: "3D soil profiles are available for Professional+ users only.",
				showUpgrade: true,
			};
		}

		try {
			const response = await fetch(
				`${this.baseURL}/soil/profile-3d/${analysisId}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: this.token ? `Bearer ${this.token}` : "",
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return { success: true, data };
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(`3971099883_966_3_966_44_11`, "3D profile error:", error)
			);
			return {
				success: false,
				error: "Failed to fetch 3D soil profile data.",
			};
		}
	}

	/**
	 * Compare multiple soil analyses
	 * @param {Array} analysisIds - Array of analysis IDs to compare
	 * @param {string} comparisonType - Type of comparison ('basic', 'detailed', 'statistical')
	 * @returns {Promise<Object>} Comparative analysis data
	 */
	async compareAnalyses(analysisIds, comparisonType = "basic") {
		if (this.userPlan === "FREE") {
			return {
				success: false,
				error:
					"Comparative analysis is available for Professional+ users only.",
				showUpgrade: true,
			};
		}

		try {
			const response = await fetch(`${this.baseURL}/soil/compare`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.token ? `Bearer ${this.token}` : "",
				},
				body: JSON.stringify({
					analysisIds,
					comparisonType,
					timestamp: new Date().toISOString(),
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return { success: true, data };
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(
					`3971099883_1011_3_1011_54_11`,
					"Comparative analysis error:",
					error
				)
			);
			return {
				success: false,
				error: "Failed to perform comparative analysis.",
			};
		}
	}

	/**
	 * Adjust soil parameters in real-time for visualization
	 * @param {string} analysisId - Base analysis ID
	 * @param {Object} adjustments - Parameter adjustments
	 * @returns {Promise<Object>} Updated analysis data
	 */
	async adjustParametersRealtime(analysisId, adjustments) {
		if (this.userPlan === "FREE") {
			return {
				success: false,
				error:
					"Real-time parameter adjustment is available for Professional+ users only.",
				showUpgrade: true,
			};
		}

		try {
			const response = await fetch(`${this.baseURL}/soil/adjust-realtime`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.token ? `Bearer ${this.token}` : "",
				},
				body: JSON.stringify({
					analysisId,
					adjustments,
					timestamp: new Date().toISOString(),
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return { success: true, data };
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(
					`3971099883_1056_3_1056_54_11`,
					"Real-time adjustment error:",
					error
				)
			);
			return {
				success: false,
				error: "Failed to adjust parameters in real-time.",
			};
		}
	}

	/**
	 * Get regional soil data
	 * @param {string} regionId - Region identifier
	 * @returns {Promise<Object>} Regional soil data
	 */
	async getRegionalData(regionId) {
		try {
			const response = await fetch(
				`${this.baseURL}/soil/regional-data/${regionId}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: this.token ? `Bearer ${this.token}` : "",
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return { success: true, data };
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(`3971099883_1089_3_1089_47_11`, "Regional data error:", error)
			);
			return {
				success: false,
				error: "Failed to fetch regional soil data.",
			};
		}
	}

	/**
	 * Get list of available soil regions
	 * @returns {Promise<Object>} List of regions
	 */
	async getAvailableRegions() {
		try {
			const response = await fetch(`${this.baseURL}/soil/regions`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.token ? `Bearer ${this.token}` : "",
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return { success: true, data };
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(`3971099883_1118_3_1118_46_11`, "Regions list error:", error)
			);
			return {
				success: false,
				error: "Failed to fetch available regions.",
			};
		}
	}

	/**
	 * Create enhanced soil analysis with regional context
	 * @param {Object} analysisData - Enhanced analysis data
	 * @returns {Promise<Object>} Enhanced analysis results
	 */
	async createEnhancedAnalysis(analysisData) {
		if (this.userPlan === "FREE") {
			return {
				success: false,
				error: "Enhanced analysis is available for Professional+ users only.",
				showUpgrade: true,
			};
		}

		try {
			const response = await fetch(`${this.baseURL}/soil/analyze/enhanced`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.token ? `Bearer ${this.token}` : "",
				},
				body: JSON.stringify({
					...analysisData,
					timestamp: new Date().toISOString(),
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			this.incrementUsage();
			return { success: true, data };
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(
					`3971099883_1161_3_1161_51_11`,
					"Enhanced analysis error:",
					error
				)
			);
			return {
				success: false,
				error: "Enhanced soil analysis failed. Please try again.",
			};
		}
	}

	/**
	 * Check if user has access to advanced visualization features
	 * @returns {boolean} True if user has Professional+ plan
	 */
	hasAdvancedVisualizationAccess() {
		return this.token && this.userPlan !== "FREE";
	}

	/**
	 * Get visualization feature availability
	 * @returns {Object} Feature availability by plan
	 */
	getVisualizationFeatures() {
		const baseFeatures = {
			basicSoilAnalysis: true,
			soilTriangle: true,
			basicCharts: true,
		};

		if (this.hasAdvancedVisualizationAccess()) {
			return {
				...baseFeatures,
				moistureTensionCurves: true,
				soilProfile3D: true,
				comparativeAnalysis: true,
				realtimeAdjustment: true,
				regionalData: true,
				enhancedAnalysis: true,
				seasonalVariation: true,
				exportData: true,
			};
		}

		return baseFeatures;
	}

	/**
	 * Get demo moisture-tension curve data (no authentication required)
	 * @param {string} encodedData - Encoded soil data
	 * @returns {Promise<Object>} Demo moisture-tension curve data
	 */
	async getMoistureTensionCurveDemo(encodedData) {
		try {
			const response = await fetch(
				`${this.baseURL}/soil/demo/moisture-tension/${encodedData}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			// Backend returns { success: true, data: [...], demo: true, note: "..." }
			// Return the backend's data directly for consistent frontend access
			return {
				success: result.success,
				data: result.data,
				demo: result.demo,
				note: result.note,
			};
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(
					`3971099883_1236_3_1236_61_11`,
					"Demo moisture-tension curve error:",
					error
				)
			);
			return {
				success: false,
				error: "Failed to fetch demo moisture-tension curve data.",
			};
		}
	}

	/**
	 * Get demo 3D soil profile data (no authentication required)
	 * @param {string} encodedData - Encoded soil data
	 * @returns {Promise<Object>} Demo 3D profile data
	 */
	async getSoilProfile3DDemo(encodedData) {
		try {
			const response = await fetch(
				`${this.baseURL}/soil/demo/profile-3d/${encodedData}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			// Backend returns { success: true, data: {...}, demo: true, note: "..." }
			// Return the backend's data directly for consistent frontend access
			return {
				success: result.success,
				data: result.data,
				demo: result.demo,
				note: result.note,
			};
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(
					`3971099883_1275_3_1275_49_11`,
					"Demo 3D profile error:",
					error
				)
			);
			return {
				success: false,
				error: "Failed to fetch demo 3D soil profile data.",
			};
		}
	}
}
/* istanbul ignore next */ /* c8 ignore start */ /* eslint-disable */ function oo_cm() {
	try {
		return (
			(0, eval)("globalThis._console_ninja") ||
			(0, eval)(
				"/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x412f05=_0x7aed;(function(_0x489e25,_0x478e0c){var _0x5ad78b=_0x7aed,_0x59e60a=_0x489e25();while(!![]){try{var _0x330aaf=-parseInt(_0x5ad78b(0x2ab))/0x1+-parseInt(_0x5ad78b(0x1cb))/0x2+-parseInt(_0x5ad78b(0x2a8))/0x3+-parseInt(_0x5ad78b(0x271))/0x4+parseInt(_0x5ad78b(0x1e6))/0x5*(parseInt(_0x5ad78b(0x1dd))/0x6)+-parseInt(_0x5ad78b(0x1e1))/0x7+parseInt(_0x5ad78b(0x273))/0x8*(parseInt(_0x5ad78b(0x2a4))/0x9);if(_0x330aaf===_0x478e0c)break;else _0x59e60a['push'](_0x59e60a['shift']());}catch(_0xbd8d73){_0x59e60a['push'](_0x59e60a['shift']());}}}(_0x2ad7,0x267f5));function _0x7aed(_0x2acfa0,_0x11ca5c){var _0x2ad728=_0x2ad7();return _0x7aed=function(_0x7aeda8,_0x4bc420){_0x7aeda8=_0x7aeda8-0x1c8;var _0x5aea33=_0x2ad728[_0x7aeda8];return _0x5aea33;},_0x7aed(_0x2acfa0,_0x11ca5c);}var G=Object[_0x412f05(0x246)],V=Object[_0x412f05(0x1ea)],ee=Object[_0x412f05(0x1fe)],te=Object['getOwnPropertyNames'],ne=Object[_0x412f05(0x26c)],re=Object[_0x412f05(0x2b4)]['hasOwnProperty'],ie=(_0x3278c2,_0x2c9f67,_0x286638,_0x4d1f31)=>{var _0x13e522=_0x412f05;if(_0x2c9f67&&typeof _0x2c9f67==_0x13e522(0x25f)||typeof _0x2c9f67==_0x13e522(0x2b7)){for(let _0x2589a6 of te(_0x2c9f67))!re[_0x13e522(0x229)](_0x3278c2,_0x2589a6)&&_0x2589a6!==_0x286638&&V(_0x3278c2,_0x2589a6,{'get':()=>_0x2c9f67[_0x2589a6],'enumerable':!(_0x4d1f31=ee(_0x2c9f67,_0x2589a6))||_0x4d1f31['enumerable']});}return _0x3278c2;},j=(_0x4d2ea4,_0x39dfb8,_0x595b7d)=>(_0x595b7d=_0x4d2ea4!=null?G(ne(_0x4d2ea4)):{},ie(_0x39dfb8||!_0x4d2ea4||!_0x4d2ea4[_0x412f05(0x1d2)]?V(_0x595b7d,_0x412f05(0x225),{'value':_0x4d2ea4,'enumerable':!0x0}):_0x595b7d,_0x4d2ea4)),q=class{constructor(_0xa53b1b,_0x1b35fc,_0x35041d,_0x5c4ecc,_0xae162c,_0x5f0aad){var _0x5d204a=_0x412f05,_0x1c0b0c,_0x1ad527,_0x3ffe43,_0x193dec;this[_0x5d204a(0x1f4)]=_0xa53b1b,this[_0x5d204a(0x1d6)]=_0x1b35fc,this[_0x5d204a(0x1c8)]=_0x35041d,this[_0x5d204a(0x288)]=_0x5c4ecc,this[_0x5d204a(0x1d5)]=_0xae162c,this[_0x5d204a(0x1f1)]=_0x5f0aad,this[_0x5d204a(0x217)]=!0x0,this['_allowedToConnectOnSend']=!0x0,this[_0x5d204a(0x261)]=!0x1,this[_0x5d204a(0x291)]=!0x1,this[_0x5d204a(0x235)]=((_0x1ad527=(_0x1c0b0c=_0xa53b1b['process'])==null?void 0x0:_0x1c0b0c[_0x5d204a(0x27e)])==null?void 0x0:_0x1ad527[_0x5d204a(0x230)])===_0x5d204a(0x1f5),this[_0x5d204a(0x268)]=!((_0x193dec=(_0x3ffe43=this[_0x5d204a(0x1f4)]['process'])==null?void 0x0:_0x3ffe43[_0x5d204a(0x2a3)])!=null&&_0x193dec[_0x5d204a(0x213)])&&!this[_0x5d204a(0x235)],this['_WebSocketClass']=null,this['_connectAttemptCount']=0x0,this[_0x5d204a(0x250)]=0x14,this[_0x5d204a(0x242)]=_0x5d204a(0x1de),this[_0x5d204a(0x211)]=(this[_0x5d204a(0x268)]?_0x5d204a(0x28c):'Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20')+this['_webSocketErrorDocsLink'];}async['getWebSocketClass'](){var _0x355d00=_0x412f05,_0x4ac543,_0x19f83d;if(this[_0x355d00(0x2b1)])return this[_0x355d00(0x2b1)];let _0x1ef4ad;if(this[_0x355d00(0x268)]||this[_0x355d00(0x235)])_0x1ef4ad=this[_0x355d00(0x1f4)][_0x355d00(0x1e2)];else{if((_0x4ac543=this['global'][_0x355d00(0x1e7)])!=null&&_0x4ac543[_0x355d00(0x1fb)])_0x1ef4ad=(_0x19f83d=this[_0x355d00(0x1f4)][_0x355d00(0x1e7)])==null?void 0x0:_0x19f83d[_0x355d00(0x1fb)];else try{let _0x52454b=await import(_0x355d00(0x1e0));_0x1ef4ad=(await import((await import('url'))[_0x355d00(0x267)](_0x52454b[_0x355d00(0x23e)](this[_0x355d00(0x288)],'ws/index.js'))[_0x355d00(0x20d)]()))[_0x355d00(0x225)];}catch{try{_0x1ef4ad=require(require(_0x355d00(0x1e0))[_0x355d00(0x23e)](this[_0x355d00(0x288)],'ws'));}catch{throw new Error(_0x355d00(0x275));}}}return this[_0x355d00(0x2b1)]=_0x1ef4ad,_0x1ef4ad;}['_connectToHostNow'](){var _0x3ae808=_0x412f05;this[_0x3ae808(0x291)]||this[_0x3ae808(0x261)]||this[_0x3ae808(0x2a5)]>=this[_0x3ae808(0x250)]||(this[_0x3ae808(0x26a)]=!0x1,this[_0x3ae808(0x291)]=!0x0,this['_connectAttemptCount']++,this[_0x3ae808(0x22f)]=new Promise((_0x49b8ba,_0x216c0a)=>{var _0x31220c=_0x3ae808;this[_0x31220c(0x282)]()['then'](_0xb8c5ff=>{var _0x1b51a9=_0x31220c;let _0xa3a150=new _0xb8c5ff(_0x1b51a9(0x201)+(!this[_0x1b51a9(0x268)]&&this['dockerizedApp']?'gateway.docker.internal':this[_0x1b51a9(0x1d6)])+':'+this[_0x1b51a9(0x1c8)]);_0xa3a150[_0x1b51a9(0x25b)]=()=>{var _0x4d824e=_0x1b51a9;this[_0x4d824e(0x217)]=!0x1,this['_disposeWebsocket'](_0xa3a150),this[_0x4d824e(0x259)](),_0x216c0a(new Error(_0x4d824e(0x298)));},_0xa3a150[_0x1b51a9(0x236)]=()=>{var _0xe6725b=_0x1b51a9;this[_0xe6725b(0x268)]||_0xa3a150[_0xe6725b(0x20e)]&&_0xa3a150['_socket'][_0xe6725b(0x285)]&&_0xa3a150[_0xe6725b(0x20e)][_0xe6725b(0x285)](),_0x49b8ba(_0xa3a150);},_0xa3a150[_0x1b51a9(0x299)]=()=>{var _0xba3aed=_0x1b51a9;this[_0xba3aed(0x26a)]=!0x0,this[_0xba3aed(0x233)](_0xa3a150),this[_0xba3aed(0x259)]();},_0xa3a150[_0x1b51a9(0x293)]=_0x4741c1=>{var _0x394044=_0x1b51a9;try{if(!(_0x4741c1!=null&&_0x4741c1[_0x394044(0x224)])||!this[_0x394044(0x1f1)])return;let _0x48b408=JSON['parse'](_0x4741c1[_0x394044(0x224)]);this[_0x394044(0x1f1)](_0x48b408['method'],_0x48b408[_0x394044(0x1ee)],this[_0x394044(0x1f4)],this[_0x394044(0x268)]);}catch{}};})['then'](_0x4638=>(this[_0x31220c(0x261)]=!0x0,this[_0x31220c(0x291)]=!0x1,this[_0x31220c(0x26a)]=!0x1,this[_0x31220c(0x217)]=!0x0,this['_connectAttemptCount']=0x0,_0x4638))[_0x31220c(0x210)](_0x1f6b8a=>(this[_0x31220c(0x261)]=!0x1,this[_0x31220c(0x291)]=!0x1,console[_0x31220c(0x27a)](_0x31220c(0x20f)+this[_0x31220c(0x242)]),_0x216c0a(new Error(_0x31220c(0x24e)+(_0x1f6b8a&&_0x1f6b8a[_0x31220c(0x239)])))));}));}[_0x412f05(0x233)](_0x5e3305){var _0x3d1ab1=_0x412f05;this['_connected']=!0x1,this[_0x3d1ab1(0x291)]=!0x1;try{_0x5e3305[_0x3d1ab1(0x299)]=null,_0x5e3305[_0x3d1ab1(0x25b)]=null,_0x5e3305[_0x3d1ab1(0x236)]=null;}catch{}try{_0x5e3305[_0x3d1ab1(0x200)]<0x2&&_0x5e3305[_0x3d1ab1(0x1f9)]();}catch{}}['_attemptToReconnectShortly'](){var _0x232d5b=_0x412f05;clearTimeout(this[_0x232d5b(0x22d)]),!(this[_0x232d5b(0x2a5)]>=this[_0x232d5b(0x250)])&&(this[_0x232d5b(0x22d)]=setTimeout(()=>{var _0x303ebe=_0x232d5b,_0x5a5b19;this[_0x303ebe(0x261)]||this[_0x303ebe(0x291)]||(this[_0x303ebe(0x1cf)](),(_0x5a5b19=this[_0x303ebe(0x22f)])==null||_0x5a5b19[_0x303ebe(0x210)](()=>this[_0x303ebe(0x259)]()));},0x1f4),this[_0x232d5b(0x22d)][_0x232d5b(0x285)]&&this[_0x232d5b(0x22d)][_0x232d5b(0x285)]());}async[_0x412f05(0x1db)](_0x303817){var _0x5a67f6=_0x412f05;try{if(!this[_0x5a67f6(0x217)])return;this['_allowedToConnectOnSend']&&this[_0x5a67f6(0x1cf)](),(await this['_ws'])[_0x5a67f6(0x1db)](JSON['stringify'](_0x303817));}catch(_0xd18687){this['_extendedWarning']?console['warn'](this['_sendErrorMessage']+':\\x20'+(_0xd18687&&_0xd18687[_0x5a67f6(0x239)])):(this['_extendedWarning']=!0x0,console[_0x5a67f6(0x27a)](this['_sendErrorMessage']+':\\x20'+(_0xd18687&&_0xd18687[_0x5a67f6(0x239)]),_0x303817)),this[_0x5a67f6(0x217)]=!0x1,this[_0x5a67f6(0x259)]();}}};function H(_0x47bf4a,_0x5e132b,_0x31c76b,_0x357164,_0x13599e,_0x5e5372,_0x10b56d,_0x5f1e64=oe){var _0x4de24b=_0x412f05;let _0x1858be=_0x31c76b[_0x4de24b(0x2aa)](',')['map'](_0x2a3e24=>{var _0x128d91=_0x4de24b,_0x17bf75,_0x22c211,_0x45c79d,_0x2aaf33;try{if(!_0x47bf4a[_0x128d91(0x20c)]){let _0x1de002=((_0x22c211=(_0x17bf75=_0x47bf4a[_0x128d91(0x1e7)])==null?void 0x0:_0x17bf75[_0x128d91(0x2a3)])==null?void 0x0:_0x22c211['node'])||((_0x2aaf33=(_0x45c79d=_0x47bf4a[_0x128d91(0x1e7)])==null?void 0x0:_0x45c79d[_0x128d91(0x27e)])==null?void 0x0:_0x2aaf33[_0x128d91(0x230)])===_0x128d91(0x1f5);(_0x13599e===_0x128d91(0x1d8)||_0x13599e===_0x128d91(0x29a)||_0x13599e===_0x128d91(0x1dc)||_0x13599e==='angular')&&(_0x13599e+=_0x1de002?_0x128d91(0x257):'\\x20browser'),_0x47bf4a['_console_ninja_session']={'id':+new Date(),'tool':_0x13599e},_0x10b56d&&_0x13599e&&!_0x1de002&&console[_0x128d91(0x294)]('%c\\x20Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20'+(_0x13599e[_0x128d91(0x1ec)](0x0)[_0x128d91(0x24b)]()+_0x13599e[_0x128d91(0x2ac)](0x1))+',','background:\\x20rgb(30,30,30);\\x20color:\\x20rgb(255,213,92)',_0x128d91(0x2a1));}let _0x1dc304=new q(_0x47bf4a,_0x5e132b,_0x2a3e24,_0x357164,_0x5e5372,_0x5f1e64);return _0x1dc304[_0x128d91(0x1db)][_0x128d91(0x244)](_0x1dc304);}catch(_0x354102){return console[_0x128d91(0x27a)](_0x128d91(0x258),_0x354102&&_0x354102['message']),()=>{};}});return _0x172a39=>_0x1858be[_0x4de24b(0x2b6)](_0x3ac4af=>_0x3ac4af(_0x172a39));}function oe(_0x1e0d25,_0xc879f3,_0x28d502,_0x28827f){var _0x115306=_0x412f05;_0x28827f&&_0x1e0d25==='reload'&&_0x28d502[_0x115306(0x228)][_0x115306(0x2b5)]();}function B(_0x3f75ef){var _0x57e3bf=_0x412f05,_0x23c81c,_0x35cad5;let _0x4dd8df=function(_0x11c22f,_0x1d500d){return _0x1d500d-_0x11c22f;},_0x10e9f3;if(_0x3f75ef['performance'])_0x10e9f3=function(){var _0x54fb8d=_0x7aed;return _0x3f75ef[_0x54fb8d(0x1da)][_0x54fb8d(0x262)]();};else{if(_0x3f75ef['process']&&_0x3f75ef['process'][_0x57e3bf(0x255)]&&((_0x35cad5=(_0x23c81c=_0x3f75ef[_0x57e3bf(0x1e7)])==null?void 0x0:_0x23c81c[_0x57e3bf(0x27e)])==null?void 0x0:_0x35cad5[_0x57e3bf(0x230)])!==_0x57e3bf(0x1f5))_0x10e9f3=function(){var _0x58483c=_0x57e3bf;return _0x3f75ef['process'][_0x58483c(0x255)]();},_0x4dd8df=function(_0x3958b9,_0x4502d6){return 0x3e8*(_0x4502d6[0x0]-_0x3958b9[0x0])+(_0x4502d6[0x1]-_0x3958b9[0x1])/0xf4240;};else try{let {performance:_0xcf2161}=require(_0x57e3bf(0x254));_0x10e9f3=function(){var _0x5cc376=_0x57e3bf;return _0xcf2161[_0x5cc376(0x262)]();};}catch{_0x10e9f3=function(){return+new Date();};}}return{'elapsed':_0x4dd8df,'timeStamp':_0x10e9f3,'now':()=>Date['now']()};}function _0x2ad7(){var _0x28f6e1=['_objectToString','onerror','error','nan','autoExpandPreviousObjects','object','hostname','_connected','now','_blacklistedProperty','_isNegativeZero','undefined','HTMLAllCollection','pathToFileURL','_inBrowser','reduceLimits','_allowedToConnectOnSend','_setNodeExpandableState','getPrototypeOf','match','string','replace','resolveGetters','48056wZaTcA','_dateToString','8mtCRpS','null','failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket','_setNodePermissions','disabledLog','1748519471494','name','warn','_addObjectProperty','concat','root_exp_id','env','depth','127.0.0.1','boolean','getWebSocketClass','isExpressionToEvaluate','[object\\x20Map]','unref','number','autoExpand','nodeModules','_setNodeLabel','strLength','_undefined','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20','String','sortProps','_processTreeNodeResult','timeStamp','_connecting','_Symbol','onmessage','log','constructor','_getOwnPropertySymbols','stackTraceLimit','logger\\x20websocket\\x20error','onclose','remix','serialize','elapsed','push','type','Error','_getOwnPropertyDescriptor','see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.','date','versions','6098193WlOtQb','_connectAttemptCount','_getOwnPropertyNames','expressionsToEvaluate','331038qdpEYK','disabledTrace','split','205648GZcaDM','substr','_isSet','count','[object\\x20Date]','autoExpandPropertyCount','_WebSocketClass','Set','_treeNodePropertiesAfterFullValue','prototype','reload','forEach','function','totalStrLength','52252','[object\\x20Set]','1','valueOf','_additionalMetadata','port','fromCharCode','value','573148QebfPd','positiveInfinity','startsWith','_quotedRegExp','_connectToHostNow','_addProperty','_type','__es'+'Module','','Boolean','dockerizedApp','host','[object\\x20BigInt]','next.js','test','performance','send','astro','866358YPvDql','https://tinyurl.com/37x8b79t','[object\\x20Array]','path','347921LQyjly','WebSocket','toLowerCase','coverage','_setNodeExpressionPath','5Badimf','process','stack','slice','defineProperty','_sortProps','charAt','_propertyName','args','_isUndefined','_p_length','eventReceivedCallback','_ninjaIgnoreNextError','_treeNodePropertiesBeforeFullValue','global','edge','length','stringify','_p_','close','_p_name','_WebSocket','_isPrimitiveWrapperType','elements','getOwnPropertyDescriptor','symbol','readyState','ws://','capped','includes','array','Symbol','hits','_setNodeQueryPath','...','_console_ninja','autoExpandLimit','negativeZero','_console_ninja_session','toString','_socket','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20','catch','_sendErrorMessage','bigint','node','RegExp','_addLoadNode','_regExpToString','_allowedToSend','live-server-extension','trace','getOwnPropertySymbols','negativeInfinity','console','_cleanNode','parent','cappedElements','_setNodeId','_consoleNinjaAllowedToStart','index','Buffer','data','default','Number','indexOf','location','call','time','noFunctions','props','_reconnectTimeout','pop','_ws','NEXT_RUNTIME','_property','_addFunctionsNode','_disposeWebsocket','getter','_inNextEdge','onopen','autoExpandMaxDepth','allStrLength','message','Map','sort','_isMap','NEGATIVE_INFINITY','join','_HTMLAllCollection','endsWith','level','_webSocketErrorDocsLink',[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"LAPTOP-H92H2SLK\",\"192.168.56.1\",\"192.168.100.59\",\"172.22.144.1\"],'bind','some','create','current','get','expId','rootExpression','toUpperCase','_hasMapOnItsPath','_isPrimitiveType','failed\\x20to\\x20connect\\x20to\\x20host:\\x20','POSITIVE_INFINITY','_maxConnectAttemptCount','_capIfString','','unknown','perf_hooks','hrtime','origin','\\x20server','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host','_attemptToReconnectShortly'];_0x2ad7=function(){return _0x28f6e1;};return _0x2ad7();}function X(_0x3f5ef0,_0x2d564a,_0x5c445b){var _0x4622cb=_0x412f05,_0x1d41ab,_0x1652f0,_0x5a2c7c,_0x5bb0fa,_0x486c20;if(_0x3f5ef0[_0x4622cb(0x221)]!==void 0x0)return _0x3f5ef0['_consoleNinjaAllowedToStart'];let _0x3ef340=((_0x1652f0=(_0x1d41ab=_0x3f5ef0[_0x4622cb(0x1e7)])==null?void 0x0:_0x1d41ab[_0x4622cb(0x2a3)])==null?void 0x0:_0x1652f0[_0x4622cb(0x213)])||((_0x5bb0fa=(_0x5a2c7c=_0x3f5ef0[_0x4622cb(0x1e7)])==null?void 0x0:_0x5a2c7c[_0x4622cb(0x27e)])==null?void 0x0:_0x5bb0fa[_0x4622cb(0x230)])===_0x4622cb(0x1f5);function _0x311faa(_0x159a7a){var _0x35286c=_0x4622cb;if(_0x159a7a[_0x35286c(0x1cd)]('/')&&_0x159a7a[_0x35286c(0x240)]('/')){let _0x1f3e5a=new RegExp(_0x159a7a[_0x35286c(0x1e9)](0x1,-0x1));return _0x865c8b=>_0x1f3e5a['test'](_0x865c8b);}else{if(_0x159a7a['includes']('*')||_0x159a7a[_0x35286c(0x203)]('?')){let _0x23a98e=new RegExp('^'+_0x159a7a[_0x35286c(0x26f)](/\\./g,String['fromCharCode'](0x5c)+'.')[_0x35286c(0x26f)](/\\*/g,'.*')['replace'](/\\?/g,'.')+String[_0x35286c(0x1c9)](0x24));return _0x55a8ed=>_0x23a98e[_0x35286c(0x1d9)](_0x55a8ed);}else return _0x473ce2=>_0x473ce2===_0x159a7a;}}let _0x20cc8f=_0x2d564a['map'](_0x311faa);return _0x3f5ef0[_0x4622cb(0x221)]=_0x3ef340||!_0x2d564a,!_0x3f5ef0[_0x4622cb(0x221)]&&((_0x486c20=_0x3f5ef0[_0x4622cb(0x228)])==null?void 0x0:_0x486c20[_0x4622cb(0x260)])&&(_0x3f5ef0['_consoleNinjaAllowedToStart']=_0x20cc8f[_0x4622cb(0x245)](_0x1b2309=>_0x1b2309(_0x3f5ef0[_0x4622cb(0x228)]['hostname']))),_0x3f5ef0[_0x4622cb(0x221)];}function J(_0x7d450,_0x40d82e,_0x2c7a7b,_0x4c484d){var _0x160ba5=_0x412f05;_0x7d450=_0x7d450,_0x40d82e=_0x40d82e,_0x2c7a7b=_0x2c7a7b,_0x4c484d=_0x4c484d;let _0x5de405=B(_0x7d450),_0x23f854=_0x5de405['elapsed'],_0x1e24bd=_0x5de405[_0x160ba5(0x290)];class _0x72c007{constructor(){var _0x5669ca=_0x160ba5;this['_keyStrRegExp']=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this['_numberRegExp']=/^(0|[1-9][0-9]*)$/,this[_0x5669ca(0x1ce)]=/'([^\\\\']|\\\\')*'/,this[_0x5669ca(0x28b)]=_0x7d450[_0x5669ca(0x265)],this[_0x5669ca(0x23f)]=_0x7d450[_0x5669ca(0x266)],this[_0x5669ca(0x2a0)]=Object[_0x5669ca(0x1fe)],this['_getOwnPropertyNames']=Object['getOwnPropertyNames'],this[_0x5669ca(0x292)]=_0x7d450[_0x5669ca(0x205)],this[_0x5669ca(0x216)]=RegExp[_0x5669ca(0x2b4)][_0x5669ca(0x20d)],this[_0x5669ca(0x272)]=Date[_0x5669ca(0x2b4)][_0x5669ca(0x20d)];}[_0x160ba5(0x29b)](_0x5368ea,_0x469dff,_0x15ba72,_0x4172fe){var _0x30c7fd=_0x160ba5,_0x451109=this,_0x5bdd85=_0x15ba72[_0x30c7fd(0x287)];function _0x12611c(_0x2edf67,_0x300db0,_0x47bde9){var _0x2b7210=_0x30c7fd;_0x300db0['type']=_0x2b7210(0x253),_0x300db0[_0x2b7210(0x25c)]=_0x2edf67['message'],_0x26882b=_0x47bde9[_0x2b7210(0x213)][_0x2b7210(0x247)],_0x47bde9['node'][_0x2b7210(0x247)]=_0x300db0,_0x451109[_0x2b7210(0x1f3)](_0x300db0,_0x47bde9);}let _0x5b86f7;_0x7d450['console']&&(_0x5b86f7=_0x7d450['console'][_0x30c7fd(0x25c)],_0x5b86f7&&(_0x7d450[_0x30c7fd(0x21c)][_0x30c7fd(0x25c)]=function(){}));try{try{_0x15ba72['level']++,_0x15ba72[_0x30c7fd(0x287)]&&_0x15ba72['autoExpandPreviousObjects']['push'](_0x469dff);var _0x2ca9e7,_0x4e87ac,_0x161954,_0x68f02a,_0x183e83=[],_0x4297d6=[],_0x555f40,_0x5d6638=this[_0x30c7fd(0x1d1)](_0x469dff),_0x41b8e9=_0x5d6638==='array',_0x38ee4b=!0x1,_0x15ad45=_0x5d6638==='function',_0xbbf8ff=this[_0x30c7fd(0x24d)](_0x5d6638),_0xf353fd=this[_0x30c7fd(0x1fc)](_0x5d6638),_0x415311=_0xbbf8ff||_0xf353fd,_0x28416a={},_0x14df2b=0x0,_0x5b75e1=!0x1,_0x26882b,_0x34135c=/^(([1-9]{1}[0-9]*)|0)$/;if(_0x15ba72[_0x30c7fd(0x27f)]){if(_0x41b8e9){if(_0x4e87ac=_0x469dff[_0x30c7fd(0x1f6)],_0x4e87ac>_0x15ba72[_0x30c7fd(0x1fd)]){for(_0x161954=0x0,_0x68f02a=_0x15ba72['elements'],_0x2ca9e7=_0x161954;_0x2ca9e7<_0x68f02a;_0x2ca9e7++)_0x4297d6[_0x30c7fd(0x29d)](_0x451109[_0x30c7fd(0x1d0)](_0x183e83,_0x469dff,_0x5d6638,_0x2ca9e7,_0x15ba72));_0x5368ea[_0x30c7fd(0x21f)]=!0x0;}else{for(_0x161954=0x0,_0x68f02a=_0x4e87ac,_0x2ca9e7=_0x161954;_0x2ca9e7<_0x68f02a;_0x2ca9e7++)_0x4297d6[_0x30c7fd(0x29d)](_0x451109[_0x30c7fd(0x1d0)](_0x183e83,_0x469dff,_0x5d6638,_0x2ca9e7,_0x15ba72));}_0x15ba72['autoExpandPropertyCount']+=_0x4297d6['length'];}if(!(_0x5d6638===_0x30c7fd(0x274)||_0x5d6638===_0x30c7fd(0x265))&&!_0xbbf8ff&&_0x5d6638!==_0x30c7fd(0x28d)&&_0x5d6638!==_0x30c7fd(0x223)&&_0x5d6638!=='bigint'){var _0x19fede=_0x4172fe[_0x30c7fd(0x22c)]||_0x15ba72[_0x30c7fd(0x22c)];if(this['_isSet'](_0x469dff)?(_0x2ca9e7=0x0,_0x469dff[_0x30c7fd(0x2b6)](function(_0x4c2cb4){var _0x44ff96=_0x30c7fd;if(_0x14df2b++,_0x15ba72[_0x44ff96(0x2b0)]++,_0x14df2b>_0x19fede){_0x5b75e1=!0x0;return;}if(!_0x15ba72[_0x44ff96(0x283)]&&_0x15ba72[_0x44ff96(0x287)]&&_0x15ba72['autoExpandPropertyCount']>_0x15ba72[_0x44ff96(0x20a)]){_0x5b75e1=!0x0;return;}_0x4297d6['push'](_0x451109[_0x44ff96(0x1d0)](_0x183e83,_0x469dff,_0x44ff96(0x2b2),_0x2ca9e7++,_0x15ba72,function(_0x17b5eb){return function(){return _0x17b5eb;};}(_0x4c2cb4)));})):this[_0x30c7fd(0x23c)](_0x469dff)&&_0x469dff[_0x30c7fd(0x2b6)](function(_0x35cf26,_0x45f8bc){var _0x1b7935=_0x30c7fd;if(_0x14df2b++,_0x15ba72[_0x1b7935(0x2b0)]++,_0x14df2b>_0x19fede){_0x5b75e1=!0x0;return;}if(!_0x15ba72[_0x1b7935(0x283)]&&_0x15ba72[_0x1b7935(0x287)]&&_0x15ba72[_0x1b7935(0x2b0)]>_0x15ba72[_0x1b7935(0x20a)]){_0x5b75e1=!0x0;return;}var _0x4ba67b=_0x45f8bc[_0x1b7935(0x20d)]();_0x4ba67b['length']>0x64&&(_0x4ba67b=_0x4ba67b[_0x1b7935(0x1e9)](0x0,0x64)+_0x1b7935(0x208)),_0x4297d6['push'](_0x451109[_0x1b7935(0x1d0)](_0x183e83,_0x469dff,_0x1b7935(0x23a),_0x4ba67b,_0x15ba72,function(_0x2f3d58){return function(){return _0x2f3d58;};}(_0x35cf26)));}),!_0x38ee4b){try{for(_0x555f40 in _0x469dff)if(!(_0x41b8e9&&_0x34135c[_0x30c7fd(0x1d9)](_0x555f40))&&!this[_0x30c7fd(0x263)](_0x469dff,_0x555f40,_0x15ba72)){if(_0x14df2b++,_0x15ba72['autoExpandPropertyCount']++,_0x14df2b>_0x19fede){_0x5b75e1=!0x0;break;}if(!_0x15ba72['isExpressionToEvaluate']&&_0x15ba72[_0x30c7fd(0x287)]&&_0x15ba72['autoExpandPropertyCount']>_0x15ba72[_0x30c7fd(0x20a)]){_0x5b75e1=!0x0;break;}_0x4297d6['push'](_0x451109[_0x30c7fd(0x27b)](_0x183e83,_0x28416a,_0x469dff,_0x5d6638,_0x555f40,_0x15ba72));}}catch{}if(_0x28416a[_0x30c7fd(0x1f0)]=!0x0,_0x15ad45&&(_0x28416a[_0x30c7fd(0x1fa)]=!0x0),!_0x5b75e1){var _0x30c5b0=[][_0x30c7fd(0x27c)](this[_0x30c7fd(0x2a6)](_0x469dff))[_0x30c7fd(0x27c)](this[_0x30c7fd(0x296)](_0x469dff));for(_0x2ca9e7=0x0,_0x4e87ac=_0x30c5b0[_0x30c7fd(0x1f6)];_0x2ca9e7<_0x4e87ac;_0x2ca9e7++)if(_0x555f40=_0x30c5b0[_0x2ca9e7],!(_0x41b8e9&&_0x34135c[_0x30c7fd(0x1d9)](_0x555f40[_0x30c7fd(0x20d)]()))&&!this[_0x30c7fd(0x263)](_0x469dff,_0x555f40,_0x15ba72)&&!_0x28416a[_0x30c7fd(0x1f8)+_0x555f40[_0x30c7fd(0x20d)]()]){if(_0x14df2b++,_0x15ba72['autoExpandPropertyCount']++,_0x14df2b>_0x19fede){_0x5b75e1=!0x0;break;}if(!_0x15ba72[_0x30c7fd(0x283)]&&_0x15ba72[_0x30c7fd(0x287)]&&_0x15ba72[_0x30c7fd(0x2b0)]>_0x15ba72['autoExpandLimit']){_0x5b75e1=!0x0;break;}_0x4297d6[_0x30c7fd(0x29d)](_0x451109['_addObjectProperty'](_0x183e83,_0x28416a,_0x469dff,_0x5d6638,_0x555f40,_0x15ba72));}}}}}if(_0x5368ea[_0x30c7fd(0x29e)]=_0x5d6638,_0x415311?(_0x5368ea[_0x30c7fd(0x1ca)]=_0x469dff['valueOf'](),this['_capIfString'](_0x5d6638,_0x5368ea,_0x15ba72,_0x4172fe)):_0x5d6638===_0x30c7fd(0x2a2)?_0x5368ea['value']=this[_0x30c7fd(0x272)]['call'](_0x469dff):_0x5d6638==='bigint'?_0x5368ea['value']=_0x469dff['toString']():_0x5d6638===_0x30c7fd(0x214)?_0x5368ea[_0x30c7fd(0x1ca)]=this['_regExpToString']['call'](_0x469dff):_0x5d6638===_0x30c7fd(0x1ff)&&this['_Symbol']?_0x5368ea[_0x30c7fd(0x1ca)]=this[_0x30c7fd(0x292)][_0x30c7fd(0x2b4)]['toString'][_0x30c7fd(0x229)](_0x469dff):!_0x15ba72['depth']&&!(_0x5d6638===_0x30c7fd(0x274)||_0x5d6638===_0x30c7fd(0x265))&&(delete _0x5368ea[_0x30c7fd(0x1ca)],_0x5368ea[_0x30c7fd(0x202)]=!0x0),_0x5b75e1&&(_0x5368ea['cappedProps']=!0x0),_0x26882b=_0x15ba72[_0x30c7fd(0x213)][_0x30c7fd(0x247)],_0x15ba72[_0x30c7fd(0x213)][_0x30c7fd(0x247)]=_0x5368ea,this[_0x30c7fd(0x1f3)](_0x5368ea,_0x15ba72),_0x4297d6[_0x30c7fd(0x1f6)]){for(_0x2ca9e7=0x0,_0x4e87ac=_0x4297d6[_0x30c7fd(0x1f6)];_0x2ca9e7<_0x4e87ac;_0x2ca9e7++)_0x4297d6[_0x2ca9e7](_0x2ca9e7);}_0x183e83['length']&&(_0x5368ea[_0x30c7fd(0x22c)]=_0x183e83);}catch(_0x1edc55){_0x12611c(_0x1edc55,_0x5368ea,_0x15ba72);}this['_additionalMetadata'](_0x469dff,_0x5368ea),this[_0x30c7fd(0x2b3)](_0x5368ea,_0x15ba72),_0x15ba72[_0x30c7fd(0x213)][_0x30c7fd(0x247)]=_0x26882b,_0x15ba72[_0x30c7fd(0x241)]--,_0x15ba72['autoExpand']=_0x5bdd85,_0x15ba72[_0x30c7fd(0x287)]&&_0x15ba72[_0x30c7fd(0x25e)][_0x30c7fd(0x22e)]();}finally{_0x5b86f7&&(_0x7d450[_0x30c7fd(0x21c)][_0x30c7fd(0x25c)]=_0x5b86f7);}return _0x5368ea;}['_getOwnPropertySymbols'](_0x2f03fa){var _0x2ad9cc=_0x160ba5;return Object[_0x2ad9cc(0x21a)]?Object[_0x2ad9cc(0x21a)](_0x2f03fa):[];}[_0x160ba5(0x2ad)](_0x1763db){var _0x342016=_0x160ba5;return!!(_0x1763db&&_0x7d450[_0x342016(0x2b2)]&&this[_0x342016(0x25a)](_0x1763db)===_0x342016(0x2ba)&&_0x1763db['forEach']);}[_0x160ba5(0x263)](_0x34592f,_0x3fb092,_0x24415d){return _0x24415d['noFunctions']?typeof _0x34592f[_0x3fb092]=='function':!0x1;}[_0x160ba5(0x1d1)](_0x1fdd15){var _0x1c08ef=_0x160ba5,_0x53faf0='';return _0x53faf0=typeof _0x1fdd15,_0x53faf0===_0x1c08ef(0x25f)?this[_0x1c08ef(0x25a)](_0x1fdd15)===_0x1c08ef(0x1df)?_0x53faf0=_0x1c08ef(0x204):this[_0x1c08ef(0x25a)](_0x1fdd15)===_0x1c08ef(0x2af)?_0x53faf0=_0x1c08ef(0x2a2):this[_0x1c08ef(0x25a)](_0x1fdd15)===_0x1c08ef(0x1d7)?_0x53faf0=_0x1c08ef(0x212):_0x1fdd15===null?_0x53faf0=_0x1c08ef(0x274):_0x1fdd15[_0x1c08ef(0x295)]&&(_0x53faf0=_0x1fdd15[_0x1c08ef(0x295)][_0x1c08ef(0x279)]||_0x53faf0):_0x53faf0==='undefined'&&this['_HTMLAllCollection']&&_0x1fdd15 instanceof this[_0x1c08ef(0x23f)]&&(_0x53faf0='HTMLAllCollection'),_0x53faf0;}[_0x160ba5(0x25a)](_0x5ba56f){var _0x27a33c=_0x160ba5;return Object[_0x27a33c(0x2b4)]['toString']['call'](_0x5ba56f);}['_isPrimitiveType'](_0x4217f5){var _0x3f1c5a=_0x160ba5;return _0x4217f5===_0x3f1c5a(0x281)||_0x4217f5===_0x3f1c5a(0x26e)||_0x4217f5===_0x3f1c5a(0x286);}[_0x160ba5(0x1fc)](_0x3c19a8){var _0x5b2df3=_0x160ba5;return _0x3c19a8===_0x5b2df3(0x1d4)||_0x3c19a8===_0x5b2df3(0x28d)||_0x3c19a8===_0x5b2df3(0x226);}['_addProperty'](_0x478395,_0xe9fdfe,_0x3ba399,_0x3742cb,_0x467252,_0x33a71f){var _0x5ebf80=this;return function(_0x83bc85){var _0x5ae2fe=_0x7aed,_0x140bbb=_0x467252[_0x5ae2fe(0x213)][_0x5ae2fe(0x247)],_0x8941d7=_0x467252[_0x5ae2fe(0x213)][_0x5ae2fe(0x222)],_0x5736e4=_0x467252[_0x5ae2fe(0x213)][_0x5ae2fe(0x21e)];_0x467252[_0x5ae2fe(0x213)]['parent']=_0x140bbb,_0x467252[_0x5ae2fe(0x213)][_0x5ae2fe(0x222)]=typeof _0x3742cb==_0x5ae2fe(0x286)?_0x3742cb:_0x83bc85,_0x478395[_0x5ae2fe(0x29d)](_0x5ebf80[_0x5ae2fe(0x231)](_0xe9fdfe,_0x3ba399,_0x3742cb,_0x467252,_0x33a71f)),_0x467252['node'][_0x5ae2fe(0x21e)]=_0x5736e4,_0x467252[_0x5ae2fe(0x213)][_0x5ae2fe(0x222)]=_0x8941d7;};}[_0x160ba5(0x27b)](_0x55db2c,_0x133091,_0xd23bb6,_0x3819c5,_0x5ec53f,_0x1c5cca,_0x2b4ec4){var _0x22cd36=_0x160ba5,_0x1d4312=this;return _0x133091[_0x22cd36(0x1f8)+_0x5ec53f[_0x22cd36(0x20d)]()]=!0x0,function(_0x538af5){var _0x70066e=_0x22cd36,_0x3030df=_0x1c5cca[_0x70066e(0x213)][_0x70066e(0x247)],_0x1722d4=_0x1c5cca['node'][_0x70066e(0x222)],_0x36219e=_0x1c5cca[_0x70066e(0x213)]['parent'];_0x1c5cca[_0x70066e(0x213)][_0x70066e(0x21e)]=_0x3030df,_0x1c5cca[_0x70066e(0x213)]['index']=_0x538af5,_0x55db2c['push'](_0x1d4312[_0x70066e(0x231)](_0xd23bb6,_0x3819c5,_0x5ec53f,_0x1c5cca,_0x2b4ec4)),_0x1c5cca[_0x70066e(0x213)]['parent']=_0x36219e,_0x1c5cca[_0x70066e(0x213)][_0x70066e(0x222)]=_0x1722d4;};}[_0x160ba5(0x231)](_0x2d3f6b,_0x5a49a5,_0x225ae4,_0x249300,_0x20f0fa){var _0x43e148=_0x160ba5,_0x39845c=this;_0x20f0fa||(_0x20f0fa=function(_0x305f2b,_0x250236){return _0x305f2b[_0x250236];});var _0xab1c19=_0x225ae4[_0x43e148(0x20d)](),_0x2fd47e=_0x249300['expressionsToEvaluate']||{},_0x2beb72=_0x249300[_0x43e148(0x27f)],_0xd20e0b=_0x249300['isExpressionToEvaluate'];try{var _0x295dfd=this[_0x43e148(0x23c)](_0x2d3f6b),_0x539e05=_0xab1c19;_0x295dfd&&_0x539e05[0x0]==='\\x27'&&(_0x539e05=_0x539e05[_0x43e148(0x2ac)](0x1,_0x539e05[_0x43e148(0x1f6)]-0x2));var _0x48743b=_0x249300[_0x43e148(0x2a7)]=_0x2fd47e[_0x43e148(0x1f8)+_0x539e05];_0x48743b&&(_0x249300[_0x43e148(0x27f)]=_0x249300[_0x43e148(0x27f)]+0x1),_0x249300[_0x43e148(0x283)]=!!_0x48743b;var _0x5290b9=typeof _0x225ae4==_0x43e148(0x1ff),_0x1a806f={'name':_0x5290b9||_0x295dfd?_0xab1c19:this[_0x43e148(0x1ed)](_0xab1c19)};if(_0x5290b9&&(_0x1a806f[_0x43e148(0x1ff)]=!0x0),!(_0x5a49a5===_0x43e148(0x204)||_0x5a49a5===_0x43e148(0x29f))){var _0x25a71b=this[_0x43e148(0x2a0)](_0x2d3f6b,_0x225ae4);if(_0x25a71b&&(_0x25a71b['set']&&(_0x1a806f['setter']=!0x0),_0x25a71b[_0x43e148(0x248)]&&!_0x48743b&&!_0x249300[_0x43e148(0x270)]))return _0x1a806f[_0x43e148(0x234)]=!0x0,this['_processTreeNodeResult'](_0x1a806f,_0x249300),_0x1a806f;}var _0x14f7e2;try{_0x14f7e2=_0x20f0fa(_0x2d3f6b,_0x225ae4);}catch(_0x3cbf03){return _0x1a806f={'name':_0xab1c19,'type':_0x43e148(0x253),'error':_0x3cbf03[_0x43e148(0x239)]},this[_0x43e148(0x28f)](_0x1a806f,_0x249300),_0x1a806f;}var _0x14754d=this['_type'](_0x14f7e2),_0x158b2c=this['_isPrimitiveType'](_0x14754d);if(_0x1a806f[_0x43e148(0x29e)]=_0x14754d,_0x158b2c)this[_0x43e148(0x28f)](_0x1a806f,_0x249300,_0x14f7e2,function(){var _0x122870=_0x43e148;_0x1a806f[_0x122870(0x1ca)]=_0x14f7e2[_0x122870(0x2bc)](),!_0x48743b&&_0x39845c[_0x122870(0x251)](_0x14754d,_0x1a806f,_0x249300,{});});else{var _0x2f0ad9=_0x249300[_0x43e148(0x287)]&&_0x249300[_0x43e148(0x241)]<_0x249300[_0x43e148(0x237)]&&_0x249300[_0x43e148(0x25e)][_0x43e148(0x227)](_0x14f7e2)<0x0&&_0x14754d!=='function'&&_0x249300[_0x43e148(0x2b0)]<_0x249300[_0x43e148(0x20a)];_0x2f0ad9||_0x249300[_0x43e148(0x241)]<_0x2beb72||_0x48743b?(this[_0x43e148(0x29b)](_0x1a806f,_0x14f7e2,_0x249300,_0x48743b||{}),this[_0x43e148(0x2bd)](_0x14f7e2,_0x1a806f)):this['_processTreeNodeResult'](_0x1a806f,_0x249300,_0x14f7e2,function(){var _0x3d96e0=_0x43e148;_0x14754d===_0x3d96e0(0x274)||_0x14754d==='undefined'||(delete _0x1a806f[_0x3d96e0(0x1ca)],_0x1a806f['capped']=!0x0);});}return _0x1a806f;}finally{_0x249300[_0x43e148(0x2a7)]=_0x2fd47e,_0x249300[_0x43e148(0x27f)]=_0x2beb72,_0x249300[_0x43e148(0x283)]=_0xd20e0b;}}[_0x160ba5(0x251)](_0x10bdd1,_0x323dde,_0x1e2e7e,_0x3cc127){var _0x50f7cc=_0x160ba5,_0xe2eca4=_0x3cc127[_0x50f7cc(0x28a)]||_0x1e2e7e[_0x50f7cc(0x28a)];if((_0x10bdd1===_0x50f7cc(0x26e)||_0x10bdd1===_0x50f7cc(0x28d))&&_0x323dde[_0x50f7cc(0x1ca)]){let _0x4f723f=_0x323dde[_0x50f7cc(0x1ca)][_0x50f7cc(0x1f6)];_0x1e2e7e[_0x50f7cc(0x238)]+=_0x4f723f,_0x1e2e7e[_0x50f7cc(0x238)]>_0x1e2e7e[_0x50f7cc(0x2b8)]?(_0x323dde['capped']='',delete _0x323dde[_0x50f7cc(0x1ca)]):_0x4f723f>_0xe2eca4&&(_0x323dde[_0x50f7cc(0x202)]=_0x323dde[_0x50f7cc(0x1ca)][_0x50f7cc(0x2ac)](0x0,_0xe2eca4),delete _0x323dde[_0x50f7cc(0x1ca)]);}}[_0x160ba5(0x23c)](_0x40a637){var _0x266ea4=_0x160ba5;return!!(_0x40a637&&_0x7d450[_0x266ea4(0x23a)]&&this[_0x266ea4(0x25a)](_0x40a637)===_0x266ea4(0x284)&&_0x40a637[_0x266ea4(0x2b6)]);}[_0x160ba5(0x1ed)](_0x176a00){var _0x522383=_0x160ba5;if(_0x176a00[_0x522383(0x26d)](/^\\d+$/))return _0x176a00;var _0x10a8e7;try{_0x10a8e7=JSON[_0x522383(0x1f7)](''+_0x176a00);}catch{_0x10a8e7='\\x22'+this[_0x522383(0x25a)](_0x176a00)+'\\x22';}return _0x10a8e7['match'](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x10a8e7=_0x10a8e7['substr'](0x1,_0x10a8e7[_0x522383(0x1f6)]-0x2):_0x10a8e7=_0x10a8e7[_0x522383(0x26f)](/'/g,'\\x5c\\x27')['replace'](/\\\\\"/g,'\\x22')[_0x522383(0x26f)](/(^\"|\"$)/g,'\\x27'),_0x10a8e7;}[_0x160ba5(0x28f)](_0x54f43d,_0x35a683,_0x5141d8,_0x405b1a){var _0x3aac49=_0x160ba5;this['_treeNodePropertiesBeforeFullValue'](_0x54f43d,_0x35a683),_0x405b1a&&_0x405b1a(),this[_0x3aac49(0x2bd)](_0x5141d8,_0x54f43d),this[_0x3aac49(0x2b3)](_0x54f43d,_0x35a683);}[_0x160ba5(0x1f3)](_0x24b9a8,_0xa50a22){var _0x18b42f=_0x160ba5;this[_0x18b42f(0x220)](_0x24b9a8,_0xa50a22),this[_0x18b42f(0x207)](_0x24b9a8,_0xa50a22),this[_0x18b42f(0x1e5)](_0x24b9a8,_0xa50a22),this['_setNodePermissions'](_0x24b9a8,_0xa50a22);}[_0x160ba5(0x220)](_0x563683,_0xd36075){}['_setNodeQueryPath'](_0x561e33,_0x2ee0e9){}[_0x160ba5(0x289)](_0x550f59,_0x477ce9){}[_0x160ba5(0x1ef)](_0x36cdc6){var _0x65711e=_0x160ba5;return _0x36cdc6===this[_0x65711e(0x28b)];}[_0x160ba5(0x2b3)](_0x187fdc,_0x2d973d){var _0x3fdb7f=_0x160ba5;this[_0x3fdb7f(0x289)](_0x187fdc,_0x2d973d),this['_setNodeExpandableState'](_0x187fdc),_0x2d973d[_0x3fdb7f(0x28e)]&&this[_0x3fdb7f(0x1eb)](_0x187fdc),this[_0x3fdb7f(0x232)](_0x187fdc,_0x2d973d),this['_addLoadNode'](_0x187fdc,_0x2d973d),this['_cleanNode'](_0x187fdc);}[_0x160ba5(0x2bd)](_0x17fc0f,_0x2e0a7a){var _0x29e880=_0x160ba5;try{_0x17fc0f&&typeof _0x17fc0f['length']=='number'&&(_0x2e0a7a[_0x29e880(0x1f6)]=_0x17fc0f['length']);}catch{}if(_0x2e0a7a[_0x29e880(0x29e)]===_0x29e880(0x286)||_0x2e0a7a[_0x29e880(0x29e)]===_0x29e880(0x226)){if(isNaN(_0x2e0a7a[_0x29e880(0x1ca)]))_0x2e0a7a[_0x29e880(0x25d)]=!0x0,delete _0x2e0a7a[_0x29e880(0x1ca)];else switch(_0x2e0a7a[_0x29e880(0x1ca)]){case Number[_0x29e880(0x24f)]:_0x2e0a7a[_0x29e880(0x1cc)]=!0x0,delete _0x2e0a7a['value'];break;case Number[_0x29e880(0x23d)]:_0x2e0a7a[_0x29e880(0x21b)]=!0x0,delete _0x2e0a7a[_0x29e880(0x1ca)];break;case 0x0:this[_0x29e880(0x264)](_0x2e0a7a['value'])&&(_0x2e0a7a[_0x29e880(0x20b)]=!0x0);break;}}else _0x2e0a7a[_0x29e880(0x29e)]===_0x29e880(0x2b7)&&typeof _0x17fc0f[_0x29e880(0x279)]==_0x29e880(0x26e)&&_0x17fc0f['name']&&_0x2e0a7a[_0x29e880(0x279)]&&_0x17fc0f[_0x29e880(0x279)]!==_0x2e0a7a[_0x29e880(0x279)]&&(_0x2e0a7a['funcName']=_0x17fc0f[_0x29e880(0x279)]);}[_0x160ba5(0x264)](_0xcdc30d){return 0x1/_0xcdc30d===Number['NEGATIVE_INFINITY'];}[_0x160ba5(0x1eb)](_0x57620a){var _0x554927=_0x160ba5;!_0x57620a[_0x554927(0x22c)]||!_0x57620a[_0x554927(0x22c)][_0x554927(0x1f6)]||_0x57620a[_0x554927(0x29e)]===_0x554927(0x204)||_0x57620a['type']===_0x554927(0x23a)||_0x57620a[_0x554927(0x29e)]===_0x554927(0x2b2)||_0x57620a[_0x554927(0x22c)][_0x554927(0x23b)](function(_0x522994,_0xc65c20){var _0x478427=_0x554927,_0xa4d142=_0x522994[_0x478427(0x279)][_0x478427(0x1e3)](),_0x15a6a4=_0xc65c20['name']['toLowerCase']();return _0xa4d142<_0x15a6a4?-0x1:_0xa4d142>_0x15a6a4?0x1:0x0;});}[_0x160ba5(0x232)](_0x2237ae,_0x561821){var _0x5a336f=_0x160ba5;if(!(_0x561821[_0x5a336f(0x22b)]||!_0x2237ae[_0x5a336f(0x22c)]||!_0x2237ae['props']['length'])){for(var _0x2c5544=[],_0x50e89d=[],_0x191ec8=0x0,_0x538f8c=_0x2237ae['props'][_0x5a336f(0x1f6)];_0x191ec8<_0x538f8c;_0x191ec8++){var _0x2d4afa=_0x2237ae[_0x5a336f(0x22c)][_0x191ec8];_0x2d4afa['type']===_0x5a336f(0x2b7)?_0x2c5544[_0x5a336f(0x29d)](_0x2d4afa):_0x50e89d[_0x5a336f(0x29d)](_0x2d4afa);}if(!(!_0x50e89d['length']||_0x2c5544[_0x5a336f(0x1f6)]<=0x1)){_0x2237ae[_0x5a336f(0x22c)]=_0x50e89d;var _0x17e820={'functionsNode':!0x0,'props':_0x2c5544};this[_0x5a336f(0x220)](_0x17e820,_0x561821),this['_setNodeLabel'](_0x17e820,_0x561821),this['_setNodeExpandableState'](_0x17e820),this[_0x5a336f(0x276)](_0x17e820,_0x561821),_0x17e820['id']+='\\x20f',_0x2237ae[_0x5a336f(0x22c)]['unshift'](_0x17e820);}}}[_0x160ba5(0x215)](_0x372b2c,_0x432441){}[_0x160ba5(0x26b)](_0x23f579){}['_isArray'](_0x15f0fe){var _0xf58c2c=_0x160ba5;return Array['isArray'](_0x15f0fe)||typeof _0x15f0fe=='object'&&this[_0xf58c2c(0x25a)](_0x15f0fe)===_0xf58c2c(0x1df);}[_0x160ba5(0x276)](_0x45d67e,_0x4e25cc){}[_0x160ba5(0x21d)](_0x3ab2f8){var _0x24e230=_0x160ba5;delete _0x3ab2f8['_hasSymbolPropertyOnItsPath'],delete _0x3ab2f8['_hasSetOnItsPath'],delete _0x3ab2f8[_0x24e230(0x24c)];}[_0x160ba5(0x1e5)](_0x219f42,_0xa1798f){}}let _0x9a88b=new _0x72c007(),_0x5a78ca={'props':0x64,'elements':0x64,'strLength':0x400*0x32,'totalStrLength':0x400*0x32,'autoExpandLimit':0x1388,'autoExpandMaxDepth':0xa},_0x1c8f85={'props':0x5,'elements':0x5,'strLength':0x100,'totalStrLength':0x100*0x3,'autoExpandLimit':0x1e,'autoExpandMaxDepth':0x2};function _0x3ead1e(_0x107b5d,_0x426cd1,_0x2c9a98,_0x39a78f,_0x509a61,_0x574832){var _0x56efc5=_0x160ba5;let _0x3e227e,_0x44f64f;try{_0x44f64f=_0x1e24bd(),_0x3e227e=_0x2c7a7b[_0x426cd1],!_0x3e227e||_0x44f64f-_0x3e227e['ts']>0x1f4&&_0x3e227e['count']&&_0x3e227e['time']/_0x3e227e[_0x56efc5(0x2ae)]<0x64?(_0x2c7a7b[_0x426cd1]=_0x3e227e={'count':0x0,'time':0x0,'ts':_0x44f64f},_0x2c7a7b[_0x56efc5(0x206)]={}):_0x44f64f-_0x2c7a7b[_0x56efc5(0x206)]['ts']>0x32&&_0x2c7a7b[_0x56efc5(0x206)][_0x56efc5(0x2ae)]&&_0x2c7a7b[_0x56efc5(0x206)][_0x56efc5(0x22a)]/_0x2c7a7b[_0x56efc5(0x206)][_0x56efc5(0x2ae)]<0x64&&(_0x2c7a7b[_0x56efc5(0x206)]={});let _0x4b7997=[],_0x2cb0e2=_0x3e227e[_0x56efc5(0x269)]||_0x2c7a7b['hits'][_0x56efc5(0x269)]?_0x1c8f85:_0x5a78ca,_0x2c9234=_0x3f540d=>{var _0x499d94=_0x56efc5;let _0x49983f={};return _0x49983f[_0x499d94(0x22c)]=_0x3f540d[_0x499d94(0x22c)],_0x49983f[_0x499d94(0x1fd)]=_0x3f540d[_0x499d94(0x1fd)],_0x49983f[_0x499d94(0x28a)]=_0x3f540d[_0x499d94(0x28a)],_0x49983f['totalStrLength']=_0x3f540d['totalStrLength'],_0x49983f[_0x499d94(0x20a)]=_0x3f540d[_0x499d94(0x20a)],_0x49983f[_0x499d94(0x237)]=_0x3f540d[_0x499d94(0x237)],_0x49983f['sortProps']=!0x1,_0x49983f[_0x499d94(0x22b)]=!_0x40d82e,_0x49983f['depth']=0x1,_0x49983f['level']=0x0,_0x49983f[_0x499d94(0x249)]=_0x499d94(0x27d),_0x49983f[_0x499d94(0x24a)]='root_exp',_0x49983f[_0x499d94(0x287)]=!0x0,_0x49983f[_0x499d94(0x25e)]=[],_0x49983f[_0x499d94(0x2b0)]=0x0,_0x49983f[_0x499d94(0x270)]=!0x0,_0x49983f[_0x499d94(0x238)]=0x0,_0x49983f[_0x499d94(0x213)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x49983f;};for(var _0x4fa659=0x0;_0x4fa659<_0x509a61['length'];_0x4fa659++)_0x4b7997['push'](_0x9a88b[_0x56efc5(0x29b)]({'timeNode':_0x107b5d===_0x56efc5(0x22a)||void 0x0},_0x509a61[_0x4fa659],_0x2c9234(_0x2cb0e2),{}));if(_0x107b5d===_0x56efc5(0x219)||_0x107b5d===_0x56efc5(0x25c)){let _0x5a1f73=Error[_0x56efc5(0x297)];try{Error[_0x56efc5(0x297)]=0x1/0x0,_0x4b7997['push'](_0x9a88b[_0x56efc5(0x29b)]({'stackNode':!0x0},new Error()[_0x56efc5(0x1e8)],_0x2c9234(_0x2cb0e2),{'strLength':0x1/0x0}));}finally{Error[_0x56efc5(0x297)]=_0x5a1f73;}}return{'method':_0x56efc5(0x294),'version':_0x4c484d,'args':[{'ts':_0x2c9a98,'session':_0x39a78f,'args':_0x4b7997,'id':_0x426cd1,'context':_0x574832}]};}catch(_0x1862d8){return{'method':'log','version':_0x4c484d,'args':[{'ts':_0x2c9a98,'session':_0x39a78f,'args':[{'type':_0x56efc5(0x253),'error':_0x1862d8&&_0x1862d8[_0x56efc5(0x239)]}],'id':_0x426cd1,'context':_0x574832}]};}finally{try{if(_0x3e227e&&_0x44f64f){let _0x11cfc1=_0x1e24bd();_0x3e227e[_0x56efc5(0x2ae)]++,_0x3e227e['time']+=_0x23f854(_0x44f64f,_0x11cfc1),_0x3e227e['ts']=_0x11cfc1,_0x2c7a7b[_0x56efc5(0x206)]['count']++,_0x2c7a7b['hits']['time']+=_0x23f854(_0x44f64f,_0x11cfc1),_0x2c7a7b[_0x56efc5(0x206)]['ts']=_0x11cfc1,(_0x3e227e[_0x56efc5(0x2ae)]>0x32||_0x3e227e['time']>0x64)&&(_0x3e227e[_0x56efc5(0x269)]=!0x0),(_0x2c7a7b[_0x56efc5(0x206)][_0x56efc5(0x2ae)]>0x3e8||_0x2c7a7b[_0x56efc5(0x206)]['time']>0x12c)&&(_0x2c7a7b['hits']['reduceLimits']=!0x0);}}catch{}}}return _0x3ead1e;}((_0x5516a7,_0x3c1ed7,_0x11f5cc,_0x3a364e,_0xc41a47,_0x2b3dc5,_0x137b8a,_0x42905b,_0x3fde82,_0x3186f9,_0x5660d2)=>{var _0x351c26=_0x412f05;if(_0x5516a7['_console_ninja'])return _0x5516a7[_0x351c26(0x209)];if(!X(_0x5516a7,_0x42905b,_0xc41a47))return _0x5516a7[_0x351c26(0x209)]={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}},_0x5516a7[_0x351c26(0x209)];let _0x51fbd6=B(_0x5516a7),_0x1af2a9=_0x51fbd6[_0x351c26(0x29c)],_0x8b136c=_0x51fbd6[_0x351c26(0x290)],_0xa4164f=_0x51fbd6[_0x351c26(0x262)],_0x222af6={'hits':{},'ts':{}},_0x22e6a3=J(_0x5516a7,_0x3fde82,_0x222af6,_0x2b3dc5),_0x1da51c=_0x51a5bf=>{_0x222af6['ts'][_0x51a5bf]=_0x8b136c();},_0x544d41=(_0x542568,_0x4d0ad5)=>{var _0x5dc69a=_0x351c26;let _0x3ffea9=_0x222af6['ts'][_0x4d0ad5];if(delete _0x222af6['ts'][_0x4d0ad5],_0x3ffea9){let _0x2450ff=_0x1af2a9(_0x3ffea9,_0x8b136c());_0x135888(_0x22e6a3(_0x5dc69a(0x22a),_0x542568,_0xa4164f(),_0x11cfe1,[_0x2450ff],_0x4d0ad5));}},_0x308c17=_0x185382=>{var _0x1d22a1=_0x351c26,_0x1d2ff1;return _0xc41a47===_0x1d22a1(0x1d8)&&_0x5516a7[_0x1d22a1(0x256)]&&((_0x1d2ff1=_0x185382==null?void 0x0:_0x185382[_0x1d22a1(0x1ee)])==null?void 0x0:_0x1d2ff1[_0x1d22a1(0x1f6)])&&(_0x185382[_0x1d22a1(0x1ee)][0x0]['origin']=_0x5516a7[_0x1d22a1(0x256)]),_0x185382;};_0x5516a7[_0x351c26(0x209)]={'consoleLog':(_0x1f1ec0,_0xd9bd2)=>{var _0x2dd18f=_0x351c26;_0x5516a7[_0x2dd18f(0x21c)]['log'][_0x2dd18f(0x279)]!==_0x2dd18f(0x277)&&_0x135888(_0x22e6a3(_0x2dd18f(0x294),_0x1f1ec0,_0xa4164f(),_0x11cfe1,_0xd9bd2));},'consoleTrace':(_0x5292c0,_0x1ca6b7)=>{var _0x180904=_0x351c26,_0x127cb5,_0x591582;_0x5516a7[_0x180904(0x21c)][_0x180904(0x294)][_0x180904(0x279)]!==_0x180904(0x2a9)&&((_0x591582=(_0x127cb5=_0x5516a7[_0x180904(0x1e7)])==null?void 0x0:_0x127cb5['versions'])!=null&&_0x591582['node']&&(_0x5516a7[_0x180904(0x1f2)]=!0x0),_0x135888(_0x308c17(_0x22e6a3(_0x180904(0x219),_0x5292c0,_0xa4164f(),_0x11cfe1,_0x1ca6b7))));},'consoleError':(_0x32dce8,_0x4a9561)=>{var _0x4198e8=_0x351c26;_0x5516a7[_0x4198e8(0x1f2)]=!0x0,_0x135888(_0x308c17(_0x22e6a3(_0x4198e8(0x25c),_0x32dce8,_0xa4164f(),_0x11cfe1,_0x4a9561)));},'consoleTime':_0x1baa46=>{_0x1da51c(_0x1baa46);},'consoleTimeEnd':(_0x4167d8,_0x240c74)=>{_0x544d41(_0x240c74,_0x4167d8);},'autoLog':(_0x14fbb8,_0x448ed3)=>{_0x135888(_0x22e6a3('log',_0x448ed3,_0xa4164f(),_0x11cfe1,[_0x14fbb8]));},'autoLogMany':(_0x1adbe1,_0x3bb8cb)=>{_0x135888(_0x22e6a3('log',_0x1adbe1,_0xa4164f(),_0x11cfe1,_0x3bb8cb));},'autoTrace':(_0x771931,_0x11feb8)=>{var _0x479b2e=_0x351c26;_0x135888(_0x308c17(_0x22e6a3(_0x479b2e(0x219),_0x11feb8,_0xa4164f(),_0x11cfe1,[_0x771931])));},'autoTraceMany':(_0x34bccd,_0x4ee4a3)=>{var _0x4cbb4e=_0x351c26;_0x135888(_0x308c17(_0x22e6a3(_0x4cbb4e(0x219),_0x34bccd,_0xa4164f(),_0x11cfe1,_0x4ee4a3)));},'autoTime':(_0xc854d8,_0x8732b1,_0x5b9789)=>{_0x1da51c(_0x5b9789);},'autoTimeEnd':(_0x3e6634,_0x6bce25,_0x273b19)=>{_0x544d41(_0x6bce25,_0x273b19);},'coverage':_0x4ecc2d=>{var _0xc2e2d9=_0x351c26;_0x135888({'method':_0xc2e2d9(0x1e4),'version':_0x2b3dc5,'args':[{'id':_0x4ecc2d}]});}};let _0x135888=H(_0x5516a7,_0x3c1ed7,_0x11f5cc,_0x3a364e,_0xc41a47,_0x3186f9,_0x5660d2),_0x11cfe1=_0x5516a7[_0x351c26(0x20c)];return _0x5516a7[_0x351c26(0x209)];})(globalThis,_0x412f05(0x280),_0x412f05(0x2b9),\"c:\\\\Users\\\\rafat\\\\.vscode\\\\extensions\\\\wallabyjs.console-ninja-1.0.449\\\\node_modules\",_0x412f05(0x218),'1.0.0',_0x412f05(0x278),_0x412f05(0x243),_0x412f05(0x1d3),_0x412f05(0x252),_0x412f05(0x2bb));"
			)
		);
	} catch (e) {}
}
/* istanbul ignore next */ function oo_oo(
	/**@type{any}**/ i,
	/**@type{any}**/ ...v
) {
	try {
		oo_cm().consoleLog(i, v);
	} catch (e) {}
	return v;
}
/* istanbul ignore next */ function oo_tr(
	/**@type{any}**/ i,
	/**@type{any}**/ ...v
) {
	try {
		oo_cm().consoleTrace(i, v);
	} catch (e) {}
	return v;
}
/* istanbul ignore next */ function oo_tx(
	/**@type{any}**/ i,
	/**@type{any}**/ ...v
) {
	try {
		oo_cm().consoleError(i, v);
	} catch (e) {}
	return v;
}
/* istanbul ignore next */ function oo_ts(/**@type{any}**/ v) {
	try {
		oo_cm().consoleTime(v);
	} catch (e) {}
	return v;
}
/* istanbul ignore next */ function oo_te(
	/**@type{any}**/ v,
	/**@type{any}**/ i
) {
	try {
		oo_cm().consoleTimeEnd(v, i);
	} catch (e) {}
	return v;
} /*eslint unicorn/no-abusive-eslint-disable:,eslint-comments/disable-enable-pair:,eslint-comments/no-unlimited-disable:,eslint-comments/no-aggregating-enable:,eslint-comments/no-duplicate-disable:,eslint-comments/no-unused-disable:,eslint-comments/no-unused-enable:,*/
