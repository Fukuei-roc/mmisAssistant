const HOME_URL =
  'https://ap.nmmis.railway.gov.tw/maximo/ui/?event=loadapp&value=startcntr';
const EXPECTED_HOME_TITLE = '啟動中心';

async function gotoHome(page, timeoutMs) {
  try {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
  } catch (e) {
    throw new Error('Page load timeout');
  }
}

async function ensureNotRedirectedToLogin(page, timeoutMs) {
  const currentUrl = page.url();
  if (currentUrl.includes('/maximo/') && !currentUrl.includes('/maximo/ui/')) {
    throw new Error('Redirected to login page');
  }

  const loginInputVisible = await page
    .locator('#username')
    .isVisible({ timeout: Math.min(timeoutMs, 2000) })
    .catch(() => false);
  if (loginInputVisible) {
    throw new Error('Redirected to login page');
  }
}

async function navigateHome(page, { timeoutMs }) {
  console.log('[automation] navigating to home page');
  await gotoHome(page, timeoutMs);

  await ensureNotRedirectedToLogin(page, timeoutMs);

  console.log('[automation] validating home title');
  try {
    await page.waitForFunction(
      (expected) => document.title === expected,
      EXPECTED_HOME_TITLE,
      { timeout: timeoutMs }
    );
  } catch (e) {
    const actual = await page.title().catch(() => '');
    throw new Error(`Title mismatch: expected "${EXPECTED_HOME_TITLE}", got "${actual}"`);
  }

  console.log('[automation] home navigation validated');
}

module.exports = {
  navigateHome
};
