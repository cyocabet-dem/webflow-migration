<script setup lang="ts">
useHead({
  title: 'Privacy Policy',
  meta: [
    { name: 'description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { property: 'og:title', content: 'Privacy Policy' },
    { property: 'og:description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:title', content: 'Privacy Policy' },
    { name: 'twitter:description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
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
            <div class="dropdown-label-policies">Privacy policy</div>
            <div class="dropdown-chevron-policies w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down">
                <path d="m6 9 6 6 6-6"></path>
              </svg></div>
          </div>
          <nav class="dropdown-list-policies w-dropdown-list" :class="{ 'w--open': policyDropdownOpen }">
            <a href="/privacy-policy" aria-current="page" class="dropdown-options-text w-dropdown-link w--current">Privacy Policy</a>
            <a href="/cookie-policy" class="dropdown-options-text w-dropdown-link">Cookie Policy</a>
            <a href="/terms-and-conditions" class="dropdown-options-text w-dropdown-link">Terms &amp; Conditions</a>
            <a href="/cancellation-policy" class="dropdown-options-text w-dropdown-link">Cancellation Policy</a>
            <a href="/return-policy" class="dropdown-options-text w-dropdown-link">Return Policy</a>
            <a href="/donation-store-credit-policy" class="dropdown-options-text w-dropdown-link">Donation &amp; Store Credit Policy</a>
          </nav>
        </div>
      </div>
      <div class="div-heading-content-policies account">
        <div class="heading-text-policies">Privacy Policy</div>
      </div>
    </div>
    <div class="div-section-policies rentals legal">
      <div class="div-policy-menu rentals">
        <div class="div-content-wrapper-policies menu legal">
          <a href="/terms-and-conditions" class="menu-link-policies">Terms &amp; conditions</a>
          <a href="/privacy-policy" aria-current="page" class="menu-link-policies w--current">Privacy Policy</a>
          <a href="/cookie-policy" class="menu-link-policies">cookie policy</a>
          <a href="/cancellation-policy" class="menu-link-policies">cancellation policy</a>
          <a href="/return-policy" class="menu-link-policies">return policy</a>
          <a href="/donation-store-credit-policy" class="menu-link-policies">Donation &amp; Store Credit Policy</a>
        </div>
      </div>
      <div class="div-policy-menu">
        <div class="div-content-wrapper-policies right legal">
          <div class="policy-heading-text header">Privacy Policy</div>
          <div class="last-revised-text-policies">Last revised and effective date: 26 June 2026</div>
          <div class="paragraph-text-policies">Welcome to Dematerialized! Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data. This privacy policy, along with any related materials referenced within, outlines:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies">The personal data we collect or receive through: 1.) the website <a href="#https://dematerialized.nl" target="_blank" class="in-text-link-policies">https://dematerialized.nl</a> (“Site”) and 2.) other Dematerialized products or services and all other forms of communication, such as email or phone (collectively, “Services”);</li>
            <li class="list-item-policies">How we use this information; and</li>
            <li class="list-item-policies">The steps we take to safeguard it.<br></li>
          </ul>
          <div class="paragraph-text-policies">We rely on your personal data, among other purposes, to run our business and provide the Services to you. Please take the time to review this privacy policy carefully before using the Services. If you do not agree with how we collect or use your information as outlined here, we advise you not to use the Services.</div>
          <div class="policy-heading-text">1. Who We Are</div>
          <div class="paragraph-text-policies">Dematerialized (referred to as &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the Services, and we are the data controller responsible for your personal data. Our registered address is Lange Putstraat 4, 5211 KN Den Bosch, the Netherlands. You can contact us at <a href="mailto:info@dematerialized.nl">info@dematerialized.nl</a> or +31 6 246 73835.</div>
          <div class="policy-heading-text">2. Information we collect</div>
          <div class="paragraph-text-policies">We collect and process the following types of personal data:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies"><strong>Contact Information: </strong>Name, email address, delivery/shipping address, phone number.</li>
            <li class="list-item-policies"><strong>Account Information: </strong>Username, password, membership type, size profile, and preferences.</li>
            <li class="list-item-policies"><strong>Transaction Details:</strong> Payment information, membership and order history, rental and donation history, and Store Credit balances.<br></li>
            <li class="list-item-policies"><strong>Technical Information: </strong>IP address, device type, browser type, cookies, and online identifiers.<br></li>
            <li class="list-item-policies"><strong>User-Generated Content: </strong>Reviews, comments, and other interactions.<br></li>
          </ul>
          <div class="paragraph-text-policies">We only collect data necessary for the purposes outlined in this policy. Payment card details are processed by our payment provider, Stripe, and your login credentials are handled by our authentication provider; neither is stored by us directly.</div>
          <div class="policy-heading-text">3. how we use your information</div>
          <div class="paragraph-text-policies">We process your data to:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies">Provide and improve our services;</li>
            <li class="list-item-policies">Fulfill orders, ship and receive items, and manage memberships, rentals, reservations, donations, and Store Credits;</li>
            <li class="list-item-policies">Process payments, including recurring and authorized off-session charges, and prevent fraud;<br></li>
            <li class="list-item-policies">Send marketing and promotional content (with your consent);<br></li>
            <li class="list-item-policies">Respond to inquiries and provide customer support; and<br></li>
            <li class="list-item-policies">Comply with legal obligations, including tax and accounting requirements.<br></li>
          </ul>
          <div class="paragraph-text-policies">Some of this data is necessary to provide the Services or to perform our contract with you, for example to manage your membership, process payments, or ship items. If you choose not to provide it, we may be unable to offer you those Services. We do not make decisions about you based solely on automated processing that produce legal or similarly significant effects.</div>
          <div class="policy-heading-text no-caps">4. Legal Basis for Processing</div>
          <div class="paragraph-text-policies">Under GDPR, we process your data based on:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies"><strong>Consent: </strong>For sending marketing materials, setting non-essential cookies, or processing sensitive data.</li>
            <li class="list-item-policies"><strong>Contractual Necessity: </strong>To provide services, manage your membership, and fulfill orders.</li>
            <li class="list-item-policies"><strong>Legal Obligation: </strong>To comply with legal requirements, such as retaining invoices for tax purposes.<br></li>
            <li class="list-item-policies"><strong>Legitimate Interest:</strong> For fraud prevention, website functionality, or business analysis.<br></li>
          </ul>
          <div class="policy-heading-text">5. sharing your information</div>
          <div class="paragraph-text-policies">We may share your personal data with:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies"><strong>Service Providers:</strong> Payment processors (e.g., Stripe), delivery and shipping partners (e.g., PostNL and our shipping software provider), accounting software, and IT support, acting as our processors.</li>
            <li class="list-item-policies"><strong>Analytics and Advertising Providers: </strong>For example, Google (analytics) and Meta (advertising and measurement), where you have given the relevant consent.</li>
            <li class="list-item-policies"><strong>Legal Authorities: </strong>When required to comply with the law.<br></li>
            <li class="list-item-policies"><strong>Third Parties: </strong>In the event of a business merger, acquisition, or sale.<br></li>
          </ul>
          <div class="paragraph-text-policies">We ensure all third parties adhere to GDPR standards for data protection.</div>
          <div class="policy-heading-text">6. data retention</div>
          <div class="paragraph-text-policies">We retain your personal data only as long as necessary for the purposes outlined in this policy or as required by law. In particular:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies">Account information is retained for up to 12 months after your membership is cancelled, in case you wish to reactivate, after which it is deleted or anonymized unless we are required to keep it.</li>
            <li class="list-item-policies">Transaction, invoice, and accounting records are retained for as long as required under Dutch tax law (currently a minimum of 7 years).</li>
            <li class="list-item-policies">Marketing data is retained until you withdraw consent or object.</li>
          </ul>
          <div class="paragraph-text-policies">When data is no longer needed, it is securely deleted or anonymized.</div>
          <div class="policy-heading-text">7. your rights</div>
          <div class="paragraph-text-policies">You have the following rights under GDPR:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies"><strong>Access: </strong>Request a copy of your personal data.</li>
            <li class="list-item-policies"><strong>Correction:</strong> Update or correct your data.</li>
            <li class="list-item-policies"><strong>Erasure: </strong>Request deletion of your data (“Right to be Forgotten”).<br></li>
            <li class="list-item-policies"><strong>Restriction:</strong> Limit processing of your data.<br></li>
            <li class="list-item-policies"><strong>Data Portability: </strong>Receive your data in a portable format.<br></li>
            <li class="list-item-policies"><strong>Objection: </strong>Object to certain data uses, such as marketing.<br></li>
            <li class="list-item-policies"><strong>Withdraw Consent: </strong>Revoke consent at any time.<br></li>
          </ul>
          <div class="paragraph-text-policies">To exercise these rights, contact us at <a href="mailto:info@dematerialized.nl?subject=Privacy%20Request" class="in-text-link-policies">info@dematerialized.nl</a>.</div>
          <div class="policy-heading-text no-caps">8. Cookies and Tracking Technologies</div>
          <div class="paragraph-text-policies">We use cookies and similar technologies to:</div>
          <ul role="list" class="list-policies">
            <li class="list-item-policies">Enhance website functionality.</li>
            <li class="list-item-policies">Analyze user behavior for optimization.</li>
            <li class="list-item-policies">Deliver personalized content.<br></li>
          </ul>
          <div class="paragraph-text-policies">We use non-essential cookies only with your consent. For more details, see our <a href="/cookie-policy">Cookie Policy</a> or adjust your cookie settings in your browser.</div>
          <div class="policy-heading-text">9. international data transfers</div>
          <div class="paragraph-text-policies">Some of our service providers, including certain analytics and advertising partners, are based outside the European Economic Area (EEA), including in the United States. Where we transfer your personal data outside the EEA, we rely on appropriate safeguards, such as the European Commission&#x27;s Standard Contractual Clauses or transfers to providers certified under the EU-US Data Privacy Framework.</div>
          <div class="policy-heading-text">10. security measures</div>
          <div class="paragraph-text-policies">We implement technical and organizational measures to protect your data from unauthorized access, loss, or misuse. However, no system is completely secure, and we cannot guarantee absolute security.</div>
          <div class="policy-heading-text no-caps">11. Children</div>
          <div class="paragraph-text-policies">Our Services are intended for adults aged 18 and over, or the age of majority in your jurisdiction. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us and we will delete it.</div>
          <div class="policy-heading-text no-caps">12. Changes to this Privacy Policy</div>
          <div class="paragraph-text-policies">We may update this policy periodically. Changes will be posted on this page with an updated &quot;Effective Date.&quot; Please review the policy regularly to stay informed.</div>
          <div class="policy-heading-text">13. contact us</div>
          <div class="paragraph-text-policies">If you have questions, concerns, or wish to exercise your data rights, please contact us at:</div>
          <div class="div-contact-details-policies">
            <div class="div-row-contact-details">
              <div class="paragraph-text-policies contact-bold">Email</div>
              <div class="paragraph-text-policies">|</div>
              <div class="paragraph-text-policies">
                <a href="mailto:info@dematerialized.nl?subject=Privacy%20Policy%20Inquiry" class="in-text-link-policies">info@dematerialized.nl</a>
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
          <div class="last-revised-text-policies">If you&#x27;re dissatisfied with our response, you have the right to lodge a complaint with your local data protection authority. In the Netherlands, this is the Autoriteit Persoonsgegevens (<a href="https://autoriteitpersoonsgegevens.nl">autoriteitpersoonsgegevens.nl</a>).</div>
        </div>
      </div>
    </div>
  </div>
</template>
