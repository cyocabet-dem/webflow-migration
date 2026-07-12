<script setup lang="ts">
// <PartnerBadge> — tiny "partner" pill (shared .pp-badge style from 9-partner.css).
// Absolute-positioned by default for catalog cards; PDP-style contexts can reset
// the positioning on the class from their own page styles.
defineProps<{ label?: string }>()
</script>

<template>
  <span class="pp-badge"><slot>{{ label || $t('partner.badge') }}</slot></span>
</template>
