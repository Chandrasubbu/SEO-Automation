import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET all websites for a project
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { id } = await params;

    // Verify project ownership
    const project = await prisma.seoProject.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const websites = await prisma.seoProjectWebsite.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, websites, total: websites.length });
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch websites' },
      { status: 500 }
    );
  }
}

// POST add website to project
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { id } = await params;
    const { url, type = 'competitor', notes } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.seoProject.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if website already exists
    const existing = await prisma.seoProjectWebsite.findFirst({
      where: {
        projectId: id,
        url
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Website already exists in this project' },
        { status: 409 }
      );
    }

    const website = await prisma.seoProjectWebsite.create({
      data: {
        projectId: id,
        url,
        type,
        notes
      }
    });

    return NextResponse.json({ success: true, website }, { status: 201 });
  } catch (error) {
    console.error('Error adding website:', error);
    return NextResponse.json(
      { error: 'Failed to add website' },
      { status: 500 }
    );
  }
}

// DELETE website from project
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { id } = await params;
    const { websiteId } = await req.json();

    if (!websiteId) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.seoProject.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    await prisma.seoProjectWebsite.delete({
      where: { id: websiteId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting website:', error);
    return NextResponse.json(
      { error: 'Failed to delete website' },
      { status: 500 }
    );
  }
}
