/**
 * Check Professional User and Generate Valid Token
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function checkProfessionalUser() {
    try {
        console.log('🔍 Checking Professional User in Database...');
        
        // Find the professional user
        const user = await prisma.user.findFirst({
            where: {
                email: 'pro@flahasoil.com'
            }
        });
        
        if (!user) {
            console.log('❌ Professional user not found');
            return;
        }
        
        console.log('✅ Professional user found:');
        console.log('  ID:', user.id);
        console.log('  Email:', user.email);
        console.log('  Name:', user.name);
        console.log('  Tier:', user.tier);
        console.log('  Email Verified:', user.emailVerified);
        
        // Generate a valid JWT token
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                tier: user.tier
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('\n🔑 Generated Valid Token:');
        console.log(token);
        
        console.log('\n📋 To use this token in browser console:');
        console.log(`localStorage.setItem('flahasoil_token', '${token}');`);
        console.log(`localStorage.setItem('flahasoil_user', '${JSON.stringify(user)}');`);
        console.log('location.reload();');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkProfessionalUser();
