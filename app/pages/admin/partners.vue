<script setup lang="ts">
// Admin partner management — /admin/partners (CONTRACT §3.5).
// GET /admin/partners as dense cards; collapsible CREATE form (POST /admin/partners),
// per-partner manage panel: edit fields + status (PATCH /admin/partners/{hash}),
// create partner login (POST .../users) and Stripe onboarding link (POST .../connect).
import { PartnerApiError } from '~/composables/usePartnerPlatform'

const { locale, t } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const langPrefix = computed(() => (isNL.value ? '/nl' : ''))
const { probe, enabled, fetchMe, ppFetch } = usePartnerPlatform()

useHead({
  title: 'Admin — Partners | Dematerialized',
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
// Partner list (CONTRACT §3.5 AdminPartnerOut)
// ============================================================

interface AdminPartner {
  hash_id: string
  name: string
  slug: string
  status: string
  member_discount_pct: number | null
  fees_active: boolean
  about: string | null
  address: string | null
  pickup_instructions: string | null
  stripe_connect_account_id: string | null
  connect: { onboarded: boolean; charges_enabled: boolean; payouts_enabled: boolean }
  // not in the contract shape today — rendered only when the API starts sending it
  item_count?: number
}

const listState = ref<'loading' | 'ready' | 'error'>('loading')
const partners = ref<AdminPartner[]>([])
const pageNote = ref('')

async function loadPartners() {
  listState.value = 'loading'
  try {
    const rows = await ppFetch<AdminPartner[]>('/admin/partners')
    partners.value = Array.isArray(rows) ? rows : []
    listState.value = 'ready'
  } catch {
    listState.value = 'error'
  }
}

function apiErrorCopy(e: unknown): string {
  if (e instanceof PartnerApiError && e.message && e.message !== e.code) return e.message
  return t('partnerAdmin.common.genericError')
}

// ============================================================
// Create form (collapsible)
// ============================================================

const createOpen = ref(false)
const creating = ref(false)
const createError = ref('')
const createForm = reactive({
  name: '',
  slug: '',
  member_discount_pct: '20',
  fees_active: false, // pilot default: OFF
  about: '',
  address: '',
  pickup_instructions: '',
})
const slugTouched = ref(false)

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents left over from NFKD
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// auto-suggest the slug from the name until the admin edits the slug herself
watch(
  () => createForm.name,
  (name) => {
    if (!slugTouched.value) createForm.slug = slugify(name)
  },
)

function onSlugInput() {
  slugTouched.value = createForm.slug.trim() !== ''
}

async function createPartner() {
  if (creating.value) return
  createError.value = ''
  const name = createForm.name.trim()
  const slug = slugify(createForm.slug.trim())
  if (!name || !slug) {
    createError.value = t('partnerAdmin.common.genericError')
    return
  }
  const pct = createForm.member_discount_pct.trim()
  creating.value = true
  try {
    await ppFetch('/admin/partners', {
      method: 'POST',
      body: {
        name,
        slug,
        member_discount_pct: pct === '' ? null : Number(pct),
        fees_active: createForm.fees_active,
        about: createForm.about.trim() || null,
        address: createForm.address.trim() || null,
        pickup_instructions: createForm.pickup_instructions.trim() || null,
      },
    })
    pageNote.value = t('partnerAdmin.partners.createdNote', { name })
    createOpen.value = false
    createForm.name = ''
    createForm.slug = ''
    createForm.member_discount_pct = '20'
    createForm.fees_active = false
    createForm.about = ''
    createForm.address = ''
    createForm.pickup_instructions = ''
    slugTouched.value = false
    await loadPartners()
  } catch (e) {
    if (e instanceof PartnerApiError && e.status === 409) {
      createError.value = t('partnerAdmin.partners.slugTaken')
    } else {
      createError.value = apiErrorCopy(e)
    }
  } finally {
    creating.value = false
  }
}

// ============================================================
// Manage panel (edit + login + connect), one partner at a time
// ============================================================

const expandedHash = ref<string | null>(null)

const editForm = reactive({
  name: '',
  slug: '',
  status: 'active',
  member_discount_pct: '',
  fees_active: false,
  about: '',
  address: '',
  pickup_instructions: '',
})
const editSaving = ref(false)
const editSaved = ref(false)
const editError = ref('')

const loginEmail = ref('')
const loginBusy = ref(false)
const loginDone = ref(false)
const loginError = ref('')

const connectBusy = ref(false)
const connectUrl = ref('')
const connectError = ref('')
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

function toggleManage(p: AdminPartner) {
  if (expandedHash.value === p.hash_id) {
    expandedHash.value = null
    return
  }
  expandedHash.value = p.hash_id
  editForm.name = p.name || ''
  editForm.slug = p.slug || ''
  editForm.status = p.status || 'active'
  editForm.member_discount_pct = p.member_discount_pct != null ? String(p.member_discount_pct) : ''
  editForm.fees_active = !!p.fees_active
  editForm.about = p.about || ''
  editForm.address = p.address || ''
  editForm.pickup_instructions = p.pickup_instructions || ''
  editSaved.value = false
  editError.value = ''
  loginEmail.value = ''
  loginDone.value = false
  loginError.value = ''
  connectBusy.value = false
  connectUrl.value = ''
  connectError.value = ''
  copied.value = false
}

async function savePartner(p: AdminPartner) {
  if (editSaving.value) return
  editSaved.value = false
  editError.value = ''
  const pct = editForm.member_discount_pct.trim()
  editSaving.value = true
  try {
    const updated = await ppFetch<AdminPartner>(`/admin/partners/${p.hash_id}`, {
      method: 'PATCH',
      body: {
        name: editForm.name.trim() || p.name,
        slug: slugify(editForm.slug.trim()) || p.slug,
        status: editForm.status,
        member_discount_pct: pct === '' ? null : Number(pct),
        fees_active: editForm.fees_active,
        about: editForm.about.trim() || null,
        address: editForm.address.trim() || null,
        pickup_instructions: editForm.pickup_instructions.trim() || null,
      },
    })
    Object.assign(p, updated)
    editSaved.value = true
  } catch (e) {
    if (e instanceof PartnerApiError && e.status === 409) {
      editError.value = t('partnerAdmin.partners.slugTaken')
    } else {
      editError.value = apiErrorCopy(e)
    }
  } finally {
    editSaving.value = false
  }
}

async function createLogin(p: AdminPartner) {
  if (loginBusy.value) return
  loginError.value = ''
  const email = loginEmail.value.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    loginError.value = t('partnerAdmin.common.genericError')
    return
  }
  loginBusy.value = true
  try {
    await ppFetch(`/admin/partners/${p.hash_id}/users`, {
      method: 'POST',
      body: { email, role: 'owner' },
    })
    loginDone.value = true
  } catch (e) {
    loginError.value = apiErrorCopy(e)
  } finally {
    loginBusy.value = false
  }
}

async function startConnect(p: AdminPartner) {
  if (connectBusy.value) return
  connectError.value = ''
  connectBusy.value = true
  try {
    const res = await ppFetch<{ account_id: string; onboarding_url: string }>(
      `/admin/partners/${p.hash_id}/connect`,
      { method: 'POST' },
    )
    connectUrl.value = res.onboarding_url || ''
    p.stripe_connect_account_id = res.account_id || p.stripe_connect_account_id
  } catch (e) {
    connectError.value = apiErrorCopy(e)
  } finally {
    connectBusy.value = false
  }
}

async function copyConnectUrl() {
  if (!connectUrl.value) return
  let ok = false
  try {
    await navigator.clipboard.writeText(connectUrl.value)
    ok = true
  } catch {
    // clipboard API blocked — fall back to selecting the read-only input
    const el = document.getElementById(`pconnect-${expandedHash.value}`) as HTMLInputElement | null
    if (el) {
      el.select()
      try {
        ok = document.execCommand('copy')
      } catch {
        ok = false
      }
    }
  }
  if (ok) {
    copied.value = true
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => (copied.value = false), 2000)
  }
}

onMounted(async () => {
  if (await resolveGate()) await loadPartners()
})

onBeforeUnmount(() => {
  if (copiedTimer) clearTimeout(copiedTimer)
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
        <h1 class="pp-admin-heading">{{ $t('partnerAdmin.partners.heading') }}</h1>
        <p class="pp-admin-subtitle">{{ $t('partnerAdmin.partners.subtitle') }}</p>
        <nav class="pp-admin-nav">
          <NuxtLink :to="`${langPrefix}/admin`" class="pp-admin-nav-link">{{ $t('partnerAdmin.nav.hub') }}</NuxtLink>
          <NuxtLink :to="`${langPrefix}/admin/approvals`" class="pp-admin-nav-link">{{ $t('partnerAdmin.nav.approvals') }}</NuxtLink>
          <NuxtLink :to="`${langPrefix}/admin/partners`" class="pp-admin-nav-link is-active">{{ $t('partnerAdmin.nav.partners') }}</NuxtLink>
        </nav>
      </header>

      <p v-if="pageNote" class="pp-msg-success">{{ pageNote }}</p>

      <!-- ============ create form (collapsible) ============ -->
      <div class="pp-partners-create">
        <button class="pp-btn" :class="createOpen ? 'pp-btn-ghost' : 'pp-btn-primary'" type="button" @click="createOpen = !createOpen">
          {{ createOpen ? $t('partnerAdmin.common.cancel') : $t('partnerAdmin.partners.createToggle') }}
        </button>

        <form v-if="createOpen" class="pp-card pp-partners-form" @submit.prevent="createPartner()">
          <h2 class="pp-partners-form-title">{{ $t('partnerAdmin.partners.createTitle') }}</h2>
          <div class="pp-partners-grid">
            <div class="pp-field">
              <label class="pp-label" for="pcreate-name">{{ $t('partnerAdmin.partners.name') }}</label>
              <input id="pcreate-name" v-model="createForm.name" class="pp-input" type="text" required />
            </div>
            <div class="pp-field">
              <label class="pp-label" for="pcreate-slug">{{ $t('partnerAdmin.partners.slug') }}</label>
              <input id="pcreate-slug" v-model="createForm.slug" class="pp-input" type="text" required @input="onSlugInput()" />
              <p class="pp-hint">{{ $t('partnerAdmin.partners.slugHint') }}</p>
            </div>
            <div class="pp-field">
              <label class="pp-label" for="pcreate-pct">{{ $t('partnerAdmin.partners.memberDiscount') }}</label>
              <input id="pcreate-pct" v-model="createForm.member_discount_pct" class="pp-input" type="number" min="0" max="100" />
            </div>
            <div class="pp-field pp-partners-checkfield">
              <label class="pp-partners-check">
                <input v-model="createForm.fees_active" type="checkbox" />
                <span>{{ $t('partnerAdmin.partners.feesActive') }}</span>
              </label>
            </div>
          </div>
          <div class="pp-field">
            <label class="pp-label" for="pcreate-about">{{ $t('partnerAdmin.partners.about') }}</label>
            <textarea id="pcreate-about" v-model="createForm.about" class="pp-textarea" rows="2"></textarea>
          </div>
          <div class="pp-field">
            <label class="pp-label" for="pcreate-address">{{ $t('partnerAdmin.partners.address') }}</label>
            <textarea id="pcreate-address" v-model="createForm.address" class="pp-textarea" rows="2"></textarea>
          </div>
          <div class="pp-field">
            <label class="pp-label" for="pcreate-pickup">{{ $t('partnerAdmin.partners.pickup') }}</label>
            <textarea id="pcreate-pickup" v-model="createForm.pickup_instructions" class="pp-textarea" rows="2"></textarea>
          </div>
          <p v-if="createError" class="pp-msg-error">{{ createError }}</p>
          <button class="pp-btn pp-btn-primary" type="submit" :disabled="creating">
            {{ creating ? $t('partnerAdmin.partners.creating') : $t('partnerAdmin.partners.createSubmit') }}
          </button>
        </form>
      </div>

      <!-- ============ list ============ -->
      <div v-if="listState === 'loading'" class="pp-admin-gate">
        <div class="pp-spinner"></div>
      </div>

      <div v-else-if="listState === 'error'" class="pp-state">
        <p>{{ $t('partnerAdmin.common.loadError') }}</p>
        <button class="pp-btn pp-btn-outline" type="button" @click="loadPartners()">
          {{ $t('partnerAdmin.common.retry') }}
        </button>
      </div>

      <div v-else-if="!partners.length" class="pp-state">
        <h3>{{ $t('partnerAdmin.partners.empty') }}</h3>
      </div>

      <div v-else>
        <div v-for="p in partners" :key="p.hash_id" class="pp-card pp-partners-card">
          <div class="pp-card-row">
            <div class="pp-partners-info">
              <h2 class="pp-card-title pp-partners-name">{{ p.name }}</h2>
              <div class="pp-card-meta">/{{ p.slug }}</div>
              <div class="pp-partners-chips">
                <span class="pp-chip" :class="`pp-chip-${p.status}`">
                  {{ p.status === 'paused' ? $t('partnerAdmin.partners.statusPaused') : $t('partnerAdmin.partners.statusActive') }}
                </span>
                <span class="pp-chip" :class="p.fees_active ? 'pp-chip-fees-on' : ''">
                  {{ p.fees_active ? $t('partnerAdmin.partners.feesOn') : $t('partnerAdmin.partners.feesOff') }}
                </span>
                <span v-if="p.member_discount_pct != null" class="pp-chip">
                  {{ $t('partnerAdmin.partners.memberDiscountChip', { pct: p.member_discount_pct }) }}
                </span>
                <span class="pp-chip" :class="p.connect?.onboarded ? 'pp-chip-ok' : ''">
                  {{ p.connect?.onboarded ? $t('partnerAdmin.partners.connectReady') : $t('partnerAdmin.partners.connectPending') }}
                </span>
                <span v-if="p.item_count != null" class="pp-chip">
                  {{ $t('partnerAdmin.partners.itemCount', p.item_count) }}
                </span>
              </div>
            </div>
            <div class="pp-card-actions">
              <button class="pp-btn pp-btn-outline pp-btn-sm" type="button" @click="toggleManage(p)">
                {{ expandedHash === p.hash_id ? $t('partnerAdmin.partners.hideManage') : $t('partnerAdmin.partners.manage') }}
              </button>
            </div>
          </div>

          <!-- ============ manage panel ============ -->
          <div v-if="expandedHash === p.hash_id" class="pp-partners-manage">
            <!-- edit -->
            <form class="pp-partners-manage-block" @submit.prevent="savePartner(p)">
              <h3 class="pp-partners-block-title">{{ $t('partnerAdmin.partners.editTitle') }}</h3>
              <div class="pp-partners-grid">
                <div class="pp-field">
                  <label class="pp-label" :for="`pedit-name-${p.hash_id}`">{{ $t('partnerAdmin.partners.name') }}</label>
                  <input :id="`pedit-name-${p.hash_id}`" v-model="editForm.name" class="pp-input" type="text" />
                </div>
                <div class="pp-field">
                  <label class="pp-label" :for="`pedit-slug-${p.hash_id}`">{{ $t('partnerAdmin.partners.slug') }}</label>
                  <input :id="`pedit-slug-${p.hash_id}`" v-model="editForm.slug" class="pp-input" type="text" />
                </div>
                <div class="pp-field">
                  <label class="pp-label" :for="`pedit-status-${p.hash_id}`">{{ $t('partnerAdmin.partners.status') }}</label>
                  <select :id="`pedit-status-${p.hash_id}`" v-model="editForm.status" class="pp-select">
                    <option value="active">{{ $t('partnerAdmin.partners.statusActive') }}</option>
                    <option value="paused">{{ $t('partnerAdmin.partners.statusPaused') }}</option>
                  </select>
                </div>
                <div class="pp-field">
                  <label class="pp-label" :for="`pedit-pct-${p.hash_id}`">{{ $t('partnerAdmin.partners.memberDiscount') }}</label>
                  <input :id="`pedit-pct-${p.hash_id}`" v-model="editForm.member_discount_pct" class="pp-input" type="number" min="0" max="100" />
                </div>
              </div>
              <div class="pp-field pp-partners-checkfield">
                <label class="pp-partners-check">
                  <input v-model="editForm.fees_active" type="checkbox" />
                  <span>{{ $t('partnerAdmin.partners.feesActive') }}</span>
                </label>
              </div>
              <div class="pp-field">
                <label class="pp-label" :for="`pedit-about-${p.hash_id}`">{{ $t('partnerAdmin.partners.about') }}</label>
                <textarea :id="`pedit-about-${p.hash_id}`" v-model="editForm.about" class="pp-textarea" rows="2"></textarea>
              </div>
              <div class="pp-field">
                <label class="pp-label" :for="`pedit-address-${p.hash_id}`">{{ $t('partnerAdmin.partners.address') }}</label>
                <textarea :id="`pedit-address-${p.hash_id}`" v-model="editForm.address" class="pp-textarea" rows="2"></textarea>
              </div>
              <div class="pp-field">
                <label class="pp-label" :for="`pedit-pickup-${p.hash_id}`">{{ $t('partnerAdmin.partners.pickup') }}</label>
                <textarea :id="`pedit-pickup-${p.hash_id}`" v-model="editForm.pickup_instructions" class="pp-textarea" rows="2"></textarea>
              </div>
              <p v-if="editError" class="pp-msg-error">{{ editError }}</p>
              <p v-if="editSaved" class="pp-msg-success">{{ $t('partnerAdmin.partners.saved') }}</p>
              <button class="pp-btn pp-btn-outline pp-btn-sm" type="submit" :disabled="editSaving">
                {{ editSaving ? $t('partnerAdmin.common.saving') : $t('partnerAdmin.common.save') }}
              </button>
            </form>

            <!-- partner login -->
            <div class="pp-partners-manage-block">
              <h3 class="pp-partners-block-title">{{ $t('partnerAdmin.partners.loginTitle') }}</h3>
              <p class="pp-hint pp-partners-block-hint">{{ $t('partnerAdmin.partners.loginBody') }}</p>
              <p v-if="loginDone" class="pp-msg-success">{{ $t('partnerAdmin.partners.loginSuccess') }}</p>
              <form v-else class="pp-partners-inline-form" @submit.prevent="createLogin(p)">
                <div class="pp-field pp-partners-inline-field">
                  <label class="pp-label" :for="`plogin-${p.hash_id}`">{{ $t('partnerAdmin.partners.loginEmail') }}</label>
                  <input :id="`plogin-${p.hash_id}`" v-model="loginEmail" class="pp-input" type="email" required />
                </div>
                <button class="pp-btn pp-btn-outline pp-btn-sm" type="submit" :disabled="loginBusy">
                  {{ loginBusy ? $t('partnerAdmin.partners.loginCreating') : $t('partnerAdmin.partners.loginSubmit') }}
                </button>
              </form>
              <p v-if="loginError" class="pp-msg-error">{{ loginError }}</p>
            </div>

            <!-- stripe connect -->
            <div class="pp-partners-manage-block">
              <h3 class="pp-partners-block-title">{{ $t('partnerAdmin.partners.connectTitle') }}</h3>
              <template v-if="!connectUrl">
                <p class="pp-hint pp-partners-block-hint">{{ $t('partnerAdmin.partners.connectBody') }}</p>
                <button class="pp-btn pp-btn-outline pp-btn-sm" type="button" :disabled="connectBusy" @click="startConnect(p)">
                  {{ connectBusy ? $t('partnerAdmin.partners.connectCreating') : $t('partnerAdmin.partners.connectSubmit') }}
                </button>
              </template>
              <template v-else>
                <p class="pp-msg-success">{{ $t('partnerAdmin.partners.connectSuccess') }}</p>
                <div class="pp-partners-inline-form">
                  <div class="pp-field pp-partners-inline-field">
                    <label class="pp-label" :for="`pconnect-${p.hash_id}`">{{ $t('partnerAdmin.partners.connectLinkLabel') }}</label>
                    <input :id="`pconnect-${p.hash_id}`" ref="connectInput" class="pp-input" type="text" readonly :value="connectUrl" @focus="($event.target as HTMLInputElement).select()" />
                  </div>
                  <button class="pp-btn pp-btn-outline pp-btn-sm" type="button" @click="copyConnectUrl()">
                    {{ copied ? $t('partnerAdmin.common.copied') : $t('partnerAdmin.common.copy') }}
                  </button>
                </div>
              </template>
              <p v-if="connectError" class="pp-msg-error">{{ connectError }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="mobile-footer-spacer"></div>
  </section>
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

/* --- partner management --- */
.pp-partners-create {
  margin-bottom: 22px;
}
.pp-partners-form {
  margin-top: 14px;
}
.pp-partners-form-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 14px;
  text-transform: lowercase;
}
.pp-partners-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}
@media (max-width: 700px) {
  .pp-partners-grid {
    grid-template-columns: 1fr;
  }
}
.pp-partners-checkfield {
  display: flex;
  align-items: flex-end;
  padding-bottom: 4px;
}
.pp-partners-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.pp-partners-check input {
  width: 16px;
  height: 16px;
  accent-color: var(--pp-magenta);
}
.pp-partners-info {
  flex: 1;
  min-width: 0;
}
.pp-partners-name {
  text-transform: lowercase;
}
.pp-partners-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.pp-chip-fees-on {
  background: #e0e7ff;
  color: #3730a3;
}
.pp-chip-paused {
  background: #fef3e2;
  color: var(--pp-warning);
}
.pp-partners-manage {
  margin-top: 16px;
  border-top: 1px solid var(--pp-bg-light);
  padding-top: 16px;
  display: grid;
  gap: 18px;
}
.pp-partners-manage-block {
  background: var(--pp-bg-light);
  border-radius: 10px;
  padding: 14px 16px;
}
.pp-partners-manage-block .pp-input,
.pp-partners-manage-block .pp-select,
.pp-partners-manage-block .pp-textarea {
  background: #fff;
}
.pp-partners-block-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 8px;
  text-transform: lowercase;
}
.pp-partners-block-hint {
  margin: 0 0 10px;
}
.pp-partners-inline-form {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.pp-partners-inline-field {
  flex: 1;
  min-width: 220px;
  margin-bottom: 0;
}
.pp-partners-inline-form .pp-btn {
  margin-bottom: 1px;
}
</style>
