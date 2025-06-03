/**
 * Localization Service - Week 6 Implementation
 * Handles multi-language support for crop database and DSS system
 * 
 * Features:
 * - Arabic (ar) support for GCC/MENA region
 * - French (fr) support for North Africa
 * - English (en) as default language
 * - Crop name and description translations
 * - BBCH stage translations
 * - Agricultural terminology localization
 * 
 * @format
 */

const { cropTranslations, bbchStageTranslations, agriculturalTerms } = require('../localization/crop-translations');

class LocalizationService {
    constructor() {
        this.supportedLanguages = ['en', 'ar', 'fr'];
        this.defaultLanguage = 'en';
        this.fallbackLanguage = 'en';
    }

    /**
     * Get supported languages
     * @returns {Array} Array of supported language codes
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    /**
     * Validate language code
     * @param {string} lang - Language code
     * @returns {string} Valid language code or default
     */
    validateLanguage(lang) {
        if (!lang || !this.supportedLanguages.includes(lang)) {
            return this.defaultLanguage;
        }
        return lang;
    }

    /**
     * Get crop translation by name
     * @param {string} cropName - Crop name in English
     * @param {string} lang - Target language code
     * @returns {Object} Translated crop information
     */
    getCropTranslation(cropName, lang = 'en') {
        const validLang = this.validateLanguage(lang);
        const cropKey = this.getCropKey(cropName);
        
        if (!cropKey || !cropTranslations[cropKey]) {
            return {
                name: cropName,
                scientificName: '',
                description: 'Translation not available',
                category: '',
                language: validLang
            };
        }

        const translation = cropTranslations[cropKey][validLang] || 
                          cropTranslations[cropKey][this.fallbackLanguage];

        return {
            ...translation,
            language: validLang,
            originalName: cropName
        };
    }

    /**
     * Get BBCH stage translation
     * @param {string} stageCode - BBCH stage code (e.g., "00", "61")
     * @param {string} lang - Target language code
     * @returns {string} Translated stage description
     */
    getBBCHStageTranslation(stageCode, lang = 'en') {
        const validLang = this.validateLanguage(lang);
        
        if (!bbchStageTranslations[validLang] || !bbchStageTranslations[validLang][stageCode]) {
            return bbchStageTranslations[this.fallbackLanguage][stageCode] || `Stage ${stageCode}`;
        }

        return bbchStageTranslations[validLang][stageCode];
    }

    /**
     * Get agricultural term translation
     * @param {string} term - Agricultural term key
     * @param {string} lang - Target language code
     * @returns {string} Translated term
     */
    getAgriculturalTerm(term, lang = 'en') {
        const validLang = this.validateLanguage(lang);
        
        if (!agriculturalTerms[validLang] || !agriculturalTerms[validLang][term]) {
            return agriculturalTerms[this.fallbackLanguage][term] || term;
        }

        return agriculturalTerms[validLang][term];
    }

    /**
     * Translate crop list with full details
     * @param {Array} crops - Array of crop objects from database
     * @param {string} lang - Target language code
     * @returns {Array} Array of translated crop objects
     */
    translateCropList(crops, lang = 'en') {
        const validLang = this.validateLanguage(lang);
        
        return crops.map(crop => {
            const translation = this.getCropTranslation(crop.name, validLang);
            
            return {
                ...crop,
                localizedName: translation.name,
                localizedDescription: translation.description,
                localizedCategory: translation.category,
                language: validLang
            };
        });
    }

    /**
     * Translate BBCH stages for a crop
     * @param {Array} bbchStages - Array of BBCH stage objects
     * @param {string} lang - Target language code
     * @returns {Array} Array of translated BBCH stage objects
     */
    translateBBCHStages(bbchStages, lang = 'en') {
        const validLang = this.validateLanguage(lang);
        
        return bbchStages.map(stage => ({
            ...stage,
            localizedStageName: this.getBBCHStageTranslation(stage.stageCode, validLang),
            localizedDescription: stage.description, // Keep original for now, can be enhanced
            language: validLang
        }));
    }

    /**
     * Get localized DSS interface terms
     * @param {string} lang - Target language code
     * @returns {Object} Object with localized interface terms
     */
    getDSSInterfaceTerms(lang = 'en') {
        const validLang = this.validateLanguage(lang);
        
        const terms = {};
        Object.keys(agriculturalTerms[this.defaultLanguage]).forEach(key => {
            terms[key] = this.getAgriculturalTerm(key, validLang);
        });

        return {
            ...terms,
            language: validLang,
            direction: validLang === 'ar' ? 'rtl' : 'ltr'
        };
    }

    /**
     * Get crop key from crop name
     * @private
     * @param {string} cropName - Crop name
     * @returns {string} Crop key for translations
     */
    getCropKey(cropName) {
        const keyMap = {
            'Tomato': 'tomato',
            'Wheat': 'wheat',
            'Maize': 'maize',
            'Rice': 'rice',
            'Potato': 'potato',
            'Onion': 'onion',
            'Cucumber': 'cucumber',
            'Lettuce': 'lettuce',
            'Alfalfa': 'alfalfa',
            'Cotton': 'cotton',
            'Sunflower': 'sunflower',
            'Barley': 'barley',
            'Date Palm': 'datePalm'
        };
        
        return keyMap[cropName];
    }

    /**
     * Get language metadata
     * @param {string} lang - Language code
     * @returns {Object} Language metadata
     */
    getLanguageMetadata(lang = 'en') {
        const validLang = this.validateLanguage(lang);
        
        const metadata = {
            en: {
                name: 'English',
                nativeName: 'English',
                direction: 'ltr',
                region: 'Global'
            },
            ar: {
                name: 'Arabic',
                nativeName: 'العربية',
                direction: 'rtl',
                region: 'GCC/MENA'
            },
            fr: {
                name: 'French',
                nativeName: 'Français',
                direction: 'ltr',
                region: 'North Africa'
            }
        };

        return metadata[validLang];
    }

    /**
     * Format number according to locale
     * @param {number} number - Number to format
     * @param {string} lang - Language code
     * @param {Object} options - Formatting options
     * @returns {string} Formatted number
     */
    formatNumber(number, lang = 'en', options = {}) {
        const validLang = this.validateLanguage(lang);
        
        const localeMap = {
            en: 'en-US',
            ar: 'ar-SA',
            fr: 'fr-FR'
        };

        try {
            return new Intl.NumberFormat(localeMap[validLang], options).format(number);
        } catch (error) {
            return number.toString();
        }
    }

    /**
     * Format date according to locale
     * @param {Date|string} date - Date to format
     * @param {string} lang - Language code
     * @param {Object} options - Formatting options
     * @returns {string} Formatted date
     */
    formatDate(date, lang = 'en', options = {}) {
        const validLang = this.validateLanguage(lang);
        const dateObj = new Date(date);
        
        const localeMap = {
            en: 'en-US',
            ar: 'ar-SA',
            fr: 'fr-FR'
        };

        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        try {
            return new Intl.DateTimeFormat(localeMap[validLang], { ...defaultOptions, ...options }).format(dateObj);
        } catch (error) {
            return dateObj.toLocaleDateString();
        }
    }

    /**
     * Get complete localization package for a language
     * @param {string} lang - Language code
     * @returns {Object} Complete localization package
     */
    getLocalizationPackage(lang = 'en') {
        const validLang = this.validateLanguage(lang);
        
        return {
            language: validLang,
            metadata: this.getLanguageMetadata(validLang),
            crops: cropTranslations,
            bbchStages: bbchStageTranslations[validLang],
            terms: agriculturalTerms[validLang],
            supportedLanguages: this.supportedLanguages
        };
    }
}

module.exports = LocalizationService;
