<script setup lang="ts">
interface ClothingItem {
  id: number | string
  sku: string
  name: string
  front_image?: string
  category_name?: string
}

const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const LIMIT = 10

const loading = ref(true)
const items = ref<ClothingItem[]>([])
const wishlist = useWishlistManager()

function isInWishlist(itemId: number | string): boolean {
  return wishlist.isInWishlist(itemId)
}

function wishlistLabel(itemId: number | string): string {
  return isInWishlist(itemId)
    ? (isNL.value ? 'Verwijderen uit verlanglijst' : 'Remove from wishlist')
    : (isNL.value ? 'Toevoegen aan verlanglijst' : 'Add to wishlist')
}

async function fetchItems(): Promise<ClothingItem[]> {
  const apiBase = useRuntimeConfig().public.apiBase
  try {
    // Old loader called /search with no query params and sliced to the limit client-side
    const response = await fetch(`${apiBase}/search`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    const data = await response.json()
    const fetched: ClothingItem[] = data.items || []
    return fetched.slice(0, LIMIT)
  } catch {
    return []
  }
}

function goToProduct(sku: string) {
  navigateTo(`${isNL.value ? '/nl' : ''}/product?sku=${encodeURIComponent(sku)}`)
}

onMounted(async () => {
  wishlist.init()
  items.value = await fetchItems()
  loading.value = false
})
</script>

<template>
  <section class="clothing-section" id="clothing-collection">
    <header class="clothing-header">
      <h2><span class="lang-en">new items added every week</span><span class="lang-nl">elke week nieuwe items</span></h2>
      <p><span class="lang-en">Browse a unique collection of (member) donations and curated pieces</span><span class="lang-nl">Ontdek een unieke collectie van (leden)donaties en geselecteerde stukken</span></p>
      <a href="/clothing"><span class="lang-en">see more</span><span class="lang-nl">alles bekijken</span></a>
    </header>
    <div class="clothing-scroll-container">
      <div class="clothing-grid" id="clothing-grid">
        <div v-if="loading" class="clothing-loading">
          <div class="clothing-loading-spinner"></div>
        </div>
        <div v-else-if="items.length === 0" class="clothing-empty">{{ isNL ? 'Geen items gevonden' : 'No items found' }}</div>
        <template v-else>
          <article
            v-for="item in items"
            :key="item.sku"
            class="clothing-card"
            :data-sku="item.sku"
            @click="goToProduct(item.sku)"
          >
            <div class="clothing-card-image">
              <img v-if="item.front_image" :src="item.front_image" :alt="item.name" loading="lazy">
              <button
                class="wishlist-btn"
                :class="{ active: isInWishlist(item.id) }"
                :data-wishlist-id="Number(item.id)"
                :aria-label="wishlistLabel(item.id)"
                @click.prevent.stop="wishlist.toggle(item.id)"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>
            <div class="clothing-card-info">
              <h3 class="clothing-card-name">{{ item.name }}</h3>
            </div>
          </article>
        </template>
      </div>
    </div>
  </section>
</template>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  :root {
    --pink: #e84dd8;
    --pink-dark: #a92296;
    --blue: #04314d;
    --black: #000000;
    --gray-dark: #24282d;
    --gray-medium: #46535e;
    --gray-light: #f6f8f9;
    --gray-very-light: #f6f8f9;
    --white: #ffffff;
    --radius: 20px;
  }
  body {
    font-family: 'Urbanist', sans-serif;
    background: var(--white);
    color: var(--black);
    line-height: 1.6;
  }
  /* Section container */
  .clothing-section {
    max-width: none;
    margin: 0 auto;
    padding: 60px 2rem;
  }
  /* Section header */
  .clothing-header {
    text-align: center;
    margin-bottom: 32px;
  }
  .clothing-header h2 {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 600;
    margin-bottom: 1.2rem;
    letter-spacing: 1px;
  }
  .clothing-header p {
    font-size: 20px;
    color: var(--gray-medium);
    margin-bottom: 1.5rem;
    letter-spacing: 0.3px;
  }
  .clothing-header a {
    color: var(--gray-dark);
    font-size: 20px;
    font-weight: 600;
    text-decoration: underline;
    transition: color 0.2s ease;
    letter-spacing: 0.3px;
 padding-bottom: 3rem;
  }
  .clothing-header a:hover {
    color: var(--black);
  }
  /* Scrollable container */
  .clothing-scroll-container {
    overflow-x: auto;
    overflow-y: visible;
    margin: 0 -2rem;
    padding: 0 2rem;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .clothing-scroll-container::-webkit-scrollbar {
    display: none;
  }
  /* Items grid */
  .clothing-grid {
    display: flex;
    gap: 16px;
    padding-bottom: 16px;
  }
  /* Individual item card */
  .clothing-card {
    flex: 0 0 auto;
    width: 280px;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    display: block;
  }
  .clothing-card-image {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 4;
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--gray-very-light);
    margin-bottom: 12px;
    padding: 24px;
  }
  .clothing-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: calc(var(--radius) - 8px);
    transition: transform 0.3s ease;
  }
  .clothing-card:hover .clothing-card-image img {
    transform: scale(1.03);
  }
  /* Wishlist button */
  .wishlist-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--white);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    z-index: 5;
  }
  .wishlist-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  .wishlist-btn svg {
    width: 18px;
    height: 18px;
    stroke: var(--gray-medium);
    stroke-width: 1.5;
    fill: none;
    transition: stroke 0.2s ease, fill 0.2s ease;
  }
  .wishlist-btn.active svg {
    stroke: var(--gray-dark);
    fill: var(--gray-dark);
  }
  .wishlist-btn.loading {
    pointer-events: none;
    opacity: 0.6;
  }
  /* Card info */
  .clothing-card-info {
    text-align: center;
    padding: 0 8px;
  }
  .clothing-card-name {
    font-size: 0.9375rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* Loading state */
  .clothing-loading {
    display: flex;
    justify-content: center;
    padding: 60px 0;
    width: 100%;
  }
  .clothing-loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--gray-light);
    border-top-color: var(--pink);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  /* Empty state */
  .clothing-empty {
    text-align: center;
    padding: 60px 0;
    color: var(--gray-medium);
    width: 100%;
  }
  /* Responsive */
  @media (max-width: 600px) {
    .clothing-card {
      width: 200px;
    }
  }
</style>
