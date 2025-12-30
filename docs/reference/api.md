# API Reference

Справочная документация по API endpoints проекта Pennora.

## Обзор

Проект использует Next.js API Routes для серверных endpoints.

## Endpoints

### Receipts API

#### `POST /api/receipts/parse-email`

Обработка EML файлов с чеками.

**Request:**

- `Content-Type: multipart/form-data`
- `FormData` с полем `file` (EML файл)

**Response (успех):**

```json
{
  "success": true,
  "attachments": [
    {
      "fileName": "receipt.pdf",
      "contentType": "application/pdf",
      "content": "base64-encoded-content"
    }
  ],
  "emailText": "Текст письма"
}
```

**Response (ошибка):**

```json
{
  "error": "Сообщение об ошибке",
  "status": 400
}
```

**Коды ошибок:**

- `400` — файл не предоставлен или неподдерживаемый формат
- `500` — внутренняя ошибка сервера

## Аутентификация

Все API endpoints требуют аутентификации через Supabase Auth (через middleware).

## Обработка ошибок

Все ошибки возвращаются в формате:

```json
{
  "error": "Error message",
  "status": 400
}
```

## См. также

- [Database Reference](./database.md) — структура данных
- [Architecture](../concepts/architecture.md) — архитектура API
- [Receipts Processing](../concepts/receipts.md) — обработка чеков
