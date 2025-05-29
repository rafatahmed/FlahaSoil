<!-- @format -->

# FlahaSoil API Documentation

## Overview

The FlahaSoil API provides endpoints for user authentication, soil analysis calculations, data management, and comprehensive reporting features. The API follows RESTful principles and returns JSON responses with tier-based access control.

**Base URL:** `http://localhost:3001/api/v1`

## API Features by Tier

### 🆓 **Free Tier**

- Basic soil analysis (50 analyses/month)
- Demo analysis access
- Web interface access
- ❌ No report generation
- ❌ No print functionality

### 💼 **Professional Tier**

- Unlimited soil analyses
- Advanced calculations with enhanced parameters
- Analysis history and export
- **📄 PDF Report Generation**
- **🖨️ Print Functionality**
- **📊 Standard Report Templates**
- Priority support

### 🏢 **Enterprise Tier**

- All Professional features
- **🎨 Custom Branded Reports**
- **📈 Advanced Report Templates**
- **💡 Management Recommendations**
- **🏢 Company Branding Options**
- API access with higher limits
- White-label solutions
- Custom integrations

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
  "name": "Demo User",
  "email": "demo@flahasoil.com",
  "password": "demo123",
  "plan": "FREE"
}
```

**Response:**

```json
{
	"success": true,
	"message": "User registered successfully",
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	"user": {
		"id": "cmb9ca3ud0000dcc6w6dram3c",
		"email": "demo@flahasoil.com",
		"name": "Demo User",
		"tier": "FREE",
		"emailVerified": false,
		"usageCount": 0,
		"usageLimit": 50
	}
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "demo@flahasoil.com",
  "password": "demo123"
}
```

**Response:**

```json
{
	"success": true,
	"message": "Login successful",
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	"user": {
		"id": "cmb9ca3ud0000dcc6w6dram3c",
		"email": "demo@flahasoil.com",
		"name": "Demo User",
		"tier": "FREE",
		"emailVerified": true,
		"usageCount": 9,
		"usageLimit": 50,
		"usageResetDate": "2025-06-28T12:17:18.323Z"
	}
}
```

#### Get Profile

```http
GET /auth/profile
Authorization: Bearer <token>
```

**Response:**

```json
{
	"success": true,
	"data": {
		"id": "cmb9ca3ud0000dcc6w6dram3c",
		"email": "demo@flahasoil.com",
		"name": "Demo User",
		"tier": "FREE",
		"emailVerified": true,
		"usageCount": 9,
		"usageLimit": 50
	}
}
```

#### Update Profile

```http
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@flahasoil.com"
}
```

#### Logout

```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response:**

```json
{
	"success": true,
	"message": "Logout successful"
}
```

### Email Verification

#### Verify Email

```http
POST /auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-here"
}
```

#### Resend Verification Email

```http
POST /auth/resend-verification
Content-Type: application/json

{
  "email": "demo@flahasoil.com"
}
```

### Password Reset

#### Forgot Password

```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "demo@flahasoil.com"
}
```

#### Reset Password

```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-here",
  "newPassword": "newpassword123"
}
```

## Soil Analysis Endpoints

### Demo Soil Analysis (Unauthenticated)

```http
POST /soil/demo/analyze
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
		"textureClass": "clay loam",
		"fieldCapacity": 0.32,
		"wiltingPoint": 0.18,
		"plantAvailableWater": 0.14,
		"saturation": 0.45,
		"saturatedConductivity": 2.5,
		"bulkDensity": 1.35,
		"porosity": 0.49
	},
	"usage": {
		"current": 1,
		"limit": 50,
		"remaining": 49
	}
}
```

### Authenticated Soil Analysis

```http
POST /soil/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "sand": 40,
  "clay": 30,
  "organicMatter": 2.5,
  "densityFactor": 1.0,
  "gravelContent": 0,
  "electricalConductivity": 0
}
```

**Response:**

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
		"analysisId": "cmb9ca3ud0000dcc6w6dram3c"
	},
	"usage": {
		"current": 10,
		"limit": 50,
		"remaining": 40,
		"resetDate": "2025-06-28T12:17:18.323Z"
	}
}
```

### Advanced Soil Analysis (Professional+)

```http
POST /soil/analyze/advanced
Authorization: Bearer <token>
Content-Type: application/json

{
  "sand": 40,
  "clay": 30,
  "organicMatter": 2.5,
  "densityFactor": 1.0,
  "gravelContent": 5,
  "electricalConductivity": 2.0,
  "temperature": 20,
  "ph": 6.5
}
```

### Batch Analysis (Professional+)

```http
POST /soil/analyze/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "analyses": [
    {
      "sand": 40,
      "clay": 30,
      "organicMatter": 2.5,
      "densityFactor": 1.0
    },
    {
      "sand": 50,
      "clay": 25,
      "organicMatter": 3.0,
      "densityFactor": 1.1
    }
  ]
}
```

### Analysis History (Professional+)

```http
GET /soil/analyze/history?page=1&limit=10
Authorization: Bearer <token>
```

### Export Analysis (Professional+)

```http
GET /soil/analyze/export/{analysisId}?format=csv
Authorization: Bearer <token>
```

## Report Generation Endpoints

### Get Report Capabilities

```http
GET /reports/capabilities
Authorization: Bearer <token>
```

**Response:**

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

### Generate Standard PDF Report (Professional+)

```http
POST /reports/generate/standard
Authorization: Bearer <token>
Content-Type: application/json

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
    "saturatedConductivity": 2.5
  }
}
```

**Response:** PDF file download with headers:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="FlahaSoil-Report-{timestamp}.pdf"
```

### Generate Custom Branded Report (Enterprise Only)

```http
POST /reports/generate/custom
Authorization: Bearer <token>
Content-Type: application/json

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
    "saturatedConductivity": 2.5
  },
  "customOptions": {
    "companyName": "Your Company Name",
    "companyLogo": "https://example.com/logo.png",
    "primaryColor": "#2E8B57",
    "secondaryColor": "#4682B4",
    "fontFamily": "Arial",
    "pageFormat": "A4",
    "includeRecommendations": true,
    "margins": {
      "top": "20mm",
      "right": "15mm",
      "bottom": "20mm",
      "left": "15mm"
    }
  }
}
```

**Response:** Custom branded PDF file download

### Preview Standard Report (Professional+)

```http
POST /reports/preview/standard
Authorization: Bearer <token>
Content-Type: application/json

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
    "saturatedConductivity": 2.5
  }
}
```

**Response:** HTML content for preview

### Preview Custom Report (Enterprise Only)

```http
POST /reports/preview/custom
Authorization: Bearer <token>
Content-Type: application/json

{
  "soilData": { /* soil data object */ },
  "customOptions": { /* custom options object */ }
}
```

### Get Report Templates (Enterprise Only)

```http
GET /reports/templates
Authorization: Bearer <token>
```

**Response:**

```json
{
	"success": true,
	"templates": [
		{
			"id": "standard",
			"name": "Standard Report",
			"description": "Basic soil analysis report with all essential data",
			"features": [
				"Soil composition",
				"Water characteristics",
				"Physical properties"
			]
		},
		{
			"id": "detailed",
			"name": "Detailed Analysis",
			"description": "Comprehensive report with recommendations",
			"features": [
				"Executive summary",
				"Detailed analysis",
				"Management recommendations",
				"Custom branding"
			]
		},
		{
			"id": "executive",
			"name": "Executive Summary",
			"description": "High-level overview for decision makers",
			"features": [
				"Key metrics",
				"Assessment summary",
				"Recommendations",
				"Custom branding"
			]
		}
	]
}
```

## Crop Recommendations

### Get Crop Recommendations

```http
POST /crop/recommendations
Authorization: Bearer <token> (optional)
Content-Type: application/json

{
  "textureClass": "clay loam",
  "plantAvailableWater": 0.14,
  "organicMatter": 2.5
}
```

## User Plans

### FREE Plan

- **Usage Limit**: 50 analyses per month
- **Features**:
  - Basic soil water characteristics
  - USDA soil triangle visualization
  - Demo access without authentication
  - Mobile-friendly interface
- **Price**: $0/month

### PROFESSIONAL Plan

- **Usage Limit**: Unlimited analyses
- **Features**:
  - All FREE features
  - Advanced soil calculations
  - Analysis history and export (PDF, CSV)
  - **📄 PDF Report Generation**
  - **🖨️ Print Functionality**
  - **📊 Standard Report Templates**
  - Batch processing (up to 100 samples)
  - Priority email support
  - Moisture-tension curves
  - 3D soil profile visualization
- **Price**: $29/month

### ENTERPRISE Plan

- **Usage Limit**: Unlimited analyses
- **Features**:
  - All PROFESSIONAL features
  - **🎨 Custom Branded Reports**
  - **📈 Advanced Report Templates**
  - **💡 Management Recommendations**
  - **🏢 Company Branding Options**
  - Full API access with higher rate limits
  - White-label options
  - Custom integrations
  - Dedicated account manager
  - SLA guarantee (99.9% uptime)
  - Custom reporting and analytics
- **Price**: $199/month

## Demo User Credentials

For testing purposes, use these credentials:

- **Email**: `demo@flahasoil.com`
- **Password**: `demo123`
- **Plan**: FREE
- **Email Verified**: Yes
- **Usage**: 9/50 analyses used

## Error Responses

All endpoints return standardized error responses:

```json
{
	"success": false,
	"error": "Human readable error message",
	"status": 400
}
```

### Common Error Codes

- `400`: Bad Request - Invalid input parameters
- `401`: Unauthorized - Invalid or missing authentication token
- `403`: Forbidden - Insufficient plan or feature not available
- `404`: Not Found - Endpoint or resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side error

## Rate Limiting

Rate limits are applied per user based on their plan:

- **FREE users**: 50 analyses per month
- **PROFESSIONAL users**: Unlimited analyses, 1000 API requests/hour
- **ENTERPRISE users**: Unlimited analyses, 10000 API requests/hour

## Frontend Integration

### API Client Usage

```javascript
// Initialize API client
const flahaSoilAPI = new FlahaSoilAPI();

// Login
const loginResult = await flahaSoilAPI.login("demo@flahasoil.com", "demo123");

// Perform soil analysis
const analysisResult = await flahaSoilAPI.analyzeSoil({
	sand: 40,
	clay: 30,
	organicMatter: 2.5,
	densityFactor: 1.0,
});
```

### Authentication Flow

1. User visits landing page (`/landing.html`)
2. User clicks login and enters credentials
3. Frontend calls `/auth/login` endpoint
4. Backend returns JWT token and user data
5. Frontend stores token and redirects to main app
6. Subsequent API calls include `Authorization: Bearer <token>` header

## Getting Started

### For Developers

1. Clone the repository
2. Install dependencies: `npm install`
3. Start backend: `cd api-implementation && npm start`
4. Start frontend: Open `index.html` in browser
5. Use demo credentials to test functionality

### For API Users

1. Register a new account via `/auth/register`
2. Verify email address (check console logs in development)
3. Login to receive JWT token via `/auth/login`
4. Use token for authenticated requests
5. Start with basic soil analysis via `/soil/analyze`
6. Upgrade plan for advanced features

## Repository

**GitHub**: https://github.com/rafatahmed/FlahaSoil

## Recent Updates & Fixes

### Authentication System (Fixed)

- ✅ **Login Issue Resolved**: Fixed property mismatch between frontend and backend
- ✅ **Landing Page Login**: Added proper API client initialization
- ✅ **Email Verification**: Demo user email is now verified
- ✅ **Token Management**: Proper JWT storage and authentication flow
- ✅ **User Data Storage**: Consistent user data handling across pages

### Current Status

- ✅ **Backend API**: Running on `http://localhost:3001`
- ✅ **Frontend**: Available at `http://localhost:3000`
- ✅ **Database**: SQLite with Prisma ORM
- ✅ **Authentication**: JWT-based with email verification
- ✅ **Demo User**: Fully functional with verified email
- ✅ **Landing Page**: Complete authentication flow working
- ✅ **Main App**: Soil analysis functionality operational

### Known Working Features

1. **User Registration & Login** - Both landing page and main app
2. **Email Verification** - Automated verification system
3. **Password Reset** - Forgot password functionality
4. **Soil Analysis** - Basic calculations with Saxton & Rawls algorithms
5. **Usage Tracking** - Per-user analysis count and limits
6. **Plan Management** - FREE/PROFESSIONAL/ENTERPRISE tiers
7. **Responsive Design** - Mobile-friendly interface

### Testing Instructions

1. **Start Backend**: `cd api-implementation && npm start`
2. **Open Frontend**: Navigate to `http://localhost:3000/landing.html`
3. **Login**: Use `demo@flahasoil.com` / `demo123`
4. **Test Analysis**: Enter soil parameters and run analysis
5. **Check Usage**: Monitor usage count in user interface

## Support

- **FREE Plan**: Community support via GitHub issues
- **PROFESSIONAL Plan**: Email support (support@flahasoil.com)
- **ENTERPRISE Plan**: Dedicated account manager

---

**Last Updated**: May 29, 2025
**API Version**: v1
**Status**: ✅ Fully Operational
