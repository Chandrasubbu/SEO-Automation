"use client"

import { useState } from "react"
import {
    AlertTriangle,
    CheckCircle,
    Info,
    RefreshCw,
    Shield,
    Zap,
    Smartphone,
    Lock,
    Link2,
    FileText,
    Layout,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Copy,
    Check,
    TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Types
interface AuditIssue {
    category: string
    severity: "critical" | "warning" | "info"
    title: string
    description: string
    location?: string
    fix?: string
}

interface Recommendation {
    priority: "high" | "medium" | "low"
    category: string
    title: string
    description: string
    impact: string
}

interface TechnicalAuditResult {
    id?: string
    url: string
    auditRegion?: string
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
    crawlability: any
    speed: any
    mobile: any
    security: any
    structure: any
    content: any
    ux: any
    issues: AuditIssue[]
    recommendations: Recommendation[]
}

// Score gauge component
function ScoreGauge({ score, size = "large" }: { score: number; size?: "large" | "small" }) {
    const getScoreColor = (s: number) => {
        if (s >= 80) return "text-green-500"
        if (s >= 60) return "text-yellow-500"
        if (s >= 40) return "text-orange-500"
        return "text-red-500"
    }

    const getScoreBg = (s: number) => {
        if (s >= 80) return "bg-green-100 dark:bg-green-900/30"
        if (s >= 60) return "bg-yellow-100 dark:bg-yellow-900/30"
        if (s >= 40) return "bg-orange-100 dark:bg-orange-900/30"
        return "bg-red-100 dark:bg-red-900/30"
    }

    const sizeClasses = size === "large"
        ? "w-32 h-32 text-4xl"
        : "w-16 h-16 text-xl"

    return (
        <div className={`${sizeClasses} ${getScoreBg(score)} rounded-full flex items-center justify-center`}>
            <span className={`font-bold ${getScoreColor(score)}`}>{score}</span>
        </div>
    )
}

// Category card component
function CategoryCard({
    title,
    score,
    icon: Icon,
    details,
    issues
}: {
    title: string
    score: number
    icon: React.ComponentType<{ className?: string }>
    details: any
    issues: AuditIssue[]
}) {
    const [expanded, setExpanded] = useState(false)
    const categoryIssues = issues.filter(i => i.category.toLowerCase() === title.toLowerCase())

    const getScoreColor = (s: number) => {
        if (s >= 80) return "text-green-600 dark:text-green-400"
        if (s >= 60) return "text-yellow-600 dark:text-yellow-400"
        if (s >= 40) return "text-orange-600 dark:text-orange-400"
        return "text-red-600 dark:text-red-400"
    }

    const getScoreBorder = (s: number) => {
        if (s >= 80) return "border-green-200 dark:border-green-800"
        if (s >= 60) return "border-yellow-200 dark:border-yellow-800"
        if (s >= 40) return "border-orange-200 dark:border-orange-800"
        return "border-red-200 dark:border-red-800"
    }

    return (
        <div className={`border-2 rounded-lg p-4 ${getScoreBorder(score)} bg-white dark:bg-slate-900`}>
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${getScoreColor(score)}`} />
                    <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
                    {expanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                </div>
            </div>

            {expanded && (
                <div className="mt-4 space-y-4">
                    {/* Category-specific details */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(details).slice(0, 6).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                                <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="text-slate-900 dark:text-white font-medium">
                                    {typeof value === 'boolean'
                                        ? (value ? '✓' : '✗')
                                        : typeof value === 'object'
                                            ? JSON.stringify(value).slice(0, 20) + '...'
                                            : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Issues for this category */}
                    {categoryIssues.length > 0 && (
                        <div className="border-t pt-3 mt-3">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Issues ({categoryIssues.length})
                            </h4>
                            <div className="space-y-2">
                                {categoryIssues.map((issue, idx) => (
                                    <div
                                        key={idx}
                                        className={`text-sm p-2 rounded ${issue.severity === 'critical'
                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                            : issue.severity === 'warning'
                                                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {issue.severity === 'critical' ? (
                                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            ) : issue.severity === 'warning' ? (
                                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div>
                                                <div className="font-medium">{issue.title}</div>
                                                <div className="text-xs opacity-80 mt-1">{issue.description}</div>
                                                {issue.fix && (
                                                    <div className="text-xs mt-1 italic">Fix: {issue.fix}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Main component
export function TechnicalAudit() {
    const [url, setUrl] = useState("")
    const [region, setRegion] = useState("") // Auto-detect by default
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<TechnicalAuditResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const regions = [
        { code: "", name: "Auto-Detect (from server location)" },
        { code: "US", name: "United States" },
        { code: "CA", name: "Canada" },
        { code: "UK", name: "United Kingdom" },
        { code: "AU", name: "Australia" },
        { code: "DE", name: "Germany" },
        { code: "JP", name: "Japan" },
        { code: "SG", name: "Singapore" },
        { code: "IN", name: "India" },
    ]

    const handleAudit = async () => {
        if (!url.trim()) {
            setError("Please enter a URL to audit")
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch("/api/technical-audit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: url.trim(),
                    region: region || undefined // Only include if specified
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to run audit")
            }

            const data = await response.json()
            setResult(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to run audit")
        } finally {
            setLoading(false)
        }
    }

    const handleCopyReport = async () => {
        if (!result) return

        const auditFrom = result.auditRegion ? `Audit Region: ${result.auditRegion}\n` : ""
        const serverLocation = result.serverLocation
            ? `Server Location: ${result.serverLocation.city}, ${result.serverLocation.country} (${result.serverLocation.timezone})\n`
            : ""

        // Extract content details for enhanced report
        const contentDetails = result.content || {}
        const titleTag = contentDetails.titleTag || {}
        const metaDescription = contentDetails.metaDescription || {}
        const readability = contentDetails.readability || {}
        const externalLinks = contentDetails.externalLinks || {}

        const contentSection = `
Content SEO Details:
- Title Tag: ${titleTag.exists ? `${titleTag.length} chars (${titleTag.isOptimal ? 'Optimal' : 'Needs work'})` : 'Missing'}
- Meta Description: ${metaDescription.exists ? `${metaDescription.length} chars (${metaDescription.isOptimal ? 'Optimal' : 'Needs work'})` : 'Missing'}
- Readability: ${readability.score}/100 (${readability.grade})
- External Links: ${externalLinks.count} (${externalLinks.hasRelevantLinks ? 'Good' : 'None found'})
`.trim()

        const report = `
Technical SEO Audit Report
========================
URL: ${result.url}
${auditFrom}${serverLocation}
Overall Score: ${result.overallScore}/100

Category Scores:
- Crawlability: ${result.crawlabilityScore}/100
- Speed: ${result.speedScore}/100
- Mobile: ${result.mobileScore}/100
- Security: ${result.securityScore}/100
- Structure: ${result.structureScore}/100
- Content: ${result.contentScore}/100
- UX: ${result.uxScore}/100

${contentSection}

Issues Found: ${result.issues.length}
${result.issues.map(i => `- [${i.severity.toUpperCase()}] ${i.title}: ${i.description}`).join('\n')}

Top Recommendations:
${result.recommendations.slice(0, 5).map(r => `- [${r.priority.toUpperCase()}] ${r.title}: ${r.description}`).join('\n')}
        `.trim()

        await navigator.clipboard.writeText(report)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const categoryConfig = [
        { key: "crawlability", title: "Crawlability", icon: Shield, scoreKey: "crawlabilityScore" },
        { key: "speed", title: "Speed", icon: Zap, scoreKey: "speedScore" },
        { key: "mobile", title: "Mobile", icon: Smartphone, scoreKey: "mobileScore" },
        { key: "security", title: "Security", icon: Lock, scoreKey: "securityScore" },
        { key: "structure", title: "Structure", icon: Link2, scoreKey: "structureScore" },
        { key: "content", title: "Content", icon: FileText, scoreKey: "contentScore" },
        { key: "ux", title: "UX", icon: Layout, scoreKey: "uxScore" }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Technical SEO Audit
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Comprehensive analysis of your website's technical SEO health
                </p>
            </div>

            {/* URL Input and Region Selection */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Website URL
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            onKeyDown={(e) => e.key === "Enter" && handleAudit()}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Audit Region
                        </label>
                        <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        >
                            {regions.map((r) => (
                                <option key={r.code || "auto"} value={r.code}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <Button
                            onClick={handleAudit}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Auditing...
                                </>
                            ) : (
                                <>
                                    <Shield className="w-4 h-4 mr-2" />
                                    Run Audit
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="bg-white dark:bg-slate-900 rounded-lg p-12 shadow-sm border text-center">
                    <RefreshCw className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
                    <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                        Running Technical Audit
                    </h3>
                    <p className="text-slate-500 mt-1">
                        Analyzing crawlability, speed, mobile-friendliness, security, structure, content, and UX...
                    </p>
                </div>
            )}

            {/* Results */}
            {result && !loading && (
                <div className="space-y-6">
                    {/* Server Location & Audit Region Info */}
                    {(result.auditRegion || result.serverLocation) && (
                        <div className="bg-blue-50 dark:bg-slate-900 rounded-lg p-4 border border-blue-200 dark:border-slate-700">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {result.auditRegion && (
                                    <div>
                                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Audit Region</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{result.auditRegion}</p>
                                    </div>
                                )}
                                {result.serverLocation && (
                                    <>
                                        <div>
                                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Server Location</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{result.serverLocation.city}, {result.serverLocation.country}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Region Code</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{result.serverLocation.region}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Timezone</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{result.serverLocation.timezone}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Overall Score Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-lg p-6 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <ScoreGauge score={result.overallScore} />
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        Overall Score
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                                        <ExternalLink className="w-4 h-4" />
                                        {result.url}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                        <span className="flex items-center gap-1 text-red-600">
                                            <AlertTriangle className="w-3 h-3" />
                                            {result.issues.filter(i => i.severity === 'critical').length} Critical
                                        </span>
                                        <span className="flex items-center gap-1 text-yellow-600">
                                            <AlertTriangle className="w-3 h-3" />
                                            {result.issues.filter(i => i.severity === 'warning').length} Warnings
                                        </span>
                                        <span className="flex items-center gap-1 text-blue-600">
                                            <Info className="w-3 h-3" />
                                            {result.issues.filter(i => i.severity === 'info').length} Info
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleCopyReport}
                                className="gap-2"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy Report
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Category Scores Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {categoryConfig.map((cat) => (
                            <CategoryCard
                                key={cat.key}
                                title={cat.title}
                                score={result[cat.scoreKey as keyof TechnicalAuditResult] as number}
                                icon={cat.icon}
                                details={result[cat.key as keyof TechnicalAuditResult]}
                                issues={result.issues}
                            />
                        ))}
                    </div>

                    {/* Recommendations Panel */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            Priority Recommendations
                        </h2>
                        <div className="space-y-3">
                            {result.recommendations.map((rec, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg border-l-4 ${rec.priority === 'high'
                                        ? 'bg-red-50 dark:bg-red-900/10 border-red-500'
                                        : rec.priority === 'medium'
                                            ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500'
                                            : 'bg-green-50 dark:bg-green-900/10 border-green-500'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${rec.priority === 'high'
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                                            : rec.priority === 'medium'
                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                                                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                                            }`}>
                                            {rec.priority}
                                        </span>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-slate-900 dark:text-white">
                                                {rec.title}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                {rec.description}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                                                Impact: {rec.impact}
                                            </p>
                                        </div>
                                        <span className="text-xs text-slate-400 uppercase">
                                            {rec.category}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* All Issues Summary */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            All Issues ({result.issues.length})
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b dark:border-slate-700">
                                        <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-400">Severity</th>
                                        <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-400">Category</th>
                                        <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-400">Issue</th>
                                        <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-400">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.issues.map((issue, idx) => (
                                        <tr key={idx} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                                            <td className="py-2 px-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${issue.severity === 'critical'
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                                                    : issue.severity === 'warning'
                                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                                    }`}>
                                                    {issue.severity}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                                                {issue.category}
                                            </td>
                                            <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                                                {issue.title}
                                            </td>
                                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400 max-w-md truncate">
                                                {issue.description}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!result && !loading && !error && (
                <div className="bg-white dark:bg-slate-900 rounded-lg p-12 shadow-sm border text-center">
                    <Shield className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
                    <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                        No Audit Results Yet
                    </h3>
                    <p className="text-slate-500 mt-1 max-w-md mx-auto">
                        Enter a URL above and click "Run Audit" to analyze your website's technical SEO health across 7 key categories.
                    </p>
                    <div className="mt-6 flex justify-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Crawlability</span>
                        <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> Speed</span>
                        <span className="flex items-center gap-1"><Smartphone className="w-4 h-4" /> Mobile</span>
                        <span className="flex items-center gap-1"><Lock className="w-4 h-4" /> Security</span>
                    </div>
                </div>
            )}
        </div>
    )
}
