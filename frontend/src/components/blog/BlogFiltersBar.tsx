import type { Category, Tag } from '@/types';

interface BlogFiltersBarProps {
  categories: Category[];
  tags: Tag[];
  activeCategory?: string;
  activeTag?: string;
  activeSort?: string;
}

export function BlogFiltersBar({ categories, tags, activeCategory, activeTag, activeSort }: BlogFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-background p-3 text-xs text-muted-foreground shadow-sm sm:text-sm">
      <span className="rounded-full bg-muted px-2.5 py-1 font-medium">
        {categories.length} categories
      </span>
      <span className="rounded-full bg-muted px-2.5 py-1 font-medium">
        {tags.length} tags
      </span>
      {activeCategory ? <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">Category: {activeCategory}</span> : null}
      {activeTag ? <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">Tag: {activeTag}</span> : null}
      {activeSort ? <span className="rounded-full bg-muted px-2.5 py-1 font-medium">Sort: {activeSort}</span> : null}
    </div>
  );
}
