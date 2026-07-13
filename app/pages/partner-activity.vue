<script setup lang="ts">
// Partner activity — the user-facing account view for partner-shop activity
// (CONTRACT §3.3 GET /user/history + POST /user/reservations/{hash}/cancel, spec §15).
// Sits inside the standard account sidenav layout (copied from reservations.vue).
// No membership gate: non-member consumers reserve partner items too.
// State machine: loading → signin | empty | content — all client-side, no middleware.
useHead({
  title: 'Partner Items',
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
})

const { locale, t } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const langPrefix = computed(() => (isNL.value ? '/nl' : ''))

const route = useRoute()

// Active sidenav link, computed from the route (same helper as the sibling account pages).
// Strip a leading /nl so NL pages match the English-slug hrefs.
function isSidenavActive(href: string) {
  const currentPath = route.path.replace(/\/$/, '').replace(/^\/nl(?=\/|$)/, '')
  const normalized = href.replace(/\/$/, '')
  return currentPath === normalized || currentPath.startsWith(normalized + '/')
}

// Hide the reservations sidenav link for shipping members (synchronous, from auth plugin state)
const { userData: authUserData, openAuthModal } = useAuth()
const SHIPPING_MEMBERSHIP_NAMES = ['5 items, 1 shipment per month', '5 items per shipment, 2 shipments per month']
const hideReservationsLink = computed(() => SHIPPING_MEMBERSHIP_NAMES.includes(authUserData.value?.membership?.name ?? ''))

const { partnerUiEnabled, probe, ppFetch, getToken } = usePartnerPlatform()

// ============================================================
// CONTRACT §3.3 shapes (user view)
// ============================================================

interface ActItemRef {
  hash_id: string
  title: string | null
  photo_url: string | null
}

interface ActReservation {
  hash_id: string
  status: string
  intent: 'purchase' | 'rental'
  hold_expires_at: string | null
  created_at: string | null
  hold_deposit_cents: number | null
  item: ActItemRef | null
  partner: { name: string; slug: string; address: string | null; pickup_instructions: string | null } | null
}

interface ActOrder {
  hash_id: string
  type: 'purchase' | 'rental' | 'rent_to_own'
  gross_amount_cents: number | null
  rent_credit_cents: number | null
  member_price_applied: boolean
  status: string
  completed_at: string | null
  item: ActItemRef | null
}

interface ActRental {
  hash_id: string
  start_date: string | null
  due_date: string | null
  returned_at: string | null
  return_condition: string | null
  deposit_cents: number | null
  order: ActOrder | null
}

interface ActPartnerGroup {
  partner: { name: string; slug: string } | null
  reservations: ActReservation[]
  rentals: ActRental[]
  purchases: ActOrder[]
}

// ============================================================
// STATE MACHINE: loading → signin | empty | content
// ============================================================

type PageState = 'loading' | 'signin' | 'empty' | 'content'
const state = ref<PageState>('loading')
const activeReservations = ref<ActReservation[]>([])
const historyGroups = ref<ActPartnerGroup[]>([])

// Single source: GET /user/history — its reservations arrays feed the active
// section, its rentals/purchases feed the per-partner history sections.
async function load(silent = false) {
  if (!silent) state.value = 'loading'
  await probe()
  const token = await getToken()
  if (!token) {
    state.value = 'signin'
    return
  }
  try {
    const data = await ppFetch<{ partners: ActPartnerGroup[] }>('/user/history')
    const groups = Array.isArray(data?.partners) ? data.partners : []
    activeReservations.value = groups
      .flatMap((g) => g.reservations || [])
      .filter((r) => r.status === 'active')
      .sort(
        (a, b) =>
          new Date(a.hold_expires_at || 0).getTime() - new Date(b.hold_expires_at || 0).getTime(),
      )
    historyGroups.value = groups.filter(
      (g) => (g.rentals || []).length > 0 || (g.purchases || []).length > 0,
    )
    state.value =
      activeReservations.value.length || historyGroups.value.length ? 'content' : 'empty'
  } catch (e) {
    if (e instanceof PartnerApiError && e.status === 401) state.value = 'signin'
    // Anything else (partner backend down, transport error) degrades to the
    // gentle empty state — the page never breaks.
    else state.value = 'empty'
  }
}

function activeRentals(group: ActPartnerGroup): ActRental[] {
  return (group.rentals || []).filter((r) => !r.returned_at)
}

function pastRentals(group: ActPartnerGroup): ActRental[] {
  return (group.rentals || []).filter((r) => !!r.returned_at)
}

function isOverdue(rental: ActRental): boolean {
  if (rental.returned_at || !rental.due_date) return false
  return new Date(rental.due_date + 'T23:59:59').getTime() < Date.now()
}

// ============================================================
// FORMATTING
// ============================================================

function formatDate(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d
    .toLocaleDateString(isNL.value ? 'nl-NL' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .toLowerCase()
}

function storefrontUrl(slug?: string | null): string {
  return `${langPrefix.value}/partners/${encodeURIComponent(slug || '')}`
}

const ORDER_TYPE_CHIPS: Record<string, string> = {
  purchase: 'pp-chip-sold',
  rental: 'pp-chip-rented',
  rent_to_own: 'pp-chip-available',
}

function orderTypeChip(type: string): string {
  return ORDER_TYPE_CHIPS[type] || ''
}

function orderTypeLabel(type: string): string {
  if (type === 'rental') return t('partner.activity.typeRental')
  if (type === 'rent_to_own') return t('partner.activity.typeRentToOwn')
  return t('partner.activity.typePurchase')
}

// ============================================================
// CANCEL FLOW: confirm dialog → POST /user/reservations/{hash}/cancel → refresh
// ============================================================

const cancelTarget = ref<ActReservation | null>(null)
const cancelBusy = ref(false)
const cancelError = ref('')

// Codes with dedicated partner.errors.* copy; anything else falls back to the
// backend's message (PartnerApiError.message) or the generic line.
const KNOWN_ERROR_CODES = new Set(['item_unavailable', 'stale_terms', 'card_required', 'network', 'generic'])

function errorCopy(code: string | null, fallback?: string | null): string {
  if (code && KNOWN_ERROR_CODES.has(code)) return t(`partner.errors.${code}`)
  return fallback || t('partner.errors.generic')
}

function openCancel(reservation: ActReservation) {
  cancelTarget.value = reservation
  cancelError.value = ''
  document.body.style.overflow = 'hidden'
}

function closeCancel() {
  if (cancelBusy.value) return
  cancelTarget.value = null
  document.body.style.overflow = ''
}

async function confirmCancel() {
  const target = cancelTarget.value
  if (!target || cancelBusy.value) return
  cancelBusy.value = true
  cancelError.value = ''
  try {
    await ppFetch(`/user/reservations/${encodeURIComponent(target.hash_id)}/cancel`, {
      method: 'POST',
    })
    cancelTarget.value = null
    document.body.style.overflow = ''
    await load(true)
  } catch (e) {
    if (e instanceof PartnerApiError) cancelError.value = errorCopy(e.code, e.message)
    else cancelError.value = t('partner.errors.network')
  } finally {
    cancelBusy.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && cancelTarget.value) closeCancel()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  load()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="w-layout-blockcontainer container-1300 full-screen w-container">
    <div class="div-header-policies res"></div>
    <div class="div-section-policies rentals">
      <div class="sidenav-account-pages w-embed w-script">
        <nav class="account-sidenav" aria-label="Account navigation">
          <div class="account-sidenav-inner">
            <a href="/profile" class="account-sidenav-link" :class="{ active: isSidenavActive('/profile') }" data-nav="profile">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4"></circle>
                  <path d="M20 21a8 8 0 1 0-16 0"></path>
                </svg>
              </span>
              <span class="lang-en">profile</span><span class="lang-nl">profiel</span>
            </a>
            <a href="/my-rentals" class="account-sidenav-link" :class="{ active: isSidenavActive('/my-rentals') }" data-nav="my-rentals">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="m21 16-9-6.5V6a2 2 0 1 0-4 0"></path>
                  <path d="M3 16h18v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
              </span>
              <span class="lang-en">my rentals</span><span class="lang-nl">mijn huurartikelen</span>
            </a>
            <a v-show="!hideReservationsLink" href="/reservations" class="account-sidenav-link" :class="{ active: isSidenavActive('/reservations') }" data-nav="reservations" data-auth-gate="collapse">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                  <path d="M16 2v4M8 2v4M3 10h18"></path>
                </svg>
              </span>
              <span class="lang-en">reservations</span><span class="lang-nl">reserveringen</span>
            </a>
            <div class="account-sidenav-sep"></div>
            <a href="/donations-credits" class="account-sidenav-link" :class="{ active: isSidenavActive('/donations-credits') }" data-nav="donations">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </svg>
              </span>
              <span class="lang-en">donations &amp; credits</span><span class="lang-nl">donaties &amp; tegoed</span>
            </a>
            <a href="/purchases" class="account-sidenav-link" :class="{ active: isSidenavActive('/purchases') }" data-nav="purchases">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <path d="M3 6h18"></path>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </span>
              <span class="lang-en">purchases</span><span class="lang-nl">aankopen</span>
            </a>
            <a v-show="partnerUiEnabled" href="/partner-activity" class="account-sidenav-link" :class="{ active: isSidenavActive('/partner-activity') }" data-nav="partner-activity">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path>
                  <circle cx="7.5" cy="7.5" r="1"></circle>
                </svg>
              </span>
              <span class="lang-en">partner items</span><span class="lang-nl">partneritems</span>
            </a>
            <div class="account-sidenav-sep"></div>
            <a href="/my-membership" class="account-sidenav-link" :class="{ active: isSidenavActive('/my-membership') }" data-nav="membership">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26z"></path>
                </svg>
              </span>
              <span class="lang-en">membership</span><span class="lang-nl">lidmaatschap</span>
            </a>
          </div>
        </nav>
      </div>
      <div class="div-policy-menu rentals right">
        <div class="div-content-wrapper-policies right rentals">
          <div class="pp-act">
            <!-- loading -->
            <div v-if="state === 'loading'" class="pp-act-loading">
              <div class="pp-spinner"></div>
              <p class="pp-act-loading-text">{{ $t('partner.activity.loading') }}</p>
            </div>

            <!-- signin -->
            <div v-else-if="state === 'signin'" class="pp-state">
              <h3>{{ $t('partner.activity.signinTitle') }}</h3>
              <p>{{ $t('partner.activity.signinText') }}</p>
              <button class="pp-btn pp-btn-primary" type="button" @click="openAuthModal()">
                {{ $t('partner.activity.signin') }}
              </button>
            </div>

            <!-- empty -->
            <div v-else-if="state === 'empty'" class="pp-state">
              <h3>{{ $t('partner.activity.emptyTitle') }}</h3>
              <p>{{ $t('partner.activity.emptyText') }}</p>
              <NuxtLink :to="`${langPrefix}/partners`" class="pp-btn pp-btn-outline">
                {{ $t('partner.activity.browsePartners') }}
              </NuxtLink>
            </div>

            <!-- content -->
            <template v-else>
              <div class="pp-act-page-header">
                <h1 class="pp-act-title">{{ $t('partner.activity.title') }}</h1>
              </div>

              <!-- active reservations first -->
              <section v-if="activeReservations.length" class="pp-act-section">
                <h2 class="pp-act-heading">{{ $t('partner.activity.activeReservations') }}</h2>
                <div v-for="r in activeReservations" :key="r.hash_id" class="pp-card pp-act-res">
                  <div class="pp-card-row">
                    <img
                      v-if="r.item?.photo_url"
                      class="pp-card-thumb"
                      :src="r.item.photo_url"
                      :alt="r.item?.title || ''"
                      loading="lazy"
                      decoding="async"
                    >
                    <div v-else class="pp-card-thumb"></div>
                    <div class="pp-act-res-info">
                      <p class="pp-card-title">{{ r.item?.title }}</p>
                      <p class="pp-card-meta">
                        <NuxtLink :to="storefrontUrl(r.partner?.slug)" class="pp-act-shop-link">{{ r.partner?.name }}</NuxtLink>
                      </p>
                      <p class="pp-act-chips">
                        <span class="pp-chip" :class="r.intent === 'purchase' ? 'pp-chip-available' : 'pp-chip-rented'">
                          {{ r.intent === 'purchase' ? $t('partner.cart.intentBuy') : $t('partner.cart.intentRent') }}
                        </span>
                        <span class="pp-act-until">{{ $t('partner.activity.reserveUntil', { date: formatDate(r.hold_expires_at) }) }}</span>
                      </p>
                    </div>
                    <div class="pp-card-actions">
                      <button class="pp-btn pp-btn-danger pp-btn-sm" type="button" @click="openCancel(r)">
                        {{ $t('partner.activity.cancel') }}
                      </button>
                    </div>
                  </div>
                  <div class="pp-act-pickup">
                    <p v-if="r.partner?.address">
                      <strong>{{ $t('partner.activity.pickupAt') }} {{ r.partner?.name }}</strong> — {{ r.partner?.address }}
                    </p>
                    <p v-if="r.partner?.pickup_instructions">{{ r.partner.pickup_instructions }}</p>
                    <p v-if="r.hold_deposit_cents" class="pp-act-hold">
                      {{ $t('partner.activity.holdNote', { amount: ppFormatPrice(r.hold_deposit_cents) }) }}
                    </p>
                  </div>
                </div>
              </section>

              <!-- per-partner history -->
              <section v-for="group in historyGroups" :key="group.partner?.slug || ''" class="pp-act-section">
                <div class="pp-act-partner-header">
                  <h2 class="pp-act-heading">{{ group.partner?.name }}</h2>
                  <NuxtLink :to="storefrontUrl(group.partner?.slug)" class="pp-act-shop-link">
                    {{ $t('partner.activity.visitShop') }}
                  </NuxtLink>
                </div>

                <template v-if="activeRentals(group).length">
                  <h3 class="pp-act-subheading">{{ $t('partner.activity.activeRentals') }}</h3>
                  <div
                    v-for="rental in activeRentals(group)"
                    :key="rental.hash_id"
                    class="pp-card"
                    :class="{ 'pp-act-overdue': isOverdue(rental) }"
                  >
                    <div class="pp-card-row">
                      <img
                        v-if="rental.order?.item?.photo_url"
                        class="pp-card-thumb"
                        :src="rental.order.item.photo_url"
                        :alt="rental.order?.item?.title || ''"
                        loading="lazy"
                        decoding="async"
                      >
                      <div v-else class="pp-card-thumb"></div>
                      <div class="pp-act-res-info">
                        <p class="pp-card-title">{{ rental.order?.item?.title }}</p>
                        <p class="pp-act-chips">
                          <span class="pp-act-due" :class="{ 'pp-act-due-overdue': isOverdue(rental) }">
                            {{ $t('partner.activity.dueBack', { date: formatDate(rental.due_date) }) }}
                          </span>
                          <span v-if="isOverdue(rental)" class="pp-chip pp-chip-damaged">{{ $t('partner.activity.overdue') }}</span>
                        </p>
                        <p v-if="rental.deposit_cents" class="pp-card-meta">
                          {{ $t('partner.activity.deposit', { amount: ppFormatPrice(rental.deposit_cents) }) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </template>

                <template v-if="(group.purchases || []).length">
                  <h3 class="pp-act-subheading">{{ $t('partner.activity.purchases') }}</h3>
                  <div v-for="order in group.purchases" :key="order.hash_id" class="pp-card">
                    <div class="pp-card-row">
                      <img
                        v-if="order.item?.photo_url"
                        class="pp-card-thumb"
                        :src="order.item.photo_url"
                        :alt="order.item?.title || ''"
                        loading="lazy"
                        decoding="async"
                      >
                      <div v-else class="pp-card-thumb"></div>
                      <div class="pp-act-res-info">
                        <p class="pp-card-title">{{ order.item?.title }}</p>
                        <p class="pp-act-chips">
                          <span class="pp-chip" :class="orderTypeChip(order.type)">{{ orderTypeLabel(order.type) }}</span>
                          <span class="pp-act-price">{{ ppFormatPrice(order.gross_amount_cents) }}</span>
                        </p>
                        <p v-if="order.type === 'rent_to_own' && (order.rent_credit_cents || 0) > 0" class="pp-card-meta">
                          {{ $t('partner.activity.rentCredit', { amount: ppFormatPrice(order.rent_credit_cents) }) }}
                        </p>
                        <p v-if="order.completed_at" class="pp-card-meta">
                          {{ $t('partner.activity.completedOn', { date: formatDate(order.completed_at) }) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </template>

                <template v-if="pastRentals(group).length">
                  <h3 class="pp-act-subheading">{{ $t('partner.activity.rentalHistory') }}</h3>
                  <div v-for="rental in pastRentals(group)" :key="rental.hash_id" class="pp-card">
                    <div class="pp-card-row">
                      <img
                        v-if="rental.order?.item?.photo_url"
                        class="pp-card-thumb"
                        :src="rental.order.item.photo_url"
                        :alt="rental.order?.item?.title || ''"
                        loading="lazy"
                        decoding="async"
                      >
                      <div v-else class="pp-card-thumb"></div>
                      <div class="pp-act-res-info">
                        <p class="pp-card-title">{{ rental.order?.item?.title }}</p>
                        <p class="pp-card-meta">
                          {{ $t('partner.activity.rentalPeriod', { start: formatDate(rental.start_date), due: formatDate(rental.due_date) }) }}
                        </p>
                        <p class="pp-act-chips">
                          <span class="pp-act-returned">{{ $t('partner.activity.returnedOn', { date: formatDate(rental.returned_at) }) }}</span>
                          <span v-if="rental.return_condition" class="pp-chip" :class="rental.return_condition === 'ok' ? 'pp-chip-ok' : 'pp-chip-damaged'">
                            {{ rental.return_condition === 'ok' ? $t('partner.activity.conditionOk') : $t('partner.activity.conditionDamaged') }}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </template>
              </section>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="mobile-footer-spacer"></div>

  <!-- cancel confirm dialog (house modal mechanics: backdrop click + Escape + body lock) -->
  <div v-if="cancelTarget" class="pp-modal-backdrop" @click.self="closeCancel()">
    <div class="pp-modal" role="dialog" aria-modal="true">
      <h2 class="pp-modal-title">{{ $t('partner.activity.cancelTitle') }}</h2>
      <p class="pp-act-cancel-copy">{{ $t('partner.activity.cancelBody', { title: cancelTarget.item?.title || '' }) }}</p>
      <p v-if="cancelError" class="pp-msg-error">{{ cancelError }}</p>
      <div class="pp-act-cancel-actions">
        <button class="pp-btn pp-btn-ghost" type="button" :disabled="cancelBusy" @click="closeCancel()">
          {{ $t('partner.activity.cancelKeep') }}
        </button>
        <button class="pp-btn pp-btn-danger" type="button" :disabled="cancelBusy" @click="confirmCancel()">
          {{ cancelBusy ? $t('partner.activity.cancelling') : $t('partner.activity.cancelConfirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style>
/* Partner activity — page-specific styles, .pp- scope only */
.pp-act {
  width: 100%;
  font-family: 'Urbanist', sans-serif;
  color: var(--pp-ink);
}
.pp-act-loading {
  text-align: center;
  padding: 40px 0;
}
.pp-act-loading-text {
  color: var(--pp-gray);
  font-size: 14px;
  margin: 0;
}
.pp-act-page-header {
  margin-bottom: 20px;
}
.pp-act-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  text-transform: lowercase;
}
.pp-act-section {
  margin-bottom: 36px;
}
.pp-act-heading {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 12px;
  text-transform: lowercase;
}
.pp-act-subheading {
  font-size: 14px;
  font-weight: 600;
  color: var(--pp-gray);
  margin: 18px 0 8px;
  text-transform: lowercase;
}
.pp-act-partner-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--pp-gray-light);
  padding-bottom: 8px;
  margin-bottom: 4px;
}
.pp-act-partner-header .pp-act-heading {
  margin: 0;
}
.pp-act-shop-link {
  color: var(--pp-magenta);
  font-size: 13px;
  font-weight: 600;
  text-decoration: underline;
}
.pp-act-res-info {
  flex: 1;
  min-width: 200px;
}
.pp-act-res-info .pp-card-title,
.pp-act-res-info .pp-card-meta {
  margin: 0 0 4px;
}
.pp-act-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 0 0 4px;
}
.pp-act-until,
.pp-act-due,
.pp-act-returned {
  font-size: 13px;
  color: var(--pp-gray);
}
.pp-act-due-overdue {
  color: var(--pp-danger);
  font-weight: 600;
}
.pp-act-overdue {
  border-color: var(--pp-danger);
}
.pp-act-price {
  font-size: 14px;
  font-weight: 700;
}
.pp-act-pickup {
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--pp-bg-light);
  border-radius: 8px;
  font-size: 13px;
  color: var(--pp-gray);
}
.pp-act-pickup p {
  margin: 0 0 4px;
}
.pp-act-pickup p:last-child {
  margin-bottom: 0;
}
.pp-act-hold {
  color: var(--pp-warning);
}
.pp-act-cancel-copy {
  color: var(--pp-gray);
  font-size: 15px;
  line-height: 1.55;
  margin: 10px 0 16px;
}
.pp-act-cancel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}
@media (max-width: 600px) {
  .pp-act .pp-card-actions {
    margin-left: 0;
    width: 100%;
  }
}
</style>
