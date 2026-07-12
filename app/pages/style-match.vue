<script setup lang="ts">
// Style Match — outfit-swipe feature. Anyone can browse/swipe left; a right
// swipe (wishlist), hiding an item or saving an outfit needs an account (same
// auth-modal gate the rest of the site uses; membership NOT required).
import type { SwipeDeck as SwipeDeckState, SwipeItem } from '~/composables/useOutfitSwipe'
import SwipeDeck from '~/components/swipe/SwipeDeck.vue'

const { t } = useI18n()

useHead({
  title: 'Style Match | Dematerialized',
  meta: [
    { property: 'og:title', content: 'Style Match | Dematerialized' },
    { name: 'twitter:title', content: 'Style Match | Dematerialized' },
  ],
})

const localePath = useLocalePath()
const { isAuthenticated, openAuthModal } = useAuth()

const swipe = useOutfitSwipe()
const {
  catalogLoaded,
  catalogError,
  categories,
  decks,
  hiddenToast,
  hideError,
} = swipe

// ============================================================
// SETUP SCREEN STATE
// ============================================================

const mode = ref<'setup' | 'swipe'>('setup')

// Catalog mode: 1 or 2 distinct categories.
const selectedCategories = ref<string[]>([])

// Closet mode: user photo (object URL — stays on the device, never uploaded,
// gone when the session ends) + own-item category (layout only) + ONE catalog
// category to swipe through.
const closetMode = ref(false)
const closetPhotoUrl = ref<string | null>(null)
const closetCategory = ref('')
const closetSwipeCategory = ref('')
const photoInputEl = ref<HTMLInputElement | null>(null)

function toggleCategory(name: string) {
  const list = selectedCategories.value
  if (list.includes(name)) {
    selectedCategories.value = list.filter((c) => c !== name)
  } else if (list.length < 2) {
    selectedCategories.value = [...list, name]
  }
}

function toggleClosetMode() {
  closetMode.value = !closetMode.value
}

function onPhotoPicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (closetPhotoUrl.value) URL.revokeObjectURL(closetPhotoUrl.value)
  closetPhotoUrl.value = URL.createObjectURL(file)
  // Allow re-picking the same file later.
  input.value = ''
}

const canStart = computed(() => {
  if (!catalogLoaded.value) return false
  if (closetMode.value) {
    return !!closetPhotoUrl.value && !!closetCategory.value && !!closetSwipeCategory.value
  }
  return selectedCategories.value.length >= 1 && selectedCategories.value.length <= 2
})

function startSwiping() {
  if (!canStart.value) return
  if (closetMode.value) {
    swipe.buildDecks([closetSwipeCategory.value])
  } else {
    swipe.buildDecks(selectedCategories.value)
  }
  mode.value = 'swipe'
  // 2-category catalog mode can save outfits — pre-load existing pairs so a
  // duplicate save can honestly say "already saved".
  if (showSaveOutfit.value && isAuthenticated.value) {
    swipe.seedSavedPairs().catch(() => {})
  }
  if (import.meta.client) window.scrollTo({ top: 0 })
}

function backToSetup() {
  mode.value = 'setup'
  saveState.value = 'idle'
  if (import.meta.client) window.scrollTo({ top: 0 })
}

// ============================================================
// SWIPE SCREEN — sections ordered by category-group rank
// (rank 0 on top; equal rank keeps selection order; in closet
// mode the pinned photo card slots in by the same rule)
// ============================================================

interface SwipeSection {
  type: 'deck' | 'photo'
  rank: number
  order: number
  deck?: SwipeDeckState
}

const sections = computed<SwipeSection[]>(() => {
  const list: SwipeSection[] = decks.value.map((deck) => ({
    type: 'deck' as const,
    rank: deck.rank,
    order: deck.order + 1,
    deck,
  }))
  if (closetMode.value && mode.value === 'swipe') {
    list.push({ type: 'photo', rank: swipe.categoryRank(closetCategory.value), order: 0 })
  }
  return list.sort((a, b) => a.rank - b.rank || a.order - b.order)
})

// ============================================================
// SWIPE ACTIONS
// ============================================================

function onSwipeLeft(deck: SwipeDeckState, item: SwipeItem) {
  // Skip is purely visual — no persistence of any kind.
  swipe.removeFromDeck(deck, item)
}

async function onSwipeRight(deck: SwipeDeckState, item: SwipeItem) {
  swipe.removeFromDeck(deck, item)
  // Existing wishlist flow, optimistic update included.
  await swipe.wishlist.addToWishlist(item.id)
}

function onBlockedRight() {
  openAuthModal()
}

function onHide(deck: SwipeDeckState, item: SwipeItem) {
  if (!isAuthenticated.value) {
    openAuthModal()
    return
  }
  swipe.hideItem(deck, item)
}

function onRestart(deck: SwipeDeckState) {
  swipe.restartDeck(deck)
}

// ============================================================
// SAVE OUTFIT (2-category catalog mode only)
// ============================================================

const showSaveOutfit = computed(() => !closetMode.value && decks.value.length === 2)

const saveState = ref<'idle' | 'saving' | 'saved' | 'exists' | 'error'>('idle')
let saveStateTimer: ReturnType<typeof setTimeout> | undefined

const canSaveOutfit = computed(
  () => showSaveOutfit.value
    && saveState.value !== 'saving'
    && decks.value.every((d) => d.items.length > 0),
)

async function onSaveOutfit() {
  if (!canSaveOutfit.value) return
  if (!isAuthenticated.value) {
    openAuthModal()
    return
  }
  const [a, b] = decks.value.map((d) => d.items[0]!.id)
  if (!a || !b || a === b) return
  clearTimeout(saveStateTimer)
  saveState.value = 'saving'
  const result = await swipe.saveOutfit(a, b)
  saveState.value = result
  saveStateTimer = setTimeout(() => {
    saveState.value = 'idle'
  }, 2500)
}

const saveButtonLabel = computed(() => {
  switch (saveState.value) {
    case 'saving': return t('styleMatch.saving')
    case 'saved': return t('styleMatch.outfitSaved')
    case 'exists': return t('styleMatch.outfitExists')
    case 'error': return t('styleMatch.outfitSaveError')
    default: return t('styleMatch.saveOutfit')
  }
})

// ============================================================
// LIFECYCLE
// ============================================================

onMounted(() => {
  swipe.init()
})

onBeforeUnmount(() => {
  swipe.dispose()
  clearTimeout(saveStateTimer)
  // The closet photo lives only in this session — release it on leave.
  if (closetPhotoUrl.value) URL.revokeObjectURL(closetPhotoUrl.value)
})
</script>

<template>
  <section class="full-page-section style-match-page">
    <!-- ============ SETUP SCREEN ============ -->
    <div v-if="mode === 'setup'" class="sm-setup">
      <h1 class="sm-title">{{ t('styleMatch.title') }}</h1>
      <p class="sm-tagline">{{ t('styleMatch.tagline') }}</p>

      <div v-if="catalogError" class="sm-error">{{ t('styleMatch.loadError') }}</div>
      <div v-else-if="!catalogLoaded" class="sm-loading">{{ t('styleMatch.loading') }}</div>

      <template v-else>
        <!-- Closet mode toggle -->
        <button type="button" class="sm-closet-toggle" :class="{ 'is-on': closetMode }" @click="toggleClosetMode">
          <span class="sm-closet-toggle-check" aria-hidden="true">
            <svg v-if="closetMode" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </span>
          <span class="sm-closet-toggle-text">
            <span class="sm-closet-toggle-title">{{ t('styleMatch.closetModeTitle') }}</span>
            <span class="sm-closet-toggle-hint">{{ t('styleMatch.closetModeHint') }}</span>
          </span>
        </button>

        <!-- Catalog mode: pick 1 or 2 categories -->
        <div v-if="!closetMode" class="sm-setup-block">
          <h2 class="sm-setup-heading">{{ t('styleMatch.setupHeading') }}</h2>
          <p class="sm-setup-hint">{{ t('styleMatch.setupHint') }}</p>
          <div class="sm-category-grid">
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              class="sm-category-chip"
              :class="{ 'is-selected': selectedCategories.includes(cat) }"
              :disabled="!selectedCategories.includes(cat) && selectedCategories.length >= 2"
              @click="toggleCategory(cat)"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Closet mode setup -->
        <div v-else class="sm-setup-block">
          <div class="sm-photo-block">
            <input
              ref="photoInputEl"
              type="file"
              accept="image/*"
              class="sm-photo-input"
              @change="onPhotoPicked"
            >
            <div v-if="closetPhotoUrl" class="sm-photo-preview">
              <img :src="closetPhotoUrl" :alt="t('styleMatch.yourItem')">
            </div>
            <button type="button" class="sm-photo-btn" @click="photoInputEl?.click()">
              {{ closetPhotoUrl ? t('styleMatch.changePhoto') : t('styleMatch.uploadPhoto') }}
            </button>
          </div>

          <label class="sm-select-label">
            {{ t('styleMatch.yourItemCategory') }}
            <select v-model="closetCategory" class="sm-select">
              <option value="" disabled>{{ t('styleMatch.chooseCategory') }}</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
            <span class="sm-select-hint">{{ t('styleMatch.yourItemCategoryHint') }}</span>
          </label>

          <label class="sm-select-label">
            {{ t('styleMatch.swipeCategoryLabel') }}
            <select v-model="closetSwipeCategory" class="sm-select">
              <option value="" disabled>{{ t('styleMatch.chooseCategory') }}</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </label>
        </div>

        <button type="button" class="sm-start-btn" :disabled="!canStart" @click="startSwiping">
          {{ t('styleMatch.startSwiping') }}
        </button>
      </template>
    </div>

    <!-- ============ SWIPE SCREEN ============ -->
    <div v-else class="sm-swipe">
      <div class="sm-swipe-topbar">
        <button type="button" class="sm-back-btn" @click="backToSetup">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          {{ t('styleMatch.backToSetup') }}
        </button>
        <a v-if="isAuthenticated" :href="localePath('/my-outfits')" class="sm-outfits-link">{{ t('styleMatch.viewOutfits') }}</a>
      </div>

      <div class="sm-decks">
        <template v-for="(section, i) in sections" :key="section.type === 'deck' ? `deck-${section.deck!.category}` : 'photo'">
          <!-- Pinned static card with the user's own item (closet mode) -->
          <div v-if="section.type === 'photo'" class="sm-photo-card">
            <div class="sm-photo-card-frame">
              <img :src="closetPhotoUrl || ''" :alt="t('styleMatch.yourItem')" draggable="false">
              <span class="sm-photo-card-badge">{{ t('styleMatch.yourItem') }}</span>
            </div>
            <div class="sm-photo-card-caption">{{ closetCategory.toLowerCase() }}</div>
          </div>

          <SwipeDeck
            v-else
            :category="section.deck!.category"
            :items="section.deck!.items"
            :allow-right="isAuthenticated"
            :status-label="swipe.formatStatus"
            @swipe-left="(item) => onSwipeLeft(section.deck!, item)"
            @swipe-right="(item) => onSwipeRight(section.deck!, item)"
            @blocked-right="onBlockedRight"
            @hide="(item) => onHide(section.deck!, item)"
            @restart="onRestart(section.deck!)"
            @change-categories="backToSetup"
          />

          <!-- Save-outfit button between the two decks (2-category catalog mode) -->
          <div v-if="showSaveOutfit && i === 0" class="sm-save-outfit-row">
            <button
              type="button"
              class="sm-save-outfit-btn"
              :class="{ 'is-saved': saveState === 'saved' || saveState === 'exists', 'is-error': saveState === 'error' }"
              :disabled="!canSaveOutfit"
              @click="onSaveOutfit"
            >
              <svg v-if="saveState === 'saved' || saveState === 'exists'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
              {{ saveButtonLabel }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- Hidden-item undo snackbar -->
    <div class="sm-toast" :class="{ 'is-visible': !!hiddenToast }" role="status">
      <template v-if="hiddenToast">
        <span class="sm-toast-text">{{ t('styleMatch.hiddenToast') }}</span>
        <button type="button" class="sm-toast-undo" @click="swipe.undoHide()">{{ t('styleMatch.undo') }}</button>
      </template>
    </div>
    <div class="sm-toast sm-toast-error" :class="{ 'is-visible': hideError }" role="alert">
      <span class="sm-toast-text">{{ t('styleMatch.hideError') }}</span>
    </div>

    <div class="mobile-footer-spacer"></div>
  </section>
</template>

<style>
.style-match-page {
  font-family: 'Urbanist', sans-serif;
  color: #24282d;
  padding: 24px 24px 40px;
  max-width: 900px;
  margin: 0 auto;
}

/* ============ setup screen ============ */
.sm-setup {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
}

.sm-title {
  font-size: 34px;
  font-weight: 600;
  color: #4b073f;
  margin: 0;
}

.sm-tagline {
  font-size: 16px;
  color: #46535e;
  margin: 0;
}

.sm-loading,
.sm-error {
  padding: 40px 20px;
  font-size: 16px;
  color: #46535e;
}

.sm-error {
  color: #a92296;
}

.sm-closet-toggle {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background-color: #fff;
  border: 1px solid #ced5da;
  border-radius: 16px;
  cursor: pointer;
  text-align: left;
  font-family: 'Urbanist', sans-serif;
  transition: all 0.2s;
}

.sm-closet-toggle.is-on {
  background-color: #fff4fe;
  border-color: #a92296;
}

.sm-closet-toggle-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  border: 1px solid #ced5da;
  border-radius: 6px;
  background-color: #fff;
  color: #a92296;
}

.sm-closet-toggle.is-on .sm-closet-toggle-check {
  border-color: #a92296;
}

.sm-closet-toggle-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sm-closet-toggle-title {
  font-size: 16px;
  font-weight: 600;
  text-transform: lowercase;
  color: #24282d;
}

.sm-closet-toggle-hint {
  font-size: 13px;
  color: #46535e;
  line-height: 1.45;
}

.sm-setup-block {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.sm-setup-heading {
  font-size: 20px;
  font-weight: 600;
  color: #4b073f;
  text-transform: lowercase;
  margin: 0;
}

.sm-setup-hint {
  font-size: 14px;
  color: #46535e;
  margin: 0;
}

.sm-category-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.sm-category-chip {
  padding: 10px 18px;
  background-color: #fff;
  color: #24282d;
  border: 1px solid #ced5da;
  border-radius: 50px;
  font-family: 'Urbanist', sans-serif;
  font-size: 15px;
  font-weight: 500;
  text-transform: lowercase;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.sm-category-chip.is-selected {
  background-color: #a92296;
  color: #f6f8f9;
  border-color: #a92296;
}

.sm-category-chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sm-photo-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.sm-photo-input {
  display: none;
}

.sm-photo-preview {
  width: 160px;
  height: 200px;
  border-radius: 16px;
  overflow: hidden;
  background-color: #f6f8f9;
  border: 1px solid #ced5da;
}

.sm-photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sm-photo-btn {
  padding: 12px 24px;
  background-color: #fff;
  color: #24282d;
  border: 1px solid #a92296;
  border-radius: 50px;
  font-family: 'Urbanist', sans-serif;
  font-size: 15px;
  font-weight: 600;
  text-transform: lowercase;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.2s;
}

.sm-photo-btn:hover {
  background-color: #fff4fe;
  border-color: #4b073f;
}

.sm-select-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #4b073f;
  text-transform: lowercase;
  text-align: left;
}

.sm-select {
  padding: 12px 14px;
  border: 1px solid #ced5da;
  border-radius: 12px;
  background-color: #fff;
  font-family: 'Urbanist', sans-serif;
  font-size: 15px;
  font-weight: 400;
  color: #24282d;
}

.sm-select-hint {
  font-size: 12px;
  font-weight: 400;
  color: #46535e;
}

.sm-start-btn {
  padding: 16px 40px;
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

.sm-start-btn:hover {
  background-color: #4b073f;
}

.sm-start-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ============ swipe screen ============ */
.sm-swipe {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sm-swipe-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sm-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #fff;
  color: #24282d;
  border: 1px solid #ced5da;
  border-radius: 50px;
  font-family: 'Urbanist', sans-serif;
  font-size: 13px;
  font-weight: 600;
  text-transform: lowercase;
  cursor: pointer;
  transition: all 0.2s;
}

.sm-back-btn:hover {
  border-color: #4b073f;
}

.sm-outfits-link {
  font-family: 'Urbanist', sans-serif;
  font-size: 13px;
  font-weight: 600;
  text-transform: lowercase;
  color: #a92296;
  text-decoration: underline;
}

.sm-outfits-link:hover {
  color: #4b073f;
}

.sm-decks {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.sm-save-outfit-row {
  display: flex;
  justify-content: center;
  width: 100%;
}

.sm-save-outfit-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 26px;
  background-color: #4b073f;
  color: #f6f8f9;
  border: none;
  border-radius: 50px;
  font-family: 'Urbanist', sans-serif;
  font-size: 15px;
  font-weight: 600;
  text-transform: lowercase;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.2s;
}

.sm-save-outfit-btn:hover {
  background-color: #a92296;
}

.sm-save-outfit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sm-save-outfit-btn.is-saved {
  background-color: #1f9d55;
}

.sm-save-outfit-btn.is-error {
  background-color: #a92296;
}

/* Pinned own-item card (closet mode) */
.sm-photo-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.sm-photo-card-frame {
  position: relative;
  width: 100%;
  max-width: 340px;
  height: 40vh;
  min-height: 260px;
  border-radius: 20px;
  overflow: hidden;
  background-color: #f6f8f9;
  border: 1px solid #e6dbe4;
  box-shadow: 0 4px 16px rgba(75, 7, 63, 0.08);
}

.sm-photo-card-frame img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.sm-photo-card-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 12px;
  background-color: #4b073f;
  color: #f6f8f9;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: lowercase;
  border-radius: 50px;
}

.sm-photo-card-caption {
  padding-top: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #46535e;
  text-transform: lowercase;
}

/* ============ undo snackbar ============ */
.sm-toast {
  position: fixed;
  left: 50%;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  transform: translate(-50%, 16px);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 18px;
  background-color: #24282d;
  color: #f6f8f9;
  border-radius: 12px;
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s;
  z-index: 9995;
  max-width: calc(100vw - 32px);
}

.sm-toast.is-visible {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, 0);
}

.sm-toast-error {
  background-color: #a92296;
}

.sm-toast-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sm-toast-undo {
  flex-shrink: 0;
  background: none;
  border: none;
  color: #ff9ff1;
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  font-weight: 700;
  text-transform: lowercase;
  letter-spacing: 0.4px;
  cursor: pointer;
  padding: 4px;
}

.sm-toast-undo:hover {
  color: #fff;
}

/* Mobile: both sections must fit a phone viewport (cards ~40vh each). */
@media (max-width: 767px) {
  .style-match-page {
    padding: 16px 16px 32px;
  }

  .sm-title {
    font-size: 28px;
  }

  .sm-decks {
    gap: 10px;
  }

  .style-match-page .swipe-deck-stack,
  .style-match-page .sm-photo-card-frame {
    height: 38vh;
    min-height: 220px;
    max-width: 300px;
  }

  .style-match-page .swipe-deck-header {
    max-width: 300px;
  }

  .style-match-page .swipe-deck-actions {
    padding-top: 6px;
    gap: 32px;
  }

  .style-match-page .swipe-deck-btn {
    width: 44px;
    height: 44px;
  }

  /* Keep the undo snackbar above the floating bottom nav. */
  .sm-toast {
    bottom: calc(96px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
