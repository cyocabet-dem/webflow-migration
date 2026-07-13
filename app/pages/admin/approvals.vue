<script setup lang="ts">
// Admin approval queue — /admin/approvals (CONTRACT §3.5).
// GET /admin/items/pending (oldest first) as cards; clicking opens a modal work
// area where every field is editable (PATCH /admin/items/{hash} — 'fix minor
// errors'), photos are managed via the shared PhotoUpload (POST/DELETE
// /admin/items/{hash}/photos), and the verdict is approve (confirm → live) or
// reject (required reason → partner gets it + a link to fix).
import { PartnerApiError } from '~/composables/usePartnerPlatform'

const { locale, t } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const langPrefix = computed(() => (isNL.value ? '/nl' : ''))
const { probe, enabled, fetchMe, ppFetch } = usePartnerPlatform()

useHead({
  title: 'Admin — Approvals | Dematerialized',
  meta: [{ name: 'robots', content: 'noindex' }],
})

// ============================================================
// Admin gate (loading → signin → notadmin → ready)
// ============================================================

type GateState = 'loading' | 'signin' | 'notadmin' | 'ready'
const gate = ref<GateState>('loading')

async function resolveGate(): Promise<boolean> {
  gate.value = 'loading'
  await probe()
  if (!enabled.value) {
    gate.value = 'notadmin'
    return false
  }
  const w = window as any
  let signedIn = false
  try {
    signedIn = w.auth0Client ? await w.auth0Client.isAuthenticated() : false
  } catch {
    signedIn = false
  }
  if (!signedIn) {
    gate.value = 'signin'
    return false
  }
  const me = await fetchMe()
  if (!me?.is_admin) {
    gate.value = 'notadmin'
    return false
  }
  gate.value = 'ready'
  return true
}

function openAuthModal() {
  const w = window as any
  if (typeof w.openAuthModal === 'function') w.openAuthModal()
}

// ============================================================
// Queue (CONTRACT §3.5 PartnerItemOut + partner ref)
// ============================================================

interface AdminItemPhoto {
  hash_id: string
  url: string
  kind: string | null
  uploaded_by_role: string
}

interface AdminPendingItem {
  hash_id: string
  title: string
  brand: string | null
  size: string | null
  category: string | null
  condition: string | null
  status: string
  description: string | null
  available_for_purchase: boolean
  available_for_rental: boolean
  purchase_price_cents: number | null
  member_purchase_price_cents: number | null
  rental_price_2wk_cents: number | null
  member_rental_price_2wk_cents: number | null
  rental_min_weeks: number | null
  rental_max_weeks: number | null
  rental_deposit_cents: number | null
  hold_deposit_cents: number | null
  member_discount_pct: number
  rejection_reason: string | null
  photos: AdminItemPhoto[]
  partner: { hash_id: string; name: string; slug: string }
  // not in the contract shape today — rendered only when the API starts sending it
  submitted_at?: string | null
  updated_at?: string | null
}

const queueState = ref<'loading' | 'ready' | 'error'>('loading')
const queue = ref<AdminPendingItem[]>([])
const successNote = ref('')

async function loadQueue() {
  queueState.value = 'loading'
  try {
    const rows = await ppFetch<AdminPendingItem[]>('/admin/items/pending')
    queue.value = Array.isArray(rows) ? rows : [] // API returns oldest first — keep order
    queueState.value = 'ready'
  } catch {
    queueState.value = 'error'
  }
}

function submittedDate(item: AdminPendingItem): string {
  const raw = item.submitted_at || item.updated_at
  if (!raw) return ''
  const d = new Date(raw)
  if (isNaN(d.getTime())) return ''
  return d
    .toLocaleDateString(isNL.value ? 'nl-NL' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .toLowerCase()
}

// ============================================================
// Detail work area (modal) — edit fields + photos + verdict
// ============================================================

const activeItem = ref<AdminPendingItem | null>(null)

const form = reactive({
  title: '',
  description: '',
  brand: '',
  size: '',
  category: '',
  condition: '',
  available_for_purchase: false,
  available_for_rental: false,
  purchase_price: '',
  rental_price: '',
  rental_deposit: '',
  hold_deposit: '',
  rental_min_weeks: '',
  rental_max_weeks: '',
})

const saving = ref(false)
const savedNote = ref(false)
const saveError = ref('')
const photoBusy = ref(false)
const photoError = ref('')
const confirmingApprove = ref(false)
const rejecting = ref(false)
const rejectReason = ref('')
const rejectReasonMissing = ref(false)
const verdictBusy = ref(false)
const verdictError = ref('')

// euros ↔ cents: inputs hold "12,50"-style text, the API speaks integer cents
function centsToEuroInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return ''
  return (cents / 100).toFixed(2).replace('.', ',')
}

function parseEuro(input: string): { ok: boolean; cents: number | null } {
  const trimmed = (input || '').trim()
  if (!trimmed) return { ok: true, cents: null }
  const value = Number(trimmed.replace(/[€\s]/g, '').replace(',', '.'))
  if (!Number.isFinite(value) || value < 0) return { ok: false, cents: null }
  return { ok: true, cents: Math.round(value * 100) }
}

function openDetail(item: AdminPendingItem) {
  activeItem.value = item
  form.title = item.title || ''
  form.description = item.description || ''
  form.brand = item.brand || ''
  form.size = item.size || ''
  form.category = item.category || ''
  form.condition = item.condition || ''
  form.available_for_purchase = !!item.available_for_purchase
  form.available_for_rental = !!item.available_for_rental
  form.purchase_price = centsToEuroInput(item.purchase_price_cents)
  form.rental_price = centsToEuroInput(item.rental_price_2wk_cents)
  form.rental_deposit = centsToEuroInput(item.rental_deposit_cents)
  form.hold_deposit = centsToEuroInput(item.hold_deposit_cents)
  form.rental_min_weeks = item.rental_min_weeks != null ? String(item.rental_min_weeks) : ''
  form.rental_max_weeks = item.rental_max_weeks != null ? String(item.rental_max_weeks) : ''
  savedNote.value = false
  saveError.value = ''
  photoError.value = ''
  confirmingApprove.value = false
  rejecting.value = false
  rejectReason.value = ''
  rejectReasonMissing.value = false
  verdictError.value = ''
  document.body.style.overflow = 'hidden'
}

function closeDetail() {
  if (saving.value || verdictBusy.value || photoBusy.value) return
  activeItem.value = null
  document.body.style.overflow = ''
}

function apiErrorCopy(e: unknown): string {
  if (e instanceof PartnerApiError) {
    const code = e.code || ''
    const known = [
      'capability_required',
      'purchase_price_required',
      'rental_price_required',
      'invalid_discount',
      'invalid_rental_weeks',
      'invalid_deposit',
      'deposit_exceeds_price',
      'cap_exceeded',
    ]
    if (known.includes(code)) return t(`partnerAdmin.approvals.priceErrors.${code}`)
    if (e.message && e.message !== code) return e.message
  }
  return t('partnerAdmin.common.genericError')
}

async function saveFields() {
  const item = activeItem.value
  if (!item || saving.value) return
  savedNote.value = false
  saveError.value = ''
  if (!form.title.trim()) {
    saveError.value = t('partnerAdmin.approvals.titleRequired')
    return
  }
  const purchase = parseEuro(form.purchase_price)
  const rental = parseEuro(form.rental_price)
  const rentalDeposit = parseEuro(form.rental_deposit)
  const holdDeposit = parseEuro(form.hold_deposit)
  if (!purchase.ok || !rental.ok || !rentalDeposit.ok || !holdDeposit.ok) {
    saveError.value = t('partnerAdmin.approvals.invalidAmount')
    return
  }
  saving.value = true
  try {
    const updated = await ppFetch<AdminPendingItem>(`/admin/items/${item.hash_id}`, {
      method: 'PATCH',
      body: {
        title: form.title.trim(),
        description: form.description.trim() || null,
        brand: form.brand.trim() || null,
        size: form.size.trim() || null,
        category: form.category.trim() || null,
        condition: form.condition.trim() || null,
        available_for_purchase: form.available_for_purchase,
        available_for_rental: form.available_for_rental,
        purchase_price_cents: purchase.cents,
        rental_price_2wk_cents: rental.cents,
        rental_deposit_cents: rentalDeposit.cents,
        hold_deposit_cents: holdDeposit.cents,
        rental_min_weeks: form.rental_min_weeks ? Number(form.rental_min_weeks) : null,
        rental_max_weeks: form.rental_max_weeks ? Number(form.rental_max_weeks) : null,
      },
    })
    Object.assign(item, updated) // item is the queue row — the card updates in place
    savedNote.value = true
  } catch (e) {
    saveError.value = apiErrorCopy(e)
  } finally {
    saving.value = false
  }
}

// --- photos (admin may add own + delete partner photos, CONTRACT §3.5) ---

async function onPhotoUpload(files: File[], kind: string | null) {
  const item = activeItem.value
  if (!item || photoBusy.value) return
  photoError.value = ''
  photoBusy.value = true
  try {
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    if (kind) fd.append('kind', kind)
    const res = await ppFetch<{ photos: AdminItemPhoto[] }>(
      `/admin/items/${item.hash_id}/photos`,
      { method: 'POST', formData: fd },
    )
    item.photos = res.photos
  } catch (e) {
    photoError.value = apiErrorCopy(e)
  } finally {
    photoBusy.value = false
  }
}

async function onPhotoDelete(photoHashId: string) {
  const item = activeItem.value
  if (!item || photoBusy.value) return
  photoError.value = ''
  photoBusy.value = true
  try {
    const res = await ppFetch<{ photos: AdminItemPhoto[] }>(
      `/admin/items/${item.hash_id}/photos/${photoHashId}`,
      { method: 'DELETE' },
    )
    item.photos = res.photos
  } catch (e) {
    photoError.value = apiErrorCopy(e)
  } finally {
    photoBusy.value = false
  }
}

// --- verdict: approve (confirm) / reject (required reason) ---

function removeFromQueue(hashId: string) {
  queue.value = queue.value.filter((i) => i.hash_id !== hashId)
}

async function approve() {
  const item = activeItem.value
  if (!item || verdictBusy.value) return
  verdictError.value = ''
  verdictBusy.value = true
  try {
    await ppFetch(`/admin/items/${item.hash_id}/approve`, { method: 'POST' })
    successNote.value = t('partnerAdmin.approvals.approvedNote', { title: item.title })
    verdictBusy.value = false
    removeFromQueue(item.hash_id)
    closeDetail()
  } catch (e) {
    verdictBusy.value = false
    verdictError.value = apiErrorCopy(e)
  }
}

async function reject() {
  const item = activeItem.value
  if (!item || verdictBusy.value) return
  verdictError.value = ''
  rejectReasonMissing.value = false
  if (!rejectReason.value.trim()) {
    rejectReasonMissing.value = true
    return
  }
  verdictBusy.value = true
  try {
    await ppFetch(`/admin/items/${item.hash_id}/reject`, {
      method: 'POST',
      body: { reason: rejectReason.value.trim() },
    })
    successNote.value = t('partnerAdmin.approvals.rejectedNote', { title: item.title })
    verdictBusy.value = false
    removeFromQueue(item.hash_id)
    closeDetail()
  } catch (e) {
    verdictBusy.value = false
    verdictError.value = apiErrorCopy(e)
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && activeItem.value) closeDetail()
}

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  if (await resolveGate()) await loadQueue()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <section class="full-page-section pp-admin">
    <div v-if="gate === 'loading'" class="pp-admin-gate">
      <div class="pp-spinner"></div>
    </div>

    <div v-else-if="gate === 'signin'" class="pp-state">
      <h3>{{ $t('partnerAdmin.gate.signinTitle') }}</h3>
      <p>{{ $t('partnerAdmin.gate.signinBody') }}</p>
      <button class="pp-btn pp-btn-primary" type="button" @click="openAuthModal()">
        {{ $t('partnerAdmin.gate.signinCta') }}
      </button>
    </div>

    <div v-else-if="gate === 'notadmin'" class="pp-state">
      <h3>{{ $t('partnerAdmin.gate.notAdminTitle') }}</h3>
      <p>{{ $t('partnerAdmin.gate.notAdminBody') }}</p>
      <NuxtLink :to="langPrefix + '/'" class="pp-btn pp-btn-ghost">
        {{ $t('partnerAdmin.gate.backHome') }}
      </NuxtLink>
    </div>

    <template v-else>
      <header class="pp-admin-header">
        <h1 class="pp-admin-heading">{{ $t('partnerAdmin.approvals.heading') }}</h1>
        <p class="pp-admin-subtitle">{{ $t('partnerAdmin.approvals.subtitle') }}</p>
        <nav class="pp-admin-nav">
          <NuxtLink :to="`${langPrefix}/admin`" class="pp-admin-nav-link">{{ $t('partnerAdmin.nav.hub') }}</NuxtLink>
          <NuxtLink :to="`${langPrefix}/admin/approvals`" class="pp-admin-nav-link is-active">{{ $t('partnerAdmin.nav.approvals') }}</NuxtLink>
          <NuxtLink :to="`${langPrefix}/admin/partners`" class="pp-admin-nav-link">{{ $t('partnerAdmin.nav.partners') }}</NuxtLink>
        </nav>
      </header>

      <p v-if="successNote" class="pp-msg-success">{{ successNote }}</p>

      <div v-if="queueState === 'loading'" class="pp-admin-gate">
        <div class="pp-spinner"></div>
      </div>

      <div v-else-if="queueState === 'error'" class="pp-state">
        <p>{{ $t('partnerAdmin.common.loadError') }}</p>
        <button class="pp-btn pp-btn-outline" type="button" @click="loadQueue()">
          {{ $t('partnerAdmin.common.retry') }}
        </button>
      </div>

      <div v-else-if="!queue.length" class="pp-state">
        <h3>{{ $t('partnerAdmin.approvals.empty') }}</h3>
      </div>

      <div v-else>
        <div
          v-for="item in queue"
          :key="item.hash_id"
          class="pp-card pp-appr-card"
          role="button"
          tabindex="0"
          @click="openDetail(item)"
          @keydown.enter="openDetail(item)"
        >
          <div class="pp-card-row">
            <div class="pp-appr-card-info">
              <div class="pp-appr-card-top">
                <span class="pp-chip">{{ item.partner?.name }}</span>
                <span class="pp-chip pp-chip-pending_approval">{{ item.status.replace(/_/g, ' ') }}</span>
              </div>
              <h2 class="pp-card-title">{{ item.title }}</h2>
              <div class="pp-card-meta">
                <template v-if="submittedDate(item)">
                  {{ $t('partnerAdmin.approvals.submitted', { date: submittedDate(item) }) }} ·
                </template>
                {{ $t('partnerAdmin.approvals.photoCount', item.photos?.length || 0) }}
              </div>
            </div>
            <div class="pp-card-actions">
              <span class="pp-btn pp-btn-outline pp-btn-sm">{{ $t('partnerAdmin.approvals.reviewCta') }}</span>
            </div>
          </div>
          <div v-if="item.photos?.length" class="pp-appr-strip">
            <img
              v-for="p in item.photos"
              :key="p.hash_id"
              :src="p.url"
              :alt="p.kind || item.title"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </template>

    <div class="mobile-footer-spacer"></div>
  </section>

  <!-- ============ detail work area ============ -->
  <div v-if="activeItem" class="pp-modal-backdrop pp-appr-backdrop" @click.self="closeDetail()">
    <div class="pp-modal pp-appr-modal" role="dialog" aria-modal="true">
      <button
        class="pp-modal-close"
        type="button"
        :disabled="saving || verdictBusy || photoBusy"
        :aria-label="$t('partnerAdmin.common.close')"
        @click="closeDetail()"
      >&times;</button>
      <h2 class="pp-modal-title">{{ $t('partnerAdmin.approvals.detailTitle') }}</h2>
      <div class="pp-appr-modal-sub">
        <span class="pp-chip">{{ activeItem.partner?.name }}</span>
        <span class="pp-chip pp-chip-pending_approval">{{ activeItem.status.replace(/_/g, ' ') }}</span>
      </div>

      <div class="pp-appr-columns">
        <!-- ===== left: editable fields ===== -->
        <div class="pp-appr-fields">
          <p class="pp-hint pp-appr-block-hint">{{ $t('partnerAdmin.approvals.fieldsHint') }}</p>

          <div class="pp-field">
            <label class="pp-label" for="appr-title">{{ $t('partnerAdmin.approvals.titleField') }}</label>
            <input id="appr-title" v-model="form.title" class="pp-input" type="text" />
          </div>
          <div class="pp-field">
            <label class="pp-label" for="appr-desc">{{ $t('partnerAdmin.approvals.description') }}</label>
            <textarea id="appr-desc" v-model="form.description" class="pp-textarea" rows="3"></textarea>
          </div>
          <div class="pp-appr-grid">
            <div class="pp-field">
              <label class="pp-label" for="appr-brand">{{ $t('partnerAdmin.approvals.brand') }}</label>
              <input id="appr-brand" v-model="form.brand" class="pp-input" type="text" />
            </div>
            <div class="pp-field">
              <label class="pp-label" for="appr-size">{{ $t('partnerAdmin.approvals.size') }}</label>
              <input id="appr-size" v-model="form.size" class="pp-input" type="text" />
            </div>
            <div class="pp-field">
              <label class="pp-label" for="appr-category">{{ $t('partnerAdmin.approvals.category') }}</label>
              <input id="appr-category" v-model="form.category" class="pp-input" type="text" />
            </div>
            <div class="pp-field">
              <label class="pp-label" for="appr-condition">{{ $t('partnerAdmin.approvals.condition') }}</label>
              <input id="appr-condition" v-model="form.condition" class="pp-input" type="text" />
            </div>
          </div>

          <div class="pp-appr-capability">
            <label class="pp-appr-check">
              <input v-model="form.available_for_purchase" type="checkbox" />
              <span>{{ $t('partnerAdmin.approvals.forSale') }}</span>
            </label>
            <div v-show="form.available_for_purchase" class="pp-field">
              <label class="pp-label" for="appr-price">{{ $t('partnerAdmin.approvals.purchasePrice') }}</label>
              <input id="appr-price" v-model="form.purchase_price" class="pp-input" type="text" inputmode="decimal" placeholder="0,00" />
            </div>
          </div>

          <div class="pp-appr-capability">
            <label class="pp-appr-check">
              <input v-model="form.available_for_rental" type="checkbox" />
              <span>{{ $t('partnerAdmin.approvals.forRental') }}</span>
            </label>
            <div v-show="form.available_for_rental" class="pp-appr-grid">
              <div class="pp-field">
                <label class="pp-label" for="appr-rental">{{ $t('partnerAdmin.approvals.rentalPrice') }}</label>
                <input id="appr-rental" v-model="form.rental_price" class="pp-input" type="text" inputmode="decimal" placeholder="0,00" />
              </div>
              <div class="pp-field">
                <label class="pp-label" for="appr-rental-deposit">{{ $t('partnerAdmin.approvals.rentalDeposit') }}</label>
                <input id="appr-rental-deposit" v-model="form.rental_deposit" class="pp-input" type="text" inputmode="decimal" placeholder="0,00" />
              </div>
              <div class="pp-field">
                <label class="pp-label" for="appr-weeks-min">{{ $t('partnerAdmin.approvals.weeksMin') }}</label>
                <input id="appr-weeks-min" v-model="form.rental_min_weeks" class="pp-input" type="number" min="2" max="4" />
              </div>
              <div class="pp-field">
                <label class="pp-label" for="appr-weeks-max">{{ $t('partnerAdmin.approvals.weeksMax') }}</label>
                <input id="appr-weeks-max" v-model="form.rental_max_weeks" class="pp-input" type="number" min="2" max="4" />
              </div>
            </div>
          </div>

          <div class="pp-field">
            <label class="pp-label" for="appr-hold">{{ $t('partnerAdmin.approvals.holdDeposit') }}</label>
            <input id="appr-hold" v-model="form.hold_deposit" class="pp-input" type="text" inputmode="decimal" placeholder="0,00" />
            <p class="pp-hint">{{ $t('partnerAdmin.approvals.holdDepositHint') }}</p>
          </div>

          <p v-if="saveError" class="pp-msg-error">{{ saveError }}</p>
          <p v-if="savedNote" class="pp-msg-success">{{ $t('partnerAdmin.approvals.saved') }}</p>

          <button class="pp-btn pp-btn-outline" type="button" :disabled="saving" @click="saveFields()">
            {{ saving ? $t('partnerAdmin.common.saving') : $t('partnerAdmin.common.save') }}
          </button>
        </div>

        <!-- ===== right: photos + verdict ===== -->
        <div class="pp-appr-side">
          <h3 class="pp-appr-side-title">{{ $t('partnerAdmin.approvals.photosTitle') }}</h3>
          <p class="pp-hint pp-appr-block-hint">{{ $t('partnerAdmin.approvals.photosHint') }}</p>
          <PartnerPhotoUpload
            :photos="activeItem.photos"
            :can-edit="true"
            :kinds="['front', 'back', 'detail']"
            :busy="photoBusy"
            @upload="onPhotoUpload"
            @delete="onPhotoDelete"
          />
          <p v-if="photoError" class="pp-msg-error">{{ photoError }}</p>

          <div class="pp-appr-verdict">
            <p v-if="verdictError" class="pp-msg-error">{{ verdictError }}</p>

            <!-- approve: inline confirm ('this lists the item live') -->
            <div v-if="confirmingApprove" class="pp-appr-confirm">
              <p class="pp-appr-confirm-title">{{ $t('partnerAdmin.approvals.approveConfirmTitle') }}</p>
              <p class="pp-appr-confirm-body">{{ $t('partnerAdmin.approvals.approveConfirmBody') }}</p>
              <div class="pp-appr-verdict-row">
                <button class="pp-btn pp-btn-primary" type="button" :disabled="verdictBusy" @click="approve()">
                  {{ verdictBusy ? $t('partnerAdmin.approvals.approving') : $t('partnerAdmin.approvals.approveConfirmCta') }}
                </button>
                <button class="pp-btn pp-btn-ghost" type="button" :disabled="verdictBusy" @click="confirmingApprove = false">
                  {{ $t('partnerAdmin.common.cancel') }}
                </button>
              </div>
            </div>

            <!-- reject: required reason, partner gets it + a link to fix -->
            <div v-else-if="rejecting" class="pp-appr-confirm">
              <p class="pp-appr-confirm-title">{{ $t('partnerAdmin.approvals.rejectTitle') }}</p>
              <p class="pp-appr-confirm-body">{{ $t('partnerAdmin.approvals.rejectBody') }}</p>
              <div class="pp-field">
                <label class="pp-label" for="appr-reject-reason">{{ $t('partnerAdmin.approvals.rejectReasonLabel') }}</label>
                <textarea
                  id="appr-reject-reason"
                  v-model="rejectReason"
                  class="pp-textarea"
                  rows="3"
                  :placeholder="$t('partnerAdmin.approvals.rejectReasonPlaceholder')"
                ></textarea>
                <p v-if="rejectReasonMissing" class="pp-msg-error">{{ $t('partnerAdmin.approvals.rejectReasonRequired') }}</p>
              </div>
              <div class="pp-appr-verdict-row">
                <button class="pp-btn pp-btn-danger" type="button" :disabled="verdictBusy" @click="reject()">
                  {{ verdictBusy ? $t('partnerAdmin.approvals.rejecting') : $t('partnerAdmin.approvals.rejectSubmit') }}
                </button>
                <button class="pp-btn pp-btn-ghost" type="button" :disabled="verdictBusy" @click="rejecting = false">
                  {{ $t('partnerAdmin.common.cancel') }}
                </button>
              </div>
            </div>

            <div v-else class="pp-appr-verdict-row">
              <button class="pp-btn pp-btn-primary" type="button" @click="confirmingApprove = true">
                {{ $t('partnerAdmin.approvals.approveCta') }}
              </button>
              <button class="pp-btn pp-btn-danger" type="button" @click="rejecting = true">
                {{ $t('partnerAdmin.approvals.rejectCta') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Shared admin layout (duplicated verbatim in all three /admin pages ON PURPOSE:
   page <style> blocks only load with their own page, and a direct visit to any
   /admin URL must carry the full layout — the .pp-admin prefix is the scope). */
.pp-admin {
  align-items: stretch;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding-bottom: 64px;
  font-family: 'Urbanist', sans-serif;
  color: var(--pp-ink);
}
@media (max-width: 767px) {
  .pp-admin {
    padding-top: 72px; /* clear the compact mobile header */
    padding-left: 16px;
    padding-right: 16px;
  }
}
.pp-admin-gate {
  min-height: 30vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pp-admin-header {
  margin-bottom: 28px;
}
.pp-admin-heading {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  text-transform: lowercase;
}
.pp-admin-subtitle {
  color: var(--pp-gray);
  font-size: 15px;
  margin: 6px 0 0;
  max-width: 560px;
}
.pp-admin-nav {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.pp-admin-nav-link {
  padding: 6px 16px;
  border-radius: 50px;
  border: 1px solid var(--pp-gray-light);
  color: var(--pp-gray);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease, border-color 0.2s ease;
}
.pp-admin-nav-link:hover {
  color: var(--pp-magenta);
  border-color: var(--pp-magenta);
}
.pp-admin-nav-link.is-active {
  background: var(--pp-magenta);
  border-color: var(--pp-magenta);
  color: #fff;
}

/* --- approval queue --- */
.pp-appr-card {
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}
.pp-appr-card:hover {
  box-shadow: 0 6px 24px rgba(36, 40, 45, 0.08);
}
.pp-appr-card-info {
  flex: 1;
  min-width: 0;
}
.pp-appr-card-top {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.pp-appr-card-info .pp-card-title {
  text-transform: lowercase;
}
.pp-appr-strip {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  overflow-x: auto;
}
.pp-appr-strip img {
  width: 56px;
  height: 72px;
  object-fit: cover;
  border-radius: 6px;
  background: var(--pp-bg-light);
  flex-shrink: 0;
}

/* --- detail modal: wide two-column work area, stacks on small screens --- */
.pp-appr-backdrop {
  z-index: 4000;
}
.pp-appr-modal {
  max-width: 960px;
}
.pp-appr-modal-sub {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 4px 0 18px;
}
.pp-appr-columns {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 28px;
}
@media (max-width: 860px) {
  .pp-appr-columns {
    grid-template-columns: 1fr;
  }
}
.pp-appr-block-hint {
  margin: 0 0 12px;
}
.pp-appr-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 14px;
}
.pp-appr-capability {
  border: 1px solid var(--pp-bg-light);
  border-radius: 10px;
  padding: 12px 14px 2px;
  margin-bottom: 14px;
}
.pp-appr-capability > .pp-field,
.pp-appr-capability > .pp-appr-grid {
  margin-top: 10px;
}
.pp-appr-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 10px;
}
.pp-appr-check input {
  width: 16px;
  height: 16px;
  accent-color: var(--pp-magenta);
}
.pp-appr-side-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 6px;
  text-transform: lowercase;
}
.pp-appr-verdict {
  margin-top: 24px;
  border-top: 1px solid var(--pp-bg-light);
  padding-top: 18px;
}
.pp-appr-verdict-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.pp-appr-confirm {
  background: var(--pp-bg-light);
  border-radius: 10px;
  padding: 14px 16px;
}
.pp-appr-confirm-title {
  font-weight: 700;
  margin: 0 0 4px;
}
.pp-appr-confirm-body {
  font-size: 13px;
  color: var(--pp-gray);
  margin: 0 0 12px;
}
</style>
