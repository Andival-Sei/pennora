// Скрипт для создания PNG иконок из SVG
// Требует: pnpm add -D sharp (уже установлен)
// Запуск: node scripts/generate-icons.js

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

async function generateIcons() {
  const iconsDir = path.join(__dirname, "../public/icons");
  const svgPath = path.join(iconsDir, "icon.svg");

  // Проверяем наличие SVG файла
  if (!fs.existsSync(svgPath)) {
    console.error("❌ Файл icon.svg не найден в public/icons/");
    process.exit(1);
  }

  // Читаем SVG
  const svgBuffer = fs.readFileSync(svgPath);

  // Размеры для генерации
  const sizes = [
    { size: 16, name: "favicon-16x16.png" },
    { size: 32, name: "favicon-32x32.png" },
    { size: 180, name: "apple-touch-icon.png" },
    { size: 192, name: "icon-192x192.png" },
    { size: 512, name: "icon-512x512.png" },
  ];

  console.log("🎨 Генерация иконок из icon.svg...\n");

  for (const { size, name } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(iconsDir, name));

    console.log(`✓ Создан ${name} (${size}x${size})`);
  }

  // Создаём favicon.ico (мультиразмерный ICO файл)
  // Для этого создаём временные файлы и объединяем их
  const favicon16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const favicon32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();

  // Для ICO используем простой подход - создаём 32x32 как favicon.ico
  // (полная поддержка ICO требует специальной библиотеки, но большинство браузеров принимают PNG)
  await sharp(favicon32)
    .png()
    .toFile(path.join(__dirname, "../public/favicon.ico"));

  console.log(`✓ Создан favicon.ico (32x32)`);
  console.log("\n✨ Все иконки успешно созданы!");
}

generateIcons().catch(console.error);
