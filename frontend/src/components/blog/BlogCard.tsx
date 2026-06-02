import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Clock, MessageSquare } from 'lucide-react';
import type { Blog } from '@/types';
import { cn } from '@/lib/utils';

interface BlogCardProps {
  blog:     Blog;
  compact?: boolean;
  className?: string;
}

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || '';

function resolveImageUrl(url?: string) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${STRAPI_URL}${url}`;
}

export function BlogCard({ blog, compact = false, className }: BlogCardProps) {
  const imageUrl    = resolveImageUrl(blog.featuredImage?.url);
  const publishedAt = blog.publishedDate || blog.publishedAt || blog.createdAt;
  const timeAgo     = publishedAt
    ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true })
    : null;

  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-2xl border bg-card overflow-hidden shadow-sm',
        'hover:shadow-md transition-all duration-200',
        className
      )}
    >
      {/* Featured image */}
      {imageUrl && (
        <Link href={`/blog/${blog.slug}`} className="block overflow-hidden">
          <div className={cn('relative w-full bg-muted', compact ? 'aspect-[16/9]' : 'aspect-[16/10]')}>
            <Image
              src={imageUrl}
              alt={blog.featuredImage?.alternativeText || blog.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        </Link>
      )}

      <div className="flex flex-col flex-1 p-5">
        {/* Category badge */}
        {blog.category && (
          <Link
            href={`/blog?category=${blog.category.slug}`}
            className="text-xs font-semibold text-primary uppercase tracking-widest mb-2 hover:underline"
          >
            {blog.category.name}
          </Link>
        )}

        {/* Title */}
        <Link href={`/blog/${blog.slug}`}>
          <h2 className={cn(
            'font-bold leading-snug mb-2 group-hover:text-primary transition-colors',
            compact ? 'text-base' : 'text-xl'
          )}>
            {blog.title}
          </h2>
        </Link>

        {/* Excerpt — hidden in compact mode */}
        {!compact && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {blog.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t">
          <div className="flex items-center gap-1">
            {blog.author?.firstName && (
              <span className="font-medium text-foreground">
                {blog.author.firstName} {blog.author.lastName}
              </span>
            )}
            {timeAgo && <span>· {timeAgo}</span>}
          </div>

          <div className="flex items-center gap-3">
            {blog.readingTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {blog.readingTime}m
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {blog.viewCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* AI badge */}
        {blog.aiGenerated && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-violet-500/90 text-white text-[10px] font-semibold">
            AI
          </span>
        )}
      </div>
    </article>
  );
}
