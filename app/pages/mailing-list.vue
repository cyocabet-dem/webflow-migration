<script setup lang="ts">
useHead({
  title: 'Join Our Mailing List | Dematerialized',
  meta: [
    {
      name: 'description',
      content:
        'Sign up for the Dematerialized mailing list to get notified about new arrivals, exclusive offers, and local events. From our shared closet—straight to your inbox.',
    },
    { property: 'og:title', content: 'Join Our Mailing List | Dematerialized' },
    {
      property: 'og:description',
      content:
        'Sign up for the Dematerialized mailing list to get notified about new arrivals, exclusive offers, and local events. From our shared closet—straight to your inbox.',
    },
    {
      property: 'og:image',
      content:
        'https://dematerialized.nl/images/meta/mailing-list-meta.png',
    },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:title', content: 'Join Our Mailing List | Dematerialized' },
    {
      name: 'twitter:description',
      content:
        'Sign up for the Dematerialized mailing list to get notified about new arrivals, exclusive offers, and local events. From our shared closet—straight to your inbox.',
    },
    {
      name: 'twitter:image',
      content:
        'https://dematerialized.nl/images/meta/mailing-list-meta.png',
    },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
})

const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const T = {
  subscribe: { en: 'Subscribe', nl: 'Inschrijven' },
  subscribing: { en: 'Subscribing...', nl: 'Inschrijven...' },
  firstNameReq: { en: 'Please enter your first name.', nl: 'Vul je voornaam in.' },
  lastNameReq: { en: 'Please enter your last name.', nl: 'Vul je achternaam in.' },
  emailReq: { en: 'Please enter your email address.', nl: 'Vul je e-mailadres in.' },
  emailInvalid: { en: 'Please enter a valid email address.', nl: 'Vul een geldig e-mailadres in.' },
  termsReq: {
    en: 'Please agree to the Terms & Conditions and Privacy Policy.',
    nl: 'Ga akkoord met de algemene voorwaarden en het privacybeleid.',
  },
  already: {
    en: 'This email is already subscribed to our mailing list.',
    nl: 'Dit e-mailadres is al ingeschreven voor onze mailinglijst.',
  },
  generic: { en: 'Something went wrong. Please try again.', nl: 'Er ging iets mis. Probeer het opnieuw.' },
  phFirstName: { en: 'First Name', nl: 'Voornaam' },
  phLastName: { en: 'Last Name', nl: 'Achternaam' },
} as const

function t(key: keyof typeof T): string {
  return isNL.value ? T[key].nl : T[key].en
}

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const termsAccepted = ref(false)

const errorMessage = ref('')
const isSubmitting = ref(false)
const subscribed = ref(false)

const fieldErrors = reactive({ firstName: false, lastName: false, email: false })

const firstNameInput = ref<HTMLInputElement | null>(null)
const lastNameInput = ref<HTMLInputElement | null>(null)
const emailInput = ref<HTMLInputElement | null>(null)

function showError(message: string) {
  errorMessage.value = message
}

function hideError() {
  errorMessage.value = ''
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function clearInputErrors() {
  fieldErrors.firstName = false
  fieldErrors.lastName = false
  fieldErrors.email = false
}

function validateForm(): boolean {
  hideError()
  clearInputErrors()

  if (!firstName.value.trim()) {
    fieldErrors.firstName = true
    showError(t('firstNameReq'))
    firstNameInput.value?.focus()
    return false
  }

  if (!lastName.value.trim()) {
    fieldErrors.lastName = true
    showError(t('lastNameReq'))
    lastNameInput.value?.focus()
    return false
  }

  if (!email.value.trim()) {
    fieldErrors.email = true
    showError(t('emailReq'))
    emailInput.value?.focus()
    return false
  }

  if (!isValidEmail(email.value.trim())) {
    fieldErrors.email = true
    showError(t('emailInvalid'))
    emailInput.value?.focus()
    return false
  }

  if (!termsAccepted.value) {
    showError(t('termsReq'))
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  hideError()

  const formData = {
    first_name: firstName.value.trim(),
    last_name: lastName.value.trim(),
    email: email.value.trim(),
  }

  await submitMailingListSubscription(formData)
}

async function submitMailingListSubscription(formData: {
  first_name: string
  last_name: string
  email: string
}) {
  try {
    const apiBase = useRuntimeConfig().public.apiBase
    const response = await fetch(`${apiBase}/mailing-list/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, source: 'website' }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (response.status === 409 || (data.message && String(data.message).toLowerCase().includes('already'))) {
        throw new Error(t('already'))
      }
      throw new Error(data.message || data.detail || t('generic'))
    }
    subscribed.value = true
  } catch (error: unknown) {
    console.error('Mailing list error:', error)
    showError(error instanceof Error ? error.message : t('generic'))
  } finally {
    isSubmitting.value = false
  }
}

function handleInputChange(field: 'firstName' | 'lastName' | 'email') {
  fieldErrors[field] = false
  hideError()
}
</script>

<template>
  <div>
    <div class="w-layout-blockcontainer container-top-padding w-container">
      <div class="w-embed">
        <section class="mailing-list-section">
          <div class="mailing-list-container">
            <div class="mailing-list-header">
              <h1 class="mailing-list-heading"><span class="lang-en">Stay In The Loop</span><span class="lang-nl">Blijf op de hoogte</span></h1>
              <p class="mailing-list-description"><span class="lang-en">Sign up for our mailing list to get notified and enjoy exclusive offers.</span><span class="lang-nl">Schrijf je in voor onze mailinglijst voor updates en exclusieve aanbiedingen.</span></p>
            </div>
            <div class="mailing-list-card-wrapper">
              <div class="mailing-sticker mailing-sticker-1">
                <img src="/images/cat-on-back_2.png" alt="">
              </div>
              <div class="mailing-sticker mailing-sticker-2">
                <img src="/images/pancakes.png" alt="">
              </div>
              <div class="mailing-list-card">
                <div class="form-error-message" :class="{ visible: errorMessage !== '' }" id="mailingError">{{ errorMessage }}</div>
                <form class="mailing-list-form" :class="{ hidden: subscribed }" id="mailingListForm" @submit.prevent="handleSubmit">
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label" for="firstName"><span class="lang-en">First Name</span><span class="lang-nl">Voornaam</span></label>
                      <input ref="firstNameInput" v-model="firstName" type="text" id="firstName" name="first_name" class="form-input" :class="{ error: fieldErrors.firstName }" :placeholder="isNL ? T.phFirstName.nl : T.phFirstName.en" required @input="handleInputChange('firstName')">
                    </div>
                    <div class="form-group">
                      <label class="form-label" for="lastName"><span class="lang-en">Last Name</span><span class="lang-nl">Achternaam</span></label>
                      <input ref="lastNameInput" v-model="lastName" type="text" id="lastName" name="last_name" class="form-input" :class="{ error: fieldErrors.lastName }" :placeholder="isNL ? T.phLastName.nl : T.phLastName.en" required @input="handleInputChange('lastName')">
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="emailAddress"><span class="lang-en">Email Address</span><span class="lang-nl">E-mailadres</span></label>
                    <input ref="emailInput" v-model="email" type="email" id="emailAddress" name="email" class="form-input" :class="{ error: fieldErrors.email }" placeholder="your@email.com" required @input="handleInputChange('email')">
                  </div>
                  <div class="checkbox-group">
                    <input v-model="termsAccepted" type="checkbox" id="termsCheckbox" name="terms" class="checkbox-input" required @change="hideError">
                    <label class="checkbox-label" for="termsCheckbox">
                      <span class="lang-en">I have read and understand the <a href="/terms-and-conditions" target="_blank">Terms &amp; Conditions</a> and <a href="/privacy-policy" target="_blank">Privacy Policy</a>.</span><span class="lang-nl">Ik heb de <a href="/terms-and-conditions" target="_blank">algemene voorwaarden</a> en het <a href="/privacy-policy" target="_blank">privacybeleid</a> gelezen en begrepen.</span>
                    </label>
                  </div>
                  <button type="submit" class="mailing-list-submit" id="mailingSubmit" :disabled="isSubmitting">
                    <template v-if="isSubmitting">{{ t('subscribing') }}</template>
                    <template v-else><span class="lang-en">Subscribe</span><span class="lang-nl">Inschrijven</span></template>
                  </button>
                </form>
                <div class="mailing-list-success" :class="{ visible: subscribed }" id="mailingSuccess">
                  <div class="success-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </div>
                  <h3 class="success-heading"><span class="lang-en">You're Subscribed!</span><span class="lang-nl">Je bent ingeschreven!</span></h3>
                  <p class="success-message"><span class="lang-en">Thanks for signing up. We'll keep you informed on new pieces added to the shared closet, special offers, and other cool things that we're doing.</span><span class="lang-nl">Bedankt voor je inschrijving. We houden je op de hoogte van nieuwe stukken in de gedeelde kast, speciale aanbiedingen, en andere leuke dingen die we doen.</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
    <div class="div-map-location">
      <div class="heading-centered"><span class="lang-en">In the area? Visit our showroom!</span><span class="lang-nl">Kom even langs (opent 6 december 2025)</span></div>
      <div class="paragraph-centered centered mailing-list">You can find our opening hours <a href="/contact-us">here</a>.<br>Check Instagram for special opening times (<a href="https://www.instagram.com/dematerialized_nl/">@dematerialized_nl</a>).</div>
      <div class="google-map-embed desktop w-embed w-iframe"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4947.023610002033!2d5.3028001761482315!3d51.687078597562!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c6eef6ed93e6f3%3A0x1dc7ecbfd2fb76e0!2sLange%20Putstraat%204%2C%205211%20KN%20&#39;s-Hertogenbosch!5e0!3m2!1sen!2snl!4v1760020354104!5m2!1sen!2snl" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
      <div class="google-map-embed mobile mailing-list w-embed w-iframe"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4947.023610002033!2d5.3028001761482315!3d51.687078597562!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c6eef6ed93e6f3%3A0x1dc7ecbfd2fb76e0!2sLange%20Putstraat%204%2C%205211%20KN%20&#39;s-Hertogenbosch!5e0!3m2!1sen!2snl!4v1760020354104!5m2!1sen!2snl" width="400" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
      <div class="google-map-embed mobile-small mailing-list w-embed w-iframe"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4947.023610002033!2d5.3028001761482315!3d51.687078597562!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c6eef6ed93e6f3%3A0x1dc7ecbfd2fb76e0!2sLange%20Putstraat%204%2C%205211%20KN%20&#39;s-Hertogenbosch!5e0!3m2!1sen!2snl!4v1760020354104!5m2!1sen!2snl" width="300" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
    </div>
    <div class="mobile-footer-spacer"></div>
  </div>
</template>

<style>
/* ============================================
   MAILING LIST PAGE STYLES
   Add to Page Head Code or Custom CSS
   ============================================ */
:root {
  --purple: #4b073f;
  --purple-dark: #a92296;
  --blue-light: #eff9ff;
  --gray-dark: #24282d;
  --gray-medium: #46535e;
  --gray-light: #ced5da;
  --gray-very-light: #f6f8f9;
  --pink: #e84dd8;
  --pink-light: #fff4fe;
  --white: #ffffff;
  --radius: 20px;
}
/* Section Container */
.mailing-list-section {
  padding: 80px 2rem;
  background: var(--gray-very-light);
  min-height: 60vh;
  text-transform: lowercase;
}
/* Preserve user input as-typed */
.form-input {
  text-transform: none;
}
.mailing-list-container {
  max-width: 600px;
  margin: 0 auto;
}
/* Header */
.mailing-list-header {
  text-align: center;
  margin-bottom: 40px;
}
.mailing-list-heading {
  font-size: clamp(2rem, 5vw, 2.75rem);
  font-weight: 600;
  color: var(--gray-dark);
  margin-bottom: 16px;
  letter-spacing: 0.5px;
}
.mailing-list-description {
  font-size: 16px;
  color: var(--gray-dark);
  line-height: 1.6;
  margin-bottom: 12px;
}
.mailing-list-highlight {
  font-size: 16px;
  color: var(--gray-dark);
  line-height: 1.6;
}
.mailing-list-highlight strong {
  color: var(--purple-dark);
  font-weight: 600;
}
/* Form Card Wrapper - for sticker positioning */
.mailing-list-card-wrapper {
  position: relative;
  overflow: visible;
}
/* Form Card */
.mailing-list-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 40px;
  position: relative;
  overflow: visible;
}
/* Sticker decorations */
.mailing-sticker {
  position: absolute;
  width: 120px;
  height: 120px;
  pointer-events: none;
  z-index: 10;
}
.mailing-sticker img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.mailing-sticker-1 {
  top: -50px;
  right: -40px;
}
.mailing-sticker-2 {
  bottom: -50px;
  left: -40px;
}
/* Form */
.mailing-list-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.mailing-list-form.hidden {
  display: none;
}
/* Input Row (for first/last name side by side) */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
/* Form Group */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-dark);
  letter-spacing: 0.3px;
}
.form-input {
  padding: 14px 18px;
  border: 1px solid transparent;
  border-radius: 20px;
  font-family: 'Urbanist', sans-serif;
  font-size: 0.85rem;
  color: var(--gray-dark);
  background: var(--pink-light);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.form-input:focus {
  outline: none;
  border-color: var(--purple);
  box-shadow: 0 0 0 3px rgba(75, 7, 63, 0.1);
}
.form-input::placeholder {
  color: var(--gray-medium);
}
.form-input.error {
  border-color: #e53935;
}
/* Checkbox Group */
.checkbox-group {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 8px;
}
.checkbox-input {
  width: 20px;
  height: 20px;
  margin: 0;
  cursor: pointer;
  accent-color: var(--purple);
  flex-shrink: 0;
  margin-top: 2px;
}
.checkbox-label {
  font-size: 0.875rem;
  color: var(--gray-medium);
  line-height: 1.5;
}
.checkbox-label a {
  color: var(--purple);
  text-decoration: underline;
}
.checkbox-label a:hover {
  color: var(--purple-dark);
}
/* Submit Button */
.mailing-list-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 280px;
  margin: 16px auto 0;
  padding: 16px 48px;
  background: var(--purple);
  color: var(--white);
  border: none;
  border-radius: 50px;
  font-family: 'Urbanist', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}
.mailing-list-submit:hover:not(:disabled) {
  background: var(--purple-dark);
  transform: translateY(-1px);
}
.mailing-list-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
/* Error Message */
.form-error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.875rem;
  text-align: center;
  display: none;
  margin-bottom: 8px;
}
.form-error-message.visible {
  display: block;
}
/* Success State */
.mailing-list-success {
  display: none;
  text-align: center;
  padding: 40px 20px;
}
.mailing-list-success.visible {
  display: block;
}
.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: var(--white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.success-icon svg {
  width: 40px;
  height: 40px;
  stroke: var(--purple);
  stroke-width: 2;
}
.success-heading {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-dark);
  margin-bottom: 8px;
}
.success-message {
  font-size: 1rem;
  color: var(--gray-medium);
  line-height: 1.6;
}
/* Responsive */
@media (max-width: 600px) {
  .mailing-list-section {
    padding: 60px 1.5rem;
  }
  .mailing-list-card {
    padding: 32px 24px;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
  .mailing-sticker {
    width: 90px;
    height: 90px;
  }
  .mailing-sticker-1 {
    top: -35px;
    right: -20px;
  }
  .mailing-sticker-2 {
    bottom: -35px;
    left: -20px;
  }
  .mailing-list-submit {
    max-width: 100%;
  }
}
</style>
