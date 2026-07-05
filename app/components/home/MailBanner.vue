<script setup lang="ts">
const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const email = ref('')
const submitting = ref(false)
const isSuccess = ref(false)
const errorMsg = ref('')

async function onSubmit() {
  const value = email.value.trim()
  if (!value) return
  errorMsg.value = ''
  submitting.value = true
  try {
    const apiBase = useRuntimeConfig().public.apiBase
    const response = await fetch(apiBase + '/mailing-list/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: value })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (response.status === 409 || (data.message && data.message.toLowerCase().includes('already'))) {
        throw new Error(isNL.value ? 'dit e-mailadres is al aangemeld!' : 'this email is already subscribed!')
      }
      throw new Error(
        data.message ||
          data.detail ||
          (isNL.value ? 'er ging iets mis. probeer het opnieuw.' : 'something went wrong. please try again.')
      )
    }
    isSuccess.value = true
  } catch (error: unknown) {
    console.error('Mailing list error:', error)
    errorMsg.value = error instanceof Error ? error.message : String(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="code-embed-40 w-embed w-script">
    <div class="demat-mail-banner-wrap">
      <section class="demat-mail-banner">
        <div class="demat-mail-sticker demat-mail-sticker-1">
          <img src="/images/cat-heart-sunglasses.png" alt="">
        </div>
        <div class="demat-mail-sticker demat-mail-sticker-2">
          <img src="/images/ski-sweater.png" alt="">
        </div>
        <div class="demat-mail-sticker demat-mail-sticker-3">
          <img src="/images/pizza-box_clouds.png" alt="">
        </div>
        <div class="demat-mail-banner-inner">
          <div class="demat-mail-left">
            <div class="demat-mail-icon">
              <svg viewBox="0 0 36 36">
                <rect x="3" y="8" width="30" height="20" rx="3"></rect>
                <polyline points="3,8 18,21 33,8"></polyline>
              </svg>
            </div>
            <div class="demat-mail-text">
              <h3><span class="lang-en">we promise not to be annoying</span><span class="lang-nl">we beloven niet vervelend te zijn</span></h3>
              <p><span class="lang-en">get updates on new pieces, special offers, and other cool things that we're doing</span><span class="lang-nl">ontvang updates over nieuwe stukken, speciale aanbiedingen, en andere leuke dingen die we doen</span></p>
            </div>
          </div>
          <div class="demat-mail-right">
            <div class="demat-mail-form-wrap" id="dematMailFormWrap" :class="{ 'is-success': isSuccess }">
              <form class="demat-mail-form" id="dematMailForm" @submit.prevent="onSubmit">
                <input
                  type="email"
                  class="demat-mail-input"
                  id="dematMailEmail"
                  v-model="email"
                  :placeholder="isNL ? 'e-mailadres' : 'email address'"
                  required
                  autocomplete="email"
                  @input="errorMsg = ''"
                >
                <button type="submit" class="demat-mail-submit" id="dematMailSubmit" :disabled="submitting">
                  <template v-if="submitting">{{ isNL ? 'inschrijven...' : 'submitting...' }}</template>
                  <template v-else><span class="lang-en">submit</span><span class="lang-nl">inschrijven</span></template>
                </button>
              </form>
              <p class="demat-mail-terms">
                <span class="lang-en">by clicking submit, you agree to our <a href="/terms-and-conditions" target="_blank">terms of service</a> and <a href="/privacy-policy" target="_blank">privacy policy</a>.</span>
                <span class="lang-nl">door op inschrijven te klikken ga je akkoord met onze <a href="/terms-and-conditions" target="_blank">algemene voorwaarden</a> en <a href="/privacy-policy" target="_blank">privacybeleid</a>.</span>
              </p>
              <p class="demat-mail-error" id="dematMailError" :class="{ 'is-visible': errorMsg }">{{ errorMsg }}</p>
              <div class="demat-mail-success" id="dematMailSuccess">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                <span><span class="lang-en">you're subscribed! welcome aboard.</span><span class="lang-nl">je bent erbij!</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style>
  .demat-mail-banner-wrap {
    position: relative;
    font-family: 'Urbanist', sans-serif;
  }
  .demat-mail-banner {
    background: #b6e8ff;
    padding: 44px 2rem;
    overflow: hidden;
  }
  .demat-mail-banner-inner {
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 24px;
    position: relative;
    z-index: 2;
  }
  /* Icon + text */
  .demat-mail-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .demat-mail-icon {
    width: 52px;
    height: 52px;
    background: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .demat-mail-icon svg {
    width: 26px;
    height: 26px;
    stroke: #04314d;
    stroke-width: 1.8;
    fill: none;
  }
  .demat-mail-text h3 {
    font-size: 26px;
    font-weight: 700;
    color: #04314d;
    margin: 0 0 2px;
    margin-top: 1rem;
    letter-spacing: 0.3px;
  }
  .demat-mail-text p {
    font-size: 18px;
    color: #046a9e;
    margin: 0;
    margin-top: 1rem;
    line-height: 1.4;
  }
  /* Form */
  .demat-mail-right {
    width: 100%;
    min-width: 0;
  }
  .demat-mail-form {
    display: flex;
    gap: 10px;
    align-items: stretch;
    width: 100%;
  }
  .demat-mail-input {
    flex: 1 1 0%;
    min-width: 0;
    padding: 14px 18px;
    border: none;
    border-radius: 10px;
    font-family: 'Urbanist', sans-serif;
    font-size: 15px;
    color: #04314d;
    background: #ffffff;
    outline: none;
    width: 100%;
  }
  .demat-mail-input::placeholder {
    color: #7a9bb0;
  }
  .demat-mail-input:focus {
    box-shadow: 0 0 0 3px rgba(4, 49, 77, 0.15);
  }
  .demat-mail-submit {
    padding: 14px 28px;
    background: #04314d;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    font-family: 'Urbanist', sans-serif;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.3px;
    white-space: nowrap;
    transition: background 0.2s ease, transform 0.15s ease;
    flex-shrink: 0;
  }
  .demat-mail-submit:hover {
    background: #062a40;
    transform: translateY(-1px);
  }
  .demat-mail-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  .demat-mail-terms {
    margin-top: 8px;
    font-size: 12px;
    color: rgba(4, 49, 77, 0.45);
    text-align: left;
  }
  .demat-mail-terms a {
    color: rgba(4, 49, 77, 0.65);
    text-decoration: underline;
    transition: color 0.2s ease;
  }
  .demat-mail-terms a:hover {
    color: #04314d;
  }
  /* Stickers */
  .demat-mail-sticker {
    position: absolute;
    pointer-events: none;
    z-index: 1;
  }
  .demat-mail-sticker img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 3px 8px rgba(0,0,0,0.1));
  }
  /* Cat - top left, well clear of content */
  .demat-mail-sticker-1 {
    width: 110px;
    height: 110px;
    top: 50%;
    left: calc(50% - 420px);
    transform: translateY(-70%) rotate(-10deg);
  }
  /* Sweater - below cat, clustered with it */
  .demat-mail-sticker-2 {
    width: 110px;
    height: 110px;
    top: 50%;
    left: calc(50% - 390px);
    transform: translateY(-5%) rotate(6deg);
  }
  /* Pizza - right side */
  .demat-mail-sticker-3 {
    width: 130px;
    height: 130px;
    top: 50%;
    right: calc(50% - 420px);
    transform: translateY(-50%) rotate(8deg);
  }
  @media (max-width: 1100px) {
    .demat-mail-sticker-1 {
      width: 95px;
      height: 95px;
      left: calc(50% - 380px);
    }
    .demat-mail-sticker-2 {
      width: 95px;
      height: 95px;
      left: calc(50% - 350px);
    }
    .demat-mail-sticker-3 {
      width: 110px;
      height: 110px;
      right: calc(50% - 385px);
    }
  }
  @media (max-width: 900px) {
    .demat-mail-sticker-1 {
      width: 80px;
      height: 80px;
      left: calc(50% - 345px);
    }
    .demat-mail-sticker-2 {
      width: 80px;
      height: 80px;
      left: calc(50% - 320px);
    }
    .demat-mail-sticker-3 {
      width: 95px;
      height: 95px;
      right: calc(50% - 355px);
    }
  }
  /* Hide stickers below tablet */
  @media (max-width: 767px) {
    .demat-mail-sticker {
      display: none;
    }
  }
  /* Mobile form stacking */
  @media (max-width: 500px) {
    .demat-mail-banner {
      padding: 36px 1.5rem;
    }
    .demat-mail-form {
      flex-direction: column;
    }
    .demat-mail-submit {
      width: 100%;
    }
    .demat-mail-terms {
      text-align: center;
    }
  }
  /* Success */
  .demat-mail-success {
    display: none;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #04314d;
    font-size: 17px;
    font-weight: 600;
  }
  .demat-mail-success.is-visible {
    display: flex;
  }
  .demat-mail-success svg {
    width: 24px;
    height: 24px;
    stroke: #04314d;
    stroke-width: 2.5;
    fill: none;
    flex-shrink: 0;
  }
  /* Error */
  .demat-mail-error {
    display: none;
    margin-top: 8px;
    font-size: 16px;
    color: #c62828;
    font-weight: 500;
    text-align: left;
  }
  .demat-mail-error.is-visible {
    display: block;
  }
  .demat-mail-form-wrap.is-success .demat-mail-form,
  .demat-mail-form-wrap.is-success .demat-mail-terms,
  .demat-mail-form-wrap.is-success .demat-mail-error {
    display: none;
  }
  .demat-mail-form-wrap.is-success .demat-mail-success {
    display: flex;
  }
</style>
