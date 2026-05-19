export const API_BASE_URL = "https://app-khabar.onrender.com/api";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const buildCandidates = (url) => [
  url,
  `https://corsproxy.io/?${encodeURIComponent(url)}`,
  `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
];

export const fetchJSON = async (path, options = {}) => {
  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const targetUrl = `${API_BASE_URL}${path}`;
    const candidates = buildCandidates(targetUrl);

    for (const candidate of candidates) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const response = await fetch(candidate, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
      }
    }

    if (attempt < maxAttempts) {
      await sleep(attempt * 1200);
    }
  }

  throw lastError || new Error("Failed to fetch live API.");
};

const normalizeNews = (rows = [], category = "World") => {
  return rows.map((item) => {
    const links =
      item?.InternationalLinks ||
      item?.MiscellaneousLinks ||
      item?.FinanceLinks ||
      item?.NewsLinks ||
      item?.links ||
      [];
    const firstLink =
      Array.isArray(links) && links.length > 0
        ? links[0]?.link || links[0]?.url || links[0]
        : item?.link || item?.url || "";
    return {
      id: item.id,
      category: item?.category?.name || item?.category || category,
      title: item.heading || item.heading_en || item.title || "Untitled",
      source: item.source_name || "Unknown Source",
      publishedAt: item.createdAt ? item.createdAt.slice(0, 10) : "",
      summary: item.paragraph || item.paragraph_en || item.summary || "",
      url: firstLink || "https://example.com",
      image: item.image_url || ""
    };
  });
};

const safeFetchRows = async (path) => {
  try {
    const res = await fetchJSON(path);
    return res?.data || [];
  } catch (_err) {
    return [];
  }
};

export const fetchBackendNewsFeed = async () => {
  const newsRows = await safeFetchRows("/v1/news/get-news");

  const normalized = normalizeNews(newsRows, "Global");

  return normalized.sort((a, b) => {
    const aTs = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTs = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTs - aTs;
  });
};
