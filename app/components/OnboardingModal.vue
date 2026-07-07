<!-- Multi-step onboarding modal — one-to-one port of the injected HTML in
     old/demat-webflow-test/components.js and the onboarding IIFE in
     old/demat-webflow-test/site-wide-footer.js.
     8 steps: Welcome, Name, Contact/Address, Birthday, Sizes, Body Type, Referral, Complete.
     All styles live in assets/css/3-demat-custom.css (ported from the embed styles.css). -->
<template>
  <div id="onboardingModal" class="onboarding-modal-overlay" :class="{ 'is-visible': isOpen }">
    <div class="onboarding-modal-container">

      <!-- Progress Bar -->
      <div class="onboarding-progress">
        <div class="onboarding-progress-step" :class="progressClass(1)" data-step="1">
          <span class="progress-label">{{ isNL ? T.progressWelcome.nl : T.progressWelcome.en }}</span>
          <div class="progress-bar"><div class="progress-fill"></div></div>
        </div>
        <div class="onboarding-progress-step" :class="progressClass(2)" data-step="2">
          <span class="progress-label">{{ isNL ? T.progressYourInfo.nl : T.progressYourInfo.en }}</span>
          <div class="progress-bar"><div class="progress-fill"></div></div>
        </div>
        <div class="onboarding-progress-step" :class="progressClass(3)" data-step="3">
          <span class="progress-label">{{ isNL ? T.progressYourProfile.nl : T.progressYourProfile.en }}</span>
          <div class="progress-bar"><div class="progress-fill"></div></div>
        </div>
      </div>

      <!-- Step 1: Welcome -->
      <div class="onboarding-step" :class="{ active: currentStep === 1 }" data-step="1">
        <div class="onboarding-content">
          <div class="onboarding-icon">
            <svg width="140" height="140" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60 20C45 20 35 35 35 50C35 65 45 75 60 75C75 75 85 65 85 50C85 35 75 20 60 20Z" fill="#E8D4E8" stroke="#4b073f" stroke-width="2"/>
              <path d="M40 75L35 100H85L80 75" stroke="#4b073f" stroke-width="2" fill="#E8D4E8"/>
              <circle cx="50" cy="45" r="3" fill="#4b073f"/>
              <circle cx="70" cy="45" r="3" fill="#4b073f"/>
              <path d="M50 58C50 58 55 65 60 65C65 65 70 58 70 58" stroke="#4b073f" stroke-width="2" fill="none"/>
              <path d="M30 30L25 20M90 30L95 20M45 15L50 5M75 15L70 5" stroke="#4b073f" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <h2 class="onboarding-title">{{ isNL ? T.welcomeTitle.nl : T.welcomeTitle.en }}</h2>
          <p class="onboarding-subtitle">{{ isNL ? T.welcomeSubtitle.nl : T.welcomeSubtitle.en }}</p>
          <button class="onboarding-btn-primary" @click="nextStep">{{ isNL ? T.continueBtn.nl : T.continueBtn.en }}</button>
          <button class="onboarding-btn-secondary" @click="skip">{{ isNL ? T.doLater.nl : T.doLater.en }}</button>
        </div>
      </div>

      <!-- Step 2: Name Only -->
      <div class="onboarding-step" :class="{ active: currentStep === 2 }" data-step="2">
        <div class="onboarding-content">
          <h2 class="onboarding-title">{{ isNL ? T.nameTitle.nl : T.nameTitle.en }}</h2>
          <p class="onboarding-subtitle">{{ isNL ? T.nameSubtitle.nl : T.nameSubtitle.en }}</p>

          <div class="onboarding-form">
            <div class="onboarding-input-group">
              <label class="onboarding-label">{{ isNL ? T.firstName.nl : T.firstName.en }}</label>
              <input v-model="firstName" type="text" id="onboarding-firstname" class="onboarding-input" :placeholder="isNL ? T.phFirstName.nl : T.phFirstName.en">
            </div>
            <div class="onboarding-input-group">
              <label class="onboarding-label">{{ isNL ? T.lastName.nl : T.lastName.en }}</label>
              <input v-model="lastName" type="text" id="onboarding-lastname" class="onboarding-input" :placeholder="isNL ? T.phLastName.nl : T.phLastName.en">
            </div>
          </div>

          <button class="onboarding-btn-primary" @click="nextStep">{{ isNL ? T.continueBtn.nl : T.continueBtn.en }}</button>
          <button class="onboarding-btn-back" @click="prevStep">{{ isNL ? T.back.nl : T.back.en }}</button>
        </div>
      </div>

      <!-- Step 3: Contact & Address -->
      <div class="onboarding-step" :class="{ active: currentStep === 3 }" data-step="3">
        <div class="onboarding-content">
          <h2 class="onboarding-title">{{ isNL ? T.contactTitle.nl : T.contactTitle.en }}</h2>
          <p class="onboarding-subtitle">{{ isNL ? T.contactSubtitle.nl : T.contactSubtitle.en }}</p>

          <div class="onboarding-form">
            <div class="onboarding-input-group">
              <label class="onboarding-label">{{ isNL ? T.phoneNumber.nl : T.phoneNumber.en }}</label>
              <input v-model="phoneNumber" type="tel" id="onboarding-phone" class="onboarding-input" placeholder="+31 6 1234 5678">
            </div>

            <div class="onboarding-input-group">
              <label class="onboarding-label">{{ isNL ? T.findAddress.nl : T.findAddress.en }}</label>
              <input v-model="addressFull" type="text" id="onboarding-address-search" class="onboarding-input" :placeholder="isNL ? T.phAddressSearch.nl : T.phAddressSearch.en" @input="searchAddress">
              <div id="onboarding-address-suggestions" class="address-suggestions" :class="{ active: suggestionsVisible }">
                <div
                  v-for="(feature, index) in suggestions"
                  :key="index"
                  class="address-suggestion"
                  :data-index="index"
                  @click="selectAddress(index)"
                >
                  {{ feature.properties.formatted }}
                </div>
              </div>
            </div>

            <div class="onboarding-input-group">
              <label class="onboarding-label">{{ isNL ? T.street.nl : T.street.en }}</label>
              <input v-model="addressStreet" type="text" id="onboarding-street" class="onboarding-input" :placeholder="isNL ? T.phStreet.nl : T.phStreet.en">
            </div>

            <div class="onboarding-form-row">
              <div class="onboarding-input-group">
                <label class="onboarding-label">{{ isNL ? T.houseNumber.nl : T.houseNumber.en }}</label>
                <input v-model="addressHouseNumber" type="text" id="onboarding-house-number" class="onboarding-input" placeholder="123">
              </div>
              <div class="onboarding-input-group">
                <label class="onboarding-label">{{ isNL ? T.aptUnit.nl : T.aptUnit.en }}</label>
                <input v-model="addressUnit" type="text" id="onboarding-unit" class="onboarding-input" :placeholder="isNL ? T.phOptional.nl : T.phOptional.en">
              </div>
            </div>

            <div class="onboarding-form-row">
              <div class="onboarding-input-group">
                <label class="onboarding-label">{{ isNL ? T.postalCode.nl : T.postalCode.en }}</label>
                <input v-model="addressZipcode" type="text" id="onboarding-zipcode" class="onboarding-input" placeholder="1234 AB">
              </div>
              <div class="onboarding-input-group">
                <label class="onboarding-label">{{ isNL ? T.city.nl : T.city.en }}</label>
                <input v-model="addressCity" type="text" id="onboarding-city" class="onboarding-input" :placeholder="isNL ? T.phCity.nl : T.phCity.en">
              </div>
            </div>
          </div>

          <button class="onboarding-btn-primary" @click="nextStep">{{ isNL ? T.continueBtn.nl : T.continueBtn.en }}</button>
          <button class="onboarding-btn-back" @click="prevStep">{{ isNL ? T.back.nl : T.back.en }}</button>
        </div>
      </div>

      <!-- Step 4: Birthday -->
      <div class="onboarding-step" :class="{ active: currentStep === 4 }" data-step="4">
        <div class="onboarding-content">
          <h2 class="onboarding-title">{{ isNL ? T.birthdayTitle.nl : T.birthdayTitle.en }}</h2>
          <p class="onboarding-subtitle">{{ isNL ? T.birthdaySubtitle.nl : T.birthdaySubtitle.en }}</p>

          <div class="onboarding-form">
            <div class="onboarding-input-group">
              <label class="onboarding-label">{{ isNL ? T.dateOfBirth.nl : T.dateOfBirth.en }}</label>
              <input v-model="dateOfBirth" type="date" id="onboarding-birthday" class="onboarding-input">
            </div>
          </div>

          <button class="onboarding-btn-primary" @click="nextStep">{{ isNL ? T.continueBtn.nl : T.continueBtn.en }}</button>
          <button class="onboarding-btn-back" @click="prevStep">{{ isNL ? T.back.nl : T.back.en }}</button>
        </div>
      </div>

      <!-- Step 5: Size Profile -->
      <div class="onboarding-step" :class="{ active: currentStep === 5 }" data-step="5">
        <div class="onboarding-content">
          <h2 class="onboarding-title">{{ isNL ? T.sizesTitle.nl : T.sizesTitle.en }}</h2>
          <p class="onboarding-subtitle">{{ isNL ? T.sizesSubtitle.nl : T.sizesSubtitle.en }}</p>

          <div class="onboarding-form">
            <div class="onboarding-form-row">
              <div class="onboarding-input-group">
                <label class="onboarding-label">{{ isNL ? T.height.nl : T.height.en }}</label>
                <input v-model="heightCm" type="number" id="onboarding-height" class="onboarding-input" placeholder="175">
              </div>
              <div class="onboarding-input-group">
                <label class="onboarding-label">{{ isNL ? T.preferredFit.nl : T.preferredFit.en }}</label>
                <select v-model="preferredFit" id="onboarding-preferred-fit" class="onboarding-input">
                  <option value="">{{ isNL ? T.selectFit.nl : T.selectFit.en }}</option>
                  <option value="Slim">{{ isNL ? T.fitSlim.nl : T.fitSlim.en }}</option>
                  <option value="Regular">{{ isNL ? T.fitRegular.nl : T.fitRegular.en }}</option>
                  <option value="Oversized">{{ isNL ? T.fitOversized.nl : T.fitOversized.en }}</option>
                </select>
              </div>
            </div>

            <div class="onboarding-form-row">
              <div class="onboarding-input-group">
                <label class="onboarding-label">{{ isNL ? T.shirtSize.nl : T.shirtSize.en }}</label>
                <input v-model="shirtSize" type="text" id="onboarding-shirt-size" class="onboarding-input" placeholder="M, L, XL">
              </div>
              <div class="onboarding-input-group">
                <label class="onboarding-label">{{ isNL ? T.pantsSize.nl : T.pantsSize.en }}</label>
                <input v-model="pantsSize" type="text" id="onboarding-pants-size" class="onboarding-input" placeholder="32, 34, 36">
              </div>
            </div>

            <div class="onboarding-input-group">
              <label class="onboarding-label">{{ isNL ? T.shoeSize.nl : T.shoeSize.en }}</label>
              <input v-model="shoeSize" type="text" id="onboarding-shoe-size" class="onboarding-input" placeholder="42, 43, 44">
            </div>
          </div>

          <button class="onboarding-btn-primary" @click="nextStep">{{ isNL ? T.continueBtn.nl : T.continueBtn.en }}</button>
          <button class="onboarding-btn-back" @click="prevStep">{{ isNL ? T.back.nl : T.back.en }}</button>
        </div>
      </div>

      <!-- Step 6: Body Type -->
      <div class="onboarding-step" :class="{ active: currentStep === 6 }" data-step="6">
        <div class="onboarding-content">
          <h2 class="onboarding-title">{{ isNL ? T.bodyTypeTitle.nl : T.bodyTypeTitle.en }}</h2>
          <p class="onboarding-subtitle">{{ isNL ? T.bodyTypeSubtitle.nl : T.bodyTypeSubtitle.en }}</p>

          <div class="onboarding-body-types">
            <button class="body-type-option" :class="{ selected: bodyType === 'triangle' }" data-body-type="triangle" @click="bodyType = 'triangle'">
              <div class="body-type-icon">
                <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
                  <ellipse cx="30" cy="15" rx="10" ry="12" fill="#FFF4E8" stroke="#333" stroke-width="1.5"/>
                  <path d="M20 30 L15 70 L45 70 L40 30 Z" fill="#F9DC5C" stroke="#333" stroke-width="1.5"/>
                  <path d="M15 30 Q5 35 8 45" stroke="#333" stroke-width="1.5" fill="none"/>
                  <path d="M45 30 Q55 35 52 45" stroke="#333" stroke-width="1.5" fill="none"/>
                </svg>
              </div>
              <span class="body-type-label">{{ isNL ? T.bodyTriangle.nl : T.bodyTriangle.en }}</span>
            </button>

            <button class="body-type-option" :class="{ selected: bodyType === 'inverted-triangle' }" data-body-type="inverted-triangle" @click="bodyType = 'inverted-triangle'">
              <div class="body-type-icon">
                <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
                  <ellipse cx="30" cy="15" rx="10" ry="12" fill="#FFF4E8" stroke="#333" stroke-width="1.5"/>
                  <path d="M10 30 L20 70 L40 70 L50 30 Z" fill="#FFBE98" stroke="#333" stroke-width="1.5"/>
                  <path d="M10 30 Q0 35 3 45" stroke="#333" stroke-width="1.5" fill="none"/>
                  <path d="M50 30 Q60 35 57 45" stroke="#333" stroke-width="1.5" fill="none"/>
                </svg>
              </div>
              <span class="body-type-label">{{ isNL ? T.bodyInvertedTriangle.nl : T.bodyInvertedTriangle.en }}</span>
            </button>

            <button class="body-type-option" :class="{ selected: bodyType === 'rectangle' }" data-body-type="rectangle" @click="bodyType = 'rectangle'">
              <div class="body-type-icon">
                <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
                  <ellipse cx="30" cy="15" rx="10" ry="12" fill="#FFF4E8" stroke="#333" stroke-width="1.5"/>
                  <path d="M18 30 L18 70 L42 70 L42 30 Z" fill="#E8D4E8" stroke="#333" stroke-width="1.5"/>
                  <path d="M18 30 Q8 35 11 45" stroke="#333" stroke-width="1.5" fill="none"/>
                  <path d="M42 30 Q52 35 49 45" stroke="#333" stroke-width="1.5" fill="none"/>
                </svg>
              </div>
              <span class="body-type-label">{{ isNL ? T.bodyRectangle.nl : T.bodyRectangle.en }}</span>
            </button>

            <button class="body-type-option" :class="{ selected: bodyType === 'oval' }" data-body-type="oval" @click="bodyType = 'oval'">
              <div class="body-type-icon">
                <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
                  <ellipse cx="30" cy="15" rx="10" ry="12" fill="#FFF4E8" stroke="#333" stroke-width="1.5"/>
                  <ellipse cx="30" cy="50" rx="18" ry="22" fill="#FFB5B5" stroke="#333" stroke-width="1.5"/>
                  <path d="M12 40 Q2 45 5 55" stroke="#333" stroke-width="1.5" fill="none"/>
                  <path d="M48 40 Q58 45 55 55" stroke="#333" stroke-width="1.5" fill="none"/>
                </svg>
              </div>
              <span class="body-type-label">{{ isNL ? T.bodyOval.nl : T.bodyOval.en }}</span>
            </button>

            <button class="body-type-option" :class="{ selected: bodyType === 'hourglass' }" data-body-type="hourglass" @click="bodyType = 'hourglass'">
              <div class="body-type-icon">
                <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
                  <ellipse cx="30" cy="15" rx="10" ry="12" fill="#FFF4E8" stroke="#333" stroke-width="1.5"/>
                  <path d="M12 30 Q30 45 12 70 L48 70 Q30 45 48 30 Z" fill="#B8E0D2" stroke="#333" stroke-width="1.5"/>
                  <path d="M12 30 Q2 35 5 45" stroke="#333" stroke-width="1.5" fill="none"/>
                  <path d="M48 30 Q58 35 55 45" stroke="#333" stroke-width="1.5" fill="none"/>
                </svg>
              </div>
              <span class="body-type-label">{{ isNL ? T.bodyHourglass.nl : T.bodyHourglass.en }}</span>
            </button>
          </div>

          <button class="onboarding-btn-primary" @click="nextStep">{{ isNL ? T.continueBtn.nl : T.continueBtn.en }}</button>
          <button class="onboarding-btn-back" @click="prevStep">{{ isNL ? T.back.nl : T.back.en }}</button>
        </div>
      </div>

      <!-- Step 7: How did you hear about us -->
      <div class="onboarding-step" :class="{ active: currentStep === 7 }" data-step="7">
        <div class="onboarding-content">
          <h2 class="onboarding-title">{{ isNL ? T.referralTitle.nl : T.referralTitle.en }}</h2>
          <p class="onboarding-subtitle">{{ isNL ? T.referralSubtitle.nl : T.referralSubtitle.en }}</p>

          <div class="onboarding-checkboxes">
            <label class="checkbox-option">
              <input v-model="referralSources" type="checkbox" name="referral" value="instagram">
              <span class="checkbox-custom"></span>
              <span class="checkbox-label">{{ isNL ? T.refInstagram.nl : T.refInstagram.en }}</span>
            </label>
            <label class="checkbox-option">
              <input v-model="referralSources" type="checkbox" name="referral" value="tiktok">
              <span class="checkbox-custom"></span>
              <span class="checkbox-label">{{ isNL ? T.refTiktok.nl : T.refTiktok.en }}</span>
            </label>
            <label class="checkbox-option">
              <input v-model="referralSources" type="checkbox" name="referral" value="facebook">
              <span class="checkbox-custom"></span>
              <span class="checkbox-label">{{ isNL ? T.refFacebook.nl : T.refFacebook.en }}</span>
            </label>
            <label class="checkbox-option">
              <input v-model="referralSources" type="checkbox" name="referral" value="pinterest">
              <span class="checkbox-custom"></span>
              <span class="checkbox-label">{{ isNL ? T.refPinterest.nl : T.refPinterest.en }}</span>
            </label>
            <label class="checkbox-option">
              <input v-model="referralSources" type="checkbox" name="referral" value="friends-family">
              <span class="checkbox-custom"></span>
              <span class="checkbox-label">{{ isNL ? T.refFriendsFamily.nl : T.refFriendsFamily.en }}</span>
            </label>
            <label class="checkbox-option">
              <input v-model="referralSources" type="checkbox" name="referral" value="google">
              <span class="checkbox-custom"></span>
              <span class="checkbox-label">{{ isNL ? T.refGoogle.nl : T.refGoogle.en }}</span>
            </label>
            <label class="checkbox-option">
              <input v-model="referralSources" type="checkbox" name="referral" value="influencer">
              <span class="checkbox-custom"></span>
              <span class="checkbox-label">{{ isNL ? T.refInfluencer.nl : T.refInfluencer.en }}</span>
            </label>
            <label class="checkbox-option">
              <input v-model="referralSources" type="checkbox" name="referral" value="other">
              <span class="checkbox-custom"></span>
              <span class="checkbox-label">{{ isNL ? T.refOther.nl : T.refOther.en }}</span>
            </label>
          </div>

          <button class="onboarding-btn-primary" :class="{ loading: submitting }" :disabled="submitting" @click="submit">{{ isNL ? T.continueBtn.nl : T.continueBtn.en }}</button>
          <button class="onboarding-btn-back" @click="prevStep">{{ isNL ? T.back.nl : T.back.en }}</button>
        </div>
      </div>

      <!-- Step 8: Complete -->
      <div class="onboarding-step" :class="{ active: currentStep === 8 }" data-step="8">
        <div class="onboarding-content">
          <div class="onboarding-icon">
            <!-- Clothes Hanger Icon -->
            <svg width="140" height="140" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Hook at top -->
              <path d="M60 15 C60 15 60 25 60 30 C60 35 55 40 50 40 C45 40 40 35 40 30 C40 25 45 20 50 20"
                    stroke="#4b073f" stroke-width="3" fill="none" stroke-linecap="round"/>
              <!-- Main hanger body -->
              <path d="M60 40 L15 75 L15 82 L60 60 L105 82 L105 75 L60 40 Z"
                    fill="#E8D4E8" stroke="#4b073f" stroke-width="2.5" stroke-linejoin="round"/>
              <!-- Decorative sparkles -->
              <path d="M25 50 L20 45 M95 50 L100 45 M30 35 L25 30 M90 35 L95 30"
                    stroke="#4b073f" stroke-width="1.5" stroke-linecap="round"/>
              <!-- Small accent lines on hanger -->
              <path d="M40 58 L60 48 L80 58" stroke="#4b073f" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
          <h2 class="onboarding-title">{{ isNL ? T.completeTitle.nl : T.completeTitle.en }}</h2>
          <p class="onboarding-subtitle">{{ isNL ? T.completeSubtitle.nl : T.completeSubtitle.en }}</p>
          <button class="onboarding-btn-primary" @click="complete">{{ isNL ? T.startShopping.nl : T.startShopping.en }}</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
interface GeoapifyFeature {
  properties: {
    formatted?: string
    street?: string
    road?: string
    name?: string
    housenumber?: string
    house_number?: string
    address_line1?: string
    postcode?: string
    city?: string
    town?: string
    municipality?: string
    [key: string]: unknown
  }
}

const { getToken } = useAuth()
const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const { apiBase, geoapifyKey } = useRuntimeConfig().public

const T = {
  progressWelcome: { en: 'welcome', nl: 'welkom' },
  progressYourInfo: { en: 'your info', nl: 'jouw gegevens' },
  progressYourProfile: { en: 'your profile', nl: 'jouw profiel' },
  welcomeTitle: { en: 'welcome to the club!', nl: 'welkom bij de club!' },
  welcomeSubtitle: {
    en: "you're now a member of our shared closet. let's quickly set up your profile for a better experience; you can adjust it later.",
    nl: "you're now a member of our shared closet. let's quickly set up your profile for a better experience; you can adjust it later.",
  },
  continueBtn: { en: 'continue', nl: 'doorgaan' },
  doLater: { en: "i'll do this later", nl: 'ik doe dit later' },
  back: { en: 'back', nl: 'terug' },
  nameTitle: { en: "what's your name?", nl: 'wat is je naam?' },
  nameSubtitle: { en: 'so we know what to call you', nl: 'zodat we weten hoe we je kunnen noemen' },
  firstName: { en: 'first name', nl: 'voornaam' },
  phFirstName: { en: 'enter your first name', nl: 'vul je voornaam in' },
  lastName: { en: 'last name', nl: 'achternaam' },
  phLastName: { en: 'enter your last name', nl: 'vul je achternaam in' },
  contactTitle: { en: 'contact & address', nl: 'contact & adres' },
  contactSubtitle: { en: 'so we know where to reach you', nl: 'zodat we weten waar we je kunnen bereiken' },
  phoneNumber: { en: 'phone number', nl: 'telefoonnummer' },
  findAddress: { en: 'find your address', nl: 'vind je adres' },
  phAddressSearch: { en: 'start typing your address...', nl: 'typ je adres in...' },
  street: { en: 'street', nl: 'straat' },
  phStreet: { en: 'street name', nl: 'straatnaam' },
  houseNumber: { en: 'house number', nl: 'huisnummer' },
  aptUnit: { en: 'apt / unit', nl: 'apt / unit' },
  phOptional: { en: 'optional', nl: 'optioneel' },
  postalCode: { en: 'postal code', nl: 'postcode' },
  city: { en: 'city', nl: 'stad' },
  phCity: { en: 'city', nl: 'stad' },
  birthdayTitle: { en: 'your birthday', nl: 'jouw verjaardag' },
  birthdaySubtitle: { en: 'so you can receive special treatment', nl: 'zodat je een speciale behandeling kunt krijgen' },
  dateOfBirth: { en: 'date of birth', nl: 'geboortedatum' },
  sizesTitle: { en: 'your sizes', nl: 'jouw maten' },
  sizesSubtitle: {
    en: 'so we can make sure to have plenty of options that fit you',
    nl: 'so we can make sure to have plenty of options that fit you',
  },
  height: { en: 'height (cm)', nl: 'lengte (cm)' },
  preferredFit: { en: 'preferred fit', nl: 'voorkeurspasvorm' },
  selectFit: { en: 'select fit...', nl: 'kies pasvorm...' },
  fitSlim: { en: 'slim', nl: 'slim' },
  fitRegular: { en: 'regular', nl: 'regular' },
  fitOversized: { en: 'oversized', nl: 'oversized' },
  shirtSize: { en: 'typical shirt size', nl: 'gebruikelijke shirtmaat' },
  pantsSize: { en: 'typical pants size', nl: 'gebruikelijke broekmaat' },
  shoeSize: { en: 'shoe size', nl: 'schoenmaat' },
  bodyTypeTitle: { en: 'your body type', nl: 'jouw lichaamstype' },
  bodyTypeSubtitle: {
    en: 'so we can help you find pieces that make you look good, and feel good',
    nl: 'so we can help you find pieces that make you look good, and feel good',
  },
  bodyTriangle: { en: 'triangle', nl: 'driehoek' },
  bodyInvertedTriangle: { en: 'inverted triangle', nl: 'omgekeerde driehoek' },
  bodyRectangle: { en: 'rectangle', nl: 'rechthoek' },
  bodyOval: { en: 'oval', nl: 'ovaal' },
  bodyHourglass: { en: 'hourglass', nl: 'zandloper' },
  referralTitle: { en: 'how did you hear about demat?', nl: 'hoe heb je over demat gehoord?' },
  referralSubtitle: {
    en: 'so we know which of our efforts are actually paying off',
    nl: 'so we know which of our efforts are actually paying off',
  },
  refInstagram: { en: 'instagram', nl: 'instagram' },
  refTiktok: { en: 'tiktok', nl: 'tiktok' },
  refFacebook: { en: 'facebook', nl: 'facebook' },
  refPinterest: { en: 'pinterest', nl: 'pinterest' },
  refFriendsFamily: { en: 'friends or family', nl: 'vrienden of familie' },
  refGoogle: { en: 'google search', nl: 'google search' },
  refInfluencer: { en: 'influencer', nl: 'influencer' },
  refOther: { en: 'other', nl: 'anders' },
  completeTitle: { en: 'thank you!', nl: 'bedankt!' },
  completeSubtitle: { en: 'your profile is now complete. time to go shopping!', nl: 'je profiel is nu compleet. tijd om te gaan shoppen!' },
  startShopping: { en: 'start shopping', nl: 'begin met shoppen' },
} as const

// Shared with plugins/onboarding.client.ts (window.openOnboardingModal resets step to 1).
const isOpen = useState('onboarding-modal-open', () => false)
const currentStep = useState('onboarding-current-step', () => 1)
const totalSteps = 8

// Form data — same fields as the old formData object.
const firstName = ref('')
const lastName = ref('')
const phoneNumber = ref('')
const addressFull = ref('') // Backup: full address from search field
const addressStreet = ref('')
const addressHouseNumber = ref('')
const addressUnit = ref('')
const addressZipcode = ref('')
const addressCity = ref('')
const dateOfBirth = ref('')
const heightCm = ref('')
const preferredFit = ref('')
const shirtSize = ref('')
const pantsSize = ref('')
const shoeSize = ref('')
const bodyType = ref('')
const referralSources = ref<string[]>([])

const submitting = ref(false)
const suggestions = ref<GeoapifyFeature[]>([])
const suggestionsVisible = ref(false)
let addressDebounce: ReturnType<typeof setTimeout> | null = null

// Step 1 = welcome, steps 2-4 = your info, steps 5-8 = your profile.
const stepToProgress: Record<number, number> = { 1: 1, 2: 2, 3: 2, 4: 2, 5: 3, 6: 3, 7: 3, 8: 3 }
const progressSection = computed(() => stepToProgress[currentStep.value] || 1)

function progressClass(stepNum: number) {
  return {
    completed: stepNum < progressSection.value,
    active: stepNum === progressSection.value,
  }
}

function nextStep() {
  if (currentStep.value < totalSteps) currentStep.value++
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}

function skip() {
  sessionStorage.setItem('onboarding_modal_dismissed', 'true')
  isOpen.value = false
}

function searchAddress() {
  const query = addressFull.value.trim()

  if (query.length < 3) {
    suggestionsVisible.value = false
    suggestions.value = []
    return
  }

  if (addressDebounce) clearTimeout(addressDebounce)

  addressDebounce = setTimeout(async () => {
    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${geoapifyKey}&filter=countrycode:nl&limit=5`

      const response = await fetch(url)
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        suggestions.value = data.features
        suggestionsVisible.value = true
        ;(window as any)._onboardingAddressResults = data.features
      } else {
        suggestionsVisible.value = false
        suggestions.value = []
      }
    } catch (error) {
      console.error('Address search error:', error)
    }
  }, 300)
}

function selectAddress(index: number) {
  const feature = suggestions.value[index] ?? (window as any)._onboardingAddressResults?.[index]
  if (!feature) return

  const props = feature.properties

  // Set the search field to formatted address
  addressFull.value = props.formatted || ''

  // Try to get street from various possible properties
  let street = props.street || props.road || props.name || ''

  // Try to get house number from various possible properties
  let houseNumber = props.housenumber || props.house_number || ''

  // If we have address_line1, try to parse street and number from it
  if ((!street || !houseNumber) && props.address_line1) {
    const addressLine1 = props.address_line1
    // Dutch format is usually "Street Name 123" or "Street Name 123a"
    const match = addressLine1.match(/^(.+?)\s+(\d+\s*\w*)$/)
    if (match) {
      if (!street) street = match[1]
      if (!houseNumber) houseNumber = match[2]
    } else if (!street) {
      street = addressLine1
    }
  }

  // If still no street/number, try parsing from formatted
  if ((!street || !houseNumber) && props.formatted) {
    // formatted is usually "Street Name 123, PostalCode City, Country"
    const firstPart = props.formatted.split(',')[0]
    if (firstPart) {
      const match = firstPart.trim().match(/^(.+?)\s+(\d+\s*\w*)$/)
      if (match) {
        if (!street) street = match[1]
        if (!houseNumber) houseNumber = match[2]
      }
    }
  }

  addressStreet.value = street
  addressHouseNumber.value = houseNumber
  addressZipcode.value = props.postcode || ''
  addressCity.value = props.city || props.town || props.municipality || ''

  // Hide suggestions
  suggestionsVisible.value = false
  suggestions.value = []
}

async function submit() {
  submitting.value = true

  try {
    const token = await getToken()
    if (!token) {
      throw new Error('Authentication not available')
    }

    // Build attributes array (matching profile.js approach)
    const customAttributes: Array<{ key: string; value: string }> = []

    if (firstName.value) customAttributes.push({ key: 'first_name', value: firstName.value })
    if (lastName.value) customAttributes.push({ key: 'last_name', value: lastName.value })
    if (addressStreet.value) customAttributes.push({ key: 'address_street', value: addressStreet.value })
    if (addressFull.value) customAttributes.push({ key: 'address_full', value: addressFull.value })
    if (addressUnit.value) customAttributes.push({ key: 'address_unit', value: addressUnit.value })
    if (heightCm.value) customAttributes.push({ key: 'height_cm', value: String(heightCm.value) })
    if (preferredFit.value) customAttributes.push({ key: 'preferred_fit', value: preferredFit.value })
    if (shirtSize.value) customAttributes.push({ key: 'shirt_size', value: shirtSize.value })
    if (pantsSize.value) customAttributes.push({ key: 'pants_size', value: pantsSize.value })
    if (shoeSize.value) customAttributes.push({ key: 'shoe_size', value: shoeSize.value })
    if (bodyType.value) customAttributes.push({ key: 'body_type', value: bodyType.value })
    if (referralSources.value.length > 0) {
      customAttributes.push({ key: 'referral_sources', value: referralSources.value.join(',') })
    }

    // Build the API payload (matching profile.js approach)
    const payload: Record<string, unknown> = {
      provided_information: true,
      attributes: customAttributes,
    }

    // Direct API fields
    if (phoneNumber.value) payload.phone_number = phoneNumber.value
    if (dateOfBirth.value) payload.date_of_birth = dateOfBirth.value
    if (addressHouseNumber.value) payload.address_house_number = addressHouseNumber.value
    if (addressZipcode.value) payload.address_zipcode = addressZipcode.value
    if (addressCity.value) payload.address_city = addressCity.value

    const response = await fetch(`${apiBase}/users/me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('API error:', errorData)
      // Don't block the user, just log the error and continue
      console.warn('Profile update failed, but continuing to completion')
    }

    // Move to completion step regardless
    currentStep.value = 8
  } catch (error) {
    console.error('Submit error:', error)
    // Still show completion - don't block the user
    currentStep.value = 8
  } finally {
    submitting.value = false
  }
}

function complete() {
  sessionStorage.setItem('onboarding_completed', 'true')
  isOpen.value = false

  // Redirect to clothing page (old code: window.DematI18n.localizePath('/clothing'))
  window.location.href = (isNL.value ? '/nl' : '') + '/clothing'
}

watch(isOpen, (open) => {
  if (!import.meta.client) return
  document.body.classList.toggle('onboarding-modal-open', open)
})

// Close address suggestions when clicking outside (same conditions as the old listener).
function onDocumentClick(e: MouseEvent) {
  if (!suggestionsVisible.value) return
  const target = e.target as HTMLElement
  const searchInput = document.getElementById('onboarding-address-search')
  if (
    !target.closest('.onboarding-input-group') ||
    (target !== searchInput && !target.classList.contains('address-suggestion'))
  ) {
    suggestionsVisible.value = false
  }
}

// Escape key dismisses (counts as skip, same as old code).
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    skip()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)

  // Globals the old markup/scripts exposed; open/close/show/skip live in
  // plugins/onboarding.client.ts.
  const w = window as any
  w.nextOnboardingStep = nextStep
  w.prevOnboardingStep = prevStep
  w.submitOnboarding = submit
  w.completeOnboarding = complete
  w.searchOnboardingAddress = searchAddress
  w.selectOnboardingAddress = selectAddress
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
  if (addressDebounce) clearTimeout(addressDebounce)
  document.body.classList.remove('onboarding-modal-open')

  const w = window as any
  delete w.nextOnboardingStep
  delete w.prevOnboardingStep
  delete w.submitOnboarding
  delete w.completeOnboarding
  delete w.searchOnboardingAddress
  delete w.selectOnboardingAddress
})
</script>
