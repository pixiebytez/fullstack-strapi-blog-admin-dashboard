import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes intelligently */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number with commas */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n);
}

/** Truncate text to a max length */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}

/** Resolve Strapi image URL */
export function getStrapiImageUrl(url?: string): string | null {
  if (!url) return null;
  const base = process.env.NEXT_PUBLIC_STRAPI_URL || '';
  return url.startsWith('http') ? url : `${base}${url}`;
}

/** Strip HTML tags from rich text */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/** Generate reading time */
export function readingTime(content: string): number {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
