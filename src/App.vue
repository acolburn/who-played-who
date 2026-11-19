<script setup>
import { ref } from "vue";
import GameHeader from "./components/GameHeader.vue";
import ChoiceButton from "./components/ChoiceButton.vue";
import NextQuestionButton from "./components/NextQuestionButton.vue";

const apiKey = import.meta.env.VITE_TMDB_API_KEY;
const appName = ref("Who Played Who");
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

function shuffleArray(arr) {
  arr.sort(function (a, b) {
    return Math.random() - 0.5;
  });
}

const startGame = async () => {
  gameStarted.value = true;
  hasAnswered.value = false;
  feedbackMessage.value = "";

  try {
    // Send the request to TMDB and wait for the response
    // Max 20 results per page; fetch 3 pages for pool up to 60 shows
    // searchs for comedies from 1970-2991, without talk shows, reality, etc., on CBS, NBC, ABC
    let allResults = [];
    for (let page = 1; page <= 3; page++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/tv?first_air_date.gte=1970-01-01&first_air_date.lte=2001-12-31&with_networks=16|6|2&sort_by=popularity.desc&language=en-US&with_genres=35&without_genres=16|10763|10764|10767&page=" +
          page +
          "&api_key=${apiKey}`,
      );

      // fetch() only throws on network failure, so check the HTTP status ourselves
      if (!response.ok) {
        throw new Error(
          `TMDB discover request failed (status ${response.status})`,
        );
      }

      // Convert the raw response text into usable JSON
      const data = await response.json();
      allResults = allResults.concat(data.results);
    }

    // Try up to 10 random shows until one has enough cast data
    for (let attempt = 0; attempt < 10; attempt++) {
      // Pick random show from list of shows
      const randomIndex = Math.floor(Math.random() * allResults.length);
      const selectedShow = allResults[randomIndex];

      // get cast of selected show
      const data2 = await fetch(
        `https://api.themoviedb.org/3/tv/${selectedShow.id}/credits?api_key=${apiKey}`,
      );
      // If this show's cast request failed, just try another show
      if (!data2.ok) {
        console.warn(
          `Couldn't fetch cast for "${selectedShow.name}" (status ${data2.status}).`,
        );
        continue;
      }

      const selectedShowCast = await data2.json();
      // Filter out any cast members who don't have a profile image
      const actorsWithPhotos = selectedShowCast.cast.filter(
        (actor) => actor.profile_path !== null,
      );
      // Make sure there's at least one photo, and three more characters for the multiple choice
      // skip to the next show (start loop over( if the cast can't fill a round
      if (actorsWithPhotos.length === 0 || selectedShowCast.cast.length < 4) {
        console.warn(`"${selectedShow.name}" doesn't have enough cast data.`);
        continue;
      }
      // pick random cast member to be correct response
      const correctIndex = Math.floor(Math.random() * actorsWithPhotos.length);
      const correctCharacter = actorsWithPhotos[correctIndex];
      // Filter out the correct actor, shuffle the rest, and pick 3 wrong choices + correct response for UI display
      const otherCharacters = selectedShowCast.cast.filter(
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
</script>

<template>
  <div class="app-shell">
    <GameHeader :title="appName" />
    <button v-if="!gameStarted" class="start-button" @click="startGame">
      Start Game
    </button>
    <main v-if="gameStarted" class="game-board">
      <h3 class="score-display">Score: {{ score }}</h3>
      <h3 class="score-display" style="color: white; font-size: 1.2rem">
        {{ feedbackMessage }}
      </h3>
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
        </ul>
      </div>
      <NextQuestionButton @nextQuestion="startGame" />
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
