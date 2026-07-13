<script setup lang="ts">
// Partner dashboard — terms & conditions (CONTRACT §3.4 GET/POST /partner/terms).
// Versions grouped by type; publishing a new version never changes what existing
// customers agreed to (old versions stay immutable — the warm intro says so).
useHead({
  title: 'Partner terms',
  meta: [{ name: 'robots', content: 'noindex' }],
})

interface TermsVersion {
  hash_id: string
  type: string
  version: number
  body_text: string | null
  pdf_url: string | null
  effective_from: string
  is_current: boolean
}

type TermsGroups = { purchase: TermsVersion[]; rental: TermsVersion[]; other: TermsVersion[] }

const { locale, t } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const { ppFetch } = usePartnerPlatform()

const state = ref<'loading' | 'ready' | 'error'>('loading')
const groups = ref<TermsGroups | null>(null)

const TYPES = ['purchase', 'rental', 'other'] as const

// one draft form per type
const drafts = reactive<Record<string, { open: boolean; body: string; pdf: File | null; busy: boolean; error: string; success: boolean }>>({
  purchase: { open: false, body: '', pdf: null, busy: false, error: '', success: false },
  rental: { open: false, body: '', pdf: null, busy: false, error: '', success: false },
  other: { open: false, body: '', pdf: null, busy: false, error: '', success: false },
})

function typeLabel(type: string): string {
  if (type === 'purchase') return t('partnerDashboard.terms.typePurchase')
  if (type === 'rental') return t('partnerDashboard.terms.typeRental')
  return t('partnerDashboard.terms.typeOther')
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

function currentOf(type: string): TermsVersion | null {
  const list = groups.value?.[type as keyof TermsGroups] || []
  return list.find((v) => v.is_current) || null
}
function historyOf(type: string): TermsVersion[] {
  const list = groups.value?.[type as keyof TermsGroups] || []
  return list.filter((v) => !v.is_current)
}

async function load() {
  state.value = 'loading'
  try {
    groups.value = await ppFetch<TermsGroups>('/partner/terms')
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}

function onPdfPick(type: string, e: Event) {
  const draft = drafts[type]!
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] || null
  draft.error = ''
  if (file && file.type !== 'application/pdf') {
    draft.pdf = null
    input.value = ''
    draft.error = t('partnerDashboard.terms.pdfBadType')
    return
  }
  draft.pdf = file
}

async function publish(type: string) {
  const draft = drafts[type]!
  if (draft.busy) return
  draft.error = ''
  draft.success = false
  if (!draft.body.trim() && !draft.pdf) {
    draft.error = t('partnerDashboard.terms.needBodyOrPdf')
    return
  }
  draft.busy = true
  try {
    const fd = new FormData()
    fd.append('type', type)
    if (draft.body.trim()) fd.append('body_text', draft.body.trim())
    if (draft.pdf) fd.append('pdf', draft.pdf)
    await ppFetch('/partner/terms', { method: 'POST', formData: fd })
    draft.body = ''
    draft.pdf = null
    draft.open = false
    draft.success = true
    await load()
  } catch (e: any) {
    draft.error = e?.message || t('partnerDashboard.common.error')
  } finally {
    draft.busy = false
  }
}
</script>

<template>
  <section class="full-page-section pp-pterms">
    <PartnerPortalShell @ready="load">
      <h2 class="pp-pterms-title">{{ $t('partnerDashboard.terms.title') }}</h2>
      <p class="pp-pterms-intro">{{ $t('partnerDashboard.terms.intro') }}</p>

      <div v-if="state === 'loading'" class="pp-spinner"></div>

      <div v-else-if="state === 'error'" class="pp-state">
        <p>{{ $t('partnerDashboard.common.error') }}</p>
        <button class="pp-btn pp-btn-outline" type="button" @click="load()">
          {{ $t('partnerDashboard.common.retry') }}
        </button>
      </div>

      <template v-else>
        <div v-for="type in TYPES" :key="type" class="pp-pterms-group">
          <h3 class="pp-pterms-type">{{ typeLabel(type) }}</h3>

          <div v-if="currentOf(type)" class="pp-pterms-current">
            <div class="pp-pterms-version-head">
              <span class="pp-chip pp-chip-active">{{ $t('partnerDashboard.terms.currentChip') }}</span>
              <span class="pp-pterms-meta">
                {{ $t('partnerDashboard.terms.version', { n: currentOf(type)!.version }) }} ·
                {{ $t('partnerDashboard.terms.effectiveFrom', { date: formatDate(currentOf(type)!.effective_from) }) }}
              </span>
            </div>
            <p v-if="currentOf(type)!.body_text" class="pp-pterms-body">{{ currentOf(type)!.body_text }}</p>
            <a
              v-if="currentOf(type)!.pdf_url"
              :href="currentOf(type)!.pdf_url!"
              target="_blank"
              rel="noopener"
              class="pp-pterms-pdf"
            >{{ $t('partnerDashboard.terms.viewPdf') }}</a>
          </div>
          <p v-else class="pp-pterms-none">{{ $t('partnerDashboard.terms.noneYet') }}</p>

          <ul v-if="historyOf(type).length" class="pp-pterms-history">
            <li v-for="v in historyOf(type)" :key="v.hash_id">
              <span class="pp-pterms-meta">
                {{ $t('partnerDashboard.terms.version', { n: v.version }) }} ·
                {{ $t('partnerDashboard.terms.effectiveFrom', { date: formatDate(v.effective_from) }) }}
              </span>
              <a
                v-if="v.pdf_url"
                :href="v.pdf_url"
                target="_blank"
                rel="noopener"
                class="pp-pterms-pdf"
              >{{ $t('partnerDashboard.terms.viewPdf') }}</a>
            </li>
          </ul>

          <p v-if="drafts[type]!.success" class="pp-msg-success">{{ $t('partnerDashboard.terms.published') }}</p>

          <button
            v-if="!drafts[type]!.open"
            class="pp-btn pp-btn-outline pp-btn-sm"
            type="button"
            @click="drafts[type]!.open = true"
          >
            {{ $t('partnerDashboard.terms.newVersion') }}
          </button>

          <form v-else class="pp-pterms-form" @submit.prevent="publish(type)">
            <div class="pp-field">
              <label class="pp-label" :for="`pp-terms-body-${type}`">{{ $t('partnerDashboard.terms.bodyLabel') }}</label>
              <textarea :id="`pp-terms-body-${type}`" v-model="drafts[type]!.body" class="pp-textarea" rows="5"></textarea>
            </div>
            <div class="pp-field">
              <label class="pp-label" :for="`pp-terms-pdf-${type}`">{{ $t('partnerDashboard.terms.pdfLabel') }}</label>
              <input
                :id="`pp-terms-pdf-${type}`"
                class="pp-input"
                type="file"
                accept="application/pdf"
                @change="onPdfPick(type, $event)"
              />
            </div>
            <p v-if="drafts[type]!.error" class="pp-msg-error">{{ drafts[type]!.error }}</p>
            <div class="pp-pterms-form-actions">
              <button
                class="pp-btn pp-btn-ghost pp-btn-sm"
                type="button"
                :disabled="drafts[type]!.busy"
                @click="drafts[type]!.open = false"
              >
                {{ $t('partnerDashboard.common.cancel') }}
              </button>
              <button class="pp-btn pp-btn-primary pp-btn-sm" type="submit" :disabled="drafts[type]!.busy">
                {{ drafts[type]!.busy ? $t('partnerDashboard.terms.publishing') : $t('partnerDashboard.terms.publish') }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </PartnerPortalShell>
  </section>
</template>

<style>
.pp-pterms-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  font-family: 'Urbanist', sans-serif;
}
.pp-pterms-intro {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--pp-gray);
  font-family: 'Urbanist', sans-serif;
  max-width: 620px;
}
.pp-pterms-group {
  background: #fff;
  border: 1px solid var(--pp-gray-light);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  font-family: 'Urbanist', sans-serif;
  max-width: 680px;
}
.pp-pterms-type {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 700;
}
.pp-pterms-current {
  background: var(--pp-bg-light);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 10px;
}
.pp-pterms-version-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.pp-pterms-meta {
  font-size: 13px;
  color: var(--pp-gray);
}
.pp-pterms-body {
  margin: 4px 0;
  font-size: 14px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.pp-pterms-pdf {
  font-size: 13px;
  color: var(--pp-magenta);
  text-decoration: underline;
}
.pp-pterms-none {
  font-size: 14px;
  color: var(--pp-gray);
}
.pp-pterms-history {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
}
.pp-pterms-history li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--pp-bg-light);
}
.pp-pterms-form {
  margin-top: 12px;
}
.pp-pterms-form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
