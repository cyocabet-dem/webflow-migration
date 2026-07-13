<script setup lang="ts">
// Partner dashboard — reservations (CONTRACT §3.4 GET /partner/reservations).
// Complete (purchase|rental) / decline / no-show, each through a confirm modal.
// The charged price is decided by the backend (buyer's membership at reservation
// time) — the complete modal shows both price tiers and says exactly that.
useHead({
  title: 'Partner reservations',
  meta: [{ name: 'robots', content: 'noindex' }],
})

interface ReservationItem {
  hash_id: string
  title: string
  photo_url: string | null
  purchase_price_cents: number | null
  member_purchase_price_cents: number | null
  rental_price_2wk_cents: number | null
  member_rental_price_2wk_cents: number | null
}

interface PartnerReservation {
  hash_id: string
  status: string
  intent: string
  hold_expires_at: string
  created_at: string
  hold_deposit_cents: number
  item: ReservationItem
  customer: { display_name: string; email: string }
}

interface FeeBreakdown {
  commission_rate_pct: number
  commission_base_cents: number
  commission_cents: number
  btw_cents: number
  fees_applied: boolean
}

interface CompleteResult {
  order: { hash_id: string; gross_amount_cents: number; rent_credit_cents: number }
  rental: { due_date: string } | null
  fees: FeeBreakdown
}

const { locale, t } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const { ppFetch } = usePartnerPlatform()

// Guard against double-prefixing: ppFetch's resolveMediaUrls already resolves
// backend-relative media paths against apiBase, so only a raw, unresolved
// '/partner-platform/…' path still needs the prefix here; already-resolved paths
// and absolute S3 URLs pass through untouched.
const apiPublicBase = useRuntimeConfig().public.apiBase
function mediaUrl(u: string | null | undefined): string {
  if (!u) return ''
  return u.startsWith('/partner-platform/') ? apiPublicBase + u : u
}

const state = ref<'loading' | 'ready' | 'error'>('loading')
const reservations = ref<PartnerReservation[]>([])
const filter = ref<'active' | 'all'>('active')

const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval> | undefined

// modal machinery (one at a time)
const modal = ref<'complete' | 'decline' | 'noshow' | null>(null)
const target = ref<PartnerReservation | null>(null)
const modalBusy = ref(false)
const modalError = ref('')

// complete-modal state
const completeType = ref<'purchase' | 'rental'>('purchase')
const rentalWeeks = ref(2)
const weeksOptions = ref<number[]>([2, 4])
const startDate = ref('')
const completeResult = ref<CompleteResult | null>(null)

const RES_STATUSES = new Set(['active', 'completed', 'expired', 'declined', 'no_show', 'cancelled'])
function statusLabel(status: string): string {
  return RES_STATUSES.has(status) ? t(`partnerDashboard.statuses.${status}`) : status
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso)
      .toLocaleDateString(isNL.value ? 'nl-NL' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      .toLowerCase()
  } catch {
    return String(iso)
  }
}

function endsSoon(r: PartnerReservation): boolean {
  const end = Date.parse(r.hold_expires_at)
  return Number.isFinite(end) && end - now.value < 24 * 60 * 60 * 1000 && end > now.value
}

function canNoShow(r: PartnerReservation): boolean {
  const end = Date.parse(r.hold_expires_at)
  return Number.isFinite(end) && now.value > end
}

function localToday(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

async function load() {
  state.value = 'loading'
  try {
    const data = await ppFetch<PartnerReservation[]>('/partner/reservations', {
      query: { status: filter.value },
    })
    reservations.value = Array.isArray(data) ? data : []
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}

function setFilter(f: 'active' | 'all') {
  if (filter.value === f) return
  filter.value = f
  load()
}

// --- modal open/close --------------------------------------------------------------------
function openModal(kind: 'complete' | 'decline' | 'noshow', r: PartnerReservation) {
  modal.value = kind
  target.value = r
  modalBusy.value = false
  modalError.value = ''
  completeResult.value = null
  if (kind === 'complete') {
    const canBuy = r.item.purchase_price_cents !== null
    const canRent = r.item.rental_price_2wk_cents !== null
    completeType.value = r.intent === 'rental' && canRent ? 'rental' : canBuy ? 'purchase' : 'rental'
    startDate.value = localToday()
    weeksOptions.value = [2, 4]
    rentalWeeks.value = 2
    loadWeekLimits(r)
  }
  document.body.style.overflow = 'hidden'
}

function closeModal(force = false) {
  if (modalBusy.value && !force) return
  const hadResult = !!completeResult.value
  modal.value = null
  target.value = null
  completeResult.value = null
  document.body.style.overflow = ''
  if (hadResult) load() // the completed reservation left the active list
}

// ReservationOut doesn't carry the item's rental week limits — the portal item does.
async function loadWeekLimits(r: PartnerReservation) {
  try {
    const item = await ppFetch<{ rental_min_weeks: number | null; rental_max_weeks: number | null }>(
      `/partner/items/${r.item.hash_id}`,
    )
    const lo = item.rental_min_weeks ?? 2
    const hi = item.rental_max_weeks ?? 4
    const opts = [2, 4].filter((w) => w >= lo && w <= hi)
    weeksOptions.value = opts.length ? opts : [2, 4]
    if (!weeksOptions.value.includes(rentalWeeks.value)) rentalWeeks.value = weeksOptions.value[0]!
  } catch {
    /* keep the 2/4 defaults — the backend re-validates anyway */
  }
}

// price preview for the complete modal (both tiers; the backend decides which applies)
const previewRegular = computed<number | null>(() => {
  const item = target.value?.item
  if (!item) return null
  if (completeType.value === 'purchase') return item.purchase_price_cents
  if (item.rental_price_2wk_cents === null) return null
  return item.rental_price_2wk_cents * (rentalWeeks.value / 2)
})
const previewMember = computed<number | null>(() => {
  const item = target.value?.item
  if (!item) return null
  if (completeType.value === 'purchase') return item.member_purchase_price_cents
  if (item.member_rental_price_2wk_cents === null) return null
  return item.member_rental_price_2wk_cents * (rentalWeeks.value / 2)
})

// --- actions ------------------------------------------------------------------------------
async function confirmComplete() {
  if (!target.value || modalBusy.value) return
  modalBusy.value = true
  modalError.value = ''
  try {
    const body: Record<string, unknown> = { type: completeType.value }
    if (completeType.value === 'rental') {
      body.rental_weeks = rentalWeeks.value
      body.start_date = startDate.value
    }
    completeResult.value = await ppFetch<CompleteResult>(
      `/partner/reservations/${target.value.hash_id}/complete`,
      { method: 'POST', body },
    )
  } catch (e: any) {
    modalError.value = e?.message || t('partnerDashboard.common.error')
  } finally {
    modalBusy.value = false
  }
}

async function confirmDecline() {
  if (!target.value || modalBusy.value) return
  modalBusy.value = true
  modalError.value = ''
  try {
    await ppFetch(`/partner/reservations/${target.value.hash_id}/decline`, { method: 'POST' })
    closeModal(true)
    load()
  } catch (e: any) {
    modalError.value = e?.message || t('partnerDashboard.common.error')
  } finally {
    modalBusy.value = false
  }
}

async function confirmNoShow() {
  if (!target.value || modalBusy.value) return
  modalBusy.value = true
  modalError.value = ''
  try {
    await ppFetch(`/partner/reservations/${target.value.hash_id}/no-show`, { method: 'POST' })
    closeModal(true)
    load()
  } catch (e: any) {
    modalError.value = e?.message || t('partnerDashboard.common.error')
  } finally {
    modalBusy.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && modal.value) closeModal()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  ticker = setInterval(() => {
    now.value = Date.now()
  }, 60 * 1000)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  if (ticker) clearInterval(ticker)
  if (modal.value) document.body.style.overflow = ''
})
</script>

<template>
  <section class="full-page-section pp-pres">
    <PartnerPortalShell @ready="load">
      <div class="pp-pres-head">
        <h2 class="pp-pres-title">{{ $t('partnerDashboard.reservations.title') }}</h2>
        <div class="pp-pres-toggle">
          <button
            class="pp-pres-toggle-btn"
            :class="{ 'is-active': filter === 'active' }"
            type="button"
            @click="setFilter('active')"
          >{{ $t('partnerDashboard.reservations.toggleActive') }}</button>
          <button
            class="pp-pres-toggle-btn"
            :class="{ 'is-active': filter === 'all' }"
            type="button"
            @click="setFilter('all')"
          >{{ $t('partnerDashboard.reservations.toggleAll') }}</button>
        </div>
      </div>

      <div v-if="state === 'loading'" class="pp-spinner"></div>

      <div v-else-if="state === 'error'" class="pp-state">
        <p>{{ $t('partnerDashboard.common.error') }}</p>
        <button class="pp-btn pp-btn-outline" type="button" @click="load()">
          {{ $t('partnerDashboard.common.retry') }}
        </button>
      </div>

      <div v-else-if="!reservations.length" class="pp-state">
        <h3>{{ $t('partnerDashboard.reservations.emptyTitle') }}</h3>
        <p>{{ $t('partnerDashboard.reservations.emptyBody') }}</p>
      </div>

      <div v-for="r in reservations" v-else :key="r.hash_id" class="pp-card">
        <div class="pp-card-row">
          <img
            v-if="r.item.photo_url"
            class="pp-card-thumb"
            :src="mediaUrl(r.item.photo_url)"
            :alt="r.item.title"
            loading="lazy"
            decoding="async"
          />
          <div v-else class="pp-card-thumb"></div>
          <div class="pp-pres-info">
            <p class="pp-card-title">{{ r.item.title }}</p>
            <p class="pp-card-meta">{{ r.customer.display_name }} · {{ r.customer.email }}</p>
            <div class="pp-pres-chips">
              <span class="pp-chip" :class="r.intent === 'purchase' ? 'pp-chip-available' : 'pp-chip-rented'">
                {{ r.intent === 'purchase' ? $t('partnerDashboard.reservations.intentPurchase') : $t('partnerDashboard.reservations.intentRental') }}
              </span>
              <span v-if="r.status !== 'active'" class="pp-chip" :class="`pp-chip-${r.status}`">
                {{ statusLabel(r.status) }}
              </span>
            </div>
            <p v-if="r.hold_deposit_cents > 0" class="pp-pres-hold">
              {{ $t('partnerDashboard.reservations.holdNote', { amount: ppFormatPrice(r.hold_deposit_cents) }) }}
            </p>
            <p v-if="r.status === 'active'" class="pp-pres-window" :class="{ 'is-soon': endsSoon(r) }">
              {{ $t('partnerDashboard.reservations.windowEnds', { date: formatDate(r.hold_expires_at) }) }}
            </p>
          </div>
          <div v-if="r.status === 'active'" class="pp-card-actions">
            <button class="pp-btn pp-btn-primary pp-btn-sm" type="button" @click="openModal('complete', r)">
              {{ $t('partnerDashboard.reservations.actionComplete') }}
            </button>
            <button class="pp-btn pp-btn-ghost pp-btn-sm" type="button" @click="openModal('decline', r)">
              {{ $t('partnerDashboard.reservations.actionDecline') }}
            </button>
            <button
              class="pp-btn pp-btn-danger pp-btn-sm"
              type="button"
              :disabled="!canNoShow(r)"
              :title="canNoShow(r) ? undefined : $t('partnerDashboard.reservations.noShowTooltip')"
              @click="openModal('noshow', r)"
            >
              {{ $t('partnerDashboard.reservations.actionNoShow') }}
            </button>
          </div>
        </div>
      </div>
    </PartnerPortalShell>

    <!-- ============ complete modal ============ -->
    <div v-if="modal === 'complete' && target" class="pp-modal-backdrop" @click.self="closeModal()">
      <div class="pp-modal" role="dialog" aria-modal="true">
        <template v-if="completeResult">
          <h3 class="pp-modal-title">{{ $t('partnerDashboard.reservations.successTitle') }}</h3>
          <ul class="pp-pres-fees">
            <li>
              <span>{{ $t('partnerDashboard.fees.charged') }}</span>
              <strong>{{ ppFormatPrice(completeResult.order.gross_amount_cents) }}</strong>
            </li>
            <li>
              <span>{{ $t('partnerDashboard.fees.commission', { pct: completeResult.fees.commission_rate_pct }) }}</span>
              <strong>{{ ppFormatPrice(completeResult.fees.commission_cents) }}</strong>
            </li>
            <li>
              <span>{{ $t('partnerDashboard.fees.btw') }}</span>
              <strong>{{ ppFormatPrice(completeResult.fees.btw_cents) }}</strong>
            </li>
          </ul>
          <p v-if="!completeResult.fees.fees_applied" class="pp-msg-success">
            {{ $t('partnerDashboard.fees.waived') }}
          </p>
          <p v-if="completeResult.rental" class="pp-pres-modal-copy">
            {{ $t('partnerDashboard.reservations.successDue', { date: formatDate(completeResult.rental.due_date) }) }}
          </p>
          <div class="pp-pres-modal-actions">
            <button class="pp-btn pp-btn-primary" type="button" @click="closeModal()">
              {{ $t('partnerDashboard.common.done') }}
            </button>
          </div>
        </template>

        <template v-else>
          <h3 class="pp-modal-title">{{ $t('partnerDashboard.reservations.completeTitle') }}</h3>
          <p class="pp-pres-modal-copy">{{ target.item.title }} — {{ target.customer.display_name }}</p>

          <div class="pp-field">
            <span class="pp-label">{{ $t('partnerDashboard.reservations.completeTypeLabel') }}</span>
            <label class="pp-pres-radio">
              <input v-model="completeType" type="radio" value="purchase" :disabled="target.item.purchase_price_cents === null" />
              {{ $t('partnerDashboard.reservations.typePurchase') }}
            </label>
            <label class="pp-pres-radio">
              <input v-model="completeType" type="radio" value="rental" :disabled="target.item.rental_price_2wk_cents === null" />
              {{ $t('partnerDashboard.reservations.typeRental') }}
            </label>
          </div>

          <template v-if="completeType === 'rental'">
            <div class="pp-field">
              <label class="pp-label" for="pp-res-weeks">{{ $t('partnerDashboard.reservations.weeksLabel') }}</label>
              <select id="pp-res-weeks" v-model.number="rentalWeeks" class="pp-select">
                <option v-for="w in weeksOptions" :key="w" :value="w">
                  {{ $t('partnerDashboard.item.weeksOption', { n: w }) }}
                </option>
              </select>
            </div>
            <div class="pp-field">
              <label class="pp-label" for="pp-res-start">{{ $t('partnerDashboard.reservations.startLabel') }}</label>
              <input id="pp-res-start" v-model="startDate" class="pp-input" type="date" />
            </div>
          </template>

          <div class="pp-pres-pricebox">
            <p class="pp-label">{{ $t('partnerDashboard.reservations.priceHeading') }}</p>
            <div v-if="previewRegular !== null" class="pp-price-row">
              <span class="pp-price-label">{{ $t('partnerDashboard.reservations.tierRegular') }}</span>
              <span class="pp-price-regular">{{ ppFormatPrice(previewRegular) }}</span>
            </div>
            <div v-if="previewMember !== null" class="pp-price-row">
              <span class="pp-price-label">{{ $t('partnerDashboard.reservations.tierMember') }}</span>
              <span class="pp-price-member">{{ ppFormatPrice(previewMember) }}</span>
            </div>
            <p class="pp-hint">{{ $t('partnerDashboard.reservations.priceNote') }}</p>
          </div>

          <p v-if="modalError" class="pp-msg-error">{{ modalError }}</p>

          <div class="pp-pres-modal-actions">
            <button class="pp-btn pp-btn-ghost" type="button" :disabled="modalBusy" @click="closeModal()">
              {{ $t('partnerDashboard.common.cancel') }}
            </button>
            <button class="pp-btn pp-btn-primary" type="button" :disabled="modalBusy" @click="confirmComplete()">
              {{ modalBusy ? $t('partnerDashboard.reservations.completing') : $t('partnerDashboard.reservations.confirmComplete') }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- ============ decline modal ============ -->
    <div v-if="modal === 'decline' && target" class="pp-modal-backdrop" @click.self="closeModal()">
      <div class="pp-modal" role="dialog" aria-modal="true">
        <h3 class="pp-modal-title">{{ $t('partnerDashboard.reservations.declineTitle') }}</h3>
        <p class="pp-pres-modal-copy">{{ $t('partnerDashboard.reservations.declineBody') }}</p>
        <p v-if="modalError" class="pp-msg-error">{{ modalError }}</p>
        <div class="pp-pres-modal-actions">
          <button class="pp-btn pp-btn-ghost" type="button" :disabled="modalBusy" @click="closeModal()">
            {{ $t('partnerDashboard.common.cancel') }}
          </button>
          <button class="pp-btn pp-btn-primary" type="button" :disabled="modalBusy" @click="confirmDecline()">
            {{ $t('partnerDashboard.reservations.declineConfirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ no-show modal ============ -->
    <div v-if="modal === 'noshow' && target" class="pp-modal-backdrop" @click.self="closeModal()">
      <div class="pp-modal" role="dialog" aria-modal="true">
        <h3 class="pp-modal-title">{{ $t('partnerDashboard.reservations.noShowTitle') }}</h3>
        <p class="pp-pres-modal-copy">
          {{ target.hold_deposit_cents > 0
            ? $t('partnerDashboard.reservations.noShowBody', { amount: ppFormatPrice(target.hold_deposit_cents) })
            : $t('partnerDashboard.reservations.noShowBodyNoHold') }}
        </p>
        <p v-if="modalError" class="pp-msg-error">{{ modalError }}</p>
        <div class="pp-pres-modal-actions">
          <button class="pp-btn pp-btn-ghost" type="button" :disabled="modalBusy" @click="closeModal()">
            {{ $t('partnerDashboard.common.cancel') }}
          </button>
          <button class="pp-btn pp-btn-danger" type="button" :disabled="modalBusy" @click="confirmNoShow()">
            {{ $t('partnerDashboard.reservations.noShowConfirm') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
.pp-pres-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  font-family: 'Urbanist', sans-serif;
}
.pp-pres-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
.pp-pres-toggle {
  display: inline-flex;
  border: 1px solid var(--pp-gray-light);
  border-radius: 50px;
  overflow: hidden;
}
.pp-pres-toggle-btn {
  padding: 6px 18px;
  border: none;
  background: #fff;
  color: var(--pp-gray);
  font-family: 'Urbanist', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.pp-pres-toggle-btn.is-active {
  background: var(--pp-magenta);
  color: #fff;
}
.pp-pres-info {
  flex: 1;
  min-width: 200px;
}
.pp-pres-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 5px;
}
.pp-pres-hold {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--pp-gray);
}
.pp-pres-window {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--pp-gray);
}
.pp-pres-window.is-soon {
  color: var(--pp-danger);
  font-weight: 700;
}
.pp-pres-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 16px;
  font-size: 14px;
  cursor: pointer;
}
.pp-pres-pricebox {
  background: var(--pp-bg-light);
  border-radius: 10px;
  padding: 12px 16px;
  margin: 14px 0;
}
.pp-pres-pricebox .pp-price-row {
  margin-bottom: 4px;
}
.pp-pres-fees {
  list-style: none;
  margin: 12px 0;
  padding: 0;
  border: 1px solid var(--pp-gray-light);
  border-radius: 10px;
}
.pp-pres-fees li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--pp-bg-light);
  font-size: 14px;
}
.pp-pres-fees li:last-child {
  border-bottom: none;
}
.pp-pres-modal-copy {
  color: var(--pp-gray);
  font-size: 14px;
  line-height: 1.55;
}
.pp-pres-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}
</style>
