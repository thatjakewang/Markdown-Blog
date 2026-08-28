/* tesla.js — data loaders for the Tesla cost dashboard (templates/tesla.html).
   Uses the shared builders in dashboard.js; loaded with defer after Chart.js,
   the datalabels plugin, and dashboard.js. The API is served from this same
   origin, so every URL below is root-relative. */

const API_BASE = "";

// KPI cards
loadJSON(`${API_BASE}/api/tesla/stats`, "Tesla stats", data => {
    setText("total-cost", `NT$ ${data.total_cost.toLocaleString()}`);
    setText("odometer-km", `${data.odometer_km.toLocaleString()} km`);
    setText("cost-per-km", `NT$ ${data.cost_per_km}`);
    setText("charging-cost-per-km", `NT$ ${data.charging_cost_per_km}`);
    setText("non-charging-cost-per-km", `NT$ ${data.non_charging_cost_per_km}`);
    setText("charging-cost", `NT$ ${data.charging_cost.toLocaleString()}`);
    setText("non-charging-cost", `NT$ ${data.non_charging_cost.toLocaleString()}`);
    setText("avg-price", `NT$ ${data.avg_price_per_kwh}`);
}, () => setKpiErrors([
    "total-cost", "odometer-km", "cost-per-km",
    "charging-cost-per-km", "non-charging-cost-per-km",
    "charging-cost", "non-charging-cost", "avg-price"
]));

const formatDate = value => value || "No records";
const formatMetric = (value, suffix = "") =>
    value == null ? "Not enough data" : `${value.toLocaleString()}${suffix}`;

// Collection windows make null efficiency values understandable at a glance.
loadJSON(`${API_BASE}/api/tesla/data-coverage`, "data coverage", data => {
    setText("data-updated", `Data last updated ${formatDate(data.last_updated)}`);
    setText("coverage-charging", `Since ${formatDate(data.charging_start_date)}`);
    setText("coverage-expenses", `Since ${formatDate(data.expenses_start_date)}`);
    setText("coverage-odometer", `Since ${formatDate(data.odometer_start_date)}`);
}, () => {
    setText("data-updated", "Latest update unavailable");
    ["coverage-charging", "coverage-expenses", "coverage-odometer"]
        .forEach(id => setText(id, "Unavailable"));
});

// This-month and rolling-90-day KPIs share one payload and switch instantly.
loadJSON(`${API_BASE}/api/tesla/period-summary`, "period performance", periods => {
    const renderPeriod = key => {
        const data = periods[key];
        setText("period-range", `${data.start_date} to ${data.end_date}${data.is_partial ? " · partial period" : ""}`);
        setText("period-total-cost", `NT$ ${data.total_cost.toLocaleString()}`);
        setText("period-km", formatMetric(data.km_driven, " km"));
        setText("period-energy-cost-km", data.energy_cost_per_km == null ? "Not enough data" : `NT$ ${data.energy_cost_per_km}`);
        setText("period-total-cost-km", data.total_cost_per_km == null ? "Not enough data" : `NT$ ${data.total_cost_per_km}`);
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
}, () => setKpiErrors([
    "period-total-cost", "period-km", "period-energy-cost-km",
    "period-total-cost-km", "period-efficiency", "period-change"
]));

// Spending by category (all-time)
loadChart(`${API_BASE}/api/tesla/expenses`, "costBreakdownChart",
    "Failed to load spending breakdown", data =>
    renderHorizontalBarChart("costBreakdownChart", data, {
        labelKey: "item",
        valueKey: "total_amount",
        colorMap: EXPENSE_ITEM_COLORS
    }));

// Charging by provider
loadChart(`${API_BASE}/api/tesla/charging/providers`, "providerChart",
    "Failed to load charging provider data", data => {
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
});

// Per-session charging data: fetched once, feeds both the scatter chart
// (kWh x cost, colored by provider) and the distribution histogram below.
loadJSON(`${API_BASE}/api/tesla/charging/sessions`, "charging sessions", sessions => {
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
}, () => {
    showError("chargingScatterChart", "Failed to load charging session data");
    showError("chargingHistogram", "Failed to load charging session data");
});

// Monthly charging trend
loadChart(`${API_BASE}/api/tesla/charging/monthly-trend`, "trendChart",
    "Failed to load monthly trend data", data =>
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
    }));

/* /monthly-summary feeds the cumulative cost chart: a running total of each
   month's total_cost = total cost of ownership over time. */
loadJSON(`${API_BASE}/api/tesla/monthly-summary`, "cumulative cost chart", data => {
    let runningTotal = 0;
    renderLineChart("cumulativeCostChart", {
        labels: data.map(row => row.month),
        label: "Cumulative Cost",
        data: data.map(row => (runningTotal += row.total_cost)),
        formatValue: v => `NT$ ${v.toLocaleString()}`
    });
}, () => showError("cumulativeCostChart", "Failed to load cumulative cost data"));

// Recent charging sessions table
loadJSON(`${API_BASE}/api/tesla/charging/recent`, "recent charging", data => {
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
}, () => showError("recent-charging", "Failed to load recent charges"));

// Recent car expenses table
loadJSON(`${API_BASE}/api/tesla/expenses/recent`, "recent car expenses", data => {
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
}, () => showError("recent-car-expenses", "Failed to load recent expenses"));
