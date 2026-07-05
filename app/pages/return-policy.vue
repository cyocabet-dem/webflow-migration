<script setup lang="ts">
useHead({
  title: 'Return Policy | Dematerialized',
  meta: [
    { name: 'description', content: 'We want every member and customer to feel confident when using our shared closet. This Return Policy explains how returns work for rentals, purchases, and donations made through our platform or in our store.' },
    { property: 'og:title', content: 'Return Policy | Dematerialized' },
    { property: 'og:description', content: 'We want every member and customer to feel confident when using our shared closet. This Return Policy explains how returns work for rentals, purchases, and donations made through our platform or in our store.' },
    { name: 'twitter:title', content: 'Return Policy | Dematerialized' },
    { name: 'twitter:description', content: 'We want every member and customer to feel confident when using our shared closet. This Return Policy explains how returns work for rentals, purchases, and donations made through our platform or in our store.' },
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
            <div class="dropdown-label-policies">Return Policy</div>
            <div class="dropdown-chevron-policies w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down">
                <path d="m6 9 6 6 6-6"></path>
              </svg></div>
          </div>
          <nav class="dropdown-list-policies w-dropdown-list" :class="{ 'w--open': policyDropdownOpen }">
            <a href="/privacy-policy" class="dropdown-options-text w-dropdown-link">Privacy Policy</a>
            <a href="/cookie-policy" class="dropdown-options-text w-dropdown-link">Cookie Policy</a>
            <a href="/terms-and-conditions" class="dropdown-options-text w-dropdown-link">Terms &amp; Conditions</a>
            <a href="/cancellation-policy" class="dropdown-options-text w-dropdown-link">Cancellation Policy</a>
            <a href="/return-policy" aria-current="page" class="dropdown-options-text w-dropdown-link w--current">Return Policy</a>
            <a href="/donation-store-credit-policy" class="dropdown-options-text w-dropdown-link">Donation &amp; Store Credit Policy</a>
          </nav>
        </div>
      </div>
      <div class="div-heading-content-policies account">
        <div class="heading-text-policies">return policy</div>
      </div>
    </div>
    <div class="div-section-policies rentals">
      <div class="div-policy-menu rentals">
        <div class="div-content-wrapper-policies menu legal">
          <a href="/terms-and-conditions" class="menu-link-policies">Terms &amp; conditions</a>
          <a href="/privacy-policy" class="menu-link-policies">Privacy Policy</a>
          <a href="/cookie-policy" class="menu-link-policies">cookie policy</a>
          <a href="/cancellation-policy" class="menu-link-policies">cancellation policy</a>
          <a href="/return-policy" aria-current="page" class="menu-link-policies w--current">return policy</a>
          <a href="/donation-store-credit-policy" class="menu-link-policies">Donation &amp; Store Credit Policy</a>
        </div>
      </div>
      <div class="div-policy-menu">
        <div class="div-content-wrapper-policies right legal">
          <div class="policy-heading-text header">Return Policy</div>
          <div class="last-revised-text-policies">Last revised and effective date: 26 June 2026</div>
          <div class="paragraph-text-policies">We want every member and customer of Dematerialized to feel confident using our shared closet. This Return Policy explains how returns work for rentals, purchases, and donations. It applies in addition to our <a href="/terms-and-conditions">Terms &amp; Conditions</a> and <a href="/cancellation-policy">Cancellation Policy</a>.</div>
          <div class="policy-heading-text no-caps">1. Where to Return</div>
          <div class="paragraph-text-policies">Where you return depends on your membership:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies"><strong>Home Delivery members</strong> can return items by post, using the return method provided with their shipment, or in-store. This applies to rentals, resale purchases, and items purchased while renting. If you have no shipments remaining in your current cycle, you are responsible for the cost of return postage (applicable for cancelled memberships only).</li>
            <li class="list-item-policies"><strong>Local members</strong> return rentals and resale purchases in-store. An item purchased while renting, since it is bought through your account (distance sale), can be returned in-store or by post. You are responsible for the cost of return shipping in the latter scenario.</li>
            <li class="list-item-policies"><strong>Non-members</strong> return their resale purchases in-store.</li>
          </ul>
          <div class="policy-heading-text no-caps">2. Returning a Rental</div>
          <div class="paragraph-text-policies">You can keep rented items for as long as your membership is active. There is no fixed rental period or return deadline while your membership remains active; return an item whenever you no longer want it. If your membership is cancelled, all rented items must be returned, or purchased, by the date your cancellation takes effect (see our <a href="/cancellation-policy">Cancellation Policy</a>).</div>
          <div class="paragraph-text-policies">Items must be returned in good condition, with normal wear accepted, and may not be altered, dyed, or otherwise modified. You do not need to wash an item before returning it; we clean every item when it comes back (included in your membership).</div>
          <div class="paragraph-text-policies">While an item is in your possession, you are responsible for it. If it is lost, stolen, or damaged beyond repair while you have it, we may charge up to the discounted member purchase price (the amount it would cost you to buy it through your account). Items in transit to you are our responsibility until they reach you, and for return shipments using the method we provide, we will not hold you responsible for an item lost in transit where you can show it was dispatched.</div>
          <div class="policy-heading-text no-caps">3. Returning a Purchase</div>
          <div class="paragraph-text-policies"><strong>In-Store Resale Purchases: </strong>As a goodwill policy, we allow returns of eligible in-store purchases within 14 days, provided the item is in the same condition as when sold, with the tag still attached, and you present the original receipt. Refunds are issued to the original payment method within 14 days of receiving the returned item. Items marked as final sale, and Freebies, cannot be returned or refunded.</div>
          <div class="paragraph-text-policies"><strong>Items Purchased While Renting (Via Your Account):</strong> Because this purchase is made through your account, it is a distance purchase and carries a 14-day right of return. Therefore, you may return it within 14 days of purchase, in the same condition it was in when you bought it. Home Delivery members with a shipment remaining can return it by post at no extra cost as part of that shipment; otherwise, whether you are a Local member or a Home Delivery member who has used all shipments, you either cover the return postage or return it in-store. We will issue your refund within 14 days of being notified, and may wait until we have received the item back, or you have provided proof that you have sent it, whichever is first. If the item comes back with damage beyond normal handling, measured against its condition when you purchased it, we may reduce your refund to reflect the loss in value. An item purchased this way may later be donated back for Store Credit if it meets our donation criteria (active members only).</div>
          <div class="policy-heading-text no-caps">4. Donations and Store Credit</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies">Donated items become the property of Dematerialized upon acceptance and will not be returned.</li>
            <li class="list-item-policies">Members who donate accepted items may receive Store Credit at our discretion as a token of appreciation, as described in our <a href="/donation-store-credit-policy">Donation &amp; Store Credit Policy</a>.</li>
            <li class="list-item-policies">Donated items must be clean, and we may refuse donations that do not meet our quality standards for whatever reason.</li>
          </ul>
          <div class="policy-heading-text no-caps">5. Damaged or Incorrect Items</div>
          <div class="paragraph-text-policies">If you believe an item you purchased or are currently renting is defective or incorrect, please notify us within 48 hours of receiving it (within 48 hours of pickup for in-store items, or of delivery for items received by post) by emailing <a href="mailto:info@dematerialized.nl?subject=Damaged%20or%20incorrect%20item">info@dematerialized.nl</a>. We will inspect the item and, if confirmed, offer a replacement or fair compensation depending on the situation.</div>
          <div class="policy-heading-text">6. Questions</div>
          <div class="paragraph-text-policies">If you have any questions about returns, feel free to reach out to our team at <a href="mailto:info@dematerialized.nl?subject=Question%20Regarding%20Cancellations" class="in-text-link-policies">info@dematerialized.nl</a>—we’re happy to help.</div>
        </div>
      </div>
    </div>
  </div>
</template>
