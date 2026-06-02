import { blogApi } from '@/lib/strapi';
import type { Blog } from '@/types';

export async function TrendingBlogs() {
  let blogs: Blog[] = [];
  try {
    const res = await blogApi.getAll({ pageSize: 5, sort: 'viewCount:desc' });
    blogs = (res.data.data as Blog[]) || [];
  } catch {
    blogs = [];
  }

  return (
    <div className="space-y-3">
      {blogs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          Trending articles will appear here.
        </div>
      ) : (
        blogs.map((blog, index) => (
          <a
            key={blog.id}
            href={`/blog/${blog.slug}`}
            className="group flex items-start gap-3 rounded-xl border bg-background p-3 transition hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <p className="line-clamp-2 text-sm font-medium leading-6">{blog.title}</p>
          </a>
        ))
      )}
    </div>
  );
}
