interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
}

export function Pagination({ page, pageCount, total }: PaginationProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
      <span>
        Page <span className="font-semibold text-foreground">{page}</span> of{' '}
        <span className="font-semibold text-foreground">{pageCount}</span>
      </span>
      <span>{total} articles</span>
    </div>
  );
}
