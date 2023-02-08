<script lang="ts" setup>
import "@atrium-ui/mono/components/tabs";

import { paragraph } from "txtgen";
</script>

<template>
  <Story>
    <sv-tabs>
      <div tab="Tab1">{{ paragraph(4) }}</div>
      <div tab="Tab2">{{ paragraph(4) }}</div>
      <div tab="Tab3">{{ paragraph(4) }}</div>
      <div tab="Tab4">{{ paragraph(4) }}</div>
    </sv-tabs>
  </Story>
</template>

<style scoped>
sv-tabs {
  font-family: sans-serif;
}
</style>

<docs lang="md">
# [WIP] sv-tabs

A component that combines the child-selector with some more custom markup to a Tabs component.

## Install

```bash
npm i @atrium-ui/tabs
```
</docs>
