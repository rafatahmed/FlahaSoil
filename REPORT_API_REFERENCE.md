# FlahaSoil Report API Quick Reference

## 🚀 **Quick Start**

### **Installation**
```bash
# Backend dependencies
cd api-implementation
npm install puppeteer

# Frontend integration
<script src="assets/js/reportManager.js"></script>
```

### **Basic Usage**
```javascript
// Check user capabilities
const capabilities = await fetch('/api/v1/reports/capabilities', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Generate standard PDF
const pdf = await fetch('/api/v1/reports/generate/standard', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ soilData: analysisResults })
});
```

---

## 📡 **API Endpoints**

### **GET /api/v1/reports/capabilities**
**Purpose**: Check user's report access level  
**Auth**: Required  
**Response**:
```json
{
  "success": true,
  "plan": "PROFESSIONAL",
  "capabilities": {
    "reportGeneration": true,
    "printFunctionality": true,
    "pdfExport": true,
    "customReports": false,
    "brandedReports": false
  }
}
```

### **POST /api/v1/reports/generate/standard**
**Purpose**: Generate standard PDF report  
**Auth**: Professional+  
**Request**:
```json
{
  "soilData": {
    "sand": 40, "clay": 30, "silt": 30,
    "organicMatter": 2.5, "densityFactor": 1.0,
    "textureClass": "clay loam",
    "fieldCapacity": 0.32, "wiltingPoint": 0.18,
    "plantAvailableWater": 0.14, "saturation": 0.45,
    "saturatedConductivity": 2.5
  }
}
```
**Response**: PDF file download

### **POST /api/v1/reports/generate/custom**
**Purpose**: Generate custom branded report  
**Auth**: Enterprise only  
**Request**:
```json
{
  "soilData": { /* same as standard */ },
  "customOptions": {
    "companyName": "Your Company",
    "companyLogo": "https://example.com/logo.png",
    "primaryColor": "#2E8B57",
    "secondaryColor": "#4682B4",
    "fontFamily": "Arial",
    "includeRecommendations": true
  }
}
```
**Response**: Custom branded PDF file

### **POST /api/v1/reports/preview/standard**
**Purpose**: HTML preview of standard report  
**Auth**: Professional+  
**Request**: Same as generate/standard  
**Response**: HTML content

### **POST /api/v1/reports/preview/custom**
**Purpose**: HTML preview of custom report  
**Auth**: Enterprise only  
**Request**: Same as generate/custom  
**Response**: HTML content

### **GET /api/v1/reports/templates**
**Purpose**: Get available report templates  
**Auth**: Enterprise only  
**Response**:
```json
{
  "success": true,
  "templates": [
    {
      "id": "standard",
      "name": "Standard Report",
      "description": "Basic soil analysis report",
      "features": ["Soil composition", "Water characteristics"]
    }
  ]
}
```

---

## 🎨 **Frontend Integration**

### **HTML Structure**
```html
<!-- Report Controls (Professional+ only) -->
<div class="report-controls" id="reportControls" style="display: none;">
  <button id="print-btn" onclick="printReport()">🖨️ Print Report</button>
  <button id="generate-report-btn" onclick="generateReport()">📄 Generate PDF</button>
  <button id="custom-report-btn" onclick="generateCustomReport()">🎨 Custom Report</button>
</div>
```

### **JavaScript Integration**
```javascript
// Initialize report manager
window.reportManager = new ReportManager();

// Update soil data for reports
reportManager.updateSoilData(analysisResults);

// Generate reports
function printReport() {
  reportManager.printReport();
}

function generateReport() {
  reportManager.generateReport();
}

function generateCustomReport() {
  reportManager.generateCustomReport();
}
```

### **CSS Styling**
```css
.report-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 15px;
}

.btn-print, .btn-generate-report, .btn-custom-report {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

@media print {
  .report-controls, .navigation { display: none !important; }
  .printable-content { visibility: visible; }
}
```

---

## 🔒 **Access Control**

### **Plan Features**
```javascript
// planAccess.js configuration
const planFeatures = {
  FREE: {
    reportGeneration: false,
    printFunctionality: false,
    pdfExport: false,
    customReports: false,
    brandedReports: false
  },
  PROFESSIONAL: {
    reportGeneration: true,
    printFunctionality: true,
    pdfExport: true,
    customReports: false,
    brandedReports: false
  },
  ENTERPRISE: {
    reportGeneration: true,
    printFunctionality: true,
    pdfExport: true,
    customReports: true,
    brandedReports: true
  }
};
```

### **Middleware Usage**
```javascript
// Protect report endpoints
router.post('/generate/standard', 
  authMiddleware, 
  requireFeature('reportGeneration'),
  async (req, res) => { /* handler */ }
);

router.post('/generate/custom',
  authMiddleware,
  requireFeature('customReports'),
  async (req, res) => { /* handler */ }
);
```

---

## 🛠️ **Backend Implementation**

### **ReportService Class**
```javascript
const ReportService = require('../services/reportService');
const reportService = new ReportService();

// Generate standard report
const pdfBuffer = await reportService.generateStandardReport(soilData, userInfo);

// Generate custom report
const customPdfBuffer = await reportService.generateCustomReport(
  soilData, 
  userInfo, 
  customOptions
);

// Cleanup resources
await reportService.closeBrowser();
```

### **Route Handler Example**
```javascript
router.post('/generate/standard', authMiddleware, requireFeature('reportGeneration'),
  async (req, res) => {
    try {
      const { soilData } = req.body;
      const pdfBuffer = await reportService.generateStandardReport(soilData, req.user);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);
```

---

## 📊 **Data Structures**

### **Soil Data Object**
```javascript
const soilData = {
  // Required fields
  sand: 40,                    // Percentage (0-100)
  clay: 30,                    // Percentage (0-100)
  silt: 30,                    // Calculated: 100 - sand - clay
  organicMatter: 2.5,          // Percentage (0-8)
  densityFactor: 1.0,          // g/cm³ (0.9-1.8)
  
  // Analysis results
  textureClass: "clay loam",
  fieldCapacity: 0.32,
  wiltingPoint: 0.18,
  plantAvailableWater: 0.14,
  saturation: 0.45,
  saturatedConductivity: 2.5,
  
  // Optional fields
  gravelContent: 0,            // Percentage (0-100)
  electricalConductivity: 0    // dS/m
};
```

### **Custom Options Object**
```javascript
const customOptions = {
  companyName: "Your Company Name",
  companyLogo: "https://example.com/logo.png",  // Optional
  primaryColor: "#2E8B57",                      // Hex color
  secondaryColor: "#4682B4",                    // Hex color
  fontFamily: "Arial",                          // Font name
  pageFormat: "A4",                             // A4, Letter, etc.
  includeRecommendations: true,                 // Boolean
  margins: {                                    // Optional
    top: "20mm",
    right: "15mm", 
    bottom: "20mm",
    left: "15mm"
  }
};
```

---

## ⚡ **Performance Tips**

### **PDF Generation**
- **Memory**: Ensure adequate RAM (minimum 512MB available)
- **Concurrency**: Limit simultaneous PDF generation (max 3-5)
- **Cleanup**: Always close browser instances after use
- **Caching**: Cache HTML templates for faster generation

### **Frontend Optimization**
- **Lazy Loading**: Load reportManager.js only when needed
- **Data Validation**: Validate soil data before API calls
- **Error Handling**: Implement proper error boundaries
- **User Feedback**: Show loading states during PDF generation

### **Production Deployment**
```javascript
// Puppeteer production config
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu'
  ]
});
```

---

## 🐛 **Common Issues & Solutions**

### **PDF Generation Fails**
```javascript
// Check Puppeteer installation
npm list puppeteer

// Verify browser launch
const browser = await puppeteer.launch({ headless: true });
console.log('Browser launched successfully');
```

### **Report Buttons Not Visible**
```javascript
// Check user capabilities
const capabilities = await reportManager.loadReportCapabilities();
console.log('User capabilities:', capabilities);

// Verify authentication
const token = localStorage.getItem('flahasoil_token');
console.log('Token exists:', !!token);
```

### **Custom Reports Not Working**
```javascript
// Verify Enterprise access
if (!capabilities.customReports) {
  console.error('Custom reports require Enterprise plan');
}

// Check custom options validation
const validOptions = reportService.validateCustomOptions(customOptions);
```

---

## 📞 **Support**

### **Error Codes**
- **400**: Invalid soil data or custom options
- **401**: Authentication required
- **403**: Insufficient plan access (upgrade required)
- **500**: PDF generation failed (check server logs)

### **Debug Commands**
```bash
# Check Puppeteer installation
npm list puppeteer

# Test PDF generation
curl -X POST http://localhost:3001/api/v1/reports/capabilities \
  -H "Authorization: Bearer $TOKEN"

# Monitor server logs
tail -f api-implementation/logs/app.log
```

### **Resources**
- **Full Documentation**: `REPORT_DOCUMENTATION.md`
- **User Guide**: `REPORT_USER_GUIDE.md`
- **API Reference**: `API.md`
- **GitHub Issues**: Report bugs and feature requests

---

**Quick reference for FlahaSoil report and print functionality - Professional PDF generation with tier-based access control.** 📄🚀
