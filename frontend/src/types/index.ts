// ============================================================
//  Shared TypeScript types for AI Blog CMS
// ============================================================

// --- Strapi response wrappers --------------------------------

export interface StrapiMeta {
  pagination?: {
    page:      number;
    pageSize:  number;
    pageCount: number;
    total:     number;
  };
}

export interface StrapiResponse<T> {
  data: T;
  meta: StrapiMeta;
}

export interface StrapiImage {
  id:               number;
  url:              string;
  alternativeText?: string;
  width?:           number;
  height?:          number;
  formats?: {
    thumbnail?: { url: string };
    small?:     { url: string };
    medium?:    { url: string };
    large?:     { url: string };
  };
}

// --- SEO / OpenGraph ----------------------------------------

export interface SeoMeta {
  metaTitle:       string;
  metaDescription: string;
  keywords?:       string;
  canonicalURL?:   string;
  noIndex?:        boolean;
}

export interface OpenGraph {
  ogTitle?:       string;
  ogDescription?: string;
  ogImage?:       StrapiImage;
  ogType?:        string;
}

// --- User ---------------------------------------------------

export interface User {
  id:             number;
  username:       string;
  email:          string;
  firstName?:     string;
  lastName?:      string;
  bio?:           string;
  avatar?:        StrapiImage;
  role?:          { type: string; name: string };
  confirmed:      boolean;
  blocked:        boolean;
  createdAt:      string;
}

export interface AuthState {
  user:  User | null;
  token: string | null;
}

// --- Category -----------------------------------------------

export interface Category {
  id:          number;
  name:        string;
  slug:        string;
  description?: string;
  color?:      string;
  icon?:       string;
  image?:      StrapiImage;
  blogCount?:  number;
  seoMeta?:    SeoMeta;
}

// --- Tag ----------------------------------------------------

export interface Tag {
  id:    number;
  name:  string;
  slug:  string;
  color?: string;
}

// --- Blog ---------------------------------------------------

export type BlogStatus = 'draft' | 'published' | 'archived';
export type Priority   = 'low' | 'medium' | 'high';

export interface Blog {
  id:             number;
  title:          string;
  slug:           string;
  excerpt:        string;
  content:        string;
  status:         BlogStatus;
  readingTime?:   number;
  viewCount:      number;
  likeCount:      number;
  isFeatured:     boolean;
  isTrending:     boolean;
  aiGenerated:    boolean;
  publishedDate?: string;
  createdAt:      string;
  updatedAt:      string;
  publishedAt?:   string;
  featuredImage?: StrapiImage;
  author?:        Pick<User, 'id' | 'username' | 'firstName' | 'lastName'>;
  category?:      Pick<Category, 'id' | 'name' | 'slug' | 'color'>;
  tags?:          Pick<Tag, 'id' | 'name' | 'slug' | 'color'>[];
  comments?:      Comment[];
  relatedPosts?:  Pick<Blog, 'id' | 'title' | 'slug' | 'excerpt' | 'featuredImage'>[];
  seoMeta?:       SeoMeta;
  openGraph?:     OpenGraph;
}

// --- Comment ------------------------------------------------

export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface Comment {
  id:             number;
  content:        string;
  status:         CommentStatus;
  likeCount:      number;
  isEdited:       boolean;
  createdAt:      string;
  author?:        Pick<User, 'id' | 'username' | 'firstName' | 'lastName'>;
  replies?:       Comment[];
}

// --- Newsletter ---------------------------------------------

export interface NewsletterSubscriber {
  email:      string;
  firstName?: string;
  source?:    string;
}

// --- Dashboard analytics ------------------------------------

export interface DashboardStats {
  totalBlogs:      number;
  publishedBlogs:  number;
  draftBlogs:      number;
  totalUsers:      number;
  totalComments:   number;
  pendingComments: number;
  totalViews:      number;
  totalSubscribers: number;
}

// --- API filters --------------------------------------------

export interface BlogFilters {
  category?:  string;
  tag?:       string;
  status?:    BlogStatus;
  featured?:  boolean;
  page?:      number;
  pageSize?:  number;
  sort?:      string;
  q?:         string;
}
