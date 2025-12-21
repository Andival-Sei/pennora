// Простой скрипт для создания базовых PNG иконок
// Требует: pnpm add -D sharp
// Запуск: node scripts/generate-icons.js

/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

// Проверяем наличие sharp
let sharp;
try {
  sharp = require("sharp");
} catch {
  console.log("Sharp не установлен. Установите: pnpm add -D sharp");
  console.log(
    "Или используйте онлайн-генератор: https://realfavicongenerator.net/"
  );
  console.log(
    "Или используйте ImageMagick: convert -size 192x192 xc:#000000 -gravity center -pointsize 120 -fill white -annotate +0+0 'P' icon-192x192.png"
  );
  process.exit(1);
}

async function generateIcons() {
  const sizes = [
    { size: 192, name: "icon-192x192.png" },
    { size: 512, name: "icon-512x512.png" },
    { size: 180, name: "apple-touch-icon.png" },
  ];

  const iconsDir = path.join(__dirname, "../public/icons");

  for (const { size, name } of sizes) {
    const fontSize = Math.floor(size * 0.6);
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#000000" rx="${size * 0.15}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">P</text>
      </svg>
    `;

    await sharp(Buffer.from(svg)).png().toFile(path.join(iconsDir, name));

    console.log(`✓ Создан ${name}`);
  }
}

generateIcons().catch(console.error);
