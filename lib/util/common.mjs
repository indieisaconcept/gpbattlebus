import group from "array.prototype.group";
import Prompt from "prompt-sync";

const prompt = Prompt();

/**
 * Converts an Array into an Object grouped by obj.status
 *
 * @param {Array<Object>} results - A collection of friend objects.
 * @returns {Object} - An object with key value pairs based on a friends status.
 */
export const groupByStatus = (results) =>
  group(results, ({ status }) => status);

/**
 * Converts an Array into an Object grouped by obj.friend.direction
 *
 * @param {Array<Object>} results - A collection of friend objects.
 * @returns {Object} - An object with key value pairs based on a friends status.
 */
export const groupByDirection = (results, prefix = "") =>
  group(results, ({ friend }) => `${prefix}${friend.direction.toLowerCase()}`);

/**
 * Returns an arrays length.
 *
 * @param {Array} arr - The array to use.
 * @returns {Number}  - The size of the array.
 */
export const len = (arr = []) => arr.length;

/**
 * Get the display name of a friend to be added based on their external auths and
 * Epic Games display name.
 *
 * @param {Object} friendToAdd - The friend object to retrieve the display name from.
 * @returns {string} The display name of the friend.
 */
export const getDisplayName = (friendToAdd) => {
  const { displayName, externalAuths } = friendToAdd;
  const name = displayName || getExternalAuthDisplayName(externalAuths);

  return name?.trim() ?? undefined;
};

/**
 * Obtain the external display name from external auth sources.
 *
 * @param {Object} externalAuths Map of external authentication sources
 * @returns {String|undefined}
 */
export const getExternalAuthDisplayName = (externalAuths) => {
  const sources = ["psn", "xbl", "nintendo", "steam", "github", "twitch"];
  const result = sources.find(
    (source) => externalAuths?.[source]?.externalDisplayName
  );

  return externalAuths[result]?.externalDisplayName;
};

/**
 * Provides a masked prompt.
 *
 * @param {String} str - The question to ask.
 * @returns {String}   - The received input.
 */
export const passwordPrompt = (str) => prompt(str, { echo: "*" });

const defaultTitle = "GP.BATTLE.BUS";

/**
 * console.log wrapper,
 *
 * @param {*} input - The value to log to the console.
 * @returns
 */
export const log = (input) => console.log(input);

/**
 * Prints a stylised title,
 *
 * @param {String} title
 * @returns
 */
log.title = (title = defaultTitle) => log(`🪂 ${title} 🪂\n`);

/**
 * Prints a stylised heading.
 *
 * @param {String} heading
 * @returns
 */
log.heading = (heading) => log(`🪧  ${heading}\n`);

/**
 * Prints a new line.
 *
 * @returns
 */
log.newLine = () => log("");

log.youGotPlayed = () => log("\nHey ... you just got played 🪣\n");

/**
 * Determine if the supplied values are equal;
 * @param {String} str1
 * @param {String} str2
 * @returns {Boolean}
 */
export const compareStrings = (str1, str2) =>
  str1 && str2 ? str1.toLowerCase() === str2.toLowerCase() : false;
