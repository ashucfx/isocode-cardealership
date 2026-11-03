const test = require("node:test");
const assert = require("node:assert/strict");
const { priceFor } = require("./server");
test("price engine adds all authoritative components", () => { assert.equal(priceFor("NEW-H-02").onRoad, 1465200); });
test("price engine returns null for missing or expired pricing", () => { assert.equal(priceFor("missing"), null); });
