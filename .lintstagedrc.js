module.exports = {
  // TypeScript и JavaScript файлы: ESLint проверка + Prettier форматирование
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  // JSON, Markdown, YAML файлы: только Prettier
  "*.{json,md,yml,yaml}": ["prettier --write"],
  // CSS файлы: только Prettier
  "*.{css,scss}": ["prettier --write"],
};
