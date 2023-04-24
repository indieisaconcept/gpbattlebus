import ora, { oraPromise } from "ora";
import createFortniteClient from "./util/fortnite.mjs";
import fetchUsernames from "./util/google.mjs";
import { findFriendsToAdd } from "./util/friend.mjs";
import { len, log } from "./util/common.mjs";
import {
  dryrunSummary,
  detailedExecutionSummary,
  lightExecutionSummary,
  lightSummary,
} from "./util/summaries.mjs";

export default async ({
  profile,
  credentials,
  dryrun,
  limit,
  googleSheetId,
  clientCode,
}) => {
  const config = {
    googleSheetId,
    auth: {
      profile,
      credentials,
      authLink: `https://www.epicgames.com/id/api/redirect?clientId=${clientCode}&responseType=code`,
    },
  };

  log.newLine();
  log.title();

  log.heading(`Authenticating using "${config.auth.profile}" profile`);

  let client;

  try {
    client = await createFortniteClient({ ...config.auth });
    ora(`Successfully authenticated`).succeed();
  } catch (error) {
    log.newLine();
    ora(error.message).fail();
    log.newLine();
    process.exit(1);
  }

  const possibleFriends = await oraPromise(
    fetchUsernames(config.googleSheetId),
    {
      text: "Retrieving battlebus friends list",
    }
  );

  log.newLine();
  log.heading("SUMMARY");

  const totalPossibleFriends = possibleFriends[1].filter(
    ({ friend: { _displayName } }) => _displayName !== client.displayName
  );

  const findResults = findFriendsToAdd(totalPossibleFriends, [
    ...client.friends.current,
    ...client.friends.pending,
  ]);

  log(
    lightSummary({
      ...findResults,
      POSSIBLE: totalPossibleFriends,
    })
  );

  log.newLine();

  dryrun && log(dryrunSummary(findResults));

  if (!dryrun) {
    const missingFriends = findResults.MISSING || [];
    const notFoundFriends =
      limit !== -1 ? missingFriends.slice(0, limit) : missingFriends;

    const result = await oraPromise(client.friends.add(notFoundFriends), {
      text: `Attempting to add ${len(
        notFoundFriends
      )} friends, please wait .....`,
    });

    log.newLine();
    log.heading("SUMMARY");
    log(lightExecutionSummary(result));

    if (notFoundFriends.length) {
      log.newLine();
      log(detailedExecutionSummary(result));
    }
  }

  await client.logout();

  log.youGotPlayed("");
};
