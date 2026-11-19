<script setup>
import { ref } from "vue";

const title = ref("Who Played Who?");
const description = ref("Match the actor to their role!");

const props = defineProps({ title: String });
</script>

<template>
  <header class="game-header">
    <h1 class="game-title">{{ title }}</h1>
    <p class="game-description">{{ description }}</p>
  </header>
</template>

<style scoped>
.game-header {
  position: relative;
  text-align: center;
  margin-bottom: 2rem;
  font-style: italic;
}

.game-title {
  color: var(--color-text-light);
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.game-description {
  color: var(--color-text-accent);
  font-size: 1.05rem;
  margin: 0.5rem 0 0;
}
</style>
