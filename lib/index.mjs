import ora, { oraPromise } from "ora";
import createFortniteClient from "./util/fortnite.mjs";
import fetchUsernames from "./util/google.mjs";
import { findFriendsToAdd } from "./util/friend.mjs";
import { len, log } from "./util/common.mjs";
import {
  dryrunSummary,
  detailedExecutionSummary,
  dryrunExecutionSummary,
  lightExecutionSummary,
  lightSummary,
} from "./util/summaries.mjs";

export default async ({
  clientCode,
  credentials,
  dryrun,
  reference: friendsSource,
  limit,
  mode,
  persistAuth,
  profile,
}) => {
  const config = {
    friendsSource,
    auth: {
      authLink: `https://www.epicgames.com/id/api/redirect?clientId=${clientCode}&responseType=code`,
      credentials,
      persist: persistAuth,
      profile,
    },
    commands: {
      auto: [
        { cmd: "add", source: "MISSING" },
        { cmd: "accept", source: "PENDING_INCOMING" },
      ],
      add: [{ cmd: "add", source: "MISSING" }],
      accept: [{ cmd: "accept", source: "PENDING_INCOMING" }],
    },
  };

  log.newLine();
  log.title();

  log.heading(
    profile
      ? `Authenticating with "${config.auth.profile}" profile `
      : `Authenticating`
  );

  let client;

  try {
    client = await createFortniteClient({ ...config.auth });
    ora(`Successfully authenticated`).succeed();
  } catch (error) {
    ora(error.message).fail();
    log.newLine();
    process.exit(1);
  }

  const possibleFriends = await oraPromise(
    fetchUsernames(config.friendsSource),
    {
      text: "Retrieving battlebus friends list",
    }
  );

  log.newLine();
  log.heading("SUMMARY");

  const totalPossibleFriends = possibleFriends[1].filter(
    ({ friend: { displayName } }) => displayName !== client.displayName
  );

  const findResults = findFriendsToAdd(totalPossibleFriends, [
    ...client.friends.current,
    ...(client.friends.pending_incoming || []),
    ...(client.friends.pending_outgoing || []),
  ]);

  log(
    lightSummary({
      ...findResults,
      POSSIBLE: totalPossibleFriends,
    })
  );

  if (mode === "summary") {
    log(dryrunSummary(findResults));
    log.youGotPlayed();
    return;
  }

  const commands = config.commands[mode];

  if (commands) {
    const process = processFriends.bind(null, client, dryrun, limit);

    await Promise.all(
      commands.map(({ cmd, source }) => process(cmd, findResults[source]))
    );

    await client.logout();
  }

  log.youGotPlayed();
};

/**
 * Execute a specified command against a collection of friends.
 *
 * @param {Object} client  - Instance of the Fortnite client.
 * @param {Boolean} dryrun - Toggle command execution.
 * @param {Number} limit   - Limit how many friends should be processed.
 * @param {String} cmd     - The name of the command to execute.
 * @param {Array} friends  - The collection of friends to process.
 * @returns {Promise<Array>}
 */
const processFriends = async (client, dryrun, limit, cmd, friends = []) => {
  log.newLine();

  const friendPool = limit !== -1 ? friends.slice(0, limit) : friends;
  const heading = `${cmd.toUpperCase()} FRIENDS SUMMARY`;

  const skipExecution = !friendPool.length || dryrun;

  if (skipExecution) {
    log.heading(heading);

    if (!friendPool.length) {
      log(`> No friends to ${cmd}`);
    } else {
      log(`> Will attempt to ${cmd} ${len(friendPool)} friend(s)`);
      log.newLine();
      log(dryrunExecutionSummary(friendPool));
    }

    return;
  }

  const result = await oraPromise(client.friends[cmd](friendPool), {
    text: `Attempting to ${cmd} ${len(
      friendPool
    )} friend(s), please wait .....`,
  });

  log.newLine();
  log.heading(heading);
  log(lightExecutionSummary(result));

  if (result.length) {
    log.newLine();
    log(detailedExecutionSummary(result));
  }
};
