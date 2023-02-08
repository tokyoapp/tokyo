<script lang="ts" setup>
import "@sv-components/mono/components/dropdown";
import "../styles/default.scss";

import { logEvent } from "histoire/client";
import { reactive } from "vue";

const state = reactive({
  value: "",
});

const handleSelect = (e) => {
  state.value = e.option.innerText;
  logEvent("Select Option", e);
};

const exampleOptions = [
  "Option 1",
  "Option 2",
  "Option 3",
  "Some Option",
  "Another Option",
  "Another Option 2",
  "Another Option 3",
  "Option 6",
  "Item 7",
  "Item 8",
];
</script>

<template>
  <Story title="Dropdown" :layout="{ type: 'single', iframe: true }">
    <Variant title="Default">
      <sv-dropdown @select="handleSelect" @open="logEvent('Open', e)" @close="logEvent('Close', e)">
        <button slot="input">{{ state.value || "Select" }}</button>

        <sv-option>Option 1</sv-option>
        <sv-option>Option 2</sv-option>
        <sv-option>Option 3</sv-option>
        <sv-option>Option 4</sv-option>
        <sv-option>Option 5</sv-option>
        <sv-option>Option 6</sv-option>
        <sv-option>Option 7</sv-option>
        <sv-option>Option 8</sv-option>
        <sv-option>Option 9</sv-option>
        <sv-option>Option 10</sv-option>
      </sv-dropdown>
    </Variant>

    <Variant title="Flyup">
      <sv-dropdown
        @select="handleSelect"
        @open="logEvent('Open', e)"
        @close="logEvent('Close', e)"
        direction="up"
        style="margin-top: 300px"
      >
        <button slot="input">{{ state.value || "Select" }}</button>

        <sv-option>Option 1</sv-option>
        <sv-option>Option 2</sv-option>
        <sv-option>Option 3</sv-option>
        <sv-option>Option 4</sv-option>
        <sv-option>Option 5</sv-option>
        <sv-option>Option 6</sv-option>
        <sv-option>Option 7</sv-option>
        <sv-option>Option 8</sv-option>
      </sv-dropdown>
    </Variant>

    <Variant title="Text Filter">
      <sv-dropdown @select="handleSelect" @open="logEvent('Open', e)" @close="logEvent('Close', e)">
        <input slot="input" v-model="state.value" @input="handleFilter" placeholder="Text" />

        <sv-option
          v-for="option of exampleOptions.filter((opt) =>
            state.value
              ? opt.toLocaleLowerCase().indexOf(state.value.toLocaleLowerCase()) !== -1
              : true
          )"
          :key="option"
          :value="option"
          >{{ option }}</sv-option
        >
      </sv-dropdown>
    </Variant>

    <!-- // Vareints of dropdowns  -->
  </Story>
</template>

<docs lang="md">
Universal dropdown component

## Properties

```tsx
// If the dropdown should open upwards or downwards
<sv-dropdown direction: 'down' | 'up'; />
```

```tsx
// The value or index of the selected option
// If the option does not have a 'value' attribute, indexes will be used.
<sv-dropdown selected: String; />
```

```tsx
// Open state of the dropdown
<sv-dropdown opened: Boolean; />
```

```tsx
// Prevents the dropdown from opening
<sv-dropdown disabled: Boolean; />
```

## Events

```tsx
// Emitted after the dropdown closed
<sv-dropdown @close />
```

```tsx
// Emitted *before* the dropdown opens
<sv-dropdown @open />
```

```tsx
// Emitted after a option has been slected by Click or Enter key
<sv-dropdown @select: ({ option: OptionElement; }) => void />
```
</docs>
