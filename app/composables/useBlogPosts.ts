// Blog data source — prefers the backend blog API (Phase 6, demat-backend PR #46:
// GET /blogs?locale=en|nl and GET /blogs/{slug}?locale=en|nl) and silently falls
// back to the bundled scrape (~/data/blog.json) when the API is unreachable or the
// routes don't exist yet (pre-merge). Both paths return the API's response shape,
// so callers are agnostic about where the data came from.

import blogData from '~/data/blog.json'

export interface BlogAuthor {
  name: string
  tagline: string | null
  picture: string
}

export interface BlogListItem {
  slug: string
  title: string
  summary: string
  date: string
  thumbnail: string
  locale: string
}

export interface BlogPostDetail extends BlogListItem {
  subtitle: string
  body: string
  main_image: string
  authors: BlogAuthor[]
}

type BlogLocale = 'en' | 'nl'

interface RawVariant {
  date?: string | null
  title?: string | null
  summary?: string | null
  subtitle?: string | null
  hero?: string | null
  bodyHtml?: string | null
  thumb?: string | null
  authors?: Array<{ name?: string | null; tagline?: string | null; image?: string | null }> | null
}

interface RawPost {
  slug: string
  en: RawVariant
  nl?: RawVariant | null
}

const rawPosts = (blogData as unknown as { posts: RawPost[] }).posts

const API_TIMEOUT_MS = 5000

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// The API stores dates as ISO (2026-07-01); the site renders "01 July 2026"
// (the format blog.json carries verbatim from the live Webflow CMS).
// Non-ISO strings pass through untouched so the fallback path is a no-op.
function toDisplayDate(date: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || '')
  if (!m) return date || ''
  return `${m[3]} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`
}

function pickVariant(post: RawPost, locale: BlogLocale): { v: RawVariant; locale: BlogLocale } {
  // NL variant when it exists, else EN — matching the live site (and the API's EN fallback).
  if (locale === 'nl' && post.nl) return { v: post.nl, locale: 'nl' }
  return { v: post.en, locale: 'en' }
}

function localListItem(post: RawPost, locale: BlogLocale): BlogListItem {
  const { v, locale: usedLocale } = pickVariant(post, locale)
  return {
    slug: post.slug,
    title: v.title || '',
    summary: v.summary || '',
    date: v.date || '',
    thumbnail: v.thumb || '',
    locale: usedLocale,
  }
}

function localPostDetail(post: RawPost, locale: BlogLocale): BlogPostDetail {
  const { v, locale: usedLocale } = pickVariant(post, locale)
  return {
    ...localListItem(post, locale),
    locale: usedLocale,
    subtitle: v.subtitle || '',
    body: v.bodyHtml || '',
    main_image: v.hero || '',
    authors: (v.authors || []).map((a) => ({
      name: a.name || '',
      tagline: a.tagline ?? null,
      picture: a.image || '',
    })),
  }
}

export function useBlogPosts() {
  // Captured synchronously in setup so the fetchers stay context-safe after awaits.
  const apiBase = useRuntimeConfig().public.apiBase

  async function apiFetch<T>(path: string): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
    try {
      return await $fetch<T>(`${apiBase}${path}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }
  }

  async function fetchBlogList(locale: BlogLocale): Promise<BlogListItem[]> {
    try {
      const items = await apiFetch<BlogListItem[]>(`/blogs?locale=${locale}`)
      if (!Array.isArray(items) || items.length === 0) throw new Error('empty blog list')
      return items.map((p) => ({ ...p, date: toDisplayDate(p.date) }))
    } catch {
      console.info('[Blog] API unavailable, using bundled content')
      return rawPosts.map((post) => localListItem(post, locale))
    }
  }

  // Resolves to null when neither the API nor the bundled JSON knows the slug.
  async function fetchBlogPost(slug: string, locale: BlogLocale): Promise<BlogPostDetail | null> {
    try {
      const post = await apiFetch<BlogPostDetail>(`/blogs/${encodeURIComponent(slug)}?locale=${locale}`)
      if (!post || !post.slug) throw new Error('empty blog post')
      return { ...post, date: toDisplayDate(post.date), authors: post.authors || [] }
    } catch {
      // Any failure — network, timeout, missing route, unknown slug — falls through
      // to the bundled JSON; a slug unknown to both is a genuine 404 (null).
      console.info('[Blog] API unavailable, using bundled content')
      const post = rawPosts.find((p) => p.slug === slug)
      return post ? localPostDetail(post, locale) : null
    }
  }

  return { fetchBlogList, fetchBlogPost }
}
