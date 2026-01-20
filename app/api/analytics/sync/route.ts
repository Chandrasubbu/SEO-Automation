import { NextRequest, NextResponse } from "next/server"
import { searchConsoleService } from "@/lib/services/search-console"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"

// Schema for query validation
const syncSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    siteUrl: z.string().url().optional(),
})

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const result = syncSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
        }

        const { startDate, endDate, siteUrl } = result.data

        // Default to last 30 days if not specified
        const end = endDate || new Date().toISOString().split('T')[0]
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        // Use a placeholder site URL if not provided (in real app, this would come from the user's project settings)
        const targetUrl = siteUrl || "https://ucadesignlabs.in"

        // 1. Fetch data from GSC (or mock)
        // We fetch two types of data:
        // a) Date-aggreated for the main chart
        // b) Page/Query specific data for the tables

        // For now, let's just focus on populating the daily overview
        const analyticsData = await searchConsoleService.getSearchAnalytics(
            targetUrl,
            start,
            end,
            ['date', 'device']
        )

        // 2. Store in Database
        let recordsCreated = 0;

        for (const row of analyticsData) {
            const date = row.keys?.[0]; // Date dimension
            const device = row.keys?.[1] || 'desktop';

            if (!date) continue;

            await prisma.searchPerformance.upsert({
                where: {
                    userId_date_path_keyword_device: {
                        userId: session.user.id,
                        date: new Date(date),
                        path: '/', // General site-wide metric
                        keyword: null as any,
                        device: device
                    }
                },
                update: {
                    clicks: row.clicks || 0,
                    impressions: row.impressions || 0,
                    ctr: row.ctr || 0,
                    position: row.position || 0,
                },
                create: {
                    userId: session.user.id,
                    date: new Date(date),
                    path: '/',
                    device: device,
                    clicks: row.clicks || 0,
                    impressions: row.impressions || 0,
                    ctr: row.ctr || 0,
                    position: row.position || 0,
                }
            })
            recordsCreated++;
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${recordsCreated} records`,
            range: { start, end }
        })

    } catch (error) {
        console.error("Sync error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
