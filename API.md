# FlahaSoil API Documentation

## Overview

The FlahaSoil API provides endpoints for user authentication, soil analysis calculations, and data management. The API follows RESTful principles and returns JSON responses.

**Base URL:** `http://localhost:5000/api`

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

## Soil Analysis Endpoints

### Basic Soil Calculations
```http
POST /soil/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "sand": 40,
  "clay": 30,
  "organicMatter": 2.5,
  "densityFactor": 1.0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "soilTexture": "clay loam",
    "fieldCapacity": 0.32,
    "wiltingPoint": 0.18,
    "plantAvailableWater": 0.14,
    "saturation": 0.45,
    "hydraulicConductivity": 2.5
  }
}
```

### Enhanced Soil Calculations (Professional+)
```http
POST /soil/enhanced
Authorization: Bearer <token>
Content-Type: application/json

{
  "sand": 40,
  "clay": 30,
  "organicMatter": 2.5,
  "densityFactor": 1.0,
  "gravelContent": 5,
  "salinity": 2.0
}
```

### Calculation History
```http
GET /soil/history
Authorization: Bearer <token>
```

## User Plans

- **Basic**: Access to standard soil calculations
- **Professional**: Enhanced calculations with additional parameters
- **Enterprise**: API access + advanced features

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Common Error Codes

- `INVALID_CREDENTIALS`: Login failed
- `TOKEN_EXPIRED`: JWT token has expired
- `INSUFFICIENT_PLAN`: Feature requires higher plan
- `VALIDATION_ERROR`: Input validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Rate Limiting

- Basic users: 100 requests/hour
- Professional users: 1000 requests/hour
- Enterprise users: 10000 requests/hour

## Getting Started

1. Register a new account
2. Login to receive JWT token
3. Use token for authenticated requests
4. Start with basic soil calculations
5. Upgrade plan for enhanced features

For more information, visit: https://github.com/rafatahmed/FlahaSoil
