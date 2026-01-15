export interface KeywordData {
    keyword: string
    searchVolume: number | null
    difficulty: number | null // 0-100
    cpc: number | null
    competition: 'low' | 'medium' | 'high' | null
    trend: number[] | null // Monthly trend data
    intent: 'informational' | 'navigational' | 'commercial' | 'transactional' | null
    position?: number | null // Ranking position for domain search
    url?: string | null // Ranking URL for domain search
}

export interface KeywordCluster {
    mainKeyword: string
    keywords: KeywordData[]
    totalVolume: number
    avgDifficulty: number
}

export interface KeywordResearchResult {
    seedKeyword: string
    mainKeyword: KeywordData
    relatedKeywords: KeywordData[]
    clusters: KeywordCluster[]
    timestamp: Date
}

/**
 * Keyword Research Service
 * Supports multiple providers and includes mock data for development
 */
export class KeywordService {
    private provider: 'semrush' | 'ahrefs' | 'dataforseo' | 'serpapi' | 'mock'
    private apiKey: string

    constructor() {
        const keywordProvider = (process.env.KEYWORD_API_KEY || '').toLowerCase()
        const serpApiKey = process.env.SERP_API_KEY || process.env.SERPAPI_KEY

        // Validation requested by user
        if (process.env.KEYWORD_API_KEY === 'SERPAPI' && !process.env.SERP_API_KEY) {
            console.warn("No SERP API configured")
        }

        if (keywordProvider === 'serpapi' && serpApiKey) {
            this.provider = 'serpapi'
            this.apiKey = serpApiKey
        } else if (process.env.SEMRUSH_API_KEY) {
            this.provider = 'semrush'
            this.apiKey = process.env.SEMRUSH_API_KEY
        } else if (process.env.AHREFS_API_KEY) {
            this.provider = 'ahrefs'
            this.apiKey = process.env.AHREFS_API_KEY
        } else if (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD) {
            this.provider = 'dataforseo'
            this.apiKey = Buffer.from(
                `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
            ).toString('base64')
        } else {
            console.warn('No keyword research API configured, using mock data')
            this.provider = 'mock'
            this.apiKey = 'mock'
        }
    }

    /**
     * Research keywords related to a seed keyword
     */
    async research(seedKeyword: string, location: string = 'us', language: string = 'en'): Promise<KeywordResearchResult> {
        switch (this.provider) {
            case 'semrush':
                return await this.researchWithSemrush(seedKeyword)
            case 'ahrefs':
                return await this.researchWithAhrefs(seedKeyword)
            case 'dataforseo':
                return await this.researchWithDataForSEO(seedKeyword, location, language)
            case 'serpapi':
                // For now use mock data as SerpAPI primarily focuses on SERP,
                // but can be extended to use their keyword endpoints if needed.
                return this.getMockData(seedKeyword)
            case 'mock':
                return this.getMockData(seedKeyword)
            default:
                throw new Error(`Unsupported keyword provider: ${this.provider}`)
        }
    }

    /**
     * Research keywords for a specific domain
     */
    async researchDomain(domain: string, location: string = 'us'): Promise<KeywordResearchResult> {
        // For now, only mock data supports domain research fully, others can be implemented similarly
        if (this.provider === 'mock') {
            return this.getMockDomainData(domain)
        }
        // Placeholder for other providers - normally would call specific API endpoints
        console.warn(`Domain research not fully implemented for ${this.provider}, falling back to mock like behavior or error`)
        if (this.provider === 'dataforseo') {
            // Very basic implementation attempt/placeholder
            return await this.researchWithDataForSEO(domain, location, 'en') // Treat domain as keyword for now if API allows
        }
        return this.getMockDomainData(domain)
    }

    /**
     * Research keywords using SEMrush API
     */
    private async researchWithSemrush(seedKeyword: string): Promise<KeywordResearchResult> {
        // Get keyword overview
        const overviewUrl = `https://api.semrush.com/?type=phrase_all&key=${this.apiKey}&phrase=${encodeURIComponent(seedKeyword)}&database=us`
        const overviewRes = await fetch(overviewUrl)
        const overviewText = await overviewRes.text()
        const overviewData = this.parseSemrushCSV(overviewText)

        // Get related keywords
        const relatedUrl = `https://api.semrush.com/?type=phrase_related&key=${this.apiKey}&phrase=${encodeURIComponent(seedKeyword)}&database=us&export_columns=Ph,Nq,Cp,Co,Nr&display_limit=50`
        const relatedRes = await fetch(relatedUrl)
        const relatedText = await relatedRes.text()
        const relatedData = this.parseSemrushCSV(relatedText)

        const mainKeyword: KeywordData = {
            keyword: seedKeyword,
            searchVolume: parseInt(overviewData[0]?.Nq || '0'),
            difficulty: parseFloat(overviewData[0]?.Kd || '0'),
            cpc: parseFloat(overviewData[0]?.Cp || '0'),
            competition: this.getCompetitionLevel(parseFloat(overviewData[0]?.Co || '0')),
            trend: null,
            intent: this.classifyIntent(seedKeyword)
        }

        const relatedKeywords: KeywordData[] = relatedData.map(row => ({
            keyword: row.Ph,
            searchVolume: parseInt(row.Nq || '0'),
            difficulty: parseFloat(row.Kd || '0'),
            cpc: parseFloat(row.Cp || '0'),
            competition: this.getCompetitionLevel(parseFloat(row.Co || '0')),
            trend: null,
            intent: this.classifyIntent(row.Ph)
        }))

        return {
            seedKeyword,
            mainKeyword,
            relatedKeywords,
            clusters: this.clusterKeywords([mainKeyword, ...relatedKeywords]),
            timestamp: new Date()
        }
    }

    /**
     * Research keywords using Ahrefs API
     */
    private async researchWithAhrefs(seedKeyword: string): Promise<KeywordResearchResult> {
        // Ahrefs API implementation
        // Note: Ahrefs API requires enterprise plan
        throw new Error('Ahrefs implementation requires enterprise API access')
    }

    /**
     * Research keywords using DataForSEO
     */
    private async researchWithDataForSEO(seedKeyword: string, location: string = 'us', language: string = 'en'): Promise<KeywordResearchResult> {
        const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([{
                keywords: [seedKeyword],
                location_code: 2840, // United States - TODO: Map location properly
                language_code: language
            }])
        })

        const data = await response.json()
        const result = data.tasks?.[0]?.result?.[0]

        if (!result) {
            throw new Error('No keyword data returned from DataForSEO')
        }

        const mainKeyword: KeywordData = {
            keyword: seedKeyword,
            searchVolume: result.search_volume || null,
            difficulty: null, // DataForSEO requires separate API call for difficulty
            cpc: result.cpc || null,
            competition: result.competition || null,
            trend: result.monthly_searches?.map((m: any) => m.search_volume) || null,
            intent: this.classifyIntent(seedKeyword)
        }

        // Get related keywords (requires separate API call)
        const relatedKeywords: KeywordData[] = []

        return {
            seedKeyword,
            mainKeyword,
            relatedKeywords,
            clusters: this.clusterKeywords([mainKeyword, ...relatedKeywords]),
            timestamp: new Date()
        }
    }

    /**
     * Get mock keyword data for testing
     */
    private getMockData(seedKeyword: string): KeywordResearchResult {
        // Base metrics derived from seed keyword length and character variety
        const hash = seedKeyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const baseVolume = (hash % 1000) * 50 + 1000;
        const baseKD = (hash % 100);
        const baseCPC = (hash % 200) / 100 + 0.5;

        const trendData = Array.from({ length: 12 }, (_, i) => {
            const seasonal = Math.sin((i / 12) * Math.PI * 2) * 0.2;
            const random = Math.random() * 0.1;
            return Math.round(baseVolume * (1 + seasonal + random));
        });

        const mainKeyword: KeywordData = {
            keyword: seedKeyword,
            searchVolume: baseVolume,
            difficulty: baseKD,
            cpc: baseCPC,
            competition: this.getCompetitionLevel(baseCPC / 10),
            trend: trendData,
            intent: this.classifyIntent(seedKeyword)
        }

        const modifiers = [
            'guide', 'tutorial', 'best', 'review', 'vs', 'alternatives',
            'how to', 'what is', 'cost', 'pricing', 'service', 'expert',
            'company', 'benefits', 'for beginners', 'tips', 'checklist'
        ];

        const relatedKeywords: KeywordData[] = modifiers
            .sort(() => Math.random() - 0.5)
            .slice(0, 15)
            .map(mod => {
                const kw = Math.random() > 0.5 ? `${seedKeyword} ${mod}` : `${mod} ${seedKeyword}`;
                const kwHash = kw.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const volume = Math.round(baseVolume * (0.1 + (kwHash % 50) / 100));
                const kd = Math.max(0, Math.min(100, baseKD + (kwHash % 40) - 20));

                return {
                    keyword: kw,
                    searchVolume: volume,
                    difficulty: kd,
                    cpc: Math.max(0.1, baseCPC * (0.5 + (kwHash % 100) / 100)),
                    competition: this.getCompetitionLevel(Math.random()),
                    trend: Array.from({ length: 12 }, () => Math.round(volume * (0.8 + Math.random() * 0.4))),
                    intent: this.classifyIntent(kw)
                };
            });

        return {
            seedKeyword,
            mainKeyword,
            relatedKeywords,
            clusters: this.clusterKeywords([mainKeyword, ...relatedKeywords]),
            timestamp: new Date()
        }
    }

    private getMockDomainData(domain: string): KeywordResearchResult {
        // Sample keyword themes based on domain name or common business niches
        const themes = ['services', 'pricing', 'reviews', 'locations', 'guide', 'solutions', 'platform'];
        const industry = domain.split('.')[0];

        const mainKeyword: KeywordData = {
            keyword: industry,
            searchVolume: 5000,
            difficulty: 45,
            cpc: 2.50,
            competition: 'medium',
            trend: [4500, 4800, 5000, 5200, 5100, 4900, 5300, 5500, 5400, 5200, 5000, 5200],
            intent: 'navigational',
            position: 1,
            url: `https://${domain}`
        }

        const relatedKeywords: KeywordData[] = themes.map((theme, i) => {
            const kw = `${industry} ${theme}`;
            const volume = Math.floor(Math.random() * 2000) + 100;
            const position = i + 1; // Top rankings for its own themes
            const kd = Math.floor(Math.random() * 60) + 10;

            return {
                keyword: kw,
                searchVolume: volume,
                difficulty: kd,
                cpc: Math.random() * 5 + 0.5,
                competition: this.getCompetitionLevel(Math.random()),
                trend: Array.from({ length: 12 }, () => Math.round(volume * (0.8 + Math.random() * 0.4))),
                intent: this.classifyIntent(kw),
                position,
                url: `https://${domain}/${theme}`
            } as KeywordData;
        });

        // Add some generic high-volume industry keywords where it ranks lower
        const genericKeywords = [
            `best ${industry} tool`,
            `${industry} software`,
            `${industry} automation`,
            `${industry} for business`,
            `how to use ${industry}`
        ].map((kw, i) => {
            const volume = Math.floor(Math.random() * 5000) + 500;
            const position = Math.floor(Math.random() * 50) + 5;

            return {
                keyword: kw,
                searchVolume: volume,
                difficulty: Math.floor(Math.random() * 30) + 50,
                cpc: Math.random() * 10 + 2,
                competition: 'high',
                trend: Array.from({ length: 12 }, () => Math.round(volume * (0.8 + Math.random() * 0.4))),
                intent: this.classifyIntent(kw),
                position,
                url: `https://${domain}/blog/${kw.toLowerCase().replace(/ /g, '-')}`
            } as KeywordData;
        });

        const allKeywords = [mainKeyword, ...relatedKeywords, ...genericKeywords];

        return {
            seedKeyword: domain,
            mainKeyword,
            relatedKeywords: allKeywords.slice(1),
            clusters: this.clusterKeywords(allKeywords),
            timestamp: new Date()
        }
    }

    /**
     * Cluster keywords by intent and topic
     */
    private clusterKeywords(keywords: KeywordData[]): KeywordCluster[] {
        const clusters: Map<string, KeywordData[]> = new Map()

        keywords.forEach(kw => {
            const intent = kw.intent || 'informational'
            if (!clusters.has(intent)) {
                clusters.set(intent, [])
            }
            clusters.get(intent)!.push(kw)
        })

        return Array.from(clusters.entries()).map(([intent, kws]) => ({
            mainKeyword: intent,
            keywords: kws,
            totalVolume: kws.reduce((sum, k) => sum + (k.searchVolume || 0), 0),
            avgDifficulty: kws.reduce((sum, k) => sum + (k.difficulty || 0), 0) / kws.length
        }))
    }

    /**
     * Classify keyword intent
     */
    private classifyIntent(keyword: string): 'informational' | 'navigational' | 'commercial' | 'transactional' {
        const lower = keyword.toLowerCase()

        // Transactional indicators
        if (/\b(buy|purchase|order|shop|price|cost|cheap|discount|deal|quote|hiring|technician|service)\b/.test(lower)) {
            return 'transactional'
        }

        // Commercial indicators
        if (/\b(best|top|review|compare|vs|alternative|ranking|rating)\b/.test(lower)) {
            return 'commercial'
        }

        // Navigational indicators
        if (/\b(login|sign in|official|website|contact|about|near me)\b/.test(lower)) {
            return 'navigational'
        }

        // Default to informational
        return 'informational'
    }

    /**
     * Get competition level from numeric value
     */
    private getCompetitionLevel(value: number): 'low' | 'medium' | 'high' {
        if (value < 0.33) return 'low'
        if (value < 0.66) return 'medium'
        return 'high'
    }

    /**
     * Parse SEMrush CSV response
     */
    private parseSemrushCSV(csv: string): any[] {
        const lines = csv.trim().split('\n')
        if (lines.length < 2) return []

        const headers = lines[0].split(';')
        return lines.slice(1).map(line => {
            const values = line.split(';')
            const obj: any = {}
            headers.forEach((header, i) => {
                obj[header] = values[i]
            })
            return obj
        })
    }

    /**
     * Get the current provider
     */
    getProvider(): string {
        return this.provider
    }
}

// Export singleton instance
export const keywordService = new KeywordService()
