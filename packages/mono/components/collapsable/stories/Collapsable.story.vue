<script lang="ts" setup>
import "../src/index.js";

import { logEvent } from "histoire/client";
import { reactive } from "vue";
import { paragraph } from "txtgen";

const toggleOpen = () => {
  state.opened = !state.opened;
};

const state = reactive({
  opened: false,
  p1: paragraph(4),
  p2: paragraph(4),
});
</script>

<template>
  <Story group="primitives">
    <Variant title="text">
      <p>
        {{ state.p1 }}
      </p>

      <sv-collapsable @item-opened-change="logEvent('open change', $event)" :opened="state.opened">
        <p>
          {{ state.p2 }}
        </p>
      </sv-collapsable>

      <div class="foot">
        <button @click="toggleOpen">{{ state.opened ? "show less" : "show more" }}</button>
      </div>

      <template #controls>
        <HstCheckbox title="Opened" v-model.number="state.opened" />
      </template>
    </Variant>
    <Variant title="list">
      <ul>
        <li>Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes</li>
        <li>Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes</li>
        <li>Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes</li>
      </ul>

      <sv-collapsable @item-opened-change="logEvent('open change', $event)" :opened="state.opened">
        <ul>
          <li>Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes</li>
        </ul>
        <ul>
          <li>Cum sociis natoque penatibus et magnis dis parturient montes</li>
        </ul>
      </sv-collapsable>

      <div class="foot">
        <button @click="toggleOpen">{{ state.opened ? "show less" : "show more" }}</button>
      </div>

      <template #controls>
        <HstCheckbox title="Opened" v-model.number="state.opened" />
      </template>
    </Variant>
  </Story>
</template>

<style scoped>
button {
  text-align: center;
  margin: auto;
}
.foot {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

ul {
  margin: 0;
}
</style>

<docs lang="md">
# collapsable

A more basic element of an accordion that only includes the animation and scroll behavios for collapsable content.

## Properties

```typescript
// Opened or closed (read and write)
<sv-collapsable opened: Boolean; />
```
</docs>
