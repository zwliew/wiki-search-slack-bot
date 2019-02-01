import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

// Provide the Google username and password as environment variables
const GOOG_USR = process.env.GOOG_USR;
const GOOG_PWD = process.env.GOOG_PWD;
const GOOG_SITES_URL =
  "https://sites.google.com/search/tinkertanker.com/tinkertanker-wiki?query=";

let initializing = false;
let page = null;
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

    // todo
    await fs.promises.mkdir(path.resolve(path.dirname(""), "public"), {
      recursive: true
    });
    await fs.promises.writeFile(
      path.resolve(path.dirname(""), "public/verify.html"),
      await page.content()
    );
  } catch (err) {
    console.error(err);
  }

  initializing = false;
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
  if (!page) {
    if (initializing) return;

    initializing = true;
    init();

    // Skip handling this request to allow time to sign into Google
    console.log("Skipping request");
    return [];
  }

  await page.goto(url);

  // Parse the page
  let attachments = [];
  const parsed = await parse(page);
  if (parsed.length > 0) {
    attachments = parsed.map(link => ({
      text: `${link.text}\n${link.href}`
    }));
  }

  return attachments;
}

// Given a page, parse it for the relevant data
async function parse(page) {
  const anchors = (await page.$$('a[jsname="bkmUnc"]')).slice(0, 3);
  if (anchors.length === 0) return [];

  return await Promise.all(
    anchors.map(async anchor => ({
      text: (await (await anchor.getProperty("textContent")).jsonValue())
        .toString()
        .split("-")[0]
        .trim(),
      href: await (await anchor.getProperty("href")).jsonValue()
    }))
  );
}

export default search;
