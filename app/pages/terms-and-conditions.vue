<script setup lang="ts">
useHead({
  title: 'Terms and Conditions',
  meta: [
    { name: 'description', content: 'By accessing or using our website https://dematerialized.nl (the "Site") and our services (“Services”), you agree to comply with and be bound by the following terms and conditions ("Terms").' },
    { property: 'og:title', content: 'Terms and Conditions' },
    { property: 'og:description', content: 'By accessing or using our website https://dematerialized.nl (the "Site") and our services (“Services”), you agree to comply with and be bound by the following terms and conditions ("Terms").' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:title', content: 'Terms and Conditions' },
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
            <a href="/terms-and-conditions" aria-current="page" class="dropdown-options-text w-dropdown-link w--current">Terms &amp; Conditions</a>
            <a href="/cancellation-policy" class="dropdown-options-text w-dropdown-link">Cancellation Policy</a>
            <a href="/return-policy" class="dropdown-options-text w-dropdown-link">Return Policy</a>
            <a href="/donation-store-credit-policy" class="dropdown-options-text w-dropdown-link">Donation &amp; Store Credit Policy</a>
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
          <a href="/terms-and-conditions" aria-current="page" class="menu-link-policies w--current">Terms &amp; conditions</a>
          <a href="/privacy-policy" class="menu-link-policies">Privacy Policy</a>
          <a href="/cookie-policy" class="menu-link-policies">cookie policy</a>
          <a href="/cancellation-policy" class="menu-link-policies">cancellation policy</a>
          <a href="/return-policy" class="menu-link-policies">return policy</a>
          <a href="/donation-store-credit-policy" class="menu-link-policies">Donation &amp; Store Credit Policy</a>
        </div>
      </div>
      <div class="div-policy-menu">
        <div class="div-content-wrapper-policies right legal">
          <div class="policy-heading-text header">Terms &amp; Conditions</div>
          <div class="last-revised-text-policies">Last revised and effective date: 26 June 2026</div>
          <div class="paragraph-text-policies">Welcome to Dematerialized! By accessing or using our website <a href="#" class="in-text-link-policies">https://dematerialized.nl</a> (the &quot;Site&quot;) and our services (&quot;Services&quot;), you agree to comply with and be bound by the following terms and conditions (&quot;Terms&quot;). These Terms also serve as our Terms of Use and govern your access to and use of the Site and Services. Please read them carefully. If you do not agree with these Terms, please do not use our Site or Services.<br><br>A note on wording: where these Terms refer to &quot;month,&quot; &quot;monthly,&quot; or &quot;per month&quot; in connection with a membership (for example, the number of shipments included), this means your recurring <strong>billing cycle</strong>, which begins on the date your membership renews each period.</div>
          <div class="policy-heading-text no-caps">1. Acceptance of Terms</div>
          <div class="paragraph-text-policies">By using our Site and Services, you affirm that you are at least 18 years old or have reached the age of majority in your jurisdiction. If you are under 18, you may use our Services only with the involvement of a parent or guardian.</div>
          <div class="policy-heading-text">2. about dematerialized</div>
          <div class="paragraph-text-policies">Dematerialized (&quot;Dematerialized&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a membership-based shared closet for women&#x27;s clothing in the Netherlands, combining rentals, donations-for-credits, and purchases into a single circular model with a fully omnichannel experience. Members choose how they want to engage: online via home delivery memberships, in person at the Den Bosch showroom, or any combination of both.</div>
          <div class="paragraph-text-policies">Company Details:</div>
          <div class="div-contact-details-policies">
            <div class="div-row-contact-details">
              <div class="paragraph-text-policies contact-bold">address</div>
              <div class="paragraph-text-policies">|</div>
              <div class="paragraph-text-policies">Lange Putstraat 4, 5211 KN Den Bosch, the Netherlands</div>
            </div>
            <div class="div-row-contact-details">
              <div class="paragraph-text-policies contact-bold">KVK</div>
              <div class="paragraph-text-policies">|</div>
              <div class="paragraph-text-policies">95760717</div>
            </div>
            <div class="div-row-contact-details">
              <div class="paragraph-text-policies contact-bold">VAT</div>
              <div class="paragraph-text-policies">|</div>
              <div class="paragraph-text-policies">NL005172570B56</div>
            </div>
            <div class="div-row-contact-details">
              <div class="paragraph-text-policies contact-bold">Email</div>
              <div class="paragraph-text-policies">|</div>
              <a href="#" class="in-text-link-policies">info@dematerialized.nl</a>
            </div>
          </div>
          <div class="policy-heading-text no-caps">3. Scope of Services</div>
          <div class="paragraph-text-policies">Dematerialized operates as a shared closet membership and resale platform that combines:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies"><strong>Memberships: </strong>Recurring subscriptions granting access to clothing rentals and member benefits. Memberships are offered in two categories: Home Delivery Memberships and Local Memberships (described in Section 10).</li>
            <li class="list-item-policies"><strong>Rentals (Members Only): </strong>Temporary use of clothing for an indefinite rental period as part of an active membership.</li>
            <li class="list-item-policies"><strong>Donations-for-Credits (Members Only):</strong> Members can earn Store Credits via accepted donations and use them to purchase items from the collection that they would like to keep. See our <a href="/donation-store-credit-policy">Donation &amp; Store Credit Policy</a> for full details.</li>
            <li class="list-item-policies"><strong>Sales: </strong>Direct purchase of secondhand items to keep, available both in-store and online. In-store purchases are open to everyone, though some items are reserved for members (see Section 11). The only possible online purchase, made through a member account, is the purchase of an item you are currently renting. Store Credit can be used toward purchases both in-store and through your account (see Sections 11 and 12).</li>
            <li class="list-item-policies"><strong>Freebies (Members Only): </strong>From time to time we may offer members selected items free of charge (&quot;Freebies&quot;). Freebies are a discretionary perk offered subject to availability, do not count toward your rental allotment, and become your property to keep. They are provided &quot;as is,&quot; with no warranties, and are not eligible for return, refund, or exchange. We may change or stop offering Freebies at any time.</li>
          </ul>
          <div class="policy-heading-text">4. privacy policy</div>
          <div class="paragraph-text-policies">Your use of our Site is governed by our <a href="/privacy-policy" class="in-text-link-policies">Privacy Policy</a>, which explains how we collect, use, and protect your personal information. By using the Site, you consent to the practices described there.</div>
          <div class="policy-heading-text">5. Cookies</div>
          <div class="paragraph-text-policies">Our website uses cookies and similar technologies to improve your browsing experience, analyze site traffic, and personalize content. We use non-essential cookies only with your consent, in accordance with our <a href="/cookie-policy" class="in-text-link-policies">Cookie Policy</a>.</div>
          <div class="policy-heading-text no-caps">6. License and Site Access</div>
          <div class="paragraph-text-policies">We grant you a limited, non-exclusive, non-transferable, and revocable license to access and make personal, non-commercial use of this Site and its content.</div>
          <div class="paragraph-text-policies">This license does not permit:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies">any resale or commercial use of the Site or its contents;</li>
            <li class="list-item-policies">any collection or use of product listings, descriptions, or prices;</li>
            <li class="list-item-policies">any derivative use of the Site or its contents;</li>
            <li class="list-item-policies">any downloading, copying, or use of account information for the benefit of another merchant; or</li>
            <li class="list-item-policies">any use of data mining, robots, or similar data gathering and extraction tools.</li>
          </ul>
          <div class="paragraph-text-policies">Any unauthorized use terminates the permission or license granted by Dematerialized.</div>
          <div class="policy-heading-text">7. intellectual property</div>
          <div class="paragraph-text-policies">All content on the Site, including text, graphics, logos, images, and software, is the property of Dematerialized or its content suppliers and is protected by international copyright laws. The compilation of all content on this Site is the exclusive property of Dematerialized and protected by international copyright laws.</div>
          <div class="policy-heading-text">8. electronic communications</div>
          <div class="paragraph-text-policies">When you visit our Site or send emails to us, you are communicating with us electronically. You consent to receive communications from us electronically, such as emails, texts, or notices posted on the Site. You agree that all agreements, notices, disclosures, and other communications we provide to you electronically satisfy any legal requirement that such communications be in writing.</div>
          <div class="policy-heading-text">9. your account</div>
          <div class="paragraph-text-policies">If you create an account on our Site, you are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account or password. We reserve the right to suspend or terminate accounts in cases of misuse, fraud, payment failure, or any other situation that we consider inappropriate.</div>
          <div class="policy-heading-text no-caps">10. Memberships and Rentals</div>
          <div class="div-subsection-policies">
            <div class="paragraph-text-policies section-subheading">Membership Required for Rentals</div>
            <div class="paragraph-text-policies">Only active members may rent items from Dematerialized. Renting is not available to non-members.</div>
          </div>
          <div class="div-subsection-policies">
            <div class="paragraph-text-policies section-subheading"><strong class="paragraph-text-policies section-subheading">Active Membership</strong></div>
            <div class="div-subsection-content">
              <div class="paragraph-text-policies">Your membership is &quot;active&quot; when it is in good standing and your membership fees are paid and up to date. It is not active while it is paused, while a payment is outstanding or marked unpaid, or once it has been cancelled or suspended. All membership benefits, including rentals, reservations, in-store exchanges, Freebies, and the use of Store Credit, are available only while your membership is active.</div>
              <div class="paragraph-text-policies"><em>A note on wording: We use &quot;rent,&quot; &quot;borrow,&quot; and similar words interchangeably. They mean the same thing: the temporary use of an item while your membership is active.</em></div>
            </div>
          </div>
          <div class="div-subsection-policies">
            <div class="paragraph-text-policies section-subheading"><strong class="paragraph-text-policies section-subheading">Membership Categories</strong></div>
            <div class="div-subsection-content">
              <div class="paragraph-text-policies">We offer two categories of membership, stated below. The specific items-at-a-time limit, number of included shipments, and price for each membership are shown at the point of sign-up and may be updated from time to time.</div>
              <div class="paragraph-text-policies">All members can rent from our collection, earn and use Store Credit, and access member benefits such as Freebies. The two categories below differ mainly in how you receive and exchange items, and in the number of items and shipments included.</div>
              <div class="div-container-mem-categories">
                <div class="paragraph-text-policies section-subheading"><strong class="paragraph-text-policies section-subheading">(1) Home Delivery Memberships</strong></div>
                <ul role="list" class="list-policies">
                  <li class="list-item-policies">Items are delivered to you by post, with shipping included both ways.</li>
                  <li class="list-item-policies">Each Home Delivery Membership includes a set number of items you may have in your possession at any one time, and a set number of shipments per month. Shipments renew each billing cycle and do not carry over: any shipments you do not use in a billing cycle are lost when the next cycle begins.</li>
                  <li class="list-item-policies">A shipment covers both the outbound delivery of your selected items and the return of items you are sending back. You decide which items to send back and when. You do not have to return everything in the same shipment, and you can keep some items longer than others. You may also purchase any item you are currently renting, in which case it becomes yours to keep and does not need to be returned. Purchasing a rental item frees up a rental slot, so you can rent another item in its place.</li>
                  <li class="list-item-policies">Following your order, we aim to dispatch items within one to two (1–2) business days. This is an estimate, not a guarantee, and dispatch times may vary with demand. To the extent permitted by law, we are not liable for delays in dispatch, or for delays or issues caused by the carrier once items have been handed over for shipping. If a shipment is lost in transit or is not delivered, let us know and we will check the status with the carrier. Where non-delivery is confirmed, you will not be charged for the affected items and may select replacements at no penalty.</li>
                  <li class="list-item-policies">Home Delivery members may also visit our Den Bosch showroom at any time to exchange pieces in person; an in-store exchange does not count toward your monthly shipments. Home Delivery members do not have access to the online reservation system, but if there are specific items you would like to try on during a planned showroom visit, contact us with at least two (2) business days&#x27; notice and we will do our best to have them ready.</li>
                </ul>
              </div>
              <div class="div-container-mem-categories">
                <div class="paragraph-text-policies section-subheading">(2) Local Memberships</div>
                <ul role="list" class="list-policies">
                  <li class="list-item-policies">Items are selected and exchanged in person at our Den Bosch showroom, with no shipping involved.</li>
                  <li class="list-item-policies">Each Local membership includes a set number of items you may have in your possession at any one time, as well as unlimited in-store exchanges.</li>
                  <li class="list-item-policies">Local members may reserve items online to try on in-store. Reserved items are usually ready within two (2) business days and are held for up to seven (7) days from when they become available. Reservations are final once confirmed. If you cannot make a confirmed reservation, email <a href="mailto:reservations@dematerialized.nl?subject=Reservation%20inquiry">reservations@dematerialized.nl</a>; no-shows may be subject to the fee set out in our <a href="/cancellation-policy">Cancellation Policy</a>.</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="div-subsection-policies">
            <div class="paragraph-text-policies section-subheading">Minimum Term and Flexibility</div>
            <div class="paragraph-text-policies">Memberships have a minimum term of one (1) billing cycle. After your first billing cycle you may change, pause, or cancel your membership. You can change your membership tier through your account, and the change takes effect at the end of your current billing cycle. To pause or cancel, email us at <a href="mailto:memberships@dematerialized.nl?subject=Membership%20inquiry">memberships@dematerialized.nl</a> (see &quot;Pausing Your Membership&quot; below for how pauses work). Cancellations and changes take effect at the end of your current billing cycle, and we do not issue partial or pro-rated refunds for any unused portion of a billing cycle.</div>
          </div>
          <div class="div-subsection-policies">
            <div class="paragraph-text-policies section-subheading">Billing</div>
            <div class="paragraph-text-policies">Membership fees are billed monthly in advance via our payment processor, Stripe.</div>
          </div>
          <div class="div-subsection-policies">
            <div class="paragraph-text-policies section-subheading">Pausing Your Membership</div>
            <ul role="list" class="list-policies">
              <li class="list-item-policies">You may pause an active membership by emailing us at <a href="mailto:memberships@dematerialized.nl?subject=Pause%20membership">memberships@dematerialized.nl</a>. If you ask to pause in person at the showroom, we will confirm it by email so that you and we both have the details in writing. A pause takes effect at the end of your current billing cycle, and any items you are currently renting must be returned before the pause begins.</li>
              <li class="list-item-policies">While paused, billing is suspended and you will not have access to new rentals, shipments, in-store exchanges, or reservations, and your Store Credits are frozen and cannot be used. You may resume at any time by resuming payment; when you do, your frozen Store Credit balance is restored and available to use again. Unlike cancellation, which forfeits all Store Credits permanently, pausing preserves your balance (see Section 12).</li>
              <li class="list-item-policies">You may pause for up to six (6) months. We will remind you before your pause period ends. If you do not resume by then, your membership will be treated as cancelled, and the Store Credit forfeiture in Section 12 will apply.</li>
            </ul>
          </div>
          <div class="div-subsection-policies">
            <div class="paragraph-text-policies section-subheading">Rental Period</div>
            <div class="paragraph-text-policies">Members may rent eligible items from our collection indefinitely for as long as they have an active membership. There is no fixed rental period or return deadline while your membership remains active. In the event of cancellation (including cancellation resulting from payment failure, as described below), all rented items must be returned, or purchased, by the effective date communicated to you (see our <a href="/return-policy">Return Policy</a> and <a href="/cancellation-policy">Cancellation Policy</a>).</div>
          </div>
          <div class="div-subsection-policies">
            <div class="paragraph-text-policies section-subheading">Condition of Items</div>
            <div class="paragraph-text-policies">After rental, items must be returned in good condition, with reasonable wear and tear accepted. Items showing excessive damage, stains, or alterations may result in charges up to the discounted member purchase price for that item (the amount it would cost you to buy it through your account).</div>
          </div>
          <div class="div-subsection-policies">
            <div class="paragraph-text-policies section-subheading">Loss or Damage</div>
            <div class="paragraph-text-policies">While an item is in your possession, you are responsible for it. If an item is lost, stolen, or damaged beyond repair while you have it, we may charge up to the discounted member purchase price for that item (the amount it would cost you to buy it through your account). Items in transit to you are our responsibility until they reach you, so you are never charged for an item lost before it is delivered. For return shipments, if an item is lost in transit using the return method we provide, we will work with you and the carrier in good faith and will not hold you responsible where you can show the item was dispatched.</div>
          </div>
          <div class="div-subsection-policies">
            <div class="paragraph-text-policies section-subheading">Care</div>
            <div class="paragraph-text-policies">Members agree to handle rented items with care. Items may not be altered, dyed, or otherwise modified. Washing according to the care label is permitted but not required. If the care label has been removed, you can find the care instructions in the item&#x27;s description on its &quot;My Rentals&quot; page in your account; where the instructions are listed as unknown, please use your best judgement based on guidance for similar garments. You do not need to wash an item before returning it. As part of your membership, we clean every item when it comes back, including items you tell us you have already washed.</div>
          </div>
          <div class="div-subsection-policies">
            <div class="paragraph-text-policies section-subheading">Payment Failure &amp; Authorization to Charge</div>
            <div class="div-subsection-content">
              <div class="paragraph-text-policies">Membership fees are collected automatically by Stripe. If a payment fails, Stripe will automatically re-attempt the charge several times over a period of up to fourteen (14) days. While a payment remains outstanding, your membership benefits are paused: we will not dispatch new shipments, process in-store exchanges, or hold reservations, and your Store Credits cannot be used, until payment is received. Any items you are already renting may remain with you during this period. If all automatic retry attempts are unsuccessful, your subscription is marked as unpaid and your membership is suspended. We will then contact you directly to resolve the outstanding balance. Your membership can be reactivated if payment is completed; if the balance is not resolved, your membership will be treated as ended, and all rented items must be returned (or purchased at the discounted rate for current rental items) within fourteen (14) days of the notice we send you. If items are not returned or purchased within that period, we may charge the discounted member purchase price for each outstanding item to your stored payment method.</div>
              <div class="paragraph-text-policies">By providing a payment method and maintaining a membership, you authorize Dematerialized to charge that payment method on a recurring basis for membership fees and, on an off-session basis (without requiring you to be present or to take further action), for amounts you owe under these Terms. This includes, without limitation, reservation no-show fees and the amounts payable for items that are lost, stolen, damaged beyond repair, or not returned, as described in the Loss or Damage and Condition of Items sections. We will notify you of any such charge.</div>
              <div class="paragraph-text-policies">See our <a href="/cancellation-policy">Cancellation Policy</a> and <a href="/return-policy">Return Policy</a> for more information.</div>
            </div>
          </div>
          <div class="policy-heading-text">11. purchases</div>
          <div class="div-subsection-policies">
            <div class="paragraph-text-policies section-subheading">Resale (In-Store)</div>
            <div class="paragraph-text-policies">Secondhand items may be purchased in our physical store. In-store resale is open to everyone, member or not. Some items, however, are reserved for members and are not available for purchase by non-members; these are kept in a designated members-only area of the showroom. For example, newly added items are made available to members first, so members have the chance to rent them before they become available for general sale. Members may pay in-store by card, with Store Credit, or a combination of the two; non-members pay by card. We do not accept cash payments.</div>
          </div>
          <div class="div-subsection-policies">
            <div class="paragraph-text-policies section-subheading">Member Purchase of Rented Items (via Member Account)</div>
            <ul role="list" class="list-policies">
              <li class="list-item-policies">Members may choose to purchase an item they are currently renting, at the discounted rate for current rental items, through their account. Payment can be made by card, with Store Credit, or a combination of the two. Because this purchase is made through your account, you may return it within 14 days in line with our <a href="/return-policy">Return Policy</a>.</li>
              <li class="list-item-policies">Returns can be made in-store at no cost, or by post. If you are an active member with an included shipment available, you may send the item back as part of that shipment at no extra cost. If you no longer have an active membership, or have no included shipments remaining, you are responsible for the cost of return shipping.</li>
              <li class="list-item-policies">We will issue your refund within 14 days of being notified of your return. We may wait to refund until we have received the item back, or you have provided proof that you have sent it, whichever happens first. If the item is returned with damage beyond what results from normal handling, measured against its condition when you purchased it, we may reduce your refund to reflect the loss in value.</li>
              <li class="list-item-policies">A purchased item may also later be donated back to Dematerialized for Store Credit if it meets our donation acceptance criteria at the time of donation (applicable for active members only).</li>
            </ul>
          </div>
          <div class="div-subsection-policies">
            <div class="paragraph-text-policies section-subheading">Returns</div>
            <div class="paragraph-text-policies">In-store resale purchases are not subject to the statutory right of withdrawal, which applies only to distance and off-premises sales; as a goodwill policy, Dematerialized voluntarily allows returns of eligible in-store purchases within 14 days. Purchases made through your account, including rental buyouts, are distance purchases and carry a 14-day right of return. In both cases, see our <a href="/return-policy">Return Policy</a> for the full process and conditions.</div>
          </div>
          <div class="policy-heading-text">12. Store credits</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies"><strong>Definition: </strong>Store Credits are a non-monetary benefit of active membership that can be applied toward eligible purchases within Dematerialized. They are not money or legal tender, are not a prepaid or stored-value voucher, and have no value outside Dematerialized.</li>
            <li class="list-item-policies"><strong>Earning Credits: </strong>Members can earn Store Credits by donating accepted items, through promotions, or through other programs we offer. Store Credit is awarded at our discretion as a token of appreciation for accepted donations; the amount may take into account factors such as an item&#x27;s condition and type, but it does not represent the item&#x27;s market value, resale value, or purchase price. Full details are set out in our <a href="/donation-store-credit-policy">Donation &amp; Store Credit Policy</a>.</li>
            <li class="list-item-policies"><strong>Use of Credits: </strong>Store Credits may be used as full or partial payment for eligible transactions on our website or in-store. They cannot be exchanged for cash, refunded, or transferred to another person.</li>
            <li class="list-item-policies"><strong>Value: </strong>For use within Dematerialized, each Store Credit has a redemption value of one euro (€1), shown this way in your account so you can see what your balance covers. Dematerialized may adjust the credit system or usage conditions in future, provided any material changes are communicated in advance.</li>
            <li class="list-item-policies"><strong>Expiry, Pausing, and Forfeiture: </strong>Store Credits do not expire as long as you have an active membership. If you pause your membership, your Store Credits are frozen and cannot be used while paused, but they are preserved and become available again when you resume. All Store Credits are forfeited upon membership cancellation. Forfeited credits will not be reinstated under any circumstances, even if you later start a new membership.</li>
            <li class="list-item-policies"><strong>Adjustment Rights: </strong>Dematerialized may adjust or revoke Store Credits if they were issued in error, misused, or if donated items are later deemed unsuitable after further inspection. You will be notified accordingly.</li>
          </ul>
          <div class="policy-heading-text no-caps">13. Product Descriptions and Availability</div>
          <div class="paragraph-text-policies">We strive to be as accurate as possible. However, we do not warrant that product descriptions or other content on this Site are accurate, complete, reliable, current, or error-free. If a product offered by Dematerialized is not as described, your sole remedy is to return it to us in accordance with our <a href="/return-policy">Return Policy</a>.</div>
          <div class="paragraph-text-policies">Because our items are secondhand and each piece is one of a kind, availability can change at any time, and all items are offered subject to availability. An item you have reserved or selected may occasionally become unavailable before it reaches you, for example if it turns out to be more damaged than its listing indicated and is no longer in rentable condition, or if it can no longer be located. If this happens, we will let you know and you are welcome to choose another item. You are not entitled to compensation in these cases, although we may offer a gesture of goodwill at our discretion.</div>
          <div class="policy-heading-text no-caps">14. Disclaimer of Warranties and Limitation of Liability</div>
          <div class="paragraph-text-policies">This Site and all information, content, materials, products, and services included on or otherwise made available to you through this Site are provided by Dematerialized on an &quot;as is&quot; and &quot;as available&quot; basis, unless otherwise specified in writing. Dematerialized makes no representations or warranties of any kind, express or implied, as to the operation of this Site or the information, content, materials, products, or services included on or otherwise made available to you through this Site, unless otherwise specified in writing. You expressly agree that your use of this Site is at your sole risk.</div>
          <div class="paragraph-text-policies">To the full extent permissible by applicable law, Dematerialized disclaims all warranties, express or implied, including, but not limited to, implied warranties of merchantability and fitness for a particular purpose. Dematerialized does not warrant that this Site; information, content, materials, products, or services included on or otherwise made available to you through this Site; their servers; or electronic communications sent from Dematerialized are free of viruses or other harmful components. Dematerialized will not be liable for any damages of any kind arising from the use of this Site or from any information, content, materials, products, or services included on or otherwise made available to you through this Site, including, but not limited to direct, indirect, incidental, punitive, and consequential damages, unless otherwise specified in writing. Nothing in these Terms limits or excludes any liability that cannot be limited or excluded under applicable mandatory law, including your statutory rights as a consumer.</div>
          <div class="policy-heading-text">15. disputes</div>
          <div class="paragraph-text-policies">The laws of the Netherlands, without regard to principles of conflict of laws, will govern these Terms and any dispute of any sort that might arise between you and Dematerialized. Disputes will be submitted to the competent court in &#x27;s-Hertogenbosch, unless mandatory law provides otherwise. If you are a consumer resident in the EU, you may also submit a dispute to the European Commission&#x27;s Online Dispute Resolution platform at <a href="https://ec.europa.eu/consumers/odr" target="_blank">https://ec.europa.eu/consumers/odr</a>.</div>
          <div class="policy-heading-text no-caps">16. Site Policies, Modification, and Severability</div>
          <div class="paragraph-text-policies">Please review our other policies, such as our <a href="/privacy-policy" class="in-text-link-policies">Privacy Policy</a>, posted on this Site. These policies also govern your use of the Site. We reserve the right to make changes to our Site, policies, and these Terms at any time. If any of these Terms shall be deemed invalid, void, or for any reason unenforceable, that term shall be deemed severable and shall not affect the validity and enforceability of any remaining terms.</div>
          <div class="policy-heading-text">17. contact information</div>
          <div class="paragraph-text-policies">If you have any questions regarding these Terms, please contact us at:</div>
          <div class="div-contact-details-policies">
            <div class="div-row-contact-details">
              <div class="paragraph-text-policies contact-bold">Email</div>
              <div class="paragraph-text-policies">|</div>
              <div class="paragraph-text-policies">info@dematerialized.nl</div>
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
          <div class="last-revised-text-policies">By using our Site and services, you agree to these Terms and Conditions.</div>
        </div>
      </div>
    </div>
  </div>
</template>
