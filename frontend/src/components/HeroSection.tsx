export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-indigo-50/80 via-background to-background py-20 dark:from-indigo-950/20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_45%)]" />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Editorial Platform
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            Publish smarter with AI-assisted editorial workflows
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Discover practical engineering, frontend, and platform articles powered by a modern Strapi + Next.js stack.
          </p>
        </div>
      </div>
    </section>
  );
}
