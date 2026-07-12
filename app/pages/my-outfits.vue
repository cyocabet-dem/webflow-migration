<script setup lang="ts">
// My Outfits — saved Style Match pairs + the hidden-items ("don't show me
// again") manage list. Auth-gated the same way wish-list.vue gates: loading →
// logged-out sign-in state → content. Account only, membership NOT required.
const { t } = useI18n()

useHead({
  title: 'My Outfits | Dematerialized',
  meta: [
    { property: 'og:title', content: 'My Outfits | Dematerialized' },
    { name: 'twitter:title', content: 'My Outfits | Dematerialized' },
  ],
})

const localePath = useLocalePath()
const apiBase = useRuntimeConfig().public.apiBase as string
const { authReady, isAuthenticated, getToken, login, signup } = useAuth()

interface OutfitItem {
  id: number
  sku: string
  name?: string
  size?: { size?: string } | string
  status?: string
  images?: Array<{ image_type?: string; object_url?: string }>
  [key: string]: unknown
}

interface Outfit {
  id: number
  created?: string
  items: OutfitItem[]
}

const loading = ref(true)
const error = ref<string | null>(null)
const outfits = ref<Outfit[]>([])

const hiddenOpen = ref(false)
const hiddenLoading = ref(true)
const hiddenError = ref<string | null>(null)
const hiddenItems = ref<OutfitItem[]>([])

function getFrontImage(item: OutfitItem): string {
  const images = item.images || []
  const front = images.find((img) => img.image_type === 'front') || images[0]
  return front?.object_url || String(item.front_image || '')
}

function productHref(sku: string): string {
  return `${localePath('/product')}?sku=${encodeURIComponent(sku)}`
}

async function loadOutfits() {
  // Re-entrant (native in-place login re-triggers the watch below): show the
  // loading state, not a stale empty state, while the fetch runs.
  loading.value = true
  error.value = null
  const token = await getToken()
  if (!token) {
    loading.value = false
    return
  }
  try {
    const res = await fetch(`${apiBase}/private_clothing_items/outfits`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    outfits.value = (Array.isArray(data) ? data : []).map((o: any) => ({
      id: Number(o.id),
      created: o.created || o.created_at || o.created_timestamp || '',
      items: o.items || [],
    }))
  } catch (err) {
    console.error('[MyOutfits] Load failed:', err)
    error.value = t('myOutfits.loadError')
  } finally {
    loading.value = false
  }
}

async function loadHiddenItems() {
  hiddenLoading.value = true
  hiddenError.value = null
  const token = await getToken()
  if (!token) {
    hiddenLoading.value = false
    return
  }
  try {
    const res = await fetch(`${apiBase}/private_clothing_items/hidden_items/clothing_items`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    hiddenItems.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('[MyOutfits] Hidden items load failed:', err)
    hiddenError.value = t('myOutfits.hiddenLoadError')
  } finally {
    hiddenLoading.value = false
  }
}

async function removeOutfit(outfit: Outfit) {
  // Optimistic removal — on failure re-insert just this outfit (restoring a
  // whole-array snapshot would resurrect rows deleted concurrently).
  const index = outfits.value.findIndex((o) => o.id === outfit.id)
  if (index === -1) return
  outfits.value = outfits.value.filter((o) => o.id !== outfit.id)
  const token = await getToken()
  if (!token) return
  try {
    const res = await fetch(`${apiBase}/private_clothing_items/outfits/${outfit.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    })
    // 404 = already gone; treat as success.
    if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    console.error('[MyOutfits] Remove failed:', err)
    const restored = [...outfits.value]
    restored.splice(Math.min(index, restored.length), 0, outfit)
    outfits.value = restored
  }
}

async function unhideItem(item: OutfitItem) {
  // Optimistic removal — on failure re-insert just this item (restoring a
  // whole-array snapshot would resurrect rows deleted concurrently).
  const index = hiddenItems.value.findIndex((i) => i.id === item.id)
  if (index === -1) return
  hiddenItems.value = hiddenItems.value.filter((i) => i.id !== item.id)
  const token = await getToken()
  if (!token) return
  try {
    const res = await fetch(`${apiBase}/private_clothing_items/hidden_items/${item.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    })
    if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    console.error('[MyOutfits] Unhide failed:', err)
    const restored = [...hiddenItems.value]
    restored.splice(Math.min(index, restored.length), 0, item)
    hiddenItems.value = restored
  }
}

const formattedDate = (outfit: Outfit): string => {
  if (!outfit.created) return ''
  const d = new Date(outfit.created)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString()
}

// Wait for the Auth0 plugin, then load (or show the logged-out state). Also
// keyed on isAuthenticated: in the native apps login completes in place via
// the appUrlOpen deep link — no page reload, so authReady alone never refires.
watch(
  [authReady, isAuthenticated],
  ([ready, authed]) => {
    if (!ready) return
    if (authed) {
      loadOutfits()
      loadHiddenItems()
    } else {
      loading.value = false
      hiddenLoading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="full-page-section my-outfits-page">
    <div v-if="loading || !authReady" class="wishlist-loading">
      <p>{{ t('myOutfits.loading') }}</p>
    </div>

    <!-- Logged out — same gate pattern as the wish list page -->
    <div v-else-if="!isAuthenticated" class="wishlist-logged-out">
      <div class="wishlist-logged-out-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4b073f" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
      </div>
      <h2 class="wishlist-logged-out-title">{{ t('myOutfits.loggedOutTitle') }}</h2>
      <p class="wishlist-logged-out-text">{{ t('myOutfits.loggedOutText') }}</p>
      <div class="wishlist-logged-out-buttons">
        <button class="wishlist-btn-signin" @click="login">{{ t('myOutfits.signIn') }}</button>
        <button class="wishlist-btn-create" @click="signup">{{ t('myOutfits.createAccount') }}</button>
      </div>
    </div>

    <template v-else>
      <h1 class="mo-heading">{{ t('myOutfits.heading') }}</h1>

      <div v-if="error" class="wishlist-error">{{ error }}</div>

      <div v-else-if="outfits.length === 0" class="mo-empty">
        <div class="mo-empty-title">{{ t('myOutfits.empty') }}</div>
        <p>{{ t('myOutfits.emptyHint') }}</p>
        <a :href="localePath('/style-match')" class="wishlist-empty-link">{{ t('myOutfits.goStyleMatch') }}</a>
      </div>

      <div v-else class="mo-grid">
        <div v-for="outfit in outfits" :key="outfit.id" class="mo-card">
          <div class="mo-card-images">
            <a
              v-for="item in outfit.items.slice(0, 2)"
              :key="item.id"
              :href="productHref(item.sku)"
              class="mo-card-image-link"
            >
              <img :src="getFrontImage(item)" :alt="item.name || item.sku" loading="lazy" decoding="async">
              <span class="mo-card-item-name">{{ item.name || item.sku }}</span>
            </a>
          </div>
          <div class="mo-card-footer">
            <span v-if="formattedDate(outfit)" class="mo-card-date">{{ formattedDate(outfit) }}</span>
            <button
              type="button"
              class="mo-remove-btn"
              :aria-label="t('myOutfits.remove')"
              :title="t('myOutfits.remove')"
              @click="removeOutfit(outfit)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              {{ t('myOutfits.remove') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Hidden items ("don't show me again") manage list -->
      <div class="mo-hidden-section">
        <button type="button" class="mo-hidden-toggle" :class="{ 'is-open': hiddenOpen }" @click="hiddenOpen = !hiddenOpen">
          <span>{{ t('myOutfits.hiddenTitle') }}</span>
          <span v-if="!hiddenLoading" class="mo-hidden-count">{{ hiddenItems.length }}</span>
          <svg class="mo-hidden-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6" /></svg>
        </button>
        <div v-if="hiddenOpen" class="mo-hidden-body">
          <p class="mo-hidden-hint">{{ t('myOutfits.hiddenHint') }}</p>
          <div v-if="hiddenLoading" class="mo-hidden-empty">{{ t('myOutfits.loading') }}</div>
          <div v-else-if="hiddenError" class="wishlist-error">{{ hiddenError }}</div>
          <div v-else-if="hiddenItems.length === 0" class="mo-hidden-empty">{{ t('myOutfits.hiddenEmpty') }}</div>
          <div v-else class="mo-hidden-grid">
            <div v-for="item in hiddenItems" :key="item.id" class="mo-hidden-item">
              <a :href="productHref(item.sku)" class="mo-hidden-image-link">
                <img :src="getFrontImage(item)" :alt="item.name || item.sku" loading="lazy" decoding="async">
              </a>
              <div class="mo-hidden-item-name">{{ item.name || item.sku }}</div>
              <button type="button" class="mo-unhide-btn" @click="unhideItem(item)">{{ t('myOutfits.unhide') }}</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="mobile-footer-spacer"></div>
  </section>
</template>

<style>
.my-outfits-page {
  font-family: 'Urbanist', sans-serif;
  color: #24282d;
  padding: 24px 24px 40px;
  max-width: 1100px;
  margin: 0 auto;
}

.mo-heading {
  font-size: 28px;
  font-weight: 500;
  color: #4b073f;
  text-transform: lowercase;
  margin: 0 0 24px;
}

/* Shared gate/empty states — same look as the wish list page (those rules live
   in wish-list.vue's page chunk, so they are redeclared here). */
.my-outfits-page .wishlist-loading {
  text-align: center;
  padding: 80px 20px;
  font-size: 18px;
  color: #24282d;
}

.my-outfits-page .wishlist-error {
  text-align: center;
  padding: 40px 20px;
  color: #a92296;
  font-size: 16px;
}

.my-outfits-page .wishlist-logged-out {
  text-align: center;
  padding: 80px 20px;
  max-width: 400px;
  margin: 0 auto;
}

.my-outfits-page .wishlist-logged-out-icon {
  margin-bottom: 24px;
}

.my-outfits-page .wishlist-logged-out-icon svg {
  opacity: 0.4;
}

.my-outfits-page .wishlist-logged-out-title {
  font-size: 28px;
  font-weight: 500;
  color: #4b073f;
  margin: 0 0 12px 0;
  text-transform: lowercase;
}

.my-outfits-page .wishlist-logged-out-text {
  font-size: 16px;
  color: #46535e;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.my-outfits-page .wishlist-logged-out-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 280px;
  margin: 0 auto;
}

.my-outfits-page .wishlist-btn-signin {
  width: 100%;
  padding: 16px 20px;
  background-color: #a92296;
  color: #f6f8f9;
  border: none;
  border-radius: 50px;
  font-family: 'Urbanist', sans-serif;
  font-size: 18px;
  font-weight: 600;
  text-transform: lowercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.my-outfits-page .wishlist-btn-signin:hover {
  background-color: #4b073f;
}

.my-outfits-page .wishlist-btn-create {
  width: 100%;
  padding: 16px 20px;
  background-color: #fff4fe;
  color: #24282d;
  border: 1px solid #a92296;
  border-radius: 50px;
  font-family: 'Urbanist', sans-serif;
  font-size: 18px;
  font-weight: 600;
  text-transform: lowercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.my-outfits-page .wishlist-btn-create:hover {
  background-color: #f6f8f9;
  border: 1px solid #4b073f;
}

.my-outfits-page .wishlist-empty-link {
  display: inline-block;
  padding: 16px 32px;
  background-color: #a92296;
  color: #f6f8f9;
  font-family: 'Urbanist', sans-serif;
  font-size: 18px;
  font-weight: 600;
  text-transform: lowercase;
  text-decoration: none;
  letter-spacing: 0.5px;
  border-radius: 50px;
  transition: all 0.2s;
}

.my-outfits-page .wishlist-empty-link:hover {
  background-color: #4b073f;
  color: #f6f8f9;
}

.mo-empty {
  text-align: center;
  padding: 60px 20px;
}

.mo-empty-title {
  font-size: 24px;
  font-weight: 500;
  color: #4b073f;
  text-transform: lowercase;
  margin-bottom: 10px;
}

.mo-empty p {
  font-size: 16px;
  color: #46535e;
  margin-bottom: 24px;
}

.mo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 991px) {
  .mo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 599px) {
  .mo-grid {
    grid-template-columns: 1fr;
  }
}

.mo-card {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border: 1px solid #e6dbe4;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(75, 7, 63, 0.05);
}

.mo-card-images {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background-color: #e6dbe4;
}

.mo-card-image-link {
  display: flex;
  flex-direction: column;
  background-color: #f6f8f9;
  text-decoration: none;
  color: #24282d;
}

.mo-card-image-link img {
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: contain;
  padding: 8px;
  box-sizing: border-box;
}

.mo-card-item-name {
  padding: 0 10px 10px;
  font-size: 13px;
  font-weight: 600;
  text-transform: lowercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mo-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
}

.mo-card-date {
  font-size: 12px;
  color: #46535e;
}

.mo-remove-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 7px 14px;
  background-color: #fff;
  color: #46535e;
  border: 1px solid #ced5da;
  border-radius: 50px;
  font-family: 'Urbanist', sans-serif;
  font-size: 12px;
  font-weight: 600;
  text-transform: lowercase;
  cursor: pointer;
  transition: all 0.2s;
}

.mo-remove-btn:hover {
  color: #a92296;
  border-color: #a92296;
}

/* Hidden items section */
.mo-hidden-section {
  margin-top: 40px;
  border-top: 1px solid #e6dbe4;
  padding-top: 20px;
}

.mo-hidden-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: none;
  border: none;
  padding: 8px 0;
  cursor: pointer;
  font-family: 'Urbanist', sans-serif;
  font-size: 20px;
  font-weight: 500;
  color: #4b073f;
  text-transform: lowercase;
  text-align: left;
}

.mo-hidden-count {
  font-size: 13px;
  font-weight: 600;
  color: #46535e;
  background-color: #fff4fe;
  border: 1px solid #e6dbe4;
  border-radius: 50px;
  padding: 1px 10px;
}

.mo-hidden-chevron {
  margin-left: auto;
  transition: transform 0.2s ease;
}

.mo-hidden-toggle.is-open .mo-hidden-chevron {
  transform: rotate(180deg);
}

.mo-hidden-hint {
  font-size: 14px;
  color: #46535e;
  margin: 4px 0 16px;
}

.mo-hidden-empty {
  padding: 24px 0;
  font-size: 15px;
  color: #46535e;
}

.mo-hidden-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 991px) {
  .mo-hidden-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 599px) {
  .mo-hidden-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.mo-hidden-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mo-hidden-image-link {
  display: block;
  border-radius: 16px;
  overflow: hidden;
  background-color: #f6f8f9;
}

.mo-hidden-image-link img {
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: contain;
  padding: 8px;
  box-sizing: border-box;
  display: block;
}

.mo-hidden-item-name {
  font-size: 14px;
  font-weight: 600;
  text-transform: lowercase;
  color: #24282d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mo-unhide-btn {
  padding: 9px 14px;
  background-color: #fff;
  color: #24282d;
  border: 1px solid #a92296;
  border-radius: 50px;
  font-family: 'Urbanist', sans-serif;
  font-size: 13px;
  font-weight: 600;
  text-transform: lowercase;
  cursor: pointer;
  transition: all 0.2s;
}

.mo-unhide-btn:hover {
  background-color: #fff4fe;
  border-color: #4b073f;
}
</style>
