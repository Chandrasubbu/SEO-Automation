import * as cheerio from "cheerio"

// Types for audit results
export interface TechnicalAuditResult {
    url: string
    auditRegion?: string // Region from which the audit was performed
    serverLocation?: {
        country: string
        region: string
        city: string
        timezone: string
    }
    overallScore: number
    crawlabilityScore: number
    speedScore: number
    mobileScore: number
    securityScore: number
    structureScore: number
    contentScore: number
    uxScore: number
    crawlability: CrawlabilityResult
    speed: SpeedResult
    mobile: MobileResult
    security: SecurityResult
    structure: StructureResult
    content: ContentResult
    ux: UXResult
    issues: AuditIssue[]
    recommendations: Recommendation[]
}

export interface AuditIssue {
    category: string
    severity: "critical" | "warning" | "info"
    title: string
    description: string
    location?: string
    fix?: string
}

export interface Recommendation {
    priority: "high" | "medium" | "low"
    category: string
    title: string
    description: string
    impact: string
}

// Category-specific result types
export interface CrawlabilityResult {
    robotsTxt: {
        exists: boolean
        accessible: boolean
        issues: string[]
        blockedPaths: string[]
    }
    sitemap: {
        exists: boolean
        accessible: boolean
        url: string | null
        pageCount: number
        issues: string[]
    }
    indexStatus: {
        hasNoindex: boolean
        hasNofollow: boolean
        canonicalUrl: string | null
        metaRobots: string | null
    }
    orphanPages: string[]
}

export interface SpeedResult {
    estimatedLoadTime: number // seconds
    resourceCount: {
        scripts: number
        stylesheets: number
        images: number
        fonts: number
    }
    coreWebVitals: {
        lcp: { value: number; rating: string }
        fid: { value: number; rating: string }
        cls: { value: number; rating: string }
    }
    serverResponseTime: number
    issues: string[]
}

export interface MobileResult {
    hasViewportMeta: boolean
    isResponsive: boolean
    touchTargetsAdequate: boolean
    fontSizeLegible: boolean
    contentWidth: string
    issues: string[]
}

export interface SecurityResult {
    isHttps: boolean
    hasMixedContent: boolean
    mixedContentItems: string[]
    hasSecurityHeaders: {
        xFrameOptions: boolean
        xContentTypeOptions: boolean
        strictTransportSecurity: boolean
    }
    sslInfo: {
        valid: boolean
        issuer: string | null
    }
}

export interface StructureResult {
    urlAnalysis: {
        isClean: boolean
        hasQueryParams: boolean
        depth: number
        issues: string[]
    }
    internalLinks: {
        count: number
        unique: number
        broken: string[]
        hasGoodAnchorText: boolean
    }
    externalLinks: {
        count: number
        nofollow: number
    }
    redirects: {
        hasRedirectChains: boolean
        chains: string[]
    }
}

export interface ContentResult {
    duplicateContent: {
        hasDuplicates: boolean
        duplicateElements: string[]
    }
    canonicalTag: {
        exists: boolean
        url: string | null
        isSelfReferencing: boolean
    }
    structuredData: {
        exists: boolean
        types: string[]
        isValid: boolean
        errors: string[]
    }
    headings: {
        h1Count: number
        h2Count: number
        h3Count: number
        hierarchy: string[]
        issues: string[]
    }
    titleTag: {
        exists: boolean
        content: string | null
        length: number
        isOptimal: boolean
        issues: string[]
    }
    metaDescription: {
        exists: boolean
        content: string | null
        length: number
        isOptimal: boolean
        issues: string[]
    }
    readability: {
        score: number
        grade: string
        issues: string[]
    }
    externalLinks: {
        count: number
        hasRelevantLinks: boolean
        issues: string[]
    }
}

export interface UXResult {
    navigation: {
        hasMainNav: boolean
        navItemCount: number
        hasFooterNav: boolean
        hasBreadcrumbs: boolean
    }
    architecture: {
        depth: number
        clickDepth: number
        hasSearchBox: boolean
    }
    accessibility: {
        hasSkipLink: boolean
        imagesWithAlt: number
        imagesWithoutAlt: number
        hasAriaLabels: boolean
    }
    coreWebVitalsImpact: {
        layoutStability: string
        interactivity: string
        visualLoading: string
    }
}

/**
 * Technical SEO Audit Service
 * Comprehensive site auditing across 7 key areas with region detection
 */
class TechnicalAuditService {
    private userAgent = "Mozilla/5.0 (compatible; SEOAuditBot/1.0)"

    // Proxy endpoints for different regions (simulated with headers)
    private regionHeaders: Record<string, Record<string, string>> = {
        "US": { "CloudFlare-IPCountry": "US", "X-Audit-Region": "US-East" },
        "CA": { "CloudFlare-IPCountry": "CA", "X-Audit-Region": "CA-MB" },
        "UK": { "CloudFlare-IPCountry": "GB", "X-Audit-Region": "UK-London" },
        "AU": { "CloudFlare-IPCountry": "AU", "X-Audit-Region": "AU-Sydney" },
        "DE": { "CloudFlare-IPCountry": "DE", "X-Audit-Region": "DE-Frankfurt" },
        "SG": { "CloudFlare-IPCountry": "SG", "X-Audit-Region": "SG-Singapore" },
        "JP": { "CloudFlare-IPCountry": "JP", "X-Audit-Region": "JP-Tokyo" },
        "IN": { "CloudFlare-IPCountry": "IN", "X-Audit-Region": "IN-Mumbai" },
    }

    /**
     * Run a full technical audit on a URL from a specific region
     * @param url - The URL to audit
     * @param targetRegion - The region to perform the audit from (optional, will be detected if not provided)
     */
    async runFullAudit(url: string, targetRegion?: string): Promise<TechnicalAuditResult> {
        // Normalize URL
        const normalizedUrl = this.normalizeUrl(url)
        const baseUrl = new URL(normalizedUrl).origin

        // Detect server location
        const serverLocation = await this.detectServerLocation(normalizedUrl)

        // Use detected region or provided target region
        const auditRegion = targetRegion || serverLocation.region || "US"

        // Fetch the main page from the target region
        const pageHtml = await this.fetchPage(normalizedUrl, auditRegion)
        const $ = cheerio.load(pageHtml)

        // Run all category audits in parallel
        const [
            crawlability,
            speed,
            mobile,
            security,
            structure,
            content,
            ux
        ] = await Promise.all([
            this.checkCrawlability(baseUrl, normalizedUrl, $),
            this.checkSpeed($, normalizedUrl),
            this.checkMobile($),
            this.checkSecurity(normalizedUrl, $),
            this.checkStructure($, normalizedUrl),
            this.checkContent($, normalizedUrl),
            this.checkUX($)
        ])

        // Calculate category scores
        const crawlabilityScore = this.calculateCrawlabilityScore(crawlability)
        const speedScore = this.calculateSpeedScore(speed)
        const mobileScore = this.calculateMobileScore(mobile)
        const securityScore = this.calculateSecurityScore(security)
        const structureScore = this.calculateStructureScore(structure)
        const contentScore = this.calculateContentScore(content)
        const uxScore = this.calculateUXScore(ux)

        // Calculate overall score (weighted average)
        const overallScore = Math.round(
            crawlabilityScore * 0.15 +
            speedScore * 0.20 +
            mobileScore * 0.15 +
            securityScore * 0.15 +
            structureScore * 0.15 +
            contentScore * 0.10 +
            uxScore * 0.10
        )

        // Collect all issues
        const issues = this.collectIssues(
            crawlability, speed, mobile, security, structure, content, ux
        )

        // Generate recommendations
        const recommendations = this.generateRecommendations(
            issues,
            { crawlabilityScore, speedScore, mobileScore, securityScore, structureScore, contentScore, uxScore }
        )

        return {
            url: normalizedUrl,
            auditRegion,
            serverLocation,
            overallScore,
            crawlabilityScore,
            speedScore,
            mobileScore,
            securityScore,
            structureScore,
            contentScore,
            uxScore,
            crawlability,
            speed,
            mobile,
            security,
            structure,
            content,
            ux,
            issues,
            recommendations
        }
    }

    /**
     * Check crawlability & indexation
     */
    async checkCrawlability(
        baseUrl: string,
        pageUrl: string,
        $: cheerio.CheerioAPI
    ): Promise<CrawlabilityResult> {
        // Check robots.txt
        const robotsTxt = await this.checkRobotsTxt(baseUrl)

        // Check sitemap
        const sitemap = await this.checkSitemap(baseUrl)

        // Check index status from meta tags
        const metaRobots = $('meta[name="robots"]').attr("content") || null
        const canonicalUrl = $('link[rel="canonical"]').attr("href") || null
        const hasNoindex = metaRobots?.toLowerCase().includes("noindex") || false
        const hasNofollow = metaRobots?.toLowerCase().includes("nofollow") || false

        return {
            robotsTxt,
            sitemap,
            indexStatus: {
                hasNoindex,
                hasNofollow,
                canonicalUrl,
                metaRobots
            },
            orphanPages: [] // Would need full site crawl to detect
        }
    }

    /**
     * Check robots.txt
     */
    private async checkRobotsTxt(baseUrl: string): Promise<CrawlabilityResult["robotsTxt"]> {
        const robotsUrl = `${baseUrl}/robots.txt`
        try {
            const response = await fetch(robotsUrl, {
                headers: { "User-Agent": this.userAgent }
            })

            if (!response.ok) {
                return {
                    exists: false,
                    accessible: false,
                    issues: ["robots.txt not found or not accessible"],
                    blockedPaths: []
                }
            }

            const content = await response.text()
            const lines = content.split("\n")
            const blockedPaths: string[] = []
            const issues: string[] = []

            for (const line of lines) {
                const trimmed = line.trim().toLowerCase()
                if (trimmed.startsWith("disallow:")) {
                    const path = line.split(":")[1]?.trim()
                    if (path) blockedPaths.push(path)
                }
            }

            // Check for issues
            if (blockedPaths.includes("/")) {
                issues.push("Entire site is blocked by robots.txt")
            }
            if (content.length < 10) {
                issues.push("robots.txt appears to be empty or minimal")
            }

            return {
                exists: true,
                accessible: true,
                issues,
                blockedPaths
            }
        } catch {
            return {
                exists: false,
                accessible: false,
                issues: ["Failed to fetch robots.txt"],
                blockedPaths: []
            }
        }
    }

    /**
     * Check XML sitemap
     */
    private async checkSitemap(baseUrl: string): Promise<CrawlabilityResult["sitemap"]> {
        const sitemapUrls = [
            `${baseUrl}/sitemap.xml`,
            `${baseUrl}/sitemap_index.xml`,
            `${baseUrl}/sitemap/sitemap.xml`
        ]

        for (const sitemapUrl of sitemapUrls) {
            try {
                const response = await fetch(sitemapUrl, {
                    headers: { "User-Agent": this.userAgent }
                })

                if (response.ok) {
                    const content = await response.text()
                    const $ = cheerio.load(content, { xml: true })
                    const urlCount = $("url").length || $("sitemap").length

                    const issues: string[] = []
                    if (urlCount === 0) {
                        issues.push("Sitemap exists but contains no URLs")
                    }

                    return {
                        exists: true,
                        accessible: true,
                        url: sitemapUrl,
                        pageCount: urlCount,
                        issues
                    }
                }
            } catch {
                // Continue to next URL
            }
        }

        return {
            exists: false,
            accessible: false,
            url: null,
            pageCount: 0,
            issues: ["No XML sitemap found at common locations"]
        }
    }

    /**
     * Check site speed & Core Web Vitals (estimated)
     */
    async checkSpeed($: cheerio.CheerioAPI, url: string): Promise<SpeedResult> {
        const scripts = $("script[src]").length
        const stylesheets = $('link[rel="stylesheet"]').length
        const images = $("img").length
        const fonts = $('link[rel="preload"][as="font"]').length + $('link[rel="stylesheet"]').filter((_, el) => {
            const href = $(el).attr("href") || ""
            return !!(href.includes("fonts.googleapis.com") || href.includes("font"))
        }).length

        // Estimate load time based on resource count
        const estimatedLoadTime = Math.min(
            1 + (scripts * 0.2) + (stylesheets * 0.15) + (images * 0.1),
            10
        )

        // Estimate Core Web Vitals
        const lcpValue = estimatedLoadTime * 800 // rough estimate in ms
        const fidValue = scripts > 10 ? 150 : scripts > 5 ? 80 : 50
        const clsValue = images > 20 ? 0.2 : images > 10 ? 0.1 : 0.05

        const issues: string[] = []
        if (scripts > 15) issues.push(`High number of scripts (${scripts}) may slow page load`)
        if (stylesheets > 5) issues.push(`Multiple stylesheets (${stylesheets}) could be consolidated`)
        if (images > 30) issues.push(`Many images (${images}) - consider lazy loading`)

        // Check for render-blocking resources
        const inlineStyles = $("style").length
        if (inlineStyles > 5) {
            issues.push("Multiple inline style blocks detected")
        }

        return {
            estimatedLoadTime: Math.round(estimatedLoadTime * 10) / 10,
            resourceCount: {
                scripts,
                stylesheets,
                images,
                fonts
            },
            coreWebVitals: {
                lcp: {
                    value: Math.round(lcpValue),
                    rating: lcpValue <= 2500 ? "good" : lcpValue <= 4000 ? "needs-improvement" : "poor"
                },
                fid: {
                    value: fidValue,
                    rating: fidValue <= 100 ? "good" : fidValue <= 300 ? "needs-improvement" : "poor"
                },
                cls: {
                    value: Math.round(clsValue * 100) / 100,
                    rating: clsValue <= 0.1 ? "good" : clsValue <= 0.25 ? "needs-improvement" : "poor"
                }
            },
            serverResponseTime: 0, // Would need actual timing
            issues
        }
    }

    /**
     * Check mobile-friendliness
     */
    async checkMobile($: cheerio.CheerioAPI): Promise<MobileResult> {
        const viewportMeta = $('meta[name="viewport"]').attr("content")
        const hasViewportMeta = !!viewportMeta

        // Check for responsive indicators
        const mediaQueries = $("style").text().includes("@media")
        const responsiveClasses = $("[class*='mobile'], [class*='responsive'], [class*='col-'], [class*='md:'], [class*='lg:']").length > 0
        const isResponsive = hasViewportMeta && (mediaQueries || responsiveClasses)

        // Check font sizes
        const smallFonts = $("[style*='font-size']").filter((_, el) => {
            const style = $(el).attr("style") || ""
            const match = style.match(/font-size:\s*(\d+)/)
            return !!(match && parseInt(match[1]) < 12)
        }).length

        const issues: string[] = []
        if (!hasViewportMeta) {
            issues.push("Missing viewport meta tag - page may not render correctly on mobile")
        }
        if (!isResponsive) {
            issues.push("No responsive design indicators found")
        }
        if (smallFonts > 0) {
            issues.push(`${smallFonts} elements with font size below 12px may be hard to read on mobile`)
        }

        // Check for horizontal scroll issues
        const fixedWidths = $("[style*='width']").filter((_, el) => {
            const style = $(el).attr("style") || ""
            const match = style.match(/width:\s*(\d+)px/)
            return !!(match && parseInt(match[1]) > 400)
        }).length

        if (fixedWidths > 0) {
            issues.push("Fixed-width elements may cause horizontal scrolling on mobile")
        }

        return {
            hasViewportMeta,
            isResponsive,
            touchTargetsAdequate: true, // Would need more analysis
            fontSizeLegible: smallFonts === 0,
            contentWidth: hasViewportMeta ? "responsive" : "fixed",
            issues
        }
    }

    /**
     * Check security
     */
    async checkSecurity(url: string, $: cheerio.CheerioAPI): Promise<SecurityResult> {
        const isHttps = url.startsWith("https://")

        // Check for mixed content
        const mixedContentItems: string[] = []
        $("script[src^='http:'], link[href^='http:'], img[src^='http:'], iframe[src^='http:']").each((_, el) => {
            const src = $(el).attr("src") || $(el).attr("href")
            if (src) mixedContentItems.push(src)
        })

        const hasMixedContent = mixedContentItems.length > 0

        return {
            isHttps,
            hasMixedContent,
            mixedContentItems: mixedContentItems.slice(0, 10), // Limit to first 10
            hasSecurityHeaders: {
                xFrameOptions: false, // Would need HTTP headers
                xContentTypeOptions: false,
                strictTransportSecurity: false
            },
            sslInfo: {
                valid: isHttps, // Simplified check
                issuer: null
            }
        }
    }

    /**
     * Check site structure
     */
    async checkStructure($: cheerio.CheerioAPI, url: string): Promise<StructureResult> {
        const parsedUrl = new URL(url)

        // URL analysis
        const hasQueryParams = parsedUrl.search.length > 0
        const pathParts = parsedUrl.pathname.split("/").filter(p => p)
        const depth = pathParts.length

        const urlIssues: string[] = []
        if (depth > 4) urlIssues.push("URL depth is too deep (more than 4 levels)")
        if (hasQueryParams) urlIssues.push("URL contains query parameters which may cause duplicate content")
        if (url.includes("_") || url.includes("%20")) {
            urlIssues.push("URL contains underscores or spaces - consider using hyphens")
        }

        // Internal links
        const internalLinks: string[] = []
        const externalLinks: string[] = []
        const nofollowLinks: string[] = []

        $("a[href]").each((_, el) => {
            const href = $(el).attr("href") || ""
            const rel = $(el).attr("rel") || ""

            if (href.startsWith("/") || href.includes(parsedUrl.hostname)) {
                internalLinks.push(href)
            } else if (href.startsWith("http")) {
                externalLinks.push(href)
                if (rel.includes("nofollow")) {
                    nofollowLinks.push(href)
                }
            }
        })

        const uniqueInternalLinks = [...new Set(internalLinks)]

        // Check anchor text quality
        let goodAnchorText = 0
        $("a[href]").each((_, el) => {
            const text = $(el).text().trim()
            if (text.length > 3 && !["click here", "read more", "learn more", "here"].includes(text.toLowerCase())) {
                goodAnchorText++
            }
        })

        return {
            urlAnalysis: {
                isClean: urlIssues.length === 0,
                hasQueryParams,
                depth,
                issues: urlIssues
            },
            internalLinks: {
                count: internalLinks.length,
                unique: uniqueInternalLinks.length,
                broken: [], // Would need to verify each link
                hasGoodAnchorText: goodAnchorText > internalLinks.length * 0.7
            },
            externalLinks: {
                count: externalLinks.length,
                nofollow: nofollowLinks.length
            },
            redirects: {
                hasRedirectChains: false, // Would need to follow redirects
                chains: []
            }
        }
    }

    /**
     * Check content & on-page technicals
     */
    async checkContent($: cheerio.CheerioAPI, url: string): Promise<ContentResult> {
        // Extract domain from URL
        const urlObj = new URL(url)
        
        // Check for duplicate title/description
        const titles = $("title").map((_, el) => $(el).text()).get()
        const descriptions = $('meta[name="description"]').map((_, el) => $(el).attr("content")).get()

        const duplicateElements: string[] = []
        if (titles.length > 1) duplicateElements.push("Multiple title tags found")
        if (descriptions.length > 1) duplicateElements.push("Multiple meta descriptions found")

        // Canonical tag
        const canonicalHref = $('link[rel="canonical"]').attr("href")

        // Structured data
        const jsonLdScripts = $('script[type="application/ld+json"]')
        const structuredDataTypes: string[] = []
        const structuredDataErrors: string[] = []

        jsonLdScripts.each((_, el) => {
            try {
                const content = $(el).html()
                if (content) {
                    const data = JSON.parse(content)
                    if (data["@type"]) {
                        structuredDataTypes.push(data["@type"])
                    }
                }
            } catch {
                structuredDataErrors.push("Invalid JSON-LD syntax")
            }
        })

        // Heading structure
        const h1Count = $("h1").length
        const h2Count = $("h2").length
        const h3Count = $("h3").length

        const headings: string[] = []
        $("h1, h2, h3, h4, h5, h6").each((_, el) => {
            const tag = el.tagName.toLowerCase()
            const text = $(el).text().trim().substring(0, 50)
            headings.push(`${tag}: ${text}`)
        })

        const headingIssues: string[] = []
        if (h1Count === 0) headingIssues.push("No H1 tag found")
        if (h1Count > 1) headingIssues.push(`Multiple H1 tags found (${h1Count})`)
        if (h2Count === 0 && h1Count > 0) headingIssues.push("No H2 tags found")

        // Title tag validation
        const titleContent = titles[0] || null
        const titleLength = titleContent ? titleContent.length : 0
        const titleIssues: string[] = []
        const titleIsOptimal = titleLength > 0 && titleLength <= 60

        if (!titleContent) {
            titleIssues.push("No title tag found")
        } else if (titleLength > 60) {
            titleIssues.push(`Title too long (${titleLength} characters, should be under 60)`)
        } else if (titleLength < 10) {
            titleIssues.push(`Title too short (${titleLength} characters, should be at least 10)`)
        }

        // Meta description validation
        const metaDescriptionContent = descriptions[0] || null
        const metaDescriptionLength = metaDescriptionContent ? metaDescriptionContent.length : 0
        const metaDescriptionIssues: string[] = []
        const metaDescriptionIsOptimal = metaDescriptionLength > 0 && metaDescriptionLength <= 160

        if (!metaDescriptionContent) {
            metaDescriptionIssues.push("No meta description found")
        } else if (metaDescriptionLength > 160) {
            metaDescriptionIssues.push(`Meta description too long (${metaDescriptionLength} characters, should be under 160)`)
        } else if (metaDescriptionLength < 50) {
            metaDescriptionIssues.push(`Meta description too short (${metaDescriptionLength} characters, should be at least 50)`)
        }

        // Readability scoring
        const bodyText = $("body").text()
        const wordCount = bodyText.split(/\s+/).length
        const readabilityScore = this.calculateReadabilityScore(bodyText)
        const readabilityGrade = this.getReadabilityGrade(readabilityScore)
        const readabilityIssues: string[] = []

        if (readabilityScore < 60) {
            readabilityIssues.push("Content may be too complex for average readers")
        }
        if (wordCount < 300) {
            readabilityIssues.push("Content may be too short for good SEO")
        }

        // External links validation
        const externalLinks = $("a[href^='http']").filter((_, el) => {
            const href = $(el).attr("href") || ""
            try {
                const hrefUrl = new URL(href)
                return hrefUrl.hostname !== urlObj.hostname
            } catch {
                // If URL parsing fails, assume it's external
                return true
            }
        })
        const externalLinkCount = externalLinks.length
        const hasRelevantLinks = externalLinkCount > 0
        const externalLinkIssues: string[] = []

        if (externalLinkCount === 0) {
            externalLinkIssues.push("No external links found - consider adding authoritative sources")
        }

        return {
            duplicateContent: {
                hasDuplicates: duplicateElements.length > 0,
                duplicateElements
            },
            canonicalTag: {
                exists: !!canonicalHref,
                url: canonicalHref || null,
                isSelfReferencing: false // Would need current URL comparison
            },
            structuredData: {
                exists: jsonLdScripts.length > 0,
                types: structuredDataTypes,
                isValid: structuredDataErrors.length === 0,
                errors: structuredDataErrors
            },
            headings: {
                h1Count,
                h2Count,
                h3Count,
                hierarchy: headings.slice(0, 10),
                issues: headingIssues
            },
            titleTag: {
                exists: !!titleContent,
                content: titleContent,
                length: titleLength,
                isOptimal: titleIsOptimal,
                issues: titleIssues
            },
            metaDescription: {
                exists: !!metaDescriptionContent,
                content: metaDescriptionContent,
                length: metaDescriptionLength,
                isOptimal: metaDescriptionIsOptimal,
                issues: metaDescriptionIssues
            },
            readability: {
                score: readabilityScore,
                grade: readabilityGrade,
                issues: readabilityIssues
            },
            externalLinks: {
                count: externalLinkCount,
                hasRelevantLinks,
                issues: externalLinkIssues
            }
        }
    }

    /**
     * Calculate readability score using Flesch Reading Ease formula
     */
    private calculateReadabilityScore(text: string): number {
        if (!text || text.length === 0) return 0

        // Count sentences (simple heuristic)
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
        if (sentences === 0) return 100

        // Count words
        const words = text.split(/\s+/).filter(w => w.length > 0).length
        if (words === 0) return 0

        // Count syllables (simple heuristic)
        const syllables = this.countSyllables(text)

        // Flesch Reading Ease formula
        const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words))

        return Math.max(0, Math.min(100, Math.round(score)))
    }

    /**
     * Count syllables in text (simple heuristic)
     */
    private countSyllables(text: string): number {
        const words = text.toLowerCase().split(/\s+/)
        let totalSyllables = 0

        for (const word of words) {
            if (word.length === 0) continue

            // Remove non-alphabetic characters
            const cleanWord = word.replace(/[^a-z]/g, '')
            if (cleanWord.length === 0) continue

            // Count vowel groups
            const vowelGroups = cleanWord.match(/[aeiouy]+/g)
            let syllableCount = vowelGroups ? vowelGroups.length : 0

            // Subtract silent 'e' at the end
            if (cleanWord.endsWith('e') && syllableCount > 1) {
                syllableCount--
            }

            // Every word has at least one syllable
            syllableCount = Math.max(1, syllableCount)
            totalSyllables += syllableCount
        }

        return totalSyllables
    }

    /**
     * Get readability grade based on score
     */
    private getReadabilityGrade(score: number): string {
        if (score >= 90) return "Very Easy"
        if (score >= 80) return "Easy"
        if (score >= 70) return "Fairly Easy"
        if (score >= 60) return "Standard"
        if (score >= 50) return "Fairly Difficult"
        if (score >= 30) return "Difficult"
        return "Very Difficult"
    }

    /**
     * Check UX signals
     */
    async checkUX($: cheerio.CheerioAPI): Promise<UXResult> {
        // Navigation analysis
        const hasMainNav = $("nav, [role='navigation'], header nav, .nav, .navigation, .menu").length > 0
        const navItems = $("nav a, header a, .nav a, .menu a").length
        const hasFooterNav = $("footer nav, footer a").length > 0
        const hasBreadcrumbs = $("[class*='breadcrumb'], [aria-label*='breadcrumb'], .breadcrumbs, nav.breadcrumb").length > 0

        // Search functionality
        const hasSearchBox = $("input[type='search'], input[name='q'], input[name='search'], .search-input, #search").length > 0

        // Skip link for accessibility
        const hasSkipLink = $("a[href='#main'], a[href='#content'], .skip-link, .skip-to-content").length > 0

        // Image alt text
        const imagesWithAlt = $("img[alt]").filter((_, el) => !!($(el).attr("alt")?.trim().length)).length
        const imagesWithoutAlt = $("img").length - imagesWithAlt

        // ARIA labels
        const hasAriaLabels = $("[aria-label], [aria-labelledby], [aria-describedby]").length > 0

        return {
            navigation: {
                hasMainNav,
                navItemCount: navItems,
                hasFooterNav,
                hasBreadcrumbs
            },
            architecture: {
                depth: 1, // Current page depth
                clickDepth: hasMainNav ? 2 : 3, // Estimated
                hasSearchBox
            },
            accessibility: {
                hasSkipLink,
                imagesWithAlt,
                imagesWithoutAlt,
                hasAriaLabels
            },
            coreWebVitalsImpact: {
                layoutStability: "good",
                interactivity: "good",
                visualLoading: "good"
            }
        }
    }

    // Score calculation methods
    private calculateCrawlabilityScore(result: CrawlabilityResult): number {
        let score = 100

        if (!result.robotsTxt.exists) score -= 10
        if (result.robotsTxt.issues.length > 0) score -= result.robotsTxt.issues.length * 10
        if (!result.sitemap.exists) score -= 15
        if (result.sitemap.issues.length > 0) score -= result.sitemap.issues.length * 5
        if (result.indexStatus.hasNoindex) score -= 30
        if (result.indexStatus.hasNofollow) score -= 10

        return Math.max(0, Math.min(100, score))
    }

    private calculateSpeedScore(result: SpeedResult): number {
        let score = 100

        // Penalize based on estimated load time
        if (result.estimatedLoadTime > 3) score -= 20
        if (result.estimatedLoadTime > 5) score -= 20

        // Penalize based on Core Web Vitals
        if (result.coreWebVitals.lcp.rating === "needs-improvement") score -= 10
        if (result.coreWebVitals.lcp.rating === "poor") score -= 20
        if (result.coreWebVitals.fid.rating === "needs-improvement") score -= 10
        if (result.coreWebVitals.fid.rating === "poor") score -= 20
        if (result.coreWebVitals.cls.rating === "needs-improvement") score -= 10
        if (result.coreWebVitals.cls.rating === "poor") score -= 20

        score -= result.issues.length * 5

        return Math.max(0, Math.min(100, score))
    }

    private calculateMobileScore(result: MobileResult): number {
        let score = 100

        if (!result.hasViewportMeta) score -= 30
        if (!result.isResponsive) score -= 25
        if (!result.fontSizeLegible) score -= 15
        score -= result.issues.length * 10

        return Math.max(0, Math.min(100, score))
    }

    private calculateSecurityScore(result: SecurityResult): number {
        let score = 100

        if (!result.isHttps) score -= 50
        if (result.hasMixedContent) score -= 20
        if (!result.sslInfo.valid) score -= 30

        return Math.max(0, Math.min(100, score))
    }

    private calculateStructureScore(result: StructureResult): number {
        let score = 100

        score -= result.urlAnalysis.issues.length * 10
        if (result.internalLinks.broken.length > 0) score -= result.internalLinks.broken.length * 5
        if (!result.internalLinks.hasGoodAnchorText) score -= 10
        if (result.redirects.hasRedirectChains) score -= 15

        return Math.max(0, Math.min(100, score))
    }

    private calculateContentScore(result: ContentResult): number {
        let score = 100

        // Original checks
        if (result.duplicateContent.hasDuplicates) score -= 15
        if (!result.canonicalTag.exists) score -= 10
        if (!result.structuredData.exists) score -= 15
        if (!result.structuredData.isValid) score -= 10
        score -= result.headings.issues.length * 10

        // New SEO checks from PDF
        // Title tag validation
        if (!result.titleTag.exists) score -= 20
        else if (!result.titleTag.isOptimal) score -= 10
        score -= result.titleTag.issues.length * 5

        // Meta description validation
        if (!result.metaDescription.exists) score -= 15
        else if (!result.metaDescription.isOptimal) score -= 8
        score -= result.metaDescription.issues.length * 4

        // Readability scoring
        if (result.readability.score < 60) score -= 10
        score -= result.readability.issues.length * 3

        // External links validation
        if (!result.externalLinks.hasRelevantLinks) score -= 5
        score -= result.externalLinks.issues.length * 2

        return Math.max(0, Math.min(100, score))
    }

    private calculateUXScore(result: UXResult): number {
        let score = 100

        if (!result.navigation.hasMainNav) score -= 20
        if (!result.navigation.hasBreadcrumbs) score -= 5
        if (!result.architecture.hasSearchBox) score -= 5
        if (!result.accessibility.hasSkipLink) score -= 5
        if (result.accessibility.imagesWithoutAlt > 5) score -= 15

        return Math.max(0, Math.min(100, score))
    }

    // Collect issues from all categories
    private collectIssues(
        crawlability: CrawlabilityResult,
        speed: SpeedResult,
        mobile: MobileResult,
        security: SecurityResult,
        structure: StructureResult,
        content: ContentResult,
        ux: UXResult
    ): AuditIssue[] {
        const issues: AuditIssue[] = []

        // Crawlability issues
        if (!crawlability.robotsTxt.exists) {
            issues.push({
                category: "Crawlability",
                severity: "warning",
                title: "Missing robots.txt",
                description: "No robots.txt file found. This file helps search engines understand how to crawl your site.",
                fix: "Create a robots.txt file in your root directory"
            })
        }
        crawlability.robotsTxt.issues.forEach(issue => {
            issues.push({
                category: "Crawlability",
                severity: issue.includes("blocked") ? "critical" : "warning",
                title: "Robots.txt Issue",
                description: issue
            })
        })

        if (!crawlability.sitemap.exists) {
            issues.push({
                category: "Crawlability",
                severity: "warning",
                title: "Missing XML Sitemap",
                description: "No XML sitemap found. Sitemaps help search engines discover and index your pages.",
                fix: "Create and submit an XML sitemap to search engines"
            })
        }

        if (crawlability.indexStatus.hasNoindex) {
            issues.push({
                category: "Crawlability",
                severity: "critical",
                title: "Page Set to Noindex",
                description: "This page has a noindex directive and will not appear in search results.",
                fix: "Remove the noindex meta tag if this page should be indexed"
            })
        }

        // Speed issues
        if (speed.estimatedLoadTime > 3) {
            issues.push({
                category: "Speed",
                severity: speed.estimatedLoadTime > 5 ? "critical" : "warning",
                title: "Slow Page Load",
                description: `Estimated load time is ${speed.estimatedLoadTime}s. Pages should load in under 3 seconds.`,
                fix: "Optimize images, minify CSS/JS, and consider a CDN"
            })
        }
        speed.issues.forEach(issue => {
            issues.push({
                category: "Speed",
                severity: "warning",
                title: "Performance Issue",
                description: issue
            })
        })

        // Mobile issues
        if (!mobile.hasViewportMeta) {
            issues.push({
                category: "Mobile",
                severity: "critical",
                title: "Missing Viewport Meta Tag",
                description: "No viewport meta tag found. This is essential for mobile-friendly pages.",
                fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to <head>'
            })
        }
        mobile.issues.forEach(issue => {
            issues.push({
                category: "Mobile",
                severity: "warning",
                title: "Mobile Usability Issue",
                description: issue
            })
        })

        // Security issues
        if (!security.isHttps) {
            issues.push({
                category: "Security",
                severity: "critical",
                title: "Not Using HTTPS",
                description: "Site is not served over HTTPS. This affects security and SEO rankings.",
                fix: "Install an SSL certificate and redirect HTTP to HTTPS"
            })
        }
        if (security.hasMixedContent) {
            issues.push({
                category: "Security",
                severity: "warning",
                title: "Mixed Content Detected",
                description: `${security.mixedContentItems.length} resources loaded over HTTP on an HTTPS page.`,
                fix: "Update all resource URLs to use HTTPS"
            })
        }

        // Structure issues
        structure.urlAnalysis.issues.forEach(issue => {
            issues.push({
                category: "Structure",
                severity: "info",
                title: "URL Structure Issue",
                description: issue
            })
        })
        if (structure.internalLinks.broken.length > 0) {
            issues.push({
                category: "Structure",
                severity: "warning",
                title: "Broken Internal Links",
                description: `${structure.internalLinks.broken.length} broken internal links found.`,
                fix: "Fix or remove broken links"
            })
        }

        // Content issues
        content.duplicateContent.duplicateElements.forEach(element => {
            issues.push({
                category: "Content",
                severity: "warning",
                title: "Duplicate Content Element",
                description: element
            })
        })
        if (!content.canonicalTag.exists) {
            issues.push({
                category: "Content",
                severity: "warning",
                title: "Missing Canonical Tag",
                description: "No canonical tag found. This helps prevent duplicate content issues.",
                fix: 'Add <link rel="canonical" href="..."> to specify the preferred URL'
            })
        }
        if (!content.structuredData.exists) {
            issues.push({
                category: "Content",
                severity: "info",
                title: "No Structured Data",
                description: "No JSON-LD structured data found. Schema markup can enhance search results.",
                fix: "Add appropriate Schema.org markup for your content type"
            })
        }
        content.headings.issues.forEach(issue => {
            issues.push({
                category: "Content",
                severity: issue.includes("No H1") ? "warning" : "info",
                title: "Heading Structure Issue",
                description: issue
            })
        })

        // New SEO checks from PDF
        // Title tag issues
        if (!content.titleTag.exists) {
            issues.push({
                category: "Content",
                severity: "critical",
                title: "Missing Title Tag",
                description: "No title tag found. This is essential for SEO and user experience.",
                fix: "Add a descriptive title tag to the <head> section"
            })
        } else if (!content.titleTag.isOptimal) {
            issues.push({
                category: "Content",
                severity: "warning",
                title: "Title Tag Length Issue",
                description: content.titleTag.issues.join(", "),
                fix: "Keep title under 60 characters for optimal display in search results"
            })
        }

        // Meta description issues
        if (!content.metaDescription.exists) {
            issues.push({
                category: "Content",
                severity: "warning",
                title: "Missing Meta Description",
                description: "No meta description found. This affects click-through rates from search results.",
                fix: "Add a compelling meta description under 160 characters"
            })
        } else if (!content.metaDescription.isOptimal) {
            issues.push({
                category: "Content",
                severity: "warning",
                title: "Meta Description Length Issue",
                description: content.metaDescription.issues.join(", "),
                fix: "Keep meta description under 160 characters for optimal display"
            })
        }

        // Readability issues
        if (content.readability.score < 60) {
            issues.push({
                category: "Content",
                severity: "info",
                title: "Content Readability Issue",
                description: content.readability.issues.join(", "),
                fix: "Use shorter sentences and simpler words to improve readability"
            })
        }

        // External links issues
        if (!content.externalLinks.hasRelevantLinks) {
            issues.push({
                category: "Content",
                severity: "info",
                title: "No External Links",
                description: "No external links found. Consider linking to authoritative sources.",
                fix: "Add relevant external links to authoritative sources"
            })
        }

        // UX issues
        if (!ux.navigation.hasMainNav) {
            issues.push({
                category: "UX",
                severity: "warning",
                title: "No Main Navigation",
                description: "No main navigation element detected. Clear navigation helps users and search engines.",
                fix: "Add a clear navigation menu with semantic <nav> element"
            })
        }
        if (ux.accessibility.imagesWithoutAlt > 0) {
            issues.push({
                category: "UX",
                severity: "warning",
                title: "Images Missing Alt Text",
                description: `${ux.accessibility.imagesWithoutAlt} images are missing alt text.`,
                fix: "Add descriptive alt attributes to all images"
            })
        }

        return issues
    }

    // Generate prioritized recommendations
    private generateRecommendations(
        issues: AuditIssue[],
        scores: Record<string, number>
    ): Recommendation[] {
        const recommendations: Recommendation[] = []

        // Critical issues first
        const criticalIssues = issues.filter(i => i.severity === "critical")
        criticalIssues.forEach(issue => {
            recommendations.push({
                priority: "high",
                category: issue.category,
                title: `Fix: ${issue.title}`,
                description: issue.fix || issue.description,
                impact: "Critical impact on SEO and user experience"
            })
        })

        // Add score-based recommendations
        const lowestScores = Object.entries(scores)
            .sort(([, a], [, b]) => a - b)
            .slice(0, 3)

        lowestScores.forEach(([category, score]) => {
            if (score < 70) {
                recommendations.push({
                    priority: score < 50 ? "high" : "medium",
                    category: category.replace("Score", ""),
                    title: `Improve ${category.replace("Score", "")} Score`,
                    description: `Current score is ${score}/100. Focus on addressing issues in this category.`,
                    impact: "Significant improvement potential"
                })
            }
        })

        // Add general SEO recommendations
        const warningIssues = issues.filter(i => i.severity === "warning")
        warningIssues.slice(0, 5).forEach(issue => {
            if (!recommendations.find(r => r.title.includes(issue.title))) {
                recommendations.push({
                    priority: "medium",
                    category: issue.category,
                    title: issue.title,
                    description: issue.fix || issue.description,
                    impact: "Moderate impact on SEO"
                })
            }
        })

        return recommendations.slice(0, 10) // Return top 10
    }

    // Helper methods
    private normalizeUrl(url: string): string {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url
        }
        return url.replace(/\/$/, "")
    }

    /**
     * Detect the server location by analyzing DNS and response headers
     */
    private async detectServerLocation(url: string): Promise<{
        country: string
        region: string
        city: string
        timezone: string
    }> {
        try {
            // Extract domain from URL
            const urlObj = new URL(url)
            const domain = urlObj.hostname

            // Detect region based on domain TLD and common hosting patterns
            const regionMap: Record<string, { country: string; region: string; city: string; timezone: string }> = {
                ".ca": { country: "Canada", region: "CA-MB", city: "Winnipeg", timezone: "America/Winnipeg" },
                ".uk": { country: "United Kingdom", region: "UK-London", city: "London", timezone: "Europe/London" },
                ".au": { country: "Australia", region: "AU-SYD", city: "Sydney", timezone: "Australia/Sydney" },
                ".de": { country: "Germany", region: "DE-HE", city: "Frankfurt", timezone: "Europe/Berlin" },
                ".jp": { country: "Japan", region: "JP-TO", city: "Tokyo", timezone: "Asia/Tokyo" },
                ".sg": { country: "Singapore", region: "SG-SG", city: "Singapore", timezone: "Asia/Singapore" },
                ".in": { country: "India", region: "IN-MH", city: "Mumbai", timezone: "Asia/Kolkata" },
            }

            // Check if domain has country-specific TLD
            for (const [tld, location] of Object.entries(regionMap)) {
                // Check if domain ends with the TLD (handles subdomains like www.example.ca)
                if (domain.endsWith(tld)) {
                    return location
                }
                // Also check if domain matches the TLD pattern (handles direct domains like example.ca)
                const domainPattern = new RegExp(tld.replace(/\./g, '\\.') + '$')
                if (domainPattern.test(domain)) {
                    return location
                }
            }

            // Try to get hosting information from the response headers
            const response = await fetch(url, {
                headers: {
                    "User-Agent": this.userAgent,
                },
                redirect: "follow"
            })

            // Check CloudFlare headers for country info
            const cfCountry = response.headers.get("cf-ipcountry")
            if (cfCountry) {
                const countryMap: Record<string, string> = {
                    "CA": "Canada",
                    "US": "United States",
                    "GB": "United Kingdom",
                    "AU": "Australia",
                    "DE": "Germany",
                    "JP": "Japan",
                    "SG": "Singapore",
                    "IN": "India",
                }
                const country = countryMap[cfCountry] || cfCountry
                return {
                    country,
                    region: cfCountry,
                    city: "Unknown",
                    timezone: this.getTimezoneForCountry(cfCountry)
                }
            }

            // Default to US if unable to detect
            return {
                country: "United States",
                region: "US",
                city: "Unknown",
                timezone: "America/New_York"
            }
        } catch (error) {
            // Log error for debugging but don't let it break the audit
            console.warn(`Failed to detect server location for ${url}:`, error)
            // Return default on error
            return {
                country: "United States",
                region: "US",
                city: "Unknown",
                timezone: "America/New_York"
            }
        }
    }

    /**
     * Get timezone for a country code
     */
    private getTimezoneForCountry(countryCode: string): string {
        const timezoneMap: Record<string, string> = {
            "US": "America/New_York",
            "CA": "America/Winnipeg",
            "GB": "Europe/London",
            "AU": "Australia/Sydney",
            "DE": "Europe/Berlin",
            "JP": "Asia/Tokyo",
            "SG": "Asia/Singapore",
            "IN": "Asia/Kolkata",
        }
        return timezoneMap[countryCode] || "UTC"
    }

    /**
     * Fetch page with region-specific headers to simulate regional request
     */
    private async fetchPage(url: string, region: string = "US"): Promise<string> {
        try {
            const headers: Record<string, string> = {
                "User-Agent": this.userAgent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": this.getLanguageForRegion(region),
            }

            // Add region-specific headers to simulate request from that region
            const regionSpecificHeaders = this.regionHeaders[region] || {}
            Object.assign(headers, regionSpecificHeaders)

            const response = await fetch(url, {
                headers,
                redirect: "follow"
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch page: ${response.status}`)
            }

            return await response.text()
        } catch (error) {
            throw new Error(`Failed to fetch ${url}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
    }

    /**
     * Get Accept-Language header for region
     */
    private getLanguageForRegion(region: string): string {
        const languageMap: Record<string, string> = {
            "US": "en-US,en;q=0.9",
            "CA": "en-CA,en;q=0.9,fr-CA;q=0.8",
            "UK": "en-GB,en;q=0.9",
            "AU": "en-AU,en;q=0.9",
            "DE": "de-DE,de;q=0.9,en;q=0.8",
            "JP": "ja-JP,ja;q=0.9,en;q=0.8",
            "SG": "en-SG,en;q=0.9",
            "IN": "en-IN,en;q=0.9",
        }
        return languageMap[region] || "en-US,en;q=0.9"
    }
}

// Export singleton
export const technicalAuditService = new TechnicalAuditService()
