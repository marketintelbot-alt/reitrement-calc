const form = document.getElementById("calcForm");
const calcButton = document.getElementById("calcButton");
const copyButton = document.getElementById("copyButton");
const engineStatus = document.getElementById("engineStatus");
const errorBox = document.getElementById("errorBox");

const resultsEl = document.getElementById("results");
const balanceOut = document.getElementById("balanceOut");
const incomeNominalOut = document.getElementById("incomeNominalOut");
const incomeTodayOut = document.getElementById("incomeTodayOut");
const trackOut = document.getElementById("trackOut");

let pyodide;
let calculateFn;
let ready = false;
let copyText = "";

const usd = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

function setError(message = "") {
  errorBox.textContent = message;
}

function num(id) {
  return Number(document.getElementById(id).value);
}

function validate(i) {
  if (i.current_age < 18 || i.current_age > 90) return "Current age must be between 18 and 90.";
  if (i.retirement_age <= i.current_age || i.retirement_age > 100) return "Retirement age must be greater than current age and <= 100.";
  if (i.current_savings < 0 || i.monthly_contribution < 0) return "Savings and contribution cannot be negative.";
  if (i.expected_return_percent < 0 || i.expected_return_percent > 20) return "Expected return should be between 0 and 20%.";
  if (i.inflation_percent < 0 || i.inflation_percent > 15) return "Inflation should be between 0 and 15%.";
  if (i.withdrawal_rate_percent < 1 || i.withdrawal_rate_percent > 10) return "Withdrawal rate should be between 1 and 10%.";
  if (i.target_monthly_income < 0) return "Target monthly income cannot be negative.";
  return "";
}

async function init() {
  try {
    pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/" });
    const code = await fetch("model.py").then((r) => r.text());
    await pyodide.runPythonAsync(code);
    calculateFn = pyodide.globals.get("calculate");
    ready = true;
    calcButton.disabled = false;
    engineStatus.innerHTML = "<span>Python engine loaded.</span>";
  } catch (err) {
    setError(`Initialization failed: ${err.message}`);
    engineStatus.textContent = "Engine failed to load.";
  }
}

function render(result) {
  balanceOut.textContent = `Projected balance at retirement: ${usd(result.projected_balance_at_retirement)}`;
  incomeNominalOut.textContent = `Estimated monthly income (nominal): ${usd(result.estimated_monthly_income_nominal)}`;
  incomeTodayOut.textContent = `Estimated monthly income (today's dollars): ${usd(result.estimated_monthly_income_todays_dollars)}`;

  trackOut.textContent = `Track indicator: ${result.track_indicator}`;
  trackOut.classList.toggle("ok", result.track_indicator.toLowerCase().includes("on track"));
  trackOut.classList.toggle("warn", !result.track_indicator.toLowerCase().includes("on track"));

  copyText = [
    "Retirement Calculator",
    balanceOut.textContent,
    incomeNominalOut.textContent,
    incomeTodayOut.textContent,
    trackOut.textContent,
    "Estimates only. Not financial advice."
  ].join("\n");

  resultsEl.hidden = false;
  copyButton.disabled = false;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setError("");

  if (!ready) {
    setError("Engine still loading.");
    return;
  }

  const inputs = {
    current_age: num("current_age"),
    retirement_age: num("retirement_age"),
    current_savings: num("current_savings"),
    monthly_contribution: num("monthly_contribution"),
    expected_return_percent: num("expected_return_percent"),
    inflation_percent: num("inflation_percent"),
    withdrawal_rate_percent: num("withdrawal_rate_percent"),
    target_monthly_income: num("target_monthly_income")
  };

  const err = validate(inputs);
  if (err) {
    setError(err);
    return;
  }

  let pyIn;
  let pyOut;
  try {
    pyIn = pyodide.toPy(inputs);
    pyOut = calculateFn(pyIn);
    const result = pyOut.toJs({ dict_converter: Object.fromEntries });
    render(result);
  } catch (error) {
    setError(`Calculation failed: ${error.message}`);
  } finally {
    if (pyIn) pyIn.destroy();
    if (pyOut) pyOut.destroy();
  }
});

copyButton.addEventListener("click", async () => {
  if (!copyText) return;
  try {
    await navigator.clipboard.writeText(copyText);
    copyButton.textContent = "Copied";
    setTimeout(() => {
      copyButton.textContent = "Copy Results";
    }, 1000);
  } catch {
    setError("Clipboard not available.");
  }
});

init();
