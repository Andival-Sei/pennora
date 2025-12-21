# Иконки PWA

Для PWA требуются PNG иконки следующих размеров:

- `icon-192x192.png` - 192x192 пикселей
- `icon-512x512.png` - 512x512 пикселей
- `apple-touch-icon.png` - 180x180 пикселей (для iOS)

## Создание иконок

### Вариант 1: Использовать онлайн-генератор

1. Перейдите на [realfavicongenerator.net](https://realfavicongenerator.net/)
2. Загрузите исходное изображение (минимум 512x512)
3. Сгенерируйте все необходимые размеры
4. Скачайте и поместите файлы в эту папку

### Вариант 2: Конвертировать из SVG

Если у вас есть SVG файл (`icon.svg`), используйте ImageMagick:

```bash
# Установить ImageMagick (если не установлен)
# Windows: choco install imagemagick
# macOS: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# Конвертировать в PNG
convert -background none -resize 192x192 public/icons/icon.svg public/icons/icon-192x192.png
convert -background none -resize 512x512 public/icons/icon.svg public/icons/icon-512x512.png
convert -background none -resize 180x180 public/icons/icon.svg public/icons/apple-touch-icon.png
```

### Вариант 3: Использовать Node.js скрипт

```bash
# Установить sharp
pnpm add -D sharp

# Запустить скрипт генерации
node scripts/generate-icons.js
```

## Текущее состояние

Временно создан базовый SVG файл (`icon.svg`). Необходимо создать PNG версии для полноценной работы PWA.
