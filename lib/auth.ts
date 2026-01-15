import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./db"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: "/login",
        signOut: "/login",
        error: "/login",
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required")
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                })

                if (!user || !user.password) {
                    throw new Error("Invalid email or password")
                }

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if (!isValid) {
                    throw new Error("Invalid email or password")
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    image: user.image,
                }
            },
        }),
        // OAuth providers - will work if credentials are provided in env
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                Google({
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                }),
            ]
            : []),
        ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
            ? [
                GitHub({
                    clientId: process.env.GITHUB_ID,
                    clientSecret: process.env.GITHUB_SECRET,
                }),
            ]
            : []),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = (user as { role?: string }).role || "user"
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        },
    },
})

// Type augmentation for session
declare module "next-auth" {
    interface User {
        role?: string
    }
    interface Session {
        user: {
            id: string
            email: string
            name?: string | null
            image?: string | null
            role: string
        }
    }
}

// declare module "next-auth/jwt" {
//     interface JWT {
//         id: string
//         role: string
//     }
// }
