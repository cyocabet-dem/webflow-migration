<script setup lang="ts">
useHead({
  title: 'The Easy Way To Donate Your Clothes | Dematerialized',
  meta: [
    { name: 'description', content: 'Drop off your pre-loved clothes and shoes at Dematerialized in Den Bosch. We don\'t care about the brand, season, or condition. We make cleaning out your closet easy.' },
    { property: 'og:title', content: 'The Easy Way To Donate Your Clothes | Dematerialized' },
    { property: 'og:description', content: 'Drop off your pre-loved clothes and shoes at Dematerialized in Den Bosch. We don\'t care about the brand, season, or condition. We make cleaning out your closet easy.' },
    { property: 'og:image', content: 'https://dematerialized.nl/images/meta/donations-meta.png' },
    { name: 'twitter:title', content: 'The Easy Way To Donate Your Clothes | Dematerialized' },
    { name: 'twitter:description', content: 'Drop off your pre-loved clothes and shoes at Dematerialized in Den Bosch. We don\'t care about the brand, season, or condition. We make cleaning out your closet easy.' },
    { name: 'twitter:image', content: 'https://dematerialized.nl/images/meta/donations-meta.png' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
})

const faqOpen = ref<boolean[]>([false, false, false, false])

function toggleFaq(index: number) {
  faqOpen.value[index] = !faqOpen.value[index]
}
</script>

<template>
  <div>
    <div class="w-layout-blockcontainer container-top-padding donations w-container"></div>
    <div class="div-section-background-video">
      <div class="div-heading-overlay-hiw">
        <div class="video-heading-hiw"><span class="lang-en">clean out your closet</span><span class="lang-nl">Ruim je kast op</span></div>
        <div class="video-heading-hiw"><span class="lang-en">the lazy girl way</span><span class="lang-nl">de lazy girl way</span></div>
        <a href="#content-start-donations" class="cta-link-hiw-header centered"><span class="lang-en">learn more</span><span class="lang-nl">Meer informatie</span></a>
      </div>
      <div data-poster-url="/videos/donations-hero-poster-00001.jpg" data-video-urls="/videos/donations-hero-transcode.mp4,/videos/donations-hero-transcode.webm" data-autoplay="true" data-loop="true" class="background-video w-background-video w-background-video-atom"><video id="50e6fca2-062f-4a08-5b14-3e9f71a2ac99-video" autoplay="" loop="" style="background-image:url(&quot;/videos/donations-hero-poster-00001.jpg&quot;)" muted="" playsinline="" data-object-fit="cover">
          <source src="/videos/donations-hero-transcode.mp4">
          <source src="/videos/donations-hero-transcode.webm">
        </video>
        <div class="div-video-overlay"></div>
      </div>
    </div>
    <div id="content-start-donations" class="div-section-donations top-padding">
      <div class="div-content-wrapper-donations text-left">
        <div class="heading-left"><span class="lang-en">donate your clothes</span><span class="lang-nl">Doneer je kleding</span></div>
        <div class="hiw-left centered"><span class="lang-en">We accept clothing donations from anyone—members and non-members alike. Almost everything is welcome (just no undergarments, please). We don’t care about the brand, the season, or the condition. Whether it’s barely worn or way past its prime, we’ll make sure it finds a new purpose.</span><span class="lang-nl">We accepteren kledingdonaties van iedereen, zowel leden als niet-leden. Bijna alles is welkom (alleen geen onderkleding, alsjeblieft). Het merk, het seizoen of de conditie kunnen ons niets schelen. Of het nu nauwelijks gedragen is of ver over zijn hoogtepunt heen is, wij zorgen ervoor dat het een nieuwe bestemming krijgt.</span></div>
        <a href="#hiw-donations" class="cta-link-hiw"><span class="lang-en">how it works</span><span class="lang-nl">Hoe het werkt</span></a>
      </div>
      <div class="div-content-wrapper-hiw donations">
        <div class="div-image-wrapper-hiw donate"><img src="/images/cat-heart-sunglasses.png" loading="lazy" sizes="100vw" srcset="/images/cat-heart-sunglasses-p-500.png 500w, /images/cat-heart-sunglasses-p-800.png 800w, /images/cat-heart-sunglasses-p-1080.png 1080w, /images/cat-heart-sunglasses-p-1600.png 1600w, /images/cat-heart-sunglasses-p-2000.png 2000w, /images/cat-heart-sunglasses.png 2134w" alt="" class="image-24"></div>
      </div>
    </div>
    <div class="div-section-donations no-padding">
      <div class="div-content-wrapper-hiw desktop">
        <div class="div-image-wrapper-hiw image-2 why"><img src="/images/lace-up-mini-skirt.png" loading="lazy" alt="" class="image-23"></div>
      </div>
      <div class="div-content-wrapper-donations">
        <div class="heading-left"><span class="lang-en">why we do it</span><span class="lang-nl">Waarom we het doen</span></div>
        <div class="hiw-left centered"><span class="lang-en">We started this service because we know how hard it is to clean out your closet. But it shouldn’t be. Between consignment stores that turn away half your items and endless listings on Vinted that never sell, it’s easy to give up and just keep everything (or maybe even throw it all away). Sometimes, you just need a simple way to say goodbye to the clothes you no longer wear—and that’s where we come in.</span><span class="lang-nl">We zijn met deze service begonnen omdat we weten hoe moeilijk het is om je kast op te ruimen. Maar dat zou niet zo moeten zijn. Tussen consignatiewinkels die de helft van je items weigeren en eindeloze aanbiedingen op Vinted die nooit verkopen, is het makkelijk om op te geven en gewoon alles te houden (of misschien zelfs allemaal weg te gooien). Soms heb je gewoon een eenvoudige manier nodig om afscheid te nemen van de kleding die je niet meer draagt—en dat is waar wij van pas komen.</span></div>
      </div>
      <div class="div-content-wrapper-hiw mobile donations">
        <div class="div-image-wrapper-hiw image-2 why"></div>
      </div>
    </div>
    <div id="hiw-donations" class="div-section-donations hiw">
      <div class="div-content-wrapper-donations text-left">
        <div class="heading-left"><span class="lang-en">how it works</span><span class="lang-nl">Hoe het werkt</span></div>
        <div class="hiw-left centered"><span class="lang-en">Drop off your pre-loved pieces at our store and we’ll handle the rest. <strong>Within two weeks</strong>, our team will evaluate each item (might take longer for large donations or if we&#x27;re drowning in clothes). If you’re a member, you’ll earn store credit for every piece that’s still in wearable condition—something someone, somewhere, might love again. For each piece that has seen better days or isn&#x27;t rental-worthy, we&#x27;ll responsibly take care of it for you.</span><span class="lang-nl">Geef je favoriete stukken af in onze winkel en wij zorgen voor de rest. Binnen vijf werkdagen evalueert ons team elk item (bij grote donaties kan het langer duren). Als je lid bent, verdien je winkeltegoed voor elk stuk dat nog in verhuurwaardige staat is—iets dat iemand, ergens, misschien weer leuk vindt. Voor elk stuk dat betere dagen heeft gekend, zorgen we ervoor op verantwoorde wijze voor je.</span></div>
      </div>
      <div class="div-content-wrapper-hiw">
        <div class="div-image-wrapper-hiw"></div>
      </div>
    </div>
    <div class="div-section-donations bottom-margin">
      <div class="div-content-wrapper-hiw desktop">
        <div class="div-image-wrapper-hiw image-2 earn"><img src="/images/dark-wash-straight-jeans.png" loading="lazy" alt="" class="image-27"></div>
      </div>
      <div class="div-content-wrapper-donations">
        <div class="heading-left"><span class="lang-en">what you&#x27;ll earn</span><span class="lang-nl">Wat je gaat verdienen</span></div>
        <div class="hiw-left centered"><span class="lang-en">Here&#x27;s a glimpse of what you can expect as a member:</span><span class="lang-nl">Hier is een voorproefje van wat je als lid kunt verwachten:</span></div>
        <ul role="list" class="list-policies donations pink">
          <li class="list-item-policies donations"><span class="lang-en"><strong>outerwear / blazers / sets :</strong> up to €5 credit</span><span class="lang-nl">Bovenkleding, blazers of sets: €3—€5</span></li>
          <li class="list-item-policies donations"><span class="lang-en"><strong>dresses / jumpsuits :</strong> up to €4 credit</span><span class="lang-nl">Jurken of jumpsuits: €2—€4</span></li>
          <li class="list-item-policies donations"><span class="lang-en"><strong>tops / bottoms :</strong> up to €3 credit</span><span class="lang-nl">Bovenstuk of broekje: €1—€3</span></li>
          <li class="list-item-policies donations"><span class="lang-en"><strong>shoes / bags : </strong>up to €5 credit</span><span class="lang-nl">Schoenen of tassen: tot €4</span></li>
        </ul>
        <div class="hiw-left centered"><span class="lang-en">For a complete overview of our credit system for donations, please see our <a href="/faq#faq-donations" class="in-text-link-policies">FAQ</a>.</span><span class="lang-nl">Voor een volledig overzicht van ons winkeltegoed voor donaties, zie onze <a href="/faq#faq-donations" class="in-text-link-policies">FAQ</a>.</span></div>
      </div>
      <div class="div-content-wrapper-hiw mobile">
        <div class="div-image-wrapper-hiw image-2 earn"></div>
      </div>
    </div>
    <div class="div-banner hiw">
      <div class="div-banner-wrapper">
        <div class="subheading-hiw"><span class="lang-en">ready to clean out your closet?</span><span class="lang-nl">Klaar om je kast op te ruimen?</span></div>
        <div class="hiw-centered"><span class="lang-en">become a member and earn store credit for your donations</span><span class="lang-nl">Word lid en verdien winkeltegoed voor je donaties.</span></div>
        <a href="/memberships" class="button-main top-margin centered w-button">explore memberships</a>
      </div>
    </div>
    <div id="content-start-hiw" class="div-section-donations">
      <div class="div-content-wrapper-donations text-left">
        <div class="heading-left"><span class="lang-en">not a member?</span><span class="lang-nl">Geen lid?</span></div>
        <div class="hiw-left centered"><span class="lang-en">You’ll still get something back. Non-members receive a one-time discount on their next purchase:</span><span class="lang-nl">Je krijgt nog steeds iets terug. Niet-leden krijgen een eenmalige korting op hun volgende aankoop:</span></div>
        <ul role="list" class="list-policies donations pink">
          <li class="list-item-policies"><span class="lang-en"><strong>10%</strong> off for <strong>1–10</strong> donated items</span><span class="lang-nl">10% korting voor 1 tot 10 gedoneerde items</span></li>
          <li class="list-item-policies"><span class="lang-en"><strong>15%</strong> off for <strong>11–20</strong> items</span><span class="lang-nl">15% korting voor 11—20 items</span></li>
          <li class="list-item-policies"><span class="lang-en"><strong>25%</strong> off for <strong>21+</strong> items</span><span class="lang-nl">25% korting voor meer dan 21 items</span></li>
        </ul>
      </div>
      <div class="div-content-wrapper-hiw">
        <div class="div-image-wrapper-hiw not-member"><img src="/images/striped-quarter-zip.png" loading="lazy" alt="" class="image-28"></div>
      </div>
    </div>
    <div class="div-section-donations bottom-margin stacked">
      <div class="div-content-wrapper-hiw desktop donations-stacked">
        <div class="div-image-wrapper-hiw image-2 what-happens"><img src="/images/cabbage-cat.png" loading="lazy" sizes="100vw" srcset="/images/cabbage-cat-p-500.png 500w, /images/cabbage-cat-p-800.png 800w, /images/cabbage-cat-p-1080.png 1080w, /images/cabbage-cat-p-1600.png 1600w, /images/cabbage-cat.png 1740w" alt="" class="image-29"></div>
      </div>
      <div class="div-content-wrapper-donations stacked">
        <div class="heading-left"><span class="lang-en">what happens to items that can&#x27;t be rented out?</span><span class="lang-nl">Wat gebeurt er met spullen die niet verhuurd kunnen worden?</span></div>
        <div class="hiw-left centered donations"><span class="lang-en">Not everything can be rented out, and that’s okay. We’re currently exploring partnerships with local upcycling initiatives and textile recycling organizations to find responsible ways to reuse or repurpose clothing that truly can no longer be worn.</span><span class="lang-nl">Niet alles kan worden verhuurd, en dat is oké. We onderzoeken momenteel samenwerkingsverbanden met lokale upcycling-initiatieven en textielrecyclingorganisaties om verantwoorde manieren te vinden voor het hergebruiken van kleding die echt niet meer gedragen kan worden.</span></div>
        <div class="hiw-left centered donations"><span class="lang-en">If you know of a project, artist, or organization that might be a good fit, please reach out—we’re always open to fresh ideas.</span><span class="lang-nl">Als je een project, artiest of organisatie kent die misschien goed bij ons past, neem dan contact met ons op. We staan altijd open voor nieuwe ideeën.</span></div>
        <a href="/contact-us" class="cta-link-hiw"><span class="lang-en">contact us</span><span class="lang-nl">Neem contact met ons op</span></a>
      </div>
      <div class="div-content-wrapper-hiw mobile">
        <div class="div-image-wrapper-hiw image-2 what-happens"></div>
      </div>
    </div>
    <div class="div-faq-section">
      <div class="content-wrapper-mem faq hiw">
        <div class="heading-centered bottom-margin"><span class="lang-en">frequently asked questions</span><span class="lang-nl">Veelgestelde vragen</span></div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(0)">
            <div class="faq-question"><span class="lang-en">What kind of clothes can I find at Dematerialized?</span><span class="lang-nl">Wat voor kleding kan ik vinden bij Dematerialized?</span></div>
            <div class="icon-faq-plus w-embed" :style="{ display: faqOpen[0] ? 'none' : 'inline-flex' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: faqOpen[0] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: faqOpen[0] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">A little bit of everything, honestly. For a special occasion or no occasion at all (we prefer the latter). <br><br>We’ve got everyday staples, fun statement pieces, and the kind of things that make picking out an outfit feel easy. Our racks are filled with a mix of local donations and curated finds—blazers, dresses, outerwear, denim, tops, and more.<br><br>You’ll find hundreds of brands—some premium, some fast fashion, some high-street—but we don’t obsess over labels. Actually, we cut them out. It&#x27;s the piece that matters, not the name inside.<br><br>Everything you&#x27;ll find in our collection has been cleaned, steamed, and approved for another round in someone’s closet (maybe yours).</span><span class="lang-nl">Een beetje van alles, eerlijk gezegd. Voor een speciale gelegenheid of gewoon zomaar (wij stemmen voor dat laatste).<br><br>We hebben opvallende items, everyday basics, en kleding waarmee je in no-time een outfit samenstelt. Onze rekken hangen vol met een mix van lokaal gedoneerde kleding en toffe vondsten—blazers, jurken, jassen, jeans, tops en meer.<br><br>Je vindt er honderden merken—sommige premium, sommige fast fashion, sommige high-street—maar wij zijn niet gek op labels. We knippen ze er eigenlijk gewoon uit. Het gaat om het stuk, niet om de naam erin.<br><br>Alles wat je in onze collectie vindt, is gewassen, gestoomd en goedgekeurd voor een volgende ronde in iemands kledingkast. Misschien die van jou.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(1)">
            <div class="faq-question"><span class="lang-en">How do clothing rentals work?</span><span class="lang-nl">Hoe werkt kleding lenen (huren) bij Dematerialized?</span></div>
            <div class="icon-faq-plus w-embed" :style="{ display: faqOpen[1] ? 'none' : 'inline-flex' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: faqOpen[1] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: faqOpen[1] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">It’s really simple. You subscribe to a membership, pick out the items you want to wear, wear them, give them back to us, and pick out new items. No need to wash anything before returning—we’ll take care of that before another member rents it.<br><br>If you&#x27;re a <strong>home delivery member</strong> (i.e., your membership includes shipping), you&#x27;ll typically receive your items in 1-3 business days. <br><br>If you&#x27;re a<strong> local member</strong>, all you have to do is stop by our showroom to pick out your items, or reserve them online to try on in store.<br><br>You can keep your rental items as long as you&#x27;d like. There&#x27;s no return deadline. <br><br>And if you like something enough to keep it, you&#x27;ll get 50% off the resale price.</span><span class="lang-nl">Het is heel simpel. Je neemt een lidmaatschap, kiest de items die je wil dragen, draagt ze, geeft ze terug, en kiest nieuwe items. Je hoeft niets te wassen voor je ze teruggeeft—dat doen wij, voordat een ander lid ze huurt.<br><br>Als je lidmaatschap verzending inbegrepen heeft, ontvang je je items binnen 1-3 werkdagen.<br><br>Ben je een lokaal lid? Dan hoef je alleen maar langs te komen in onze showroom om items uit te kiezen, of reserveer je ze online om ze in de winkel te passen.<br><br>Je mag je gehuurde items zo lang houden als je wil. Er is geen inleverdatum zolang je lid bent.<br><br>En als je iets zo mooi vindt dat je het wil houden, krijg je 50% korting op de verkoopprijs.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(2)">
            <div class="faq-question"><span class="lang-en">What happens if I damage a rental item?</span><span class="lang-nl">Wat gebeurt er als ik een huurartikel beschadig?</span></div>
            <div class="icon-faq-plus w-embed" :style="{ display: faqOpen[2] ? 'none' : 'inline-flex' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: faqOpen[2] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: faqOpen[2] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">We expect normal wear—clothes are meant to be lived in. But we also know accidents happen. Maybe it’s red wine, maybe it’s spaghetti. It happens. Don’t stress about it.<br>‍<br>All we ask is that you treat your rentals with love, but don’t obsess over keeping them perfect. Live your life. If something comes back with a small, barely noticeable flaw, we won’t charge you for it.<br>‍<br>If an item is returned in a truly unusable condition, we may charge 50% of the retail price—but even then, it’s not the end of the world. Our prices are low, and we’re human. If you tell us what happened before we find out ourselves, chances are we’ll just let it slide.</span><span class="lang-nl">We rekenen op normaal gebruik—kleding is er om in te leven. Maar we weten ook dat ongelukjes gebeuren. Misschien is het rode wijn, misschien is het spaghetti. Het overkomt de beste. Maak je er niet druk om.<br><br>Het enige wat we vragen is dat je je gehuurde items met wat liefde behandelt, maar ga er niet gestrest over doen om ze perfect te houden. Live your life. Als er iets terugkomt met een klein, nauwelijks zichtbaar vlekje, brengen we je daar niets voor in rekening.<br><br>Als een item echt in onbruikbare staat wordt teruggebracht, kunnen we 50% van de verkoopprijs in rekening brengen—maar ook dan is het niet het einde van de wereld. Onze prijzen zijn laag, en we zijn gewoon mensen. Als je ons vertelt wat er is gebeurd voordat wij het zelf ontdekken, is de kans groot dat we er gewoon overheen stappen.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(3)">
            <div class="faq-question"><span class="lang-en">Do I have to be a member to shop at Dematerialized?</span><span class="lang-nl">Moet ik lid zijn om bij Dematerialized te shoppen?</span></div>
            <div class="icon-faq-plus w-embed" :style="{ display: faqOpen[3] ? 'none' : 'inline-flex' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: faqOpen[3] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: faqOpen[3] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">Nope! Anyone can shop at Dematerialized, but this is currently limited to in-person shopping in our showroom. Please note that new-in pieces are only available to our members (these are always on a clearly designated members-only rack). <br>‍<br>If you want to have access to the entire collection (in-store and online), we highly suggest that you become a member. Because whatever you may buy from us, you&#x27;ll probably get tired of it sooner rather than later. So why not just borrow it and give it back when you&#x27;re done (and pick something new in its place)? Shopping is way more fun (and sustainable) this way.</span><span class="lang-nl">Iedereen (ook niet-leden) kan items kopen in onze showroom in Den Bosch. We hebben op elk moment zo&#x27;n 175 items op de rekken hangen. <br><br>Wil je items huren uit de gedeelde kledingkast en/of toegang hebben tot de volledige collectie (alles wat je online ziet), dan heb je wel een actief lidmaatschap nodig.</span></div>
          </div>
        </div>
        <a href="/faq" class="faq-link hiw"><span class="lang-en">learn more</span><span class="lang-nl">meer tonen</span></a>
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
