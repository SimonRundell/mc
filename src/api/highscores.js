import axios from 'axios';

/**
 * @param {string} apiBaseUrl
 * @returns {Promise<object[]>}
 */
export async function fetchHighScores(apiBaseUrl) {
  const res = await axios.get(`${apiBaseUrl}/highscores.php`);
  return res.data.scores;
}

/**
 * @param {string} apiBaseUrl
 * @param {{name:string, score:number, ruleName:string, turns:number}} entry
 * @returns {Promise<object[]>}
 */
export async function submitHighScore(apiBaseUrl, entry) {
  const res = await axios.post(`${apiBaseUrl}/highscores.php`, entry);
  return res.data.scores;
}
