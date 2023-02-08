<script lang="ts" setup>
import "../src/index.js";

import { logEvent } from "histoire/client";
import { reactive } from "vue";
import { paragraph, sentence } from "txtgen";

const state = reactive({
  exclusive: true,
});
</script>

<template>
  <Story>
    <sv-accordion
      @item-opened-change="logEvent('Item Toggle', $event)"
      :exclusive="state.exclusive"
    >
      <sv-accordion-item v-for="(item, i) of 3" :key="i" :opened="i === 0">
        <div slot="title" class="titlebar">
          <div class="headline">Lorem Ipsum</div>
          <div class="collapse-icon">
            <svg
              class="plus-icon"
              width="16px"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M8.6,20v-8.5H0V8.6h8.6V0h2.9v8.6H20v2.9h-8.6V20H8.6z" />
            </svg>
            <svg
              class="minus-icon"
              width="16px"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M0,11.5V8.6h20v2.9H0z" />
            </svg>
          </div>
        </div>
        <div class="content">{{ paragraph(4) }}</div>
      </sv-accordion-item>
    </sv-accordion>

    <template #controls>
      <HstCheckbox title="Exclusive" v-model.number="state.exclusive" />
    </template>
  </Story>
</template>

<style lang="scss" scoped>
@import "../styles/default.css";
</style>

<docs lang="md">
# sv-accordion

Basic Accordion component.

## Default styles

Basic default styling can be imported from '/styles/default.scss'
</docs>
