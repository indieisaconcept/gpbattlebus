import Table from "cli-table";
import { groupByStatus, len } from "./common.mjs";

export const status = {
  CURRENT: ["🟩", "CURRENT"],
  MISSING: ["🟥", "MISSING"],
  PENDING_INCOMING: ["🟧", "INCOMING"],
  PENDING_OUTGOING: ["🟧", "OUTGOING"],
  POSSIBLE: [null, "TOTAL"],
  SKIPPED: ["🟥", "ERROR"],
};

/**
 * Lookup the tile from the status map. Should none be found returns
 * value verbatim.
  
 * @param {String} value - The key from which to obtain the title.
 * @returns {String}
 */
const getTitle = (value) => {
  const [, title] = status[value] || [];
  return title || value;
};

/**
 * Simple helper for generating a consistent table with sensible
 * defaults.
 *
 * @param {Object} data - Data set to render.
 * @param {Array} extraHeaders - Optional table headers.
 * @returns {String} - A formatted table.
 */
const generateTableSummary = (data, extraHeaders = []) => {
  const head = ["", "USERNAME", "STATUS", ...extraHeaders];
  const rows = Object.values(data).flatMap((row) => row);

  const sortedRows = rows
    .sort(({ id: _idA }, { id: _idB }) => _idA.localeCompare(_idB))
    .map((item) => {
      const { id, status: itemStatus, reason = "" } = item;
      const [icon, statusLabel] = status[itemStatus];
      const row = [icon, id, statusLabel];
      "reason" in item && row.push(reason);
      return row;
    });

  const table = new Table({
    head,
    chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
    rows: sortedRows,
  });

  return table.toString();
};

/**
 * Generates a light summary of current friendships.
 *
 * @param {Object} data - Evidence source
 * @returns {String}
 */
export const lightSummary = (data) =>
  summary(
    ["POSSIBLE", "CURRENT", "PENDING_INCOMING", "PENDING_OUTGOING", "MISSING"],
    data
  );

const summary = (keys, data) =>
  keys.map((key) => `${getTitle(key)} ${len(data[key])}`).join(" | ");

/**
 * Generates a lite execution summary.
 *
 * @param {Object} data - Evidence source
 * @returns {String}
 */
export const lightExecutionSummary = (data) => {
  const context = groupByStatus(data);
  return summary(["PENDING_OUTGOING", "SKIPPED"], context);
};

/**
 * Generates a detailed execution summary based on friend add
 * executions, including any reasons for failure.
 *
 * @param {Object} data - Evidence source
 * @returns {String}
 */
export const detailedExecutionSummary = (data) =>
  generateTableSummary(data, ["REASON"]);

/**
 * Generates a dryrun execution summary based on possible friend
 * executions.
 *
 * @param {Object} data - Evidence source
 * @returns {String}
 */
export const dryrunExecutionSummary = (data) => generateTableSummary(data);

/**
 * Generates an summary of current, pending & possible friend
 * additions.
 *
 * @param {Object} data - Evidence source
 * @returns {String}
 */
export const dryrunSummary = (data) => generateTableSummary(data);
