// Run with: node lib/ratelimit.check.ts
import assert from "node:assert/strict";
import { limited } from "./ratelimit.ts";

const t = 1_000_000;
for (let i = 0; i < 3; i++) assert.equal(limited("a", 3, 60_000, t), 0); // first 3 allowed
assert.equal(limited("a", 3, 60_000, t), 60); // 4th blocked, retry in the full window
assert.equal(limited("b", 3, 60_000, t), 0); // other IPs are unaffected
assert.equal(limited("a", 3, 60_000, t + 60_000), 0); // window over, allowed again
console.log("ratelimit ok");
