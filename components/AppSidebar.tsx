"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
    LayoutDashboard,
    Search,
    LineChart,
    Settings,
    PenTool,
    Zap,
    Menu,
    Briefcase,
    FileText,
    Shield,
    Link2
} from "lucide-react"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { LogOut, User as UserIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function UserProfile() {
    const { data: session, status } = useSession()

    if (status === "loading") {
        return <div className="h-12 animate-pulse bg-slate-100 rounded-md" />
    }

    if (status === "unauthenticated" || !session) {
        return (
            <Button asChild className="w-full" variant="outline">
                <Link href="/login">Sign In</Link>
            </Button>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.image || undefined} />
                    <AvatarFallback>{session.user?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate">{session.user?.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{session.user?.email}</span>
                </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => signOut({ callbackUrl: "/login" })}
            >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
            </Button>
        </div>
    )
}

const sidebarItems = [
    { name: "SEO Blueprint Generator", href: "/", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: Briefcase },
    { name: "Keyword Research", href: "/keyword-research", icon: Search },
    { name: "SERP Analysis", href: "/serp-analysis", icon: LineChart },
    { name: "Content Strategy", href: "/content-strategy", icon: Briefcase },
    { name: "Content Audit", href: "/content-audit", icon: FileText },
    { name: "Technical Audit", href: "/technical-audit", icon: Shield },
    { name: "Backlinks", href: "/backlinks", icon: Link2 },
    { name: "Content Generator", href: "/content-generator", icon: PenTool },
    { name: "Optimization", href: "/optimization", icon: Zap },
    { name: "Analytics", href: "/analytics", icon: LineChart },
    { name: "Competitor Analysis", href: "/competitor-analysis", icon: Search },
    { name: "Workflows", href: "/workflows", icon: Settings },
    { name: "User Guide", href: "/user-guide", icon: FileText },
]

export function AppSidebar() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    const NavContent = () => (
        <div className="space-y-4 py-4">
            <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                    SEO Automation
                </h2>
                <div className="space-y-1">
                    {sidebarItems.map((item) => (
                        <Button
                            key={item.href}
                            variant={pathname === item.href ? "secondary" : "ghost"}
                            className={cn("w-full justify-start", pathname === item.href && "bg-slate-100 dark:bg-slate-800")}
                            asChild
                            onClick={() => setOpen(false)}
                        >
                            <Link href={item.href}>
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.name}
                            </Link>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Auth / User Section */}
            <div className="mt-auto p-4 border-t">
                {/* This section will be populated by client-side auth state */}
                <UserProfile />
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile Trigger */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" className="md:hidden fixed top-4 left-4 z-40" size="icon">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                    <NavContent />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-screen w-64 flex-col fixed left-0 top-0 border-r bg-white dark:bg-slate-950 z-30">
                <NavContent />
            </div>
        </>
    )
}
