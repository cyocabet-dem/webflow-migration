<script setup lang="ts">
// One card in a Style Match deck. Hand-rolled pointer-event drag (works with
// mouse, touch and pen — the app also ships inside Capacitor WebViews):
// pointerdown/move/up + setPointerCapture, follows the finger with a slight
// rotation, LIKE/NOPE overlays fade in with drag distance, and releasing past
// ~35% of the card width commits the swipe (otherwise it springs back).
import type { SwipeItem } from '~/composables/useOutfitSwipe'

const props = defineProps<{
  item: SwipeItem
  /** Only the top card of a deck is draggable. */
  active: boolean
  /** Position under the top card (0 = top) — used for the stacked look. */
  depth: number
  /** Right swipe allowed (logged in). When false a right commit is blocked. */
  allowRight: boolean
  statusLabel: string
}>()

const emit = defineEmits<{
  (e: 'swiped', direction: 'left' | 'right'): void
  (e: 'blocked-right'): void
  (e: 'hide'): void
}>()

const { t } = useI18n()

const rootEl = ref<HTMLElement | null>(null)
const dx = ref(0)
const dy = ref(0)
const dragging = ref(false)
const leaving = ref<'left' | 'right' | null>(null)

let startX = 0
let startY = 0
let leaveTimer: ReturnType<typeof setTimeout> | undefined

const ROTATION_AT_THRESHOLD = 12
const COMMIT_RATIO = 0.35
const LEAVE_MS = 260

function cardWidth(): number {
  return rootEl.value?.offsetWidth || 300
}

function threshold(): number {
  return cardWidth() * COMMIT_RATIO
}

const rotation = computed(() => {
  const raw = (dx.value / (cardWidth() * COMMIT_RATIO)) * ROTATION_AT_THRESHOLD
  return Math.max(-16, Math.min(16, raw))
})

const likeOpacity = computed(() => Math.max(0, Math.min(1, dx.value / threshold())))
const nopeOpacity = computed(() => Math.max(0, Math.min(1, -dx.value / threshold())))

const cardStyle = computed(() => {
  if (leaving.value || dragging.value || dx.value !== 0 || dy.value !== 0) {
    return {
      transform: `translate(${dx.value}px, ${dy.value}px) rotate(${rotation.value}deg)`,
      transition: dragging.value ? 'none' : `transform ${LEAVE_MS}ms ease`,
      zIndex: 10,
    }
  }
  // Resting stacked look for the cards underneath.
  return {
    transform: `translateY(${props.depth * 10}px) scale(${1 - props.depth * 0.04})`,
    transition: 'transform 0.25s ease',
    zIndex: 5 - props.depth,
  }
})

function onPointerDown(e: PointerEvent) {
  if (!props.active || leaving.value) return
  // The hide button handles its own pointer events.
  if ((e.target as HTMLElement).closest('.swipe-card-hide')) return
  dragging.value = true
  startX = e.clientX
  startY = e.clientY
  try {
    rootEl.value?.setPointerCapture(e.pointerId)
  } catch {
    // Capture can fail if the pointer is already gone — dragging still works.
  }
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  dx.value = e.clientX - startX
  dy.value = (e.clientY - startY) * 0.4
}

function springBack() {
  dx.value = 0
  dy.value = 0
}

function onPointerUp() {
  if (!dragging.value) return
  dragging.value = false
  if (dx.value > threshold()) {
    commit('right')
  } else if (dx.value < -threshold()) {
    commit('left')
  } else {
    springBack()
  }
}

function onPointerCancel() {
  // The browser took over (e.g. vertical page scroll via touch-action: pan-y).
  if (!dragging.value) return
  dragging.value = false
  springBack()
}

function commit(direction: 'left' | 'right') {
  if (leaving.value) return
  if (direction === 'right' && !props.allowRight) {
    springBack()
    emit('blocked-right')
    return
  }
  leaving.value = direction
  const off = (cardWidth() + 200) * (direction === 'right' ? 1 : -1)
  dx.value = off
  dy.value = dy.value * 1.5
  leaveTimer = setTimeout(() => emit('swiped', direction), LEAVE_MS)
}

/** Programmatic swipe — used by the skip/heart buttons under the deck. */
function swipe(direction: 'left' | 'right') {
  if (!props.active || leaving.value) return
  commit(direction)
}

defineExpose({ swipe })

onBeforeUnmount(() => clearTimeout(leaveTimer))
</script>

<template>
  <div
    ref="rootEl"
    class="swipe-card"
    :class="{ 'is-active': active, 'is-dragging': dragging, 'is-leaving': !!leaving }"
    :style="cardStyle"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
  >
    <div class="swipe-card-image-wrapper">
      <img
        class="swipe-card-image"
        :src="item.image"
        :alt="item.name"
        draggable="false"
        loading="lazy"
        decoding="async"
      >
      <span v-if="item.status !== 'available'" class="swipe-card-status-badge">{{ statusLabel }}</span>
      <button
        v-if="active"
        type="button"
        class="swipe-card-hide"
        :title="t('styleMatch.hide')"
        :aria-label="t('styleMatch.hide')"
        @pointerdown.stop
        @click.stop="emit('hide')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
        <span class="swipe-card-hide-label">{{ t('styleMatch.hide') }}</span>
      </button>
      <div class="swipe-card-overlay swipe-card-overlay-like" :style="{ opacity: likeOpacity }">{{ t('styleMatch.like') }}</div>
      <div class="swipe-card-overlay swipe-card-overlay-nope" :style="{ opacity: nopeOpacity }">{{ t('styleMatch.nope') }}</div>
    </div>
    <div class="swipe-card-info">
      <div class="swipe-card-title">
        <span v-if="item.brand" class="swipe-card-brand">{{ item.brand }}</span>
        <span class="swipe-card-name">{{ item.name }}</span>
      </div>
      <div v-if="item.size" class="swipe-card-size">{{ t('styleMatch.size') }}: {{ item.size }}</div>
    </div>
  </div>
</template>

<style>
.swipe-card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border: 1px solid #e6dbe4;
  border-radius: 20px;
  overflow: hidden;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: 0 4px 16px rgba(75, 7, 63, 0.08);
  will-change: transform;
}

.swipe-card.is-active {
  cursor: grab;
}

.swipe-card.is-dragging {
  cursor: grabbing;
}

.swipe-card.is-leaving {
  pointer-events: none;
}

.swipe-card-image-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  background-color: #f6f8f9;
}

.swipe-card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 10px;
  box-sizing: border-box;
  pointer-events: none;
}

.swipe-card-status-badge {
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 4px 12px;
  background-color: #46535e;
  color: #f6f8f9;
  font-family: 'Urbanist', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: lowercase;
  border-radius: 50px;
}

/* Small ✕ "don't show me again" — deliberately distinct from the skip button. */
.swipe-card-hide {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  background-color: rgba(255, 255, 255, 0.92);
  color: #46535e;
  border: 1px solid #ced5da;
  border-radius: 50px;
  font-family: 'Urbanist', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
  text-transform: lowercase;
  cursor: pointer;
  transition: all 0.2s;
  touch-action: auto;
}

.swipe-card-hide:hover {
  color: #4b073f;
  border-color: #4b073f;
}

.swipe-card-overlay {
  position: absolute;
  top: 18px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 3px solid;
  font-family: 'Urbanist', sans-serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0;
  pointer-events: none;
}

.swipe-card-overlay-like {
  left: 14px;
  color: #1f9d55;
  border-color: #1f9d55;
  transform: rotate(-12deg);
}

.swipe-card-overlay-nope {
  right: 14px;
  color: #a92296;
  border-color: #a92296;
  transform: rotate(12deg);
}

.swipe-card-info {
  padding: 10px 14px 12px;
  font-family: 'Urbanist', sans-serif;
  color: #24282d;
  background-color: #fff;
}

.swipe-card-title {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.swipe-card-brand {
  font-size: 15px;
  font-weight: 700;
  text-transform: lowercase;
  color: #4b073f;
  white-space: nowrap;
}

.swipe-card-name {
  font-size: 15px;
  font-weight: 500;
  text-transform: lowercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.swipe-card-size {
  font-size: 13px;
  font-weight: 400;
  color: #46535e;
  margin-top: 2px;
}

@media (max-width: 479px) {
  .swipe-card-hide-label {
    display: none;
  }

  .swipe-card-overlay {
    font-size: 18px;
  }
}
</style>
