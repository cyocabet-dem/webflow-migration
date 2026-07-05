<script setup lang="ts">
// Blog post detail — markup per the Webflow detail_blog.html template (hero-stack +
// authors testimonial cards). Content from the blog API when available (Phase 6),
// else the bundled live-site scrape (app/data/blog.json) via useBlogPosts.
const route = useRoute()
const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

// NL variant when it exists, else EN — the API and the JSON fallback both apply it.
const { fetchBlogPost } = useBlogPosts()
const { data: post } = await useAsyncData(
  `blog-post-${route.params.slug}`,
  () => fetchBlogPost(String(route.params.slug), isNL.value ? 'nl' : 'en'),
  { watch: [locale] },
)
if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

// Template-facing view model (same field names the template always used).
const v = computed(() => {
  const p = post.value
  return {
    title: p?.title || '',
    subtitle: p?.subtitle || '',
    summary: p?.summary || '',
    date: p?.date || '',
    hero: p?.main_image || '',
    bodyHtml: p?.body || '',
    authors: (p?.authors || []).map((a) => ({
      name: a.name,
      tagline: a.tagline,
      image: a.picture,
    })),
  }
})

useHead({
  title: computed(() => v.value.title || 'Dematerialized'),
  meta: [{ name: 'description', content: computed(() => v.value.summary || '') }],
})
</script>

<template>
  <div>
    <section class="hero-stack">
      <div class="container">
        <div class="hero-wrapper-two">
          <h1>{{ v.title }}</h1>
          <p class="margin-bottom-24px">{{ v.subtitle }}</p>
          <div class="div-wrapper-blog-date">
            <div class="blog-date-text">{{ v.date }}</div>
          </div>
          <img :src="v.hero" loading="lazy" width="Auto" height="Auto" alt="" class="hero-image shadow-two" />
          <div class="div-blog-body-wrapper">
            <div class="blog-post-body w-richtext" v-html="v.bodyHtml"></div>
          </div>
        </div>
      </div>
    </section>
    <section v-if="v.authors && v.authors.length" class="testimonial-slider-small">
      <div class="container">
        <h2 class="section-heading-blog">authors</h2>
        <div class="w-dyn-list">
          <div role="list" class="w-dyn-items w-row">
            <div v-for="author in v.authors" :key="author.name || ''" role="listitem" class="w-dyn-item w-col w-col-6">
              <div class="testimonial-card">
                <div class="testimonial-info">
                  <img :src="author.image" loading="lazy" alt="" class="testimonial-image" />
                  <div>
                    <h3 class="subheading-blog">{{ author.name }}</h3>
                    <div class="tagline">{{ author.tagline }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div class="mobile-footer-spacer"></div>
  </div>
</template>
