<!-- @format -->

# FlahaSoil Database Enhancement Plan

## Current Status: ✅ COMPLETE DATABASE INTEGRATION

The database migration from in-memory storage is **100% complete**. All core features are operational:

- User authentication and plan management
- Soil analysis history storage
- Usage tracking and analytics
- Export capabilities
- Plan-based access control

## Required Enhancements for Advanced Visualizations

### 1. Regional Soil Database Extension

#### New Database Tables Needed:

```sql
-- Regional soil characteristics
model SoilRegion {
  id          String @id @default(cuid())
  region      String // "Midwest US", "Mediterranean", etc.
  country     String
  climateZone String

  // Regional soil parameters
  avgRainfall    Float
  avgTemperature Float
  seasonalFactors Json // Seasonal adjustment factors

  // Default soil characteristics for region
  typicalSand    Float
  typicalClay    Float
  typicalOM      Float

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("soil_regions")
}

-- Enhanced soil analysis with regional data
model EnhancedSoilAnalysis {
  id            String @id @default(cuid())
  baseAnalysisId String @unique
  baseAnalysis   SoilAnalysis @relation(fields: [baseAnalysisId], references: [id])

  // Regional adjustments
  regionId      String?
  region        SoilRegion? @relation(fields: [regionId], references: [id])

  // Location data
  latitude      Float?
  longitude     Float?
  elevation     Float?

  // Time-series data for visualization
  moistureTensionCurve Json // Points for moisture-tension graph
  seasonalVariation    Json // Seasonal water characteristics

  // 3D soil profile data
  horizonData          Json // Soil horizon information
  rootZoneData         Json // Root zone characteristics

  createdAt     DateTime @default(now())

  @@map("enhanced_soil_analyses")
}

-- Moisture tension curve data points
model MoistureTensionPoint {
  id                    String @id @default(cuid())
  enhancedAnalysisId    String
  enhancedAnalysis      EnhancedSoilAnalysis @relation(fields: [enhancedAnalysisId], references: [id])

  tension               Float  // kPa
  moistureContent       Float  // %
  calculatedPoint       Boolean @default(true)

  @@map("moisture_tension_points")
}
```

### 2. Enhanced Calculation Service

#### New Methods Needed in SoilCalculationService:

```javascript
// Generate moisture-tension curve data
static generateMoistureTensionCurve(sand, clay, om, densityFactor, regionId = null) {
  // Calculate multiple points for smooth curve
  const tensions = [0.1, 1, 5, 10, 33, 100, 300, 1500]; // kPa
  const points = [];

  for (const tension of tensions) {
    const moisture = this.calculateMoistureAtTension(
      sand, clay, om, densityFactor, tension, regionId
    );
    points.push({ tension, moisture });
  }

  return points;
}

// Regional adjustment factors
static applyRegionalAdjustments(baseResults, regionId) {
  // Apply climate and regional corrections
  // Adjust for local soil conditions
  return adjustedResults;
}

// 3D soil profile calculation
static calculateSoilProfile(sand, clay, om, densityFactor, depth = 100) {
  // Generate depth-based soil characteristics
  // Calculate horizon transitions
  // Return 3D visualization data
}

// Seasonal variation calculations
static calculateSeasonalVariation(baseResults, regionId, month) {
  // Apply seasonal corrections
  // Account for freeze-thaw cycles
  // Adjust for rainfall patterns
}
```

### 3. Advanced Visualization Data Endpoints

#### New API Endpoints Required:

```javascript
// Get moisture-tension curve data
router.get(
	"/soil/moisture-tension/:analysisId",
	authMiddleware,
	requireFeature("advancedVisualizations"),
	SoilController.getMoistureTensionCurve
);

// Get 3D soil profile data
router.get(
	"/soil/profile-3d/:analysisId",
	authMiddleware,
	requireFeature("profile3D"),
	SoilController.getSoilProfile3D
);

// Comparative analysis endpoint
router.post(
	"/soil/compare",
	authMiddleware,
	requireFeature("comparativeAnalysis"),
	SoilController.compareAnalyses
);

// Real-time parameter adjustment
router.post(
	"/soil/adjust-realtime",
	authMiddleware,
	SoilController.adjustParametersRealtime
);

// Regional soil data
router.get("/soil/regional-data/:regionId", SoilController.getRegionalSoilData);
```

### 4. Enhanced Frontend Data Management

#### JavaScript API Client Extensions:

```javascript
// Advanced visualization methods
async getVisualizationData(analysisId, type) {
  // type: 'moisture-tension', '3d-profile', 'comparative', 'seasonal'
}

async compareAnalyses(analysisIds, comparisonType) {
  // Support multiple analysis comparison
}

async getRegionalAdjustments(location) {
  // Get regional soil parameter adjustments
}

async getRealTimeUpdates(parameters) {
  // Real-time parameter adjustment for visualization
}
```

## Implementation Priority

### High Priority (Week 1-2):

1. ✅ **Database migration complete** - ALREADY DONE
2. 🔄 **Regional soil database** - Add region tables and seed data
3. 🔄 **Moisture-tension curve calculations** - Enhance calculation service
4. 🔄 **Basic advanced visualization endpoints** - API extensions

### Medium Priority (Week 3-4):

1. 🔄 **3D soil profile calculations** - Complex visualization data
2. 🔄 **Comparative analysis system** - Multi-analysis comparison
3. 🔄 **Real-time parameter adjustment** - Interactive visualization support
4. 🔄 **Seasonal variation calculations** - Time-based adjustments

### Lower Priority (Month 2):

1. 🔄 **GIS integration** - Coordinate-based soil data
2. 🔄 **Weather API integration** - Real-time environmental factors
3. 🔄 **Machine learning recommendations** - Advanced soil management
4. 🔄 **Performance optimization** - Database indexing and caching

## Database Schema Migration Strategy

1. **Add new tables without breaking existing structure**
2. **Extend existing SoilAnalysis with optional relationships**
3. **Seed regional soil database with agricultural zones**
4. **Implement backwards compatibility for existing calculations**
5. **Add database indexes for performance optimization**

## Next Development Phase

The core database infrastructure is **completely ready**. The next phase focuses on:

1. **Enhanced calculations for visualization support**
2. **Regional soil parameter database creation**
3. **Advanced API endpoints for visualization data**
4. **Frontend integration for interactive charts and graphs**

The foundation is solid - now we build the advanced features on top!
