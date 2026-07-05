<script setup lang="ts">
useHead({
  title: 'How It Works - Clothing Rental In Den Bosch | Dematerialized',
  meta: [
    {
      name: 'description',
      content:
        'Buy less, wear more. Rent what you want, when you want, for as long as you want. Swap out your items anytime at our shared closet in Den Bosch.',
    },
    { property: 'og:title', content: 'How It Works - Clothing Rental In Den Bosch | Dematerialized' },
    {
      property: 'og:description',
      content:
        'Buy less, wear more. Rent what you want, when you want, for as long as you want. Swap out your items anytime at our shared closet in Den Bosch.',
    },
    {
      property: 'og:image',
      content:
        'https://dematerialized.nl/images/meta/how-it-works-meta.png',
    },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:title', content: 'How It Works - Clothing Rental In Den Bosch | Dematerialized' },
    {
      name: 'twitter:description',
      content:
        'Buy less, wear more. Rent what you want, when you want, for as long as you want. Swap out your items anytime at our shared closet in Den Bosch.',
    },
    {
      name: 'twitter:image',
      content:
        'https://dematerialized.nl/images/meta/how-it-works-meta.png',
    },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
})

const offerBannerVisible = ref(true)

const openStep = ref<number | null>(null)
function toggleStep(i: number) {
  openStep.value = openStep.value === i ? null : i
}

const openFaqs = ref<boolean[]>([false, false, false, false])
function toggleFaq(i: number) {
  openFaqs.value[i] = !openFaqs.value[i]
}

const REVIEW_SLIDE_COUNT = 3
const currentSlide = ref(0)
let slideTimer: ReturnType<typeof setInterval> | null = null
function stopAutoplay() {
  if (slideTimer) {
    clearInterval(slideTimer)
    slideTimer = null
  }
}
function startAutoplay() {
  stopAutoplay()
  slideTimer = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % REVIEW_SLIDE_COUNT
  }, 4000)
}
function goToSlide(i: number) {
  currentSlide.value = i
  startAutoplay()
}
onMounted(startAutoplay)
onBeforeUnmount(stopAutoplay)

const slideStyle = computed(() => ({
  transform: `translateX(-${currentSlide.value * 100}%)`,
  transition: 'transform 500ms ease',
}))
</script>

<template>
  <div>
    <div class="w-layout-blockcontainer container-top-padding w-container">
      <div v-if="offerBannerVisible" class="div-offer-banner">
        <div class="div-offer-banner-container">
          <div class="div-spacer-banner"></div>
          <div class="banner-text"><span class="lang-en">Get 50% off your first month with code: SHOPDEMAT.  </span><span class="lang-nl">Krijg 50% korting op je eerste maand met code: SHOPDEMAT.  </span><a href="/terms-and-conditions"><span class="lang-en">Terms apply.</span><span class="lang-nl">Voorwaarden zijn van toepassing.</span></a>
          </div>
          <div class="banner-close" @click="offerBannerVisible = false">x</div>
        </div>
      </div>
      <div class="div-large-banner">
        <div class="div-large-banner-wrapper">
          <div class="banner-large-subheading"><span class="lang-en">get started today</span><span class="lang-nl">Begin vandaag nog</span></div>
          <div class="large-banner-heading"><span class="lang-en">just like borrowing your friend&#x27;s clothes</span><span class="lang-nl">net alsof je kleding leent van een vriendin</span></div>
          <div class="banner-large-main-text"><span class="lang-en">except our closet is way bigger and there are no awkward &#x27;can I have that back&#x27; texts</span><span class="lang-nl">alleen is onze kast veel groter en zijn er geen awkward &#x27;mag ik dat terug?&#x27;-berichtjes</span></div>
          <a href="/memberships" class="button-large-banner w-button"><span class="lang-en">join the club</span><span class="lang-nl">lid worden</span></a>
        </div>
      </div>
      <div class="div-section-hiw">
        <div class="div-hiw-video-container">
          <div data-poster-url="/videos/HIW-hero_mood-board_poster.0000000.jpg" data-video-urls="/videos/HIW-hero_mood-board_mp4.mp4,/videos/HIW-hero_mood-board_webm.webm" data-autoplay="true" data-loop="true" class="hiw-video w-background-video w-background-video-atom"><video id="d6af147e-415a-397d-1d7c-2080df84eaa9-video" autoplay loop style='background-image:url("/videos/HIW-hero_mood-board_poster.0000000.jpg")' muted playsinline data-object-fit="cover">
              <source src="/videos/HIW-hero_mood-board_mp4.mp4">
              <source src="/videos/HIW-hero_mood-board_webm.webm">
            </video></div>
        </div>
        <div class="div-hiw-steps-container">
          <div class="div-content-wrapper-hiw rounded gray">
            <div class="div-hiw-step-title" @click="toggleStep(0)">
              <div class="heading-left no-caps bold pink">01</div>
              <div class="heading-left no-caps"><span class="lang-en">join our shared closet</span><span class="lang-nl">lid worden</span></div>
              <div v-show="openStep !== 0" class="icon-chevron-down-32px w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down">
                  <path d="m6 9 6 6 6-6"></path>
                </svg></div>
              <div class="icon-chevron-up-32px w-embed" :style="{ display: openStep === 0 ? 'block' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up-icon lucide-chevron-up">
                  <path d="m18 15-6-6-6 6"></path>
                </svg></div>
            </div>
            <div class="div-hiw-step-content" :class="{ open: openStep === 0 }" :style="{ display: openStep === 0 ? 'flex' : 'none' }">
              <div class="hiw-left centered no-max"><span class="lang-en">Choose a membership that fits your lifestyle.</span><span class="lang-nl">Kies een lidmaatschap dat bij je past.</span><br></div>
              <div class="div-hiw-content-section">
                <div class="hiw-left centered no-max semibold"><span class="lang-en">want items shipped directly to your door?</span><span class="lang-nl">Wil je artikelen direct thuisbezorgd krijgen?</span><br></div>
                <div class="hiw-left centered no-max"><span class="lang-en">Receive up to 10 items per shipment—choose one or two shipments per month.</span><span class="lang-nl">Ontvang 5 artikelen per verzending—kies één of twee verzendingen per maand.</span><br></div>
                <div class="hiw-left centered no-max semibold gray"><span class="lang-en">starting at €55/mo</span><span class="lang-nl">vanaf €55/maand</span><br></div>
              </div>
              <div class="div-hiw-content-section">
                <div class="hiw-left centered no-max semibold"><span class="lang-en">live in or around Den Bosch?</span><span class="lang-nl">woon je in of rond Den Bosch?</span><br></div>
                <div class="hiw-left centered no-max"><span class="lang-en">Our local memberships let you skip shipping costs and pick up from our showroom.</span><span class="lang-nl">Met onze lokale lidmaatschappen betaal je geen verzendkosten en kun je afhalen in onze showroom.</span><br></div>
                <div class="hiw-left centered no-max semibold gray"><span class="lang-en">starting at €25/mo</span><span class="lang-nl">vanaf €25/maand</span><br></div>
              </div>
              <a href="/memberships" class="button-main top-margin w-button"><span class="lang-en">join now</span><span class="lang-nl">aan de slag</span></a>
            </div>
          </div>
          <div class="div-content-wrapper-hiw rounded gray">
            <div class="div-hiw-step-title" @click="toggleStep(1)">
              <div class="heading-left no-caps bold pink">02</div>
              <div class="heading-left no-caps"><span class="lang-en">choose your items</span><span class="lang-nl">Kies je artikelen</span></div>
              <div v-show="openStep !== 1" class="icon-chevron-down-32px w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down">
                  <path d="m6 9 6 6 6-6"></path>
                </svg></div>
              <div class="icon-chevron-up-32px w-embed" :style="{ display: openStep === 1 ? 'block' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up-icon lucide-chevron-up">
                  <path d="m18 15-6-6-6 6"></path>
                </svg></div>
            </div>
            <div class="div-hiw-step-content" :class="{ open: openStep === 1 }" :style="{ display: openStep === 1 ? 'flex' : 'none' }">
              <div class="hiw-left centered no-max semibold"><span class="lang-en">every piece in our collection is one-of-a-kind.</span><span class="lang-nl">Elk artikel in onze collectie is uniek.</span><br></div>
              <div class="hiw-left centered no-max"><span class="lang-en">Browse and select your pieces online, or come dig through the racks at our Den Bosch showroom.</span><span class="lang-nl">Kies je items online, of kom lekker struinen tussen de rekken in onze showroom in Den Bosch.</span><br></div>
              <div class="hiw-left centered no-max"><span class="lang-en">Just keep in mind that all of our items are secondhand. That means no additional sizes or colors, no restocks. Just a continuously rotating closet filled with clothes that are just <em>dying</em> to be worn. Again. And again.</span><span class="lang-nl">Hou er wel even rekening mee dat al onze kleding tweedehands is. Dat betekent dus: geen andere maten of kleuren, en op is op. Gewoon één grote, steeds wisselende kledingkast vol items die staan te popelen om gedragen te worden. Keer op keer.</span><br></div>
            </div>
          </div>
          <div class="div-content-wrapper-hiw rounded gray">
            <div class="div-hiw-step-title" @click="toggleStep(2)">
              <div class="heading-left no-caps bold pink">03</div>
              <div class="heading-left no-caps"><span class="lang-en">receive your items</span><span class="lang-nl">Ontvang je artikelen</span></div>
              <div v-show="openStep !== 2" class="icon-chevron-down-32px w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down">
                  <path d="m6 9 6 6 6-6"></path>
                </svg></div>
              <div class="icon-chevron-up-32px w-embed" :style="{ display: openStep === 2 ? 'block' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up-icon lucide-chevron-up">
                  <path d="m18 15-6-6-6 6"></path>
                </svg></div>
            </div>
            <div class="div-hiw-step-content" :class="{ open: openStep === 2 }" :style="{ display: openStep === 2 ? 'flex' : 'none' }">
              <div class="hiw-left centered no-max"><span class="lang-en">All of our pieces are quality-controlled, clean, and ready to wear.</span><span class="lang-nl">Al onze items zijn kwaliteitsgecontroleerd, schoon en ready-to-wear.</span></div>
              <div class="div-hiw-content-section">
                <div class="hiw-left centered no-max semibold"><span class="lang-en">if we&#x27;re shipping to you...</span><span class="lang-nl">als we naar je verzenden...</span><br></div>
                <div class="hiw-left centered no-max"><span class="lang-en">Your pieces will arrive in 1-3 business days.</span><span class="lang-nl">Je bestelling wordt binnen 1-3 werkdagen geleverd.</span><br></div>
              </div>
              <div class="div-hiw-content-section">
                <div class="hiw-left centered no-max semibold"><span class="lang-en">if you&#x27;re a local...</span><span class="lang-nl">als je uit Den Bosch komt...</span><br></div>
                <div class="hiw-left centered no-max"><span class="lang-en">Swing by our showroom and take what you want, whenever you want.</span><span class="lang-nl">Kom langs in onze showroom en neem mee wat je wilt, wanneer je maar wilt.</span><br></div>
              </div>
            </div>
          </div>
          <div class="div-content-wrapper-hiw rounded gray">
            <div class="div-hiw-step-title" @click="toggleStep(3)">
              <div class="heading-left no-caps bold pink">04</div>
              <div class="heading-left no-caps"><span class="lang-en">wear your items</span><span class="lang-nl">Draag je artikelen</span></div>
              <div v-show="openStep !== 3" class="icon-chevron-down-32px w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down">
                  <path d="m6 9 6 6 6-6"></path>
                </svg></div>
              <div class="icon-chevron-up-32px w-embed" :style="{ display: openStep === 3 ? 'block' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up-icon lucide-chevron-up">
                  <path d="m18 15-6-6-6 6"></path>
                </svg></div>
            </div>
            <div class="div-hiw-step-content" :class="{ open: openStep === 3 }" :style="{ display: openStep === 3 ? 'flex' : 'none' }">
              <div class="hiw-left centered no-max"><span class="lang-en">Keep your pieces for as long as you want. There&#x27;s no return deadline.</span><span class="lang-nl">Hou je items zo lang als je wilt. Er is geen retourtermijn (zolang je lid blijft).</span></div>
              <div class="hiw-left centered no-max"><span class="lang-en">And PLEASE don&#x27;t worry about spills or other signs of use—clothes are meant to be lived in. </span><span class="lang-nl">En maak je alsjeblieft geen zorgen over vlekken of andere gebruikssporen—kleding is gemaakt om in te leven. </span></div>
              <a href="/faq" class="hiw-left centered no-max hidden">What if my items don&#x27;t fit?</a>
            </div>
          </div>
          <div class="div-content-wrapper-hiw rounded gray">
            <div class="div-hiw-step-title" @click="toggleStep(4)">
              <div class="heading-left no-caps bold pink">05</div>
              <div class="heading-left no-caps"><span class="lang-en">return your items</span><span class="lang-nl">Retourneer je artikelen</span></div>
              <div v-show="openStep !== 4" class="icon-chevron-down-32px w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down">
                  <path d="m6 9 6 6 6-6"></path>
                </svg></div>
              <div class="icon-chevron-up-32px w-embed" :style="{ display: openStep === 4 ? 'block' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up-icon lucide-chevron-up">
                  <path d="m18 15-6-6-6 6"></path>
                </svg></div>
            </div>
            <div class="div-hiw-step-content" :class="{ open: openStep === 4 }" :style="{ display: openStep === 4 ? 'flex' : 'none' }">
              <div class="hiw-left centered no-max"><span class="lang-en">When you&#x27;re ready for something new, ship all or some of your items back using the prepaid return label included with your order. Local members can just drop them off at our showroom.</span><span class="lang-nl">Als je toe bent aan iets nieuws, stuur je je items (of een deel ervan) terug met het retourlabel uit je pakket. Lokale leden brengen ze gewoon even terug naar onze showroom.</span></div>
              <div class="hiw-left centered no-max"><span class="lang-en">And no need to wash anything before returning—we&#x27;ll take care of the laundry.</span><span class="lang-nl">Je hoeft trouwens niks te wassen voor je het weer inlevert—wij regelen de was wel.</span></div>
              <div class="div-hiw-content-section">
                <div class="hiw-left centered no-max semibold"><span class="lang-en">fall in love with one or more of your rentals?</span><span class="lang-nl">Verliefd op één of meer van je huurartikelen?</span></div>
                <div class="hiw-left centered no-max"><span class="lang-en">You always have the option to keep whatever you want. Members receive 50% off the resale price.</span><span class="lang-nl">Je mag natuurlijk ook altijd houden wat je wilt. Als lid krijg je dan 50% korting op de verkoopprijs.</span></div>
              </div>
            </div>
          </div>
          <div class="div-content-wrapper-hiw rounded gray">
            <div class="div-hiw-step-title" @click="toggleStep(5)">
              <div class="heading-left no-caps bold pink">06</div>
              <div class="heading-left no-caps"><span class="lang-en">get new items</span><span class="lang-nl">Kies nieuwe artikelen</span></div>
              <div v-show="openStep !== 5" class="icon-chevron-down-32px w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down">
                  <path d="m6 9 6 6 6-6"></path>
                </svg></div>
              <div class="icon-chevron-up-32px w-embed" :style="{ display: openStep === 5 ? 'block' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up-icon lucide-chevron-up">
                  <path d="m18 15-6-6-6 6"></path>
                </svg></div>
            </div>
            <div class="div-hiw-step-content" :class="{ open: openStep === 5 }" :style="{ display: openStep === 5 ? 'flex' : 'none' }">
              <div class="div-hiw-content-section">
                <div class="hiw-left centered no-max semibold"><span class="lang-en">start again from step 02.</span><span class="lang-nl">Begin opnieuw vanaf stap 02.</span></div>
                <div class="hiw-left centered no-max"><span class="lang-en">Pick new pieces for a special occasion, or no occasion at all.</span><span class="lang-nl">Zoek weer wat moois uit voor een speciale gelegenheid, of gewoon zomaar.</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="div-color-block">
        <div data-delay="4000" data-animation="slide" class="slider-reviews w-slider" data-autoplay="true" data-easing="ease" data-hide-arrows="true" data-disable-swipe="false" data-autoplay-limit="0" data-nav-spacing="3" data-duration="500" data-infinite="true">
          <div class="mask-2 w-slider-mask">
            <div class="w-slide" :style="slideStyle">
              <div class="div-review-wrapper">
                <div class="review-main-text"><span class="lang-en">I joined Dematerialized just to try it out. Now I only buy quality pieces that are worth investing in—not what’s trending.</span><span class="lang-nl">Ik ben lid geworden van Dematerialized om het uit te proberen. Nu koop ik alleen kwaliteitsstukken die het waard zijn om in te investeren, niet wat populair is.</span></div>
                <div class="review-member-name">— Lara M.</div>
              </div>
            </div>
            <div class="w-slide" :style="slideStyle">
              <div class="div-review-wrapper">
                <div class="review-main-text"><span class="lang-en">I became a member to try things I’d never normally go for. Turns out, I look great in stuff I used to think I couldn’t pull off.</span><span class="lang-nl">Ik ben lid geworden om dingen te proberen waar ik normaal nooit voor zou gaan. Blijkt dat ik er geweldig uitzie in dingen waarvan ik dacht dat ik ze niet voor elkaar kon krijgen.</span></div>
                <div class="review-member-name">— Lieke S.</div>
              </div>
            </div>
            <div class="w-slide" :style="slideStyle">
              <div class="div-review-wrapper">
                <div class="review-main-text"><span class="lang-en">I spend more on AI subscriptions than on clothes. That’s how I know I’ve evolved.</span><span class="lang-nl">Ik geef meer uit aan AI-abonnementen dan aan kleding. Zo weet ik dat ik ben geëvolueerd.</span></div>
                <div class="review-member-name">— Ally H.</div>
              </div>
            </div>
          </div>
          <div class="w-slider-arrow-left" style="display: none;"></div>
          <div class="w-slider-arrow-right" style="display: none;"></div>
          <div class="slide-nav-5 w-slider-nav w-slider-nav-invert w-round">
            <div v-for="n in REVIEW_SLIDE_COUNT" :key="n" class="w-slider-dot" :class="{ 'w-active': currentSlide === n - 1 }" @click="goToSlide(n - 1)"></div>
          </div>
        </div>
      </div>
      <div class="div-banner-green">
        <div class="div-content-wrapper extra-gap">
          <div class="div-text-with-number-wrapper">
            <div class="banner-text-white"><span class="lang-en">memberships start at</span><span class="lang-nl">Lidmaatschappen vanaf</span></div>
            <div class="large-number"><span class="lang-en">€ 25 / mo</span><span class="lang-nl">€25 / ma</span></div>
          </div>
          <div class="div-text-with-number-wrapper">
            <div class="banner-text-white"><span class="lang-en">new arrivals every week</span><span class="lang-nl">elke week nieuwe artikelen</span></div>
            <div class="large-number"><span class="lang-en">in all sizes</span><span class="lang-nl">in alle maten</span></div>
          </div>
          <div class="div-text-with-number-wrapper">
            <div class="banner-text-white"><span class="lang-en">100% secondhand</span><span class="lang-nl">100% tweedehands</span></div>
            <div class="large-number"><span class="lang-en">0% guilt</span><span class="lang-nl">0% schuldgevoel</span></div>
          </div>
        </div>
      </div>
    </div>
    <div class="div-faq-section">
      <div class="content-wrapper-mem faq hiw">
        <div class="heading-centered bottom-margin"><span class="lang-en">frequently asked questions</span><span class="lang-nl">Veelgestelde vragen</span></div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(0)">
            <div class="faq-question"><span class="lang-en">What kind of clothes can I find at Dematerialized?</span><span class="lang-nl">Wat voor kleding kan ik vinden bij Dematerialized?</span></div>
            <div v-show="!openFaqs[0]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[0] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[0] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">A little bit of everything, honestly. For a special occasion or no occasion at all (we prefer the latter). <br><br>We’ve got everyday staples, fun statement pieces, and the kind of things that make picking out an outfit feel easy. Our racks are filled with a mix of local donations and curated finds—blazers, dresses, outerwear, denim, tops, and more.<br><br>You’ll find hundreds of brands—some premium, some fast fashion, some high-street—but we don’t obsess over labels. Actually, we cut them out. It&#x27;s the piece that matters, not the name inside.<br><br>Everything you&#x27;ll find in our collection has been cleaned, steamed, and approved for another round in someone’s closet (maybe yours).</span><span class="lang-nl">Een beetje van alles, eerlijk gezegd. Voor een speciale gelegenheid of gewoon zomaar (wij stemmen voor dat laatste).<br><br>We hebben opvallende items, everyday basics, en kleding waarmee je in no-time een outfit samenstelt. Onze rekken hangen vol met een mix van lokaal gedoneerde kleding en toffe vondsten—blazers, jurken, jassen, jeans, tops en meer.<br><br>Je vindt er honderden merken—sommige premium, sommige fast fashion, sommige high-street—maar wij zijn niet gek op labels. We knippen ze er eigenlijk gewoon uit. Het gaat om het stuk, niet om de naam erin.<br><br>Alles wat je in onze collectie vindt, is gewassen, gestoomd en goedgekeurd voor een volgende ronde in iemands kledingkast. Misschien die van jou.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(1)">
            <div class="faq-question"><span class="lang-en">How do clothing rentals work?</span><span class="lang-nl">Hoe werkt kleding lenen (huren) bij Dematerialized?</span></div>
            <div v-show="!openFaqs[1]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[1] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[1] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">It’s really simple. You subscribe to a membership, pick out the items you want to wear, wear them, give them back to us, and pick out new items. No need to wash anything before returning—we’ll take care of that before another member rents it.<br><br>If you&#x27;re a <strong>home delivery member</strong> (i.e., your membership includes shipping), you&#x27;ll typically receive your items in 1-3 business days. <br><br>If you&#x27;re a<strong> local member</strong>, all you have to do is stop by our showroom to pick out your items, or reserve them online to try on in store.<br><br>You can keep your rental items as long as you&#x27;d like. There&#x27;s no return deadline. <br><br>And if you like something enough to keep it, you&#x27;ll get 50% off the resale price.</span><span class="lang-nl">Het is heel simpel. Je neemt een lidmaatschap, kiest de items die je wil dragen, draagt ze, geeft ze terug, en kiest nieuwe items. Je hoeft niets te wassen voor je ze teruggeeft—dat doen wij, voordat een ander lid ze huurt.<br><br>Als je lidmaatschap verzending inbegrepen heeft, ontvang je je items binnen 1-3 werkdagen.<br><br>Ben je een lokaal lid? Dan hoef je alleen maar langs te komen in onze showroom om items uit te kiezen, of reserveer je ze online om ze in de winkel te passen.<br><br>Je mag je gehuurde items zo lang houden als je wil. Er is geen inleverdatum zolang je lid bent.<br><br>En als je iets zo mooi vindt dat je het wil houden, krijg je 50% korting op de verkoopprijs.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(2)">
            <div class="faq-question"><span class="lang-en">What happens if I damage a rental item?</span><span class="lang-nl">Wat gebeurt er als ik een huurartikel beschadig?</span></div>
            <div v-show="!openFaqs[2]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[2] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[2] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">We expect normal wear—clothes are meant to be lived in. But we also know accidents happen. Maybe it’s red wine, maybe it’s spaghetti. It happens. Don’t stress about it.<br>‍<br>All we ask is that you treat your rentals with love, but don’t obsess over keeping them perfect. Live your life. If something comes back with a small, barely noticeable flaw, we won’t charge you for it.<br>‍<br>If an item is returned in a truly unusable condition, we may charge 50% of the retail price—but even then, it’s not the end of the world. Our prices are low, and we’re human. If you tell us what happened before we find out ourselves, chances are we’ll just let it slide.</span><span class="lang-nl">We rekenen op normaal gebruik—kleding is er om in te leven. Maar we weten ook dat ongelukjes gebeuren. Misschien is het rode wijn, misschien is het spaghetti. Het overkomt de beste. Maak je er niet druk om.<br><br>Het enige wat we vragen is dat je je gehuurde items met wat liefde behandelt, maar ga er niet gestrest over doen om ze perfect te houden. Live your life. Als er iets terugkomt met een klein, nauwelijks zichtbaar vlekje, brengen we je daar niets voor in rekening.<br><br>Als een item echt in onbruikbare staat wordt teruggebracht, kunnen we 50% van de verkoopprijs in rekening brengen—maar ook dan is het niet het einde van de wereld. Onze prijzen zijn laag, en we zijn gewoon mensen. Als je ons vertelt wat er is gebeurd voordat wij het zelf ontdekken, is de kans groot dat we er gewoon overheen stappen.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(3)">
            <div class="faq-question"><span class="lang-en">Do I have to be a member to shop at Dematerialized?</span><span class="lang-nl">Moet ik lid zijn om bij Dematerialized te shoppen?</span></div>
            <div v-show="!openFaqs[3]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[3] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[3] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">Nope! Anyone can shop at Dematerialized, but this is currently limited to in-person shopping in our showroom. Please note that new-in pieces are only available to our members (these are always on a clearly designated members-only rack). <br>‍<br>If you want to have access to the entire collection (in-store and online), we highly suggest that you become a member. Because whatever you may buy from us, you&#x27;ll probably get tired of it sooner rather than later. So why not just borrow it and give it back when you&#x27;re done (and pick something new in its place)? Shopping is way more fun (and sustainable) this way.</span><span class="lang-nl">Iedereen (ook niet-leden) kan items kopen in onze showroom in Den Bosch. We hebben op elk moment zo&#x27;n 175 items op de rekken hangen. <br><br>Wil je items huren uit de gedeelde kledingkast en/of toegang hebben tot de volledige collectie (alles wat je online ziet), dan heb je wel een actief lidmaatschap nodig.</span></div>
          </div>
        </div>
        <a href="/faq" class="faq-link hiw"><span class="lang-en">learn more</span><span class="lang-nl">meer tonen</span></a>
      </div>
    </div>
    <div class="div-banner hiw">
      <div class="div-banner-wrapper">
        <div class="subheading-hiw no-caps"><span class="lang-en">not ready to become a member?</span><span class="lang-nl">Nog niet klaar om lid te worden?</span></div>
        <div class="hiw-centered medium"><span class="lang-en">no problem—you can still shop our in-store collection</span><span class="lang-nl">geen probleem—je kunt nog steeds onze fysieke winkel shoppen</span></div>
        <a href="/contact-us" class="button-main top-margin centered w-button"><span class="lang-en">visit us</span><span class="lang-nl">bezoek ons</span></a>
      </div>
    </div>
    <div class="div-section gray">
      <div class="div-content-wrapper">
        <div class="small-all-caps black"><span class="lang-en">at your service</span><span class="lang-nl">tot uw dienst</span></div>
      </div>
    </div>
    <div class="mobile-footer-spacer"></div>
  </div>
</template>
