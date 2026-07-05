<script setup lang="ts">
useHead({
  title: 'also this',
  meta: [
    {
      name: 'description',
      content:
        "A space where we talk about a lot of things, from what's trending and should you actually care to living in cultural bubbles and the occasional off-topic blah blah. Readers welcome.",
    },
    { property: 'og:title', content: 'also this' },
    {
      property: 'og:description',
      content:
        "A space where we talk about a lot of things, from what's trending and should you actually care to living in cultural bubbles and the occasional off-topic blah blah. Readers welcome.",
    },
    { name: 'twitter:title', content: 'also this' },
    {
      name: 'twitter:description',
      content:
        "A space where we talk about a lot of things, from what's trending and should you actually care to living in cultural bubbles and the occasional off-topic blah blah. Readers welcome.",
    },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
})

interface BlogPost {
  href: string
  image: string
  date: string
  title: string
  summary: string
}

// Content from the blog API when available (Phase 6), else the bundled scrape of the
// live Webflow CMS (app/data/blog.json) — useBlogPosts handles the silent fallback.
// NL falls back to EN per post, exactly as the live /nl/also-this does.
const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const { fetchBlogList } = useBlogPosts()
const { data: blogList } = await useAsyncData(
  'blog-list',
  () => fetchBlogList(isNL.value ? 'nl' : 'en'),
  { watch: [locale] },
)

const posts = computed<BlogPost[]>(() =>
  (blogList.value || []).map((p) => ({
    href: `${isNL.value ? '/nl' : ''}/blog/${p.slug}`,
    image: p.thumbnail || '',
    date: p.date || '',
    title: p.title || '',
    summary: p.summary || '',
  }))
)

// Footer newsletter form — old action was Webflow's form handler.
const newsletterSuccess = ref(false)
const newsletterError = ref(false)

async function onNewsletterSubmit(e: Event) {
  const form = e.target as HTMLFormElement
  const email = (form.querySelector('input[type="email"]') as HTMLInputElement)?.value?.trim()
  if (!email) return
  newsletterError.value = false
  try {
    const apiBase = useRuntimeConfig().public.apiBase
    const response = await fetch(`${apiBase}/mailing-list/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'website' }),
    })
    if (!response.ok && response.status !== 409) throw new Error(`HTTP ${response.status}`)
    newsletterSuccess.value = true
  } catch (error) {
    console.error('Newsletter subscribe error:', error)
    newsletterError.value = true
  }
}
</script>

<template>
  <div>
    <div class="w-layout-blockcontainer container-top-padding w-container">
      <div class="div-header-also-this"><img src="/images/also-this-text-website.png" loading="lazy" width="220" alt="" class="image-32"></div>
      <div class="div-wrapper-blogs">
        <div class="w-dyn-list">
          <div v-if="posts.length" role="list" class="collection-list-7 w-dyn-items">
            <div v-for="post in posts" :key="post.href" role="listitem" class="collection-item-8 w-dyn-item">
              <a :href="post.href" class="div-post-wrapper w-inline-block">
                <div class="div-thumb-wrapper"><img :src="post.image" loading="lazy" width="Auto" alt="" class="image-thumb"></div>
                <div class="blog-date">{{ post.date }}</div>
                <div class="blog-title">{{ post.title }}</div>
                <div class="blog-summary">{{ post.summary }}</div>
              </a>
            </div>
          </div>
          <div v-else class="w-dyn-empty">
            <div>No items found.</div>
          </div>
        </div>
      </div>
    </div>
    <div class="div-note-blog">
      <div class="w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#04314d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hard-hat-icon lucide-hard-hat">
          <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"></path>
          <path d="M14 6a6 6 0 0 1 6 6v3"></path>
          <path d="M4 15v-3a6 6 0 0 1 6-6"></path>
          <rect x="2" y="15" width="20" height="4" rx="1"></rect>
        </svg></div>
      <div class="note-blog">next masterpiece currently under construction, stay tuned! </div>
      <div class="note-blog subtext">Want to know when we publish our next article? Sign up for the occasional email.</div>
      <a href="/mailing-list" class="button-main top-margin centered dark-blue w-button">subscribe</a>
    </div>
    <div class="mobile-footer-spacer"></div>
    <div class="div-footer-desktop">
      <div class="footer-separator"></div>
      <div class="div-footer-content-wrapper vertical">
        <div class="div-footer-content-wrapper">
          <div class="div-footer-logo-wrapper"><img src="/images/Demat_logo_4000x4000_black-background.webp" loading="lazy" sizes="100vw" srcset="/images/Demat_logo_4000x4000_black-background-p-500.webp 500w, /images/Demat_logo_4000x4000_black-background-p-800.webp 800w, /images/Demat_logo_4000x4000_black-background-p-1080.webp 1080w, /images/Demat_logo_4000x4000_black-background-p-1600.webp 1600w, /images/Demat_logo_4000x4000_black-background-p-2000.webp 2000w, /images/Demat_logo_4000x4000_black-background-p-2600.webp 2600w, /images/Demat_logo_4000x4000_black-background-p-3200.webp 3200w, /images/Demat_logo_4000x4000_black-background.webp 4000w" alt="" class="footer-logo-image"></div>
          <div class="footer-section">
            <div class="footer-heading">Customer Care</div>
            <a href="/mailing-list" class="footer-link">My account </a>
            <a href="/memberships" class="footer-link">Memberships</a>
            <a href="/how-it-works" class="footer-link">how it works</a>
          </div>
          <div class="footer-section">
            <div class="footer-heading">company</div>
            <a href="/about-us" class="footer-link">about us</a>
            <a href="/terms-and-conditions" class="footer-link">Legal &amp; Privacy</a>
          </div>
          <div class="footer-section">
            <div class="footer-heading">support</div>
            <a href="/faq" class="footer-link">FAQ</a>
            <a href="/return-policy" class="footer-link">return policy</a>
            <a href="/cancellation-policy" class="footer-link">Cancellation policy</a>
            <a href="/contact-us" class="footer-link">contact us</a>
          </div>
          <div class="div-footer-newsletter">
            <div class="w-form">
              <form v-show="!newsletterSuccess" id="wf-form-Mailing-List-Form" name="wf-form-Mailing-List-Form" data-name="Mailing List Form" method="get" @submit.prevent="onNewsletterSubmit"><label for="email" class="footer-heading">Subscribe To Our Mailing List</label>
                <div class="div-newsletter-email-wrapper"><input class="form-text w-input" maxlength="256" name="email" data-name="Email" placeholder="Your email address" type="email" id="email" required><input type="submit" data-wait="..." class="newsletter-button w-button" value="&gt;"></div><label class="w-checkbox checkbox-form-policies"><input type="checkbox" name="Consent" id="Consent" data-name="Consent" required class="w-checkbox-input checbox-policies footer"><span class="checkbox-text-policies w-form-label" for="Consent">I have read and understand the <a href="/terms-and-conditions" class="policy-text-small black">Terms &amp; Conditions</a> and <a href="/privacy-policy" class="policy-text-small black">Privacy Policy</a>.</span></label>
              </form>
              <div class="success-message-2 w-form-done" :style="newsletterSuccess ? { display: 'block' } : undefined">
                <div class="form-success">Thanks for subscribing!</div>
              </div>
              <div class="error-message-2 w-form-fail" :style="newsletterError ? { display: 'block' } : undefined">
                <div class="text-block-4">Oops! Something went wrong. Please try again.</div>
              </div>
            </div>
          </div>
        </div>
        <div class="div-footer-copyright">
          <div class="copyright-text">Dematerialized 2025 | All Rights Reserved | KVK 95760717</div>
        </div>
      </div>
    </div>
  </div>
</template>
