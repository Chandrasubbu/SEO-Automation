import { ProjectDetails } from '@/components/ProjectDetails';

export const metadata = {
  title: 'Project Details | SEO Automation',
  description: 'View and manage project details'
};

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  return (
    <main className="flex-1 md:ml-64 p-4 md:p-8">
      <ProjectDetails projectId={id} />
    </main>
  );
}
