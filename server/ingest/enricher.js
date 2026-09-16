import * as cheerio from "cheerio";

export async function enrichUrl(url) {
  try {
    const res = await fetch(url, {
      headers: {
        // pretend to be a browser, some sites block bots
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)",
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // extract open graph + meta tags — these are very reliable
    const title =
      $('meta[property="og:title"]').attr("content") || $("title").text();

    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content");

    const image = $('meta[property="og:image"]').attr("content");
    const siteName = $('meta[property="og:site_name"]').attr("content");

    return { title, description, image, siteName, url };
  } catch (err) {
    console.error("URL enrichment failed:", err.message);
    return { url }; // fall back gracefully
  }
}
