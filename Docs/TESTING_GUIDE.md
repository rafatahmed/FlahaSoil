# 🧪 FlahaSoil Advanced Visualizations - Testing Guide

**Date**: May 28, 2025  
**Status**: Ready for Comprehensive Testing  

---

## 🚀 **QUICK START TESTING**

### **Prerequisites** ✅
- [x] Backend API running on port 3001
- [x] Frontend server running on port 3000
- [x] Test visualization page available
- [x] Advanced demo page operational

---

## 📋 **TESTING CHECKLIST**

### **Phase 1: Basic API Connectivity** 🔧

#### **Test 1: Backend Health Check**
```
✅ URL: http://localhost:3001/health
✅ Expected: {"status": "OK", "service": "FlahaSoil API"}
```

#### **Test 2: Demo Endpoints Direct Test**
```powershell
# Test moisture-tension endpoint
$demoData = [Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes('{"sand":40,"clay":30,"organicMatter":2.5}'))
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/soil/demo/moisture-tension/$demoData"

# Test 3D profile endpoint  
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/soil/demo/profile-3d/$demoData"
```

**Expected Results:**
- Moisture-tension: 12 data points with tension/moistureContent
- 3D Profile: Horizon data, root zone, texture profile

---

### **Phase 2: Frontend Visualization Testing** 📊

#### **Test 3: Basic Visualization Test Page**
```
🔗 URL: http://localhost:3000/test-visualization.html

Test Steps:
1. Click "Test Moisture-Tension Curve" button
2. Verify chart renders with logarithmic scale
3. Check API response data in output panel
4. Click "Test 3D Profile" button
5. Verify 3D profile data appears in response panel
```

**Expected Results:**
- ✅ Chart.js moisture-tension curve displays
- ✅ X-axis: Logarithmic scale (0.1 to 1500 kPa)
- ✅ Y-axis: Linear scale (0-60% water content)
- ✅ Blue curve with proper data points
- ✅ API response shows JSON data

#### **Test 4: Advanced Demo Page**
```
🔗 URL: http://localhost:3000/advanced-demo.html

Test Steps:
1. Select different soil samples from dropdown
2. Click "Run Enhanced Analysis" button
3. Switch between visualization tabs
4. Test real-time parameter adjustment
```

**Expected Features:**
- ✅ Sample selection updates soil parameters
- ✅ Moisture-tension curve tab renders chart
- ✅ 3D soil profile tab shows three.js visualization
- ✅ Comparative analysis tab shows multiple samples
- ✅ Real-time adjustment sliders update visualizations

---

### **Phase 3: Authentication & Advanced Features** 🔐

#### **Test 5: User Registration & Login Flow**
```
🔗 URL: http://localhost:3000/index.html

Test Steps:
1. Register new user account
2. Verify email (if email service configured)
3. Login with credentials
4. Access advanced features
5. Test plan-based limitations
```

#### **Test 6: Authenticated Soil Analysis**
```
Test with valid JWT token:
- POST /api/v1/soil/analyze
- POST /api/v1/soil/analyze/enhanced
- GET /api/v1/soil/moisture-tension/:analysisId
- GET /api/v1/soil/profile-3d/:analysisId
```

---

### **Phase 4: Cross-Browser & Mobile Testing** 🌐

#### **Test 7: Browser Compatibility**
```
Test in each browser:
- ✅ Chrome (latest)
- ✅ Firefox (latest) 
- ✅ Edge (latest)
- ✅ Safari (if available)

Verify:
- Chart.js renders correctly
- Three.js 3D visualizations work
- API calls succeed
- No console errors
```

#### **Test 8: Mobile Responsiveness**
```
Test on mobile devices or browser dev tools:
- Responsive chart sizing
- Touch interactions work
- Mobile-friendly navigation
- Readable text and labels
```

---

## 🔍 **SPECIFIC TEST SCENARIOS**

### **Scenario A: Different Soil Types**
Test with various soil compositions:

```javascript
// Sandy soil
{"sand": 80, "clay": 10, "organicMatter": 1.0}

// Clay soil  
{"sand": 20, "clay": 60, "organicMatter": 3.0}

// Loam soil
{"sand": 40, "clay": 30, "organicMatter": 2.5}

// Organic soil
{"sand": 30, "clay": 20, "organicMatter": 8.0}
```

**Expected**: Different curve shapes and 3D profiles for each soil type

### **Scenario B: Edge Cases**
```javascript
// Minimum values
{"sand": 0, "clay": 0, "organicMatter": 0}

// Maximum values  
{"sand": 100, "clay": 0, "organicMatter": 8.0}

// Invalid data
{"sand": 150, "clay": -10, "organicMatter": "invalid"}
```

**Expected**: Graceful error handling and validation

### **Scenario C: Performance Testing**
- Load 10+ charts simultaneously
- Rapid parameter changes
- Large datasets (if available)
- Memory usage monitoring

---

## 🐛 **TROUBLESHOOTING GUIDE**

### **Common Issues & Solutions**

#### **Issue 1: Chart.js not loading**
```
Symptoms: Blank chart area, console errors about Chart
Solutions:
- Verify Chart.js CDN is accessible
- Check browser dev tools network tab
- Ensure Chart.js version compatibility
```

#### **Issue 2: API endpoints returning 404**
```
Symptoms: "Cannot GET /api/v1/soil/demo/..."
Solutions:
- Verify backend server is running on port 3001
- Check route registration in soil.js
- Confirm controller method exists
```

#### **Issue 3: Authentication not working**
```
Symptoms: 401 Unauthorized errors
Solutions:
- Check JWT token in localStorage
- Verify token hasn't expired
- Test with fresh login
```

#### **Issue 4: Charts not rendering**
```
Symptoms: Chart container empty or errors
Solutions:
- Check API response format
- Verify data transformation logic
- Inspect Chart.js configuration
```

---

## ✅ **SUCCESS CRITERIA**

### **Minimum Viable Testing** (Must Pass)
- [ ] Both servers start successfully
- [ ] Demo endpoints return valid data
- [ ] Basic moisture-tension chart renders
- [ ] No critical JavaScript errors

### **Full Feature Testing** (Should Pass)  
- [ ] All 4 visualization types work
- [ ] Authentication flow complete
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility confirmed

### **Production Ready** (Nice to Have)
- [ ] Performance under load
- [ ] Error handling comprehensive
- [ ] User experience polished
- [ ] Documentation complete

---

## 📊 **TEST REPORTING**

### **Test Results Template**
```
## Test Session: [Date/Time]

### Environment
- OS: Windows 11
- Browsers Tested: Chrome, Firefox, Edge
- Backend: Node.js + Express + Prisma
- Frontend: Static files + Chart.js + Three.js

### Results Summary
- ✅ Passed: X/Y tests
- ❌ Failed: Y tests  
- ⚠️ Issues: Z issues found

### Detailed Results
[Test Name] - [Pass/Fail] - [Notes]

### Issues Found
1. [Issue description] - [Severity] - [Status]

### Next Steps
[Action items for addressing issues]
```

---

## 🎯 **TESTING PRIORITIES**

### **HIGH PRIORITY** (Test First)
1. Demo endpoint connectivity ✅
2. Chart.js basic rendering ✅ 
3. API data transformation ✅
4. Error handling

### **MEDIUM PRIORITY** (Test Next)
1. Advanced demo page features
2. Authentication integration
3. Multiple soil type testing
4. Real-time parameter updates

### **LOW PRIORITY** (Test Last)
1. Performance optimization
2. Mobile fine-tuning
3. UI/UX polish
4. Cross-browser edge cases

---

**Happy Testing! 🚀**

Start with: http://localhost:3000/test-visualization.html
