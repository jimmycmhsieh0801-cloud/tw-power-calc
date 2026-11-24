const assert = require("assert");
const { calculateTaipowerBill, calculateApplianceCost } = require("./app.js");

// 1. 單月非夏月 120 度以內：120 * 1.78 = 213.6 -> 214
const t1 = calculateTaipowerBill(120, "non_summer", 1);
assert.strictEqual(t1.total, 214, `Expected 214, got ${t1.total}`);

// 2. 單月夏月 350 度：120*1.78 (213.6) + 210*2.55 (535.5) + 20*3.80 (76) = 825.1 -> 825
const t2 = calculateTaipowerBill(350, "summer", 1);
assert.strictEqual(t2.total, 825, `Expected 825, got ${t2.total}`);

// 3. 雙月非夏月 450 度：240*1.78 (427.2) + 210*2.26 (474.6) = 901.8 -> 902
const t3 = calculateTaipowerBill(450, "non_summer", 2);
assert.strictEqual(t3.total, 902, `Expected 902, got ${t3.total}`);

// 4. 零度邊界測試
const t4 = calculateTaipowerBill(0, "summer", 2);
assert.strictEqual(t4.total, 0);
assert.strictEqual(t4.avgRate, 0);

// 5. 家電耗電測試：1200W 開 4 小時、100% 運轉、3.5元/度 -> 4.8 度 -> 16.8 元/天
const a1 = calculateApplianceCost(1200, 4, 3.5, 1);
assert(Math.abs(a1.dailyKwh - 4.8) < 1e-6);
assert(Math.abs(a1.dailyCost - 16.8) < 1e-6);

console.log("ALL_CALCULATION_TESTS_PASSED");
