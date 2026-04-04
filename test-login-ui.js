import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    console.log("Navigating to login page...");
    try {
        await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle', timeout: 15000 });
        
        console.log("Filling out credentials...");
        await page.fill('input[type="email"]', 'anshu1209ol@gmail.com');
        await page.fill('input[type="password"]', 'password123'); // Put some dummy password, we will get the exact error
        
        console.log("Submitting...");
        await page.click('button[type="submit"]');

        console.log("Waiting a bit...");
        await page.waitForTimeout(3000);

        // check for toasts
        const toasts = await page.locator('ol[data-sonner-toaster] li').allTextContents();
        console.log("TOAST MESSAGES:", toasts);
        
        await page.screenshot({ path: 'artifacts/login_test_result.png' });
        console.log("Saved screenshot to artifacts/login_test_result.png");

    } catch (e) {
        console.log("Puppeteer script exception:", e);
    } finally {
        await browser.close();
    }
})();
