'use client';

interface SearchBarProps {
  placeholder?: string;
}

export function SearchBar({ placeholder = 'Search...' }: SearchBarProps) {
  return (
    <input
      type="search"
      placeholder={placeholder}
      className="h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-primary"
    />
  );
}
