import Fnbr from "fnbr";
import { readFile, writeFile } from "fs/promises";
import {
  getDisplayName,
  groupByDirection,
  log,
  passwordPrompt,
} from "./common.mjs";
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
 * Search for a user profile.
 *
 * @param {Object} friendToFind - The profile to find.
 * @returns {Promise<Array>} - Promise resolving to an array containing error and result.
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
 * Responsible for processing a friend object using the supplied async handler.
 *
 * @param {Object} params
 * @param {Object} friend  - The friend to process.
 * @param {String} success - The status to set when the execution succeeds.
 * @param {String} error   - The status to set when the execution fails.
 * @param {Function} asyncHandler - Async handler for executing a command.
 * @returns {Promise<Object>}
 */
const processFriend = async (
  { friend, success, error = "SKIPPED" },
  asyncHandler
) => {
  let summaryType = success;
  let reason;

  try {
    await asyncHandler(friend);
  } catch (err) {
    reason = err.name;
    summaryType = error;
  }

  return {
    ...friend,
    status: summaryType,
    reason,
  };
};

/**
 * Responsible for searching for a potential friend.
 *
 * @param {Object} client - Instance of a Fortnite client.
 * @param {Object} friendToFind - The friend to find.
 * @returns {Promise<Array>}
 */
const processFriendToFind = async (client, friendToFind) => {
  const [, [found]] = await findProfile(client, friendToFind);

  if (!found) {
    return {
      ...friendToFind,
      reason: "Profile not found",
      status: "SKIPPED",
    };
  }

  return await processFriend(
    { friend: found, success: "PENDING_OUTGOING" },
    async ({ friend }) => await friend.addFriend()
  );
};

/**
 * Accepts an incoming friend request.
 *
 * @param {Object} pendingFriend - The friend to accept.
 * @returns {Promise<Object>}
 */
const processPendingFriend = async (pendingFriend) => {
  return await processFriend(
    { friend: pendingFriend, success: "CURRENT" },
    async ({ friend }) => await friend.accept()
  );
};

/**
 * Processing all incoming friends requests.
 *
 * @param {Array<Object>} pendingFriends
 * @returns {Promise<Array>}
 */
const acceptFriend = async (pendingFriends) =>
  await Promise.all(pendingFriends.map(processPendingFriend));

/**
 * Processing all prospective friends to add.
 *
 * @param {Array<Object>} pendingFriends
 * @returns {Promise<Array>}
 */
const addFriend = async (client, friendCollection) => {
  const find = processFriendToFind.bind(null, client);
  return await Promise.all(friendCollection.map(find));
};

/**
 * Initialize an interface to interact with the Fortnite/Epic API.
 * During initialisation, creates a file to store credentials based on supplied profile.
 *
 * @param {String} profile     - Name of the Epic User Profile to interact with
 * @param {Boolean} persist    - Persist authentication
 * @param {String} credentials - File path to the location of the credentials file
 * @param {String} authLink    - File path to the location of the credentials file
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
  const pending = groupByDirection(
    createFriendCollection(client.pendingFriends),
    "pending_"
  );

  return {
    id: client.user.id,
    displayName: client.user.displayName,
    friends: {
      current: createFriendCollection(client.friends),
      ...pending,
      add: addFriend.bind(null, client),
      accept: acceptFriend,
    },
    logout: client.logout.bind(client),
  };
};

export default createFortniteClient;
