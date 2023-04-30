import GoogleSheetParser from "public-google-sheets-parser";
import { getDisplayName } from "./common.mjs";

/**
 * Retrieve remote usernames from GoogleSheets and reformating into a simplified
 * version of the Epic format.
 *
 * @param {String} id - The google spreadsheet id.
 * @returns {Array<Object>}
 */
const fetchUsernames = async (id) => {
  let [, sheet] = id.split(":");
  sheet = sheet || id;

  const parser = new GoogleSheetParser(sheet);
  const usernames = await parser.parse();

  const collection = usernames.map((item) => {
    const friend = {
      displayName: item["Epic Name"]?.trim(),
      externalAuths: {
        xbl: { externalDisplayName: item.Xbox?.trim() },
        psn: { externalDisplayName: item.PSN?.trim() },
        nintendo: { externalDisplayName: item.Switch?.trim() },
      },
    };

    return {
      friend,
      id: getDisplayName(friend),
    };
  });

  return [null, collection];
};

export default fetchUsernames;
