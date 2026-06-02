# AI Blog CMS Platform

> **Production-grade headless CMS** built with **Strapi v5 + Next.js 14 + PostgreSQL + Redis + Docker**

[![CI/CD](https://github.com/yourusername/ai-blog-cms/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/yourusername/ai-blog-cms/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Strapi v5](https://img.shields.io/badge/Strapi-v5-2f2d73)](https://strapi.io)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)

---

image.png

## 🚀 Features

| Feature | Details |
|---------|---------|
| **Strapi v5 Backend** | Headless CMS with REST + GraphQL APIs |
| **Next.js 14 Frontend** | App Router, SSR, ISR, static generation |
| **PostgreSQL** | Primary database with connection pooling |
| **Redis Caching** | API response caching, rate limiting store |
| **JWT Auth** | Register, login, forgot password, email verify |
| **RBAC** | Admin, Moderator, Author, Public roles |
| **Blog CMS** | Draft/publish, slugs, SEO meta, OpenGraph |
| **Comment System** | Nested comments, moderation, spam detection |
| **Newsletter** | Subscribe, confirm, unsubscribe flows |
| **AI Generation** | OpenAI integration for content generation |
| **Trending Engine** | Score-based trending with decay algorithm |
| **Search API** | Full-text search across blogs |
| **Related Posts** | Category + tag based recommendations |
| **Image Upload** | Cloudinary (prod) / local (dev) |
| **Docker** | Dev + prod compose files, multi-stage builds |
| **CI/CD** | GitHub Actions — lint, test, build, deploy |
| **Nginx** | Reverse proxy, SSL, gzip, rate limiting |

---

## 📁 Project Structure

```
ai-blog-cms/
├── backend/                    # Strapi v5
│   ├── config/
│   │   ├── database.js         # PostgreSQL config
│   │   ├── server.js           # Host/port/admin
│   │   ├── middlewares.js      # Middleware stack
│   │   └── plugins.js          # GraphQL, email, upload
│   └── src/
│       ├── api/
│       │   ├── blog/           # Blog CRUD + custom endpoints
│       │   ├── category/       # Categories
│       │   ├── tag/            # Tags
│       │   ├── comment/        # Comments + moderation
│       │   └── newsletter/     # Newsletter subscription
│       ├── middlewares/
│       │   ├── rate-limit.js   # Redis-backed rate limiting
│       │   ├── redis-cache.js  # Response caching
│       │   └── audit-log.js    # Write operation logging
│       ├── policies/
│       │   ├── is-owner.js     # Resource ownership check
│       │   ├── is-admin.js     # Role-based access
│       │   └── is-authenticated.js
│       ├── extensions/
│       │   └── users-permissions/  # Custom auth + lifecycle hooks
│       └── index.js            # Cron jobs, health endpoint
│
├── frontend/                   # Next.js 14
│   └── src/
│       ├── app/
│       │   ├── page.tsx                    # Home (ISR)
│       │   ├── blog/page.tsx               # Blog list
│       │   ├── blog/[slug]/page.tsx        # Blog detail (SSG + ISR)
│       │   ├── (auth)/login/page.tsx
│       │   ├── (auth)/register/page.tsx
│       │   └── (dashboard)/dashboard/page.tsx
│       ├── components/
│       │   ├── blog/           # BlogCard, BlogList, RelatedPosts
│       │   ├── comment/        # CommentSection (nested)
│       │   └── layout/         # Header, Footer
│       ├── hooks/
│       │   ├── useAuth.ts      # Authentication hook
│       │   └── useBlogs.ts     # Blog data hooks
│       ├── lib/
│       │   ├── strapi.ts       # Axios API client
│       │   └── utils.ts        # Utilities
│       ├── store/
│       │   └── auth.store.ts   # Zustand auth store
│       └── types/index.ts      # TypeScript interfaces
│
├── nginx/nginx.conf            # Reverse proxy config
├── docker-compose.yml          # Development stack
├── docker-compose.prod.yml     # Production stack
└── .github/workflows/ci-cd.yml # GitHub Actions pipeline
```

---

## ⚡ Quick Start (Docker — recommended)

### Prerequisites
- Docker Desktop 4.x+
- Docker Compose v2+

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/ai-blog-cms.git
cd ai-blog-cms

# 2. Copy environment files
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Edit backend/.env — set your secrets
nano backend/.env

# 4. Start all services
docker compose up -d

# 5. Open the apps
# Strapi Admin:  http://localhost:1337/admin
# Next.js:       http://localhost:3000
# PgAdmin:       http://localhost:5050
# GraphQL:       http://localhost:1337/graphql
```

---

## 🛠 Local Development (without Docker)

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL/Redis credentials
npm run develop
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with NEXT_PUBLIC_STRAPI_URL
npm run dev
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_CLIENT` | DB driver | `postgres` |
| `DATABASE_HOST` | DB host | `localhost` |
| `DATABASE_NAME` | DB name | `aiblog` |
| `DATABASE_USERNAME` | DB user | `aiblog` |
| `DATABASE_PASSWORD` | DB password | `secret` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PASSWORD` | Redis password | `secret` |
| `JWT_SECRET` | 32+ char secret | `your_secret` |
| `OPENAI_API_KEY` | OpenAI key | `sk-...` |
| `CLOUDINARY_NAME` | Cloudinary cloud | `mycloud` |
| `SMTP_HOST` | Email host | `smtp.gmail.com` |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_STRAPI_URL` | Strapi base URL |
| `NEXT_PUBLIC_STRAPI_API_TOKEN` | Strapi API token |
| `NEXT_PUBLIC_SITE_URL` | Your frontend URL |
| `REVALIDATE_SECRET` | ISR revalidation token |

---

## 📡 API Reference

### REST Endpoints

#### Blogs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/blogs` | List blogs (paginated, filterable) |
| `GET` | `/api/blogs/slug/:slug` | Get blog by slug |
| `GET` | `/api/blogs/trending` | Get trending blogs |
| `GET` | `/api/blogs/search?q=...` | Full-text search |
| `GET` | `/api/blogs/:id/related` | Get related posts |
| `POST` | `/api/blogs` | Create blog (auth required) |
| `PUT` | `/api/blogs/:id` | Update blog (owner only) |
| `DELETE` | `/api/blogs/:id` | Delete blog (owner only) |
| `POST` | `/api/blogs/generate` | AI-generate content |

#### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | List all categories with blog count |
| `GET` | `/api/categories/slug/:slug` | Category + paginated blogs |

#### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/comments/blog/:blogId` | Get approved comments |
| `POST` | `/api/comments` | Post comment (auth required) |
| `POST` | `/api/comments/:id/like` | Like a comment |
| `PATCH` | `/api/comments/:id/moderate` | Moderate (admin only) |

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/local` | Login |
| `POST` | `/api/auth/local/register` | Register |
| `POST` | `/api/auth/forgot-password` | Forgot password |
| `POST` | `/api/auth/reset-password` | Reset password |
| `GET` | `/api/users/me` | Get current user |

#### Newsletter
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/newsletters/subscribe` | Subscribe |
| `GET` | `/api/newsletters/confirm?token=` | Confirm email |
| `GET` | `/api/newsletters/unsubscribe?email=` | Unsubscribe |

### GraphQL
```
http://localhost:1337/graphql
```
Sample query:
```graphql
query GetBlogs($page: Int, $pageSize: Int) {
  blogs(
    pagination: { page: $page, pageSize: $pageSize }
    sort: "publishedDate:desc"
    filters: { publishedAt: { notNull: true } }
  ) {
    data {
      id
      attributes {
        title
        slug
        excerpt
        publishedDate
        viewCount
        featuredImage { data { attributes { url } } }
        author { data { attributes { username firstName lastName } } }
        category { data { attributes { name slug } } }
      }
    }
    meta { pagination { total pageCount } }
  }
}
```

---

## 🚀 Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full production guide.

Quick summary:
```bash
# 1. Set production secrets in .env files
# 2. Build and start production stack
docker compose -f docker-compose.prod.yml up -d

# 3. Set up SSL (Let's Encrypt)
certbot certonly --webroot -w /var/www/certbot -d yourdomain.com
```

---

## 🏗️ Architecture

```
                    ┌─────────────────┐
                    │   Nginx (443)   │  SSL termination, rate limiting
                    └────────┬────────┘
                  ┌──────────┴──────────┐
          ┌───────▼──────┐      ┌───────▼───────┐
          │  Next.js:3000│      │ Strapi:1337   │
          │  (SSR/ISR)   │      │ (REST/GraphQL)│
          └──────────────┘      └───────┬───────┘
                                ┌───────┴───────┐
                          ┌─────▼─────┐   ┌─────▼─────┐
                          │PostgreSQL │   │   Redis   │
                          │ (primary) │   │ (cache)   │
                          └───────────┘   └───────────┘
```

---

## 🔐 RBAC Roles

| Role | Permissions |
|------|-------------|
| **Public** | Read published blogs, categories, tags, comments |
| **Authenticated** | + Create comments, like, subscribe |
| **Author** | + Create/edit/delete own blogs |
| **Moderator** | + Moderate comments, manage categories/tags |
| **Administrator** | Full access to everything + admin panel |

---

## 📊 Performance Features

- **ISR (Incremental Static Regeneration)** — blog pages cached and revalidated every 5 mins
- **Redis caching** — API responses cached (5min default, configurable per route)
- **CDN-friendly** — all static assets have immutable cache headers
- **Image optimisation** — Next.js `<Image>` with AVIF/WebP, Cloudinary CDN
- **Connection pooling** — PostgreSQL pool (min 2, max 10)
- **Query optimisation** — selective `populate` on every Strapi query
- **Gzip compression** — enabled in both Nginx and Next.js

---

## 🤖 AI Content Generation

```bash
# POST /api/blogs/generate
curl -X POST http://localhost:1337/api/blogs/generate \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "topic":    "Strapi v5 Production Setup Guide",
    "tone":     "professional",
    "length":   "long",
    "keywords": ["strapi tutorial", "headless cms", "nodejs"]
  }'
```

Returns: `{ title, excerpt, content (markdown), tags, seoMeta }`

---

## 📄 License

MIT © 2024 AI Blog CMS — Open source and free to use.

---

## 🌟 Keywords (SEO)

`Strapi tutorial` · `Strapi CMS example` · `Strapi production setup` · `Strapi with Next.js` · `Strapi Docker setup` · `Strapi authentication` · `Strapi PostgreSQL guide` · `Build CMS with Strapi` · `Strapi REST API example` · `Strapi GraphQL tutorial`
