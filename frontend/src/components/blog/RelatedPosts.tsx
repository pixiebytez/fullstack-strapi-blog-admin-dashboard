import type { Blog } from '@/types';

interface RelatedPostsProps {
  posts: Pick<Blog, 'id' | 'title' | 'slug' | 'excerpt'>[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  return (
    <div className="grid gap-3">
      {posts.map((post) => (
        <a key={post.id} href={`/blog/${post.slug}`} className="rounded border p-3">
          <h3 className="font-medium">{post.title}</h3>
          <p className="text-sm text-muted-foreground">{post.excerpt}</p>
        </a>
      ))}
    </div>
  );
}
