<script setup>
const emit = defineEmits(["nextQuestion"]);
const buttonClick = () => {
  emit("nextQuestion");
};
</script>
<template>
  <button @click="buttonClick">Next Question</button>
</template>

<style scoped>
button {
  /* width: 100%; */
  margin: 1rem;
  padding: 1.1rem 1.5rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text-dark);
  background: var(--color-button-bg);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

button:hover {
  background: var(--color-button-bg-hover);
  transform: translateY(-2px);
}
</style>
