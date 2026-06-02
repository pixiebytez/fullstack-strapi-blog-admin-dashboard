import type { Blog } from '@/types';

interface BlogMetaProps {
  blog: Blog;
}

export function BlogMeta({ blog }: BlogMetaProps) {
  const author = blog.author ? `${blog.author.firstName || ''} ${blog.author.lastName || ''}`.trim() : 'Unknown';
  return (
    <div className="mb-6 text-sm text-muted-foreground">
      By {author} {blog.publishedDate ? `• ${new Date(blog.publishedDate).toLocaleDateString()}` : ''}
    </div>
  );
}
