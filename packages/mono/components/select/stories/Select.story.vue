<script lang="ts" setup>
import "../src/index";
</script>

<template>
  <Story group="primitives">
    <sv-select>
      <button>Item 1</button>
      <button>Item 2</button>
      <button>Item 3</button>
      <button>Item 4</button>
    </sv-select>

    <br />
    <br />

    <sv-select multiple>
      <button style="display: block">Item 1</button>
      <button style="display: block">Item 2</button>
      <button style="display: block">Item 3</button>
      <button style="display: block">Item 4</button>
    </sv-select>
  </Story>
</template>

<style scoped>
button {
  border: none;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid grey;
  cursor: pointer;
}
button[selected] {
  background: #8ecaec;
}
button:hover {
  filter: brightness(0.9);
}
button:active {
  transform: scale(0.985);
}
</style>

<docs lang="md">
A functional helper element that sets an selected attribute on one or mutliple children by click.

Useful for accordions, tabs or filter selections for example.
</docs>
