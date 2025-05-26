# FlahaSoil API Implementation Guide

## 🚀 **Quick Start: Hybrid Approach**

This approach allows you to protect your IP while maintaining current functionality.

### **Architecture Overview**
```
Current Frontend → API Gateway → Protected Calculations → Database
     ↓                ↓              ↓                    ↓
Demo Features    Rate Limiting   Saxton & Rawls      User Analytics
Free Tier        Authentication  Algorithms          Usage Tracking
```

## 📁 **Project Structure**
```
flahasoil-api/
├── src/
│   ├── controllers/
│   │   ├── soilController.js
│   │   └── authController.js
│   ├── services/
│   │   ├── soilCalculationService.js
│   │   └── recommendationService.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── rateLimit.js
│   ├── models/
│   │   └── User.js
│   └── routes/
│       ├── soil.js
│       └── auth.js
├── config/
│   └── database.js
├── package.json
└── server.js
```

## 🛠️ **Implementation Steps**

### **Step 1: Basic API Setup**
```bash
mkdir flahasoil-api
cd flahasoil-api
npm init -y
npm install express cors helmet morgan dotenv
npm install jsonwebtoken bcryptjs mongoose
npm install express-rate-limit express-validator
```

### **Step 2: Environment Configuration**
Create `.env` file:
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
MONGODB_URI=mongodb://localhost:27017/flahasoil
CORS_ORIGIN=http://localhost:3000
```

### **Step 3: Core API Structure**
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api/v1/soil', require('./src/routes/soil'));
app.use('/api/v1/auth', require('./src/routes/auth'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'FlahaSoil API' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`FlahaSoil API running on port ${PORT}`);
});
```

## 🔐 **Authentication & Rate Limiting**

### **JWT Middleware**
```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
```

### **Rate Limiting**
```javascript
// src/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different limits for different tiers
const freeTierLimit = createRateLimit(
  24 * 60 * 60 * 1000, // 24 hours
  50, // 50 requests per day
  'Free tier limit exceeded. Upgrade to Professional for unlimited access.'
);

const professionalLimit = createRateLimit(
  60 * 1000, // 1 minute
  100, // 100 requests per minute
  'Rate limit exceeded. Please try again later.'
);

module.exports = { freeTierLimit, professionalLimit };
```

## 🧮 **Protected Calculation Service**

### **Soil Calculation API**
```javascript
// src/services/soilCalculationService.js
class SoilCalculationService {
  static calculateWaterCharacteristics(sand, clay, organicMatter, densityFactor) {
    // Move your existing calculation logic here
    // This is now protected on the server side
    
    const silt = 100 - sand - clay;
    const S = sand / 100;
    const C = clay / 100;
    const OM = organicMatter / 100;
    
    // Saxton & Rawls calculations (protected)
    const theta33t = -0.251 * S + 0.195 * C + 0.011 * OM + 
                     0.006 * (S * OM) - 0.027 * (C * OM) + 
                     0.452 * (S * C) + 0.299;
    
    let theta33 = theta33t + (1.283 * Math.pow(theta33t, 2) - 0.374 * theta33t - 0.015);
    
    // ... rest of your calculations
    
    return {
      fieldCapacity: (theta33 * 100).toFixed(2),
      wiltingPoint: (theta1500 * 100).toFixed(2),
      saturation: (thetaSat * 100).toFixed(2),
      plantAvailableWater: (PAW * 100).toFixed(2),
      saturatedConductivity: Ksat.toFixed(2),
      textureClass: this.determineSoilTextureClass(sand, clay)
    };
  }
  
  static determineSoilTextureClass(sand, clay) {
    // Protected classification logic
    // ... your existing logic
  }
}

module.exports = SoilCalculationService;
```

## 🌐 **API Endpoints**

### **Soil Analysis Endpoint**
```javascript
// src/controllers/soilController.js
const SoilCalculationService = require('../services/soilCalculationService');
const { validationResult } = require('express-validator');

class SoilController {
  static async analyzeSoil(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sand, clay, organicMatter = 2.5, densityFactor = 1.0 } = req.body;
      
      // Check user tier for advanced features
      const userTier = req.user?.tier || 'free';
      
      let result;
      if (userTier === 'free') {
        // Basic calculation only
        result = SoilCalculationService.calculateBasic(sand, clay);
      } else {
        // Full calculation with advanced parameters
        result = SoilCalculationService.calculateWaterCharacteristics(
          sand, clay, organicMatter, densityFactor
        );
      }
      
      // Log usage for analytics
      await this.logUsage(req.user?.id, req.body);
      
      res.json({
        success: true,
        data: result,
        tier: userTier
      });
      
    } catch (error) {
      console.error('Soil analysis error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  static async logUsage(userId, analysisData) {
    // Track usage for analytics and billing
    // Implementation depends on your database choice
  }
}

module.exports = SoilController;
```

## 🔄 **Frontend Integration**

### **API Client Service**
```javascript
// assets/js/apiClient.js
class FlahaSoilAPI {
  constructor() {
    this.baseURL = 'http://localhost:3001/api/v1';
    this.token = localStorage.getItem('flahasoil_token');
  }
  
  async analyzeSoil(soilData) {
    try {
      const response = await fetch(`${this.baseURL}/soil/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.token ? `Bearer ${this.token}` : ''
        },
        body: JSON.stringify(soilData)
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      // Fallback to client-side calculation for demo
      return this.fallbackCalculation(soilData);
    }
  }
  
  fallbackCalculation(soilData) {
    // Basic client-side calculation for demo users
    // Limited functionality to encourage registration
    return {
      success: true,
      data: {
        fieldCapacity: "Demo Mode",
        wiltingPoint: "Demo Mode", 
        message: "Register for full analysis"
      },
      tier: 'demo'
    };
  }
}

// Global API instance
window.flahaSoilAPI = new FlahaSoilAPI();
```

## 📊 **Usage Analytics**

### **Analytics Dashboard Data**
```javascript
// Track key metrics
const analytics = {
  dailyUsage: 0,
  monthlyUsage: 0,
  userTier: 'free',
  featuresUsed: [],
  lastAnalysis: null
};

// Update main.js to use API
function updateSoilAnalysis() {
  const soilData = {
    sand: parseFloat(document.getElementById('sand-input').value),
    clay: parseFloat(document.getElementById('clay-input').value),
    organicMatter: parseFloat(document.getElementById('om-input').value),
    densityFactor: parseFloat(document.getElementById('density-input').value)
  };
  
  // Use API instead of direct calculation
  window.flahaSoilAPI.analyzeSoil(soilData)
    .then(result => {
      if (result.success) {
        displayResults(result.data);
        showTierMessage(result.tier);
      }
    })
    .catch(error => {
      console.error('Analysis failed:', error);
    });
}
```

This hybrid approach gives you:
- ✅ **Immediate IP Protection**: Core algorithms moved to server
- ✅ **Scalable Foundation**: Ready for enterprise features
- ✅ **User Analytics**: Track usage and engagement
- ✅ **Monetization Ready**: Tier-based feature access
- ✅ **Backward Compatible**: Existing frontend still works

Would you like me to implement any specific part of this architecture?
