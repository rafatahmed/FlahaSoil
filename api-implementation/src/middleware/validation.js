/**
 * Simple validation middleware for FlahaSoil API
 * Provides basic request validation functionality
 */

/**
 * Validate request data against schema
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware function
 */
function validateRequest(schema) {
    return (req, res, next) => {
        const errors = [];
        
        // Validate body parameters
        if (schema.body) {
            const bodyErrors = validateObject(req.body, schema.body, 'body');
            errors.push(...bodyErrors);
        }
        
        // Validate query parameters
        if (schema.query) {
            const queryErrors = validateObject(req.query, schema.query, 'query');
            errors.push(...queryErrors);
        }
        
        // Validate URL parameters
        if (schema.params) {
            const paramErrors = validateObject(req.params, schema.params, 'params');
            errors.push(...paramErrors);
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }
        
        next();
    };
}

/**
 * Validate object against schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Schema definition
 * @param {string} location - Location of data (body, query, params)
 * @returns {Array} Array of validation errors
 */
function validateObject(data, schema, location) {
    const errors = [];
    
    // Check required fields
    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        
        // Check if field is required
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push({
                field: `${location}.${field}`,
                message: `${field} is required`,
                code: 'REQUIRED'
            });
            continue;
        }
        
        // Skip validation if field is not provided and not required
        if (value === undefined || value === null) {
            // Apply default value if provided
            if (rules.default !== undefined) {
                data[field] = rules.default;
            }
            continue;
        }
        
        // Type validation
        if (rules.type) {
            const typeError = validateType(value, rules.type, `${location}.${field}`);
            if (typeError) {
                errors.push(typeError);
                continue;
            }
        }
        
        // Enum validation
        if (rules.enum && !rules.enum.includes(value)) {
            errors.push({
                field: `${location}.${field}`,
                message: `${field} must be one of: ${rules.enum.join(', ')}`,
                code: 'ENUM',
                allowedValues: rules.enum
            });
            continue;
        }
        
        // Number range validation
        if (rules.type === 'number') {
            if (rules.min !== undefined && value < rules.min) {
                errors.push({
                    field: `${location}.${field}`,
                    message: `${field} must be at least ${rules.min}`,
                    code: 'MIN_VALUE'
                });
            }
            
            if (rules.max !== undefined && value > rules.max) {
                errors.push({
                    field: `${location}.${field}`,
                    message: `${field} must be at most ${rules.max}`,
                    code: 'MAX_VALUE'
                });
            }
        }
        
        // String length validation
        if (rules.type === 'string') {
            if (rules.minLength !== undefined && value.length < rules.minLength) {
                errors.push({
                    field: `${location}.${field}`,
                    message: `${field} must be at least ${rules.minLength} characters`,
                    code: 'MIN_LENGTH'
                });
            }
            
            if (rules.maxLength !== undefined && value.length > rules.maxLength) {
                errors.push({
                    field: `${location}.${field}`,
                    message: `${field} must be at most ${rules.maxLength} characters`,
                    code: 'MAX_LENGTH'
                });
            }
        }
        
        // Array validation
        if (rules.type === 'array') {
            if (!Array.isArray(value)) {
                errors.push({
                    field: `${location}.${field}`,
                    message: `${field} must be an array`,
                    code: 'TYPE_ERROR'
                });
            }
        }
    }
    
    return errors;
}

/**
 * Validate data type
 * @param {*} value - Value to validate
 * @param {string} expectedType - Expected type
 * @param {string} fieldPath - Field path for error reporting
 * @returns {Object|null} Error object or null if valid
 */
function validateType(value, expectedType, fieldPath) {
    let isValid = false;
    
    switch (expectedType) {
        case 'string':
            isValid = typeof value === 'string';
            break;
        case 'number':
            isValid = typeof value === 'number' && !isNaN(value);
            // Try to convert string numbers
            if (!isValid && typeof value === 'string') {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    // Convert the value in place
                    const parts = fieldPath.split('.');
                    const location = parts[0];
                    const field = parts[1];
                    
                    // This is a bit hacky but works for our use case
                    if (location === 'body' && global.currentReq?.body) {
                        global.currentReq.body[field] = numValue;
                    } else if (location === 'query' && global.currentReq?.query) {
                        global.currentReq.query[field] = numValue;
                    }
                    
                    isValid = true;
                }
            }
            break;
        case 'boolean':
            isValid = typeof value === 'boolean';
            // Try to convert string booleans
            if (!isValid && typeof value === 'string') {
                if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
                    isValid = true;
                }
            }
            break;
        case 'array':
            isValid = Array.isArray(value);
            break;
        case 'object':
            isValid = typeof value === 'object' && value !== null && !Array.isArray(value);
            break;
        default:
            isValid = true; // Unknown type, assume valid
    }
    
    if (!isValid) {
        return {
            field: fieldPath,
            message: `Expected ${expectedType} but received ${typeof value}`,
            code: 'TYPE_ERROR',
            expectedType,
            receivedType: typeof value
        };
    }
    
    return null;
}

/**
 * Middleware to set current request for type conversion
 */
function setCurrentRequest(req, res, next) {
    global.currentReq = req;
    next();
}

module.exports = {
    validateRequest,
    validateObject,
    validateType,
    setCurrentRequest
};
