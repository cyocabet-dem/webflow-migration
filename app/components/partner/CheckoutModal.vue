<script setup lang="ts">
// Partner reservation checkout — 4 steps driven by usePartnerCart's checkout state
// machine (CONTRACT §3.3): card on file → per-partner terms gates → confirm →
// per-item results. House modal mechanics (fixed backdrop + centered .pp-modal +
// Escape + overlay click + body overflow lock), locked while submitting.
const { locale, t } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const langPrefix = computed(() => (isNL.value ? '/nl' : ''))

const cart = usePartnerCart()
const { checkoutOpen, checkoutState, grouped, allTermsAccepted } = cart
const { hasActiveMembership } = useAuth()
const bodyLock = usePpBodyLock()

const state = checkoutState

// 'save a card' shows a spinner from click until the Stripe redirect actually navigates
const settingUp = ref(false)

const STEPS = ['card', 'terms', 'confirm', 'results'] as const
const stepIndex = computed(() => STEPS.indexOf(state.value.step))

const cardLabel = computed(() => {
  const c = state.value.cardStatus
  if (!c?.has_card) return ''
  return `${c.brand || 'card'} •••• ${c.last4 || '????'}`
})

// join cart groups with the loaded terms groups (pickup address teaser lives there)
const confirmGroups = computed(() =>
  grouped.value.map((g) => ({
    ...g,
    address: state.value.termsByPartner.find((p) => p.partner_slug === g.partner_slug)?.address ?? null,
  })),
)

function priceFor(item: { price_cents: number | null; member_price_cents: number | null }) {
  if (hasActiveMembership.value && item.member_price_cents !== null) {
    return item.member_price_cents
  }
  return item.price_cents
}

const KNOWN_ERROR_CODES = new Set([
  'item_unavailable',
  'stale_terms',
  'card_required',
  'max_items',
  'already_in_cart',
  'not_ready',
  'network',
  'generic',
])

function errorCopy(code: string | null | undefined, fallback?: string | null): string {
  if (code && KNOWN_ERROR_CODES.has(code)) return t(`partner.errors.${code}`)
  return fallback || t('partner.errors.generic')
}

const topError = computed(() => {
  if (!state.value.error) return ''
  return errorCopy(state.value.error, state.value.errorMessage)
})

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(isNL.value ? 'nl-NL' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return String(iso)
  }
}

async function onSaveCard() {
  if (settingUp.value) return
  settingUp.value = true
  try {
    await cart.startCardSetup() // navigates away on success
  } finally {
    settingUp.value = false
  }
}

function onClose() {
  if (state.value.submitting) return
  cart.closeCheckout()
  // leaving the results step also clears the results ('done' semantics for any close)
  if (state.value.step === 'results') cart.resetCheckout()
}

function onDone() {
  cart.closeCheckout()
  cart.resetCheckout()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && checkoutOpen.value) onClose()
}

// Body overflow lock — shared counter with the cart panel, so closing one overlay
// never unfreezes the page while the other is still open.
watch(checkoutOpen, (open) => {
  if (!import.meta.client) return
  if (open) bodyLock.lock()
  else bodyLock.unlock()
})

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  // The watcher dies with the component — release a lock still held for an open modal.
  if (checkoutOpen.value) bodyLock.unlock()
})
</script>

<template>
  <div v-if="checkoutOpen" class="pp-modal-backdrop pp-checkout-backdrop" @click.self="onClose()">
    <div class="pp-modal pp-modal-wide pp-checkout-modal" role="dialog" aria-modal="true">
      <button
        class="pp-modal-close"
        type="button"
        :disabled="state.submitting"
        :aria-label="$t('partner.checkout.closeLabel')"
        @click="onClose()"
      >&times;</button>
      <h2 class="pp-modal-title">{{ $t('partner.checkout.title') }}</h2>

      <!-- step indicator dots -->
      <div class="pp-checkout-steps" aria-hidden="true">
        <span
          v-for="(s, i) in STEPS"
          :key="s"
          class="pp-checkout-dot"
          :class="{ 'is-active': i === stepIndex, 'is-done': i < stepIndex }"
        ></span>
      </div>

      <!-- ============ step 1: card on file ============ -->
      <div v-if="state.step === 'card'" class="pp-checkout-body">
        <p v-if="state.setupCancelled" class="pp-checkout-note">
          {{ $t('partner.checkout.setupCancelled') }}
        </p>
        <p v-if="topError" class="pp-msg-error">{{ topError }}</p>

        <div v-if="state.cardLoading" class="pp-checkout-loading">
          <div class="pp-spinner"></div>
          <p>{{ $t('partner.checkout.loadingCard') }}</p>
        </div>

        <template v-else-if="state.cardStatus?.has_card">
          <div class="pp-checkout-card-row">
            <span class="pp-checkout-card-chip">{{ cardLabel }}</span>
            <span class="pp-checkout-card-ok">✓</span>
          </div>
          <p class="pp-checkout-copy">{{ $t('partner.checkout.cardOnFile') }}</p>
          <div class="pp-checkout-actions">
            <button class="pp-btn pp-btn-primary" type="button" @click="cart.continueToTerms()">
              {{ $t('partner.checkout.continue') }}
            </button>
          </div>
        </template>

        <template v-else-if="state.cardStatus?.pending_setup">
          <p class="pp-checkout-copy">{{ $t('partner.checkout.cardSyncing') }}</p>
          <div class="pp-checkout-actions">
            <button class="pp-btn pp-btn-outline" type="button" @click="cart.loadCard()">
              {{ $t('partner.checkout.checkAgain') }}
            </button>
            <button class="pp-btn pp-btn-ghost" type="button" :disabled="settingUp" @click="onSaveCard()">
              {{ $t('partner.checkout.saveCard') }}
            </button>
          </div>
        </template>

        <template v-else-if="state.cardStatus">
          <p class="pp-checkout-copy">{{ $t('partner.checkout.cardExplainer') }}</p>
          <div class="pp-checkout-actions">
            <button class="pp-btn pp-btn-primary" type="button" :disabled="settingUp" @click="onSaveCard()">
              <span v-if="settingUp" class="pp-checkout-spinner"></span>
              {{ $t('partner.checkout.saveCard') }}
            </button>
          </div>
        </template>

        <template v-else>
          <div class="pp-checkout-actions">
            <button class="pp-btn pp-btn-outline" type="button" @click="cart.loadCard()">
              {{ $t('partner.checkout.retry') }}
            </button>
          </div>
        </template>
      </div>

      <!-- ============ step 2: terms per partner ============ -->
      <div v-else-if="state.step === 'terms'" class="pp-checkout-body">
        <p v-if="state.error === 'stale_terms'" class="pp-msg-error">
          {{ $t('partner.checkout.staleNotice') }}
        </p>
        <div v-if="state.termsLoading" class="pp-checkout-loading">
          <div class="pp-spinner"></div>
          <p>{{ $t('partner.checkout.loadingTerms') }}</p>
        </div>
        <template v-else>
          <p class="pp-checkout-copy">{{ $t('partner.checkout.termsIntro') }}</p>
          <PartnerTermsGate
            v-for="group in state.termsByPartner"
            :key="group.partner_slug"
            :partner-name="group.partner_name"
            :terms="group.terms"
            :model-value="group.accepted"
            @update:model-value="(v: boolean) => (group.accepted = v)"
          />
          <div class="pp-checkout-actions">
            <button class="pp-btn pp-btn-ghost" type="button" @click="cart.goToStep('card')">
              {{ $t('partner.checkout.back') }}
            </button>
            <button
              class="pp-btn pp-btn-primary"
              type="button"
              :disabled="!allTermsAccepted"
              @click="cart.continueToConfirm()"
            >
              {{ $t('partner.checkout.continue') }}
            </button>
          </div>
        </template>
      </div>

      <!-- ============ step 3: confirm ============ -->
      <div v-else-if="state.step === 'confirm'" class="pp-checkout-body">
        <p v-if="topError" class="pp-msg-error">{{ topError }}</p>

        <div v-for="group in confirmGroups" :key="group.partner_slug" class="pp-checkout-confirm-group">
          <div class="pp-checkout-confirm-partner">
            <span class="pp-checkout-confirm-partner-name">{{ $t('partner.checkout.pickupAt', { name: group.partner_name }) }}</span>
            <span v-if="group.address" class="pp-checkout-confirm-address">{{ group.address }}</span>
          </div>
          <div v-for="item in group.items" :key="item.pp_id" class="pp-checkout-line">
            <div class="pp-checkout-line-thumb">
              <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" decoding="async">
            </div>
            <div class="pp-checkout-line-info">
              <div class="pp-checkout-line-title">{{ item.title }}</div>
              <div class="pp-checkout-line-meta">
                <span class="pp-chip" :class="item.intent === 'purchase' ? 'pp-chip-available' : 'pp-chip-rented'">
                  {{ item.intent === 'purchase' ? $t('partner.cart.intentBuy') : $t('partner.cart.intentRent') }}
                </span>
                <span class="pp-price-row">
                  <template v-if="hasActiveMembership && item.member_price_cents !== null">
                    <span class="pp-price-struck">{{ ppFormatPrice(item.price_cents) }}</span>
                    <span class="pp-price-member">{{ ppFormatPrice(item.member_price_cents) }}</span>
                  </template>
                  <template v-else>
                    <span class="pp-price-regular">{{ ppFormatPrice(priceFor(item)) }}</span>
                  </template>
                </span>
              </div>
              <div v-if="item.hold_deposit_cents" class="pp-checkout-line-hold">
                {{ $t('partner.checkout.holdAuthorise', { amount: ppFormatPrice(item.hold_deposit_cents) }) }}
              </div>
            </div>
          </div>
        </div>

        <div class="pp-checkout-confirm-notes">
          <p>{{ $t('partner.checkout.holdWindow') }}</p>
          <p>{{ $t('partner.checkout.payInStore') }}</p>
        </div>

        <div class="pp-checkout-actions">
          <button
            class="pp-btn pp-btn-ghost"
            type="button"
            :disabled="state.submitting"
            @click="cart.goToStep('terms')"
          >
            {{ $t('partner.checkout.back') }}
          </button>
          <button
            class="pp-btn pp-btn-primary"
            type="button"
            :disabled="state.submitting"
            @click="cart.submit()"
          >
            <span v-if="state.submitting" class="pp-checkout-spinner"></span>
            {{ state.submitting ? $t('partner.checkout.submitting') : $t('partner.checkout.submit') }}
          </button>
        </div>
      </div>

      <!-- ============ step 4: results ============ -->
      <div v-else-if="state.step === 'results'" class="pp-checkout-body">
        <div v-for="r in state.results || []" :key="r.item_hash_id" class="pp-checkout-result">
          <span class="pp-checkout-result-mark" :class="r.ok ? 'is-ok' : 'is-fail'">{{ r.ok ? '✓' : '✗' }}</span>
          <div class="pp-checkout-result-info">
            <div class="pp-checkout-result-title">{{ r.title || r.item_hash_id }}</div>
            <div v-if="r.ok" class="pp-checkout-result-detail">
              {{ $t('partner.checkout.reservedUntil', { date: formatDate(r.reservation?.hold_expires_at) }) }}
            </div>
            <div v-else class="pp-checkout-result-detail is-fail">
              {{ errorCopy(r.error?.code, r.error?.message) }}
            </div>
          </div>
        </div>

        <NuxtLink :to="`${langPrefix}/partner-activity`" class="pp-checkout-activity-link" @click="onDone()">
          {{ $t('partner.checkout.viewActivity') }}
        </NuxtLink>

        <div class="pp-checkout-actions">
          <button class="pp-btn pp-btn-primary" type="button" @click="onDone()">
            {{ $t('partner.checkout.done') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Partner checkout modal — .pp- scope only. Raised above the cart panel (9993) and
   the mobile bottom nav (9990); the shared .pp-modal-backdrop default is 4000. */
.pp-checkout-backdrop {
  z-index: 9996;
}

.pp-checkout-steps {
  display: flex;
  gap: 8px;
  margin: 10px 0 18px;
}
.pp-checkout-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--pp-gray-light);
  transition: background-color 0.2s ease;
}
.pp-checkout-dot.is-active {
  background: var(--pp-magenta);
}
.pp-checkout-dot.is-done {
  background: var(--pp-purple);
}

.pp-checkout-body {
  font-size: 15px;
}
.pp-checkout-loading {
  text-align: center;
  color: var(--pp-gray);
  padding: 12px 0 20px;
}
.pp-checkout-copy {
  color: var(--pp-gray);
  margin: 0 0 16px;
  line-height: 1.55;
}
.pp-checkout-note {
  background: #fef3e2;
  color: var(--pp-warning);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  margin: 0 0 12px;
}
.pp-checkout-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
}

/* card step */
.pp-checkout-card-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.pp-checkout-card-chip {
  display: inline-block;
  padding: 10px 16px;
  border: 1px solid var(--pp-gray-light);
  border-radius: 10px;
  background: var(--pp-bg-light);
  font-weight: 700;
  letter-spacing: 0.03em;
}
.pp-checkout-card-ok {
  color: var(--pp-success);
  font-size: 18px;
  font-weight: 700;
}

/* confirm step */
.pp-checkout-confirm-group {
  border: 1px solid var(--pp-gray-light);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.pp-checkout-confirm-partner {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}
.pp-checkout-confirm-partner-name {
  font-weight: 700;
  font-size: 15px;
}
.pp-checkout-confirm-address {
  font-size: 13px;
  color: var(--pp-gray);
}
.pp-checkout-line {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 10px 0;
  border-top: 1px solid var(--pp-bg-light);
}
.pp-checkout-line-thumb {
  width: 48px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--pp-bg-light);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pp-checkout-line-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.pp-checkout-line-info {
  flex: 1;
  min-width: 0;
}
.pp-checkout-line-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 3px;
  overflow-wrap: anywhere;
}
.pp-checkout-line-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
}
.pp-checkout-line-hold {
  margin-top: 4px;
  font-size: 12px;
  color: var(--pp-gray);
}
.pp-checkout-confirm-notes {
  background: var(--pp-bg-light);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--pp-gray);
}
.pp-checkout-confirm-notes p {
  margin: 0 0 4px;
}
.pp-checkout-confirm-notes p:last-child {
  margin-bottom: 0;
}

/* spinner inside buttons */
.pp-checkout-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: pp-spin 0.8s linear infinite;
}

/* results step */
.pp-checkout-result {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid var(--pp-bg-light);
}
.pp-checkout-result-mark {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}
.pp-checkout-result-mark.is-ok {
  color: var(--pp-success);
}
.pp-checkout-result-mark.is-fail {
  color: var(--pp-danger);
}
.pp-checkout-result-info {
  flex: 1;
  min-width: 0;
}
.pp-checkout-result-title {
  font-weight: 600;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.pp-checkout-result-detail {
  font-size: 13px;
  color: var(--pp-gray);
}
.pp-checkout-result-detail.is-fail {
  color: var(--pp-danger);
}
.pp-checkout-activity-link {
  display: inline-block;
  margin-top: 14px;
  font-size: 14px;
  color: var(--pp-magenta);
  text-decoration: underline;
}
</style>
