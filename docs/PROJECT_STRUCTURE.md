# FlahaSoil Project Structure

## 📁 **Complete Directory Structure**

```
FlahaSoil/
├── 📄 PROJECT ROOT
├── README.md                           # Project overview
├── API.md                             # API documentation
├── CHANGELOG.md                       # Version history
├── INTEGRATION_ENDPOINTS.md           # Integration documentation
├── LICENSE                            # MIT license
├── package.json                       # Frontend dependencies
├── package-lock.json                  # Dependency lock file
├── 
├── 🌐 FRONTEND (Port 3000)
├── public/                            # Static frontend files
│   ├── landing.html                   # Marketing landing page
│   ├── index.html                     # Main authenticated app
│   ├── demo.html                      # Unauthenticated demo
│   ├── advanced-demo.html             # Advanced demo features
│   ├── profile.html                   # User profile management
│   ├── verify-email.html              # Email verification
│   ├── reset-password.html            # Password reset
│   ├── test-auth.html                 # Authentication testing
│   ├── clear-usage.html               # Usage management
│   └── assets/                        # Frontend assets
│       ├── css/                       # Stylesheets
│       │   ├── main.css               # Main styles
│       │   ├── navigation.css         # Navigation styles
│       │   ├── responsive.css         # Mobile styles
│       │   └── components.css         # Component styles
│       ├── js/                        # JavaScript modules
│       │   ├── main.js                # Main application logic
│       │   ├── auth.js                # Authentication handling
│       │   ├── soil-analysis.js       # Soil calculation interface
│       │   ├── reports.js             # Report generation
│       │   ├── navigation.js          # Navigation functionality
│       │   └── utils.js               # Utility functions
│       ├── img/                       # Images and icons
│       │   ├── logos/                 # Brand logos
│       │   ├── icons/                 # UI icons
│       │   └── backgrounds/           # Background images
│       └── data/                      # Static data files
│           ├── soil-textures.json     # Soil texture data
│           └── validation-rules.json  # Input validation rules
├── 
├── 🔧 BACKEND API (Port 3001)
├── api-implementation/                # Backend API server
│   ├── server.js                      # Express server entry point
│   ├── package.json                   # Backend dependencies
│   ├── package-lock.json              # Backend dependency lock
│   ├── 
│   ├── src/                           # Source code
│   │   ├── routes/                    # API route definitions
│   │   │   ├── auth.js                # Authentication routes
│   │   │   ├── soil.js                # Soil analysis routes
│   │   │   ├── reports.js             # Report generation routes
│   │   │   └── integrations.js        # Integration endpoints
│   │   ├── controllers/               # Business logic controllers
│   │   │   ├── authController.js      # Authentication logic
│   │   │   ├── soilController.js      # Soil analysis logic
│   │   │   ├── reportController.js    # Report generation logic
│   │   │   └── enhancedSoilController.js # Advanced features
│   │   ├── services/                  # Core business services
│   │   │   ├── soilCalculationService.js # 24-equation implementation
│   │   │   ├── reportService.js       # PDF generation service
│   │   │   ├── emailService.js        # Email notifications
│   │   │   └── authService.js         # Authentication service
│   │   ├── middleware/                # Express middleware
│   │   │   ├── auth.js                # JWT authentication
│   │   │   ├── planAccess.js          # Tier-based access control
│   │   │   ├── rateLimit.js           # Rate limiting
│   │   │   └── validation.js          # Input validation
│   │   ├── utils/                     # Utility functions
│   │   │   ├── constants.js           # Application constants
│   │   │   ├── helpers.js             # Helper functions
│   │   │   └── validators.js          # Data validators
│   │   └── templates/                 # Report templates
│   │       ├── standard-report.html   # Standard PDF template
│   │       ├── custom-report.html     # Custom PDF template
│   │       └── email-templates/       # Email templates
│   ├── 
│   ├── prisma/                        # Database management
│   │   ├── schema.prisma              # Main database schema
│   │   ├── schema-enhanced.prisma     # Enhanced features schema
│   │   ├── migrations/                # Database migrations
│   │   └── seed.js                    # Database seeding
│   ├── 
│   ├── tests/                         # Backend testing
│   │   ├── auth.test.js               # Authentication tests
│   │   ├── soil.test.js               # Soil analysis tests
│   │   ├── reports.test.js            # Report generation tests
│   │   └── integration.test.js        # Integration tests
│   ├── 
│   ├── scripts/                       # Utility scripts
│   │   ├── seed.js                    # Database seeding
│   │   ├── migrate.js                 # Migration runner
│   │   └── backup.js                  # Database backup
│   └── 
│   └── docs/                          # Backend documentation
│       ├── API_REFERENCE.md           # API reference
│       ├── DEPLOYMENT.md              # Deployment guide
│       └── TROUBLESHOOTING.md         # Common issues
├── 
├── 🗄️ DATABASE
├── api-implementation/dev.db          # SQLite development database
├── api-implementation/prod.db         # SQLite production database
├── 
├── 📚 DOCUMENTATION
├── docs/                              # Comprehensive documentation
│   ├── README.md                      # Documentation hub
│   ├── TECHNICAL_OVERVIEW.md          # Technical architecture
│   ├── PROJECT_STRUCTURE.md           # This file
│   ├── 
│   ├── 🔧 TECHNICAL ARCHITECTURE
│   ├── FlahaSoil system architecture overview.mmd
│   ├── FlahaSoil Database Schema & Relationships.mmd
│   ├── FlahaSoil API Endpoints & Data Flow.mmd
│   ├── FlahaSoil Soil Analysis Calculation Flow.mmd
│   ├── 
│   ├── 💼 BUSINESS & ACCESS CONTROL
│   ├── FlahaSoil Tiered Access & Business Model.mmd
│   ├── FlahaSoil User Flow & Authentication Journey.mmd
│   ├── 
│   ├── 🎨 FRONTEND & UI
│   ├── NAVIGATION_BRANDING_GUIDE.md
│   ├── FlahaSoil-Routing-Navigation.md
│   ├── QUICK_REFERENCE.md
│   ├── 
│   ├── 🔬 BRAND & DESIGN
│   ├── Flaha Agri Tech Brand Identity Guidelines.md
│   ├── Brand Identity and Website Validation Report.md
│   ├── 
│   ├── 📄 REPORT SYSTEM
│   ├── reports/
│   │   ├── REPORT_DOCUMENTATION.md
│   │   ├── REPORT_API_REFERENCE.md
│   │   ├── REPORT_USER_GUIDE.md
│   │   └── REPORT_TEST_RESULTS.md
│   ├── 
│   └── 🖼️ ASSETS
│       ├── soil_data_analysis.png
│       └── Untitled-2.svg
├── 
├── 🧪 TESTING
├── tests/                             # Frontend testing
│   ├── test-enhanced-features.js      # Enhanced feature tests
│   ├── test-outputs/                  # Test output files
│   ├── test-report-basic.js           # Basic report tests
│   ├── test-report-functionality.js   # Report functionality tests
│   ├── test-report-performance.js     # Performance tests
│   ├── test-report-sequence.js        # Sequence tests
│   ├── test-report-workflow.js        # Workflow tests
│   ├── run-all-report-tests.js        # Test runner
│   └── report-cache/                  # Test cache directory
├── 
├── 📜 SCRIPTS & AUTOMATION
├── scripts/                           # Development scripts
│   ├── launch-flaha.bat               # Windows launcher
│   ├── launch-flaha.ps1               # PowerShell launcher
│   ├── launch-flaha.sh                # Unix launcher
│   ├── quick-start.bat                # Quick start (Windows)
│   ├── quick-start.sh                 # Quick start (Unix)
│   ├── dev-start.sh                   # Development start
│   ├── FlahaSoil Launch Scripts.md    # Script documentation
│   └── cleanup.md                     # Cleanup procedures
├── 
├── 📊 LOGS & MONITORING
├── logs/                              # Application logs
│   ├── backend.pid                    # Backend process ID
│   ├── frontend.pid                   # Frontend process ID
│   ├── error.log                      # Error logs
│   └── access.log                     # Access logs
├── 
└── 🔧 CONFIGURATION
    ├── .env                           # Environment variables
    ├── .env.example                   # Environment template
    ├── .gitignore                     # Git ignore rules
    ├── .eslintrc.js                   # ESLint configuration
    ├── .prettierrc                    # Prettier configuration
    └── docker-compose.yml             # Docker configuration
```

## 🏗️ **Architecture Layers**

### **1. Presentation Layer (Frontend)**
- **Location**: `public/`
- **Technology**: HTML5, CSS3, JavaScript
- **Responsibility**: User interface and user experience
- **Port**: 3000

### **2. API Layer (Backend)**
- **Location**: `api-implementation/`
- **Technology**: Node.js, Express.js
- **Responsibility**: Business logic and data processing
- **Port**: 3001

### **3. Data Layer (Database)**
- **Location**: `api-implementation/prisma/`
- **Technology**: SQLite with Prisma ORM
- **Responsibility**: Data persistence and management

### **4. Service Layer**
- **Location**: `api-implementation/src/services/`
- **Technology**: Node.js modules
- **Responsibility**: Core business services and calculations

## 📋 **Key File Descriptions**

### **Frontend Files**
- `landing.html`: Marketing page with registration/login
- `index.html`: Main authenticated application interface
- `demo.html`: Unauthenticated demo for trial users
- `advanced-demo.html`: Advanced features demonstration
- `profile.html`: User profile and subscription management

### **Backend Files**
- `server.js`: Express server configuration and startup
- `soilCalculationService.js`: Complete 24-equation implementation
- `reportService.js`: PDF generation using Puppeteer
- `authController.js`: JWT authentication and user management

### **Database Files**
- `schema.prisma`: Main database schema definition
- `migrations/`: Database version control and updates
- `seed.js`: Initial data population scripts

### **Documentation Files**
- `README.md`: Project overview and quick start
- `API.md`: Complete API documentation
- `TECHNICAL_OVERVIEW.md`: Technical architecture details
- `docs/`: Comprehensive documentation hub

## 🔄 **Data Flow**

### **Request Flow**
1. **Frontend** → HTTP Request → **Backend API**
2. **Backend** → Authentication → **Middleware**
3. **Middleware** → Business Logic → **Controllers**
4. **Controllers** → Data Processing → **Services**
5. **Services** → Data Access → **Database**
6. **Database** → Results → **Services** → **Controllers** → **Frontend**

### **Authentication Flow**
1. User login → JWT token generation
2. Token storage in frontend
3. Token validation on each API request
4. Tier-based access control enforcement

### **Calculation Flow**
1. Input validation → Saxton & Rawls equations
2. Tier-based feature access → Results generation
3. Data storage → Response formatting

## 🚀 **Development Workflow**

### **Local Development**
```bash
# Start frontend (Port 3000)
npm run dev

# Start backend (Port 3001)
npm run backend

# Run tests
npm test
```

### **Production Deployment**
```bash
# Build frontend
npm run build

# Start production backend
npm start

# Database migration
npx prisma migrate deploy
```

---

**Last Updated:** December 2024  
**Version:** 2.0  
**Maintainer:** Flaha Agri Tech - Precision Agriculture Division
