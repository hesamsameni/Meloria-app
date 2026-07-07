import { getCachedBook, setCachedBook } from "../services/cache.js";

const BASE_URL = "https://openlibrary.org";
const OL_HEADERS = {
  "User-Agent": "Meloria/1.0 (personal app; contact@meloria-app.com)",
};

export async function searchBook(title, author = "") {
  try {
    // Check cache first (before any API calls)
    const cached = await getCachedBook(title, author);
    if (cached) {
      return cached;
    }

    const q = author ? `${title} ${author}` : title;
    const url = `${BASE_URL}/search.json?q=${encodeURIComponent(q)}&limit=1&fields=key,title,author_name,author_key,cover_i,first_publish_year,isbn,subject`;

    // Each attempt needs its own AbortController so retry works cleanly
    const doFetch = () => {
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 15000); // 15s per attempt
      return fetch(url, {
        signal: ctrl.signal,
        headers: {
          "User-Agent": "Meloria/1.0 (personal app; contact@meloria-app.com)",
        },
      }).finally(() => clearTimeout(tm));
    };

    let res = await doFetch();

    // 503 = Open Library overloaded — retry once after 2s
    if (res.status === 503) {
      console.warn("[Books] Open Library 503, retrying in 2s…");
      await new Promise((r) => setTimeout(r, 2000));
      res = await doFetch();
    }

    // check content type before parsing
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.error("Open Library returned non-JSON:", res.status, contentType);
      return buildFallback(title, author);
    }

    const data = await res.json();
    const book = data.docs?.[0];

    // no results — return just the search links
    if (!book) return buildFallback(title, author);

    const openLibraryId = book.key ?? null;
    const coverId = book.cover_i;
    const authorOlid = book.author_key?.[0]?.replace("/authors/", "") ?? null;
    const searchTerm = encodeURIComponent(`${title} ${author}`.trim());

    const resultData = {
      open_library_id: openLibraryId,
      artwork_url: coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : null,
      author_name: book.author_name?.[0] ?? null,
      author_photo_url: authorOlid
        ? `https://covers.openlibrary.org/a/olid/${authorOlid}-M.jpg?default=false`
        : null,
      release_year: String(book.first_publish_year ?? ""),
      genres: book.subject?.slice(0, 5) ?? [],
      amazon_url: `https://www.amazon.com/s?k=${searchTerm}`,
      goodreads_url: `https://www.goodreads.com/search?q=${searchTerm}`,
      audible_url: `https://www.audible.com/search?keywords=${searchTerm}`,
    };

    // Store in cache (keyed by search query)
    await setCachedBook(title, author, resultData);

    return resultData;
  } catch (e) {
    console.error("Book enrichment failed:", e.message);
    return buildFallback(title, author);
  }
}

// always return search links even if the API fails
function buildFallback(title, author) {
  const searchTerm = encodeURIComponent(`${title} ${author}`.trim());
  return {
    amazon_url: `https://www.amazon.com/s?k=${searchTerm}`,
    goodreads_url: `https://www.goodreads.com/search?q=${searchTerm}`,
    audible_url: `https://www.audible.com/search?keywords=${searchTerm}`,
  };
}

// Lightweight candidate list for the capture-bar dropdown (sure mode)
export async function searchBookCandidates(title) {
  try {
    const url = `${BASE_URL}/search.json?q=${encodeURIComponent(title)}&limit=6&fields=key,title,author_name,cover_i,first_publish_year`;
    const res = await fetch(url, { headers: OL_HEADERS });
    if (!res.ok) return [];
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return [];
    const data = await res.json();
    return (data.docs ?? []).map((book) => ({
      id: book.key, // e.g. "/works/OL12345W"
      title: book.title,
      author: book.author_name?.[0] ?? null,
      year: book.first_publish_year ? String(book.first_publish_year) : null,
      image_url: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : null,
      subtitle: book.author_name?.[0] ?? null,
    }));
  } catch (e) {
    console.error("Book candidate search failed:", e.message);
    return [];
  }
}

// Full enrichment for an exact OpenLibrary work key (sure-mode direct add)
export async function getBookByKey(workKey) {
  try {
    const res = await fetch(`${BASE_URL}${workKey}.json`, {
      headers: OL_HEADERS,
    });
    if (!res.ok) return null;
    const work = await res.json();
    const title = work.title ?? null;
    if (!title) return null;

    const coverId = work.covers?.[0] ?? null;

    let authorName = null;
    let authorOlid = null;
    const authorKey = work.authors?.[0]?.author?.key; // "/authors/OL..A"
    if (authorKey) {
      try {
        const ares = await fetch(`${BASE_URL}${authorKey}.json`, {
          headers: OL_HEADERS,
        });
        if (ares.ok) {
          const adata = await ares.json();
          authorName = adata.name ?? null;
          authorOlid = authorKey.replace("/authors/", "");
        }
      } catch {
        // author lookup is best-effort
      }
    }

    const yearMatch = work.first_publish_date
      ? String(work.first_publish_date).match(/\d{4}/)
      : null;
    const searchTerm = encodeURIComponent(
      `${title} ${authorName ?? ""}`.trim(),
    );

    return {
      open_library_id: workKey,
      title,
      category: "book",
      creator: authorName,
      artwork_url: coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : null,
      author_name: authorName,
      author_photo_url: authorOlid
        ? `https://covers.openlibrary.org/a/olid/${authorOlid}-M.jpg?default=false`
        : null,
      release_year: yearMatch ? yearMatch[0] : "",
      genres: work.subjects?.slice(0, 5) ?? [],
      amazon_url: `https://www.amazon.com/s?k=${searchTerm}`,
      goodreads_url: `https://www.goodreads.com/search?q=${searchTerm}`,
      audible_url: `https://www.audible.com/search?keywords=${searchTerm}`,
    };
  } catch (e) {
    console.error("Book getByKey failed:", e.message);
    return null;
  }
}
