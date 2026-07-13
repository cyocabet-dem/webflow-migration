<script setup lang="ts">
// Partner dashboard — rentals (CONTRACT §3.4 GET /partner/rentals).
// Return (ok|damaged), charge damage (capture deposit / off-session charge /
// write-off), and rent-to-own (rent already paid comes off the purchase price —
// the exact credit is computed by the backend and shown from the response).
useHead({
  title: 'Partner rentals',
  meta: [{ name: 'robots', content: 'noindex' }],
})

interface PartnerRental {
  hash_id: string
  start_date: string
  due_date: string
  returned_at: string | null
  return_condition: string | null
  deposit_cents: number
  order: { hash_id: string; gross_amount_cents: number }
  customer: { display_name: string; email: string }
  item: { hash_id: string; title: string; photo_url: string | null }
}

interface FeeBreakdown {
  commission_rate_pct: number
  commission_cents: number
  btw_cents: number
  fees_applied: boolean
}

interface DamageResult {
  captured_cents: number
  charged_cents: number
  written_off: boolean
}

interface RtoResult {
  order: { gross_amount_cents: number; rent_credit_cents: number }
  fees: FeeBreakdown
}

const { locale, t } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const { ppFetch } = usePartnerPlatform()

// Standalone media URLs are API-origin-relative — resolve against apiBase; absolute
// URLs pass through untouched.
const apiPublicBase = useRuntimeConfig().public.apiBase
function mediaUrl(u: string | null | undefined): string {
  if (!u) return ''
  return u.startsWith('/') ? apiPublicBase + u : u
}

const state = ref<'loading' | 'ready' | 'error'>('loading')
const rentals = ref<PartnerRental[]>([])
const filter = ref<'active' | 'all'>('active')

const modal = ref<'return' | 'damage' | 'rto' | null>(null)
const target = ref<PartnerRental | null>(null)
const modalBusy = ref(false)
const modalError = ref('')

// return modal
const returnCondition = ref<'ok' | 'damaged'>('ok')

// damage modal
const damageAmount = ref('')
const damageCapture = ref(false)
const damageWriteOff = ref(false)
const damageNote = ref('')
const damageResult = ref<DamageResult | null>(null)

// rent-to-own modal
const rtoPurchaseCents = ref<number | null>(null)
const rtoResult = ref<RtoResult | null>(null)

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

function isOverdue(r: PartnerRental): boolean {
  if (r.returned_at) return false
  const due = new Date(r.due_date + 'T23:59:59')
  return Number.isFinite(due.getTime()) && Date.now() > due.getTime()
}

async function load() {
  state.value = 'loading'
  try {
    const data = await ppFetch<PartnerRental[]>('/partner/rentals', {
      query: { active: filter.value === 'active' },
    })
    rentals.value = Array.isArray(data) ? data : []
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

// v-model on a type="number" input yields a number (or '' when cleared) — accept both.
function eurosToCents(value: string | number): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value * 100) : null
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = parseFloat(trimmed.replace(',', '.'))
  return Number.isFinite(n) ? Math.round(n * 100) : null
}

// --- modal open/close --------------------------------------------------------------------
function openModal(kind: 'return' | 'damage' | 'rto', r: PartnerRental) {
  modal.value = kind
  target.value = r
  modalBusy.value = false
  modalError.value = ''
  damageResult.value = null
  rtoResult.value = null
  if (kind === 'return') returnCondition.value = 'ok'
  if (kind === 'damage') {
    damageAmount.value = ''
    damageCapture.value = r.deposit_cents > 0
    damageWriteOff.value = false
    damageNote.value = ''
  }
  if (kind === 'rto') {
    rtoPurchaseCents.value = null
    loadPurchasePrice(r)
  }
  document.body.style.overflow = 'hidden'
}

function closeModal(force = false) {
  if (modalBusy.value && !force) return
  const hadResult = !!(damageResult.value || rtoResult.value)
  modal.value = null
  target.value = null
  damageResult.value = null
  rtoResult.value = null
  document.body.style.overflow = ''
  if (hadResult) load()
}

// RentalOut's item ref has no prices — the portal item detail does.
async function loadPurchasePrice(r: PartnerRental) {
  try {
    const item = await ppFetch<{ purchase_price_cents: number | null }>(
      `/partner/items/${r.item.hash_id}`,
    )
    rtoPurchaseCents.value = item.purchase_price_cents
  } catch {
    rtoPurchaseCents.value = null
  }
}

// --- actions ------------------------------------------------------------------------------
async function confirmReturn() {
  if (!target.value || modalBusy.value) return
  modalBusy.value = true
  modalError.value = ''
  try {
    await ppFetch(`/partner/rentals/${target.value.hash_id}/return`, {
      method: 'POST',
      body: { condition: returnCondition.value },
    })
    closeModal(true)
    load()
  } catch (e: any) {
    modalError.value = e?.message || t('partnerDashboard.common.error')
  } finally {
    modalBusy.value = false
  }
}

async function confirmDamage() {
  if (!target.value || modalBusy.value) return
  const cents = eurosToCents(damageAmount.value)
  if (cents === null || cents < 0) {
    modalError.value = t('partnerDashboard.rentals.damageAmountError')
    return
  }
  modalBusy.value = true
  modalError.value = ''
  try {
    damageResult.value = await ppFetch<DamageResult>(
      `/partner/rentals/${target.value.hash_id}/charge-damage`,
      {
        method: 'POST',
        body: {
          amount_cents: cents,
          capture_deposit: damageCapture.value,
          write_off: damageWriteOff.value,
          note: damageNote.value.trim() || null,
        },
      },
    )
  } catch (e: any) {
    modalError.value = e?.message || t('partnerDashboard.common.error')
  } finally {
    modalBusy.value = false
  }
}

async function confirmRto() {
  if (!target.value || modalBusy.value) return
  modalBusy.value = true
  modalError.value = ''
  try {
    rtoResult.value = await ppFetch<RtoResult>(
      `/partner/rentals/${target.value.hash_id}/rent-to-own`,
      { method: 'POST' },
    )
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
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  if (modal.value) document.body.style.overflow = ''
})
</script>

<template>
  <section class="full-page-section pp-prent">
    <PartnerPortalShell @ready="load">
      <div class="pp-prent-head">
        <h2 class="pp-prent-title">{{ $t('partnerDashboard.rentals.title') }}</h2>
        <div class="pp-prent-toggle">
          <button
            class="pp-prent-toggle-btn"
            :class="{ 'is-active': filter === 'active' }"
            type="button"
            @click="setFilter('active')"
          >{{ $t('partnerDashboard.rentals.toggleActive') }}</button>
          <button
            class="pp-prent-toggle-btn"
            :class="{ 'is-active': filter === 'all' }"
            type="button"
            @click="setFilter('all')"
          >{{ $t('partnerDashboard.rentals.toggleAll') }}</button>
        </div>
      </div>

      <div v-if="state === 'loading'" class="pp-spinner"></div>

      <div v-else-if="state === 'error'" class="pp-state">
        <p>{{ $t('partnerDashboard.common.error') }}</p>
        <button class="pp-btn pp-btn-outline" type="button" @click="load()">
          {{ $t('partnerDashboard.common.retry') }}
        </button>
      </div>

      <div v-else-if="!rentals.length" class="pp-state">
        <h3>{{ $t('partnerDashboard.rentals.emptyTitle') }}</h3>
        <p>{{ $t('partnerDashboard.rentals.emptyBody') }}</p>
      </div>

      <div v-for="r in rentals" v-else :key="r.hash_id" class="pp-card">
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
          <div class="pp-prent-info">
            <p class="pp-card-title">{{ r.item.title }}</p>
            <p class="pp-card-meta">{{ r.customer.display_name }} · {{ r.customer.email }}</p>
            <p class="pp-prent-dates">
              {{ $t('partnerDashboard.rentals.started', { date: formatDate(r.start_date) }) }} ·
              <span :class="{ 'pp-prent-overdue': isOverdue(r) }">
                {{ $t('partnerDashboard.rentals.due', { date: formatDate(r.due_date) }) }}
                <template v-if="isOverdue(r)"> — {{ $t('partnerDashboard.rentals.overdue') }}</template>
              </span>
            </p>
            <p v-if="r.returned_at" class="pp-prent-dates">
              {{ $t('partnerDashboard.rentals.returned', { date: formatDate(r.returned_at) }) }}
            </p>
            <div class="pp-prent-chips">
              <span v-if="r.deposit_cents > 0" class="pp-chip pp-chip-pending">
                {{ $t('partnerDashboard.rentals.depositHeld', { amount: ppFormatPrice(r.deposit_cents) }) }}
              </span>
              <span v-else class="pp-chip">{{ $t('partnerDashboard.rentals.depositNone') }}</span>
              <span v-if="r.return_condition" class="pp-chip" :class="`pp-chip-${r.return_condition}`">
                {{ r.return_condition === 'ok' ? $t('partnerDashboard.rentals.condOk') : $t('partnerDashboard.rentals.condDamaged') }}
              </span>
            </div>
          </div>
          <div v-if="!r.returned_at" class="pp-card-actions">
            <button class="pp-btn pp-btn-primary pp-btn-sm" type="button" @click="openModal('return', r)">
              {{ $t('partnerDashboard.rentals.actionReturn') }}
            </button>
            <button class="pp-btn pp-btn-ghost pp-btn-sm" type="button" @click="openModal('rto', r)">
              {{ $t('partnerDashboard.rentals.actionRto') }}
            </button>
            <button class="pp-btn pp-btn-danger pp-btn-sm" type="button" @click="openModal('damage', r)">
              {{ $t('partnerDashboard.rentals.actionDamage') }}
            </button>
          </div>
        </div>
      </div>
    </PartnerPortalShell>

    <!-- ============ return modal ============ -->
    <div v-if="modal === 'return' && target" class="pp-modal-backdrop" @click.self="closeModal()">
      <div class="pp-modal" role="dialog" aria-modal="true">
        <h3 class="pp-modal-title">{{ $t('partnerDashboard.rentals.returnTitle') }}</h3>
        <p class="pp-prent-modal-copy">{{ target.item.title }} — {{ target.customer.display_name }}</p>
        <div class="pp-field">
          <span class="pp-label">{{ $t('partnerDashboard.rentals.returnCondition') }}</span>
          <label class="pp-prent-radio">
            <input v-model="returnCondition" type="radio" value="ok" />
            {{ $t('partnerDashboard.rentals.condOk') }}
          </label>
          <label class="pp-prent-radio">
            <input v-model="returnCondition" type="radio" value="damaged" />
            {{ $t('partnerDashboard.rentals.condDamaged') }}
          </label>
        </div>
        <p class="pp-prent-modal-copy">
          {{ returnCondition === 'ok'
            ? (target.deposit_cents > 0
              ? $t('partnerDashboard.rentals.returnOkNote', { amount: ppFormatPrice(target.deposit_cents) })
              : $t('partnerDashboard.rentals.returnOkNoteNoDeposit'))
            : $t('partnerDashboard.rentals.returnDamagedNote') }}
        </p>
        <p v-if="modalError" class="pp-msg-error">{{ modalError }}</p>
        <div class="pp-prent-modal-actions">
          <button class="pp-btn pp-btn-ghost" type="button" :disabled="modalBusy" @click="closeModal()">
            {{ $t('partnerDashboard.common.cancel') }}
          </button>
          <button class="pp-btn pp-btn-primary" type="button" :disabled="modalBusy" @click="confirmReturn()">
            {{ $t('partnerDashboard.rentals.confirmReturn') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ charge damage modal ============ -->
    <div v-if="modal === 'damage' && target" class="pp-modal-backdrop" @click.self="closeModal()">
      <div class="pp-modal" role="dialog" aria-modal="true">
        <template v-if="damageResult">
          <h3 class="pp-modal-title">{{ $t('partnerDashboard.rentals.damageDoneTitle') }}</h3>
          <ul class="pp-prent-fees">
            <li>
              <span>{{ $t('partnerDashboard.rentals.damageCaptured') }}</span>
              <strong>{{ ppFormatPrice(damageResult.captured_cents) }}</strong>
            </li>
            <li>
              <span>{{ $t('partnerDashboard.rentals.damageCharged') }}</span>
              <strong>{{ ppFormatPrice(damageResult.charged_cents) }}</strong>
            </li>
          </ul>
          <p v-if="damageResult.written_off" class="pp-prent-modal-copy">
            {{ $t('partnerDashboard.rentals.damageWrittenOff') }}
          </p>
          <div class="pp-prent-modal-actions">
            <button class="pp-btn pp-btn-primary" type="button" @click="closeModal()">
              {{ $t('partnerDashboard.common.done') }}
            </button>
          </div>
        </template>

        <template v-else>
          <h3 class="pp-modal-title">{{ $t('partnerDashboard.rentals.damageTitle') }}</h3>
          <p class="pp-prent-modal-copy">{{ target.item.title }} — {{ target.customer.display_name }}</p>
          <div class="pp-field">
            <label class="pp-label" for="pp-dam-amount">{{ $t('partnerDashboard.rentals.damageAmount') }}</label>
            <input id="pp-dam-amount" v-model="damageAmount" class="pp-input pp-prent-money" type="number" min="0" step="0.01" />
          </div>
          <label v-if="target.deposit_cents > 0" class="pp-prent-check">
            <input v-model="damageCapture" type="checkbox" />
            {{ $t('partnerDashboard.rentals.damageCapture', { amount: ppFormatPrice(target.deposit_cents) }) }}
          </label>
          <label class="pp-prent-check">
            <input v-model="damageWriteOff" type="checkbox" />
            {{ $t('partnerDashboard.rentals.damageWriteOff') }}
          </label>
          <div class="pp-field">
            <label class="pp-label" for="pp-dam-note">{{ $t('partnerDashboard.rentals.damageNote') }}</label>
            <textarea id="pp-dam-note" v-model="damageNote" class="pp-textarea" rows="3"></textarea>
          </div>
          <p v-if="modalError" class="pp-msg-error">{{ modalError }}</p>
          <div class="pp-prent-modal-actions">
            <button class="pp-btn pp-btn-ghost" type="button" :disabled="modalBusy" @click="closeModal()">
              {{ $t('partnerDashboard.common.cancel') }}
            </button>
            <button class="pp-btn pp-btn-danger" type="button" :disabled="modalBusy" @click="confirmDamage()">
              {{ $t('partnerDashboard.rentals.damageSubmit') }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- ============ rent-to-own modal ============ -->
    <div v-if="modal === 'rto' && target" class="pp-modal-backdrop" @click.self="closeModal()">
      <div class="pp-modal" role="dialog" aria-modal="true">
        <template v-if="rtoResult">
          <h3 class="pp-modal-title">{{ $t('partnerDashboard.rentals.rtoDoneTitle') }}</h3>
          <ul class="pp-prent-fees">
            <li>
              <span>{{ $t('partnerDashboard.fees.charged') }}</span>
              <strong>{{ ppFormatPrice(rtoResult.order.gross_amount_cents) }}</strong>
            </li>
            <li>
              <span>{{ $t('partnerDashboard.rentals.rtoCredit') }}</span>
              <strong>{{ ppFormatPrice(rtoResult.order.rent_credit_cents) }}</strong>
            </li>
            <li>
              <span>{{ $t('partnerDashboard.fees.commission', { pct: rtoResult.fees.commission_rate_pct }) }}</span>
              <strong>{{ ppFormatPrice(rtoResult.fees.commission_cents) }}</strong>
            </li>
            <li>
              <span>{{ $t('partnerDashboard.fees.btw') }}</span>
              <strong>{{ ppFormatPrice(rtoResult.fees.btw_cents) }}</strong>
            </li>
          </ul>
          <p v-if="!rtoResult.fees.fees_applied" class="pp-msg-success">
            {{ $t('partnerDashboard.fees.waived') }}
          </p>
          <div class="pp-prent-modal-actions">
            <button class="pp-btn pp-btn-primary" type="button" @click="closeModal()">
              {{ $t('partnerDashboard.common.done') }}
            </button>
          </div>
        </template>

        <template v-else>
          <h3 class="pp-modal-title">{{ $t('partnerDashboard.rentals.rtoTitle') }}</h3>
          <p class="pp-prent-modal-copy">{{ $t('partnerDashboard.rentals.rtoExplain') }}</p>
          <ul class="pp-prent-fees">
            <li v-if="rtoPurchaseCents !== null">
              <span>{{ $t('partnerDashboard.rentals.rtoPurchasePrice') }}</span>
              <strong>{{ ppFormatPrice(rtoPurchaseCents) }}</strong>
            </li>
            <li>
              <span>{{ $t('partnerDashboard.rentals.rtoRentPaid') }}</span>
              <strong>{{ ppFormatPrice(target.order.gross_amount_cents) }}</strong>
            </li>
          </ul>
          <p class="pp-hint">{{ $t('partnerDashboard.rentals.rtoNote') }}</p>
          <p v-if="modalError" class="pp-msg-error">{{ modalError }}</p>
          <div class="pp-prent-modal-actions">
            <button class="pp-btn pp-btn-ghost" type="button" :disabled="modalBusy" @click="closeModal()">
              {{ $t('partnerDashboard.common.cancel') }}
            </button>
            <button class="pp-btn pp-btn-primary" type="button" :disabled="modalBusy" @click="confirmRto()">
              {{ $t('partnerDashboard.rentals.rtoConfirm') }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style>
.pp-prent-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  font-family: 'Urbanist', sans-serif;
}
.pp-prent-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
.pp-prent-toggle {
  display: inline-flex;
  border: 1px solid var(--pp-gray-light);
  border-radius: 50px;
  overflow: hidden;
}
.pp-prent-toggle-btn {
  padding: 6px 18px;
  border: none;
  background: #fff;
  color: var(--pp-gray);
  font-family: 'Urbanist', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.pp-prent-toggle-btn.is-active {
  background: var(--pp-magenta);
  color: #fff;
}
.pp-prent-info {
  flex: 1;
  min-width: 200px;
}
.pp-prent-dates {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--pp-gray);
}
.pp-prent-overdue {
  color: var(--pp-danger);
  font-weight: 700;
}
.pp-prent-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.pp-prent-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 16px;
  font-size: 14px;
  cursor: pointer;
}
.pp-prent-check {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 10px;
  font-size: 14px;
  cursor: pointer;
}
.pp-prent-check input {
  margin-top: 3px;
}
.pp-prent-money {
  max-width: 180px;
}
.pp-prent-fees {
  list-style: none;
  margin: 12px 0;
  padding: 0;
  border: 1px solid var(--pp-gray-light);
  border-radius: 10px;
}
.pp-prent-fees li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--pp-bg-light);
  font-size: 14px;
}
.pp-prent-fees li:last-child {
  border-bottom: none;
}
.pp-prent-modal-copy {
  color: var(--pp-gray);
  font-size: 14px;
  line-height: 1.55;
}
.pp-prent-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}
</style>
