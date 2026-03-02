const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const { launchBrowser, closeBrowser } = require('./automation/browserManager');
const { login } = require('./automation/login');
const { navigateHome } = require('./automation/home');
const {
  hasStorageState,
  saveStorageState,
  getStorageStatePath
} = require('./automation/sessionManager');

dotenv.config();

const app = express();
app.use(express.json());

function toBool(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const v = String(value).trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'y') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'n') return false;
  return defaultValue;
}

function buildResponse({ success, code, message, data, error }) {
  return {
    success,
    code,
    message,
    data,
    error,
    timestamp: new Date().toISOString()
  };
}

function maskValue(value) {
  const s = String(value || '');
  if (!s) return '(empty)';
  if (s.length <= 3) return '***';
  return `${s.slice(0, 2)}***${s.slice(-1)}`;
}

function readCredentialsFromDotenvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const parsed = dotenv.parse(content);
    return {
      username: parsed.USERNAME ? String(parsed.USERNAME).trim() : '',
      password: parsed.PASSWORD ? String(parsed.PASSWORD) : ''
    };
  } catch (e) {
    return { username: '', password: '' };
  }
}

app.post('/api/session/login', async (req, res) => {
  const fileCreds = readCredentialsFromDotenvFile();
  const username = fileCreds.username || (process.env.USERNAME ? String(process.env.USERNAME).trim() : '');
  const password = fileCreds.password || (process.env.PASSWORD ? String(process.env.PASSWORD) : '');
  const headless = toBool(process.env.HEADLESS, false);
  const timeoutMs = Number(process.env.TIMEOUT_MS || 30000);

  console.log(
    `[login] request received headless=${headless} timeoutMs=${timeoutMs} username=${maskValue(username)}`
  );

  let browser;
  try {
    if (!username || !password) {
      throw new Error('Missing USERNAME or PASSWORD in .env');
    }

    if (hasStorageState()) {
      console.log('[login] existing storageState.json found, validating reusable session');
      const reused = await launchBrowser({
        headless,
        storageStatePath: getStorageStatePath()
      });
      browser = reused.browser;
      try {
        await navigateHome(reused.page, { timeoutMs });
        await closeBrowser(browser);
        return res
          .status(200)
          .json(
            buildResponse({
              success: true,
              code: 200,
              message: 'Login successful',
              data: {},
              error: null
            })
          );
      } catch (reuseErr) {
        const reuseMsg = reuseErr instanceof Error ? reuseErr.message : String(reuseErr);
        console.log(`[login] existing session invalid, continuing with full login: ${reuseMsg}`);
        await closeBrowser(browser);
        browser = undefined;
      }
    }

    const launched = await launchBrowser({ headless });
    browser = launched.browser;

    await login(launched.page, {
      username,
      password,
      timeoutMs
    });

    await saveStorageState(launched.context);

    await closeBrowser(browser);

    return res
      .status(200)
      .json(
        buildResponse({
          success: true,
          code: 200,
          message: 'Login successful',
          data: {},
          error: null
        })
      );
  } catch (err) {
    const detailed = err instanceof Error ? err.message : String(err);
    console.error(`[login] failed: ${detailed}`);

    await closeBrowser(browser);

    return res
      .status(401)
      .json(
        buildResponse({
          success: false,
          code: 401,
          message: 'Login failed',
          data: null,
          error: detailed
        })
      );
  }
});

app.get('/api/session/home', async (req, res) => {
  const headless = toBool(process.env.HEADLESS, false);
  const timeoutMs = Number(process.env.TIMEOUT_MS || 30000);

  console.log(`[home] request received headless=${headless} timeoutMs=${timeoutMs}`);

  let browser;
  try {
    if (!hasStorageState()) {
      throw new Error('storageState.json does not exist. Please login first.');
    }

    const launched = await launchBrowser({
      headless,
      storageStatePath: getStorageStatePath()
    });
    browser = launched.browser;

    await navigateHome(launched.page, { timeoutMs });

    await closeBrowser(browser);

    return res
      .status(200)
      .json(
        buildResponse({
          success: true,
          code: 200,
          message: 'Navigation successful',
          data: {},
          error: null
        })
      );
  } catch (err) {
    const detailed = err instanceof Error ? err.message : String(err);
    console.error(`[home] failed: ${detailed}`);

    await closeBrowser(browser);

    return res
      .status(401)
      .json(
        buildResponse({
          success: false,
          code: 401,
          message: 'Session invalid or navigation failed',
          data: null,
          error: detailed
        })
      );
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
