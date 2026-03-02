const { chromium } = require('playwright');

async function launchBrowser({ headless }) {
  const browser = await chromium.launch({ headless: Boolean(headless) });
  const context = await browser.newContext();
  const page = await context.newPage();
  return { browser, context, page };
}

async function closeBrowser(browser) {
  if (!browser) return;
  try {
    await browser.close();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[browser] close failed: ${msg}`);
  }
}

module.exports = {
  launchBrowser,
  closeBrowser
};
