/**
 * Shared utilities for dashboard pages
 *
 * Contains:
 *   - fetch / error helpers
 *   - table builder
 *   - shared color palettes (single source of truth for all dashboards)
 *   - reusable chart builders (horizontal bar + dual-axis bar/line + line)
 */

const FONT_FAMILY = "system-ui, sans-serif";
const TEXT_COLOR  = "#333333";
const META_COLOR  = "#707070";
const GRID_COLOR  = "#f3f4f6";

/* =========================================
   Shared Chart.js option fragments
   ========================================= */

/** Chart.js font object at the given size */
const chartFont = size => ({ size, family: FONT_FAMILY });

/** Standard tick styling (muted, 11px); pass overrides like { callback, color } */
const axisTicks = (overrides = {}) => ({
    color: META_COLOR,
    font: chartFont(11),
    ...overrides
});

/** Standard axis title, or undefined when no text is given */
const axisTitle = text =>
    text ? { display: true, text: text, color: META_COLOR, font: chartFont(11) } : undefined;

/** Standard top legend with point-style markers */
const topLegend = () => ({
    display: true,
    position: "top",
    labels: { usePointStyle: true, font: chartFont(12), color: TEXT_COLOR }
});

/* =========================================
   Color palettes
   ========================================= */

/** Fallback color for labels not listed in a palette */
const FALLBACK_COLOR = "#9ca3af";

/** Tesla cost breakdown (spending by item) */
const EXPENSE_ITEM_COLORS = {
    "Charging":     "#3b82f6",
    "Insurance":    "#e31937",
    "Toll":         "#f59e0b",
    "Maintenance":  "#10b981",
    "Subscription": "#8b5cf6"
};

/** Charging providers (matched case-insensitively by mapColors) */
const PROVIDER_COLORS = {
    "Evalue":  "#3b82f6",
    "Tesla":   "#10b981",
    "Evoasis": "#f59e0b",
    "TAIL":    "#8b5cf6",
    "UPower":  "#9ca3af"
};

/** Map an array of labels to colors via a { label: color } palette.
    Lookup is case-insensitive; unknown labels get the fallback gray. */
function mapColors(labels, colorMap) {
    const lookup = Object.fromEntries(
        Object.entries(colorMap).map(([key, color]) => [key.toLowerCase(), color])
    );
    return labels.map(label => lookup[String(label).toLowerCase()] || FALLBACK_COLOR);
}

/* =========================================
   Fetch / error / loader helpers
   ========================================= */

/** Fetch JSON; throws on non-2xx */
async function safeFetch(url) {
    const res = await fetch(url, { credentials: "omit" });
    if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

/** Set the text content of an element by id (no-op if missing) */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

/** Pluralization suffix: plural(1) === "", plural(2) === "s" */
const plural = n => (n === 1 ? "" : "s");

/** Mark a KPI card value element as errored */
function setKpiError(id, label = "Error") {
    const el = document.getElementById(id);
    if (!el) return;
    const card = el.closest(".kpi-card");
    if (card) card.classList.add("error");
    el.textContent = label;
    el.classList.add("error");
}

/** Mark a group of KPI cards as errored: the first reads "Error", the rest "—" */
function setKpiErrors(ids) {
    ids.forEach((id, i) => setKpiError(id, i === 0 ? "Error" : "—"));
}

/** Show an error message inside a container. If the target element is a
    <canvas>, the message replaces its wrapper div instead (charts). */
function showError(elementId, message = "Failed to load data") {
    const el = document.getElementById(elementId);
    if (!el) return;
    const target = el.tagName === "CANVAS" ? (el.parentElement ?? el) : el;
    target.innerHTML = `<p class="dashboard-error">${message}</p>`;
}

/** Fetch JSON and hand it to render(); on failure log the error and run onError().
    Wraps the try/catch + console.error boilerplate shared by every loader. */
async function loadJSON(url, label, render, onError) {
    try {
        render(await safeFetch(url));
    } catch (err) {
        console.error(`Failed to load ${label}:`, err);
        onError(err);
    }
}

/** Draw one widget from an already-fetched payload, isolating its failures.
    Pages that fetch every widget in one request need this: without it a single
    renderer throwing would abort the rest of the page, which separate requests
    per widget used to prevent for free. */
function renderWidget(label, render, onError) {
    try {
        render();
    } catch (err) {
        console.error(`Failed to render ${label}:`, err);
        onError(err);
    }
}

/* =========================================
   Table builder
   ========================================= */

/**
 * Build and inject a dashboard-table into a container element.
 *
 * @param {string}   containerId  - ID of the wrapper element
 * @param {Array}    headers      - [{ label, cls }]
 * @param {Array}    rows         - array of data objects
 * @param {Function} cellMapper   - (row) => [{ value, cls }, ...]
 */
function buildTable(containerId, headers, rows, cellMapper) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const table = document.createElement("table");
    table.className = "dashboard-table";

    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    headers.forEach(({ label, cls }) => {
        const th = document.createElement("th");
        th.textContent = label;
        if (cls) th.className = cls;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    rows.forEach(row => {
        const tr = tbody.insertRow();
        cellMapper(row).forEach(({ value, cls }) => {
            const td = tr.insertCell();
            td.textContent = value;
            if (cls) td.className = cls;
        });
    });

    container.replaceChildren(table);
}

/* =========================================
   Chart builders
   ========================================= */

/**
 * Render a horizontal bar chart with NT$ formatting (largest value on top).
 *
 * @param {string} canvasId - ID of the target <canvas>
 * @param {Array}  rows     - array of data objects from the API
 * @param {Object} opts     - { labelKey, valueKey, colorMap, formatValue }
 *                            formatValue defaults to NT$ money formatting;
 *                            pass e.g. v => `${v} kg` for other units.
 */
function renderHorizontalBarChart(canvasId, rows, { labelKey, valueKey, colorMap, formatValue }) {
    const format = formatValue ?? (v => `NT$ ${v.toLocaleString()}`);
    // Sort descending so the largest sits on top (defensive; the API usually pre-sorts)
    const sorted = [...rows].sort((a, b) => b[valueKey] - a[valueKey]);
    const labels = sorted.map(row => row[labelKey]);
    const values = sorted.map(row => row[valueKey]);

    new Chart(document.getElementById(canvasId), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: mapColors(labels, colorMap),
                borderRadius: 4,
                borderSkipped: false,
                barThickness: 22
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${format(ctx.parsed.x)}`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: GRID_COLOR }, border: { display: false },
                    ticks: axisTicks({ callback: value => format(value) })
                },
                y: {
                    grid: { display: false }, border: { display: false },
                    ticks: axisTicks({ color: TEXT_COLOR, font: chartFont(12) })
                }
            }
        }
    });
}

/**
 * Render a dual-axis chart: bars (left axis) + line (right axis).
 * Axis ranges are computed automatically from the data, so the chart
 * keeps working as values grow over time.
 *
 * @param {string} canvasId - ID of the target <canvas>
 * @param {Object} config:
 *   labels             - x-axis labels
 *   bar                - { label, data, colors, datalabels? }
 *   line               - { label, data, pointRadius?, datalabels? }
 *   yTitle / y1Title   - axis titles
 *   paddingTop         - extra top padding (for datalabels above points)
 *   yTicksInThousands  - format left-axis ticks as "12k"
 *   moneyTooltip       - NT$ tooltip formatting for both datasets
 *   tooltipLabel       - Chart.js label callback, when moneyTooltip's
 *                        "total spent / price per kWh" wording doesn't fit
 */
function renderBarLineChart(canvasId, config) {
    const { labels, bar, line } = config;
    // Only register the datalabels plugin when a dataset actually uses it
    const useDatalabels = Boolean(bar.datalabels || line.datalabels);

    const barDataset = {
        label: bar.label,
        data: bar.data,
        backgroundColor: bar.colors,
        borderRadius: 4,
        order: 2,
        yAxisID: "y"
    };
    if (bar.datalabels) barDataset.datalabels = bar.datalabels;

    const lineDataset = {
        label: line.label,
        data: line.data,
        type: "line",
        borderColor: "#e31937",
        backgroundColor: "#e31937",
        borderWidth: 2,
        pointRadius: line.pointRadius ?? 4,
        tension: 0.3,
        order: 1,
        yAxisID: "y1"
    };
    if (line.datalabels) lineDataset.datalabels = line.datalabels;

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: topLegend()
        },
        scales: {
            y: {
                position: "left",
                min: 0,
                grid: { color: GRID_COLOR }, border: { display: false },
                ticks: axisTicks(),
                title: axisTitle(config.yTitle)
            },
            y1: {
                position: "right",
                min: 0,
                grid: { display: false }, border: { display: false },
                ticks: axisTicks(),
                title: axisTitle(config.y1Title)
            },
            x: {
                grid: { display: false }, border: { display: false },
                ticks: axisTicks({ color: TEXT_COLOR, font: chartFont(12) })
            }
        }
    };

    if (config.paddingTop) options.layout = { padding: { top: config.paddingTop } };
    if (config.yTicksInThousands) {
        options.scales.y.ticks.callback = value => value / 1000 + "k";
    }
    // tooltipLabel is the general form: a Chart.js label callback, for charts
    // whose two axes aren't "total spent" and "price per kWh". moneyTooltip
    // stays as the shorthand for the ones that are.
    if (config.tooltipLabel) {
        options.plugins.tooltip = { callbacks: { label: config.tooltipLabel } };
    } else if (config.moneyTooltip) {
        options.plugins.tooltip = {
            callbacks: {
                label: ctx => ctx.dataset.yAxisID === "y"
                    ? ` Total: NT$ ${ctx.parsed.y.toLocaleString()}`
                    : ` Avg: NT$ ${ctx.parsed.y.toFixed(2)} / kWh`
            }
        };
    }

    new Chart(document.getElementById(canvasId), {
        type: "bar",
        plugins: useDatalabels ? [ChartDataLabels] : [],
        data: { labels: labels, datasets: [barDataset, lineDataset] },
        options: options
    });
}

/**
 * Render a single-series line chart (e.g. daily spend, cumulative cost).
 * Safe to call repeatedly on the same canvas: any existing chart is
 * destroyed first, so it works for "re-render on dropdown change".
 *
 * @param {string} canvasId - ID of the target <canvas>
 * @param {Object} config   - { labels, label, data, formatValue, pointRadius? }
 *   pointRadius defaults to 3; pass 0 for dense series (points still show on hover).
 */
function renderLineChart(canvasId, { labels, label, data, formatValue, pointRadius }) {
    const format = formatValue ?? (v => v.toLocaleString());

    Chart.getChart(canvasId)?.destroy();

    new Chart(document.getElementById(canvasId), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: "#3b82f6",
                backgroundColor: "#3b82f6",
                borderWidth: 2,
                pointRadius: pointRadius ?? 3,
                pointHoverRadius: 4,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: ${format(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: GRID_COLOR }, border: { display: false },
                    ticks: axisTicks({ callback: value => format(value) })
                },
                x: {
                    grid: { display: false }, border: { display: false },
                    ticks: axisTicks({ maxTicksLimit: 10, maxRotation: 0 })
                }
            }
        }
    });
}

/**
 * Render a scatter chart where each row is one point, split into colored
 * series by a category field (e.g. one color per charging provider).
 * Good for seeing where individual records cluster (distribution).
 * Safe to call repeatedly on the same canvas (existing chart is destroyed first).
 *
 * @param {string} canvasId - ID of the target <canvas>
 * @param {Array}  rows     - raw API rows (one point each)
 * @param {Object} opts:
 *   xKey, yKey       - numeric fields mapped to the x / y axes
 *   groupKey         - field used to split rows into colored series
 *   colorMap         - { label: color } palette (case-insensitive lookup)
 *   xTitle, yTitle   - axis titles
 *   formatX, formatY - tick/tooltip formatters (default: toLocaleString)
 */
function renderScatterChart(canvasId, rows, opts) {
    const { xKey, yKey, groupKey, colorMap, xTitle, yTitle } = opts;
    const formatX = opts.formatX ?? (v => v.toLocaleString());
    const formatY = opts.formatY ?? (v => v.toLocaleString());

    Chart.getChart(canvasId)?.destroy();

    // Split rows into one dataset per group, preserving first-seen order
    const groups = [];
    const byGroup = new Map();
    rows.forEach(row => {
        const key = row[groupKey] ?? "Other";
        if (!byGroup.has(key)) {
            byGroup.set(key, []);
            groups.push(key);
        }
        byGroup.get(key).push({ x: row[xKey], y: row[yKey] });
    });

    const colors = mapColors(groups, colorMap);
    const datasets = groups.map((key, i) => ({
        label: key,
        data: byGroup.get(key),
        backgroundColor: colors[i],
        pointRadius: 5,
        pointHoverRadius: 7
    }));

    new Chart(document.getElementById(canvasId), {
        type: "scatter",
        data: { datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: topLegend(),
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: ${formatX(ctx.parsed.x)}, ${formatY(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: GRID_COLOR }, border: { display: false },
                    ticks: axisTicks({ callback: value => formatX(value) }),
                    title: axisTitle(xTitle)
                },
                y: {
                    beginAtZero: true,
                    grid: { color: GRID_COLOR }, border: { display: false },
                    ticks: axisTicks({ callback: value => formatY(value) }),
                    title: axisTitle(yTitle)
                }
            }
        }
    });
}

/**
 * Render a histogram (frequency distribution) of a single numeric series, so
 * the distribution shape is visible: bars piled on the left with a tail to the
 * right = right-skewed; piled on the right with a tail left = left-skewed.
 * Bins are equal-width and adjacent bars touch (no gaps). Safe to call
 * repeatedly on the same canvas (existing chart is destroyed first).
 *
 * @param {string}   canvasId
 * @param {number[]} values - the raw numbers to bin (non-numbers are ignored)
 * @param {Object}   opts:
 *   binCount         - number of equal-width bins (default 10)
 *   color            - bar color (default blue)
 *   xTitle, yTitle   - axis titles
 *   formatBin        - (lo, hi) => x-axis label for a bin (default "lo–hi", rounded)
 */
function renderHistogram(canvasId, values, opts = {}) {
    const binCount = opts.binCount ?? 10;
    const color = opts.color ?? "#3b82f6";
    const formatBin = opts.formatBin ?? ((lo, hi) => `${Math.round(lo)}–${Math.round(hi)}`);

    Chart.getChart(canvasId)?.destroy();

    const nums = values.filter(v => typeof v === "number" && !Number.isNaN(v));
    // Empty series (no records yet, or every value filtered out) would produce
    // Infinity bounds and NaN bin labels — paint a note on the bare canvas
    // instead. A later render with data simply draws over it.
    if (nums.length === 0) {
        const canvas = document.getElementById(canvasId);
        // Without Chart.js the backing store is still the default 300x150
        // while CSS stretches the element — match it to the displayed size
        // (x devicePixelRatio for sharpness); resizing also clears the canvas.
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        const ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr);
        ctx.font = `13px ${FONT_FAMILY}`;
        ctx.fillStyle = FALLBACK_COLOR;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("No data to display", canvas.clientWidth / 2, canvas.clientHeight / 2);
        return;
    }
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    // Guard a zero-width range (all values equal): fall back to width 1
    const width = (max - min) / binCount || 1;

    const counts = new Array(binCount).fill(0);
    nums.forEach(v => {
        // Clamp so the max value lands in the last bin rather than overflowing
        const idx = Math.min(Math.floor((v - min) / width), binCount - 1);
        counts[idx]++;
    });
    const labels = counts.map((_, i) => formatBin(min + i * width, min + (i + 1) * width));

    new Chart(document.getElementById(canvasId), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: color,
                borderRadius: 2,
                // Bars touch so it reads as a continuous distribution, not categories
                categoryPercentage: 1.0,
                barPercentage: 1.0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: items => items[0].label,
                        label: ctx => ` ${ctx.parsed.y} session${ctx.parsed.y === 1 ? "" : "s"}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false }, border: { display: false },
                    ticks: axisTicks({ font: chartFont(10), maxRotation: 0, autoSkip: true }),
                    title: axisTitle(opts.xTitle)
                },
                y: {
                    beginAtZero: true,
                    grid: { color: GRID_COLOR }, border: { display: false },
                    ticks: axisTicks({ precision: 0 }),
                    title: axisTitle(opts.yTitle)
                }
            }
        }
    });
}
