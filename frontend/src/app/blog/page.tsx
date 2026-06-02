import type { Metadata } from 'next';
import { Suspense } from 'react';
import { blogApi, categoryApi, tagApi } from '@/lib/strapi';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogFiltersBar } from '@/components/blog/BlogFiltersBar';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar } from '@/components/ui/SearchBar';
import type { Blog, BlogFilters } from '@/types';

export const metadata: Metadata = {
  title: 'Blog — AI Blog CMS',
  description: 'Explore all articles on technology, web development, AI, and more.',
  openGraph: {
    title:       'Blog — AI Blog CMS',
    description: 'Explore all articles on technology, web development, AI, and more.',
  },
};

export const revalidate = 60;

interface PageProps {
  searchParams: { [key: string]: string | undefined };
}

export default async function BlogListPage({ searchParams }: PageProps) {
  const filters: BlogFilters = {
    page:      parseInt(searchParams.page || '1'),
    pageSize:  12,
    category:  searchParams.category,
    tag:       searchParams.tag,
    sort:      searchParams.sort || 'publishedDate:desc',
  };

  const [blogsRes, categoriesRes, tagsRes] = await Promise.all([
    blogApi.getAll(filters),
    categoryApi.getAll(),
    tagApi.getAll(),
  ]);

  const blogs      = (blogsRes.data.data      as Blog[])     || [];
  const pagination = blogsRes.data.meta?.pagination;
  const categories = categoriesRes.data.data  || [];
  const tags       = tagsRes.data.data        || [];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">All Articles</h1>
        <p className="text-muted-foreground">
          {pagination?.total || 0} articles published
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-8 space-y-4">
        <SearchBar placeholder="Search articles..." />
        <Suspense fallback={null}>
          <BlogFiltersBar
            categories={categories}
            tags={tags}
            activeCategory={searchParams.category}
            activeTag={searchParams.tag}
            activeSort={searchParams.sort}
          />
        </Suspense>
      </div>

      {/* Blog grid */}
      {blogs.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-2xl font-semibold mb-2">No articles found</p>
          <p>Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
          {pagination && pagination.pageCount > 1 && (
            <Pagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              total={pagination.total}
            />
          )}
        </>
      )}
    </div>
  );
}
