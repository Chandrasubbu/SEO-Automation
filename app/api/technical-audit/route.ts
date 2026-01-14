import { NextRequest, NextResponse } from "next/server"
import { technicalAuditService } from "@/lib/services/technical-audit"
import { prisma } from "@/lib/db"

/**
 * POST /api/technical-audit
 * Run a new technical audit on a URL
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { url, projectId, userId, region } = body

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            )
        }

        // Run the technical audit from the specified region (or auto-detect)
        const auditResult = await technicalAuditService.runFullAudit(url, region)

        // Try to save to database (may fail if Prisma client needs regeneration)
        let savedAuditId: string | null = null
        try {
            if (prisma.technicalAudit) {
                const savedAudit = await prisma.technicalAudit.create({
                    data: {
                        userId: userId || null,
                        projectId: projectId || null,
                        url: auditResult.url,
                        overallScore: auditResult.overallScore,
                        crawlabilityScore: auditResult.crawlabilityScore,
                        speedScore: auditResult.speedScore,
                        mobileScore: auditResult.mobileScore,
                        securityScore: auditResult.securityScore,
                        structureScore: auditResult.structureScore,
                        contentScore: auditResult.contentScore,
                        uxScore: auditResult.uxScore,
                        crawlability: JSON.parse(JSON.stringify(auditResult.crawlability)),
                        speed: JSON.parse(JSON.stringify(auditResult.speed)),
                        mobile: JSON.parse(JSON.stringify(auditResult.mobile)),
                        security: JSON.parse(JSON.stringify(auditResult.security)),
                        structure: JSON.parse(JSON.stringify(auditResult.structure)),
                        content: JSON.parse(JSON.stringify(auditResult.content)),
                        ux: JSON.parse(JSON.stringify(auditResult.ux)),
                        issues: JSON.parse(JSON.stringify(auditResult.issues)),
                        recommendations: JSON.parse(JSON.stringify(auditResult.recommendations))
                    }
                })
                savedAuditId = savedAudit.id
            }
        } catch (dbError) {
            console.warn("Could not save audit to database (server restart may be needed):", dbError)
        }

        return NextResponse.json({
            id: savedAuditId,
            ...auditResult
        })
    } catch (error) {
        console.error("Technical audit error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to run technical audit" },
            { status: 500 }
        )
    }
}

/**
 * GET /api/technical-audit
 * List all technical audits (with optional filtering)
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get("userId")
        const projectId = searchParams.get("projectId")
        const limit = parseInt(searchParams.get("limit") || "20")

        const where: { userId?: string; projectId?: string } = {}
        if (userId) where.userId = userId
        if (projectId) where.projectId = projectId

        const audits = await prisma.technicalAudit.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                url: true,
                overallScore: true,
                crawlabilityScore: true,
                speedScore: true,
                mobileScore: true,
                securityScore: true,
                structureScore: true,
                contentScore: true,
                uxScore: true,
                createdAt: true
            }
        })

        return NextResponse.json({ audits })
    } catch (error) {
        console.error("Error fetching audits:", error)
        return NextResponse.json(
            { error: "Failed to fetch audits" },
            { status: 500 }
        )
    }
}
