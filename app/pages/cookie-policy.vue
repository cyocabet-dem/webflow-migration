<script setup lang="ts">
useHead({
  title: 'Cookie Policy',
  meta: [
    { name: 'description', content: 'We prioritize your privacy and strive to be transparent about our use of cookies and similar technologies. This Cookie Policy explains what cookies are, how we use them, and your choices regarding their use.' },
    { property: 'og:title', content: 'Cookie Policy' },
    { property: 'og:description', content: 'We prioritize your privacy and strive to be transparent about our use of cookies and similar technologies. This Cookie Policy explains what cookies are, how we use them, and your choices regarding their use.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:title', content: 'Cookie Policy' },
    { name: 'twitter:description', content: 'We prioritize your privacy and strive to be transparent about our use of cookies and similar technologies. This Cookie Policy explains what cookies are, how we use them, and your choices regarding their use.' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
})

const policyDropdownOpen = ref(false)
const policyDropdownEl = ref<HTMLElement | null>(null)

// Webflow dropdowns close on any click outside the component
function onDocumentClick(e: MouseEvent) {
  if (policyDropdownEl.value && !policyDropdownEl.value.contains(e.target as Node)) {
    policyDropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div class="w-layout-blockcontainer container-1300 legal w-container">
    <div class="div-header-policies rentals">
      <div class="div-mobile-dropdown-policies">
        <div ref="policyDropdownEl" data-hover="false" data-delay="0" class="dropdown-policies w-dropdown" :class="{ 'w--open': policyDropdownOpen }">
          <div class="dropdown-toggle-4 w-dropdown-toggle" :class="{ 'w--open': policyDropdownOpen }" :aria-expanded="policyDropdownOpen" @click="policyDropdownOpen = !policyDropdownOpen">
            <div class="dropdown-label-policies">Cookie policy</div>
            <div class="dropdown-chevron-policies w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down">
                <path d="m6 9 6 6 6-6"></path>
              </svg></div>
          </div>
          <nav class="dropdown-list-policies w-dropdown-list" :class="{ 'w--open': policyDropdownOpen }">
            <a href="/privacy-policy" class="dropdown-options-text w-dropdown-link">Privacy Policy</a>
            <a href="/cookie-policy" aria-current="page" class="dropdown-options-text w-dropdown-link w--current">Cookie Policy</a>
            <a href="/terms-and-conditions" class="dropdown-options-text w-dropdown-link">Terms &amp; Conditions</a>
            <a href="/cancellation-policy" class="dropdown-options-text w-dropdown-link">Cancellation Policy</a>
            <a href="/return-policy" class="dropdown-options-text w-dropdown-link">Return Policy</a>
            <a href="/donation-store-credit-policy" class="dropdown-options-text w-dropdown-link">Donation &amp; Store Credit Policy</a>
          </nav>
        </div>
      </div>
      <div class="div-heading-content-policies account">
        <div class="heading-text-policies">cookie Policy</div>
      </div>
    </div>
    <div class="div-section-policies rentals legal">
      <div class="div-policy-menu rentals">
        <div class="div-content-wrapper-policies menu legal">
          <a href="/terms-and-conditions" class="menu-link-policies">Terms &amp; conditions</a>
          <a href="/privacy-policy" class="menu-link-policies">Privacy Policy</a>
          <a href="/cookie-policy" aria-current="page" class="menu-link-policies w--current">cookie policy</a>
          <a href="/cancellation-policy" class="menu-link-policies">cancellation policy</a>
          <a href="/return-policy" class="menu-link-policies">return policy</a>
          <a href="/donation-store-credit-policy" class="menu-link-policies">Donation &amp; Store Credit Policy</a>
        </div>
      </div>
      <div class="div-policy-menu">
        <div class="div-content-wrapper-policies right legal">
          <div class="policy-heading-text header">Cookie Policy</div>
          <div class="last-revised-text-policies">Last revised and effective date: 26 June 2026</div>
          <div class="paragraph-text-policies">At Dematerialized, we prioritize your privacy and strive to be transparent about our use of cookies and similar technologies. This Cookie Policy explains what cookies are, how we use them, and your choices regarding their use.</div>
          <div class="policy-heading-text">1. What are cookies?</div>
          <div class="paragraph-text-policies">Cookies are small data files sent from a server to your browser and stored on your device. They let websites recognize your browser and remember certain information, which helps the Site work correctly and helps us understand how you interact with our Services.</div>
          <div class="policy-heading-text no-caps">2. Categories of Cookies We Use</div>
          <div class="div-cookie-types">
            <div class="paragraph-text-policies">We group cookies into the same categories you see in our cookie banner:</div>
            <ul role="list" class="list-policies">
              <li class="list-item-policies"><strong>Essentials: </strong>Necessary for the Site to function, including account login and payment processing. These are always active and do not require consent.</li>
              <li class="list-item-policies"><strong>Marketing: </strong>Used for targeted advertising and to measure how our campaigns perform.</li>
              <li class="list-item-policies"><strong>Personalization: </strong>Remember your preferences and provide enhanced features.</li>
              <li class="list-item-policies"><strong>Analytics: </strong>Measure how the Site is used so we can improve your experience.</li>
            </ul>
            <div class="paragraph-text-policies">Cookies may be set by us (first-party) or by our partners (third-party). Some are session cookies, deleted when you close your browser; others are persistent, staying on your device until they expire or you delete them. You can accept or reject each non-essential category through our cookie banner.</div>
          </div>
          <div class="policy-heading-text">3. The Cookies We Use</div>
          <div class="paragraph-text-policies">You can see the specific cookies we use, grouped by the categories above, in our cookie preference center: open it from the cookie widget in the lower left corner of our website, then expand any category and select “cookie details.” There you will find each cookie&#x27;s name, provider, duration, and purpose. You can also view and clear the cookies set on your device at any time through your browser settings.</div>
          <div class="policy-heading-text">4. Similar Technologies</div>
          <div class="paragraph-text-policies">In addition to cookies, we use similar technologies:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies"><strong>Local Storage Objects: </strong>Store data on your device to maintain preferences and settings.</li>
            <li class="list-item-policies"><strong>Web Beacons:</strong> Small graphic images that monitor your interaction with our Site.</li>
            <li class="list-item-policies"><strong>Social Widgets:</strong> Buttons or icons from social media platforms that allow content sharing and may collect browsing data.<br></li>
            <li class="list-item-policies"><strong>UTM Codes: </strong>Track the effectiveness of online marketing campaigns by appearing in URLs.<br></li>
          </ul>
          <div class="policy-heading-text">5. Your Choices</div>
          <div class="paragraph-text-policies">We use cookies that are not strictly necessary only after you have given consent, which you provide through the cookie banner when you first visit the Site. You can change or withdraw your consent at any time:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies"><strong>Cookie Settings: </strong>Adjust your preferences at any time through the cookie settings on our Site.</li>
            <li class="list-item-policies"><strong>Marketing Preferences: </strong>Manage these as described in our <a href="/privacy-policy">Privacy Policy</a>.</li>
            <li class="list-item-policies"><strong>Social Widgets:</strong> Buttons or icons from social media platforms that allow content sharing and may collect browsing data.<br></li>
            <li class="list-item-policies"><strong>Browser settings: </strong>Most browsers let you manage or disable cookies. See the help pages for <a href="https://support.google.com/accounts/answer/61416">Google Chrome</a>, <a href="https://support.apple.com/en-gb/safari">Apple Safari</a>, <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop">Mozilla Firefox</a>, and <a href="https://support.microsoft.com/en-us/microsoft-edge/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd">Microsoft Edge</a>.<br></li>
          </ul>
          <div class="paragraph-text-policies">Please note that disabling certain cookies may affect how the Site functions.</div>
          <div class="policy-heading-text no-caps">6. Updates to this Policy</div>
          <div class="paragraph-text-policies">We may update this Cookie Policy periodically to reflect changes in technology or legal requirements. The effective date at the top indicates the latest revision. We encourage you to review this policy regularly to stay informed about our use of cookies and related technologies.</div>
          <div class="policy-heading-text">7. contact us</div>
          <div class="paragraph-text-policies">If you have any questions or concerns about our use of cookies, please contact us at:</div>
          <div class="div-contact-details-policies">
            <div class="div-row-contact-details">
              <div class="paragraph-text-policies contact-bold">Email</div>
              <div class="paragraph-text-policies">|</div>
              <div class="paragraph-text-policies">
                <a href="mailto:info@dematerialized.nl?subject=Cookie%20Policy%20Inquiry" class="in-text-link-policies">info@dematerialized.nl</a>
              </div>
            </div>
            <div class="div-row-contact-details">
              <div class="paragraph-text-policies contact-bold">Phone</div>
              <div class="paragraph-text-policies">|</div>
              <div class="paragraph-text-policies">+31 6 246 73835</div>
            </div>
            <div class="div-row-contact-details">
              <div class="paragraph-text-policies contact-bold">address</div>
              <div class="paragraph-text-policies">|</div>
              <div class="paragraph-text-policies">Lange Putstraat 4, 5211 KN Den Bosch, the Netherlands</div>
            </div>
          </div>
          <div class="last-revised-text-policies">By using our Site and Services, you consent to the use of cookies and similar technologies as described in this policy.</div>
        </div>
      </div>
    </div>
  </div>
</template>
