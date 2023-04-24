import { compareStrings, groupByStatus } from "./common.mjs";

/**
 * Comparison helper to determines if the prospective friend has
 * already been added.
 *
 * @param {Object} prospective - A potential friend to add.
 * @param {Object} existing    - A friend already added.
 * @returns {Boolean}
 */
export const compareFriend = (prospective, existing) => {
  const {
    id: idA,
    friend: { _displayName: displayNameA, externalAuths: authA },
  } = prospective;
  const {
    id: idB,
    friend: { _displayName: displayNameB, externalAuths: authB },
  } = existing;

  const idMatch = compareStrings(idA, idB);
  const displayNameMatch = compareStrings(displayNameA, displayNameB);

  const externalDisplayNameMatch = Object.keys(authA).some((source) => {
    const a = authA[source] || {};
    const b = authB[source] || {};

    return compareStrings(a.externalDisplayName, b.externalDisplayName);
  });

  return externalDisplayNameMatch || displayNameMatch || idMatch;
};

/**
 * Determine if there is already a friendhsip.
 *
 * @param {Object} friend - A prospective friend.
 * @param {Array<Object>} friendCollection - A collection of existing friends.
 * @returns {Object} - Existing friend if they exist.
 */
export const isExistingFriend = (friend, friendCollection) => {
  const result = friendCollection.find((collectionFriend) =>
    compareFriend(friend, collectionFriend)
  );

  return result;
};

/**
 * For each prospective friends determines if a relationship exists.
 *
 * @param {Array<Object>} friendsToAdd - A collection of prospective friends.
 * @param {Array<Object>} searchScope  - A collection of existing friends.
 * @returns {Array<Object>} - An collection of friend with a data property denoting relationship.
 */
export const findFriendsToAdd = (friendsToAdd, searchScope) => {
  const results = [];

  friendsToAdd.forEach((friendToAdd) => {
    const isFriend = isExistingFriend(friendToAdd, searchScope);
    let status = "MISSING";

    if (isFriend) {
      status = isFriend.friend.direction ? "PENDING" : "EXISTING";
    }

    results.push({
      ...friendToAdd,
      status,
    });
  });

  return groupByStatus(results);
};
