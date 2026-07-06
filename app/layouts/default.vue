<template>
  <div>
    <SiteNavbar />
    <slot />
    <SiteFooter />
    <MobileBottomNav />
    <AuthModal />
    <OnboardingModal />
    <CartPurchaseCartPanel />
    <CartCheckoutModal />
    <CartOverlay />
    <CartReservationModal />
    <CartUpgradeModal />
    <CartReservationSuccessModal />
    <ConsentBanner />
    <ConsentCookieWidget />
  </div>
</template>
