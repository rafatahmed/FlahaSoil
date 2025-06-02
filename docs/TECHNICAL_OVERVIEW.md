# FlahaSoil Technical Overview

## 🏗️ **System Architecture**

FlahaSoil is a **backend-API-driven** precision agriculture platform implementing advanced soil analysis capabilities with enterprise-grade features.

### **Architecture Pattern**
- **Type**: Backend-API-driven (not hybrid)
- **Frontend**: Static HTML5/CSS3/JavaScript (Port 3000)
- **Backend**: Node.js/Express.js RESTful API (Port 3001)
- **Database**: SQLite with Prisma ORM
- **Communication**: HTTP/HTTPS with JWT authentication

### **Core Components**

#### **Frontend Layer (Port 3000)**
```
public/
├── landing.html          # Marketing landing page
├── index.html           # Main authenticated application
├── demo.html            # Unauthenticated demo
├── advanced-demo.html   # Advanced demo features
├── profile.html         # User profile management
├── assets/
│   ├── css/            # Responsive stylesheets
│   ├── js/             # Client-side JavaScript
│   └── img/            # Images and icons
```

#### **Backend API Layer (Port 3001)**
```
api-implementation/
├── server.js           # Express server entry point
├── src/
│   ├── routes/         # API route definitions
│   ├── controllers/    # Business logic controllers
│   ├── services/       # Core calculation services
│   ├── middleware/     # Authentication & validation
│   └── utils/          # Helper utilities
├── prisma/             # Database schema & migrations
└── tests/              # API testing suite
```

## 🧮 **Scientific Implementation**

### **Saxton & Rawls (2006) 24-Equation System**

FlahaSoil implements the complete scientific methodology:

#### **Equation Groups**
1. **Equations 1-5**: Moisture regressions
2. **Equations 6-10**: Density effects
3. **Equations 11-15**: Moisture-tension relationships
4. **Equations 16-18**: Moisture-conductivity
5. **Equations 19-22**: Gravel effects (Professional+)
6. **Equations 23-24**: Salinity effects (Enterprise)

#### **Input Validation Ranges**
- **Sand/Clay/Silt**: 0-100% (sum must equal 100%)
- **Organic Matter**: 0-8%
- **Bulk Density**: 0.9-1.8 g/cm³
- **Gravel Content**: 0-50% (Professional+)
- **Electrical Conductivity**: 0-10 dS/m (Enterprise)

#### **Output Parameters**
- Field Capacity (θ_FC)
- Wilting Point (θ_WP)
- Plant Available Water (PAW)
- Saturation (θ_SAT)
- Saturated Hydraulic Conductivity (K_SAT)
- Bulk Density adjustments
- Porosity calculations

## 🔐 **Authentication & Security**

### **JWT-Based Authentication**
```javascript
// Token structure
{
  "userId": "user_id",
  "email": "user@example.com",
  "tier": "PROFESSIONAL",
  "iat": timestamp,
  "exp": timestamp
}
```

### **Tier-Based Access Control**

#### **Free Tier**
- 50 analyses/month
- Basic calculations (Equations 1-18)
- Demo access
- Web interface only

#### **Professional Tier**
- Unlimited analyses
- Full 24-equation system
- PDF report generation
- Print functionality
- Analysis history

#### **Enterprise Tier**
- All Professional features
- Custom branded reports
- API access
- Advanced integrations
- Priority support

### **Rate Limiting**
```javascript
// Implementation
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

## 📊 **Database Schema**

### **Core Models**

#### **User Model**
```prisma
model User {
  id             String         @id @default(cuid())
  email          String         @unique
  name           String
  password       String
  tier           String         @default("FREE")
  emailVerified  Boolean        @default(false)
  usageCount     Int            @default(0)
  usageResetDate DateTime?
  soilAnalyses   SoilAnalysis[]
  subscription   Subscription?
  usageRecords   UsageRecord[]
}
```

#### **SoilAnalysis Model**
```prisma
model SoilAnalysis {
  id                    String   @id @default(cuid())
  userId                String
  sand                  Float
  clay                  Float
  organicMatter         Float
  densityFactor         Float
  gravelContent         Float?
  electricalConductivity Float?
  results               Json
  createdAt             DateTime @default(now())
  user                  User     @relation(fields: [userId], references: [id])
}
```

## 🔄 **API Endpoints**

### **Authentication Routes**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/auth/logout` - User logout

### **Soil Analysis Routes**
- `POST /api/v1/soil/demo/analyze` - Demo analysis (unauthenticated)
- `POST /api/v1/soil/analyze` - Authenticated analysis
- `POST /api/v1/soil/analyze/advanced` - Advanced analysis (Professional+)
- `GET /api/v1/soil/analyze/history` - Analysis history (Professional+)

### **Report Routes**
- `GET /api/v1/reports/capabilities` - Get user's report capabilities
- `POST /api/v1/reports/generate/standard` - Generate standard PDF (Professional+)
- `POST /api/v1/reports/generate/custom` - Generate custom PDF (Enterprise)

### **Integration Routes**
- `POST /api/v1/integrations/webhook` - Webhook endpoint
- `GET /api/v1/integrations/status` - Integration status

## 📄 **Report Generation**

### **PDF Generation Pipeline**
1. **Data Validation**: Verify soil analysis data
2. **Template Selection**: Choose based on user tier
3. **HTML Generation**: Create report HTML
4. **PDF Conversion**: Use Puppeteer for PDF generation
5. **File Storage**: Save to filesystem
6. **Response**: Return PDF or download link

### **Report Templates**

#### **Standard Report (Professional)**
- Flaha PA + FlahaSoil branding
- 3-page layout
- Soil properties and analysis
- Texture classification chart
- Quality indicators

#### **Custom Report (Enterprise)**
- Custom company branding
- Configurable layouts
- Advanced visualizations
- Management recommendations

## 🚀 **Performance Optimization**

### **Backend Optimizations**
- Connection pooling for database
- Response caching for calculations
- Async/await for non-blocking operations
- Memory management for PDF generation

### **Frontend Optimizations**
- Minified CSS and JavaScript
- Image optimization
- Progressive loading
- Mobile-first responsive design

### **API Response Times**
- Soil analysis: < 200ms
- PDF generation: < 3 seconds
- Authentication: < 100ms
- Database queries: < 50ms

## 🧪 **Testing Strategy**

### **Backend Testing**
```bash
# Run all tests
npm test

# Specific test suites
npm run test:auth
npm run test:soil
npm run test:reports
```

### **Test Coverage**
- Unit tests: 85%+ coverage
- Integration tests: API endpoints
- Performance tests: Load testing
- Security tests: Authentication & authorization

## 🔧 **Development Setup**

### **Prerequisites**
- Node.js 14+
- npm or yarn
- SQLite
- Git

### **Installation**
```bash
# Clone repository
git clone https://github.com/rafatahmed/FlahaSoil.git
cd FlahaSoil

# Install dependencies
npm install
cd api-implementation && npm install

# Setup database
npx prisma generate
npx prisma db push

# Start development servers
npm run dev  # Frontend (Port 3000)
npm run backend  # Backend (Port 3001)
```

### **Environment Variables**
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
PORT=3001
NODE_ENV="development"
```

## 📈 **Monitoring & Logging**

### **Application Monitoring**
- Request/response logging
- Error tracking and reporting
- Performance metrics
- Usage analytics

### **Health Checks**
- `GET /health` - API health status
- Database connectivity checks
- External service availability
- Memory and CPU monitoring

---

**Last Updated:** December 2024  
**Version:** 2.0  
**Maintainer:** Flaha Agri Tech - Precision Agriculture Division
