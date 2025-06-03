/**
 * Localization Routes - Week 6 Implementation
 * API routes for multi-language support
 * 
 * @format
 */

const express = require('express');
const localizationController = require('../controllers/localizationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/v1/localization/crops
 * @desc Get localized crop list
 * @query {string} lang - Language code (en, ar, fr)
 * @access Public
 */
router.get('/crops', localizationController.getLocalizedCrops);

/**
 * @route GET /api/v1/localization/crops/:id
 * @desc Get localized crop details with BBCH stages
 * @param {string} id - Crop ID
 * @query {string} lang - Language code (en, ar, fr)
 * @access Public
 */
router.get('/crops/:id', localizationController.getLocalizedCropDetails);

/**
 * @route GET /api/v1/localization/bbch-stages
 * @desc Get localized BBCH stages
 * @query {string} lang - Language code (en, ar, fr)
 * @query {string} cropId - Optional crop ID filter
 * @access Public
 */
router.get('/bbch-stages', localizationController.getLocalizedBBCHStages);

/**
 * @route GET /api/v1/localization/dss-terms
 * @desc Get localized DSS interface terms
 * @query {string} lang - Language code (en, ar, fr)
 * @access Public
 */
router.get('/dss-terms', localizationController.getDSSInterfaceTerms);

/**
 * @route GET /api/v1/localization/languages
 * @desc Get supported languages
 * @access Public
 */
router.get('/languages', localizationController.getSupportedLanguages);

/**
 * @route GET /api/v1/localization/package
 * @desc Get complete localization package
 * @query {string} lang - Language code (en, ar, fr)
 * @access Public
 */
router.get('/package', localizationController.getLocalizationPackage);

/**
 * @route POST /api/v1/localization/translate
 * @desc Translate specific text
 * @body {string} text - Text to translate
 * @body {string} type - Translation type (crop, bbch, term)
 * @body {string} lang - Target language code (en, ar, fr)
 * @access Public
 */
router.post('/translate', localizationController.translateText);

module.exports = router;
