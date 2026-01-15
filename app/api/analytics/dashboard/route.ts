import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { searchConsoleService } from "@/lib/services/search-console"

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const days = parseInt(searchParams.get("days") || "30")

        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Fetch aggregated data from DB
        const performanceData = await prisma.searchPerformance.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: startDate,
                    lte: endDate
                },
                // For main chart, we might want to aggregate all paths or filter by specific one
                // Here we assume path='/' stores the site-wide aggregate we set in sync
                path: '/'
            },
            orderBy: {
                date: 'asc'
            }
        })

        // Prepare chart data
        // Group by date to combine devices if needed, or just send as is
        // For simplicity, let's assume we want to sum up desktop+mobile for the main chart
        const chartDataMap = new Map();

        let totalClicks = 0;
        let totalImpressions = 0;

        performanceData.forEach((record: { date: Date; clicks: number; impressions: number; position: number }) => {
            const dateKey = record.date.toISOString().split('T')[0];

            if (!chartDataMap.has(dateKey)) {
                chartDataMap.set(dateKey, {
                    date: dateKey,
                    clicks: 0,
                    impressions: 0,
                    position: 0,
                    count: 0
                });
            }

            const entry = chartDataMap.get(dateKey);
            entry.clicks += record.clicks;
            entry.impressions += record.impressions;
            entry.position += record.position;
            entry.count += 1;

            totalClicks += record.clicks;
            totalImpressions += record.impressions;
        });

        const chartData = Array.from(chartDataMap.values()).map(entry => ({
            ...entry,
            position: entry.count > 0 ? entry.position / entry.count : 0
        }));

        // Fetch top pages and queries
        let topPages = await prisma.searchPerformance.findMany({
            where: {
                userId: session.user.id,
                path: { not: '/' },
                date: { gte: startDate, lte: endDate }
            },
            orderBy: { clicks: 'desc' },
            take: 10
        });

        let topQueries = await prisma.searchPerformance.findMany({
            where: {
                userId: session.user.id,
                keyword: { not: null },
                date: { gte: startDate, lte: endDate }
            },
            orderBy: { clicks: 'desc' },
            take: 10
        });

        // If no data in DB, fallback to service (mock)
        if (topPages.length === 0) {
            const servicePages = await searchConsoleService.getSearchAnalytics('https://example.com', startDate.toISOString(), endDate.toISOString(), ['page']);
            topPages = servicePages.map((p: any) => ({
                path: p.keys?.[0] || '/',
                clicks: p.clicks,
                impressions: p.impressions,
                ctr: p.ctr,
                position: p.position
            })) as any;
        }

        if (topQueries.length === 0) {
            const serviceQueries = await searchConsoleService.getSearchAnalytics('https://example.com', startDate.toISOString(), endDate.toISOString(), ['query']);
            topQueries = serviceQueries.map((q: any) => ({
                keyword: q.keys?.[0] || '',
                clicks: q.clicks,
                impressions: q.impressions,
                ctr: q.ctr,
                position: q.position
            })) as any;
        }

        return NextResponse.json({
            overview: {
                totalClicks,
                totalImpressions,
                avgCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
                avgPosition: chartData.length > 0 ? chartData.reduce((acc, curr) => acc + curr.position, 0) / chartData.length : 0
            },
            chartData: chartData,
            topPages,
            topQueries
        })

    } catch (error) {
        console.error("Dashboard data error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
