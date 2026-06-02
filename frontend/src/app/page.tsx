import { Suspense } from 'react';
import type { Metadata } from 'next';
import { blogApi, categoryApi } from '@/lib/strapi';
import { BlogCard } from '@/components/blog/BlogCard';
import { CategoryList } from '@/components/blog/CategoryList';
import { NewsletterForm } from '@/components/NewsletterForm';
import { HeroSection } from '@/components/HeroSection';
import { TrendingBlogs } from '@/components/blog/TrendingBlogs';
import type { Blog, Category } from '@/types';

export const metadata: Metadata = {
  title: 'Home — AI Blog CMS',
  description: 'Discover AI-powered articles on technology, development, and innovation.',
};

// ISR — revalidate every 60 seconds
export const revalidate = 60;

async function getFeaturedBlogs(): Promise<Blog[]> {
  try {
    const res = await blogApi.getAll({ featured: true, pageSize: 6 });
    return (res.data.data as Blog[]) || [];
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await categoryApi.getAll();
    return (res.data.data as Category[]) || [];
  } catch {
    return [];
  }
}

async function getLatestBlogs(): Promise<Blog[]> {
  try {
    const res = await blogApi.getAll({ pageSize: 9 });
    return (res.data.data as Blog[]) || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featuredBlogs, categories, latestBlogs] = await Promise.all([
    getFeaturedBlogs(),
    getCategories(),
    getLatestBlogs(),
  ]);

  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* Categories */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
          <Suspense fallback={<div className="animate-pulse h-16 bg-muted rounded-lg" />}>
            <CategoryList categories={categories} />
          </Suspense>
        </div>
      </section>

      {/* Featured Blogs */}
      {featuredBlogs.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Featured Articles</h2>
              <a href="/blog" className="text-primary hover:underline text-sm font-medium">
                View all →
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending + Latest side by side */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Latest blogs — 2/3 width */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Latest Articles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {latestBlogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} compact />
                ))}
              </div>
            </div>

            {/* Trending sidebar — 1/3 width */}
            <aside>
              <h2 className="text-2xl font-bold mb-6">Trending Now</h2>
              <Suspense fallback={<div className="space-y-4">{Array(5).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
              ))}</div>}>
                <TrendingBlogs />
              </Suspense>
            </aside>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Stay in the Loop</h2>
          <p className="text-muted-foreground mb-8">
            Get the latest articles delivered straight to your inbox. No spam, ever.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
