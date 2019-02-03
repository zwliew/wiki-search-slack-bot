import puppeteer from "puppeteer";

// Provide the Google username and password as environment variables
const GOOG_USR = process.env.GOOG_USR;
const GOOG_PWD = process.env.GOOG_PWD;
const GOOG_SITES_URL =
  "https://sites.google.com/search/tinkertanker.com/tinkertanker-wiki?query=";

let page = null;
let initialized = false;
async function init() {
  // Disable the sandbox to run on Heroku
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  page = await browser.newPage();

  await page.goto(GOOG_SITES_URL);

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

  initialized = true;
}

// Search the wiki with a given query string
async function search(query) {
  query = query.trim();
  if (query.length === 0) {
    return {
      text: "Enter a search term to begin your search."
    };
  }

  const url = `${GOOG_SITES_URL}${query}`;
  const result = {
    text: `More results here: ${url}`,
    attachments: await scrape(url)
  };
  return result;
}

// Scrape the given URL for the relevant data and format it
async function scrape(url) {
  // Initialize the browser session if not already done
  if (!initialized) {
    // The browser is initializing, but not yet done
    if (page) return [];

    init();

    // Skip handling this request to allow time to sign into Google
    console.log("Skipping request");
    return [];
  }

  await page.goto(url);

  // Parse the page
  return await parse(page);
}

// Given a page, parse it for the relevant data
async function parse(page) {
  const anchors = (await page.$$('a[jsname="bkmUnc"]')).slice(0, 3);
  if (anchors.length === 0) return [];

  const descriptions = (await page.$$('div["TmR1rb"]'));

  return await Promise.all(
    anchors.map(async (anchor, idx) => ({
      title: (await (await anchor.getProperty("textContent")).jsonValue())
        .toString()
        .split("-")[0]
        .trim(),
      title_link: await (await anchor.getProperty("href")).jsonValue(),
      text: descriptions.length > 0 ? null :
          await (await descriptions[idx].getProperty("textContent")).jsonValue()
    }))
  );
}

export default search;
