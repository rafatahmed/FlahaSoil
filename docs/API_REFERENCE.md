# FlahaSoil API Reference

## 🔗 **Base Configuration**

### **API Base URL**
```
Development: http://localhost:3001/api/v1
Production: https://api.flahasoil.com/api/v1
```

### **Authentication**
All protected endpoints require JWT token in Authorization header:
```http
Authorization: Bearer <jwt-token>
```

### **Content Type**
```http
Content-Type: application/json
```

## 🔐 **Authentication Endpoints**

### **POST /auth/register**
Register a new user account.

**Request Body:**
```json
{
  "name": "string (required, 2-50 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)",
  "plan": "string (optional, FREE|PROFESSIONAL|ENTERPRISE)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt-token-string",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "tier": "FREE",
    "emailVerified": false,
    "usageCount": 0,
    "usageLimit": 50
  }
}
```

### **POST /auth/login**
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-token-string",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "tier": "PROFESSIONAL",
    "emailVerified": true,
    "usageCount": 25,
    "usageLimit": 1000,
    "usageResetDate": "2024-01-01T00:00:00.000Z"
  }
}
```

### **GET /auth/profile**
Get current user profile information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "tier": "PROFESSIONAL",
    "emailVerified": true,
    "usageCount": 25,
    "usageLimit": 1000,
    "planSelectedAt": "2024-01-01T00:00:00.000Z",
    "usageResetDate": "2024-02-01T00:00:00.000Z"
  }
}
```

## 🌱 **Soil Analysis Endpoints**

### **POST /soil/demo/analyze**
Perform soil analysis without authentication (demo mode).

**Request Body:**
```json
{
  "sand": "number (required, 0-100)",
  "clay": "number (required, 0-100)",
  "organicMatter": "number (optional, 0-8, default: 2.5)",
  "densityFactor": "number (optional, 0.9-1.8, default: 1.0)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "textureClass": "clay loam",
    "fieldCapacity": 0.32,
    "wiltingPoint": 0.18,
    "plantAvailableWater": 0.14,
    "saturation": 0.45,
    "saturatedConductivity": 2.5,
    "bulkDensity": 1.35,
    "porosity": 0.49,
    "isDemoMode": true,
    "note": "Demo mode - register for full features"
  },
  "demo": true,
  "features": {
    "basicAnalysis": true,
    "advancedVisualizations": false,
    "dataStorage": false,
    "exportCapabilities": false
  }
}
```

### **POST /soil/analyze**
Perform authenticated soil analysis with tier-based features.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "sand": "number (required, 0-100)",
  "clay": "number (required, 0-100)",
  "organicMatter": "number (optional, 0-8, default: 2.5)",
  "densityFactor": "number (optional, 0.9-1.8, default: 1.0)",
  "gravelContent": "number (optional, 0-50, Professional+)",
  "electricalConductivity": "number (optional, 0-10, Enterprise)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis-id",
    "textureClass": "clay loam",
    "fieldCapacity": 0.32,
    "wiltingPoint": 0.18,
    "plantAvailableWater": 0.14,
    "saturation": 0.45,
    "saturatedConductivity": 2.5,
    "bulkDensity": 1.35,
    "porosity": 0.49,
    "qualityScore": 85,
    "confidenceIntervals": {
      "fieldCapacity": {"min": 0.30, "max": 0.34, "r2": 0.92}
    },
    "gravelEffects": {
      "adjustedFieldCapacity": 0.30,
      "adjustedWiltingPoint": 0.17
    },
    "recommendations": [
      "Excellent water holding capacity",
      "Suitable for most crops"
    ]
  },
  "usage": {
    "current": 26,
    "limit": 1000,
    "remaining": 974,
    "resetDate": "2024-02-01T00:00:00.000Z"
  }
}
```

### **GET /soil/analyze/history**
Get user's soil analysis history (Professional+ only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: number (optional, default: 1)
- `limit`: number (optional, default: 10, max: 50)
- `sortBy`: string (optional, createdAt|textureClass)
- `sortOrder`: string (optional, asc|desc, default: desc)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "analyses": [
      {
        "id": "analysis-id",
        "sand": 40,
        "clay": 30,
        "organicMatter": 2.5,
        "textureClass": "clay loam",
        "qualityScore": 85,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

## 📄 **Report Generation Endpoints**

### **GET /reports/capabilities**
Get user's report generation capabilities based on tier.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "plan": "PROFESSIONAL",
  "capabilities": {
    "reportGeneration": true,
    "printFunctionality": true,
    "pdfExport": true,
    "customReports": false,
    "brandedReports": false,
    "message": "Standard PDF reports and print functionality available"
  }
}
```

### **POST /reports/generate/standard**
Generate standard PDF report (Professional+ only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "soilData": {
    "sand": 40,
    "clay": 30,
    "silt": 30,
    "organicMatter": 2.5,
    "densityFactor": 1.0,
    "textureClass": "clay loam",
    "fieldCapacity": 0.32,
    "wiltingPoint": 0.18,
    "plantAvailableWater": 0.14,
    "saturation": 0.45,
    "saturatedConductivity": 2.5,
    "qualityScore": 85
  },
  "options": {
    "includeChart": true,
    "includeRecommendations": true,
    "format": "A4"
  }
}
```

**Response (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="FlahaSoil-Report-20241215.pdf"

[PDF Binary Data]
```

## 🔗 **Integration Endpoints**

### **POST /integrations/webhook**
Webhook endpoint for external integrations (Enterprise only).

**Headers:** 
- `Authorization: Bearer <token>`
- `X-Webhook-Signature: <signature>`

**Request Body:**
```json
{
  "event": "soil.analysis.completed",
  "data": {
    "analysisId": "analysis-id",
    "userId": "user-id",
    "results": { /* analysis results */ }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **GET /integrations/status**
Get integration status and configuration.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "integrations": {
    "webhooks": {
      "enabled": true,
      "endpoints": ["https://example.com/webhook"],
      "events": ["soil.analysis.completed", "report.generated"]
    },
    "api": {
      "enabled": true,
      "rateLimit": "1000/hour",
      "lastUsed": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## ❌ **Error Responses**

### **Standard Error Format**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error"
  }
}
```

### **Common HTTP Status Codes**
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Missing or invalid token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error

### **Error Codes**
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_REQUIRED`: Valid token required
- `INSUFFICIENT_PERMISSIONS`: Feature not available for user tier
- `USAGE_LIMIT_EXCEEDED`: Monthly usage limit reached
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `RESOURCE_NOT_FOUND`: Requested resource not found

---

**Last Updated:** December 2024  
**Version:** 2.0  
**Maintainer:** Flaha Agri Tech - Precision Agriculture Division
