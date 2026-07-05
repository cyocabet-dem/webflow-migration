<script setup lang="ts">
useHead({
  title: 'Contact Us | Dematerialized',
  meta: [
    {
      name: 'description',
      content:
        "For any questions or comments please contact us. We're available during our normal business hours. Email us at support@dematerialized.nl or send us a message on WhatsApp.",
    },
    { property: 'og:title', content: 'Contact Us | Dematerialized' },
    {
      property: 'og:description',
      content:
        "For any questions or comments please contact us. We're available during our normal business hours. Email us at support@dematerialized.nl or send us a message on WhatsApp.",
    },
    {
      property: 'og:image',
      content:
        'https://dematerialized.nl/images/meta/contact-us-meta.png',
    },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:title', content: 'Contact Us | Dematerialized' },
    {
      name: 'twitter:description',
      content:
        "For any questions or comments please contact us. We're available during our normal business hours. Email us at support@dematerialized.nl or send us a message on WhatsApp.",
    },
    {
      name: 'twitter:image',
      content:
        'https://dematerialized.nl/images/meta/contact-us-meta.png',
    },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
})

const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const T = {
  phFirstName: { en: 'First Name', nl: 'Voornaam' },
  phLastName: { en: 'Last Name', nl: 'Achternaam' },
  phEmail: { en: 'Email Address', nl: 'E-mailadres' },
  phMessage: { en: 'Type your message here', nl: 'Typ hier je bericht.' },
  submit: { en: 'Submit', nl: 'Verzenden' },
} as const

const formSubmitted = ref(false)
const formFailed = ref(false)

function handleContactFormSubmit() {
  // TODO(wire): the old form posted to Webflow's form handler — replacement endpoint is an
  // open question. For now, reproduce the Webflow success state.
  formFailed.value = false
  formSubmitted.value = true
}
</script>

<template>
  <div>
    <div class="div-section-mailing-list">
      <div class="div-content-wrapper-ml">
        <div class="div-heading-contact-us">
          <div class="div-relative-for-sticker">
            <div class="heading-centered contact"><span class="lang-en">contact us</span><span class="lang-nl">Neem contact met ons op</span></div><img src="/images/pancakes_1.png" loading="lazy" alt="" class="image-22">
          </div>
          <div class="paragraph-centered contact centered"><span class="lang-en">For any and all questions, comments, and concerns, please complete the form below or contact us at :</span><span class="lang-nl">Voor alle vragen en opmerkingen kunt je het onderstaande formulier invullen of contact met ons opnemen via:</span></div>
        </div>
        <div class="div-flex-wrapper-contact">
          <div class="div-split-content-left contact-us">
            <div class="div-contact-details">
              <div class="div-subheading-w-icon">
                <div class="subheading-contact-us"><span class="lang-en">Contact Details</span><span class="lang-nl">Contactgegevens</span></div>
                <div class="phone-20px w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone-icon lucide-phone">
                    <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
                  </svg></div>
              </div>
              <div class="div-row-ml">
                <div class="label-text-ml no-margin"><span class="lang-en">Email</span><span class="lang-nl">E-mail</span></div>
                <div class="label-text-ml separator">:</div>
                <a href="mailto:support@dematerialized.nl?subject=General%20Inquiry" class="paragraph-centered contact link">info@dematerialized.nl</a>
              </div>
              <div class="div-ml-address">
                <div class="div-row-ml">
                  <div class="label-text-ml"><span class="lang-en">Phone</span><span class="lang-nl">Telefoon</span></div>
                  <div class="label-text-ml separator">:</div>
                  <div class="paragraph-centered contact"><span class="lang-en">+31 6 246 73835 (available on WhatsApp)</span><span class="lang-nl">+31 6 246 73835 (ook op WhatsApp)</span></div>
                </div>
              </div>
              <div class="div-ml-address">
                <div class="div-row-ml">
                  <div class="label-text-ml"><span class="lang-en">Address</span><span class="lang-nl">Adres</span></div>
                  <div class="label-text-ml separator">:</div>
                  <div class="paragraph-centered content">Lange Putstraat 4, 5211 KN Den Bosch </div>
                </div>
              </div>
            </div>
            <div class="div-contact-details">
              <div class="div-subheading-w-icon">
                <div class="subheading-contact-us"><span class="lang-en">business hours</span><span class="lang-nl">Openingstijden</span></div>
                <div class="clock-20px w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock9-icon lucide-clock-9">
                    <path d="M12 6v6H8"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg></div>
              </div>
              <div class="div-ml-address">
                <div class="div-row-ml hours">
                  <div class="label-text-ml no-margin"><span class="lang-en">Monday</span><span class="lang-nl">Maandag</span></div>
                  <div class="label-text-ml separator hours">:</div>
                  <div class="paragraph-centered contact"><span class="lang-en">Closed</span><span class="lang-nl">Gesloten</span></div>
                </div>
                <div class="div-row-ml hours vertical">
                  <div class="div-tuesday">
                    <div class="label-text-ml"><span class="lang-en">Tuesday</span><span class="lang-nl">dinsdag</span></div>
                    <div class="label-text-ml separator hours mobile">:</div>
                  </div>
                  <div class="label-text-ml separator hours hidden">:</div>
                  <div class="paragraph-centered contact"><span class="lang-en">12:00 - 14:00 (vinted pick-up/drop-off)</span><span class="lang-nl">Gesloten</span></div>
                </div>
                <div class="div-row-ml hours">
                  <div class="label-text-ml"><span class="lang-en">Wednesday</span><span class="lang-nl">Woensdag</span></div>
                  <div class="label-text-ml separator hours">:</div>
                  <div class="paragraph-centered content"><span class="lang-en">Closed</span><span class="lang-nl">Gesloten</span></div>
                </div>
                <div class="div-row-ml hours">
                  <div class="label-text-ml"><span class="lang-en">Thursday</span><span class="lang-nl">donderdag</span></div>
                  <div class="label-text-ml separator hours">:</div>
                  <div class="paragraph-centered content">11:00 - 17:00</div>
                </div>
                <div class="div-row-ml hours">
                  <div class="label-text-ml"><span class="lang-en">Friday</span><span class="lang-nl">Vrijdag</span></div>
                  <div class="label-text-ml separator hours">:</div>
                  <div class="paragraph-centered content">11:00 - 17:00</div>
                </div>
                <div class="div-row-ml hours">
                  <div class="label-text-ml"><span class="lang-en">Saturday</span><span class="lang-nl">Zaterdag</span></div>
                  <div class="label-text-ml separator hours">:</div>
                  <div class="paragraph-centered content">11:00 - 17:00</div>
                </div>
                <div class="div-row-ml hours">
                  <div class="label-text-ml"><span class="lang-en">Sunday</span><span class="lang-nl">zondag</span></div>
                  <div class="label-text-ml separator hours">:</div>
                  <div class="paragraph-centered content"><span class="lang-en">12:00 - 16:00</span><span class="lang-nl">Gesloten</span></div>
                </div>
                <div class="div-row-ml hours">
                  <div class="paragraph-centered content special">*due to the heat, the showroom is closed 26-28 June 2026</div>
                </div>
              </div>
            </div>
          </div>
          <div class="div-split-content-right contact-us">
            <div class="google-map-embed mobile-small contact w-embed w-iframe"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4947.023610002033!2d5.3028001761482315!3d51.687078597562!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c6eef6ed93e6f3%3A0x1dc7ecbfd2fb76e0!2sLange%20Putstraat%204%2C%205211%20KN%20&#39;s-Hertogenbosch!5e0!3m2!1sen!2snl!4v1760020354104!5m2!1sen!2snl" width="260" height="260" style="border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
            <div class="google-map-embed mobile contact w-embed w-iframe"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4947.023610002033!2d5.3028001761482315!3d51.687078597562!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c6eef6ed93e6f3%3A0x1dc7ecbfd2fb76e0!2sLange%20Putstraat%204%2C%205211%20KN%20&#39;s-Hertogenbosch!5e0!3m2!1sen!2snl!4v1760020354104!5m2!1sen!2snl" width="400" height="250" style="border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
            <div class="google-map-embed desktop w-embed w-iframe"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4947.023610002033!2d5.3028001761482315!3d51.687078597562!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c6eef6ed93e6f3%3A0x1dc7ecbfd2fb76e0!2sLange%20Putstraat%204%2C%205211%20KN%20&#39;s-Hertogenbosch!5e0!3m2!1sen!2snl!4v1760020354104!5m2!1sen!2snl" width="460" height="420" style="border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
          </div>
        </div>
        <div class="div-contact-form new-style">
          <div class="heading-centered left-align"><span class="lang-en">get in touch</span><span class="lang-nl">Neem contact op</span></div>
          <div class="form-mailing-list contact w-form">
            <form v-show="!formSubmitted" id="wf-form-Contact-Form" name="wf-form-Contact-Form" data-name="Contact Form" method="get" class="form" @submit.prevent="handleContactFormSubmit">
              <div class="div-form-wrapper contact"><input class="form-input contact new-style w-input" maxlength="256" name="First-Name" data-name="First Name" :placeholder="isNL ? T.phFirstName.nl : T.phFirstName.en" type="text" id="First-Name" required><input class="form-input contact w-input" maxlength="256" name="Last-Name" data-name="Last Name" :placeholder="isNL ? T.phLastName.nl : T.phLastName.en" type="text" id="Last-Name" required><input class="form-input contact w-input" maxlength="256" name="email" data-name="Email" :placeholder="isNL ? T.phEmail.nl : T.phEmail.en" type="email" id="email-input" required><textarea required :placeholder="isNL ? T.phMessage.nl : T.phMessage.en" maxlength="5000" id="Message" name="Message" data-name="Message" class="text-area-form contact w-input"></textarea>
                <div class="div-checkbox-consent"><label class="w-checkbox checkbox-consent-div contact top-margin"><input type="checkbox" name="Consent" id="consent-checkbox" data-name="Consent" required class="w-checkbox-input checkbox-consent"><span class="checbox-policies w-form-label" for="Consent"><span class="lang-en">I have read and understand the <a href="#" class="policy-text-small gray">Terms &amp; Conditions</a> and <a href="/privacy-policy" class="policy-text-small gray">Privacy Policy</a>.</span><span class="lang-nl">Ik heb de <a href="#" class="policy-text-small gray">Algemene voorwaarden</a> en <a href="/privacy-policy" class="policy-text-small gray">Privacybeleid</a> gelezen en begrepen.</span></span></label><label class="w-checkbox checkbox-consent-div marketing"><input type="checkbox" name="Marketing-Consent" id="Marketing-Consent" data-name="Marketing Consent" class="w-checkbox-input checkbox-consent"><span class="checbox-policies w-form-label" for="Marketing-Consent"><span class="lang-en">I agree to receive marketing communications, offers, and updates from Dematerialized. I understand I can withdraw my consent at any time.</span><span class="lang-nl">Ik ga ermee akkoord marketingcommunicatie, aanbiedingen en updates van Dematerialized te ontvangen. Ik begrijp dat ik mijn toestemming op elk moment kan intrekken.</span></span></label></div><input type="submit" data-wait="..." class="button-form-submit left-align w-button" :value="isNL ? T.submit.nl : T.submit.en">
              </div>
            </form>
            <div class="success-message-3 w-form-done" :style="formSubmitted ? { display: 'block' } : undefined">
              <div><span class="lang-en">Thanks for reaching out! We&#x27;ll be in touch soon.</span><span class="lang-nl">Bedankt voor je bericht! We nemen snel contact met je op.</span></div>
            </div>
            <div class="error-message-3 w-form-fail" :style="formFailed ? { display: 'block' } : undefined">
              <div class="text-block-5"><span class="lang-en">Oops! Something went wrong. Please try again.</span><span class="lang-nl">Oeps! Er is iets misgegaan. Probeer het nog eens.</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mobile-footer-spacer"></div>
  </div>
</template>
