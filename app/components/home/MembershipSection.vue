<template>
  <div class="w-embed w-script">
    <section class="membership-section">
      <div class="membership-container">
        <p class="membership-eyebrow"><span class="lang-en">Ready to join?</span><span class="lang-nl">Klaar om lid te worden?</span></p>
        <h2 class="membership-heading"><span class="lang-en">get started with a membership</span><span class="lang-nl">kies een lidmaatschap</span></h2>
        <div class="pricing-card">
          <span class="pricing-badge"><span class="lang-en">most popular</span><span class="lang-nl">meest gekozen</span></span>
          <div class="pricing-row">
            <div class="pricing-info">
              <span class="price-old">€55</span>
              <span class="price-current">€27.50</span>
              <div class="price-details">
                <span class="price-period"><span class="lang-en">first month</span><span class="lang-nl">eerste maand</span></span>
                <span class="price-after"><span class="lang-en">€55/month after</span><span class="lang-nl">daarna €55/maand</span></span>
              </div>
            </div>
            <div class="pricing-icon">
              <svg viewBox="0 0 24 24">
                <rect x="1" y="3" width="15" height="13" rx="1"></rect>
                <path d="M16 8h4l3 3v5h-7V8z"></path>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
          </div>
          <p class="pricing-features"><span class="lang-en">5 items per month · 1 shipment per month · shipping included (both ways)</span><span class="lang-nl">5 items per maand · 1 zending per maand · verzending inbegrepen (heen en terug)</span></p>
        </div>
        <div class="info-card">
          <div class="info-icon">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <path d="M9 16l2 2 4-4"></path>
            </svg>
          </div>
          <div class="info-content">
            <h3><span class="lang-en">flexibility built in</span><span class="lang-nl">altijd flexibel</span></h3>
            <p><span class="lang-en">We ship anywhere in the Netherlands. Pause or cancel anytime.</span><span class="lang-nl">We versturen door heel Nederland. Pauzeer of zeg op wanneer je wilt.</span></p>
          </div>
        </div>
        <button class="membership-cta-button" data-membership="5 items, 1 shipment per month">
          <span class="lang-en">join now</span><span class="lang-nl">word lid</span>
          <span class="cta-divider"></span>
          €27.50
        </button>
        <a href="/memberships" class="explore-link"><span class="lang-en">explore other plans</span><span class="lang-nl">bekijk andere lidmaatschappen</span></a>
      </div>
    </section>
  </div>
</template>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  :root {
    /* Primary dark */
    --purple: #4b073f;
    --purple-dark: #a92296;
    --blue: #04314d;
    --teal: #008ad4;
    --black: #000000;
    --gray-dark: #24282d;
    --gray-medium: #46535e;
    /* Accent bright */
    --pink: #e84dd8;
    --cyan: #2cc4ff;
    /* Backgrounds light */
    --pink-light: #fff4fe;
    --blue-light: #b6e8ff;
    --gray-light: #ced5da;
    --pink-very-light: #fff4fe;
    --blue-very-light: #eff9ff;
    --gray-very-light: #f6f8f9;
    --white: #ffffff;
    --radius: 20px;
  }
  body {
    font-family: 'Urbanist', sans-serif;
    background: var(--white);
    color: var(--black);
    line-height: 1.6;
  }
  /* Section container */
  .membership-section {
    background: var(--pink-light);
    padding: 80px 2rem;
  }
  .membership-container {
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
  }
  /* Section header */
  .membership-eyebrow {
    font-size: 20px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--gray-dark);
    margin-bottom: 12px;
  }
  .membership-heading {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--gray-dark);
    margin-bottom: 32px;
  }
  /* Main pricing card */
  .pricing-card {
    background: var(--white);
    border-radius: var(--radius);
    padding: 24px;
    margin-bottom: 16px;
    text-align: left;
  }
  .pricing-badge {
    display: inline-block;
    font-size: 18px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--gray-dark);
    margin-bottom: 16px;
  }
  .pricing-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .pricing-info {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .price-old {
    font-size: 1.25rem;
    font-weight: 500;
    color: var(--gray-medium);
    text-decoration: line-through;
  }
  .price-current {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--gray-dark);
    line-height: 1;
  }
  .price-details {
    display: flex;
    flex-direction: column;
    margin-left: 8px;
  }
  .price-period {
    font-size: 18px;
    font-weight: 500;
    color: var(--gray-dark);
  }
  .price-after {
    font-size: 16px;
    color: var(--gray-medium);
  }
  .pricing-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pricing-icon svg {
    width: 48px;
    height: 48px;
    stroke: var(--gray-dark);
    stroke-width: 1.5;
    fill: none;
  }
  .pricing-features {
    font-size: 18px;
    color: var(--gray-medium);
    letter-spacing: 0.3px;
    padding-top: 16px;
    border-top: 1px solid var(--gray-light);
  }
  /* Info card */
  .info-card {
    background: var(--blue-light);
    border-radius: var(--radius);
    padding: 20px 24px;
    margin-bottom: 32px;
    display: flex;
    align-items: center;
    gap: 16px;
    text-align: left;
  }
  .info-icon {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .info-icon svg {
    width: 32px;
    height: 32px;
    stroke: var(--gray-dark);
    stroke-width: 1.5;
    fill: none;
  }
  .info-content h3 {
    font-size: 22px;
    font-weight: 600;
    color: var(--gray-dark);
    margin-bottom: 4px;
    letter-spacing: 0.3px;
  }
  .info-content p {
    font-size: 18px;
    color: var(--gray-dark);
    line-height: 1.5;
    letter-spacing: 0.3px;
  }
  /* CTA Button */
  .membership-cta-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--purple);
    color: var(--white);
    padding: 16px 48px;
    border-radius: 50px;
    font-size: 20px;
    font-weight: 600;
    text-decoration: none;
    letter-spacing: 0.5px;
    transition: background 0.2s ease, transform 0.2s ease;
    border: none;
    cursor: pointer;
    font-family: 'Urbanist', sans-serif;
  }
  .membership-cta-button:hover {
    background: var(--gray-dark) !important;
    transform: translateY(-1px);
  }
  .cta-divider {
    width: 1px;
    height: 16px;
    background: rgba(255, 255, 255, 0.4);
  }
  /* Explore link */
  .explore-link {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: var(--gray-dark);
    text-decoration: underline;
    margin-top: 20px;
    letter-spacing: 0.3px;
    transition: color 0.2s ease;
  }
  .explore-link:hover {
    color: var(--purple-dark);
  }
  /* Responsive */
  @media (max-width: 600px) {
    .membership-section {
      padding: 60px 1.5rem;
    }
    .pricing-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    .pricing-icon {
      display: none;
    }
    .info-card {
      flex-direction: column;
      gap: 12px;
    }
  }
</style>
