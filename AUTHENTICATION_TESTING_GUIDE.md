<!-- @format -->

# FlahaSoil Authentication System - Testing Guide

## Overview

This guide covers testing the complete authentication system with email verification, password reset, and enhanced security features.

## Prerequisites

1. Backend API server running on port 3001
2. Frontend server running on port 8080 (or direct file access)
3. Email service configured (Ethereal for development)

## Features Implemented

### ✅ User Registration with Email Verification

- User registration with hashed passwords
- Automatic welcome and verification email sending
- Email verification status tracking
- Email verification UI pages

### ✅ Password Reset System

- Forgot password email functionality
- Secure token-based password reset
- Password reset UI pages
- Token validation and expiration

### ✅ Email Verification System

- Email verification endpoint
- Resend verification email functionality
- Verification status display in profile
- Email verification success/error pages

### ✅ Enhanced Security

- Rate limiting for authentication endpoints
- JWT token-based authentication
- Password hashing with bcrypt
- Secure email token generation

### ✅ User Experience Improvements

- Modal-based login/registration
- Password reset flows
- Email verification status indicators
- Profile management with verification status

## Testing Instructions

### 1. User Registration

1. Open http://localhost:8080
2. Click "Sign Up" or register
3. Fill in registration form
4. Check server logs for email preview URLs
5. Verify user created with `emailVerified: false`

### 2. Email Verification

1. After registration, check server logs for verification email URL
2. Copy the verification token from the URL
3. Visit: http://localhost:8080/verify-email.html?token=[TOKEN]
4. Verify success message and redirect options

### 3. Password Reset

1. On login page, click "Forgot Password"
2. Enter email address
3. Check server logs for reset email URL
4. Copy reset token from URL
5. Visit: http://localhost:8080/reset-password.html?token=[TOKEN]
6. Set new password and verify success

### 4. Profile Email Status

1. Log in to the application
2. Visit profile page
3. Check email verification status display
4. Test "Resend verification" functionality

### 5. API Endpoints Testing

#### Registration

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

#### Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### Forgot Password

```bash
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

#### Email Verification

```bash
curl -X POST http://localhost:3001/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"[VERIFICATION_TOKEN]"}'
```

#### Resend Verification

```bash
curl -X POST http://localhost:3001/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

#### Reset Password

```bash
curl -X POST http://localhost:3001/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"[RESET_TOKEN]","newPassword":"newpassword123"}'
```

## Email Testing (Development)

### Ethereal Email Service

- All emails in development are sent to Ethereal Email
- Preview URLs are logged in the server console
- Access preview URLs to see email content
- No actual emails are sent in development mode

### Example Email Preview URLs

Check server logs for URLs like:

```
Preview URL: https://ethereal.email/message/[MESSAGE_ID]
```

## Rate Limiting Testing

### Authentication Limits

- 5 attempts per 15 minutes for auth endpoints
- 3 attempts per hour for password reset
- 5 attempts per hour for email verification

### Testing Rate Limits

1. Make multiple rapid requests to auth endpoints
2. Verify rate limiting responses after limits exceeded
3. Wait for reset period and test again

## Security Features

### Password Requirements

- Minimum 6 characters
- Recommended: letters, numbers, special characters
- Passwords are hashed with bcrypt (12 rounds)

### Token Security

- JWT tokens for authentication
- Separate tokens for email verification and password reset
- Token expiration (7 days for auth, 24h for verification, 1h for reset)

### CORS and Headers

- CORS configured for frontend domain
- Security headers with Helmet.js
- Request logging with Morgan

## Database Schema

### User Model

```javascript
{
  id: String (cuid)
  email: String (unique)
  name: String
  password: String (hashed)
  tier: String (FREE/PROFESSIONAL/ENTERPRISE)
  emailVerified: Boolean (default: false)
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Environment Variables

### Required for Production

```
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
FRONTEND_URL=your_frontend_url
FROM_EMAIL=your_from_email
```

### Email Service (Production)

```
NODE_ENV=production
SENDGRID_USERNAME=your_sendgrid_username
SENDGRID_PASSWORD=your_sendgrid_password
```

## Next Steps for Production

### 1. Email Service Configuration

- Set up SendGrid, AWS SES, or similar service
- Configure production SMTP credentials
- Remove development token logging
- Set up proper email templates

### 2. Enhanced Security

- Implement CSRF protection
- Add input sanitization
- Set up session management
- Configure secure headers

### 3. Testing Implementation

- Unit tests for auth endpoints
- Integration tests for email flows
- Frontend testing with Jest/Cypress
- Load testing for rate limits

### 4. Monitoring and Logging

- Set up proper logging with Winston
- Monitor email delivery rates
- Track authentication metrics
- Set up error reporting

## Troubleshooting

### Common Issues

#### Email Service Errors

- Check nodemailer configuration
- Verify email service credentials
- Check network connectivity
- Review email service logs

#### Database Issues

- Run `npm run db:push` to sync schema
- Check database connection
- Verify Prisma client generation
- Review database logs

#### Authentication Errors

- Verify JWT secret configuration
- Check token expiration settings
- Review CORS configuration
- Validate request headers

#### Frontend Issues

- Check API endpoint URLs
- Verify frontend server is running
- Review browser console for errors
- Test API client methods

## Success Criteria

### ✅ Completed Features

- [x] User registration with email verification
- [x] Password reset functionality
- [x] Email verification system
- [x] Profile email status display
- [x] Rate limiting and security
- [x] Email service integration
- [x] Frontend UI components
- [x] API client methods
- [x] Database schema updates

### 🎯 System Ready for Production

The authentication system is now complete and ready for production deployment with proper email service configuration and security hardening.
