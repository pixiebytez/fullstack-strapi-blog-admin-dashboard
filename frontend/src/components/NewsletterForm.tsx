'use client';

export function NewsletterForm() {
  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <input
        className="h-11 rounded-lg border bg-background px-4 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-primary"
        placeholder="you@example.com"
        type="email"
      />
      <button
        className="h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        type="button"
      >
        Subscribe
      </button>
    </form>
  );
}
