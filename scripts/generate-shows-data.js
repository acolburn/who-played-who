import dotenv from "dotenv";
import fs from "fs"; //for writing to file
dotenv.config();

const apiKey = process.env.VITE_TMDB_API_KEY;
const showNames = [
  "Cheers",
  "The Cosby Show",
  "Family Ties",
  "Night Court",
  "Hill Street Blues",
  "Taxi",
  "Seinfeld",
  "Wings",
  "The Fresh Prince of Bel-Air",
  "Blossom",
  "Mad About You",
  "Frasier",
  "LA Law",
  "Friends",
  "ER",
  "Will & Grace",
  "Caroline in the City",
  "Just Shoot Me!",
  "3rd Rock from the Sun",
  "NewsRadio",
];

async function fetchShowData(showName) {
  try {
    // Step 1: Search for the show to get its ID
    const url = `https://api.themoviedb.org/3/search/tv?query=${showName}&api_key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    // results field is an array, we use first item
    const showID = data.results[0].id;
    // Step 2: Fetch the cast data using that ID
    const showUrl = `https://api.themoviedb.org/3/tv/${showID}/credits?api_key=${apiKey}`;
    const showResponse = await fetch(showUrl);
    const showData = await showResponse.json();
    const showCast = showData.cast;
    // Step 3: Extract only the fields we need
    const cleanedCast = [];
    for (let actor of showCast) {
      cleanedCast.push({
        character: actor.character,
        name: actor.name,
        profile_path: actor.profile_path,
      });
    }
    // Step 4: Return the cleaned data
    // return { id, name, cast };
    const result = {
      id: showID,
      name: showName,
      cast: cleanedCast,
    };
    return result;
  } catch (error) {
    console.error(`Error fetching data for "${showName}":`, error.message);
    return null;
  }
}

async function generateShowsFile() {
  const allShows = [];

  for (let showName of showNames) {
    allShows.push(await fetchShowData(showName));
  }

  const output = {
    shows: allShows,
  };
  // JSON.stringify converts JSON object to string, pretty-printed with 2 space indentation
  fs.writeFileSync("public/shows-data.json", JSON.stringify(output, null, 2));
}

// This is where script calls function
async function main() {
  try {
    await generateShowsFile();
    console.log("Done! Show data saved to public/shows-data.json");
  } catch (err) {
    console.error("Error generating file:", err);
  }
}

main();
