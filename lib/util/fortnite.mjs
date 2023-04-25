import Fnbr from "fnbr";
import { readFile, writeFile } from "fs/promises";
import { getDisplayName, log, passwordPrompt } from "./common.mjs";
import { compareFriend } from "./friend.mjs";

/**
 * Adds an unique identifier.
 *
 * @param {Object} friend - A friend object.
 * @returns {Object}
 */
const createFriend = (friend) => ({
  id: getDisplayName(friend),
  friend,
});

/**
 * Returns a rationalised representation of a friend collection.
 *
 * @param {Map} source - Collection of friend objects.
 * @returns {Array<Object>} - Friend collection.
 */
const createFriendCollection = (source) => {
  const friends = [];
  for (const [, value] of source) {
    friends.push(createFriend(value));
  }
  return friends;
};

/**
 * Search for a user pofile.
 *
 * @param {Object} friendToFind - The profile to find.
 * @returns {Promise<Array>} Promise resolving to an array containing error and result.
 *
 * Error is null if the operation was successful, otherwise an object describing the error.
 * Result is null if the operation was unsuccessful, otherwise an object representing the found profile.
 */
const findProfile = async (client, friendToFind) => {
  const { id: searchPrefix } = friendToFind;

  if (!searchPrefix) {
    return [new Error("No search prefix specified"), []];
  }

  try {
    const results = await client.searchProfiles(searchPrefix);

    const foundFriend = results.map(createFriend).find((result) => {
      const {
        friend: { mutualFriends },
      } = result;
      return mutualFriends > 0 || compareFriend(friendToFind, result);
    });

    if (!foundFriend) {
      return [null, []];
    }

    return [null, [foundFriend]];
  } catch (err) {
    return [err, []];
  }
};

/**
 * Adds a new friend.
 *
 * @param {Array<Object>} friendCollection - Collection of friends to add.
 * @returns {Promise<Array>} - Resolves to an array containing error and result.
 *
 * Error is null if the operation was successful, otherwise an object describing the error.
 * Result is null if the operation was unsuccessful, otherwise an object representing the added friend.
 */
const addFriend = async (client, friendCollection) => {
  const findFriend = findProfile.bind(null, client);
  const results = [];

  return await friendCollection.reduce(
    async (previousPromise, friendToFind) => {
      const acc = await previousPromise;
      const [, [found]] = await findFriend(friendToFind);

      if (!found) {
        acc.push({
          ...friendToFind,
          reason: "Profile not found",
          status: "SKIPPED",
        });

        return acc;
      }

      let summaryType = "PENDING";
      let reason;

      try {
        await found.friend.addFriend();
      } catch (err) {
        reason = err.name;
        summaryType = "SKIPPED";
      }

      acc.push({
        ...found,
        status: summaryType,
        reason,
      });

      return acc;
    },
    Promise.resolve(results)
  );
};

/**
 * Initialize an interface to interact with the Fortnite/Epic API.
 * During initialisation, creates a file to store credentials based on supplied profile.
 *
 * @param {String} profile     - Name of the Epic User Profile to interact with
 * @param {Boolean} persist    - Persist authentication
 * @param {String} credentials - File path to the location of the credientials file
 * @param {String} authLink    - File path to the location of the credientials file
 * @returns {Promise<Object>}  - Resolves to an Object providing an instance of the Fnbr client.
 */
const createClient = async ({ persist, profile, credentials, authLink }) => {
  const { Client } = Fnbr;
  const auth = {};
  let config;
  let authConfig;

  const shouldPersist = profile && persist;

  if (profile) {
    try {
      config = JSON.parse(await readFile(credentials));
    } catch {
      config = {};
    }

    authConfig = config[profile];

    const showError = !authConfig && !persist;

    if (showError) {
      throw new Error(`No auth profile found for "${profile}"`);
    }
  }

  if (authConfig) {
    auth.deviceAuth = authConfig;
  } else {
    auth.authorizationCode = async () => {
      const info = `Log into your EpicGames account and then visit: ${authLink}`;
      const question =
        'Then please enter the "authorizationCode" found in the returned JSON: ';

      log(info);

      const code = passwordPrompt(question);

      log.newLine();
      return code;
    };
  }

  const client = new Client({ auth });

  if (shouldPersist) {
    client.on("deviceauth:created", (da) =>
      writeFile(
        credentials,
        JSON.stringify(
          {
            ...config,
            [profile]: da,
          },
          null,
          4
        )
      )
    );
  }

  await client.login();

  return client;
};

/**
 * Create a curated client for interacting with the Fortnite/Epic API.
 *
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} - Resolves to an Object providing an API for interacting with a user.
 */
const createFortniteClient = async (config) => {
  const client = await createClient(config);

  return {
    id: client.user.id,
    displayName: client.user.displayName,
    friends: {
      current: createFriendCollection(client.friends),
      pending: createFriendCollection(client.pendingFriends),
      add: addFriend.bind(null, client),
    },
    logout: client.logout.bind(client),
  };
};

export default createFortniteClient;
