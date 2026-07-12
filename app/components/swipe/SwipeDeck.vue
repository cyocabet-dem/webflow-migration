<script setup lang="ts">
// A Style Match card deck for one category: renders the top few cards stacked,
// with skip (left) / heart (right) buttons for tap and desktop use, and a
// friendly end state when the deck runs out. The queue itself lives in
// useOutfitSwipe — this component only displays it and forwards intents.
import type { SwipeItem } from '~/composables/useOutfitSwipe'
import SwipeCard from '~/components/swipe/SwipeCard.vue'

const props = defineProps<{
  category: string
  items: SwipeItem[]
  /** Right swipe (wishlist) allowed — false when logged out. */
  allowRight: boolean
  statusLabel: (status: string) => string
}>()

const emit = defineEmits<{
  (e: 'swipe-left', item: SwipeItem): void
  (e: 'swipe-right', item: SwipeItem): void
  (e: 'blocked-right'): void
  (e: 'hide', item: SwipeItem): void
  (e: 'restart'): void
  (e: 'change-categories'): void
}>()

const { t } = useI18n()

// Top 3 cards rendered; index 0 is the interactive top card.
const visible = computed(() => props.items.slice(0, 3))

// Distinguish "swiped through everything" from "nothing to show at all"
// (every item wishlisted/hidden): the latter gets the noItems end state,
// where restart would just rebuild the same empty list.
const everHadItems = ref(props.items.length > 0)
watch(
  () => props.items.length,
  (len) => {
    if (len > 0) everHadItems.value = true
  },
)

function onRestart() {
  // If the rebuild comes back empty (everything excluded since), fall
  // through to the noItems state instead of a restart that does nothing.
  everHadItems.value = false
  emit('restart')
}

const cardRefs = new Map<number, InstanceType<typeof SwipeCard>>()

function setCardRef(id: number, el: unknown) {
  if (el) cardRefs.set(id, el as InstanceType<typeof SwipeCard>)
  else cardRefs.delete(id)
}

function swipeTop(direction: 'left' | 'right') {
  const top = props.items[0]
  if (!top) return
  if (direction === 'right' && !props.allowRight) {
    emit('blocked-right')
    return
  }
  cardRefs.get(top.id)?.swipe(direction)
}

function onSwiped(item: SwipeItem, direction: 'left' | 'right') {
  if (direction === 'right') emit('swipe-right', item)
  else emit('swipe-left', item)
}
</script>

<template>
  <div class="swipe-deck">
    <div class="swipe-deck-header">
      <span class="swipe-deck-category">{{ category }}</span>
      <span v-if="items.length" class="swipe-deck-count">{{ items.length }}</span>
    </div>
    <div class="swipe-deck-stack">
      <template v-if="visible.length">
        <SwipeCard
          v-for="(item, i) in visible"
          :key="item.id"
          :ref="(el) => setCardRef(item.id, el)"
          :item="item"
          :active="i === 0"
          :depth="i"
          :allow-right="allowRight"
          :status-label="statusLabel(item.status)"
          @swiped="(dir) => onSwiped(item, dir)"
          @blocked-right="emit('blocked-right')"
          @hide="emit('hide', item)"
        />
      </template>
      <div v-else class="swipe-deck-end">
        <template v-if="everHadItems">
          <div class="swipe-deck-end-title">{{ t('styleMatch.deckEmptyTitle') }}</div>
          <p class="swipe-deck-end-text">{{ t('styleMatch.deckEmptyText') }}</p>
        </template>
        <p v-else class="swipe-deck-end-text">{{ t('styleMatch.noItems') }}</p>
        <div class="swipe-deck-end-actions">
          <button v-if="everHadItems" type="button" class="swipe-deck-end-btn primary" @click="onRestart">{{ t('styleMatch.restart') }}</button>
          <button type="button" class="swipe-deck-end-btn" :class="{ primary: !everHadItems }" @click="emit('change-categories')">{{ t('styleMatch.backToSetup') }}</button>
        </div>
      </div>
    </div>
    <div class="swipe-deck-actions" :class="{ 'is-hidden': !visible.length }">
      <button
        type="button"
        class="swipe-deck-btn swipe-deck-btn-skip"
        :aria-label="t('styleMatch.skip')"
        :title="t('styleMatch.skip')"
        :disabled="!visible.length"
        @click="swipeTop('left')"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
      <button
        type="button"
        class="swipe-deck-btn swipe-deck-btn-like"
        :aria-label="t('styleMatch.addToWishlist')"
        :title="t('styleMatch.addToWishlist')"
        :disabled="!visible.length"
        @click="swipeTop('right')"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style>
.swipe-deck {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.swipe-deck-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 340px;
  padding: 0 4px 6px;
  font-family: 'Urbanist', sans-serif;
}

.swipe-deck-category {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: lowercase;
  color: #4b073f;
}

.swipe-deck-count {
  font-size: 12px;
  font-weight: 600;
  color: #46535e;
  background-color: #fff4fe;
  border: 1px solid #e6dbe4;
  border-radius: 50px;
  padding: 1px 8px;
}

.swipe-deck-stack {
  position: relative;
  width: 100%;
  max-width: 340px;
  height: 40vh;
  min-height: 260px;
}

.swipe-deck-end {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  text-align: center;
  background-color: #fff4fe;
  border: 1px dashed #a92296;
  border-radius: 20px;
  font-family: 'Urbanist', sans-serif;
}

.swipe-deck-end-title {
  font-size: 20px;
  font-weight: 600;
  color: #4b073f;
  text-transform: lowercase;
}

.swipe-deck-end-text {
  font-size: 14px;
  color: #46535e;
  margin: 0;
  line-height: 1.5;
}

.swipe-deck-end-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
}

.swipe-deck-end-btn {
  padding: 10px 20px;
  background-color: #fff;
  color: #24282d;
  border: 1px solid #a92296;
  border-radius: 50px;
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-transform: lowercase;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.2s;
}

.swipe-deck-end-btn.primary {
  background-color: #a92296;
  color: #f6f8f9;
  border-color: #a92296;
}

.swipe-deck-end-btn:hover {
  border-color: #4b073f;
}

.swipe-deck-end-btn.primary:hover {
  background-color: #4b073f;
  border-color: #4b073f;
}

.swipe-deck-actions {
  display: flex;
  align-items: center;
  gap: 40px;
  padding-top: 10px;
}

.swipe-deck-actions.is-hidden {
  visibility: hidden;
}

.swipe-deck-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid #ced5da;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(36, 40, 45, 0.08);
  -webkit-tap-highlight-color: transparent;
}

.swipe-deck-btn:active {
  transform: scale(0.92);
}

.swipe-deck-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.swipe-deck-btn-skip {
  color: #46535e;
}

.swipe-deck-btn-skip:hover {
  color: #24282d;
  border-color: #46535e;
}

.swipe-deck-btn-like {
  color: #a92296;
}

.swipe-deck-btn-like:hover {
  color: #4b073f;
  border-color: #a92296;
}
</style>
