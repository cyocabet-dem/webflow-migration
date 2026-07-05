<script setup lang="ts">
// Mirrors old/…/404.html (utility-page-wrap, 404 image, heading, home link); noindex as on Webflow.
defineProps<{ error: { statusCode: number } }>()

useHead({
  title: 'Not Found',
  meta: [
    { name: 'robots', content: 'noindex' },
    { property: 'og:title', content: 'Not Found' },
    { name: 'twitter:title', content: 'Not Found' },
  ],
})
</script>

<template>
  <div class="utility-page-wrap">
    <div class="utility-page-content">
      <img src="/images/404.png" alt="" class="image-30" />
      <h2 class="heading-2">Whoops, the page you're looking for doesn't exist</h2>
      <NuxtLink to="/" class="link-404">take me back to the homepage</NuxtLink>
    </div>
  </div>
</template>
