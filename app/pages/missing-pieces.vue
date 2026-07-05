<script setup lang="ts">
useHead({
  title: 'missing pieces',
  meta: [
    { name: 'description', content: "Can't find what you're looking for in the shared closet? Tell us which specific pieces, styles, trends, or sizes are missing from our collective wardrobe. We want to hear from you!" },
    { property: 'og:title', content: 'missing pieces' },
    { property: 'og:description', content: "Can't find what you're looking for in the shared closet? Tell us which specific pieces, styles, trends, or sizes are missing from our collective wardrobe. We want to hear from you!" },
    { property: 'og:image', content: 'https://dematerialized.nl/images/meta/contact-us-meta.png' },
    { name: 'twitter:title', content: 'missing pieces' },
    { name: 'twitter:description', content: "Can't find what you're looking for in the shared closet? Tell us which specific pieces, styles, trends, or sizes are missing from our collective wardrobe. We want to hear from you!" },
    { name: 'twitter:image', content: 'https://dematerialized.nl/images/meta/contact-us-meta.png' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
})

const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const T = {
  phMessage: {
    en: "describe the pieces you'd like to see in the shared closet (you can include links!)",
    nl: 'Beschrijf de items die je graag zou willen zien in de gedeelde kledingkast (je kunt links toevoegen!)',
  },
  submit: { en: 'Submit', nl: 'Verzenden' },
} as const

const message = ref('')
const formSuccess = ref(false)
const formError = ref(false)

// TODO(wire): the Webflow export submitted this form to Webflow's own form
// handler — the replacement endpoint is an open question. Stub shows the
// success state; message.value holds the submitted text for future wiring.
function submitMissingPieces() {
  formError.value = false
  formSuccess.value = true
}
</script>

<template>
  <div>
    <div class="div-section-mailing-list">
      <div class="div-content-wrapper-ml">
        <div class="div-heading-contact-us missing-pieces">
          <div class="div-relative-for-sticker"><img src="/images/sticker-pinstripe-jacket.png" loading="lazy" width="53" sizes="53px" alt="" srcset="/images/sticker-pinstripe-jacket-p-500.png 500w, /images/sticker-pinstripe-jacket.png 800w" class="image-22 missing-pieces mobile">
            <div class="heading-centered contact missing-pieces"><span class="lang-en">wish we had that top?</span><span class="lang-nl">Hadden we die top maar...</span></div><img src="/images/sticker-pinstripe-jacket.png" loading="lazy" width="53" sizes="53px" alt="" srcset="/images/sticker-pinstripe-jacket-p-500.png 500w, /images/sticker-pinstripe-jacket.png 800w" class="image-22 missing-pieces">
          </div>
          <div class="paragraph-centered contact centered missing-pieces"><span class="lang-en">Our shared closet is constantly growing, mostly from donations, but we curate some pieces as well. So if you&#x27;re looking for something specific, let us know!</span><span class="lang-nl">Onze gedeelde kledingkast groeit constant, vooral door donaties, maar we kopen ook zelf een aantal stukken. Dus als je iets specifieks zoekt, laat het ons weten!</span></div>
        </div>
        <div class="div-contact-form new-style missing-pieces">
          <div class="heading-centered left-align"><span class="lang-en">tell us what you want</span><span class="lang-nl">Vertel ons wat je wilt</span></div>
          <div class="form-mailing-list contact missing-pieces w-form">
            <form v-show="!formSuccess" id="wf-form-Missing-Pieces" name="wf-form-Missing-Pieces" data-name="Missing Pieces" method="get" class="form missing-pieces" @submit.prevent="submitMissingPieces">
              <div class="div-form-wrapper contact missing-pieces"><textarea id="Message" v-model="message" required :placeholder="isNL ? T.phMessage.nl : T.phMessage.en" maxlength="5000" name="Message" data-name="Message" class="text-area-form contact missing-pieces w-input"></textarea><input type="submit" data-wait="..." class="button-form-submit left-align w-button" :value="isNL ? T.submit.nl : T.submit.en"></div>
            </form>
            <div class="success-message-3 missing-pieces w-form-done" :style="{ display: formSuccess ? 'block' : 'none' }">
              <div><span class="lang-en">Submission received. Thanks for letting us know!</span><span class="lang-nl">Bedankt voor je bericht! We nemen snel contact met je op.</span></div>
            </div>
            <div class="error-message-3 w-form-fail" :style="{ display: formError ? 'block' : 'none' }">
              <div class="text-block-5"><span class="lang-en">Oops! Something went wrong. Please try again.</span><span class="lang-nl">Oeps! Er is iets misgegaan. Probeer het nog eens.</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mobile-footer-spacer"></div>
  </div>
</template>
