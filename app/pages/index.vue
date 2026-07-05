<script setup lang="ts">
// Phase 3 ports the full home page from old/…/index.html (batch A audit block in
// ../migration-map.md Appendix A). SEO below is already the verbatim capture.
useHead({
  title: 'Dematerialized | Clothing Rentals For Everyday Life',
  meta: [
    {
      name: 'description',
      content:
        'Buying is overrated. Rent from over 300 brands and look good any day of the week—no special occasion required. New arrivals every week. Based in Den Bosch.',
    },
    { property: 'og:title', content: 'Dematerialized | Clothing Rentals For Everyday Life' },
    {
      property: 'og:description',
      content:
        'Buying is overrated. Rent from over 300 brands and look good any day of the week—no special occasion required. New arrivals every week. Based in Den Bosch.',
    },
    {
      property: 'og:image',
      content:
        'https://dematerialized.nl/images/meta/home-meta-image.png',
    },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:title', content: 'Dematerialized | Clothing Rentals For Everyday Life' },
    {
      name: 'twitter:description',
      content:
        'Buying is overrated. Rent from over 300 brands and look good any day of the week—no special occasion required. New arrivals every week. Based in Den Bosch.',
    },
    {
      name: 'twitter:image',
      content:
        'https://dematerialized.nl/images/meta/home-meta-image.png',
    },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
})
</script>

<template>
  <div>
    <HomeOfferBanner />
    <HomeHero />
    <HomeUspSection />
    <HomeClothingCarousel />
    <HomeDoubleImageSection />
    <HomeMembershipSection />
    <HomeServicesSection />
    <HomeMailBanner />
    <div class="mobile-footer-spacer"></div>
  </div>
</template>
