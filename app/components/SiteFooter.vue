<script setup lang="ts">
// #footerJoinNow / #footerMyAccount visibility per the old updateFooterLinks():
// join-now for guests or members without a Stripe subscription; my-account when signed in.
const { isAuthenticated, hasActiveMembership } = useAuth()
const showJoinNow = computed(() => !isAuthenticated.value || !hasActiveMembership.value)
</script>

<template>
  <div class="w-embed w-script">
    <footer class="demat-footer">
      <div class="demat-footer-inner">
        <div class="demat-footer-top">
          <div>
            <div class="demat-footer-logo">
              <img src="/images/demat-sticker.png" alt="Dematerialized">
            </div>
          </div>
          <div>
            <p class="demat-footer-col-title"><span class="lang-en">customer care</span><span class="lang-nl">klantenservice</span></p>
            <ul class="demat-footer-links">
              <!-- static is-visible + v-show — class bindings mismatched at hydration are not patched -->
              <li class="demat-footer-auth-link is-visible" data-auth-gate v-show="showJoinNow" id="footerJoinNow">
                <a href="/memberships"><span class="lang-en">join now</span><span class="lang-nl">word lid</span></a>
              </li>
              <li class="demat-footer-auth-link is-visible" data-auth-gate v-show="isAuthenticated" id="footerMyAccount">
                <a href="/profile"><span class="lang-en">my account</span><span class="lang-nl">mijn account</span></a>
              </li>
              <li>
                <a href="/memberships"><span class="lang-en">memberships</span><span class="lang-nl">lidmaatschappen</span></a>
              </li>
              <li>
                <a href="/how-it-works"><span class="lang-en">how it works</span><span class="lang-nl">hoe het werkt</span></a>
              </li>
              <li>
                <a href="/donations"><span class="lang-en">donate your clothes</span><span class="lang-nl">doneer je kleding</span></a>
              </li>
            </ul>
          </div>
          <div>
            <p class="demat-footer-col-title"><span class="lang-en">company</span><span class="lang-nl">bedrijf</span></p>
            <ul class="demat-footer-links">
              <li>
                <a href="/about-us"><span class="lang-en">about us</span><span class="lang-nl">over ons</span></a>
              </li>
              <li>
                <a href="/terms-and-conditions"><span class="lang-en">legal &amp; privacy</span><span class="lang-nl">juridisch &amp; privacy</span></a>
              </li>
            </ul>
          </div>
          <div>
            <p class="demat-footer-col-title"><span class="lang-en">support</span><span class="lang-nl">hulp</span></p>
            <ul class="demat-footer-links">
              <li>
                <a href="/faq">faq</a>
              </li>
              <li>
                <a href="/return-policy"><span class="lang-en">return policy</span><span class="lang-nl">retourbeleid</span></a>
              </li>
              <li>
                <a href="/cancellation-policy"><span class="lang-en">cancellation policy</span><span class="lang-nl">annuleringsbeleid</span></a>
              </li>
              <li>
                <a href="/contact-us"><span class="lang-en">contact us</span><span class="lang-nl">contact</span></a>
              </li>
            </ul>
          </div>
        </div>
        <div class="demat-footer-bottom">
          <p class="demat-footer-copy">dematerialized 2026 | <span class="lang-en">all rights reserved</span><span class="lang-nl">alle rechten voorbehouden</span> | kvk 95760717</p>
          <div class="demat-footer-socials">
            <a href="https://www.instagram.com/dematerialized_nl/" target="_blank" rel="noopener" aria-label="Instagram">
              <svg viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"></path>
              </svg>
            </a>
            <a href="https://www.tiktok.com/@dematerialized_nl" target="_blank" rel="noopener" aria-label="TikTok">
              <svg viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.16v-3.44a4.85 4.85 0 01-1.64-.29 4.83 4.83 0 01-2.13-1.51V6.69h3.77z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
  <div class="mobile-footer-spacer"></div>
</template>

<style>
  /* === LOCALIZATION TOGGLE ===
     English is the default. When Webflow switches to Dutch,
     <html> gets lang="nl" and these rules flip visibility. */
  .demat-footer .lang-nl { display: none; }
  html[lang^="nl"] .demat-footer .lang-en { display: none; }
  html[lang^="nl"] .demat-footer .lang-nl { display: inline; }
  .demat-footer {
    background: var(--purple, #4b073f);
    padding: 64px 2rem 32px;
    font-family: 'Urbanist', sans-serif;
    color: rgba(255, 255, 255, 0.7);
  }
  @media (max-width: 767px) {
    .demat-footer {
      display: none !important;
    }
  }
  .demat-footer a {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .demat-footer a:hover {
    color: #ffffff;
  }
  .demat-footer-inner {
    max-width: 1200px;
    margin: 0 auto;
  }
  .demat-footer-top {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 48px;
    align-items: start;
    padding-bottom: 48px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }
  .demat-footer-logo {
    width: 100px;
    height: 100px;
    transform: rotate(-6deg);
  }
  .demat-footer-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .demat-footer-col-title {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 20px;
    letter-spacing: 0.5px;
  }
  .demat-footer-links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .demat-footer-links li a {
    font-size: 16px;
    font-weight: 400;
    letter-spacing: 0.2px;
  }
  .demat-footer-auth-link {
    display: none;
  }
  .demat-footer-auth-link.is-visible {
    display: list-item;
  }
  .demat-footer-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 28px;
    flex-wrap: wrap;
    gap: 16px;
  }
  .demat-footer-copy {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 0.2px;
  }
  .demat-footer-socials {
    display: flex;
    gap: 16px;
    align-items: center;
  }
  .demat-footer-socials a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    transition: background 0.2s ease;
  }
  .demat-footer-socials a:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .demat-footer-socials svg {
    width: 18px;
    height: 18px;
    fill: #ffffff;
  }
  @media (max-width: 991px) {
    .demat-footer {
      padding: 48px 2rem 28px;
    }
    .demat-footer-top {
      gap: 32px;
      padding-bottom: 36px;
    }
  }
</style>
