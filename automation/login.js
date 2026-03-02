const TARGET_URL = 'https://ap.nmmis.railway.gov.tw/maximo/';
const EXPECTED_TITLE = '臺鐵新MMIS績效指標';

async function requireSelector(page, selector, timeoutMs) {
  try {
    await page.waitForSelector(selector, { timeout: timeoutMs, state: 'visible' });
  } catch (e) {
    throw new Error(`Selector not found: ${selector}`);
  }
}

async function gotoTarget(page, timeoutMs) {
  try {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
  } catch (e) {
    throw new Error('Page load timeout');
  }
}

async function clickWithError(page, selector, timeoutMs, label) {
  try {
    await page.click(selector, { timeout: timeoutMs });
  } catch (e) {
    throw new Error(`${label} click failure`);
  }
}

async function forceFillAndVerify(page, selector, value, timeoutMs, label) {
  const locator = page.locator(selector);
  try {
    await locator.click({ timeout: timeoutMs });
    await locator.fill('', { timeout: timeoutMs });
    await locator.type(String(value), { timeout: timeoutMs });
  } catch (e) {
    throw new Error(`Selector not found: ${selector}`);
  }

  const actual = await locator.inputValue({ timeout: timeoutMs }).catch(() => '');
  if (actual !== String(value)) {
    throw new Error(`${label} mismatch: expected "${value}", got "${actual}"`);
  }
}

async function enforceValueWithDomSet(page, selector, value, timeoutMs, label) {
  const locator = page.locator(selector);
  await locator.evaluate((el, v) => {
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, String(value));

  await page.waitForFunction(
    ({ sel, expected }) => {
      const el = document.querySelector(sel);
      return Boolean(el) && el.value === expected;
    },
    { sel: selector, expected: String(value) },
    { timeout: timeoutMs }
  );

  const actual = await locator.inputValue({ timeout: timeoutMs }).catch(() => '');
  if (actual !== String(value)) {
    throw new Error(`${label} mismatch: expected "${value}", got "${actual}"`);
  }
}

async function ensureCredentialValue(page, selector, expected, timeoutMs, label) {
  const locator = page.locator(selector);
  const current = await locator.inputValue({ timeout: timeoutMs }).catch(() => '');
  if (current === String(expected)) return;
  console.log(`[automation] ${label.toLowerCase()} was changed by page, enforcing expected value`);
  await enforceValueWithDomSet(page, selector, expected, timeoutMs, label);
}

async function login(page, { username, password, timeoutMs }) {
  console.log('[automation] navigating to login page');
  await gotoTarget(page, timeoutMs);

  console.log('[automation] filling credentials');
  await requireSelector(page, '#username', timeoutMs);
  await requireSelector(page, '#password', timeoutMs);

  await forceFillAndVerify(page, '#username', username, timeoutMs, 'Username');
  await forceFillAndVerify(page, '#password', password, timeoutMs, 'Password');

  console.log('[automation] clicking checkbox');
  await requireSelector(page, '#iamnotrobot', timeoutMs);
  try {
    await page.locator('#iamnotrobot').setChecked(true, { timeout: timeoutMs });
  } catch (e) {
    await clickWithError(page, '#iamnotrobot', timeoutMs, 'Checkbox');
  }

  await ensureCredentialValue(page, '#username', username, timeoutMs, 'Username');
  await ensureCredentialValue(page, '#password', password, timeoutMs, 'Password');

  console.log('[automation] clicking login button');
  await requireSelector(page, '#loginbutton', timeoutMs);

  const nav = page
    .waitForNavigation({ waitUntil: 'domcontentloaded', timeout: timeoutMs })
    .catch(() => null);

  await clickWithError(page, '#loginbutton', timeoutMs, 'Login button');
  await nav;

  console.log('[automation] validating title');
  try {
    await page.waitForFunction(
      (expected) => document.title === expected,
      EXPECTED_TITLE,
      { timeout: timeoutMs }
    );
  } catch (e) {
    const actual = await page.title().catch(() => '');
    throw new Error(`Title mismatch: expected "${EXPECTED_TITLE}", got "${actual}"`);
  }

  console.log('[automation] login validated');
}

module.exports = {
  login
};
