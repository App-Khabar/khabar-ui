export const API_BASE_URL = "http://localhost:3000/api";

export const fetchJSON = async (path) => {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

const normalizeNews = (rows = [], category = "World") => {
  return rows.map((item) => {
    const links = item?.InternationalLinks || item?.MiscellaneousLinks || item?.FinanceLinks || [];
    const firstLink = Array.isArray(links) && links.length > 0 ? links[0]?.link : "";
    return {
      id: item.id,
      category,
      title: item.heading_en || "Untitled",
      source: item.source_name || "Unknown Source",
      publishedAt: item.createdAt ? item.createdAt.slice(0, 10) : "",
      summary: item.paragraph_en || "",
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
  const [internationalRows, miscRows, financeRows] = await Promise.all([
    safeFetchRows("/news/v1/get-international-news"),
    safeFetchRows("/news/v1/get-miscellaneous-news"),
    safeFetchRows("/news/v1/get-financial-news")
  ]);

  const normalized = [
    ...normalizeNews(internationalRows, "International"),
    ...normalizeNews(miscRows, "Miscellaneous"),
    ...normalizeNews(financeRows, "Finance")
  ];

  return normalized.sort((a, b) => {
    const aTs = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTs = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTs - aTs;
  });
};
