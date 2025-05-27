/** @format */

const nodemailer = require("nodemailer");

/**
 * Email service for FlahaSoil application
 * Handles sending verification emails, password reset emails, and notifications
 */

class EmailService {
	constructor() {
		this.transporter = null;
		this.initializeTransporter();
	}

	/**
	 * Initialize email transporter
	 */
	initializeTransporter() {
		// In production, use your actual SMTP credentials
		// For development, you can use services like Ethereal, Gmail, or SendGrid
		if (process.env.NODE_ENV === "production") {
			// Production configuration (example with SendGrid)
			this.transporter = nodemailer.createTransport({
				service: "SendGrid",
				auth: {
					user: process.env.SENDGRID_USERNAME,
					pass: process.env.SENDGRID_PASSWORD,
				},
			});
		} else {
			// Development configuration (using Ethereal for testing)
			this.createEtherealTransporter();
		}
	}

	/**
	 * Create Ethereal transporter for development/testing
	 */
	async createEtherealTransporter() {
		try {
			const testAccount = await nodemailer.createTestAccount();
			this.transporter = nodemailer.createTransport({
				host: "smtp.ethereal.email",
				port: 587,
				secure: false,
				auth: {
					user: testAccount.user,
					pass: testAccount.pass,
				},
			});

			console.log("Development email transporter initialized with Ethereal");
		} catch (error) {
			console.error("Failed to create Ethereal transporter:", error);
			// Fallback to console logging
			this.transporter = null;
		}
	}

	/**
	 * Send email verification email
	 * @param {string} email - Recipient email
	 * @param {string} name - Recipient name
	 * @param {string} verificationToken - Email verification token
	 */
	async sendVerificationEmail(email, name, verificationToken) {
		const verificationUrl = `${
			process.env.FRONTEND_URL || "http://localhost:3000"
		}/verify-email?token=${verificationToken}`;

		const mailOptions = {
			from: process.env.FROM_EMAIL || "noreply@flahasoil.com",
			to: email,
			subject: "Verify your FlahaSoil account",
			html: this.getVerificationEmailTemplate(name, verificationUrl),
		};

		return this.sendEmail(mailOptions);
	}

	/**
	 * Send password reset email
	 * @param {string} email - Recipient email
	 * @param {string} name - Recipient name
	 * @param {string} resetToken - Password reset token
	 */
	async sendPasswordResetEmail(email, name, resetToken) {
		const resetUrl = `${
			process.env.FRONTEND_URL || "http://localhost:3000"
		}/reset-password?token=${resetToken}`;

		const mailOptions = {
			from: process.env.FROM_EMAIL || "noreply@flahasoil.com",
			to: email,
			subject: "Reset your FlahaSoil password",
			html: this.getPasswordResetEmailTemplate(name, resetUrl),
		};

		return this.sendEmail(mailOptions);
	}

	/**
	 * Send welcome email
	 * @param {string} email - Recipient email
	 * @param {string} name - Recipient name
	 */
	async sendWelcomeEmail(email, name) {
		const mailOptions = {
			from: process.env.FROM_EMAIL || "noreply@flahasoil.com",
			to: email,
			subject: "Welcome to FlahaSoil!",
			html: this.getWelcomeEmailTemplate(name),
		};

		return this.sendEmail(mailOptions);
	}

	/**
	 * Generic send email method
	 * @param {Object} mailOptions - Nodemailer mail options
	 */
	async sendEmail(mailOptions) {
		try {
			if (!this.transporter) {
				console.log("Email would be sent:", mailOptions);
				return { success: true, messageId: "dev-mode" };
			}

			const info = await this.transporter.sendMail(mailOptions);

			if (process.env.NODE_ENV !== "production") {
				console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
			}

			return { success: true, messageId: info.messageId };
		} catch (error) {
			console.error("Email sending failed:", error);
			return { success: false, error: error.message };
		}
	}

	/**
	 * Email verification template
	 */
	getVerificationEmailTemplate(name, verificationUrl) {
		return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Verify your FlahaSoil account</title>
		</head>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
				<h1 style="color: white; margin: 0; font-size: 28px;">FlahaSoil</h1>
				<p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Professional Soil Analysis Platform</p>
			</div>
			
			<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
				<h2 style="color: #2E7D32; margin-top: 0;">Welcome to FlahaSoil, ${name}!</h2>
				
				<p>Thank you for signing up for FlahaSoil. To complete your registration and start analyzing soil data, please verify your email address by clicking the button below:</p>
				
				<div style="text-align: center; margin: 30px 0;">
					<a href="${verificationUrl}" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
				</div>
				
				<p>If the button doesn't work, you can copy and paste this link into your browser:</p>
				<p style="background: #eee; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace;">${verificationUrl}</p>
				
				<div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
					<h3 style="color: #2E7D32;">What's next?</h3>
					<ul>
						<li>Complete your first soil analysis</li>
						<li>Explore our advanced calculation features</li>
						<li>Join thousands of soil professionals using FlahaSoil</li>
					</ul>
				</div>
				
				<p style="margin-top: 30px; font-size: 14px; color: #666;">
					If you didn't create an account with FlahaSoil, you can safely ignore this email.
				</p>
			</div>
			
			<div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
				<p>© 2025 FlahaSoil. All rights reserved.</p>
				<p>Professional soil analysis made simple.</p>
			</div>
		</body>
		</html>
		`;
	}

	/**
	 * Password reset email template
	 */
	getPasswordResetEmailTemplate(name, resetUrl) {
		return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Reset your FlahaSoil password</title>
		</head>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
				<h1 style="color: white; margin: 0; font-size: 28px;">FlahaSoil</h1>
				<p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
			</div>
			
			<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
				<h2 style="color: #2E7D32; margin-top: 0;">Reset your password</h2>
				
				<p>Hi ${name},</p>
				
				<p>We received a request to reset your FlahaSoil account password. Click the button below to choose a new password:</p>
				
				<div style="text-align: center; margin: 30px 0;">
					<a href="${resetUrl}" style="background: #f44336; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
				</div>
				
				<p>If the button doesn't work, you can copy and paste this link into your browser:</p>
				<p style="background: #eee; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace;">${resetUrl}</p>
				
				<div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
					<p style="margin: 0; color: #856404;"><strong>Security Notice:</strong></p>
					<ul style="margin: 10px 0 0 0; color: #856404;">
						<li>This link will expire in 1 hour</li>
						<li>If you didn't request this reset, please ignore this email</li>
						<li>Your password won't change until you click the link above</li>
					</ul>
				</div>
				
				<p style="margin-top: 30px; font-size: 14px; color: #666;">
					If you're having trouble with your account, feel free to contact our support team.
				</p>
			</div>
			
			<div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
				<p>© 2025 FlahaSoil. All rights reserved.</p>
				<p>Professional soil analysis made simple.</p>
			</div>
		</body>
		</html>
		`;
	}

	/**
	 * Welcome email template
	 */
	getWelcomeEmailTemplate(name) {
		return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Welcome to FlahaSoil!</title>
		</head>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
				<h1 style="color: white; margin: 0; font-size: 28px;">Welcome to FlahaSoil!</h1>
				<p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your soil analysis journey starts here</p>
			</div>
			
			<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
				<h2 style="color: #2E7D32; margin-top: 0;">Hi ${name}! 🌱</h2>
				
				<p>Thank you for joining FlahaSoil! We're excited to help you with professional soil analysis and calculations.</p>
				
				<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<h3 style="color: #2E7D32; margin-top: 0;">Getting Started:</h3>
					<ol style="margin: 0; padding-left: 20px;">
						<li><strong>Try your first analysis</strong> - Input your soil composition data</li>
						<li><strong>Explore the tools</strong> - Discover our calculation features</li>
						<li><strong>View results</strong> - Get detailed soil water characteristics</li>
						<li><strong>Upgrade when ready</strong> - Unlock advanced features</li>
					</ol>
				</div>
				
				<div style="text-align: center; margin: 30px 0;">
					<a href="${
						process.env.FRONTEND_URL || "http://localhost:3000"
					}" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Start Analyzing</a>
				</div>
				
				<div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
					<h4 style="margin-top: 0; color: #2E7D32;">Your Free Plan Includes:</h4>
					<ul style="margin: 0; padding-left: 20px;">
						<li>50 soil analyses per month</li>
						<li>Basic soil water calculations</li>
						<li>USDA texture triangle visualization</li>
						<li>Export basic results</li>
					</ul>
				</div>
				
				<p>Need help? Check out our <a href="#" style="color: #4CAF50;">documentation</a> or <a href="mailto:support@flahasoil.com" style="color: #4CAF50;">contact support</a>.</p>
			</div>
			
			<div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
				<p>© 2025 FlahaSoil. All rights reserved.</p>
				<p>Professional soil analysis made simple.</p>
			</div>
		</body>
		</html>
		`;
	}
}

module.exports = new EmailService();
