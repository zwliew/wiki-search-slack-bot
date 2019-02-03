import puppeteer from "puppeteer";

// Read Google credentials from env
const GOOG_USR = process.env.GOOG_USR;
const GOOG_PWD = process.env.GOOG_PWD;

// Starts a new Google-authenticated browser session and
// returns the current page for browsing
async function browse(url) {
  // Disable the sandbox to run on Heroku
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto(url);

  // Log into Google account
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', GOOG_USR);
  await page.click("#next");
  await page.waitForSelector('input[type="password"]', { visible: true });
  await page.type('input[type="password"]', GOOG_PWD);

  await Promise.all([
    page.click('input[type="submit"]'),
    page.waitForNavigation()
  ]);

  // The two-factor verification process only appears during
  // a 'suspicious' sign-in attempt
  try {
    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation()
    ]);

    const code = await (await page.$('div[jsname="EKvSSd"]')).getProperty(
      "textContent"
    );
    console.log(`Code: ${code}`);
  } catch (err) {
    // Do nothing
  }

  return page;
}

export default browse;
