<script setup lang="ts">
// One partner's terms block in the reservation checkout: every relevant terms doc
// (type label, version, scrollable body, pdf link) + a single "I agree" checkbox.
// Purely presentational; acceptance state lives in the checkout composable.
import type { PartnerTermsDoc } from '~/composables/usePartnerCatalog'

const props = defineProps<{
  partnerName: string
  terms: PartnerTermsDoc[]
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()

function typeLabel(type: string): string {
  if (type === 'purchase') return t('partner.checkout.termsTypePurchase')
  if (type === 'rental') return t('partner.checkout.termsTypeRental')
  return t('partner.checkout.termsTypeOther')
}

function onToggle(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).checked)
}
</script>

<template>
  <div class="pp-card pp-terms-gate">
    <div class="pp-terms-gate-partner">{{ props.partnerName }}</div>

    <p v-if="props.terms.length === 0" class="pp-terms-gate-none">
      {{ $t('partner.checkout.termsNone', { name: props.partnerName }) }}
    </p>

    <div v-for="doc in props.terms" :key="doc.hash_id" class="pp-terms-gate-doc">
      <div class="pp-terms-gate-doc-head">
        <span class="pp-terms-gate-doc-type">{{ typeLabel(doc.type) }}</span>
        <span class="pp-terms-gate-doc-version">{{ $t('partner.checkout.termsVersion', { version: doc.version }) }}</span>
      </div>
      <div v-if="doc.body_text" class="pp-terms-gate-body">{{ doc.body_text }}</div>
      <a
        v-if="doc.pdf_url"
        :href="doc.pdf_url"
        target="_blank"
        rel="noopener"
        class="pp-terms-gate-pdf"
      >{{ $t('partner.checkout.pdfLink') }}</a>
    </div>

    <label v-if="props.terms.length > 0" class="pp-terms-gate-agree">
      <input type="checkbox" :checked="props.modelValue" @change="onToggle">
      <span>{{ $t('partner.checkout.termsAgree', { name: props.partnerName }) }}</span>
    </label>
  </div>
</template>

<style>
/* Terms gate — .pp- scope only */
.pp-terms-gate {
  margin-bottom: 14px;
}
.pp-terms-gate-partner {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 10px;
}
.pp-terms-gate-none {
  margin: 0;
  font-size: 14px;
  color: var(--pp-gray);
}
.pp-terms-gate-doc {
  margin-bottom: 14px;
}
.pp-terms-gate-doc-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
}
.pp-terms-gate-doc-type {
  font-size: 14px;
  font-weight: 600;
}
.pp-terms-gate-doc-version {
  font-size: 12px;
  color: var(--pp-gray);
}
.pp-terms-gate-body {
  max-height: 180px;
  overflow-y: auto;
  white-space: pre-wrap;
  background: var(--pp-bg-light);
  border: 1px solid var(--pp-gray-light);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--pp-ink);
}
.pp-terms-gate-pdf {
  display: inline-block;
  margin-top: 6px;
  font-size: 13px;
  color: var(--pp-magenta);
  text-decoration: underline;
}
.pp-terms-gate-agree {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.pp-terms-gate-agree input {
  margin-top: 3px;
  width: 16px;
  height: 16px;
  accent-color: var(--pp-magenta);
  flex-shrink: 0;
  cursor: pointer;
}
</style>
