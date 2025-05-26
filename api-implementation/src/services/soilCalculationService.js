/**
 * Service for soil water characteristic calculations
 * This moves the core IP-sensitive calculations to the server
 */
class SoilCalculationService {
  /**
   * Calculate soil water characteristics based on sand, clay, organic matter, and density factor
   * @param {number} sand - Sand percentage (0-100)
   * @param {number} clay - Clay percentage (0-100)
   * @param {number} om - Organic matter percentage (0-8)
   * @param {number} densityFactor - Density factor (0.9-1.2)
   * @returns {object} Object containing field capacity, wilting point, plant available water, and other characteristics
   */
  static calculateWaterCharacteristics(sand, clay, om = 2.5, densityFactor = 1.0) {
    // Calculate silt percentage
    const silt = 100 - sand - clay;
    
    // Convert percentages to decimal fractions
    const S = sand / 100;
    const C = clay / 100;
    const OM = om / 100;
    
    // Saxton & Rawls calculations (protected on server)
    const theta33t = -0.251 * S + 0.195 * C + 0.011 * OM + 
                     0.006 * (S * OM) - 0.027 * (C * OM) + 
                     0.452 * (S * C) + 0.299;
    
    const theta1500t = -0.024 * S + 0.487 * C + 0.006 * OM + 
                       0.005 * (S * OM) - 0.013 * (C * OM) + 
                       0.068 * (S * C) + 0.031;
    
    // Density adjustments
    const theta33 = theta33t + (1.283 * Math.pow(theta33t, 2) - 0.374 * theta33t - 0.015);
    const theta1500 = theta1500t + (0.14 * theta1500t - 0.02);
    
    // Adjusted for density factor
    const adjustedTheta33 = theta33 * densityFactor;
    const adjustedTheta1500 = theta1500 * densityFactor;
    
    // Calculate saturation
    const thetaS = 0.7919 + 0.001691 * C - 0.29619 * S - 0.000001491 * Math.pow(S, 2) + 
                  0.0000821 * Math.pow(OM, 2) + 0.02427 * Math.pow(C, -1) + 
                  0.01113 * Math.pow(S, -1) + 0.01472 * Math.log(S) - 
                  0.0000733 * OM * C - 0.000619 * C * S - 0.001183 * OM * S;
    
    // Calculate saturated hydraulic conductivity
    const Ks = 1930 * Math.pow(thetaS - adjustedTheta33, 3);
    
    return {
      fieldCapacity: (adjustedTheta33 * 100).toFixed(1),
      wiltingPoint: (adjustedTheta1500 * 100).toFixed(1),
      plantAvailableWater: ((adjustedTheta33 - adjustedTheta1500) * 100).toFixed(1),
      saturation: (thetaS * 100).toFixed(1),
      saturatedConductivity: Ks.toFixed(1),
      textureClass: this.determineSoilTextureClass(sand, clay)
    };
  }
  
  /**
   * Basic calculation for free tier users
   * @param {number} sand - Sand percentage (0-100)
   * @param {number} clay - Clay percentage (0-100)
   * @returns {object} Object containing basic soil water characteristics
   */
  static calculateBasic(sand, clay) {
    // Simplified calculation for free tier
    const textureClass = this.determineSoilTextureClass(sand, clay);
    
    // Use lookup table for basic estimates
    const basicEstimates = {
      "Sand": { fc: 10, wp: 4, paw: 6, sat: 40, ks: 200 },
      "Loamy Sand": { fc: 12, wp: 5, paw: 7, sat: 42, ks: 150 },
      "Sandy Loam": { fc: 18, wp: 8, paw: 10, sat: 45, ks: 80 },
      "Loam": { fc: 28, wp: 12, paw: 16, sat: 47, ks: 20 },
      "Silt Loam": { fc: 30, wp: 12, paw: 18, sat: 50, ks: 15 },
      "Silt": { fc: 32, wp: 13, paw: 19, sat: 52, ks: 10 },
      "Clay Loam": { fc: 36, wp: 22, paw: 14, sat: 48, ks: 5 },
      "Clay": { fc: 40, wp: 30, paw: 10, sat: 53, ks: 1 }
    };
    
    // Default values if texture not found
    const defaults = { fc: 25, wp: 10, paw: 15, sat: 45, ks: 10 };
    const values = basicEstimates[textureClass] || defaults;
    
    return {
      fieldCapacity: values.fc.toFixed(1),
      wiltingPoint: values.wp.toFixed(1),
      plantAvailableWater: values.paw.toFixed(1),
      saturation: values.sat.toFixed(1),
      saturatedConductivity: values.ks.toFixed(1),
      textureClass: textureClass,
      message: "For advanced calculations, sign up for a free account."
    };
  }
  
  /**
   * Determine soil texture class based on sand and clay percentages
   * @param {number} sand - Sand percentage (0-100)
   * @param {number} clay - Clay percentage (0-100)
   * @returns {string} Soil texture class
   */
  static determineSoilTextureClass(sand, clay) {
    // Calculate silt percentage
    const silt = 100 - sand - clay;
    
    // Simplified texture classification
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
    
    if (clay >= 20) {
      return "Loam";
    }
    
    if (silt >= 80) {
      return "Silt";
    }
    
    if (silt >= 50) {
      return "Silt Loam";
    }
    
    if (sand >= 85) {
      return "Sand";
    }
    
    if (sand >= 70) {
      return "Loamy Sand";
    }
    
    return "Sandy Loam";
  }
}

module.exports = SoilCalculationService;