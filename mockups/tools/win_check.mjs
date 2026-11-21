// Self-check for judge() in win.js: node mockups/tools/win_check.mjs
import assert from "node:assert/strict";
import { judge } from "../win.js";
const jak = { from: 1750, to: 1780 };
assert.deepEqual(judge(1765, jak), { won: true, off: 0, hint: null });
assert.deepEqual(judge(1700, jak), { won: false, off: 50, hint: "later" });
assert.deepEqual(judge(1806, jak), { won: false, off: 26, hint: "earlier" });
assert.deepEqual(judge(1990, { from: 1965, to: 1965 }), { won: true, off: 25, hint: null });
console.log("ok");
