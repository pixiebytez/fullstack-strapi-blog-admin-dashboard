import Link from 'next/link';

const FOOTER_LINKS = {
  Product: [
    { label: 'Blog',       href: '/blog' },
    { label: 'Categories', href: '/category' },
    { label: 'Newsletter', href: '/newsletter' },
  ],
  Developers: [
    { label: 'REST API',  href: `${process.env.NEXT_PUBLIC_STRAPI_URL}/api` },
    { label: 'GraphQL',   href: `${process.env.NEXT_PUBLIC_STRAPI_URL}/graphql` },
    { label: 'Admin',     href: `${process.env.NEXT_PUBLIC_STRAPI_URL}/admin` },
    { label: 'Docs',      href: '/docs' },
  ],
  Company: [
    { label: 'About',   href: '/about' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms',   href: '/terms' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-bold text-lg flex items-center gap-1 mb-3">
              <span className="text-primary">AI</span> Blog CMS
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A production-grade headless CMS built with Strapi v5,
              Next.js 14, PostgreSQL, and Docker.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Open-source · MIT License
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold mb-3">{group}</h3>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} AI Blog CMS. All rights reserved.</p>
          <p>
            Built with{' '}
            <a href="https://strapi.io" className="hover:text-primary">Strapi v5</a>
            {' '}+{' '}
            <a href="https://nextjs.org" className="hover:text-primary">Next.js 14</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
