<script setup lang="ts">
// Partner dashboard — item create/edit form (CONTRACT §3.4 POST/PATCH /partner/items).
// ?id= loads an existing item; editable only in draft|rejected (read-only view with a
// notice otherwise). Prices are euros in the UI, converted to integer cents on submit.
// The hold-deposit cap hint (min(20% of price, €25)) recomputes live as prices change;
// 422 codes from the backend land as field-level errors.
// The form lives at /partner/item (CONTRACT §3.5 links rejected items to
// /partner/item?id={hash}). The file is named item-form.vue because a file at
// pages/partner/item.vue generates the same route name as the public PDP at
// pages/partner-item.vue ('partner-item'), which trips Nuxt's duplicate-route-name
// warning at scan time — the explicit name + path here keep both routes distinct.
definePageMeta({ name: 'partner-portal-item', path: '/partner/item' })

useHead({
  title: 'Partner item',
  meta: [{ name: 'robots', content: 'noindex' }],
})

interface PortalPhoto {
  hash_id: string
  url: string
  kind: string | null
}

interface PortalItem {
  hash_id: string
  title: string
  description: string | null
  brand: string | null
  size: string | null
  category: string | null
  condition: string | null
  status: string
  photos: PortalPhoto[]
  available_for_purchase: boolean
  available_for_rental: boolean
  purchase_price_cents: number | null
  rental_price_2wk_cents: number | null
  rental_min_weeks: number | null
  rental_max_weeks: number | null
  rental_deposit_cents: number | null
  hold_deposit_cents: number | null
  rejection_reason: string | null
}

const { locale, t } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const langPrefix = computed(() => (isNL.value ? '/nl' : ''))
const route = useRoute()
const router = useRouter()
const { ppFetch } = usePartnerPlatform()

const HOLD_CAP_PCT = 20
const HOLD_CAP_CENTS = 2500

// Guard against double-prefixing: ppFetch's resolveMediaUrls already resolves
// backend-relative media paths against apiBase, so only a raw, unresolved
// '/partner-platform/…' path still needs the prefix here; already-resolved paths
// and absolute S3 URLs pass through untouched.
const apiPublicBase = useRuntimeConfig().public.apiBase
function mediaUrl(u: string): string {
  return u.startsWith('/partner-platform/') ? apiPublicBase + u : u
}

const pageState = ref<'loading' | 'ready' | 'notfound' | 'error'>('loading')
const item = ref<PortalItem | null>(null)
const memberPct = ref<number | null>(null)

const displayPhotos = computed(() =>
  (item.value?.photos || []).map((p) => ({ ...p, url: mediaUrl(p.url) })),
)

const saving = ref(false)
const savedMsg = ref(false)
const topError = ref('')
const fieldErrors = ref<Record<string, string>>({})

const photoBusy = ref(false)
const photoError = ref('')

const showSubmitConfirm = ref(false)
const submitBusy = ref(false)
const submitError = ref('')

const form = reactive({
  title: '',
  description: '',
  brand: '',
  size: '',
  category: '',
  condition: '',
  availablePurchase: false,
  availableRental: false,
  purchasePrice: '',
  rentalPrice: '',
  minWeeks: 2,
  maxWeeks: 4,
  rentalDeposit: '',
  holdDeposit: '',
})

const itemId = computed(() => (typeof route.query.id === 'string' ? route.query.id : ''))
const canEdit = computed(
  () => !item.value || item.value.status === 'draft' || item.value.status === 'rejected',
)

const KNOWN_STATUSES = new Set([
  'draft',
  'pending_approval',
  'rejected',
  'available',
  'reserved',
  'rented',
  'sold',
  'written_off',
])
function statusLabel(status: string): string {
  return KNOWN_STATUSES.has(status) ? t(`partnerDashboard.statuses.${status}`) : status
}

// --- money helpers (euros in the UI ↔ integer cents on the wire) --------------------
// v-model on a type="number" input yields a number (or '' when cleared) — accept both.
function eurosToCents(value: string | number): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value * 100) : null
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = parseFloat(trimmed.replace(',', '.'))
  return Number.isFinite(n) ? Math.round(n * 100) : null
}
function centsToEuros(cents: number | null): string {
  return cents === null || cents === undefined ? '' : (cents / 100).toFixed(2)
}

const purchaseCents = computed(() => eurosToCents(form.purchasePrice))
const rentalCents = computed(() => eurosToCents(form.rentalPrice))

// Hold cap per CONTRACT §2: base is the purchase price when purchasable, otherwise the
// 2-week rental price; cap = min(20% of base, €25). Recomputed live.
const holdCapCents = computed<number | null>(() => {
  const base = form.availablePurchase
    ? purchaseCents.value
    : form.availableRental
      ? rentalCents.value
      : null
  if (base === null || base <= 0) return null
  return Math.min(Math.round((base * HOLD_CAP_PCT) / 100), HOLD_CAP_CENTS)
})

function memberPriceOf(cents: number | null): number | null {
  if (cents === null || memberPct.value === null) return null
  return Math.round((cents * (100 - memberPct.value)) / 100)
}
const memberPurchaseCents = computed(() => memberPriceOf(purchaseCents.value))
const memberRentalCents = computed(() => memberPriceOf(rentalCents.value))

// --- load ------------------------------------------------------------------------------
function fillForm(data: PortalItem) {
  form.title = data.title || ''
  form.description = data.description || ''
  form.brand = data.brand || ''
  form.size = data.size || ''
  form.category = data.category || ''
  form.condition = data.condition || ''
  form.availablePurchase = !!data.available_for_purchase
  form.availableRental = !!data.available_for_rental
  form.purchasePrice = centsToEuros(data.purchase_price_cents)
  form.rentalPrice = centsToEuros(data.rental_price_2wk_cents)
  form.minWeeks = data.rental_min_weeks ?? 2
  form.maxWeeks = data.rental_max_weeks ?? 4
  form.rentalDeposit = centsToEuros(data.rental_deposit_cents)
  form.holdDeposit = centsToEuros(data.hold_deposit_cents)
}

async function loadDiscount() {
  try {
    const sf = await ppFetch<{ member_discount_pct: number }>('/partner/storefront')
    memberPct.value = sf.member_discount_pct
  } catch {
    memberPct.value = null // member-price hints simply stay hidden
  }
}

async function load() {
  pageState.value = 'loading'
  loadDiscount()
  if (!itemId.value) {
    item.value = null
    pageState.value = 'ready'
    return
  }
  try {
    const data = await ppFetch<PortalItem>(`/partner/items/${encodeURIComponent(itemId.value)}`)
    item.value = data
    fillForm(data)
    pageState.value = 'ready'
  } catch (e: any) {
    pageState.value = e?.status === 404 ? 'notfound' : 'error'
  }
}

// Browser back/forward between ?id= variants reuses the component — reload on change.
watch(itemId, (next, prev) => {
  if (next !== prev && pageState.value !== 'loading') load()
})

// --- save (create or patch) ------------------------------------------------------------
const ERROR_FIELD_MAP: Record<string, string[]> = {
  capability_required: ['capabilities'],
  purchase_price_required: ['purchasePrice'],
  rental_price_required: ['rentalPrice'],
  invalid_rental_weeks: ['weeks'],
  invalid_deposit: ['rentalDeposit', 'holdDeposit'],
  deposit_exceeds_price: ['rentalDeposit'],
  cap_exceeded: ['holdDeposit'],
}

function errorCopy(code: string): string {
  switch (code) {
    case 'capability_required':
      return t('partnerDashboard.item.errCapability')
    case 'purchase_price_required':
      return t('partnerDashboard.item.errPurchasePrice')
    case 'rental_price_required':
      return t('partnerDashboard.item.errRentalPrice')
    case 'invalid_rental_weeks':
      return t('partnerDashboard.item.errWeeks')
    case 'invalid_deposit':
      return t('partnerDashboard.item.errDeposit')
    case 'deposit_exceeds_price':
      return t('partnerDashboard.item.errDepositExceeds')
    case 'cap_exceeded':
      return t('partnerDashboard.item.errCap', {
        amount: holdCapCents.value !== null ? ppFormatPrice(holdCapCents.value) : '€25,00',
      })
    default:
      return t('partnerDashboard.common.error')
  }
}

async function save() {
  if (saving.value || !canEdit.value) return
  saving.value = true
  savedMsg.value = false
  topError.value = ''
  fieldErrors.value = {}
  try {
    const body = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      brand: form.brand.trim() || null,
      size: form.size.trim() || null,
      category: form.category.trim() || null,
      condition: form.condition || null,
      available_for_purchase: form.availablePurchase,
      available_for_rental: form.availableRental,
      purchase_price_cents: form.availablePurchase ? purchaseCents.value : null,
      rental_price_2wk_cents: form.availableRental ? rentalCents.value : null,
      rental_min_weeks: form.availableRental ? Number(form.minWeeks) : null,
      rental_max_weeks: form.availableRental ? Number(form.maxWeeks) : null,
      rental_deposit_cents: eurosToCents(form.rentalDeposit),
      hold_deposit_cents: eurosToCents(form.holdDeposit),
    }
    let saved: PortalItem
    if (item.value) {
      saved = await ppFetch<PortalItem>(`/partner/items/${item.value.hash_id}`, {
        method: 'PATCH',
        body,
      })
    } else {
      saved = await ppFetch<PortalItem>('/partner/items', { method: 'POST', body })
      // claim the ?id= so the photo section (and reloads) target the new draft
      router.replace({ path: route.path, query: { id: saved.hash_id } })
    }
    item.value = saved
    fillForm(saved)
    savedMsg.value = true
  } catch (e: any) {
    const code: string | null = e?.code ?? null
    if (code && ERROR_FIELD_MAP[code]) {
      const msg = errorCopy(code)
      for (const field of ERROR_FIELD_MAP[code]) fieldErrors.value[field] = msg
    } else {
      topError.value = e?.message && code ? e.message : t('partnerDashboard.common.error')
    }
  } finally {
    saving.value = false
  }
}

// --- photos ------------------------------------------------------------------------------
async function onPhotosUpload(files: File[]) {
  if (!item.value || photoBusy.value) return
  photoBusy.value = true
  photoError.value = ''
  try {
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    const res = await ppFetch<{ photos: PortalPhoto[] }>(
      `/partner/items/${item.value.hash_id}/photos`,
      { method: 'POST', formData: fd },
    )
    item.value.photos = res.photos
  } catch {
    photoError.value = t('partnerDashboard.item.photoError')
  } finally {
    photoBusy.value = false
  }
}

async function onPhotoDelete(hashId: string) {
  if (!item.value || photoBusy.value) return
  photoBusy.value = true
  photoError.value = ''
  try {
    const res = await ppFetch<{ photos: PortalPhoto[] }>(
      `/partner/items/${item.value.hash_id}/photos/${hashId}`,
      { method: 'DELETE' },
    )
    item.value.photos = res.photos
  } catch {
    photoError.value = t('partnerDashboard.item.photoError')
  } finally {
    photoBusy.value = false
  }
}

// --- submit for approval ------------------------------------------------------------------
function openSubmitConfirm() {
  submitError.value = ''
  showSubmitConfirm.value = true
  document.body.style.overflow = 'hidden'
}
function closeSubmitConfirm() {
  if (submitBusy.value) return
  showSubmitConfirm.value = false
  document.body.style.overflow = ''
}
async function confirmSubmit() {
  if (!item.value || submitBusy.value) return
  submitBusy.value = true
  submitError.value = ''
  try {
    await ppFetch(`/partner/items/${item.value.hash_id}/submit`, { method: 'POST' })
    document.body.style.overflow = ''
    await navigateTo(langPrefix.value + '/partner/items')
  } catch (e: any) {
    submitError.value = e?.message || t('partnerDashboard.common.error')
  } finally {
    submitBusy.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showSubmitConfirm.value) closeSubmitConfirm()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  if (showSubmitConfirm.value) document.body.style.overflow = ''
})
</script>

<template>
  <section class="full-page-section pp-itemform">
    <PartnerPortalShell @ready="load">
      <div v-if="pageState === 'loading'" class="pp-spinner"></div>

      <div v-else-if="pageState === 'notfound'" class="pp-state">
        <h3>{{ $t('partnerDashboard.item.notFoundTitle') }}</h3>
        <NuxtLink :to="langPrefix + '/partner/items'" class="pp-btn pp-btn-ghost">
          {{ $t('partnerDashboard.item.backToItems') }}
        </NuxtLink>
      </div>

      <div v-else-if="pageState === 'error'" class="pp-state">
        <p>{{ $t('partnerDashboard.common.error') }}</p>
        <button class="pp-btn pp-btn-outline" type="button" @click="load()">
          {{ $t('partnerDashboard.common.retry') }}
        </button>
      </div>

      <template v-else>
        <div class="pp-itemform-head">
          <h2 class="pp-itemform-title">
            {{ item ? (canEdit ? $t('partnerDashboard.item.editTitle') : $t('partnerDashboard.item.viewTitle')) : $t('partnerDashboard.item.newTitle') }}
          </h2>
          <NuxtLink :to="langPrefix + '/partner/items'" class="pp-btn pp-btn-ghost pp-btn-sm">
            {{ $t('partnerDashboard.item.backToItems') }}
          </NuxtLink>
        </div>

        <p v-if="item && !canEdit" class="pp-itemform-notice">
          {{ $t('partnerDashboard.item.readOnly', { status: statusLabel(item.status) }) }}
        </p>

        <div v-if="item?.status === 'rejected' && item.rejection_reason" class="pp-itemform-rejected">
          <strong>{{ $t('partnerDashboard.items.rejectedLabel') }}</strong> {{ item.rejection_reason }}
          <p>{{ $t('partnerDashboard.item.rejectedHint') }}</p>
        </div>

        <form class="pp-itemform-card" @submit.prevent="save()">
          <div class="pp-field">
            <label class="pp-label" for="pp-if-title">{{ $t('partnerDashboard.item.fieldTitle') }}</label>
            <input id="pp-if-title" v-model="form.title" class="pp-input" type="text" required :disabled="!canEdit" />
          </div>

          <div class="pp-field">
            <label class="pp-label" for="pp-if-desc">{{ $t('partnerDashboard.item.fieldDescription') }}</label>
            <textarea id="pp-if-desc" v-model="form.description" class="pp-textarea" rows="4" :disabled="!canEdit"></textarea>
          </div>

          <div class="pp-itemform-grid">
            <div class="pp-field">
              <label class="pp-label" for="pp-if-brand">{{ $t('partnerDashboard.item.fieldBrand') }}</label>
              <input id="pp-if-brand" v-model="form.brand" class="pp-input" type="text" :disabled="!canEdit" />
            </div>
            <div class="pp-field">
              <label class="pp-label" for="pp-if-size">{{ $t('partnerDashboard.item.fieldSize') }}</label>
              <input id="pp-if-size" v-model="form.size" class="pp-input" type="text" :disabled="!canEdit" />
            </div>
            <div class="pp-field">
              <label class="pp-label" for="pp-if-cat">{{ $t('partnerDashboard.item.fieldCategory') }}</label>
              <input id="pp-if-cat" v-model="form.category" class="pp-input" type="text" :disabled="!canEdit" />
            </div>
            <div class="pp-field">
              <label class="pp-label" for="pp-if-cond">{{ $t('partnerDashboard.item.fieldCondition') }}</label>
              <select id="pp-if-cond" v-model="form.condition" class="pp-select" :disabled="!canEdit">
                <option value="">—</option>
                <option value="like new">{{ $t('partnerDashboard.item.conditionLikeNew') }}</option>
                <option value="good">{{ $t('partnerDashboard.item.conditionGood') }}</option>
                <option value="worn">{{ $t('partnerDashboard.item.conditionWorn') }}</option>
              </select>
            </div>
          </div>

          <fieldset class="pp-itemform-caps">
            <legend class="pp-label">{{ $t('partnerDashboard.item.capsLegend') }}</legend>
            <label class="pp-itemform-toggle">
              <input v-model="form.availablePurchase" type="checkbox" :disabled="!canEdit" />
              {{ $t('partnerDashboard.item.capPurchase') }}
            </label>
            <label class="pp-itemform-toggle">
              <input v-model="form.availableRental" type="checkbox" :disabled="!canEdit" />
              {{ $t('partnerDashboard.item.capRental') }}
            </label>
            <p v-if="fieldErrors.capabilities" class="pp-msg-error">{{ fieldErrors.capabilities }}</p>
          </fieldset>

          <div v-show="form.availablePurchase" class="pp-field">
            <label class="pp-label" for="pp-if-pprice">{{ $t('partnerDashboard.item.fieldPurchasePrice') }}</label>
            <input id="pp-if-pprice" v-model="form.purchasePrice" class="pp-input pp-itemform-money" type="number" min="0" step="0.01" :disabled="!canEdit" />
            <p v-if="memberPurchaseCents !== null" class="pp-hint pp-itemform-memberhint">
              {{ $t('partnerDashboard.item.membersWillPay', { amount: ppFormatPrice(memberPurchaseCents) }) }}
            </p>
            <p v-if="fieldErrors.purchasePrice" class="pp-msg-error">{{ fieldErrors.purchasePrice }}</p>
          </div>

          <template v-if="form.availableRental">
            <div class="pp-field">
              <label class="pp-label" for="pp-if-rprice">{{ $t('partnerDashboard.item.fieldRentalPrice') }}</label>
              <input id="pp-if-rprice" v-model="form.rentalPrice" class="pp-input pp-itemform-money" type="number" min="0" step="0.01" :disabled="!canEdit" />
              <p v-if="memberRentalCents !== null" class="pp-hint pp-itemform-memberhint">
                {{ $t('partnerDashboard.item.membersWillPay', { amount: ppFormatPrice(memberRentalCents) }) }}
              </p>
              <p v-if="fieldErrors.rentalPrice" class="pp-msg-error">{{ fieldErrors.rentalPrice }}</p>
            </div>

            <div class="pp-itemform-grid">
              <div class="pp-field">
                <label class="pp-label" for="pp-if-minw">{{ $t('partnerDashboard.item.fieldMinWeeks') }}</label>
                <select id="pp-if-minw" v-model.number="form.minWeeks" class="pp-select" :disabled="!canEdit">
                  <option :value="2">{{ $t('partnerDashboard.item.weeksOption', { n: 2 }) }}</option>
                  <option :value="4">{{ $t('partnerDashboard.item.weeksOption', { n: 4 }) }}</option>
                </select>
              </div>
              <div class="pp-field">
                <label class="pp-label" for="pp-if-maxw">{{ $t('partnerDashboard.item.fieldMaxWeeks') }}</label>
                <select id="pp-if-maxw" v-model.number="form.maxWeeks" class="pp-select" :disabled="!canEdit">
                  <option :value="2">{{ $t('partnerDashboard.item.weeksOption', { n: 2 }) }}</option>
                  <option :value="4">{{ $t('partnerDashboard.item.weeksOption', { n: 4 }) }}</option>
                </select>
              </div>
            </div>
            <p v-if="fieldErrors.weeks" class="pp-msg-error">{{ fieldErrors.weeks }}</p>

            <div class="pp-field">
              <label class="pp-label" for="pp-if-rdep">{{ $t('partnerDashboard.item.fieldRentalDeposit') }}</label>
              <input id="pp-if-rdep" v-model="form.rentalDeposit" class="pp-input pp-itemform-money" type="number" min="0" step="0.01" :disabled="!canEdit" />
              <p class="pp-hint">{{ $t('partnerDashboard.item.rentalDepositHint') }}</p>
              <p v-if="fieldErrors.rentalDeposit" class="pp-msg-error">{{ fieldErrors.rentalDeposit }}</p>
            </div>
          </template>

          <div v-show="form.availablePurchase || form.availableRental" class="pp-field">
            <label class="pp-label" for="pp-if-hdep">{{ $t('partnerDashboard.item.fieldHoldDeposit') }}</label>
            <input id="pp-if-hdep" v-model="form.holdDeposit" class="pp-input pp-itemform-money" type="number" min="0" step="0.01" :disabled="!canEdit" />
            <p class="pp-hint">
              {{ holdCapCents !== null
                ? $t('partnerDashboard.item.holdHint', { amount: ppFormatPrice(holdCapCents) })
                : $t('partnerDashboard.item.holdHintNoPrice') }}
            </p>
            <p v-if="fieldErrors.holdDeposit" class="pp-msg-error">{{ fieldErrors.holdDeposit }}</p>
          </div>

          <p v-if="topError" class="pp-msg-error">{{ topError }}</p>
          <p v-if="savedMsg" class="pp-msg-success">{{ $t('partnerDashboard.item.savedMsg') }}</p>

          <div v-if="canEdit" class="pp-itemform-actions">
            <button class="pp-btn pp-btn-primary" type="submit" :disabled="saving">
              {{ saving ? $t('partnerDashboard.common.saving') : $t('partnerDashboard.common.save') }}
            </button>
            <button
              v-if="item"
              class="pp-btn pp-btn-outline"
              type="button"
              :disabled="saving"
              @click="openSubmitConfirm()"
            >
              {{ item.status === 'rejected' ? $t('partnerDashboard.item.resubmitApproval') : $t('partnerDashboard.item.submitApproval') }}
            </button>
          </div>
        </form>

        <div class="pp-itemform-card">
          <h3 class="pp-itemform-subtitle">{{ $t('partnerDashboard.item.photosTitle') }}</h3>
          <p v-if="!item" class="pp-hint">{{ $t('partnerDashboard.item.photosSaveFirst') }}</p>
          <template v-else>
            <PartnerPhotoUpload
              :photos="displayPhotos"
              :can-edit="canEdit"
              :busy="photoBusy"
              @upload="onPhotosUpload"
              @delete="onPhotoDelete"
            />
            <p v-if="photoError" class="pp-msg-error">{{ photoError }}</p>
          </template>
        </div>
      </template>
    </PartnerPortalShell>

    <div v-if="showSubmitConfirm" class="pp-modal-backdrop" @click.self="closeSubmitConfirm()">
      <div class="pp-modal" role="dialog" aria-modal="true">
        <h3 class="pp-modal-title">{{ $t('partnerDashboard.item.submitConfirmTitle') }}</h3>
        <p class="pp-itemform-confirm-copy">{{ $t('partnerDashboard.item.submitConfirmBody') }}</p>
        <p v-if="submitError" class="pp-msg-error">{{ submitError }}</p>
        <div class="pp-itemform-actions">
          <button class="pp-btn pp-btn-ghost" type="button" :disabled="submitBusy" @click="closeSubmitConfirm()">
            {{ $t('partnerDashboard.common.cancel') }}
          </button>
          <button class="pp-btn pp-btn-primary" type="button" :disabled="submitBusy" @click="confirmSubmit()">
            {{ submitBusy ? $t('partnerDashboard.item.submitting') : $t('partnerDashboard.item.submitConfirmCta') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
.pp-itemform-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  font-family: 'Urbanist', sans-serif;
}
.pp-itemform-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
.pp-itemform-notice {
  background: var(--pp-bg-light);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: var(--pp-gray);
  font-family: 'Urbanist', sans-serif;
}
.pp-itemform-rejected {
  background: #fee2e2;
  color: var(--pp-danger);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  margin-bottom: 14px;
  font-family: 'Urbanist', sans-serif;
}
.pp-itemform-rejected p {
  margin: 4px 0 0;
  color: var(--pp-ink);
}
.pp-itemform-card {
  background: #fff;
  border: 1px solid var(--pp-gray-light);
  border-radius: 12px;
  padding: 22px;
  margin-bottom: 16px;
  font-family: 'Urbanist', sans-serif;
  max-width: 680px;
}
.pp-itemform-subtitle {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
}
.pp-itemform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0 14px;
}
.pp-itemform-caps {
  border: none;
  margin: 0 0 14px;
  padding: 0;
}
.pp-itemform-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-right: 18px;
  font-size: 14px;
  cursor: pointer;
}
.pp-itemform-money {
  max-width: 180px;
}
.pp-itemform-memberhint {
  color: var(--pp-magenta);
}
.pp-itemform-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.pp-itemform-confirm-copy {
  color: var(--pp-gray);
  font-size: 14px;
  line-height: 1.55;
}
</style>
