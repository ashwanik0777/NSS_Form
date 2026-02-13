-- SQL script to trigger font download (will be executed as Node.js)
-- This will be converted to Node.js execution
const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Setting up Hindi font for PDF generation...');
  
  // Create fonts directory if it doesn't exist
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');
  if (!require('fs').existsSync(fontsDir)) {
    require('fs').mkdirSync(fontsDir, { recursive: true });
  }
  
  // Download the font
  execSync('node public/fonts/download-hindi-font.js', { stdio: 'inherit' });
  
  console.log('Hindi font setup completed!');
} catch (error) {
  console.error('Font setup failed:', error.message);
  console.log('PDF generation will use English fallback text.');
}
