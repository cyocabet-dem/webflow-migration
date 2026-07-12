<script setup lang="ts">
// Shared photo uploader (partner item form, partner storefront, admin final photos).
// Purely presentational: emits upload/delete; the owning page wires the API calls
// (endpoints differ per surface). No file leaves this component except via the emit.
const props = withDefaults(
  defineProps<{
    photos: Array<{ hash_id: string; url: string; kind?: string | null }>
    canEdit?: boolean
    // when set, a kind <select> is shown and passed along with uploads (admin: front/back/detail)
    kinds?: string[] | null
    busy?: boolean
  }>(),
  { canEdit: true, kinds: null, busy: false },
)

const emit = defineEmits<{
  (e: 'upload', files: File[], kind: string | null): void
  (e: 'delete', hashId: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedKind = ref<string>('')
const localError = ref('')

const MAX_BYTES = 8 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

function pick() {
  if (props.busy) return
  fileInput.value?.click()
}

function onFiles(e: Event) {
  localError.value = ''
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  if (!files.length) return
  const bad = files.find((f) => !ACCEPTED.includes(f.type) || f.size > MAX_BYTES)
  if (bad) {
    localError.value = bad.size > MAX_BYTES ? 'too_large' : 'bad_type'
    return
  }
  emit('upload', files, props.kinds ? selectedKind.value || props.kinds[0] : null)
}
</script>

<template>
  <div class="pp-photos">
    <div class="pp-photos-grid">
      <div v-for="p in photos" :key="p.hash_id" class="pp-photos-cell">
        <img :src="p.url" :alt="p.kind || 'photo'" loading="lazy" decoding="async" />
        <span v-if="p.kind" class="pp-photos-kind">{{ p.kind }}</span>
        <button
          v-if="canEdit"
          class="pp-photos-delete"
          type="button"
          :disabled="busy"
          :aria-label="$t('partner.photos.delete')"
          @click="emit('delete', p.hash_id)"
        >&times;</button>
      </div>

      <button v-if="canEdit" class="pp-photos-add" type="button" :disabled="busy" @click="pick()">
        <span v-if="busy" class="pp-spinner pp-photos-spinner"></span>
        <template v-else>+<br /><small>{{ $t('partner.photos.add') }}</small></template>
      </button>
    </div>

    <div v-if="canEdit && kinds" class="pp-field pp-photos-kind-picker">
      <label class="pp-label">{{ $t('partner.photos.kindLabel') }}</label>
      <select v-model="selectedKind" class="pp-select">
        <option v-for="k in kinds" :key="k" :value="k">{{ k }}</option>
      </select>
    </div>

    <p v-if="localError === 'too_large'" class="pp-msg-error">{{ $t('partner.photos.tooLarge') }}</p>
    <p v-else-if="localError === 'bad_type'" class="pp-msg-error">{{ $t('partner.photos.badType') }}</p>

    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/jpeg,image/png,image/webp"
      style="display: none"
      @change="onFiles"
    />
  </div>
</template>

<style>
.pp-photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 10px;
}
.pp-photos-cell {
  position: relative;
  aspect-ratio: 3 / 4;
  border-radius: 8px;
  overflow: hidden;
  background: var(--pp-bg-light);
}
.pp-photos-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pp-photos-kind {
  position: absolute;
  left: 4px;
  bottom: 4px;
  padding: 1px 7px;
  border-radius: 50px;
  background: rgba(36, 40, 45, 0.75);
  color: #fff;
  font-size: 10px;
  font-family: 'Urbanist', sans-serif;
}
.pp-photos-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(36, 40, 45, 0.75);
  color: #fff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
.pp-photos-add {
  aspect-ratio: 3 / 4;
  border: 2px dashed var(--pp-gray-light);
  border-radius: 8px;
  background: none;
  color: var(--pp-gray);
  font-size: 22px;
  font-family: 'Urbanist', sans-serif;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.pp-photos-add:hover:not(:disabled) {
  border-color: var(--pp-magenta);
  color: var(--pp-magenta);
}
.pp-photos-spinner {
  width: 22px;
  height: 22px;
  margin: 0;
}
.pp-photos-kind-picker {
  max-width: 200px;
  margin-top: 10px;
}
</style>
