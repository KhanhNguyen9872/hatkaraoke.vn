import { SearchResult } from "../types";
import { DEMO_SONGS } from "../constants";

// --- MOCK DATA FOR FALLBACK ---
const MOCK_DB: SearchResult[] = [
    ...DEMO_SONGS,
    { id: 'JGwWNGJdvx8', title: 'Shape of You (Karaoke)', channel: 'Sing King', thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/mqdefault.jpg' },
    { id: 'hLQl3WQQoQ0', title: 'Someone Like You (Karaoke)', channel: 'Sing King', thumbnail: 'https://img.youtube.com/vi/hLQl3WQQoQ0/mqdefault.jpg' },
    { id: 'YQHsXMglC9A', title: 'Hello (Karaoke)', channel: 'Adele', thumbnail: 'https://img.youtube.com/vi/YQHsXMglC9A/mqdefault.jpg' },
    { id: '7j3z-Ww-o6s', title: 'Sweet Caroline (Karaoke)', channel: 'Neil Diamond', thumbnail: 'https://img.youtube.com/vi/7j3z-Ww-o6s/mqdefault.jpg' },
    { id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', channel: 'Queen Official', thumbnail: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/mqdefault.jpg' },
    { id: 'Not4_s2y-9s', title: 'Despacito (Karaoke)', channel: 'Sing King', thumbnail: 'https://img.youtube.com/vi/Not4_s2y-9s/mqdefault.jpg' },
    { id: '0KSOMA3QBU0', title: 'Dark Horse (Karaoke)', channel: 'Katy Perry', thumbnail: 'https://img.youtube.com/vi/0KSOMA3QBU0/mqdefault.jpg' },
    { id: 'rtOvBOTyX00', title: 'Thinking Out Loud (Karaoke)', channel: 'Sing King', thumbnail: 'https://img.youtube.com/vi/rtOvBOTyX00/mqdefault.jpg' },
    { id: 'a5uQMwRMHcs', title: 'Rolling in the Deep (Karaoke)', channel: 'Karaoke Hits', thumbnail: 'https://img.youtube.com/vi/a5uQMwRMHcs/mqdefault.jpg' },
    { id: 'L7qXf1q4h4w', title: 'I Want It That Way (Karaoke)', channel: 'Karaoke Hits', thumbnail: 'https://img.youtube.com/vi/L7qXf1q4h4w/mqdefault.jpg' }
];

const TRENDING_MOCK: SearchResult[] = [
    { id: 'O81_5y17hQA', title: 'Cắt Đôi Nỗi Sầu (Karaoke) - Tăng Duy Tân', channel: 'Karaoke V-Pop', thumbnail: 'https://img.youtube.com/vi/O81_5y17hQA/mqdefault.jpg' },
    { id: 'Bo-0t99gq8c', title: 'Ngày Mai Người Ta Lấy Chồng (Karaoke) - Thành Đạt', channel: 'Nhạc Sống', thumbnail: 'https://img.youtube.com/vi/Bo-0t99gq8c/mqdefault.jpg' },
    { id: 'gJ98eM_lYKI', title: 'Từng Quen (Karaoke) - Wren Evans', channel: 'GenZ Karaoke', thumbnail: 'https://img.youtube.com/vi/gJ98eM_lYKI/mqdefault.jpg' },
    { id: '75JjflWKsZ8', title: 'Bật Tình Yêu Lên (Karaoke) - Tăng Duy Tân x Hòa Minzy', channel: 'V-Pop Hits', thumbnail: 'https://img.youtube.com/vi/75JjflWKsZ8/mqdefault.jpg' },
    { id: 'h2dJ-1Ww_mU', title: 'See Tình (Karaoke) - Hoàng Thùy Linh', channel: 'DTAP Music', thumbnail: 'https://img.youtube.com/vi/h2dJ-1Ww_mU/mqdefault.jpg' },
    { id: 'L_x2l5Xf0y4', title: 'Vùng Ký Ức (Karaoke) - Chillies', channel: 'Indie Viet', thumbnail: 'https://img.youtube.com/vi/L_x2l5Xf0y4/mqdefault.jpg' },
    { id: 'Q3z-1w4h5k6', title: 'Nàng Thơ (Karaoke) - Hoàng Dũng', channel: 'Ballad Viet', thumbnail: 'https://img.youtube.com/vi/Q3z-1w4h5k6/mqdefault.jpg' },
    { id: 'M9j-2k3l4n5', title: 'Hoa Nở Không Màu (Karaoke) - Hoài Lâm', channel: 'Acoustic Karaoke', thumbnail: 'https://img.youtube.com/vi/M9j-2k3l4n5/mqdefault.jpg' }
];

// --- HIGH SPEED PROXY CONFIGURATION ---
// We use a "Race" or "Waterfall" strategy. 
// 1. corsproxy.io (Hosted on Cloudflare Edge - Fastest)
// 2. codetabs (Good reliable backup)
// 3. allorigins (Slowest, last resort)
const PROXY_GENERATORS = [
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&timestamp=${Date.now()}`
];

// --- HELPER FUNCTIONS ---

// Parse the raw HTML from YouTube to find "ytInitialData" JSON
const extractDataFromHtml = (html: string) => {
    try {
        const match = html.match(/var ytInitialData = ({.*?});/);
        if (match && match[1]) {
            return JSON.parse(match[1]);
        }
        return null;
    } catch (e) {
        console.error("Failed to parse ytInitialData", e);
        return null;
    }
};

const extractVideosFromYtData = (data: any): SearchResult[] => {
    try {
        // Navigate deep into YouTube's nested JSON structure
        const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
        if (!contents) return [];

        // Find the section that contains the video list
        const itemSection = contents.find((c: any) => c.itemSectionRenderer)?.itemSectionRenderer;
        if (!itemSection?.contents) return [];

        return itemSection.contents
            .filter((item: any) => item.videoRenderer)
            .map((item: any) => {
                const v = item.videoRenderer;
                const id = v.videoId;
                // Construct high-quality thumbnail URL manually for reliability
                const thumbnail = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
                
                return {
                    id: id,
                    title: v.title?.runs?.[0]?.text || v.title?.simpleText || 'Unknown Title',
                    channel: v.ownerText?.runs?.[0]?.text || 'Unknown Channel',
                    thumbnail: thumbnail
                };
            });
    } catch (e) {
        console.warn("Error extracting videos from JSON structure", e);
        return [];
    }
};

const performMockSearch = (query: string) => {
    const normalizedQuery = query.toLowerCase();
    return MOCK_DB.filter(song => 
        song.title.toLowerCase().includes(normalizedQuery) || 
        song.channel.toLowerCase().includes(normalizedQuery)
    );
};

// Robust Fetcher that tries multiple proxies
const fetchWithProxyFallback = async (targetUrl: string): Promise<string> => {
    for (const generateProxyUrl of PROXY_GENERATORS) {
        try {
            const proxyUrl = generateProxyUrl(targetUrl);
            
            // Set a timeout of 5 seconds per proxy to fail fast if one is hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(proxyUrl, { 
                signal: controller.signal,
                headers: {
                    // Start empty, some proxies strip headers
                }
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) continue; // Try next proxy
            
            const text = await response.text();
            
            // Basic validation to ensure we didn't get a proxy error page
            if (!text || text.includes('ytInitialData') === false) {
                // If we don't see the YouTube data variable, this proxy likely failed or got blocked
                if (text.length < 1000) continue; // Suspiciously short response
            }

            return text;
        } catch (e) {
            console.warn("Proxy attempt failed, trying next...", e);
            continue;
        }
    }
    throw new Error("All proxies failed to fetch data");
};

export const searchYoutubeKaraoke = async (query: string): Promise<SearchResult[]> => {
    try {
        // 1. Construct standard YouTube search URL
        // We append "sp=EgIQAQ%253D%253D" which filters for Videos only (no channels/playlists) to reduce data size
        const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' karaoke')}&sp=EgIQAQ%253D%253D`;
        
        // 2. Fetch HTML using Multi-Proxy Strategy
        const html = await fetchWithProxyFallback(ytUrl);
        
        // 3. Extract JSON data from HTML
        const data = extractDataFromHtml(html);
        if (!data) throw new Error("Could not extract data from HTML");

        // 4. Parse results
        const results = extractVideosFromYtData(data);
        
        if (results.length === 0) return performMockSearch(query);
        return results;

    } catch (error) {
        console.error("Scraping Failed:", error);
        return performMockSearch(query);
    }
};

export const getTrendingKaraoke = async (): Promise<SearchResult[]> => {
    try {
        // TRICK: Instead of scraping the unstable "Trending" page structure, 
        // we search for specific keywords that yield trending results.
        // This reuses the robust Search parsing logic above.
        const trendingQueries = [
            "Top Karaoke Nhạc Trẻ Thịnh Hành",
            "Karaoke Mới Nhất 2025"
        ];
        // Pick one randomly to keep it fresh
        const randomQuery = trendingQueries[Math.floor(Math.random() * trendingQueries.length)];

        // Use the exact same logic as searchYoutubeKaraoke
        const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(randomQuery)}&sp=EgIQAQ%253D%253D`; // Video only
        
        const html = await fetchWithProxyFallback(ytUrl);
        const data = extractDataFromHtml(html);
        
        if (data) {
             const results = extractVideosFromYtData(data);
             if (results.length > 0) {
                 return results.slice(0, 20);
             }
        }
        
        return [...TRENDING_MOCK];

    } catch (error) {
        console.error("Trending fetch failed, using fallback:", error);
        return [...TRENDING_MOCK];
    }
};