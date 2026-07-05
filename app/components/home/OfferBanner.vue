<script setup lang="ts">
const isBannerVisible = ref(true)
</script>

<template>
  <div class="w-layout-blockcontainer container-top-padding w-container">
    <div v-if="isBannerVisible" class="div-offer-banner">
      <div class="div-offer-banner-container">
        <div class="div-spacer-banner"></div>
        <div class="banner-text"><span class="lang-en">Get 50% off your first month with code: SHOPDEMAT.  </span><span class="lang-nl">Krijg 50% korting op je eerste maand met code: SHOPDEMAT.  </span><a href="/terms-and-conditions"><span class="lang-en">Terms apply.</span><span class="lang-nl">Voorwaarden zijn van toepassing.</span></a>
        </div>
        <div class="banner-close" @click="isBannerVisible = false">x</div>
      </div>
    </div>
  </div>
</template>
