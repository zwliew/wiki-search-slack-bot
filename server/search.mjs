import browse from "./browser";

const GOOG_SITES_URL =
  "https://sites.google.com/search/tinkertanker.com/tinkertanker-wiki?query=";

// Stores the current page (should be Google-authenticated)
let page = null;

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
    browse(url).then(ret => (page = ret));

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

  const descriptions = await page.$$('div[class="TmR1rb"]');

  return await Promise.all(
    anchors.map(async (anchor, idx) => ({
      title: (await (await anchor.getProperty("textContent")).jsonValue())
        .toString()
        .split("-")[0]
        .trim(),
      title_link: await (await anchor.getProperty("href")).jsonValue(),
      text:
        descriptions.length > 0
          ? (await (await descriptions[idx].getProperty(
              "innerHTML"
            )).jsonValue())
              .toString()
              .replace(/&nbsp;/g, " ")
              .trim()
              .replace(/<b>(.+?)<\/b>/g, "*$1*")
          : null
    }))
  );
}

export default search;
