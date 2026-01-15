'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, FileText, Download, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ContentOutline {
    title: string
    introduction: string
    sections: {
        heading: string
        subheadings?: string[]
        keyPoints: string[]
    }[]
    conclusion: string
    callToAction?: string
}

export function ContentGenerator() {
    const [step, setStep] = useState<'input' | 'outline' | 'generate' | 'result'>('input')
    const [topic, setTopic] = useState('')
    const [keyword, setKeyword] = useState('')
    const [template, setTemplate] = useState('')
    const [templates, setTemplates] = useState<any[]>([])
    const [outline, setOutline] = useState<ContentOutline | null>(null)
    const [article, setArticle] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

    // Fetch templates on mount
    useEffect(() => {
        fetch('/api/content/article/generate')
            .then(res => res.json())
            .then(data => setTemplates(data.templates || []))
            .catch(console.error)
    }, [])

    const generateOutline = async () => {
        if (!topic.trim() || !keyword.trim()) {
            setError('Please enter both topic and keyword')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/content/article/generate?action=outline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic.trim(),
                    targetKeyword: keyword.trim(),
                    template: template || undefined,
                    numberOfSections: 6
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate outline')
            }

            setOutline(data.outline)
            setStep('outline')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const generateArticle = async () => {
        if (!outline) return

        setLoading(true)
        setError('')
        setStep('generate')

        try {
            const res = await fetch('/api/content/article/generate?action=generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    outline,
                    targetKeyword: keyword,
                    tone: 'professional',
                    length: 'medium',
                    includeFAQ: true
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate article')
            }

            setArticle(data)
            setStep('result')
        } catch (err: any) {
            setError(err.message)
            setStep('outline')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (article) {
            navigator.clipboard.writeText(article.content)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const downloadMarkdown = () => {
        if (article) {
            const blob = new Blob([article.content], { type: 'text/markdown' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
            a.click()
            URL.revokeObjectURL(url)
        }
    }

    return (
        <div className="space-y-6">
            {/* Step 1: Input */}
            {step === 'input' && (
                <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Generate SEO-Optimized Article</h2>
                    <p className="text-gray-600 mb-6">
                        Create comprehensive, AI-generated articles from templates or custom outlines
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Topic</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Email Marketing Automation"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Target Keyword</label>
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="e.g., email marketing"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Template (Optional)</label>
                            <select
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Custom (AI-Generated)</option>
                                {templates.map((t) => (
                                    <option key={t.name} value={t.name}>
                                        {t.name} - {t.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Button
                            onClick={generateOutline}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating Outline...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Generate Outline
                                </>
                            )}
                        </Button>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                {error}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Step 2: Review Outline */}
            {step === 'outline' && outline && (
                <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Review Outline</h2>
                    <p className="text-gray-600 mb-6">
                        Review and edit the outline before generating the full article
                    </p>

                    <div className="space-y-4 mb-6">
                        <div>
                            <h3 className="font-bold text-lg">{outline.title}</h3>
                            <p className="text-gray-600 mt-2">{outline.introduction}</p>
                        </div>

                        <div className="space-y-3">
                            {outline.sections.map((section, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold">{idx + 1}. {section.heading}</h4>
                                    <ul className="mt-2 ml-4 text-sm text-gray-600 list-disc">
                                        {section.keyPoints.map((point, pidx) => (
                                            <li key={pidx}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold">Conclusion</h4>
                            <p className="text-sm text-gray-600 mt-1">{outline.conclusion}</p>
                            {outline.callToAction && (
                                <p className="text-sm text-blue-600 mt-2 font-medium">{outline.callToAction}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={() => setStep('input')}
                            variant="outline"
                            className="flex-1"
                        >
                            Back to Edit
                        </Button>
                        <Button
                            onClick={generateArticle}
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                'Generate Full Article'
                            )}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Step 3: Generating */}
            {step === 'generate' && (
                <Card className="p-12 text-center">
                    <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-600" />
                    <h3 className="text-xl font-bold mb-2">Generating Your Article</h3>
                    <p className="text-gray-600">
                        This may take 30-60 seconds. We're creating high-quality, SEO-optimized content...
                    </p>
                </Card>
            )}

            {/* Step 4: Result */}
            {step === 'result' && article && (
                <>
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold">{article.title}</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {article.wordCount} words • {article.sections.length} sections
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={copyToClipboard}
                                    variant="outline"
                                    size="sm"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={downloadMarkdown}
                                    variant="outline"
                                    size="sm"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg mb-6">
                            <h4 className="font-semibold mb-2">Meta Description</h4>
                            <p className="text-sm text-gray-700">{article.metaDescription}</p>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-xl font-bold mb-4">Generated Article</h3>
                        <div className="prose max-w-none">
                            <ReactMarkdown>{article.content}</ReactMarkdown>
                        </div>
                    </Card>

                    <div className="flex gap-4">
                        <Button
                            onClick={() => {
                                setStep('input')
                                setOutline(null)
                                setArticle(null)
                                setTopic('')
                                setKeyword('')
                            }}
                            variant="outline"
                            className="flex-1"
                        >
                            Generate Another Article
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
