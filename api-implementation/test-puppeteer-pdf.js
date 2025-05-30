/**
 * Simple Puppeteer PDF Test
 * Tests basic PDF generation to isolate the issue
 * @format
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function testBasicPDF() {
    console.log('🧪 Testing Basic Puppeteer PDF Generation');
    console.log('═'.repeat(50));

    let browser;
    try {
        // Launch browser
        console.log('🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Simple HTML content
        const simpleHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Test PDF</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #2E8B57; }
                p { margin: 10px 0; }
            </style>
        </head>
        <body>
            <h1>Test PDF Document</h1>
            <p>This is a simple test to verify PDF generation works correctly.</p>
            <p>Generated at: ${new Date().toISOString()}</p>
        </body>
        </html>
        `;

        console.log('📄 Setting HTML content...');
        await page.setContent(simpleHTML, { waitUntil: 'networkidle0' });

        console.log('🔧 Generating PDF...');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            }
        });

        console.log(`✅ PDF generated: ${pdfBuffer.length} bytes`);

        // Analyze the buffer
        console.log('\n🔍 PDF Buffer Analysis:');
        
        // Check header as string
        const headerStr = pdfBuffer.slice(0, 8).toString();
        console.log(`   - Header (string): "${headerStr}"`);
        
        // Check header as hex
        const headerHex = pdfBuffer.slice(0, 8).toString('hex');
        console.log(`   - Header (hex): ${headerHex}`);
        
        // Check individual bytes
        const headerBytes = Array.from(pdfBuffer.slice(0, 8));
        console.log(`   - Header (bytes): [${headerBytes.join(', ')}]`);
        
        // Convert bytes to characters
        const headerChars = headerBytes.map(b => String.fromCharCode(b)).join('');
        console.log(`   - Header (chars): "${headerChars}"`);
        
        // Check if valid PDF
        const isValidPDF = headerChars.startsWith('%PDF-');
        console.log(`   - Valid PDF: ${isValidPDF}`);

        // Save the PDF
        const outputDir = path.join(__dirname, 'debug-outputs');
        await fs.mkdir(outputDir, { recursive: true });
        
        const pdfPath = path.join(outputDir, `test-simple-${Date.now()}.pdf`);
        await fs.writeFile(pdfPath, pdfBuffer);
        console.log(`💾 PDF saved: ${pdfPath}`);

        // Test if we can read it back
        const readBuffer = await fs.readFile(pdfPath);
        const readHeaderChars = Array.from(readBuffer.slice(0, 8)).map(b => String.fromCharCode(b)).join('');
        console.log(`📖 Read back header: "${readHeaderChars}"`);
        console.log(`🔄 Buffers match: ${Buffer.compare(pdfBuffer, readBuffer) === 0}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
testBasicPDF().catch(console.error);
