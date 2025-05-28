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
					this.setAuth(result.token, result.plan, result.usageCount || 0);
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
			console.error("Login failed:", error);
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
			console.error("Registration failed:", error);
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
	logout() {
		this.clearAuth();
		return { success: true };
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
			console.error("Plan upgrade failed:", error);
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
			console.error("Moisture-tension curve error:", error);
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
			console.error("3D profile error:", error);
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
			console.error("Comparative analysis error:", error);
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
			console.error("Real-time adjustment error:", error);
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
			console.error("Regional data error:", error);
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
			console.error("Regions list error:", error);
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
			console.error("Enhanced analysis error:", error);
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
			console.error("Demo moisture-tension curve error:", error);
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
			console.error("Demo 3D profile error:", error);
			return {
				success: false,
				error: "Failed to fetch demo 3D soil profile data.",
			};
		}
	}
}
