// Self-check for the store-timezone formatters.  Run:  npm run check:datetime
//
// It compiles with the repo's own tsc and runs under TZ=UTC to mimic the
// production server — which is exactly the condition that made a day closed at
// 2:05pm IST render as "08:35 am". No test framework; plain asserts.
import assert from "node:assert/strict";
import { fmtDate, fmtDateLong, fmtTime, fmtDateTime } from "./datetime.js";

assert.equal(process.env.TZ, "UTC", "run under TZ=UTC — the check is meaningless in IST");

// The reported bug: 2:05pm IST on 15 Jul 2026 is stored as 08:35 UTC.
const closedAt = "2026-07-15T08:35:00.000Z";
assert.equal(fmtTime(closedAt), "02:05 pm");
assert.equal(fmtDate(closedAt), "15 Jul");

// Late-evening UTC is already the next day in-store: 19:00 UTC on 14 Jul is
// 00:30 IST on 15 Jul. Formatting in UTC would file this sale under the wrong day.
const lateSale = "2026-07-14T19:00:00.000Z";
assert.equal(fmtDate(lateSale), "15 Jul");
assert.equal(fmtTime(lateSale), "12:30 am");

// A business-date string must stay on its own day, not slip backwards.
assert.equal(fmtDate("2026-07-15"), "15 Jul");
assert.equal(fmtDateLong("2026-07-15"), "Wed, 15 Jul, 2026");

assert.match(fmtDateTime(closedAt), /15 Jul.*02:05 pm/);

// Null/garbage degrade to a fallback rather than "Invalid Date".
for (const bad of [null, undefined, "", "not-a-date"]) {
  assert.equal(fmtTime(bad), "—");
  assert.equal(fmtDate(bad), "—");
}
assert.equal(fmtDate(null, "never"), "never");

console.log("datetime: all assertions passed");
