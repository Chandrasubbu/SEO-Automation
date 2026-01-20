export interface SerpApiResult {
    position: number;
    title: string;
    link: string;
    snippet: string;
    source: string;
}

export class SerpApiService {
    private apiKey: string;
    private baseUrl = 'https://serpapi.com/search';

    constructor() {
        this.apiKey = process.env.SERP_API_KEY || '';
    }

    /**
     * Search for brand mentions across the web
     */
    async searchBrandMentions(brandName: string, excludeDomain?: string): Promise<SerpApiResult[]> {
        if (!this.apiKey) {
            console.warn('SERP_API_KEY not configured, returning empty results');
            return [];
        }

        const query = excludeDomain
            ? `"${brandName}" -site:${excludeDomain}`
            : `"${brandName}"`;

        return this.search(query);
    }

    /**
     * Search specific site for mentions (e.g., Reddit, Quora)
     */
    async searchSiteMentions(brandName: string, site: string): Promise<SerpApiResult[]> {
        if (!this.apiKey) {
            console.warn('SERP_API_KEY not configured, returning empty results');
            return [];
        }

        const query = `"${brandName}" site:${site}`;
        return this.search(query);
    }

    /**
     * Find competitor backlinks
     */
    async findCompetitorBacklinks(competitorDomain: string, excludeDomain: string): Promise<SerpApiResult[]> {
        if (!this.apiKey) {
            console.warn('SERP_API_KEY not configured, returning empty results');
            return [];
        }

        // Search for pages linking to competitor but not to you
        const query = `link:${competitorDomain} -site:${excludeDomain}`;
        return this.search(query);
    }

    /**
     * Core search function
     */
    private async search(query: string, num: number = 10): Promise<SerpApiResult[]> {
        const url = new URL(this.baseUrl);
        url.searchParams.append('api_key', this.apiKey);
        url.searchParams.append('q', query);
        url.searchParams.append('num', num.toString());
        url.searchParams.append('engine', 'google');

        try {
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`SerpAPI Error: ${response.status}`);
            }

            const data = await response.json();

            // Parse organic results
            const results: SerpApiResult[] = (data.organic_results || []).map((result: any, index: number) => ({
                position: index + 1,
                title: result.title,
                link: result.link,
                snippet: result.snippet || '',
                source: result.displayed_link || new URL(result.link).hostname
            }));

            return results;
        } catch (error) {
            console.error('SerpAPI search error:', error);
            return [];
        }
    }
}

export const serpApiService = new SerpApiService();
