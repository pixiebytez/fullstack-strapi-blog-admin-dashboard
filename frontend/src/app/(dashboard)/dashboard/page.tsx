'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { blogApi } from '@/lib/strapi';
import { BarChart2, FileText, Users, MessageSquare, TrendingUp, Eye } from 'lucide-react';
import { BlogCard } from '@/components/blog/BlogCard';
import type { Blog } from '@/types';

interface StatCardProps {
  label: string;
  value: string | number;
  icon:  React.ReactNode;
  trend?: string;
}

function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
        {trend && <p className="text-xs text-emerald-500 mt-1">{trend}</p>}
      </div>
      <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  // Fetch user's own blogs
  const { data: myBlogsRes } = useQuery({
    queryKey: ['my-blogs'],
    queryFn:  () => blogApi.getAll({ pageSize: 6 }).then((r) => r.data),
    enabled:  isAuthenticated,
  });

  const myBlogs = (myBlogsRes?.data as Blog[]) || [];
  const stats   = myBlogsRes?.meta?.pagination;

  if (!isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Greeting */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.firstName || user?.username} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? 'Administrator Dashboard' : 'Your content overview'}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Total Posts"
          value={stats?.total || 0}
          icon={<FileText className="h-5 w-5" />}
          trend="↑ 12% this month"
        />
        <StatCard
          label="Total Views"
          value={myBlogs.reduce((sum, b) => sum + (b.viewCount || 0), 0).toLocaleString()}
          icon={<Eye className="h-5 w-5" />}
          trend="↑ 8% this week"
        />
        <StatCard
          label="Comments"
          value={myBlogs.reduce((sum, b) => sum + (b.comments?.length || 0), 0)}
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <StatCard
          label="Trending"
          value={myBlogs.filter((b) => b.isTrending).length}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Recent posts */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Recent Posts</h2>
        <a href="/dashboard/blogs/new" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          + New Post
        </a>
      </div>

      {myBlogs.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold mb-1">No posts yet</p>
          <p className="text-sm">Start writing your first blog post</p>
          <a href="/dashboard/blogs/new" className="mt-4 inline-block px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
            Create Post
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myBlogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      )}
    </div>
  );
}
