<script setup lang="ts">
// Partner dashboard — storefront profile (CONTRACT §3.4 GET/PATCH /partner/storefront).
// About / address / pickup / opening hours (closed days are simply omitted from the
// hours array) + storefront photos. member_discount_pct is read-only ('set by Demat').
useHead({
  title: 'Partner storefront',
  meta: [{ name: 'robots', content: 'noindex' }],
})

interface StorefrontPhoto {
  hash_id: string
  url: string
}

interface StorefrontData {
  about: string | null
  hours: Array<{ day: string; open: string; close: string }> | null
  address: string | null
  pickup_instructions: string | null
  member_discount_pct: number
  photos: StorefrontPhoto[]
}

const { t } = useI18n()
const { ppFetch } = usePartnerPlatform()

// Guard against double-prefixing: ppFetch's resolveMediaUrls already resolves
// backend-relative media paths against apiBase, so only a raw, unresolved
// '/partner-platform/…' path still needs the prefix here; already-resolved paths
// and absolute S3 URLs pass through untouched.
const apiPublicBase = useRuntimeConfig().public.apiBase
function mediaUrl(u: string): string {
  return u.startsWith('/partner-platform/') ? apiPublicBase + u : u
}

const state = ref<'loading' | 'ready' | 'error'>('loading')
const memberPct = ref(0)
const photos = ref<StorefrontPhoto[]>([])
const displayPhotos = computed(() => photos.value.map((p) => ({ ...p, url: mediaUrl(p.url) })))

const saving = ref(false)
const savedMsg = ref(false)
const saveError = ref('')
const photoBusy = ref(false)
const photoError = ref('')

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const form = reactive({
  about: '',
  address: '',
  pickup: '',
})

const hoursRows = reactive(
  DAYS.map((day) => ({ day, closed: true, open: '10:00', close: '18:00' })),
)

function fill(data: StorefrontData) {
  form.about = data.about || ''
  form.address = data.address || ''
  form.pickup = data.pickup_instructions || ''
  memberPct.value = data.member_discount_pct
  photos.value = data.photos || []
  for (const row of hoursRows) {
    const entry = (data.hours || []).find((h) => h.day === row.day)
    if (entry) {
      row.closed = false
      row.open = entry.open
      row.close = entry.close
    } else {
      row.closed = true
    }
  }
}

async function load() {
  state.value = 'loading'
  try {
    fill(await ppFetch<StorefrontData>('/partner/storefront'))
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}

async function save() {
  if (saving.value) return
  saving.value = true
  savedMsg.value = false
  saveError.value = ''
  try {
    const hours = hoursRows
      .filter((r) => !r.closed && r.open && r.close)
      .map((r) => ({ day: r.day, open: r.open, close: r.close }))
    const data = await ppFetch<StorefrontData>('/partner/storefront', {
      method: 'PATCH',
      body: {
        about: form.about.trim() || null,
        address: form.address.trim() || null,
        pickup_instructions: form.pickup.trim() || null,
        hours,
      },
    })
    fill(data)
    savedMsg.value = true
  } catch (e: any) {
    saveError.value = e?.message && e?.code ? e.message : t('partnerDashboard.common.error')
  } finally {
    saving.value = false
  }
}

async function onPhotosUpload(files: File[]) {
  if (photoBusy.value) return
  photoBusy.value = true
  photoError.value = ''
  try {
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    const res = await ppFetch<{ photos: StorefrontPhoto[] }>('/partner/storefront/photos', {
      method: 'POST',
      formData: fd,
    })
    photos.value = res.photos
  } catch {
    photoError.value = t('partnerDashboard.storefront.photoError')
  } finally {
    photoBusy.value = false
  }
}

async function onPhotoDelete(hashId: string) {
  if (photoBusy.value) return
  photoBusy.value = true
  photoError.value = ''
  try {
    const res = await ppFetch<{ photos: StorefrontPhoto[] }>(
      `/partner/storefront/photos/${hashId}`,
      { method: 'DELETE' },
    )
    photos.value = res.photos
  } catch {
    photoError.value = t('partnerDashboard.storefront.photoError')
  } finally {
    photoBusy.value = false
  }
}
</script>

<template>
  <section class="full-page-section pp-psf">
    <PartnerPortalShell @ready="load">
      <h2 class="pp-psf-title">{{ $t('partnerDashboard.storefront.title') }}</h2>

      <div v-if="state === 'loading'" class="pp-spinner"></div>

      <div v-else-if="state === 'error'" class="pp-state">
        <p>{{ $t('partnerDashboard.common.error') }}</p>
        <button class="pp-btn pp-btn-outline" type="button" @click="load()">
          {{ $t('partnerDashboard.common.retry') }}
        </button>
      </div>

      <template v-else>
        <form class="pp-psf-card" @submit.prevent="save()">
          <div class="pp-field">
            <label class="pp-label" for="pp-sf-about">{{ $t('partnerDashboard.storefront.aboutLabel') }}</label>
            <textarea id="pp-sf-about" v-model="form.about" class="pp-textarea" rows="4"></textarea>
          </div>
          <div class="pp-field">
            <label class="pp-label" for="pp-sf-address">{{ $t('partnerDashboard.storefront.addressLabel') }}</label>
            <input id="pp-sf-address" v-model="form.address" class="pp-input" type="text" />
          </div>
          <div class="pp-field">
            <label class="pp-label" for="pp-sf-pickup">{{ $t('partnerDashboard.storefront.pickupLabel') }}</label>
            <textarea id="pp-sf-pickup" v-model="form.pickup" class="pp-textarea" rows="3"></textarea>
          </div>

          <div class="pp-field">
            <span class="pp-label">{{ $t('partnerDashboard.storefront.hoursTitle') }}</span>
            <div v-for="row in hoursRows" :key="row.day" class="pp-psf-hours-row">
              <span class="pp-psf-day">{{ $t(`partnerDashboard.storefront.days.${row.day}`) }}</span>
              <label class="pp-psf-closed">
                <input v-model="row.closed" type="checkbox" />
                {{ $t('partnerDashboard.storefront.closedLabel') }}
              </label>
              <template v-if="!row.closed">
                <input
                  v-model="row.open"
                  class="pp-input pp-psf-time"
                  type="time"
                  :aria-label="$t('partnerDashboard.storefront.opensLabel')"
                />
                <span class="pp-psf-dash">–</span>
                <input
                  v-model="row.close"
                  class="pp-input pp-psf-time"
                  type="time"
                  :aria-label="$t('partnerDashboard.storefront.closesLabel')"
                />
              </template>
            </div>
          </div>

          <div class="pp-psf-discount">
            <span class="pp-label">{{ $t('partnerDashboard.storefront.discountLabel') }}</span>
            <strong>{{ memberPct }}%</strong>
            <p class="pp-hint">{{ $t('partnerDashboard.storefront.discountNote', { pct: memberPct }) }}</p>
          </div>

          <p v-if="saveError" class="pp-msg-error">{{ saveError }}</p>
          <p v-if="savedMsg" class="pp-msg-success">{{ $t('partnerDashboard.common.saved') }}</p>

          <button class="pp-btn pp-btn-primary" type="submit" :disabled="saving">
            {{ saving ? $t('partnerDashboard.common.saving') : $t('partnerDashboard.common.save') }}
          </button>
        </form>

        <div class="pp-psf-card">
          <h3 class="pp-psf-subtitle">{{ $t('partnerDashboard.storefront.photosTitle') }}</h3>
          <p class="pp-hint">{{ $t('partnerDashboard.storefront.photosHint') }}</p>
          <PartnerPhotoUpload
            :photos="displayPhotos"
            :can-edit="true"
            :busy="photoBusy"
            @upload="onPhotosUpload"
            @delete="onPhotoDelete"
          />
          <p v-if="photoError" class="pp-msg-error">{{ photoError }}</p>
        </div>
      </template>
    </PartnerPortalShell>
  </section>
</template>

<style>
.pp-psf-title {
  margin: 0 0 14px;
  font-size: 20px;
  font-weight: 700;
  font-family: 'Urbanist', sans-serif;
}
.pp-psf-card {
  background: #fff;
  border: 1px solid var(--pp-gray-light);
  border-radius: 12px;
  padding: 22px;
  margin-bottom: 16px;
  font-family: 'Urbanist', sans-serif;
  max-width: 680px;
}
.pp-psf-subtitle {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
}
.pp-psf-hours-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 5px 0;
  border-bottom: 1px solid var(--pp-bg-light);
}
.pp-psf-day {
  width: 90px;
  font-size: 14px;
  font-weight: 600;
}
.pp-psf-closed {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--pp-gray);
  cursor: pointer;
}
.pp-psf-time {
  width: 110px;
  padding: 5px 8px;
}
.pp-psf-dash {
  color: var(--pp-gray);
}
.pp-psf-discount {
  background: var(--pp-bg-light);
  border-radius: 10px;
  padding: 12px 16px;
  margin: 16px 0;
}
.pp-psf-discount strong {
  font-size: 18px;
}
</style>
