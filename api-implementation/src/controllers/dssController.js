const { PrismaClient } = require('@prisma/client');
const DSSCalculationService = require('../services/dssCalculationService');

const prisma = new PrismaClient();

class DSSController {
    /**
     * Get all available crops for DSS
     */
    async getCrops(req, res) {
        try {
            const crops = await prisma.crop.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    scientificName: true,
                    type: true,
                    category: true,
                    growthPeriodMin: true,
                    growthPeriodMax: true,
                    rootDepthMax: true,
                    climateZones: true,
                    soilPreferences: true
                },
                orderBy: { name: 'asc' }
            });

            // Parse JSON fields
            const cropsWithParsedData = crops.map(crop => ({
                ...crop,
                climateZones: crop.climateZones ? JSON.parse(crop.climateZones) : [],
                soilPreferences: crop.soilPreferences ? JSON.parse(crop.soilPreferences) : {}
            }));

            res.json({
                success: true,
                data: cropsWithParsedData,
                count: cropsWithParsedData.length
            });
        } catch (error) {
            console.error('Error fetching crops:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch crops',
                details: error.message
            });
        }
    }

    /**
     * Get BBCH stages for a specific crop
     */
    async getCropStages(req, res) {
        try {
            const { cropId } = req.params;

            const stages = await prisma.bBCHStage.findMany({
                where: { cropId },
                orderBy: { stageCode: 'asc' }
            });

            if (stages.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'No stages found for this crop'
                });
            }

            res.json({
                success: true,
                data: stages,
                count: stages.length
            });
        } catch (error) {
            console.error('Error fetching crop stages:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch crop stages',
                details: error.message
            });
        }
    }

    /**
     * Get Kc coefficients for a specific crop
     */
    async getCropKc(req, res) {
        try {
            const { cropId } = req.params;
            const { climateZone = 'temperate', irrigationMethod = 'sprinkler' } = req.query;

            const kcPeriods = await prisma.kcPeriod.findMany({
                where: {
                    cropId,
                    climateZone,
                    irrigationMethod
                },
                orderBy: { periodStartDays: 'asc' }
            });

            if (kcPeriods.length === 0) {
                // Fallback to default values if specific combination not found
                const fallbackKc = await prisma.kcPeriod.findMany({
                    where: { cropId },
                    orderBy: { periodStartDays: 'asc' },
                    take: 4 // Get first 4 periods as fallback
                });

                return res.json({
                    success: true,
                    data: fallbackKc,
                    count: fallbackKc.length,
                    note: 'Using fallback Kc values - specific climate/irrigation combination not available'
                });
            }

            res.json({
                success: true,
                data: kcPeriods,
                count: kcPeriods.length
            });
        } catch (error) {
            console.error('Error fetching crop Kc:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch crop Kc coefficients',
                details: error.message
            });
        }
    }

    /**
     * Calculate irrigation recommendations
     */
    async calculateIrrigation(req, res) {
        try {
            const {
                soilAnalysisId,
                cropId,
                fieldArea,
                fieldSlope,
                fieldElevation,
                et0Value,
                weatherSource = 'manual',
                climateZone = 'temperate',
                irrigationMethod = 'sprinkler',
                growthStage = 'mid'
            } = req.body;

            // Validate required fields
            if (!soilAnalysisId || !cropId || !fieldArea) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: soilAnalysisId, cropId, fieldArea'
                });
            }

            // Get soil analysis data
            const soilAnalysis = await prisma.soilAnalysis.findUnique({
                where: { id: soilAnalysisId }
            });

            if (!soilAnalysis) {
                return res.status(404).json({
                    success: false,
                    error: 'Soil analysis not found'
                });
            }

            // Get crop data
            const crop = await prisma.crop.findUnique({
                where: { id: cropId },
                include: {
                    kcPeriods: {
                        where: {
                            climateZone,
                            irrigationMethod
                        }
                    }
                }
            });

            if (!crop) {
                return res.status(404).json({
                    success: false,
                    error: 'Crop not found'
                });
            }

            // Perform DSS calculations
            const calculationService = new DSSCalculationService();
            const results = await calculationService.calculateIrrigationRecommendations({
                soilData: soilAnalysis,
                cropData: crop,
                fieldConfig: {
                    area: fieldArea,
                    slope: fieldSlope,
                    elevation: fieldElevation
                },
                environmentalData: {
                    et0: et0Value,
                    climateZone,
                    irrigationMethod,
                    growthStage
                }
            });

            // Save calculation to database
            const savedCalculation = await prisma.dSSCalculation.create({
                data: {
                    userId: req.user?.id,
                    soilAnalysisId,
                    cropId,
                    fieldArea,
                    fieldSlope,
                    fieldElevation,
                    et0Value,
                    weatherSource,
                    climateZone,
                    etcCalculated: results.etcCalculated,
                    irrigationDepth: results.irrigationDepth,
                    irrigationFrequency: results.irrigationFrequency,
                    maxApplicationRate: results.maxApplicationRate,
                    systemRecommendation: results.systemRecommendation,
                    systemEfficiency: results.systemEfficiency,
                    systemCost: results.systemCost,
                    economicROI: results.economicROI,
                    paybackPeriod: results.paybackPeriod,
                    annualWaterSavings: results.annualWaterSavings,
                    annualCostSavings: results.annualCostSavings,
                    calculationMethod: 'fao56',
                    calculationVersion: '1.0',
                    detailedResults: JSON.stringify(results.detailedResults),
                    recommendations: JSON.stringify(results.recommendations),
                    scheduleData: JSON.stringify(results.scheduleData)
                }
            });

            res.json({
                success: true,
                data: {
                    calculationId: savedCalculation.id,
                    ...results
                }
            });

        } catch (error) {
            console.error('Error calculating irrigation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to calculate irrigation recommendations',
                details: error.message
            });
        }
    }

    /**
     * Get DSS calculation history for a user
     */
    async getCalculationHistory(req, res) {
        try {
            const userId = req.user?.id;
            const { page = 1, limit = 10 } = req.query;

            const calculations = await prisma.dSSCalculation.findMany({
                where: { userId },
                include: {
                    crop: {
                        select: { name: true, type: true }
                    },
                    soilAnalysis: {
                        select: { textureClass: true, createdAt: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: parseInt(limit)
            });

            const total = await prisma.dSSCalculation.count({
                where: { userId }
            });

            res.json({
                success: true,
                data: calculations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('Error fetching calculation history:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch calculation history',
                details: error.message
            });
        }
    }

    /**
     * Get a specific DSS calculation by ID
     */
    async getCalculation(req, res) {
        try {
            const { calculationId } = req.params;
            const userId = req.user?.id;

            const calculation = await prisma.dSSCalculation.findFirst({
                where: {
                    id: calculationId,
                    userId // Ensure user can only access their own calculations
                },
                include: {
                    crop: true,
                    soilAnalysis: true
                }
            });

            if (!calculation) {
                return res.status(404).json({
                    success: false,
                    error: 'Calculation not found'
                });
            }

            // Parse JSON fields
            const calculationWithParsedData = {
                ...calculation,
                detailedResults: calculation.detailedResults ? JSON.parse(calculation.detailedResults) : null,
                recommendations: calculation.recommendations ? JSON.parse(calculation.recommendations) : null,
                scheduleData: calculation.scheduleData ? JSON.parse(calculation.scheduleData) : null
            };

            res.json({
                success: true,
                data: calculationWithParsedData
            });

        } catch (error) {
            console.error('Error fetching calculation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch calculation',
                details: error.message
            });
        }
    }
}

module.exports = new DSSController();
