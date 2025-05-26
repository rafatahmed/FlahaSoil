/**
 * FlahaSoil - Server-Side Soil Analysis Utilities
 * All calculations are now performed server-side using the complete Saxton & Rawls (2006) system
 * 
 * This file contains only utility functions for client-side operations.
 * All soil water characteristic calculations are handled by the FlahaSoil API.
 * 
 * Reference: Saxton, K. E., & Rawls, W. J. (2006). Soil Water Characteristic Estimates 
 * by Texture and Organic Matter for Hydrologic Solutions. SSSA Journal, 70(5), 1569-1578.
 */

/**
 * Input validation for soil parameters
 * @param {Object} params - Input parameters
 * @returns {boolean} True if valid, false otherwise
 */
function validateInputs(params) {
    const { sand, clay, organicMatter, densityFactor, gravelContent, electricalConductivity } = params;
    
    // Basic range validation
    if (sand < 0 || sand > 100) return false;
    if (clay < 0 || clay > 60) return false; // Exclude >60% as per Saxton & Rawls methodology
    if (sand + clay > 100) return false;
    if (organicMatter < 0 || organicMatter > 8) return false; // Exclude >8% as per methodology
    if (densityFactor < 0.9 || densityFactor > 1.8) return false; // Exclude extremes
    if (gravelContent < 0 || gravelContent > 80) return false;
    if (electricalConductivity < 0 || electricalConductivity > 20) return false;
    
    return true;
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
 * Classify soil drainage based on saturated hydraulic conductivity
 * @param {number} KS - Saturated hydraulic conductivity (mm/hr)
 * @returns {string} Drainage classification
 */
function classifyDrainage(KS) {
    if (KS < 0.1) return 'Very Poorly Drained';
    if (KS < 1) return 'Poorly Drained';
    if (KS < 10) return 'Moderately Drained';
    if (KS < 100) return 'Well Drained';
    return 'Excessively Drained';
}

/**
 * Assess compaction risk
 * @param {number} density - Bulk density (g/cm³)
 * @param {number} fieldCapacity - Field capacity (decimal)
 * @returns {string} Compaction risk level
 */
function assessCompactionRisk(density, fieldCapacity) {
    const compactionIndex = density + (1 - fieldCapacity);
    
    if (compactionIndex > 2.0) return 'High Risk';
    if (compactionIndex > 1.7) return 'Moderate Risk';
    return 'Low Risk';
}

/**
 * Assess erosion risk
 * @param {number} sand - Sand percentage
 * @param {number} clay - Clay percentage
 * @param {number} organicMatter - Organic matter percentage
 * @param {number} KS - Saturated hydraulic conductivity
 * @returns {string} Erosion risk level
 */
function assessErosionRisk(sand, clay, organicMatter, KS) {
    // Higher sand and lower OM/clay increase erosion risk
    const erosionIndex = (sand / 100) - (clay / 100) * 0.5 - (organicMatter / 100) * 2 + (KS / 1000);
    
    if (erosionIndex > 0.8) return 'High Risk';
    if (erosionIndex > 0.4) return 'Moderate Risk';
    return 'Low Risk';
}

/**
 * Backward compatibility function - now redirects to API
 * @param {number} sand - Sand percentage (0-100)
 * @param {number} clay - Clay percentage (0-100)
 * @param {number} om - Organic matter percentage (0-8)
 * @param {number} densityFactor - Density factor (0.9-1.8)
 * @returns {Object} Error message directing to use API
 */
function calculateSoilWaterCharacteristics(sand, clay, om, densityFactor = 1.3) {
    return {
        error: "Client-side calculations have been disabled. Please use the FlahaSoil API for all soil analysis.",
        message: "All calculations are now performed server-side for enhanced accuracy and security.",
        textureClass: determineSoilTextureClass(sand, clay)
    };
}

// Export functions for use in main.js
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        calculateSoilWaterCharacteristics,
        determineSoilTextureClass,
        validateInputs,
        classifyDrainage,
        assessCompactionRisk,
        assessErosionRisk
    };
}
