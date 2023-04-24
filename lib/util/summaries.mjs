import Table from "cli-table";
import { groupByStatus, len } from "./common.mjs";

export const status = {
  EXISTING: "🟩",
  PENDING: "🟧",
  MISSING: "🟥",
  SKIPPED: "🟥",
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
      const row = [status[itemStatus], id, itemStatus];
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
export const lightSummary = (data) => {
  const { EXISTING, MISSING, PENDING, POSSIBLE } = data;

  return `TOTAL ${len(POSSIBLE)} | EXISTING ${len(EXISTING)} | PENDING ${len(
    PENDING
  )} | MISSING ${len(MISSING)}`;
};

/**
 * Generates a lite execution summary.
 *
 * @param {Object} data - Evidence source
 * @returns {String}
 */
export const lightExecutionSummary = (data) => {
  const { PENDING, SKIPPED } = groupByStatus(data);
  return `PENDING ${len(PENDING)} | SKIPPED ${len(SKIPPED)}`;
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
 * Generates an summary of current, pending & possible friend
 * additions.
 *
 * @param {Object} data - Evidence source
 * @returns {String}
 */
export const dryrunSummary = (data) => generateTableSummary(data);
