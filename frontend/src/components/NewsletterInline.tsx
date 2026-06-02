import { NewsletterForm } from './NewsletterForm';

export function NewsletterInline() {
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-background p-6 shadow-sm">
      <h3 className="mb-2 text-xl font-semibold">Get weekly product and engineering insights</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        A concise digest on architecture, frontend quality, and content platform scaling.
      </p>
      <NewsletterForm />
    </div>
  );
}
