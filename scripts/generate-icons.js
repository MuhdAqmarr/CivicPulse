// Run this script with Node.js to generate placeholder icons
// Or replace icons/icon-192.png and icons/icon-512.png with your own branding

const fs = require('fs');
const path = require('path');

function generateSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#6d28d9"/>
  <path d="M${size * 0.5} ${size * 0.2}
    L${size * 0.3} ${size * 0.4} L${size * 0.3} ${size * 0.65}
    C${size * 0.3} ${size * 0.78} ${size * 0.5} ${size * 0.85} ${size * 0.5} ${size * 0.85}
    C${size * 0.5} ${size * 0.85} ${size * 0.7} ${size * 0.78} ${size * 0.7} ${size * 0.65}
    L${size * 0.7} ${size * 0.4} Z"
    fill="white" opacity="0.95"/>
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.06}" fill="#6d28d9"/>
  <rect x="${size * 0.47}" y="${size * 0.36}" width="${size * 0.06}" height="${size * 0.14}" rx="${size * 0.02}" fill="#6d28d9"/>
</svg>`;
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Save as SVG (can also be used as favicon)
fs.writeFileSync(path.join(iconsDir, 'icon-192.svg'), generateSVG(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.svg'), generateSVG(512));

console.log('SVG icons generated! Convert to PNG for full PWA support.');
console.log('Use: npx sharp-cli icon-192.svg -o icon-192.png');
