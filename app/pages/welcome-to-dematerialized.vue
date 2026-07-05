<script setup lang="ts">
useHead({
  title: 'Welcome to Dematerialized',
  meta: [
    { property: 'og:title', content: 'Welcome to Dematerialized' },
    { name: 'twitter:title', content: 'Welcome to Dematerialized' },
    { name: 'robots', content: 'noindex' },
  ],
  bodyAttrs: {
    class: 'body-pink',
  },
})
</script>

<template>
  <div class="w-layout-blockcontainer container-1300 w-container">
    <div class="div-container-success">
      <div class="div-content-wrapper-success">
        <div class="div-content-block">
          <div class="div-logo-payment-wrapper"><img src="/images/Demat_logo_4000x4000_black-background.png" loading="lazy" width="93" sizes="93px" alt="" srcset="/images/Demat_logo_4000x4000_black-background-p-500.png 500w, /images/Demat_logo_4000x4000_black-background-p-800.png 800w, /images/Demat_logo_4000x4000_black-background-p-1080.png 1080w, /images/Demat_logo_4000x4000_black-background-p-1600.png 1600w, /images/Demat_logo_4000x4000_black-background-p-2000.png 2000w, /images/Demat_logo_4000x4000_black-background-p-2600.png 2600w, /images/Demat_logo_4000x4000_black-background-p-3200.png 3200w, /images/Demat_logo_4000x4000_black-background.png 4000w" class="image-17"></div>
          <div class="intro-text-payment">Welcome to Dematerialized!</div>
          <div class="payment-heading">your membership is now active</div>
          <a href="/clothing" class="button-main w-button">Start shopping</a>
          <a href="/profile" class="link-success">View Your Profile</a>
        </div>
      </div>
    </div>
  </div>
</template>
