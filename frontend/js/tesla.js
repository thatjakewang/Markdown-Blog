/* Data loaders for the Tesla cost dashboard (templates/tesla.html).
   Uses the shared builders in dashboard.js; loaded with defer after the custom
   Chart.js bundle and dashboard.js. The API is served from this same
   origin, so every URL below is root-relative.

   The whole page comes from ONE request: /api/tesla/dashboard returns what the
   ten per-widget endpoints (/stats, /expenses, /charging/providers, …) return,
   under keys named after them, so page load costs one HTTP round trip, one DB
   session, and one cacheable response instead of ten of each. Each widget is
   still drawn by its own function, wrapped in renderWidget so one bad payload
   can't blank the rest of the page. Those endpoints all still exist for
   anything that wants a single slice. */

const API_BASE = "";

const formatDate = value => value || "No records";
const formatMetric = (value, suffix = "") =>
    value == null ? "Not enough data" : `${value.toLocaleString()}${suffix}`;
const formatMoney = value => value == null ? "Not enough data" : `NT$ ${value}`;

/* =========================================
   Widgets — each takes its slice of the payload
   ========================================= */

// KPI cards
const STAT_KPI_IDS = [
    "total-cost", "odometer-km", "cost-per-km",
    "charging-cost-per-km", "non-charging-cost-per-km",
    "charging-cost", "non-charging-cost", "avg-price"
];

function renderStats(data) {
    setText("total-cost", `NT$ ${data.total_cost.toLocaleString()}`);
    setText("odometer-km", `${data.odometer_km.toLocaleString()} km`);
    setText("cost-per-km", `NT$ ${data.cost_per_km}`);
    setText("charging-cost-per-km", `NT$ ${data.charging_cost_per_km}`);
    setText("non-charging-cost-per-km", `NT$ ${data.non_charging_cost_per_km}`);
    setText("charging-cost", `NT$ ${data.charging_cost.toLocaleString()}`);
    setText("non-charging-cost", `NT$ ${data.non_charging_cost.toLocaleString()}`);
    setText("avg-price", `NT$ ${data.avg_price_per_kwh}`);
}

// Collection windows make null efficiency values understandable at a glance.
function renderDataCoverage(data) {
    setText("data-updated", `Data last updated ${formatDate(data.last_updated)}`);
    setText("coverage-charging", `Since ${formatDate(data.charging_start_date)}`);
    setText("coverage-expenses", `Since ${formatDate(data.expenses_start_date)}`);
    setText("coverage-odometer", `Since ${formatDate(data.odometer_start_date)}`);
}

function showCoverageError() {
    setText("data-updated", "Latest update unavailable");
    ["coverage-charging", "coverage-expenses", "coverage-odometer"]
        .forEach(id => setText(id, "Unavailable"));
}

// This-month and rolling-90-day KPIs share one payload and switch instantly.
const PERIOD_KPI_IDS = [
    "period-total-cost", "period-km", "period-energy-cost-km",
    "period-total-cost-km", "period-efficiency", "period-change"
];

function renderPeriodSummary(periods) {
    const renderPeriod = key => {
        const data = periods[key];
        setText("period-range", `${data.start_date} to ${data.end_date}${data.is_partial ? " · partial period" : ""}`);
        setText("period-total-cost", `NT$ ${data.total_cost.toLocaleString()}`);
        setText("period-km", formatMetric(data.km_driven, " km"));
        setText("period-energy-cost-km", formatMoney(data.energy_cost_per_km));
        setText("period-total-cost-km", formatMoney(data.total_cost_per_km));
        setText("period-efficiency", formatMetric(data.kwh_per_100km, " kWh"));
        const change = key === "current_month" ? data.cost_per_km_change_pct : null;
        setText("period-change", change == null ? "Not comparable" : `${change > 0 ? "+" : ""}${change}%`);
    };

    renderPeriod("current_month");
    document.querySelectorAll(".period-tab").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".period-tab").forEach(tab => tab.classList.remove("is-active"));
            button.classList.add("is-active");
            renderPeriod(button.dataset.period);
        });
    });
}

// Spending by category (all-time)
function renderExpenseBreakdown(data) {
    renderHorizontalBarChart("costBreakdownChart", data, {
        labelKey: "item",
        valueKey: "total_amount",
        colorMap: EXPENSE_ITEM_COLORS
    });
}

// Charging by provider
function renderProviders(data) {
    const labels = data.map(row => row.provider);

    renderBarLineChart("providerChart", {
        labels: labels,
        bar: {
            label: "Total Spent (NTD)",
            data: data.map(row => row.total_amount),
            colors: mapColors(labels, PROVIDER_COLORS),
            // White value labels inside the bars (hidden for tiny bars)
            datalabels: {
                anchor: "center",
                align: "center",
                color: "#fff",
                font: { weight: "bold", size: 11, family: FONT_FAMILY },
                formatter: value => (value / 1000).toFixed(1) + "k",
                display: ctx => ctx.dataset.data[ctx.dataIndex] > 1500
            }
        },
        line: {
            label: "Avg Cost (NTD/kWh)",
            data: data.map(row => row.avg_price_per_kwh),
            pointRadius: 5,
            // Red price labels above each point
            datalabels: {
                anchor: "end",
                align: "top",
                offset: 4,
                color: "#e31937",
                font: { weight: "bold", size: 11, family: FONT_FAMILY },
                formatter: value => "$" + value.toFixed(1)
            }
        },
        yTitle: "Total Spent (NTD)",
        y1Title: "NTD / kWh",
        paddingTop: 24,
        yTicksInThousands: true,
        moneyTooltip: true
    });

    buildTable(
        "provider-details",
        [
            { label: "Provider", cls: "" },
            { label: "Effective", cls: "col-amount" },
            { label: "Paid only", cls: "col-amount" },
            { label: "Free energy", cls: "col-amount" },
        ],
        data,
        row => [
            { value: row.provider, cls: "" },
            { value: `NT$ ${row.avg_price_per_kwh}/kWh`, cls: "col-amount" },
            { value: row.paid_avg_price_per_kwh == null
                ? "No paid sessions"
                : `NT$ ${row.paid_avg_price_per_kwh}/kWh`, cls: "col-amount" },
            { value: `${row.free_kwh.toLocaleString()} kWh (${row.free_sessions})`, cls: "col-amount" },
        ]
    );
}

// Per-session charging data feeds both the scatter chart (kWh x cost, colored
// by provider) and the distribution histogram below.
function renderChargingSessions(sessions) {
    renderScatterChart("chargingScatterChart", sessions, {
        xKey: "kwh",
        yKey: "amount",
        groupKey: "provider",
        colorMap: PROVIDER_COLORS,
        xTitle: "kWh",
        yTitle: "Cost (NTD)",
        formatX: v => `${v} kWh`,
        formatY: v => `NT$ ${v.toLocaleString()}`
    });

    // Histogram with switchable metric (shows skew); the dropdown re-bins
    // the already-fetched sessions in place, no extra request.
    const metrics = {
        amount: {
            values: sessions.map(s => s.amount),
            color: "#3b82f6",
            xTitle: "Cost per session (NTD)",
            formatBin: (lo, hi) => `${Math.round(lo)}–${Math.round(hi)}`
        },
        kwh: {
            values: sessions.map(s => s.kwh),
            color: "#10b981",
            xTitle: "Energy per session (kWh)",
            formatBin: (lo, hi) => `${lo.toFixed(0)}–${hi.toFixed(0)}`
        },
        price: {
            // Skip sessions with zero kWh to avoid divide-by-zero / Infinity bins
            values: sessions.filter(s => s.kwh > 0).map(s => s.amount / s.kwh),
            color: "#f59e0b",
            xTitle: "Price (NTD/kWh)",
            formatBin: (lo, hi) => `${lo.toFixed(1)}–${hi.toFixed(1)}`
        }
    };

    const draw = key => {
        const m = metrics[key];
        renderHistogram("chargingHistogram", m.values, {
            binCount: 12,
            color: m.color,
            xTitle: m.xTitle,
            yTitle: "Sessions",
            formatBin: m.formatBin
        });
    };

    draw("amount");
    document.getElementById("histogramMetric")
        .addEventListener("change", e => draw(e.target.value));
}

// Monthly charging trend
function renderChargingTrend(data) {
    renderBarLineChart("trendChart", {
        labels: data.map(row => row.month),
        bar: {
            label: "Total Spent (NTD)",
            data: data.map(row => row.total_amount),
            colors: "rgba(59, 130, 246, 0.7)"
        },
        line: {
            label: "Avg Price (NTD/kWh)",
            data: data.map(row => row.avg_price_per_kwh)
        },
        yTitle: "Monthly Spending (NTD)",
        y1Title: "NTD / kWh"
    });
}

/* /monthly-summary feeds three charts: a running total of each month's
   total_cost (= total cost of ownership over time), plus the per-km cost and
   efficiency the backend derives from the odometer deltas. Months with no
   odometer reading to difference against carry nulls, which Chart.js draws as
   gaps in the line rather than as zeroes. */
function renderCumulativeCost(data) {
    let runningTotal = 0;
    renderLineChart("cumulativeCostChart", {
        labels: data.map(row => row.month),
        label: "Cumulative Cost",
        data: data.map(row => (runningTotal += row.total_cost)),
        formatValue: v => `NT$ ${v.toLocaleString()}`
    });
}

function renderMonthlyCostPerKm(data) {
    renderBarLineChart("monthlyCostPerKmChart", {
        labels: data.map(row => row.month),
        bar: {
            label: "Distance Driven (km)",
            data: data.map(row => row.km_driven),
            colors: "rgba(59, 130, 246, 0.7)"
        },
        line: {
            label: "Total Cost (NTD/km)",
            data: data.map(row => row.cost_per_km)
        },
        yTitle: "km Driven",
        y1Title: "NTD / km",
        // Index-mode tooltips include months a dataset has no value for.
        tooltipLabel: ctx => ctx.parsed.y == null
            ? ""
            : ctx.dataset.yAxisID === "y"
                ? ` Driven: ${ctx.parsed.y.toLocaleString()} km`
                : ` Cost: NT$ ${ctx.parsed.y.toFixed(2)} / km`
    });
}

function renderMonthlyEfficiency(data) {
    renderLineChart("monthlyEfficiencyChart", {
        labels: data.map(row => row.month),
        label: "Efficiency",
        data: data.map(row => row.kwh_per_100km),
        formatValue: v => `${v} kWh`
    });
}

// Recent charging sessions table
function renderRecentCharging(data) {
    if (!data || data.length === 0) {
        setText("recent-charging", "No charging records yet.");
        return;
    }

    buildTable(
        "recent-charging",
        [
            { label: "Date", cls: "col-date" },
            { label: "Provider", cls: "" },
            { label: "kWh", cls: "col-amount" },
            { label: "Amount", cls: "col-amount" },
        ],
        data,
        row => [
            { value: row.charge_date, cls: "col-date" },
            { value: row.provider || "-", cls: "" },
            { value: row.kwh.toFixed(2), cls: "col-amount" },
            { value: `NT$ ${row.amount.toLocaleString()}`, cls: "col-amount" },
        ]
    );

    setText("recent-charging-meta", `${data.length} latest charge${plural(data.length)}`);
}

// Recent car expenses table
function renderRecentExpenses(data) {
    if (!data || data.length === 0) {
        setText("recent-car-expenses", "No car expense records yet.");
        return;
    }

    buildTable(
        "recent-car-expenses",
        [
            { label: "Date", cls: "col-date" },
            { label: "Item", cls: "" },
            { label: "Amount", cls: "col-amount" },
        ],
        data,
        row => [
            { value: row.date, cls: "col-date" },
            { value: row.item || "-", cls: "" },
            { value: `NT$ ${row.amount.toLocaleString()}`, cls: "col-amount" },
        ]
    );

    setText("recent-expenses-meta", `${data.length} latest record${plural(data.length)}`);
}

/* =========================================
   The one request that draws the page
   ========================================= */

/* Widget name -> [payload key, renderer, failure handler]. The failure handler
   runs when the request fails (every widget) or when that one renderer throws
   (just that widget), so a broken slice degrades to an in-place error message
   instead of an empty card. */
const WIDGETS = [
    ["Tesla stats", "stats", renderStats,
        () => setKpiErrors(STAT_KPI_IDS)],
    ["data coverage", "data_coverage", renderDataCoverage,
        showCoverageError],
    ["period performance", "period_summary", renderPeriodSummary,
        () => setKpiErrors(PERIOD_KPI_IDS)],
    ["spending breakdown", "expenses", renderExpenseBreakdown,
        () => showError("costBreakdownChart", "Failed to load spending breakdown")],
    ["charging provider data", "charging_providers", renderProviders,
        () => showError("providerChart", "Failed to load charging provider data")],
    ["charging sessions", "charging_sessions", renderChargingSessions, () => {
        showError("chargingScatterChart", "Failed to load charging session data");
        showError("chargingHistogram", "Failed to load charging session data");
    }],
    ["monthly trend data", "charging_monthly_trend", renderChargingTrend,
        () => showError("trendChart", "Failed to load monthly trend data")],
    ["cumulative cost chart", "monthly_summary", renderCumulativeCost,
        () => showError("cumulativeCostChart", "Failed to load cumulative cost data")],
    ["monthly cost per km", "monthly_summary", renderMonthlyCostPerKm,
        () => showError("monthlyCostPerKmChart", "Failed to load monthly cost per km")],
    ["monthly efficiency", "monthly_summary", renderMonthlyEfficiency,
        () => showError("monthlyEfficiencyChart", "Failed to load monthly efficiency")],
    ["recent charging", "recent_charging", renderRecentCharging,
        () => showError("recent-charging", "Failed to load recent charges")],
    ["recent car expenses", "recent_expenses", renderRecentExpenses,
        () => showError("recent-car-expenses", "Failed to load recent expenses")],
];

loadJSON(`${API_BASE}/api/tesla/dashboard`, "Tesla dashboard",
    payload => WIDGETS.forEach(([label, key, render, onError]) =>
        renderWidget(label, () => render(payload[key]), onError)),
    () => WIDGETS.forEach(([, , , onError]) => onError()));
