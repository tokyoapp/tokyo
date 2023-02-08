<script lang="ts" setup>
import "@atrium-ui/mono/components/material-icon/src";
</script>

<template>
  <Story>
    <material-icon icon="home"></material-icon>
  </Story>
</template>

<style></style>

<docs lang="md">
# material-icon

A web-component to quickly implement and use the Google Material Icon Font.

## Properties

_icon_

## Install

```bash
npm i @atrium-ui/material-icon
```

## Publish new version

Create a new version:

```bash
npm version [major | minor | patch]
```

Push tag:

```bash
git push origin [version tag]
```

The CI pipeline will create a new package version at that tag.
</docs>
