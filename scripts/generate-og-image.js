// Скрипт для создания изображения превью (Open Graph) для социальных сетей
// Требует: pnpm add -D sharp (уже установлен)
// Запуск: node scripts/generate-og-image.js
//
// ВНИМАНИЕ: Если файл og-image.png уже существует, скрипт не будет его перезаписывать.
// Чтобы сгенерировать заново, удалите существующий файл или используйте флаг --force

/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const fs = require("fs");

// Проверяем наличие sharp
let sharp;
try {
  sharp = require("sharp");
} catch {
  console.log("Sharp не установлен. Установите: pnpm add -D sharp");
  process.exit(1);
}

async function generateOGImage() {
  const width = 1200;
  const height = 630;
  const publicDir = path.join(__dirname, "../public");
  const ogImagePath = path.join(publicDir, "og-image.png");

  // Проверяем, существует ли уже файл
  const force = process.argv.includes("--force");
  if (fs.existsSync(ogImagePath) && !force) {
    console.log("ℹ️  Файл og-image.png уже существует.");
    console.log(
      "   Если хотите пересоздать, удалите файл или используйте флаг --force"
    );
    console.log("   Команда: node scripts/generate-og-image.js --force");
    return;
  }

  // Создаем SVG с логотипом и текстом (базовый вариант, если пользователь не создал свой)
  const fontSize = 72;
  const titleFontSize = 96;
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#1e40af;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Фон с градиентом -->
      <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
      
      <!-- Логотип (круг с буквой P) -->
      <circle cx="150" cy="315" r="100" fill="#ffffff" opacity="0.95"/>
      <text x="150" y="340" font-family="Arial, sans-serif" font-size="120" font-weight="900" fill="#2563eb" text-anchor="middle" dominant-baseline="middle">P</text>
      
      <!-- Название приложения -->
      <text x="350" y="280" font-family="Arial, sans-serif" font-size="${titleFontSize}" font-weight="bold" fill="#ffffff">Pennora</text>
      
      <!-- Описание -->
      <text x="350" y="360" font-family="Arial, sans-serif" font-size="${fontSize}" fill="#e0e7ff">Умный учёт личного и семейного бюджета</text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).png().toFile(ogImagePath);

  console.log("✓ Создан og-image.png (1200x630)");
  console.log("  Файл сохранен в: public/og-image.png");
  console.log(
    "\n💡 Вы можете заменить этот файл своим изображением (1200x630px)"
  );
}

generateOGImage().catch(console.error);
