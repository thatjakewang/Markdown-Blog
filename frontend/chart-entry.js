/*
 * Browser bundle entry point for the chart types used by the Tesla dashboard.
 * Keep this list explicit: importing chart.js/auto would register every Chart.js
 * component and bring back the full-sized distribution this bundle replaces.
 */
import {
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    Legend,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    ScatterController,
    Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

Chart.register(
    BarController,
    BarElement,
    CategoryScale,
    Legend,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    ScatterController,
    Tooltip,
);

// dashboard.js and tesla.js are deliberately framework-free classic scripts.
// Preserve the two globals their existing chart builders consume.
window.Chart = Chart;
window.ChartDataLabels = ChartDataLabels;
