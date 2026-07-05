<script setup lang="ts">
useHead({
  title: 'Dematerialized | Frequently Asked Questions',
  meta: [
    {
      name: 'description',
      content:
        'How does Dematerialized clothing rental in Den Bosch work? Do I have to be a member to rent clothes from Dematerialized? Can I buy clothes from the collection?',
    },
    { property: 'og:title', content: 'Dematerialized | Frequently Asked Questions' },
    {
      property: 'og:description',
      content:
        'How does Dematerialized clothing rental in Den Bosch work? Do I have to be a member to rent clothes from Dematerialized? Can I buy clothes from the collection?',
    },
    {
      property: 'og:image',
      content:
        'https://dematerialized.nl/images/meta/faq-meta.png',
    },
    { name: 'twitter:title', content: 'Dematerialized | Frequently Asked Questions' },
    {
      name: 'twitter:description',
      content:
        'How does Dematerialized clothing rental in Den Bosch work? Do I have to be a member to rent clothes from Dematerialized? Can I buy clothes from the collection?',
    },
    {
      name: 'twitter:image',
      content:
        'https://dematerialized.nl/images/meta/faq-meta.png',
    },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
})

const openFaqs = ref<boolean[]>(new Array(26).fill(false))
function toggleFaq(i: number) {
  openFaqs.value[i] = !openFaqs.value[i]
}
</script>

<template>
  <section class="full-page-section faq">
    <div class="w-layout-blockcontainer container-wrapper-mem faq w-container">
      <div class="div-mobile-header-mem">
        <div class="content-wrapper memberships">
          <div class="heading-centered"><span class="lang-en">frequently asked questions</span><span class="lang-nl">Veelgestelde vragen</span></div>
        </div>
      </div>
    </div>
  </section>
  <div class="div-section-faq">
    <div class="div-faq-section">
      <div class="content-wrapper-mem faq">
        <div id="faq-general" class="faq-section-header"><span class="lang-en">General</span><span class="lang-nl">Algemeen</span></div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(0)">
            <div class="faq-question"><span class="lang-en">What are your opening hours?</span><span class="lang-nl">Wat zijn je openingstijden?</span></div>
            <div v-show="!openFaqs[0]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[0] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[0] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">We&#x27;re always open online! And you can find our showroom opening hours here: https://dematerialized.nl/contact-us</span><span class="lang-nl">Onze openingstijden zijn als volgt:Maandag tot en met woensdag: geslotenDonderdag: 12 - 21Vrijdag: 12 - 19Zaterdag-zondag: 12 - 18</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(1)">
            <div class="faq-question"><span class="lang-en">What kind of clothes can I find at Dematerialized?</span><span class="lang-nl">Wat voor kleding kan ik vinden bij Dematerialized?</span></div>
            <div v-show="!openFaqs[1]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[1] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[1] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">A little bit of everything, honestly. For a special occasion or no occasion at all (we prefer the latter). <br><br>We’ve got everyday staples, fun statement pieces, and the kind of things that make picking out an outfit feel easy. Our racks are filled with a mix of local donations and curated finds—blazers, dresses, outerwear, denim, tops, and more.<br><br>You’ll find hundreds of brands—some premium, some fast fashion, some high-street—but we don’t obsess over labels. Actually, we cut them out. It&#x27;s the piece that matters, not the name inside.<br><br>Everything you&#x27;ll find in our collection has been cleaned, steamed, and approved for another round in someone’s closet (maybe yours).</span><span class="lang-nl">Een beetje van alles, eerlijk gezegd. Voor een speciale gelegenheid of helemaal geen gelegenheid (we geven de voorkeur aan het laatste). <br><br>We hebben alledaagse benodigdheden, leuke statement-items en het soort dingen die ervoor zorgen dat het kiezen van een outfit gemakkelijk is. Onze rekken zijn gevuld met een mix van lokale donaties en geselecteerde vondsten: blazers, jurken, bovenkleding, spijkerbroeken, tops en meer.<br><br>Je vindt er een mix van meer dan 300 merken, sommige premium, sommige fast fashion, sommige high-street, maar we zijn niet geobsedeerd door labels. Wat voor ons belangrijk is, is stijl, kwaliteit en de mogelijkheid om opnieuw te worden gedragen. <br><br>Alles wat je in onze collectie vindt, is schoongemaakt, gestoomd en goedgekeurd voor nog een rondje in iemands kast (misschien de jouwe).</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(2)">
            <div class="faq-question"><span class="lang-en">Can I also rent shoes, bags, or other accessories?</span><span class="lang-nl">Kan ik ook schoenen, tassen of andere accessoires huren?</span></div>
            <div v-show="!openFaqs[2]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[2] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[2] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">Short answer: No. But this is temporary! Except for shoes. You&#x27;ll never be able to rent those from us, mainly because we don&#x27;t want to clean them. Feet aren&#x27;t our thing. But keep an eye out for bags. We&#x27;ll be making those available for rent soon! As for accessories, we think of those as freebies, so they won&#x27;t count toward your rental items.<br><br>Despite our feelings about renting shoes, we do accept them into our collection and they are made available for purchase in our showroom or online via your account (you must be a member).</span><span class="lang-nl">Kort antwoord: Nee. Hoewel we deze items in onze collectie accepteren, zijn schoenen, tassen en andere accessoires alleen verkrijgbaar in onze winkel. Het is niet mogelijk om deze artikelen te huren.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(3)">
            <div class="faq-question"><span class="lang-en">I want to become a member. How can I sign up?</span><span class="lang-nl">Ik wil lid worden. Hoe kan ik me aanmelden?</span></div>
            <div v-show="!openFaqs[3]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[3] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[3] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">You can sign up online <a href="/memberships" class="in-text-link-policies small">here</a>.<br></span><span class="lang-nl">Om de best mogelijke ervaring voor onze huidige leden te garanderen bij de overgang naar onze nieuwe locatie aan de Lange Putstraat 4 in Den Bosch, nemen we tijdelijk geen nieuwe leden aan.<a href="/memberships" class="in-text-link-policies small">here</a>.<br></span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(4)">
            <div class="faq-question"><span class="lang-en">Do I have to be a member to shop at Dematerialized?</span><span class="lang-nl">Moet ik lid zijn om bij Dematerialized te shoppen?</span></div>
            <div v-show="!openFaqs[4]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[4] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[4] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">Nope! Anyone can shop at Dematerialized, but this is currently limited to in-person shopping in our showroom. Please note that new-in pieces are only available to our members (these are always on a clearly designated members-only rack). <br><br>If you want to have access to the entire collection (in-store and online), we highly suggest that you become a member. Because whatever you may buy from us, you&#x27;ll probably get tired of it sooner rather than later. So why not just borrow it and give it back when you&#x27;re done (and pick something new in its place)? Shopping is way more fun (and sustainable) this way.</span><span class="lang-nl">Nee! Iedereen kan shoppen bij Dematerialized. Maar dragen is beter dan kopen. Dus als je merkt dat je vaak terugkomt, raden we je ten zeerste aan om lid te worden. </span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(5)">
            <div class="faq-question"><span class="lang-en">What are freebies?</span><span class="lang-nl">Wat zijn freebies?</span></div>
            <div v-show="!openFaqs[5]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[5] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[5] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">Some items are wearable but not rental-worthy—we make these available for free for our members and call them freebies.<br><br>Freebies are items like basics (plain tees) or those with minor flaws (mendable holes, missing buttons, and so on). We treat these items with the same level of care as our rentals, because all clothes deserve some respect. That means any freebie you receive will be washed and ironed. The only reason we can’t guarantee ready to wear is because the level of damage varies per item.<br><br>Our members can add up to two freebies per rental order, whether that&#x27;s in-store or online.</span><span class="lang-nl">Sommige items zijn draagbaar, maar niet huurwaardig. We stellen deze gratis beschikbaar voor onze leden en noemen ze freebies.Freebies zijn items zoals basics (effen T-shirts) of items met kleine gebreken (herstelbare gaten, ontbrekende knopen, enzovoort). We behandelen deze artikelen met dezelfde zorg als onze verhuurders, want alle kleding verdient respect. Dat betekent dat alle freebie die je ontvangt, wordt gewassen en gestreken. De enige reden waarom we niet kunnen garanderen dat het product klaar is voor gebruik, is omdat de mate van schade per item verschilt.Er is geen limiet aan het aantal freebies dat onze leden elke maand voor zichzelf kunnen nemen.</span></div>
          </div>
        </div>
      </div>
    </div>
    <div class="div-faq-section">
      <div class="content-wrapper-mem faq">
        <div id="faq-rentals" class="faq-section-header"><span class="lang-en">clothing rentals</span><span class="lang-nl">Kleding huren</span></div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(6)">
            <div class="faq-question"><span class="lang-en">How do clothing rentals work?</span><span class="lang-nl">Hoe werkt kledingverhuur?</span></div>
            <div v-show="!openFaqs[6]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[6] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[6] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">It’s really simple. You subscribe to a membership, pick out the items you want to wear, wear them, give them back to us, and pick out new items. No need to wash anything before returning—we’ll take care of that before another member rents it.<br><br>If you&#x27;re a <strong>home delivery member</strong> (i.e., your membership includes shipping), you&#x27;ll typically receive your items in 1-3 business days. <br><br>If you&#x27;re a<strong> local member</strong>, all you have to do is stop by our showroom to pick out your items, or reserve them online to try on in store.<br><br>You can keep your rental items as long as you&#x27;d like. There&#x27;s no return deadline. <br><br>And if you like something enough to keep it, you&#x27;ll get 50% off the resale price.</span><span class="lang-nl">Het is heel eenvoudig. Je kiest een lidmaatschap — ofwel 2 items of 5 items tegelijk — en dat is alles. Je kunt ze gedurende de maand zo vaak als je wilt ruilen voor nieuwe stukken en dingen zo lang bewaren als je wilt.Je komt gewoon naar de winkel, neemt wat je leuk vindt, draagt het zo lang als je wilt en brengt het terug wanneer je klaar bent om iets anders te proberen. U hoeft niets te wassen voordat u terugkomt. Dat regelen wij voordat een ander lid het huurt.Verhuur is bedoeld om gemakkelijk en leuk te zijn. Het is maar één grote kast, en er is zeker voor elk wat wils.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(7)">
            <div class="faq-question">How do I return my rental items?</div>
            <div v-show="!openFaqs[7]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[7] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[7] ? 'flex' : 'none' }">
            <div class="faq-answer">How you return your items depends on your membership.<br><br>If you&#x27;re a <strong>home delivery</strong> <strong>member</strong>, all you have to do is place the items you want to return back into the same package you received from us (no need to wash anything!). Then go to the <strong>my rentals</strong> page in your account and click the <strong>request return</strong> button. From there, select the items you will be sending back to us and, once you confirm, you&#x27;ll receive an email with a QR code that you can show at your nearest PostNL drop-off point.<br><br>If you&#x27;re a <strong>local member</strong>, you can stop by our showroom during normal business hours or by appointment to return your current rentals and pick something new.</div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(8)">
            <div class="faq-question"><span class="lang-en">What happens if I damage a rental item?</span><span class="lang-nl">Wat gebeurt er als ik een gehuurd item beschadig?</span></div>
            <div v-show="!openFaqs[8]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[8] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[8] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">We expect normal wear—clothes are meant to be lived in. But we also know accidents happen. Maybe it’s red wine, maybe it’s spaghetti. It happens. Don’t stress about it.<br><br>All we ask is that you treat your rentals with love, but don’t obsess over keeping them perfect. Live your life. If something comes back with a small, barely noticeable flaw, we won’t charge you for it.<br><br>If an item is returned in a truly unusable condition, we may charge 50% of the retail price—but even then, it’s not the end of the world. Our prices are low, and we’re human. If you tell us what happened before we find out ourselves, chances are we’ll just let it slide.</span><span class="lang-nl">We verwachten normale gebruik—kleding is bedoeld om in te leven. Maar we weten ook dat ongelukken gebeuren. Misschien is het rode wijn, misschien spaghetti. Het gebeurt. Maak je daar geen zorgen over.<br><br>Het enige wat we vragen is dat je je huurwoningen met liefde behandelt, maar dat u niet geobsedeerd bent om ze perfect te houden. Leef je leven. Als er iets terugkomt met een kleine, nauwelijks waarneembare fout, brengen we daar geen kosten voor in rekening.<br><br>Als een artikel wordt geretourneerd in een werkelijk onbruikbare staat, kunnen we 50% van de verkoopprijs in rekening brengen, maar zelfs dan is dat niet het einde van de wereld. Onze prijzen zijn laag en we zijn mensen. Als je ons vertelt wat er is gebeurd voordat we er zelf achter komen, is de kans groot dat we het gewoon aan ons voorbij laten gaan.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(9)">
            <div class="faq-question"><span class="lang-en">Do I have to be a member to rent clothes from Dematerialized?</span><span class="lang-nl">Moet ik lid zijn om kleding te huren bij Dematerialized?</span></div>
            <div v-show="!openFaqs[9]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[9] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[9] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">Yes, you have to have an active membership if you want to rent items from our collection. If you&#x27;re not a member, you still have the option to purchase items from our showroom in Den Bosch.</span><span class="lang-nl">Ja, je moet een actief lidmaatschap hebben als je items uit onze collectie wilt huren. Als je geen lid bent, heb je nog steeds de mogelijkheid om artikelen te kopen op onze fysieke winkellocatie in Den Bosch.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(10)">
            <div class="faq-question"><span class="lang-en">Do I have to return rental items within a certain time frame?</span><span class="lang-nl">Moet ik gehuurde items binnen een bepaalde tijd inleveren?</span></div>
            <div v-show="!openFaqs[10]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[10] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[10] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">Nope! You can keep your rentals as long as you&#x27;d like (if you have an active membership, that is).</span><span class="lang-nl">Nee! Je kunt je huurprijzen zo lang behouden als je wilt (als je een actief lidmaatschap hebt, dat wil zeggen).</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(11)">
            <div class="faq-question"><span class="lang-en">I like one of my rentals too much to return. Can I buy it?</span><span class="lang-nl">Ik vind een van mijn gehuurde items te leuk om terug te geven. Kan ik het kopen?</span></div>
            <div v-show="!openFaqs[11]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[11] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[11] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">Yes, you always have the option to purchase any of your current rental items. You&#x27;ll even get a 50% discount on the retail price. </span><span class="lang-nl">Ja, je hebt altijd de mogelijkheid om al je huidige huurartikelen te kopen. Je krijgt zelfs 50% korting op de verkoopprijs. </span></div>
          </div>
        </div>
      </div>
    </div>
    <div class="div-faq-section">
      <div class="content-wrapper-mem faq">
        <div id="faq-donations" class="faq-section-header"><span class="lang-en">donations &amp; store credit</span><span class="lang-nl">Donaties en winkeltegoed</span></div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(12)">
            <div class="faq-question"><span class="lang-en">How can I donate items?</span><span class="lang-nl">Hoe kan ik items doneren?</span></div>
            <div v-show="!openFaqs[12]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[12] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[12] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">It’s simple—just gather your clothes, put them in a bag (or two or three), and bring them into our showroom in Den Bosch during opening hours. We’ll take care of the rest.<br><br>Please don’t bring donations in suitcases, boxes, or other large containers, as we don’t have space to store them. Regular shopping or garbage bags work perfectly.<br><br>Please note that we are currently working on a way to enable members to ship pre-loved items to us, because we know it&#x27;s not convenient for everyone to make a trip to Den Bosch. More to come on this!</span><span class="lang-nl">Het is eenvoudig: pak gewoon je kleren, stop ze in een tas (of twee of drie) en breng ze naar de winkel tijdens de openingsuren. Wij zorgen voor de rest.Breng alstublieft geen donaties mee in koffers, dozen of andere grote containers, want we hebben geen ruimte om ze op te slaan. Gewone boodschappen of vuilniszakken werken perfect.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(13)">
            <div class="faq-question"><span class="lang-en">Do I have to be a member to donate items?</span><span class="lang-nl">Moet ik lid zijn om items te doneren?</span></div>
            <div v-show="!openFaqs[13]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[13] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[13] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">No, we accept donations from members and non-members alike! However, only members have the opportunity to receive store credit. Non-members will receive a discount based on the number of items donated: 10% off for 1–10 items, 15% off for 11–20 items, and 25% off for 21+ items.</span><span class="lang-nl">Nee, we accepteren donaties van zowel leden als niet-leden! Alleen leden hebben echter de mogelijkheid om winkeltegoed te ontvangen. Niet-leden krijgen een korting op basis van het aantal gedoneerde artikelen: 10% korting voor 1 tot 10 artikelen, 15% korting voor 11-20 artikelen en 25% korting voor meer dan 21 artikelen.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(14)">
            <div class="faq-question"><span class="lang-en">How do you evaluate and award store credits for donated items? (members only)</span><span class="lang-nl">Hoe evalueer en beloon je winkeltegoed voor gedoneerde items (alleen voor leden)?</span></div>
            <div v-show="!openFaqs[14]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[14] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[14] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">We don&#x27;t believe in brand-based evaluations. What we do believe in is judging a piece based on wearability, so the amount of store credit you receive depends on these factors:</span><span class="lang-nl">We zijn niet zo dol op merkgebaseerde evaluaties, maar we zijn wel van mening dat tweedehands nooit meer mag kosten dan het kopen van iets nieuws. Om alles eerlijk en evenwichtig te houden, hangt de hoeveelheid winkeltegoed die je ontvangt af van drie factoren:</span></div>
            <ul role="list" class="list-policies top-margin">
              <li class="list-item-policies faq"><span class="lang-en">The category your item falls into (e.g., outerwear, dresses, or tops)</span><span class="lang-nl">De categorie waarin je item valt (bijvoorbeeld bovenkleding, jurken of tops)</span></li>
              <li class="list-item-policies faq"><span class="lang-en">Whether it’s in good enough condition to be rented at least once</span><span class="lang-nl">Of het in goede staat is om minstens één keer te worden gehuurd</span></li>
            </ul>
            <div class="faq-answer"><span class="lang-en">So when you donate your clothes to Dematerialized, your store credit is based on these criteria. It&#x27;s not a perfect science, but we promise you&#x27;ll get some bang for your buck. You can view the maximum credit amounts for each category in the table below:<br></span><span class="lang-nl">Dus als je je kleding doneert aan Dematerialized, is je winkeltegoed gebaseerd op deze criteria. In de onderstaande tabel kunt u de exacte winkeltegoed voor elke categorie bekijken:<br></span></div>
            <div class="div-store-credit-table">
              <ul role="list" class="list-policies top-margin">
                <li class="list-item-policies faq"><span class="lang-en"><strong>Outerwear, Blazers, and Sets </strong>: up to € 5</span><span class="lang-nl"><strong>Outerwear, Blazers, and Sets </strong>Bovenkleding, blazers en sets</span></li>
              </ul>
              <ul role="list" class="list-policies top-margin">
                <li class="list-item-policies faq"><span class="lang-en"><strong>Dresses and Jumpsuits :</strong> up to € 4</span><span class="lang-nl"><strong>Dresses and Jumpsuits :</strong>Jurken en jumpsuits</span></li>
              </ul>
              <ul role="list" class="list-policies top-margin">
                <li class="list-item-policies faq"><span class="lang-en"><strong>Tops and Bottoms : </strong>up to € 3</span><span class="lang-nl"><strong>Tops and Bottoms : </strong>Tops en bottoms</span></li>
              </ul>
              <ul role="list" class="list-policies top-margin">
                <li class="list-item-policies faq"><span class="lang-en"><strong>Basics :</strong> wearable basics are freebies, so no store credit awarded</span><span class="lang-nl"><strong>Basics :</strong>Basisprincipes</span></li>
              </ul>
              <ul role="list" class="list-policies top-margin">
                <li class="list-item-policies faq"><span class="lang-en"><strong>Shoes and Bags :</strong> up to € 5</span><span class="lang-nl"><strong>Shoes and Bags :</strong>Schoenen en tassen</span></li>
              </ul>
              <ul role="list" class="list-policies top-margin bottom-margin">
                <li class="list-item-policies faq"><span class="lang-en"><strong>Accessories : </strong>we think of accessories as freebies, so no store credit awarded</span><span class="lang-nl"><strong>Accessories : </strong>Accessoires (er worden geen winkeltegoed toegekend)</span></li>
              </ul>
            </div>
            <div class="faq-answer"><span class="lang-en"><strong>We keep our prices intentionally low so that the credits you earn translate to real value when you purchase items from us.</strong><br></span><span class="lang-nl"><strong>We houden onze prijzen opzettelijk laag, zodat de winkeltegoed die u verdient, worden vertaald naar de werkelijke waarde wanneer u bij ons huurt of winkelt.</strong><br></span></div>
            <div class="faq-answer"><span class="lang-en"><strong>Please note that all donations are final, so only donate items if you’re comfortable with the evaluation outcome—even if that means receiving €0 in store credit.</strong><br></span><span class="lang-nl"><strong>Houd er rekening mee dat alle donaties definitief zijn, doneer dus alleen items als u tevreden bent met het evaluatieresultaat, zelfs als dat betekent dat u €0 aan winkeltegoed ontvangt.</strong><br></span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(15)">
            <div class="faq-question"><span class="lang-en">Do you accept designer or luxury items?</span><span class="lang-nl">Accepteert Dematerialized designer- of luxeartikelen?</span></div>
            <div v-show="!openFaqs[15]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[15] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[15] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">Yes, absolutely! But please note that we don’t give extra store credit or higher discounts for premium brands. We&#x27;ll probably cut the tag out anyway. So if your goal is to earn more money from high-end pieces, we recommend selling them yourself or through a consignment platform.<br><br>Our donation service is designed to make decluttering easier—not to maximize resale value. We want to help you free up space, feel lighter, and maybe discover something new in our shared closet.</span><span class="lang-nl">Ja, absoluut! Houd er echter rekening mee dat we geen extra winkeltegoed of hogere kortingen geven voor premiummerken. Als het je doel is om meer geld te verdienen met hoogwaardige stukken, raden we je aan ze zelf of via een consignatieplatform te verkopen.<br><br>Onze donatieservice is ontworpen om het opruimen gemakkelijker te maken, niet om de inruilwaarde te maximaliseren. We willen je helpen ruimte vrij te maken, je lichter te voelen en misschien iets nieuws te ontdekken in onze gedeelde kast.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(16)">
            <div class="faq-question"><span class="lang-en">I think my clothes are worth more than what I have been awarded. Can I take them back?</span><span class="lang-nl">Ik denk dat mijn kleding meer waard is dan wat ik heb gekregen. Kan ik ze terugnemen?</span></div>
            <div v-show="!openFaqs[16]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[16] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[16] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">No, all donations are final. This is one way that we ensure we can keep our prices fair. Because all donations are final, we ask that you please only donate items if you’re comfortable with the evaluation outcome—even if that means receiving €0 in store credit.</span><span class="lang-nl">Nee, alle donaties zijn definitief. Dit is een manier waarop we ervoor zorgen dat we onze prijzen eerlijk kunnen houden. Omdat alle donaties definitief zijn, vragen we je om alleen items te doneren als je tevreden bent met het evaluatieresultaat, zelfs als dat betekent dat je €0 aan winkeltegoed ontvangt.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(17)">
            <div class="faq-question"><span class="lang-en">What happens with my clothes after I donate them?</span><span class="lang-nl">Wat gebeurt er met mijn kleding nadat ik ze heb gedoneerd?</span></div>
            <div v-show="!openFaqs[17]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[17] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[17] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">The process differs slightly for members and non-members.<br><br>If you’re not a member, we’ll simply count the number of items you donate (same day) and give you a discount card based on that number: 10% off for 1–10 items, 15% off for 11–20 items, and 25% off for 21+ items.<br><br>If you’re a member, your items go through a more detailed process. First, everything is washed and steamed so we can properly evaluate the condition. Then, each piece is inspected for damages or defects and assessed to determine if it’s suitable for rental. We aim to complete this process within two weeks, though larger donations may take a bit longer and sometimes we&#x27;re just really backed up.<br><br>For every item that can be rented out, you’ll receive store credit in your account, which you can use toward purchases—both in-store and online. Please note that only current rental items are available for online purchase.</span><span class="lang-nl">Het proces verschilt enigszins voor leden en niet-leden.<br><br>Als je geen lid bent, tellen we gewoon het aantal artikelen dat je doneert (dezelfde dag) en geven we je een kortingskaart op basis van dat aantal: 10% korting voor 1 tot 10 artikelen, 15% korting voor 11-20 artikelen en 25% korting voor meer dan 21 artikelen.<br><br>Als je lid bent, doorlopen je items een meer gedetailleerd proces. Eerst wordt alles gewassen en gestoomd zodat we de conditie goed kunnen inschatten. Vervolgens wordt elk stuk geïnspecteerd op beschadigingen of defecten en beoordeeld om te bepalen of het geschikt is voor verhuur. We streven ernaar om dit proces binnen vijf werkdagen af te ronden, hoewel grotere donaties iets langer kunnen duren.<br><br>Voor elk item dat kan worden verhuurd, ontvang je winkeltegoed in je account, dat je kunt gebruiken voor huur of aankopen, zowel in de winkel als online. Houd er rekening mee dat alleen actuele huurartikelen online kunnen worden gekocht.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(18)">
            <div class="faq-question"><span class="lang-en">How can I use my store credit? (members only)</span><span class="lang-nl">Hoe kan ik mijn winkeltegoed gebruiken?</span></div>
            <div v-show="!openFaqs[18]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[18] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[18] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">You can use your store credit in a few different ways. If you fall in love with a rental and want to keep it, you can use your credit to buy it. You can also use it toward an item in-store when you don’t have enough rental credits left or you would like to purchase a non-rental item, like shoes.</span><span class="lang-nl">Je kunt je winkeltegoed op verschillende manieren gebruiken. Als je verliefd wordt op een huurwoning en deze wilt behouden, kun je je krediet gebruiken om deze te kopen. Je kunt het ook gebruiken voor een item in de winkel als je niet genoeg huurtegoeden over hebt, of zelfs om tot 50% van je volgende lidmaatschapsbetaling te dekken.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(19)">
            <div class="faq-question"><span class="lang-en">Where can I see how much store credit I have?</span><span class="lang-nl">Waar kan ik zien hoeveel winkeltegoed ik heb?</span></div>
            <div v-show="!openFaqs[19]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[19] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[19] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">You can keep track of your store credit in your account under<strong> donations &amp; store credit</strong>.</span><span class="lang-nl">Je kunt je winkelkrediet bijhouden in je online account.</span></div>
          </div>
        </div>
      </div>
    </div>
    <div class="div-faq-section">
      <div class="content-wrapper-mem faq">
        <div id="faq-memberships" class="faq-section-header"><span class="lang-en">memberships</span><span class="lang-nl">Lidmaatschappen</span></div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(20)">
            <div class="faq-question"><span class="lang-en">I want to become a member. How can I sign up?</span><span class="lang-nl">Ik wil lid worden. Hoe kan ik me aanmelden?</span></div>
            <div v-show="!openFaqs[20]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[20] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[20] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">You can sign up <a href="/memberships" class="in-text-link-policies small">here</a>.</span><span class="lang-nl">Je kunt je aanmelden <a href="/memberships" class="in-text-link-policies small">hier</a>.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(21)">
            <div class="faq-question">What does a dematerialized membership cost?</div>
            <div v-show="!openFaqs[21]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[21] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[21] ? 'flex' : 'none' }">
            <div class="faq-answer">We have a few different membership options you can choose from, starting at €25/month. You can view prices for all memberships <a href="/memberships" class="in-text-link-policies small">here</a>.</div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(22)">
            <div class="faq-question"><span class="lang-en">Is there a minimum membership term?</span><span class="lang-nl">Is er een minimale lidmaatschapstermijn?</span></div>
            <div v-show="!openFaqs[22]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[22] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[22] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">No. Memberships are billed on a monthly basis, and you can pause or cancel anytime. However, no partial refunds will be given if you decide to pause or cancel mid-month.</span><span class="lang-nl">Nee. Lidmaatschappen worden maandelijks gefactureerd en je kunt ze op elk gewenst moment onderbreken of opzeggen. Er wordt echter geen gedeeltelijke terugbetaling gegeven als u besluit om halverwege de maand te pauzeren of te annuleren.</span></div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(23)">
            <div class="faq-question">When will I be charged for my membership?</div>
            <div v-show="!openFaqs[23]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[23] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[23] ? 'flex' : 'none' }">
            <div class="faq-answer">You will be charged each month on the day that you signed up. For example, if you signed up on February 15th, you&#x27;ll be charged again on March 15th.</div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(24)">
            <div class="faq-question">Which payment methods do you accept?</div>
            <div v-show="!openFaqs[24]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[24] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[24] ? 'flex' : 'none' }">
            <div class="faq-answer">We accept the following payment methods for memberships: iDEAL | Wero, SEPA Direct Debit, and most credit cards (Visa, Mastercard, AMEX, etc.).<br><br>Please note that we do not accept cash payments in the showroom. We only accept card payments, or payments made using Apply Pay or Google Pay.</div>
          </div>
        </div>
        <div class="div-faq-wrapper">
          <div class="div-faq-question" @click="toggleFaq(25)">
            <div class="faq-question"><span class="lang-en">I cancelled my membership. Can I still use my store credits?</span><span class="lang-nl">Ik heb mijn lidmaatschap opgezegd. Kan ik mijn winkeltegoed nog steeds gebruiken?</span></div>
            <div v-show="!openFaqs[25]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg></div>
            <div class="icon-faq-min w-embed" :style="{ display: openFaqs[25] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                <path d="M5 12h14"></path>
              </svg></div>
          </div>
          <div class="div-faq-answer" :style="{ display: openFaqs[25] ? 'flex' : 'none' }">
            <div class="faq-answer"><span class="lang-en">No, store credits are a members-only privilege. If you cancel your membership, you will lose all unused store credits. If you pause your membership, however, your store credits will still be there (for up to 6 months) when you decide to reactivate.</span><span class="lang-nl">Nee, winkeltegoeden zijn alleen toegankelijk voor leden. Als je je lidmaatschap opzegt, verlies je alle ongebruikte winkeltegoeden. Als je je lidmaatschap echter pauzeert, blijven je winkeltegoeden geldig wanneer je besluit om het opnieuw te activeren. </span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="mobile-footer-spacer"></div>
</template>
