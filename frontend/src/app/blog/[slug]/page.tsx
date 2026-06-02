import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { blogApi } from '@/lib/strapi';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { CommentSection } from '@/components/comment/CommentSection';
import { BlogMeta } from '@/components/blog/BlogMeta';
import { BlogContent } from '@/components/blog/BlogContent';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { NewsletterInline } from '@/components/NewsletterInline';
import type { Blog } from '@/types';

interface Props {
  params: { slug: string };
}

// ============================================================
// Static generation — generate paths for known slugs at build time
// ============================================================
export async function generateStaticParams() {
  try {
    const res = await blogApi.getAll({ pageSize: 100 });
    const blogs = (res.data.data as Blog[]) || [];
    return blogs.map((b) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

// ============================================================
// Dynamic metadata per blog post
// ============================================================
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const res  = await blogApi.getBySlug(params.slug);
    const blog = res.data.data as Blog;

    if (!blog) return { title: 'Blog Post Not Found' };

    const seo = blog.seoMeta;
    const og  = blog.openGraph;

    return {
      title:       seo?.metaTitle       || blog.title,
      description: seo?.metaDescription || blog.excerpt,
      keywords:    seo?.keywords,
      openGraph: {
        title:       og?.ogTitle        || blog.title,
        description: og?.ogDescription  || blog.excerpt,
        type:        'article',
        publishedTime: blog.publishedDate,
        authors:     blog.author ? [`${blog.author.firstName} ${blog.author.lastName}`] : [],
        images:      og?.ogImage?.url
          ? [{ url: og.ogImage.url, width: 1200, height: 630 }]
          : blog.featuredImage?.url
          ? [{ url: blog.featuredImage.url }]
          : [],
      },
      twitter: {
        card:        'summary_large_image',
        title:       seo?.metaTitle     || blog.title,
        description: seo?.metaDescription || blog.excerpt,
      },
      alternates: {
        canonical: seo?.canonicalURL || `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${blog.slug}`,
      },
    };
  } catch {
    return { title: 'Blog Post' };
  }
}

// ============================================================
// Blog detail page — ISR with 5-minute revalidation
// ============================================================
export const revalidate = 300;

export default async function BlogDetailPage({ params }: Props) {
  let blog: Blog;

  try {
    const res = await blogApi.getBySlug(params.slug);
    blog = res.data.data as Blog;
    if (!blog) notFound();
  } catch {
    notFound();
  }

  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || '';
  const imageUrl  = blog.featuredImage?.url
    ? blog.featuredImage.url.startsWith('http')
      ? blog.featuredImage.url
      : `${strapiUrl}${blog.featuredImage.url}`
    : null;

  return (
    <article className="container mx-auto px-4 py-12 max-w-4xl">

      {/* Category breadcrumb */}
      {blog.category && (
        <div className="mb-4">
          <a
            href={`/blog?category=${blog.category.slug}`}
            className="text-sm font-semibold text-primary hover:underline uppercase tracking-wide"
          >
            {blog.category.name}
          </a>
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
        {blog.title}
      </h1>

      {/* Excerpt */}
      <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
        {blog.excerpt}
      </p>

      {/* Author + meta */}
      <BlogMeta blog={blog} />

      {/* Featured image */}
      {imageUrl && (
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-10 shadow-lg">
          <Image
            src={imageUrl}
            alt={blog.featuredImage?.alternativeText || blog.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 900px"
          />
        </div>
      )}

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {blog.tags.map((tag) => (
            <a
              key={tag.id}
              href={`/blog?tag=${tag.slug}`}
              className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              #{tag.name}
            </a>
          ))}
        </div>
      )}

      {/* Article body */}
      <BlogContent content={blog.content} />

      {/* Share */}
      <div className="mt-10 pt-8 border-t">
        <ShareButtons
          url={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${blog.slug}`}
          title={blog.title}
        />
      </div>

      {/* Inline newsletter CTA */}
      <div className="mt-12">
        <NewsletterInline />
      </div>

      {/* Related posts */}
      {blog.relatedPosts && blog.relatedPosts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
          <RelatedPosts posts={blog.relatedPosts} />
        </section>
      )}

      {/* Comments */}
      <section className="mt-16">
        <CommentSection blogId={blog.id} initialComments={blog.comments || []} />
      </section>
    </article>
  );
}
