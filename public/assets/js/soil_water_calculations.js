// Enhanced soil water characteristic calculations based on Saxton & Rawls (2006)
// Incorporates organic matter and density effects from provided tables

/**
 * Calculate soil water characteristics based on sand, clay, organic matter, and density factor
 * @param {number} sand - Sand percentage (0-100)
 * @param {number} clay - Clay percentage (0-100)
 * @param {number} om - Organic matter percentage (0-8)
 * @param {number} densityFactor - Density factor (0.9-1.2)
 * @returns {object} Object containing field capacity, wilting point, plant available water, and other characteristics
 */
function calculateSoilWaterCharacteristics(sand, clay, om, densityFactor = 1.0) {
    // Calculate silt percentage
    const silt = 100 - sand - clay;
    
    // Convert percentages to decimal fractions
    const S = sand / 100;
    const C = clay / 100;
    const Si = silt / 100;
    const OM = om / 100;
    
    // Determine texture class for adjustments
    const textureClass = determineSoilTextureClass(sand, clay);
    
    // Base calculations from Saxton & Rawls (2006)
    
    // Calculate field capacity (33 kPa)
    const theta33t = -0.251 * S + 0.195 * C + 0.011 * OM + 
                     0.006 * (S * OM) - 0.027 * (C * OM) + 
                     0.452 * (S * C) + 0.299;
    
    let theta33 = theta33t + (1.283 * Math.pow(theta33t, 2) - 0.374 * theta33t - 0.015);
    
    // Calculate wilting point (1500 kPa)
    const theta1500t = -0.024 * S + 0.487 * C + 0.006 * OM + 
                       0.005 * (S * OM) - 0.013 * (C * OM) + 
                       0.068 * (S * C) + 0.031;
    
    let theta1500 = theta1500t + (0.14 * theta1500t - 0.02);
    
    // Calculate saturation
    const thetaS = 0.278 * S + 0.034 * C + 0.022 * OM - 
                  0.018 * (S * OM) - 0.027 * (C * OM) - 
                  0.584 * (S * C) + 0.078;
    
    let thetaSat = thetaS + (0.636 * thetaS - 0.107);
    
    // Calculate saturated hydraulic conductivity (mm/hr)
    const B = Math.log(1500) - Math.log(33);
    const lambda = 1 / B;
    
    let Ksat = 1930 * Math.pow(thetaSat - theta33, 3 - lambda);
    
    // Apply organic matter adjustments based on Table 3
    // Interpolate between values in the table based on OM percentage
    theta33 = applyOrganicMatterAdjustment(theta33, om, textureClass, "FC");
    theta1500 = applyOrganicMatterAdjustment(theta1500, om, textureClass, "WP");
    thetaSat = applyOrganicMatterAdjustment(thetaSat, om, textureClass, "SAT");
    
    // Apply density factor adjustments based on Table 5
    // Interpolate between values in the table based on density factor
    theta33 = applyDensityAdjustment(theta33, densityFactor, textureClass, "FC");
    theta1500 = applyDensityAdjustment(theta1500, densityFactor, textureClass, "WP");
    thetaSat = applyDensityAdjustment(thetaSat, densityFactor, textureClass, "SAT");
    Ksat = applyDensityAdjustment(Ksat, densityFactor, textureClass, "KS");
    
    // Calculate plant available water
    const PAW = theta33 - theta1500;
    
    // Return results as percentages for display
    return {
        fieldCapacity: (theta33 * 100).toFixed(2),
        wiltingPoint: (theta1500 * 100).toFixed(2),
        saturation: (thetaSat * 100).toFixed(2),
        plantAvailableWater: (PAW * 100).toFixed(2),
        saturatedConductivity: Ksat.toFixed(2),
        textureClass: textureClass
    };
}

/**
 * Determine soil texture class based on sand and clay percentages
 * @param {number} sand - Sand percentage (0-100)
 * @param {number} clay - Clay percentage (0-100)
 * @returns {string} Soil texture class
 */
function determineSoilTextureClass(sand, clay) {
    // Calculate silt percentage
    const silt = 100 - sand - clay;
    
    // Check boundaries for each texture class
    // These boundaries are simplified and should be replaced with the exact polygon checks
    
    if (clay >= 40) {
        if (sand > 45) return "Sandy Clay";
        if (silt > 40) return "Silty Clay";
        return "Clay";
    }
    
    if (clay >= 27) {
        if (sand > 45) return "Sandy Clay Loam";
        if (silt > 40) return "Silty Clay Loam";
        return "Clay Loam";
    }
    
    if (clay < 12 && silt < 50) {
        if (sand >= 85) return "Sand";
        return "Loamy Sand";
    }
    
    if (clay < 27 && sand > 52) return "Sandy Loam";
    
    if (clay < 12 && silt >= 80) return "Silt";
    
    if (silt >= 50) return "Silty Loam";
    
    return "Loam";
}

/**
 * Apply organic matter adjustment to soil water characteristic
 * @param {number} value - Original value
 * @param {number} om - Organic matter percentage
 * @param {string} textureClass - Soil texture class
 * @param {string} property - Property to adjust (FC, WP, SAT)
 * @returns {number} Adjusted value
 */
function applyOrganicMatterAdjustment(value, om, textureClass, property) {
    // Table 3 data (simplified for demonstration)
    const omTable = {
        "Sandy Loam": {
            "OM": [0.5, 2.5, 5.0, 7.5],
            "WP": [0.06, 0.08, 0.10, 0.13],
            "FC": [0.15, 0.18, 0.22, 0.26],
            "SAT": [0.40, 0.45, 0.52, 0.59],
            "PAW": [0.09, 0.10, 0.11, 0.13],
            "KS": [37.6, 48.8, 65.9, 86.9]
        },
        "Silty Loam": {
            "OM": [0.5, 2.5, 5.0, 7.5],
            "WP": [0.13, 0.14, 0.15, 0.16],
            "FC": [0.30, 0.32, 0.35, 0.37],
            "SAT": [0.42, 0.48, 0.56, 0.64],
            "PAW": [0.17, 0.18, 0.20, 0.21],
            "KS": [5.2, 12.1, 26.8, 49.6]
        },
        "Clay Loam": {
            "OM": [0.5, 2.5, 5.0, 7.5],
            "WP": [0.20, 0.21, 0.22, 0.23],
            "FC": [0.33, 0.34, 0.36, 0.38],
            "SAT": [0.43, 0.47, 0.51, 0.56],
            "PAW": [0.13, 0.14, 0.14, 0.15],
            "KS": [2.8, 5.1, 9.1, 14.9]
        }
    };
    
    // Map texture class to closest class in the table
    let tableClass = "Clay Loam";
    if (textureClass.includes("Sand") || textureClass === "Loamy Sand" || textureClass === "Sand") {
        tableClass = "Sandy Loam";
    } else if (textureClass.includes("Silt") || textureClass === "Silt") {
        tableClass = "Silty Loam";
    }
    
    // Map property to table property
    let tableProperty = "FC";
    if (property === "WP") tableProperty = "WP";
    else if (property === "SAT") tableProperty = "SAT";
    else if (property === "KS") tableProperty = "KS";
    
    // Get table data
    const omValues = omTable[tableClass]["OM"];
    const propValues = omTable[tableClass][tableProperty];
    
    // Interpolate based on OM
    // Clamp OM to table range
    const clampedOM = Math.max(omValues[0], Math.min(om, omValues[omValues.length - 1]));
    
    // Find interpolation indices
    let lowerIndex = 0;
    while (lowerIndex < omValues.length - 1 && omValues[lowerIndex + 1] < clampedOM) {
        lowerIndex++;
    }
    
    const upperIndex = Math.min(lowerIndex + 1, omValues.length - 1);
    
    // Interpolate
    if (lowerIndex === upperIndex) {
        return propValues[lowerIndex];
    }
    
    const omLower = omValues[lowerIndex];
    const omUpper = omValues[upperIndex];
    const propLower = propValues[lowerIndex];
    const propUpper = propValues[upperIndex];
    
    const t = (clampedOM - omLower) / (omUpper - omLower);
    
    return propLower + t * (propUpper - propLower);
}

/**
 * Apply density adjustment to soil water characteristic
 * @param {number} value - Original value
 * @param {number} densityFactor - Density factor
 * @param {string} textureClass - Soil texture class
 * @param {string} property - Property to adjust (FC, WP, SAT, KS)
 * @returns {number} Adjusted value
 */
function applyDensityAdjustment(value, densityFactor, textureClass, property) {
    // Table 5 data (simplified for demonstration)
    const densityTable = {
        "Sandy Loam": {
            "DEN": [0.9, 1.0, 1.1, 1.2],
            "WP": [0.08, 0.08, 0.08, 0.08],
            "FC": [0.19, 0.18, 0.17, 0.17],
            "SAT": [0.50, 0.45, 0.39, 0.34],
            "PAW": [0.10, 0.10, 0.09, 0.09],
            "KS": [78.6, 48.8, 27.5, 13.4]
        },
        "Silty Loam": {
            "DEN": [0.9, 1.0, 1.1, 1.2],
            "WP": [0.14, 0.14, 0.14, 0.14],
            "FC": [0.33, 0.32, 0.31, 0.30],
            "SAT": [0.53, 0.48, 0.43, 0.38],
            "PAW": [0.20, 0.18, 0.17, 0.16],
            "KS": [23.1, 12.1, 5.3, 1.6]
        },
        "Clay Loam": {
            "DEN": [0.9, 1.0, 1.1, 1.2],
            "WP": [0.21, 0.21, 0.21, 0.21],
            "FC": [0.35, 0.34, 0.34, 0.33],
            "SAT": [0.52, 0.47, 0.42, 0.36],
            "PAW": [0.14, 0.14, 0.13, 0.12],
            "KS": [12.5, 5.1, 1.4, 0.1]
        }
    };
    
    // Map texture class to closest class in the table
    let tableClass = "Clay Loam";
    if (textureClass.includes("Sand") || textureClass === "Loamy Sand" || textureClass === "Sand") {
        tableClass = "Sandy Loam";
    } else if (textureClass.includes("Silt") || textureClass === "Silt") {
        tableClass = "Silty Loam";
    }
    
    // Map property to table property
    let tableProperty = "FC";
    if (property === "WP") tableProperty = "WP";
    else if (property === "SAT") tableProperty = "SAT";
    else if (property === "KS") tableProperty = "KS";
    
    // Get table data
    const denValues = densityTable[tableClass]["DEN"];
    const propValues = densityTable[tableClass][tableProperty];
    
    // Interpolate based on density factor
    // Clamp density factor to table range
    const clampedDen = Math.max(denValues[0], Math.min(densityFactor, denValues[denValues.length - 1]));
    
    // Find interpolation indices
    let lowerIndex = 0;
    while (lowerIndex < denValues.length - 1 && denValues[lowerIndex + 1] < clampedDen) {
        lowerIndex++;
    }
    
    const upperIndex = Math.min(lowerIndex + 1, denValues.length - 1);
    
    // Interpolate
    if (lowerIndex === upperIndex) {
        return propValues[lowerIndex];
    }
    
    const denLower = denValues[lowerIndex];
    const denUpper = denValues[upperIndex];
    const propLower = propValues[lowerIndex];
    const propUpper = propValues[upperIndex];
    
    const t = (clampedDen - denLower) / (denUpper - denLower);
    
    return propLower + t * (propUpper - propLower);
}

/**
 * Get crop suitability recommendations based on soil properties
 * @param {string} textureClass - Soil texture class
 * @param {number} paw - Plant available water percentage
 * @param {number} om - Organic matter percentage
 * @returns {object} Object containing suitable crops and recommendations
 */
function getCropRecommendations(textureClass, paw, om) {
  // Default recommendations
  let recommendations = {
    suitableCrops: [],
    limitations: [],
    managementTips: []
  };
  
  // Convert textureClass to lowercase for case-insensitive comparison
  const texture = textureClass.toLowerCase();
  
  // Determine suitable crops based on texture class
  if (texture.includes("sand") && !texture.includes("clay")) {
    // Sandy soils
    recommendations.suitableCrops = ["Carrots", "Potatoes", "Radishes", "Peanuts"];
    recommendations.limitations = ["Low water retention", "Low nutrient holding capacity"];
    recommendations.managementTips = ["Frequent irrigation", "Regular organic matter addition", "Split fertilizer applications"];
  } else if (texture.includes("clay")) {
    // Clay soils
    recommendations.suitableCrops = ["Rice", "Wheat", "Cabbage", "Broccoli"];
    recommendations.limitations = ["Poor drainage", "Slow warming in spring", "Compaction risk"];
    recommendations.managementTips = ["Avoid working when wet", "Add organic matter to improve structure", "Consider raised beds"];
  } else if (texture.includes("silt") || texture === "loam") {
    // Silty or loam soils
    recommendations.suitableCrops = ["Corn", "Soybeans", "Most vegetables", "Small grains"];
    recommendations.limitations = ["Possible crusting", "Moderate drainage"];
    recommendations.managementTips = ["Maintain organic matter", "Use cover crops", "Minimal tillage"];
  }
  
  // Adjust based on plant available water
  if (paw < 10) {
    recommendations.limitations.push("Very limited water storage");
    recommendations.managementTips.push("Drip irrigation recommended");
  } else if (paw > 20) {
    recommendations.suitableCrops.push("Water-intensive crops");
  }
  
  // Adjust based on organic matter
  if (om < 2) {
    recommendations.limitations.push("Low organic matter");
    recommendations.managementTips.push("Add compost or manure");
  } else if (om > 5) {
    recommendations.suitableCrops.push("Organic production suitable");
  }
  
  return recommendations;
}

// Export functions for use in main.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateSoilWaterCharacteristics,
        determineSoilTextureClass,
        getCropRecommendations
    };
}

