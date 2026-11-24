<script setup>
import { ref, computed, onMounted } from "vue";
import GameHeader from "./components/GameHeader.vue";
import ChoiceButton from "./components/ChoiceButton.vue";
import NextQuestionButton from "./components/NextQuestionButton.vue";

const TOTAL_ROUNDS = 8;
const showPool = ref([]);
const apiKey = import.meta.env.VITE_TMDB_API_KEY;
const appName = ref("Who Played Who (Must See TV Edition)");
const gameStarted = ref(false);
const currentRound = ref({
  showName: "Friends",
  actorPhotoUrl: "https://example.com/photo.jpg",
  correctCharacter: "Ross Geller",
  choices: ["Ross Geller", "Chandler Bing", "Joey Tribiani", "Joshua"],
});
const feedbackMessage = ref("");
const score = ref(0);
const hasAnswered = ref(false);
const roundNumber = ref(0);
const isGameOver = computed(() => {
  return roundNumber.value > TOTAL_ROUNDS;
});
function shuffleArray(arr) {
  arr.sort(function (a, b) {
    return Math.random() - 0.5;
  });
}

const restartGame = async () => {
  roundNumber.value = 0;
  score.value = 0;
  await startGame();
};

const startGame = async () => {
  gameStarted.value = true;
  hasAnswered.value = false;
  feedbackMessage.value = "";
  // After round 8, counter gets to 9, isGame over triggers game-over screen
  roundNumber.value =
    roundNumber.value < TOTAL_ROUNDS ? roundNumber.value + 1 : TOTAL_ROUNDS + 1;
  // When game is over, no need to do the rest of the method
  if (roundNumber.value > TOTAL_ROUNDS) return;

  try {
    const allResults = showPool.value;

    // Try up to 10 random shows until one has enough cast data
    for (let attempt = 0; attempt < 10; attempt++) {
      // Pick random show from list of shows
      const randomIndex = Math.floor(Math.random() * allResults.length);
      const selectedShow = allResults[randomIndex];

      // Filter out any cast members who don't have a profile image
      const actorsWithPhotos = selectedShow.cast.filter(
        (actor) => actor.profile_path !== null,
      );
      // Make sure there's at least one photo, and three more characters for the multiple choice
      // skip to the next show (start loop over( if the cast can't fill a round
      if (actorsWithPhotos.length === 0 || selectedShow.cast.length < 4) {
        console.warn(`"${selectedShow.name}" doesn't have enough cast data.`);
        continue;
      }
      // pick random cast member to be correct response
      const correctIndex = Math.floor(Math.random() * actorsWithPhotos.length);
      const correctCharacter = actorsWithPhotos[correctIndex];
      // Filter out the correct actor, shuffle the rest, and pick 3 wrong choices + correct response for UI display
      const otherCharacters = selectedShow.cast.filter(
        (actor) => actor.name !== correctCharacter.name,
      );
      shuffleArray(otherCharacters);
      const choiceOptions = [
        correctCharacter.character,
        otherCharacters[0].character,
        otherCharacters[1].character,
        otherCharacters[2].character,
      ];
      // Shuffle the final array so the correct answer isn't always the first button
      shuffleArray(choiceOptions);
      // Assign values for current round
      currentRound.value.showName = selectedShow.name;
      currentRound.value.actorPhotoUrl = `https://image.tmdb.org/t/p/w500${correctCharacter.profile_path}`;
      currentRound.value.correctCharacter = correctCharacter.character;
      currentRound.value.choices = choiceOptions;
      break; // round built successfully — stop retrying
    }
  } catch (error) {
    // If the internet is down or the URL has a typo, catch the error gracefully
    console.error("Something went wrong fetching data:", error);
  }
};

const selectChoice = (characterName) => {
  if (hasAnswered.value === false) {
    if (characterName === currentRound.value.correctCharacter) {
      feedbackMessage.value = "Correct!";
      score.value += 1;
    } else {
      feedbackMessage.value = `Incorrect. Correct answer was ${currentRound.value.correctCharacter}`;
    }
    hasAnswered.value = true;
  } else {
    feedbackMessage.value =
      "Response already selected. Tap Next Question to continue.";
  }
};

// Load show data when app starts
onMounted(async () => {
  try {
    const response = await fetch("/shows-data.json");
    const data = await response.json();
    showPool.value = data.shows;
  } catch (error) {
    // If the internet is down or the URL has a typo, catch the error gracefully
    console.error("Something went wrong fetching data:", error);
  }
});
</script>

<template>
  <div class="app-shell">
    <GameHeader :title="appName" />

    <button v-if="!gameStarted" class="start-button" @click="startGame">
      Start Game
    </button>
    <main v-if="gameStarted" class="game-board">
      <h3 class="score-display">
        <!-- Round never shows anything above 'Round: 8' -->
        Round: {{ Math.min(roundNumber, TOTAL_ROUNDS) }}, Score: {{ score }}
      </h3>
      <h3 class="score-display" style="color: white; font-size: 1.2rem">
        {{ feedbackMessage }}
      </h3>
      <section v-if="gameStarted && isGameOver" class="score-display">
        <h2>Game Over!</h2>
        <p>You scored {{ score }} out of {{ TOTAL_ROUNDS }}.</p>
        <button @click="restartGame" class="start-button">Play Again</button>
      </section>
      <section v-if="gameStarted && !isGameOver">
        <h2 class="show-title">{{ currentRound.showName }}</h2>
        <div class="round-layout">
          <img
            class="actor-photo"
            :src="currentRound.actorPhotoUrl"
            :alt="`Photo of a character from ${currentRound.showName}`"
          />
          <ul class="choices-list">
            <ChoiceButton
              v-for="choice in currentRound.choices"
              :key="choice"
              :characterName="choice"
              @selectChoice="selectChoice"
            />
            <div class="landscape-orientation">
              <NextQuestionButton @nextQuestion="startGame" />
            </div>
          </ul>
        </div>
        <div class="portrait-orientation">
          <NextQuestionButton @nextQuestion="startGame" />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 2rem 1.5rem;
  background-color: var(--color-primary);
  overflow: hidden;
  position: relative;
}

.app-shell::before,
.app-shell::after {
  content: "";
  position: absolute;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.app-shell::before {
  top: -140px;
  right: -140px;
  width: 440px;
  height: 440px;
  border-radius: 46% 54% 58% 42%;
}

.app-shell::after {
  bottom: -160px;
  left: -160px;
  width: 480px;
  height: 480px;
  border-radius: 55% 45% 42% 58%;
}

.game-board {
  position: relative;
  z-index: 1;
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
}

.score-display {
  color: var(--color-text-accent);
  font-size: 1rem;
  margin: 0 0 0.5rem;
}

.show-title {
  color: var(--color-text-light);
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 2rem;
}

.round-layout {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  justify-content: center;
}

.actor-photo {
  flex: 1 1 400px;
  max-width: 400px;
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
  object-fit: cover;
}

.choices-list {
  flex: 1 1 400px;
  max-width: 420px;
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.start-button {
  display: block;
  margin: 2rem auto;
  padding: 1rem 2.5rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text-dark);
  background: var(--color-button-bg);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.start-button:hover {
  background: var(--color-button-bg-hover);
}

.landscape-orientation,
.portrait-orientation {
  display: none;
}

@media (orientation: portrait) {
  .portrait-orientation {
    display: block;
  }
}

@media (orientation: landscape) {
  .landscape-orientation {
    display: block;
  }
}

@media (max-width: 700px) {
  .round-layout {
    flex-direction: column;
    align-items: center;
  }

  .actor-photo,
  .choices-list {
    max-width: 100%;
  }
}
</style>
