# MMIS Playwright Login API

Node.js API service using Express + Playwright to automate login and return standardized JSON responses.

## Requirements

- Node.js 18+ (recommended: latest LTS)
- npm

## Project Structure

```text
project/
|
|-- server.js
|-- .env
|-- automation/
|   |-- browserManager.js
|   `-- login.js
```

## Installation

```bash
npm install
npx playwright install chromium
```

## Environment Variables

Create/update `.env`:

```env
USERNAME=0776273
PASSWORD=C@de1128
HEADLESS=false
PORT=3000
TIMEOUT_MS=30000
```

Notes:
- Login credentials are read from `.env`.
- `HEADLESS=false` = visible browser (headful)
- `HEADLESS=true` = background browser (headless)

## Start Service

```bash
npm start
```

When started, API listens on:

`http://localhost:3000` (or the `PORT` value in `.env`)

## API Endpoint

### `POST /api/session/login`

This endpoint will:
1. Launch browser
2. Open `https://ap.nmmis.railway.gov.tw/maximo/`
3. Fill username/password
4. Check `#iamnotrobot`
5. Click `#loginbutton`
6. Validate page title equals `臺鐵新MMIS績效指標`

### cURL Example

```bash
curl -X POST http://localhost:3000/api/session/login \
  -H "Content-Type: application/json" \
  -d "{}"
```

### Postman Example

- Method: `POST`
- URL: `http://localhost:3000/api/session/login`
- Header: `Content-Type: application/json`
- Body: raw JSON `{}`

## Response Format

Success:

```json
{
  "success": true,
  "code": 200,
  "message": "Login successful",
  "data": {},
  "error": null,
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

Failure:

```json
{
  "success": false,
  "code": 401,
  "message": "Login failed",
  "data": null,
  "error": "Detailed error message",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## Switching Headful / Headless

Edit `.env`:

- `HEADLESS=false` for debugging with visible browser
- `HEADLESS=true` for server/background mode

Restart the service after updating `.env`.
