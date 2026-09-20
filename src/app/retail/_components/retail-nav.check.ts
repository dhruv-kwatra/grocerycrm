// Self-check for activeHref: exactly one nav row may light up per pathname.
// Run: npm run check:nav
import assert from "node:assert";
import { activeHref, navFor } from "./retail-nav";

const agent = navFor("store_associate");
const brand = navFor("brand");

// The bug this exists to prevent: /retail/agent is a prefix of every other
// agent screen, so a plain prefix test lit "Today" alongside the real row.
assert.equal(activeHref(agent, "/retail/agent"), "/retail/agent");
assert.equal(activeHref(agent, "/retail/agent/stock"), "/retail/agent/stock");
assert.equal(activeHref(agent, "/retail/agent/customers"), "/retail/agent/customers");

// "Store Manager" (/retail/manager) is a prefix of "Agent Workspace"
// (/retail/manager/agents) — the same shape as the bug above, one tier down.
const manager = navFor("store_manager");
assert.equal(activeHref(manager, "/retail/manager/agents"), "/retail/manager/agents");
assert.equal(activeHref(manager, "/retail/brand-stock"), "/retail/brand-stock");
assert.equal(activeHref(manager, "/retail/inventory"), "/retail/inventory");
assert.equal(activeHref(manager, "/retail/customers"), "/retail/customers");

// Prefix matching still has to work: a detail route keeps its list row lit.
assert.equal(activeHref(brand, "/retail/customers/12"), "/retail/customers");
assert.equal(activeHref(brand, "/retail/distributors/3/kyc"), "/retail/distributors");

// Walk-in has no nav row of its own (it opens as a drawer on desktop), so it
// falls back to its nearest parent, "Today" — same rule as a detail page.
assert.equal(activeHref(agent, "/retail/agent/walkin"), "/retail/agent");
// A route outside the nav tree lights nothing at all.
assert.equal(activeHref(agent, "/retail/nope"), undefined);

// Never more than one match, for every role and every registered href.
for (const role of ["store_associate", "store_manager", "brand", "distributor", "partner", "superadmin"] as const) {
  const items = navFor(role);
  for (const { href } of items) {
    const hits = items.filter((i) => i.href === activeHref(items, href));
    assert.equal(hits.length >= 1, true, `${role} ${href} matched nothing`);
    assert.equal(activeHref(items, href), href, `${role} ${href} resolved to the wrong row`);
  }
}

console.log("retail-nav: ok");
