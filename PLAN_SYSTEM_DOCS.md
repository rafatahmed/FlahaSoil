<!-- @format -->

# FlahaSoil Plan-Based System Documentation

## Overview

FlahaSoil now includes a comprehensive three-tier plan system (FREE, PROFESSIONAL, ENTERPRISE) with feature restrictions, usage limits, and plan-aware UI components.

## Plan Tiers

### FREE Plan

- **Cost**: $0/month
- **Usage Limit**: 50 analyses per month
- **Features**:
  - Basic soil texture analysis
  - Soil texture classification
  - Basic water characteristics (Field Capacity, Wilting Point, PAW)
  - Soil quality overview

### PROFESSIONAL Plan

- **Cost**: $29/month
- **Usage Limit**: 1,000 analyses per month
- **Features**:
  - Everything in FREE plan
  - Advanced soil parameters
  - Batch analysis capability
  - Analysis history
  - Export results functionality
  - Gravel content analysis
  - Electrical conductivity measurements

### ENTERPRISE Plan

- **Cost**: $99/month
- **Usage Limit**: Unlimited analyses
- **Features**:
  - Everything in PROFESSIONAL plan
  - Advanced gravel and salinity analysis
  - Bulk soil property calculations
  - Osmotic potential calculations
  - Priority support
  - API access

## Database Schema

The plan system adds the following fields to the User model:

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  password        String
  name            String
  tier            Tier      @default(FREE)
  planSelectedAt  DateTime?
  usageCount      Int       @default(0)
  usageResetDate  DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum Tier {
  FREE
  PROFESSIONAL
  ENTERPRISE
}
```

## Backend Implementation

### Plan Access Middleware (`planAccess.js`)

- `requireFeature(feature)`: Checks if user's plan includes specific feature
- `checkUsageLimit()`: Validates if user hasn't exceeded monthly usage limit
- `incrementUsage()`: Increments user's usage counter
- `resetUsageIfNeeded()`: Resets usage counter monthly

### Protected Endpoints

- `/api/soil/analyze`: Basic analysis (all plans)
- `/api/soil/analyze-advanced`: Advanced analysis (PROFESSIONAL+)
- `/api/soil/analyze-batch`: Batch analysis (PROFESSIONAL+)
- `/api/soil/history`: Analysis history (PROFESSIONAL+)
- `/api/soil/export`: Export functionality (PROFESSIONAL+)

### Plan Features

```javascript
const PLAN_FEATURES = {
	FREE: ["basic_analysis"],
	PROFESSIONAL: [
		"basic_analysis",
		"advanced_analysis",
		"batch_analysis",
		"history",
		"export",
	],
	ENTERPRISE: [
		"basic_analysis",
		"advanced_analysis",
		"batch_analysis",
		"history",
		"export",
		"unlimited_usage",
	],
};
```

## Frontend Implementation

### Plan-Aware API Client (`apiClient.js`)

- Automatic plan detection and feature checking
- Usage tracking and limit warnings
- Plan-specific error handling
- Upgrade prompt integration

### Plan-Based UI Management (`main.js`)

Key functions:

- `updatePlanStatusUI()`: Updates plan badge and status display
- `updateUsageCounter()`: Shows usage progress for FREE users
- `showPlanUpgradePrompt()`: Displays plan-specific upgrade modals
- `handlePlanUpgrade()`: Manages upgrade flow
- `updatePlanSpecificSections()`: Controls feature visibility

### UI Components

- **Plan Status Badge**: Shows current plan in header
- **Usage Counter**: Displays usage progress for FREE plan
- **Feature Upgrade Overlays**: Locks premium features with upgrade prompts
- **Plan Upgrade Modals**: Comprehensive plan comparison and upgrade flow
- **Notification Banners**: Usage warnings and plan-related notifications

## Authentication with Plan Selection

### Registration

Users can select their plan during signup:

```javascript
{
  name: "User Name",
  email: "user@example.com",
  password: "password",
  selectedPlan: "PROFESSIONAL" // Optional, defaults to FREE
}
```

### Login Response

Authentication responses include plan information:

```javascript
{
  success: true,
  token: "jwt_token",
  user: {
    id: "user_id",
    name: "User Name",
    email: "user@example.com",
    tier: "PROFESSIONAL",
    usageCount: 15,
    usageLimit: 1000,
    planSelectedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

## Usage Limits and Tracking

### Monthly Usage Reset

- Usage counters reset automatically on the monthly anniversary of plan selection
- FREE: 50 analyses/month
- PROFESSIONAL: 1,000 analyses/month
- ENTERPRISE: Unlimited

### Usage Enforcement

- Server-side validation prevents exceeding limits
- Client-side warnings at 80% and 95% usage
- Graceful degradation with upgrade prompts

## Plan Upgrade Flow

### Frontend Upgrade Process

1. User clicks upgrade button or hits feature limitation
2. Plan comparison modal displays current vs. target plan
3. User selects desired plan
4. Upgrade process initiated (payment integration point)
5. User plan updated and UI refreshed

### Backend Plan Update

```javascript
// Update user plan
await prisma.user.update({
	where: { id: userId },
	data: {
		tier: newTier,
		planSelectedAt: new Date(),
		usageCount: 0, // Reset usage on upgrade
		usageResetDate: new Date(),
	},
});
```

## Testing

### Test File

Use `test-plans.html` to test the complete plan system:

- Authentication with different plans
- Feature access based on plan tier
- Usage limit enforcement
- Plan upgrade scenarios

### Manual Testing Steps

1. Register with FREE plan
2. Perform basic analysis
3. Attempt advanced features (should show upgrade prompts)
4. Upgrade to PROFESSIONAL
5. Test advanced features
6. Test usage limit enforcement

## Styling and CSS

### Plan-Specific Styles

- Plan badges with tier-specific colors
- Usage progress bars and counters
- Feature upgrade overlays
- Modal designs for plan comparison
- Responsive design for all plan components

### CSS Classes

- `.plan-badge`: Plan tier indicator
- `.usage-counter`: Usage display
- `.feature-upgrade-overlay`: Premium feature locks
- `.plan-upgrade-modal`: Upgrade flow modals
- `.notification-banner`: Plan-related notifications

## Integration Points

### Payment System Integration

The system is designed to integrate with payment processors:

- Plan selection during signup
- Upgrade flow with payment processing
- Plan downgrade handling
- Subscription management

### Analytics Integration

Track plan-related metrics:

- Plan conversion rates
- Feature usage by plan
- Upgrade trigger points
- Usage pattern analysis

## Security Considerations

### JWT Token Enhancement

Tokens include plan information for quick client-side checks:

```javascript
{
  userId: "user_id",
  tier: "PROFESSIONAL",
  usageCount: 15,
  exp: timestamp
}
```

### Server-Side Validation

All plan restrictions enforced server-side:

- Feature access validation
- Usage limit checking
- Plan-based rate limiting

## Maintenance and Monitoring

### Usage Monitoring

- Track usage patterns by plan
- Monitor upgrade conversion rates
- Identify feature adoption by tier

### Plan Management

- Update plan features and limits
- Handle plan migrations
- Manage grandfathered plans

## Future Enhancements

### Potential Additions

- Custom enterprise plans
- Add-on features
- API rate limiting by plan
- Advanced analytics dashboard
- Team/organization plans
- Usage alerts and notifications

### Scalability Considerations

- Caching plan information
- Background usage processing
- Plan-based performance optimization
- Multi-region plan management
