/**
 * 2026 台電住宅表燈非營業用累進電價表（單月基準）
 * 來源：台灣電力公司現行電價表
 */
const TAIPOWER_TIERS = [
  { min: 0, max: 120, summer: 1.78, non_summer: 1.78 },
  { min: 120, max: 330, summer: 2.55, non_summer: 2.26 },
  { min: 330, max: 500, summer: 3.80, non_summer: 3.13 },
  { min: 500, max: 700, summer: 5.14, non_summer: 4.24 },
  { min: 700, max: 1000, summer: 6.44, non_summer: 5.27 },
  { min: 1000, max: Infinity, summer: 8.86, non_summer: 7.03 }
];

/**
 * 計算台電累進電費與各級距明細
 * @param {number} kwh 總用電度數
 * @param {'summer'|'non_summer'} season 計費季節
 * @param {number} cycleMonths 1 (單月) 或 2 (雙月一期)
 */
function calculateTaipowerBill(kwh, season = "non_summer", cycleMonths = 2) {
  const safeKwh = Math.max(0, Number(kwh) || 0);
  const multiplier = cycleMonths === 1 ? 1 : 2;
  let remaining = safeKwh;
  let total = 0;
  const breakdown = [];

  for (const tier of TAIPOWER_TIERS) {
    if (remaining <= 0) break;
    const tierMin = tier.min * multiplier;
    const tierMax = tier.max === Infinity ? Infinity : tier.max * multiplier;
    const span = tierMax === Infinity ? Infinity : tierMax - tierMin;
    const used = Math.min(remaining, span);
    const rate = season === "summer" ? tier.summer : tier.non_summer;
    const subtotal = used * rate;

    total += subtotal;
    remaining -= used;

    const label = tierMax === Infinity
      ? `${tierMin + 1} 度以上`
      : `${tierMin === 0 ? 0 : tierMin + 1} ～ ${tierMax} 度`;

    breakdown.push({
      label,
      used,
      rate,
      subtotal
    });
  }

  return {
    total: Math.round(total),
    avgRate: safeKwh > 0 ? total / safeKwh : 0,
    breakdown
  };
}

/**
 * 計算單一電器耗電量與電費
 */
function calculateApplianceCost(watts, hoursPerDay, unitPrice, dutyCycle = 1) {
  const w = Math.max(0, Number(watts) || 0);
  const h = Math.max(0, Number(hoursPerDay) || 0);
  const p = Math.max(0, Number(unitPrice) || 0);
  const dc = Math.min(1, Math.max(0.1, Number(dutyCycle) || 1));

  const dailyKwh = (w / 1000) * h * dc;
  const dailyCost = dailyKwh * p;
  return {
    dailyKwh,
    dailyCost,
    monthlyCost: dailyCost * 30,
    seasonCost: dailyCost * 90
  };
}

// Browser UI Initialization
if (typeof document !== "undefined") {
  let currentCycle = 2;
  let currentSeason = "non_summer";

  const kwhInput = document.getElementById("kwhInput");
  const landlordRate = document.getElementById("landlordRate");
  const taipowerTotalEl = document.getElementById("taipowerTotal");
  const taipowerAvgEl = document.getElementById("taipowerAvg");
  const landlordTotalEl = document.getElementById("landlordTotal");
  const billDiffEl = document.getElementById("billDiff");
  const breakdownBody = document.querySelector("#breakdownTable tbody");

  const wattsInput = document.getElementById("wattsInput");
  const hoursInput = document.getElementById("hoursInput");
  const unitPriceInput = document.getElementById("unitPriceInput");
  const dutyCycleInput = document.getElementById("dutyCycleInput");

  function renderBill() {
    const kwh = Number(kwhInput.value) || 0;
    const lRate = Number(landlordRate.value) || 0;
    const res = calculateTaipowerBill(kwh, currentSeason, currentCycle);
    const lTotal = Math.round(kwh * lRate);
    const diff = lTotal - res.total;

    taipowerTotalEl.textContent = `NT$ ${res.total.toLocaleString()}`;
    taipowerAvgEl.textContent = `${res.avgRate.toFixed(2)} 元/度`;
    landlordTotalEl.textContent = `NT$ ${lTotal.toLocaleString()}`;

    if (diff > 0) {
      billDiffEl.textContent = `房東多收 NT$ ${diff.toLocaleString()}`;
      billDiffEl.className = "value warn";
    } else if (diff < 0) {
      billDiffEl.textContent = `房東少收 NT$ ${Math.abs(diff).toLocaleString()}`;
      billDiffEl.className = "value good";
    } else {
      billDiffEl.textContent = "NT$ 0";
      billDiffEl.className = "value";
    }

    breakdownBody.innerHTML = res.breakdown
      .map(
        (b) => `
      <tr>
        <td>${b.label}</td>
        <td>${b.used.toLocaleString()} 度</td>
        <td>${b.rate.toFixed(2)} 元</td>
        <td>NT$ ${Math.round(b.subtotal).toLocaleString()}</td>
      </tr>`
      )
      .join("");
  }

  function renderAppliance() {
    const res = calculateApplianceCost(
      wattsInput.value,
      hoursInput.value,
      unitPriceInput.value,
      dutyCycleInput.value
    );
    document.getElementById("appDailyKwh").textContent = `${res.dailyKwh.toFixed(2)} 度`;
    document.getElementById("appDailyCost").textContent = `NT$ ${res.dailyCost.toFixed(1)}`;
    document.getElementById("appMonthlyCost").textContent = `NT$ ${Math.round(res.monthlyCost).toLocaleString()}`;
    document.getElementById("appSeasonCost").textContent = `NT$ ${Math.round(res.seasonCost).toLocaleString()}`;
  }

  function renderGears() {
    const grid = document.getElementById("gearGrid");
    if (!grid || typeof AFFILIATE_GEARS === "undefined") return;
    grid.innerHTML = AFFILIATE_GEARS.map(
      (g) => `
      <div class="gear-card">
        <div>
          <span class="gear-tag">${g.tag}</span>
          <h3>${g.title}</h3>
          <p>${g.desc}</p>
        </div>
        <a class="cta-btn" href="${g.url}" target="_blank" rel="noopener noreferrer nofollow">${g.cta} →</a>
      </div>`
    ).join("");
  }

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.tab;
      document.getElementById("tab-bill").classList.toggle("hidden", target !== "bill");
      document.getElementById("tab-appliance").classList.toggle("hidden", target !== "appliance");
    });
  });

  // Cycle & Season pills
  document.querySelectorAll("#cycleGroup .pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#cycleGroup .pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentCycle = Number(btn.dataset.cycle);
      renderBill();
    });
  });

  document.querySelectorAll("#seasonGroup .pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#seasonGroup .pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentSeason = btn.dataset.season;
      renderBill();
    });
  });

  // Appliance presets
  document.querySelectorAll("#appliancePresets .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      wattsInput.value = chip.dataset.watts;
      hoursInput.value = chip.dataset.hours;
      const w = Number(chip.dataset.watts);
      dutyCycleInput.value = w === 750 ? "0.5" : w === 180 ? "0.7" : "1";
      renderAppliance();
    });
  });

  [kwhInput, landlordRate].forEach((el) => el.addEventListener("input", renderBill));
  [wattsInput, hoursInput, unitPriceInput, dutyCycleInput].forEach((el) =>
    el.addEventListener("input", renderAppliance)
  );

  renderBill();
  renderAppliance();
  renderGears();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { calculateTaipowerBill, calculateApplianceCost };
}
