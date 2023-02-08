<script lang="ts">
import { defineComponent } from "vue";
import "../src/index";

export default defineComponent({
  data() {
    return {
      progress: 0,
    };
  },
});
</script>

<template>
  <Story>
    <sv-animation :loaded="progress" src="example.riv"></sv-animation>
  </Story>
</template>

<style scoped>
sv-animation {
}
</style>
