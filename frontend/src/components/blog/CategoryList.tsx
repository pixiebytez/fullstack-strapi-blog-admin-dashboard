import type { Category } from '@/types';

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        No categories available yet.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {categories.map((category) => (
        <a
          key={category.id}
          href={`/blog?category=${category.slug}`}
          className="group rounded-full border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: category.color || '#6366f1' }}
            />
            {category.name}
          </span>
        </a>
      ))}
    </div>
  );
}
