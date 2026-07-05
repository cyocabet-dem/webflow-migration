<script setup lang="ts">
useHead({
  title: 'Donation & Store Credit Policy',
  meta: [
    { name: 'description', content: 'By accessing or using our website https://dematerialized.nl (the "Site") and our services (“Services”), you agree to comply with and be bound by the following terms and conditions ("Terms").' },
    { property: 'og:title', content: 'Donation & Store Credit Policy' },
    { property: 'og:description', content: 'By accessing or using our website https://dematerialized.nl (the "Site") and our services (“Services”), you agree to comply with and be bound by the following terms and conditions ("Terms").' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:title', content: 'Donation & Store Credit Policy' },
    { name: 'twitter:description', content: 'By accessing or using our website https://dematerialized.nl (the "Site") and our services (“Services”), you agree to comply with and be bound by the following terms and conditions ("Terms").' },
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
            <div class="dropdown-label-policies">Terms &amp; conditions<br></div>
            <div class="dropdown-chevron-policies w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down">
                <path d="m6 9 6 6 6-6"></path>
              </svg></div>
          </div>
          <nav class="dropdown-list-policies w-dropdown-list" :class="{ 'w--open': policyDropdownOpen }">
            <a href="/privacy-policy" class="dropdown-options-text w-dropdown-link">Privacy Policy</a>
            <a href="/cookie-policy" class="dropdown-options-text w-dropdown-link">Cookie Policy</a>
            <a href="/terms-and-conditions" class="dropdown-options-text w-dropdown-link">Terms &amp; Conditions</a>
            <a href="/cancellation-policy" class="dropdown-options-text w-dropdown-link">Cancellation Policy</a>
            <a href="/return-policy" class="dropdown-options-text w-dropdown-link">Return Policy</a>
            <a href="/donation-store-credit-policy" aria-current="page" class="dropdown-options-text w-dropdown-link w--current">Donation &amp; Store Credit Policy</a>
          </nav>
        </div>
      </div>
      <div class="div-heading-content-policies account">
        <div class="heading-text-policies">terms &amp; conditions</div>
      </div>
    </div>
    <div class="div-section-policies rentals legal">
      <div class="div-policy-menu rentals">
        <div class="div-content-wrapper-policies menu legal">
          <a href="/terms-and-conditions" class="menu-link-policies">Terms &amp; conditions</a>
          <a href="/privacy-policy" class="menu-link-policies">Privacy Policy</a>
          <a href="/cookie-policy" class="menu-link-policies">cookie policy</a>
          <a href="/cancellation-policy" class="menu-link-policies">cancellation policy</a>
          <a href="/return-policy" class="menu-link-policies">return policy</a>
          <a href="/donation-store-credit-policy" aria-current="page" class="menu-link-policies w--current">Donation &amp; Store Credit Policy</a>
        </div>
      </div>
      <div class="div-policy-menu">
        <div class="div-content-wrapper-policies right legal">
          <div class="policy-heading-text header">Donation &amp; Store Credit Policy</div>
          <div class="last-revised-text-policies">Last revised and effective date: 26 June 2026</div>
          <div class="paragraph-text-policies">At Dematerialized, donations keep our shared closet going and help give clothing a longer life. This Donation &amp; Store Credit Policy explains what happens when you donate items to us, the rights you and Dematerialized have, and how Store Credit is earned, used, and lost. By donating items or using Store Credit, you agree to this policy in addition to our <a href="/terms-and-conditions">Terms &amp; Conditions</a>, <a href="/return-policy">Return Policy</a>, and <a href="/cancellation-policy">Cancellation Policy</a>.</div>
          <div class="policy-heading-text">1. What A Donation Is</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies">A donation is a voluntary and final transfer of clothing or other items to Dematerialized.</li>
            <li class="list-item-policies">When you donate an item and we accept it, ownership of that item transfers fully and irrevocably to Dematerialized. The donation is complete and final at that point.</li>
            <li class="list-item-policies">You give up all rights to the donated item. You cannot reclaim it, and you have no further claim to it, regardless of whether we later resell, rent, repair, recycle, donate it onward, or dispose of it, and regardless of any Store Credit you may receive.</li>
            <li class="list-item-policies">A donation is not a sale. Any Store Credit awarded is a discretionary gesture of appreciation, not a purchase price or payment for the item (see Section 4). If you are looking to sell your clothing for money, other channels such as resale platforms or consignment stores are better suited to that purpose.</li>
          </ul>
          <div class="policy-heading-text">2. What You Confirm When You Donate</div>
          <div class="paragraph-text-policies">By donating an item to us, you confirm that:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies">you are the lawful owner of the item, or are otherwise authorized to donate it;</li>
            <li class="list-item-policies">the item is not counterfeit, stolen, or subject to any third-party rights or claims;</li>
            <li class="list-item-policies">the item is clean; and</li>
            <li class="list-item-policies">you have removed all personal belongings from the item.</li>
          </ul>
          <div class="policy-heading-text no-caps">3. Acceptance, Rejection, and Use of Donated Items</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies">Donations are made in person at our Den Bosch showroom and are subject to inspection and acceptance at our sole discretion. We are not obliged to accept any item, and donated items must be clean.</li>
            <li class="list-item-policies">We typically accept everything (except socks and underwear), but if for some reason we do not accept an item, we will let you know within a reasonable timeframe. You can take it back, or, with your agreement, we will responsibly recycle or donate it onward on your behalf.</li>
            <li class="list-item-policies">Once an item is accepted, we may resell, rent, repair, recycle, donate it onward, or dispose of it as we see fit, in line with the transfer of ownership described in Section 1.</li>
          </ul>
          <div class="policy-heading-text">4. How Store Credit Works</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies">Store Credit is a non-monetary benefit of active membership that can be applied toward eligible purchases within Dematerialized, in-store and through your account. It is not money or legal tender, nor is it a prepaid or stored-value voucher. It has no value outside Dematerialized.</li>
            <li class="list-item-policies">For use within Dematerialized, each Store Credit has a redemption value of one euro (€1), shown this way in your account so you can see what your balance covers.</li>
            <li class="list-item-policies">Store Credit is awarded at our discretion as a token of appreciation for accepted donations, and may also be earned through promotions or other programs we offer. The amount may take into account factors such as an item&#x27;s condition and type, but it does not represent the market value, resale value, or purchase price of the donated item.</li>
            <li class="list-item-policies">Store Credit cannot be exchanged for cash, refunded, or transferred or sold to another person.</li>
          </ul>
          <div class="policy-heading-text no-caps">5. Earning, Holding, and Losing Store Credit</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies"><strong>Active Membership: </strong>Store Credit can be earned and used only while you have an active membership.</li>
            <li class="list-item-policies"><strong>No Expiry While Active: </strong>Store Credit does not expire as long as your membership remains active.</li>
            <li class="list-item-policies"><strong>Pausing: </strong>If you pause your membership, your Store Credit is frozen and cannot be used while paused, but it is preserved and becomes available again when you resume (please refer to our <a href="/cancellation-policy">Cancellation Policy</a> for further details regarding membership pauses).</li>
            <li class="list-item-policies"><strong>Cancellation: </strong>All Store Credit is forfeited upon membership cancellation. Forfeited credit will not be reinstated, refunded, transferred, or restored under any circumstances, even if you start a new membership later (please refer to our <a href="/cancellation-policy">Cancellation Policy</a> for further details regarding membership cancellations).</li>
          </ul>
          <div class="policy-heading-text no-caps">6. Adjustments and Corrections</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies">We may adjust, withhold, or revoke Store Credit if it was issued in error, if it was obtained through misuse or fraud, or if a donated item is later found to be unsuitable, for example where it has an undisclosed defect, is counterfeit, or is otherwise not as represented at the time of donation. We will notify you of any such adjustment.</li>
            <li class="list-item-policies">We may adjust the overall Store Credit system or the terms of this policy in the future. Any material changes will be communicated in advance.</li>
          </ul>
          <div class="policy-heading-text">7. Questions</div>
          <div class="paragraph-text-policies">If you have any questions about donations or Store Credit, feel free to reach out to our team at <a href="mailto:info@dematerialized.nl?subject=Donation%20and%20store%20credit%20inquiry">info@dematerialized.nl</a>—we’re happy to help.</div>
        </div>
      </div>
    </div>
  </div>
</template>
