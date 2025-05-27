/**
 * Enhanced Soil Calculation Service for Advanced Visualizations
 * Extends the base SoilCalculationService with regional data and visualization support
 *
 * @format
 */

const SoilCalculationService = require("./soilCalculationService");

class EnhancedSoilCalculationService extends SoilCalculationService {
	/**
	 * Generate moisture-tension curve data points for visualization
	 * @param {number} sand - Sand percentage (0-100)
	 * @param {number} clay - Clay percentage (0-100)
	 * @param {number} om - Organic matter percentage (0-8)
	 * @param {number} densityFactor - Density factor (0.9-1.2)
	 * @param {string} regionId - Optional region ID for adjustments
	 * @returns {Array} Array of {tension, moisture} objects
	 */
	static generateMoistureTensionCurve(
		sand,
		clay,
		om = 2.5,
		densityFactor = 1.0,
		regionId = null
	) {
		// Standard tension points for moisture characteristic curve (kPa)
		const tensionPoints = [0, 1, 3, 5, 10, 20, 33, 100, 300, 500, 1000, 1500];
		const curveData = [];

		// Calculate moisture content at each tension using Saxton & Rawls with extensions
		for (const tension of tensionPoints) {
			const moistureContent = this.calculateMoistureAtTension(
				sand,
				clay,
				om,
				densityFactor,
				tension,
				regionId
			);

			curveData.push({
				tension,
				moistureContent: parseFloat(moistureContent.toFixed(2)),
				tensionLog: Math.log10(tension || 0.1), // For log-scale plotting
			});
		}

		return curveData;
	}

	/**
	 * Calculate moisture content at specific tension
	 * Enhanced Saxton & Rawls with Van Genuchten parameters
	 */
	static calculateMoistureAtTension(
		sand,
		clay,
		om,
		densityFactor,
		tension,
		regionId = null
	) {
		// Convert to decimal fractions
		const S = sand / 100;
		const C = clay / 100;
		const OM = om / 100;

		// Base Saxton & Rawls calculations
		let theta;

		if (tension <= 33) {
			// Field capacity range - use Saxton & Rawls equation
			const theta33t =
				-0.251 * S +
				0.195 * C +
				0.011 * OM +
				0.006 * (S * OM) -
				0.027 * (C * OM) +
				0.452 * (S * C) +
				0.299;

			// Interpolate between saturation and field capacity
			const thetaS =
				this.calculateSaturation(sand, clay, om, densityFactor) / 100;
			const ratio = Math.min(tension / 33, 1);
			theta = thetaS - (thetaS - theta33t) * Math.pow(ratio, 0.5);
		} else if (tension <= 1500) {
			// Between field capacity and wilting point
			const theta33t =
				-0.251 * S +
				0.195 * C +
				0.011 * OM +
				0.006 * (S * OM) -
				0.027 * (C * OM) +
				0.452 * (S * C) +
				0.299;

			const theta1500t =
				-0.024 * S +
				0.487 * C +
				0.006 * OM +
				0.005 * (S * OM) -
				0.013 * (C * OM) +
				0.068 * (S * C) +
				0.031;

			// Logarithmic interpolation
			const logRatio = Math.log(tension / 33) / Math.log(1500 / 33);
			theta = theta33t - (theta33t - theta1500t) * logRatio;
		} else {
			// Beyond wilting point - exponential decay
			const theta1500t =
				-0.024 * S +
				0.487 * C +
				0.006 * OM +
				0.005 * (S * OM) -
				0.013 * (C * OM) +
				0.068 * (S * C) +
				0.031;

			const decayFactor = Math.exp(-(tension - 1500) / 3000);
			theta = theta1500t * decayFactor;
		}

		// Apply density adjustment
		theta *= densityFactor;

		// Apply regional adjustments if available
		if (regionId) {
			theta = this.applyRegionalMoistureAdjustment(theta, tension, regionId);
		}

		return Math.max(0, theta * 100); // Convert to percentage
	}

	/**
	 * Calculate saturation for moisture curve
	 */
	static calculateSaturation(sand, clay, om, densityFactor) {
		const S = sand / 100;
		const C = clay / 100;
		const OM = om / 100;

		const thetaS = 0.332 - 7.251e-4 * S + 0.1276 * Math.log10(C);
		return Math.min(60, Math.max(25, thetaS * 100 * densityFactor));
	}

	/**
	 * Generate 3D soil profile data for visualization
	 * @param {number} sand - Sand percentage
	 * @param {number} clay - Clay percentage
	 * @param {number} om - Organic matter percentage
	 * @param {number} densityFactor - Density factor
	 * @param {number} maxDepth - Maximum depth in cm (default 100)
	 * @returns {Object} 3D profile data structure
	 */ static calculateSoilProfile3D(
		sand,
		clay,
		om = 2.5,
		densityFactor = 1.0,
		maxDepth = 100
	) {
		const profileData = {
			horizons: [],
			rootZone: {},
			waterZones: {},
			textureProfile: [],
			maxDepth: maxDepth,
			summary: {},
		};

		// Define typical soil horizons
		const horizons = [
			{
				name: "O",
				depthStart: 0,
				depthEnd: 5,
				omMultiplier: 3.0,
				description: "Organic Layer",
			},
			{
				name: "A",
				depthStart: 5,
				depthEnd: 25,
				omMultiplier: 1.5,
				description: "Topsoil",
			},
			{
				name: "B",
				depthStart: 25,
				depthEnd: 60,
				omMultiplier: 0.8,
				description: "Subsoil",
			},
			{
				name: "C",
				depthStart: 60,
				depthEnd: maxDepth,
				omMultiplier: 0.3,
				description: "Parent Material",
			},
		];

		// Calculate properties for each horizon
		horizons.forEach((horizon) => {
			const horizonOM = Math.max(0.5, om * horizon.omMultiplier);
			const horizonDensity =
				densityFactor + (horizon.depthStart / maxDepth) * 0.2; // Increase density with depth

			const horizonProps = this.calculateWaterCharacteristics(
				sand,
				clay,
				horizonOM,
				horizonDensity
			);

			profileData.horizons.push({
				...horizon,
				organicMatter: horizonOM,
				bulkDensity: horizonDensity,
				properties: horizonProps,
				thickness: horizon.depthEnd - horizon.depthStart,
			});
		});

		// Calculate root zone characteristics (0-30cm typically)
		const rootZoneDepth = Math.min(30, maxDepth);
		profileData.rootZone = {
			depth: rootZoneDepth,
			averageFC: this.calculateDepthWeightedAverage(
				profileData.horizons,
				"fieldCapacity",
				rootZoneDepth
			),
			averageWP: this.calculateDepthWeightedAverage(
				profileData.horizons,
				"wiltingPoint",
				rootZoneDepth
			),
			averagePAW: this.calculateDepthWeightedAverage(
				profileData.horizons,
				"plantAvailableWater",
				rootZoneDepth
			),
			restrictiveLayer: this.findRestrictiveLayer(
				profileData.horizons,
				rootZoneDepth
			),
		};

		// Generate water zones for visualization
		profileData.waterZones = this.calculateWaterZones(profileData.horizons);
		// Create texture profile for 3D visualization
		profileData.textureProfile = this.generateTextureProfile(
			sand,
			clay,
			om,
			maxDepth
		);

		// Create summary for easy access
		profileData.summary = {
			totalDepth: maxDepth,
			rootZoneDepth: rootZoneDepth,
			numberOfHorizons: profileData.horizons.length,
			averageFieldCapacity: profileData.rootZone.averageFC,
			averageWiltingPoint: profileData.rootZone.averageWP,
			averagePlantAvailableWater: profileData.rootZone.averagePAW,
		};

		return profileData;
	}

	/**
	 * Calculate depth-weighted average of a property
	 */
	static calculateDepthWeightedAverage(horizons, property, maxDepth) {
		let totalValue = 0;
		let totalDepth = 0;

		horizons.forEach((horizon) => {
			const effectiveDepth =
				Math.min(horizon.depthEnd, maxDepth) - horizon.depthStart;
			if (effectiveDepth > 0) {
				totalValue += parseFloat(horizon.properties[property]) * effectiveDepth;
				totalDepth += effectiveDepth;
			}
		});

		return totalDepth > 0 ? (totalValue / totalDepth).toFixed(1) : 0;
	}

	/**
	 * Generate seasonal variation data
	 * @param {Object} baseResults - Base soil calculation results
	 * @param {string} regionId - Region identifier
	 * @returns {Object} Seasonal variation data
	 */
	static calculateSeasonalVariation(baseResults, regionId = null) {
		const seasons = ["spring", "summer", "fall", "winter"];
		const seasonalData = {};

		// Base seasonal adjustment factors
		const seasonalFactors = {
			spring: { fcMultiplier: 1.15, temperature: 10, freezeThaw: true },
			summer: { fcMultiplier: 0.85, temperature: 25, evaporation: 1.5 },
			fall: { fcMultiplier: 1.1, temperature: 15, preparation: true },
			winter: { fcMultiplier: 1.0, temperature: 0, frozen: true },
		};

		// Apply regional modifications if available
		if (regionId) {
			// This would fetch regional data from database
			// For now, use default factors
		}

		seasons.forEach((season) => {
			const factors = seasonalFactors[season];

			seasonalData[season] = {
				fieldCapacity: (
					parseFloat(baseResults.fieldCapacity) * factors.fcMultiplier
				).toFixed(1),
				wiltingPoint: baseResults.wiltingPoint, // Generally stable
				plantAvailableWater: (
					parseFloat(baseResults.plantAvailableWater) * factors.fcMultiplier
				).toFixed(1),
				averageTemperature: factors.temperature,
				managementNotes: this.getSeasonalManagementNotes(season, factors),
			};
		});

		return seasonalData;
	}

	/**
	 * Compare multiple soil analyses for visualization
	 * @param {Array} analysisArray - Array of analysis objects
	 * @param {string} comparisonType - Type of comparison ('temporal', 'spatial', 'treatment')
	 * @returns {Object} Comparison results and visualization data
	 */
	static performComparativeAnalysis(analysisArray, comparisonType = "general") {
		if (!Array.isArray(analysisArray) || analysisArray.length < 2) {
			throw new Error("At least two analyses required for comparison");
		}

		const comparison = {
			type: comparisonType,
			analysisCount: analysisArray.length,
			statistics: {},
			trends: {},
			recommendations: [],
			chartData: {},
		};

		// Calculate statistics for key parameters
		const parameters = [
			"fieldCapacity",
			"wiltingPoint",
			"plantAvailableWater",
			"saturation",
			"saturatedConductivity",
		];

		parameters.forEach((param) => {
			const values = analysisArray.map((analysis) =>
				parseFloat(analysis[param])
			);

			comparison.statistics[param] = {
				min: Math.min(...values),
				max: Math.max(...values),
				average: values.reduce((a, b) => a + b) / values.length,
				range: Math.max(...values) - Math.min(...values),
				variability: this.calculateVariability(values),
			};
		});
		// Generate trend analysis based on comparison type
		if (comparisonType === "temporal") {
			comparison.trends = this.analyzeTemporalTrends(analysisArray);
		} else if (comparisonType === "spatial") {
			comparison.trends = this.analyzeSpatialTrends(analysisArray);
		}

		// Generate chart data for visualization
		comparison.chartData = this.generateComparisonChartData(
			analysisArray,
			parameters
		);

		// Generate recommendations based on comparison
		comparison.recommendations = this.generateComparisonRecommendations(
			comparison.statistics,
			comparisonType
		);

		return comparison;
	}

	/**
	 * Apply regional adjustments to moisture calculations
	 */
	static applyRegionalMoistureAdjustment(moisture, tension, regionId) {
		// This would fetch regional adjustment factors from database
		// For now, return unchanged
		return moisture;
	}

	/**
	 * Calculate water zones for 3D visualization
	 */
	static calculateWaterZones(horizons) {
		return {
			saturatedZone: { color: "#0066CC", description: "Saturated Water" },
			fieldCapacityZone: {
				color: "#66B2FF",
				description: "Plant Available Water",
			},
			wiltingPointZone: { color: "#FFB366", description: "Hygroscopic Water" },
			dryZone: { color: "#CC6600", description: "Air-filled Pores" },
		};
	}

	/**
	 * Generate texture profile for 3D visualization
	 */
	static generateTextureProfile(sand, clay, om, maxDepth) {
		const profile = [];
		const depthIntervals = Math.min(maxDepth / 5, 10); // 5cm intervals up to 10 intervals

		for (let depth = 0; depth < maxDepth; depth += depthIntervals) {
			// Simulate slight changes with depth
			const depthFactor = depth / maxDepth;
			const adjustedClay = clay * (1 + depthFactor * 0.1); // Slight clay increase with depth
			const adjustedSand = sand * (1 - depthFactor * 0.05); // Slight sand decrease with depth
			const adjustedOM = om * Math.max(0.1, 1 - depthFactor * 2); // OM decreases significantly with depth

			profile.push({
				depth,
				sand: Math.max(0, Math.min(100, adjustedSand)),
				clay: Math.max(0, Math.min(100, adjustedClay)),
				silt: Math.max(0, 100 - adjustedSand - adjustedClay),
				organicMatter: Math.max(0.1, adjustedOM),
				textureClass: this.determineSoilTextureClass(
					adjustedSand,
					adjustedClay
				),
			});
		}

		return profile;
	}

	/**
	 * Calculate variability coefficient
	 */
	static calculateVariability(values) {
		const mean = values.reduce((a, b) => a + b) / values.length;
		const variance =
			values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
			values.length;
		const stdDev = Math.sqrt(variance);
		return {
			standardDeviation: stdDev.toFixed(2),
			coefficientOfVariation: ((stdDev / mean) * 100).toFixed(1),
		};
	}

	/**
	 * Generate seasonal management notes
	 */
	static getSeasonalManagementNotes(season, factors) {
		const notes = {
			spring:
				"Monitor soil temperature and moisture for optimal planting conditions.",
			summer: "Increased irrigation needs due to higher evapotranspiration.",
			fall: "Prepare soil for winter, consider cover crops.",
			winter: "Protect soil from erosion, avoid compaction when frozen.",
		};

		return notes[season] || "Standard soil management practices apply.";
	}

	/**
	 * Generate comparison chart data
	 */
	static generateComparisonChartData(analysisArray, parameters) {
		const chartData = {
			radarChart: {},
			barChart: {},
			timeSeriesChart: {},
		};

		// Radar chart data for multi-parameter comparison
		chartData.radarChart = {
			datasets: analysisArray.map((analysis, index) => ({
				label: analysis.name || `Analysis ${index + 1}`,
				data: parameters.map((param) => parseFloat(analysis[param])),
				borderColor: this.generateChartColor(index),
				backgroundColor: this.generateChartColor(index, 0.2),
			})),
			labels: parameters.map((param) => this.formatParameterLabel(param)),
		};

		return chartData;
	}

	/**
	 * Generate chart colors
	 */
	static generateChartColor(index, alpha = 1) {
		const colors = [
			`rgba(255, 99, 132, ${alpha})`,
			`rgba(54, 162, 235, ${alpha})`,
			`rgba(255, 205, 86, ${alpha})`,
			`rgba(75, 192, 192, ${alpha})`,
			`rgba(153, 102, 255, ${alpha})`,
		];
		return colors[index % colors.length];
	}

	/**
	 * Format parameter labels for charts
	 */
	static formatParameterLabel(param) {
		const labels = {
			fieldCapacity: "Field Capacity (%)",
			wiltingPoint: "Wilting Point (%)",
			plantAvailableWater: "Available Water (%)",
			saturation: "Saturation (%)",
			saturatedConductivity: "Hydraulic Conductivity",
		};
		return labels[param] || param;
	}

	/**
	 * Generate comparison recommendations
	 */
	static generateComparisonRecommendations(statistics, comparisonType) {
		const recommendations = [];

		// Check for high variability
		Object.keys(statistics).forEach((param) => {
			const cv = parseFloat(
				statistics[param].variability.coefficientOfVariation
			);
			if (cv > 20) {
				recommendations.push({
					priority: "medium",
					parameter: param,
					message: `High variability detected in ${this.formatParameterLabel(
						param
					)} (CV: ${cv}%). Consider investigating causes.`,
					action: "Further analysis recommended",
				});
			}
		});

		return recommendations;
	}

	/**
	 * Find restrictive layers in soil profile
	 */
	static findRestrictiveLayer(horizons, rootZoneDepth) {
		for (const horizon of horizons) {
			if (horizon.depthStart < rootZoneDepth) {
				const ksat = parseFloat(horizon.properties.saturatedConductivity);
				if (ksat < 2) {
					// Very slow drainage
					return {
						depth: horizon.depthStart,
						type: "low_permeability",
						severity: ksat < 0.5 ? "high" : "moderate",
						description: `Restrictive layer at ${horizon.depthStart}cm depth`,
					};
				}
			}
		}
		return null;
	}

	/**
	 * Analyze temporal trends in soil data
	 */
	static analyzeTemporalTrends(analysisArray) {
		if (analysisArray.length < 2) return null;

		// Sort by date if available
		const sortedData = analysisArray.sort((a, b) => {
			const dateA = a.createdAt ? new Date(a.createdAt) : new Date();
			const dateB = b.createdAt ? new Date(b.createdAt) : new Date();
			return dateA - dateB;
		});

		const trends = {};
		const parameters = ["fieldCapacity", "wiltingPoint", "plantAvailableWater"];

		parameters.forEach((param) => {
			const values = sortedData
				.map((analysis) => analysis[param])
				.filter((v) => v !== undefined);
			if (values.length > 1) {
				const firstValue = values[0];
				const lastValue = values[values.length - 1];
				const change = lastValue - firstValue;
				const percentChange = (change / firstValue) * 100;

				trends[param] = {
					direction:
						change > 0 ? "increasing" : change < 0 ? "decreasing" : "stable",
					change: change,
					percentChange: percentChange.toFixed(1),
					significance: Math.abs(percentChange) > 5 ? "significant" : "minor",
				};
			}
		});

		return trends;
	}

	/**
	 * Analyze spatial trends in soil data
	 */
	static analyzeSpatialTrends(analysisArray) {
		const spatialData = analysisArray.filter(
			(analysis) =>
				analysis.enhancedAnalysis?.latitude &&
				analysis.enhancedAnalysis?.longitude
		);

		if (spatialData.length < 2) return null;

		// Basic spatial analysis
		const latitudes = spatialData.map((a) => a.enhancedAnalysis.latitude);
		const longitudes = spatialData.map((a) => a.enhancedAnalysis.longitude);

		const centerLat =
			latitudes.reduce((sum, lat) => sum + lat, 0) / latitudes.length;
		const centerLon =
			longitudes.reduce((sum, lon) => sum + lon, 0) / longitudes.length;

		return {
			centerPoint: { latitude: centerLat, longitude: centerLon },
			spread: {
				latRange: Math.max(...latitudes) - Math.min(...latitudes),
				lonRange: Math.max(...longitudes) - Math.min(...longitudes),
			},
			sampleCount: spatialData.length,
		};
	}

	/**
	 * Generate chart data for comparative analysis
	 */
	static generateComparisonChartData(analysisArray, parameters) {
		const chartData = [];

		parameters.forEach((param) => {
			const values = analysisArray.map((analysis, index) => ({
				x: index + 1,
				y: analysis[param],
				label: analysis.textureClass || `Sample ${index + 1}`,
			}));

			chartData.push({
				label: param
					.replace(/([A-Z])/g, " $1")
					.replace(/^./, (str) => str.toUpperCase()),
				data: values,
				parameter: param,
			});
		});

		return chartData;
	}

	/**
	 * Generate recommendations based on comparison results
	 */
	static generateComparisonRecommendations(statistics, comparisonType) {
		const recommendations = [];

		Object.entries(statistics).forEach(([param, stats]) => {
			if (stats.variability > 0.2) {
				// High variability threshold
				recommendations.push({
					parameter: param,
					type: "variability",
					message: `High variability detected in ${param}. Consider site-specific management.`,
					priority: "medium",
				});
			}

			if (stats.average < 15 && param === "plantAvailableWater") {
				recommendations.push({
					parameter: param,
					type: "low_value",
					message:
						"Low plant available water. Consider organic matter enhancement.",
					priority: "high",
				});
			}
		});

		return recommendations;
	}

	/**
	 * Calculate statistical variability
	 */
	static calculateVariability(values) {
		if (values.length < 2) return 0;

		const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
		const variance =
			values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
			values.length;
		const stdDev = Math.sqrt(variance);

		return mean > 0 ? stdDev / mean : 0; // Coefficient of variation
	}
}

module.exports = EnhancedSoilCalculationService;
