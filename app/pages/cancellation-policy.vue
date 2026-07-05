<script setup lang="ts">
useHead({
  title: 'Cancellation Policy | Dematerialized',
  meta: [
    { name: 'description', content: 'We believe in flexibility and transparency. This Cancellation Policy explains how you can cancel your membership, rentals, reservations, or other orders made through our online platform or store.' },
    { property: 'og:title', content: 'Cancellation Policy | Dematerialized' },
    { property: 'og:description', content: 'We believe in flexibility and transparency. This Cancellation Policy explains how you can cancel your membership, rentals, reservations, or other orders made through our online platform or store.' },
    { name: 'twitter:title', content: 'Cancellation Policy | Dematerialized' },
    { name: 'twitter:description', content: 'We believe in flexibility and transparency. This Cancellation Policy explains how you can cancel your membership, rentals, reservations, or other orders made through our online platform or store.' },
    { property: 'og:type', content: 'website' },
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
            <div class="dropdown-label-policies">Cancellation policy</div>
            <div class="dropdown-chevron-policies w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down">
                <path d="m6 9 6 6 6-6"></path>
              </svg></div>
          </div>
          <nav class="dropdown-list-policies w-dropdown-list" :class="{ 'w--open': policyDropdownOpen }">
            <a href="/privacy-policy" class="dropdown-options-text w-dropdown-link">Privacy Policy</a>
            <a href="/cookie-policy" class="dropdown-options-text w-dropdown-link">Cookie Policy</a>
            <a href="/terms-and-conditions" class="dropdown-options-text w-dropdown-link">Terms &amp; Conditions</a>
            <a href="/cancellation-policy" aria-current="page" class="dropdown-options-text w-dropdown-link w--current">Cancellation Policy</a>
            <a href="/return-policy" class="dropdown-options-text w-dropdown-link">Return Policy</a>
            <a href="/donation-store-credit-policy" class="dropdown-options-text w-dropdown-link">Donation &amp; Store Credit Policy</a>
          </nav>
        </div>
      </div>
      <div class="div-heading-content-policies account">
        <div class="heading-text-policies">cancellation policy</div>
      </div>
    </div>
    <div class="div-section-policies rentals legal">
      <div class="div-policy-menu rentals">
        <div class="div-content-wrapper-policies menu legal">
          <a href="/terms-and-conditions" class="menu-link-policies">Terms &amp; conditions</a>
          <a href="/privacy-policy" class="menu-link-policies">Privacy Policy</a>
          <a href="/cookie-policy" class="menu-link-policies">cookie policy</a>
          <a href="/cancellation-policy" aria-current="page" class="menu-link-policies w--current">cancellation policy</a>
          <a href="/return-policy" class="menu-link-policies">return policy</a>
          <a href="/donation-store-credit-policy" class="menu-link-policies">Donation &amp; Store Credit Policy</a>
        </div>
      </div>
      <div class="div-policy-menu">
        <div class="div-content-wrapper-policies right legal">
          <div class="policy-heading-text header">Cancellation Policy</div>
          <div class="last-revised-text-policies">Last revised and effective date: 26 June 2026</div>
          <div class="paragraph-text-policies">At Dematerialized, we believe in flexibility and transparency. This Cancellation Policy explains how you can cancel, change, or pause your membership, and how cancellations of reservations and purchases work. By using our services, you agree to this policy in addition to our <a href="/terms-and-conditions">Terms &amp; Conditions</a> and <a href="/return-policy">Return Policy</a>.</div>
          <div class="policy-heading-text no-caps">1. Membership Cancellations, Changes, and Pauses</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies">You can cancel or pause your membership by emailing us at <a href="mailto:memberships@dematerialized.nl?subject=Pause%20or%20cancel%20membership">memberships@dematerialized.nl</a> (please refer to Section 2 for further details regarding membership pauses.).</li>
            <li class="list-item-policies">You can change your membership tier by selecting the desired membership via our website at <a href="/memberships">www.dematerialized.nl/memberships</a> (you must be logged in).</li>
            <li class="list-item-policies">Cancellations and changes take effect at the end of your current billing cycle. You keep access to your membership benefits, including rentals and Store Credit, until that date.</li>
            <li class="list-item-policies">We do not issue partial or pro-rated refunds for unused days or unused Store Credit.</li>
            <li class="list-item-policies">Any active rentals must be returned on or before the date your cancellation takes effect. Alternatively, you may purchase them through your account at the discounted rate for current rental items.</li>
            <li class="list-item-policies">If rented items are not returned or purchased by the effective cancellation date, we may charge up to the discounted member purchase price for each item to your stored payment method.</li>
            <li class="list-item-policies">Upon cancellation, all remaining Store Credit is forfeited and cannot be refunded, transferred, or reinstated, even if you reactivate later.</li>
            <li class="list-item-policies">After cancellation, your account information remains accessible for up to 12 months in case you wish to reactivate, but your prior Store Credit balance will not be restored.</li>
          </ul>
          <div class="policy-heading-text">2. Pausing Your Membership</div>
          <div class="paragraph-text-policies">You may pause an active membership by emailing <a href="mailto:memberships@dematerialized.nl?subject=Pause%20membership">memberships@dematerialized.nl</a>. A pause takes effect at the end of your current billing cycle, at which point billing is suspended and your Store Credit is frozen but preserved. You may pause for up to six (6) months; we will remind you before the pause ends, and if you do not resume by then, your membership will be treated as cancelled and the Store Credit forfeiture above applies. Full pause terms can be found in our <a href="/terms-and-conditions">Terms &amp; Conditions</a> (Section 10).</div>
          <div class="policy-heading-text">3. Reservations (Local Members)</div>
          <div class="paragraph-text-policies">Reservations can be made online to try items on in-store and are held for up to seven (7) days once ready. Reservations are final once confirmed, and no-shows may be charged a €5 fee per reservation to your stored payment method. Full reservation terms can be found in our <a href="/terms-and-conditions">Terms &amp; Conditions</a> (Section 10).</div>
          <div class="policy-heading-text no-caps">4. Cancelling a Purchase (Returns)</div>
          <div class="paragraph-text-policies"><strong>In-Store Resale Purchases: </strong>As a goodwill policy, we voluntarily allow returns within 14 days in accordance with our <a href="/return-policy">Return Policy</a>.</div>
          <div class="paragraph-text-policies"><strong>Items Purchased While Renting (Via Your Account): </strong>Because these are bought through your account, they are distance purchases and carry a 14-day right of return under our <a href="/return-policy">Return Policy</a>. They may also later be donated back for Store Credit if they meet our donation criteria at the time of donation (active members only).</div>
          <div class="paragraph-text-policies">Refunds, where they apply, are issued to the original payment method as described in our <a href="/return-policy">Return Policy</a>.</div>
          <div class="policy-heading-text no-caps">5. Service Cancellations by Dematerialized</div>
          <div class="paragraph-text-policies">Dematerialized may cancel or suspend a rental, reservation, order, or membership if:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies">an item becomes unavailable or is damaged before pickup or dispatch;</li>
            <li class="list-item-policies">there is a payment or account issue that prevents fulfillment;</li>
            <li class="list-item-policies">unforeseen circumstances prevent fulfillment; or</li>
            <li class="list-item-policies">we have reason to believe you have not adhered to our <a href="/terms-and-conditions">Terms &amp; Conditions</a>, including repeated no-shows, misuse of rented items, or other non-compliance.</li>
          </ul>
          <div class="paragraph-text-policies">Because our items are secondhand and one of a kind, an item you have reserved or selected may occasionally become unavailable. If this happens, or if we cancel for reasons unrelated to misuse or non-payment, you are not entitled to compensation, though we may offer a gesture of goodwill at our discretion. If a cancellation results from a breach of our Terms, we may withhold refunds or charge for any losses, damages, or unreturned items as described in the <a href="/terms-and-conditions">Terms &amp; Conditions</a>.</div>
          <div class="policy-heading-text">6. Questions</div>
          <div class="paragraph-text-policies">If you have any questions about cancellations, feel free to reach out to our team at <a href="mailto:memberships@dematerialized.nl?subject=Membership%20inquiry">memberships@dematerialized.nl</a> (for membership-related inquiries) or <a href="mailto:info@dematerialized.nl?subject=Cancellation%20inquiry">info@dematerialized.nl</a> (for other cancellation-related inquiries)—we’re happy to help.</div>
        </div>
      </div>
    </div>
  </div>
</template>
