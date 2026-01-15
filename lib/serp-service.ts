export interface SerpResult {
    position: number
    title: string
    url: string
    snippet: string
    domain: string
    favicon?: string
    // Metrics from screenshot
    lps: number
    da: number
    pa: number
    cf: number
    tf: number
    fb: number | string // Could be N/A
    inpr: number | string // Could be N/A
    links: number
    rd: number
    ri: number
}

export interface SerpFeature {
    type: 'answer_box' | 'knowledge_graph' | 'people_also_ask' | 'related_searches' | 'featured_snippet' | 'map_pack'
    data: any
}

export interface SerpAnalysisResult {
    keyword: string
    location: string
    results: SerpResult[]
    features: SerpFeature[]
    totalResults: number
    difficulty: number // Added Difficulty score
    featuresImpact: number // Added SERP features impact
    timestamp: Date
}

/**
 * SERP Service for analyzing search engine results
 * Supports SerpAPI and DataForSEO
 */
export class SerpService {
    private apiKey: string
    private provider: 'serpapi' | 'dataforseo' | 'mock'

    constructor() {
        const serpApiKey = process.env.SERP_API_KEY || process.env.SERPAPI_KEY
        if (serpApiKey) {
            this.apiKey = serpApiKey
            this.provider = 'serpapi'
        } else if (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD) {
            this.apiKey = Buffer.from(
                `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
            ).toString('base64')
            this.provider = 'dataforseo'
        } else {
            // Use mock data for development/testing
            console.warn('No SERP API configured, using mock data')
            this.apiKey = 'mock'
            this.provider = 'mock'
        }
    }

    /**
     * Analyze SERP for a given keyword
     */
    async analyze(keyword: string, location = 'United States'): Promise<SerpAnalysisResult> {
        switch (this.provider) {
            case 'serpapi':
                return await this.analyzeWithSerpAPI(keyword, location)
            case 'dataforseo':
                return await this.analyzeWithDataForSEO(keyword, location)
            case 'mock':
                return this.getMockData(keyword, location)
            default:
                throw new Error(`Unsupported SERP provider: ${this.provider}`)
        }
    }

    /**
     * Analyze SERP using SerpAPI
     */
    private async analyzeWithSerpAPI(
        keyword: string,
        location: string
    ): Promise<SerpAnalysisResult> {
        const params = new URLSearchParams({
            api_key: this.apiKey,
            q: keyword,
            location: location,
            hl: 'en',
            gl: 'us',
            num: '100'
        })

        const response = await fetch(`https://serpapi.com/search?${params}`)

        if (!response.ok) {
            throw new Error(`SerpAPI error: ${response.statusText}`)
        }

        const data = await response.json()

        return {
            keyword,
            location,
            results: (data.organic_results || []).map((r: any, i: number) => ({
                position: i + 1,
                title: r.title,
                url: r.link,
                snippet: r.snippet || '',
                domain: this.extractDomain(r.link),
                favicon: `https://www.google.com/s2/favicons?domain=${this.extractDomain(r.link)}&sz=32`,
                lps: 0, da: 0, pa: 0, cf: 0, tf: 0, fb: 'N/A', inpr: 'N/A', links: 0, rd: 0, ri: 0
            })),
            features: this.extractFeatures(data),
            totalResults: data.search_information?.total_results || 0,
            difficulty: 0,
            featuresImpact: 0,
            timestamp: new Date()
        }
    }

    /**
     * Analyze SERP using DataForSEO
     */
    private async analyzeWithDataForSEO(
        keyword: string,
        location: string
    ): Promise<SerpAnalysisResult> {
        const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([{
                keyword,
                location_name: location,
                language_code: 'en',
                depth: 100
            }])
        })

        if (!response.ok) {
            throw new Error(`DataForSEO error: ${response.statusText}`)
        }

        const data = await response.json()
        const taskData = data.tasks?.[0]?.result?.[0]

        if (!taskData) {
            throw new Error('No SERP data returned from DataForSEO')
        }

        return {
            keyword,
            location,
            results: (taskData.items || [])
                .filter((item: any) => item.type === 'organic')
                .map((item: any) => ({
                    position: item.rank_group,
                    title: item.title,
                    url: item.url,
                    snippet: item.description || '',
                    domain: this.extractDomain(item.url),
                    favicon: `https://www.google.com/s2/favicons?domain=${this.extractDomain(item.url)}&sz=32`,
                    lps: 0, da: 0, pa: 0, cf: 0, tf: 0, fb: 'N/A', inpr: 'N/A', links: 0, rd: 0, ri: 0
                })),
            features: this.extractDataForSEOFeatures(taskData.items || []),
            totalResults: taskData.se_results_count || 0,
            difficulty: 0,
            featuresImpact: 0,
            timestamp: new Date()
        }
    }

    /**
     * Get mock SERP data for testing
     */
    private getMockData(keyword: string, location: string): SerpAnalysisResult {
        const results: SerpResult[] = []
        const isLocalQuery = keyword.toLowerCase().includes('services') ||
            keyword.toLowerCase().includes('repair') ||
            keyword.toLowerCase().includes('near me') ||
            keyword.toLowerCase().includes('plumber') ||
            keyword.toLowerCase().includes('hvac');

        const localDomains = [
            'furnasmanright-time.ca', 'provincialheating.ca', 'alwaysopen.ca',
            'winnipegsupply.com', 'reliancehomecomfort.com', 'shortysplumbing.ca'
        ]

        const aggregatorDomains = [
            'yelp.ca', 'yellowpages.ca', 'bbb.org', 'houzz.com', 'trustedpros.ca'
        ]

        const genericDomains = [
            'wikipedia.org', 'forbes.com', 'healthline.com', 'nytimes.com',
            'reddit.com', 'youtube.com'
        ]

        // Generate 20 mock results
        for (let i = 1; i <= 20; i++) {
            let domain: string;
            let title: string;

            if (isLocalQuery) {
                if (i % 3 === 0) {
                    domain = aggregatorDomains[i % aggregatorDomains.length];
                    title = `THE BEST 10 ${keyword.toUpperCase()} in ${location} - ${domain}`;
                } else if (i % 5 === 0) {
                    domain = genericDomains[i % genericDomains.length];
                    title = `${keyword}: Everything You Need to Know | ${domain.split('.')[0]}`;
                } else {
                    domain = localDomains[i % localDomains.length];
                    const businessName = domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    title = `${businessName} | Expert ${keyword} in ${location}`;
                }
            } else {
                domain = genericDomains[i % genericDomains.length];
                title = `${keyword} - Resource ${i} on ${domain}`;
            }

            // Generate realistic metrics
            const da = domain.includes('wikipedia') || domain.includes('yelp') ? Math.floor(Math.random() * 20) + 75 : Math.floor(Math.random() * 30) + 10;
            const pa = Math.floor(Math.random() * 40) + 20;
            const lps = Math.floor(Math.random() * 50) + 10;
            const cf = Math.floor(Math.random() * 50) + 10;
            const tf = Math.floor(Math.random() * 40) + 5;

            results.push({
                position: i,
                title: title,
                url: `https://${domain}/${keyword.toLowerCase().replace(/ /g, '-')}`,
                snippet: `Expert ${keyword} services in ${location}. Highly rated professionals with years of experience. Contact us today for a free quote.`,
                domain: domain,
                favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
                lps,
                da,
                pa,
                cf,
                tf,
                fb: Math.random() > 0.5 ? Math.floor(Math.random() * 500) : 'N/A',
                inpr: Math.random() > 0.3 ? Math.floor(Math.random() * 1000) : 'N/A',
                links: Math.floor(Math.random() * 1000),
                rd: Math.floor(Math.random() * 100),
                ri: Math.floor(Math.random() * 80)
            })
        }

        return {
            keyword,
            location,
            results,
            features: [
                {
                    type: 'map_pack',
                    data: {
                        businesses: [
                            { name: "Winnipeg HVAC Services", rating: 4.8, reviews: 124 },
                            { name: "Manitoba Comfort Solutions", rating: 4.5, reviews: 89 },
                            { name: "Pro Heating & AC", rating: 4.9, reviews: 56 }
                        ]
                    }
                },
                {
                    type: 'people_also_ask',
                    data: [
                        `What is the average cost of ${keyword} in ${location}?`,
                        `Who are the best ${keyword} providers?`,
                        `How do I choose a ${keyword} service?`,
                        `Is ${keyword} necessary for my home?`
                    ]
                }
            ],
            totalResults: Math.floor(Math.random() * 500000) + 50000,
            difficulty: 16, // Matching screenshot "16/100 STILL EASY"
            featuresImpact: 3, // Matching screenshot "3/5 AVERAGE"
            timestamp: new Date()
        }
    }

    /**
     * Extract SERP features from SerpAPI response
     */
    private extractFeatures(data: any): SerpFeature[] {
        const features: SerpFeature[] = []

        if (data.answer_box) {
            features.push({
                type: 'answer_box',
                data: data.answer_box
            })
        }

        if (data.knowledge_graph) {
            features.push({
                type: 'knowledge_graph',
                data: data.knowledge_graph
            })
        }

        if (data.related_questions) {
            features.push({
                type: 'people_also_ask',
                data: data.related_questions
            })
        }

        if (data.related_searches) {
            features.push({
                type: 'related_searches',
                data: data.related_searches
            })
        }

        return features
    }

    /**
     * Extract SERP features from DataForSEO response
     */
    private extractDataForSEOFeatures(items: any[]): SerpFeature[] {
        const features: SerpFeature[] = []

        items.forEach(item => {
            if (item.type === 'featured_snippet') {
                features.push({
                    type: 'featured_snippet',
                    data: item
                })
            } else if (item.type === 'people_also_ask') {
                features.push({
                    type: 'people_also_ask',
                    data: item.items || []
                })
            } else if (item.type === 'related_searches') {
                features.push({
                    type: 'related_searches',
                    data: item.items || []
                })
            }
        })

        return features
    }

    /**
     * Extract domain from URL
     */
    private extractDomain(url: string): string {
        try {
            return new URL(url).hostname.replace('www.', '')
        } catch {
            return url
        }
    }

    /**
     * Get the current provider
     */
    getProvider(): string {
        return this.provider
    }
}

// Export singleton instance
export const serpService = new SerpService()
