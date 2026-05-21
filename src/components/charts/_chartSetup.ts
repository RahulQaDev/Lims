/**
 * Register Chart.js controllers / elements once for the whole app.
 * Import this module for its side-effects before using <Line />, <Bar />, <Doughnut />.
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// Mock-matching defaults
ChartJS.defaults.font.family = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
ChartJS.defaults.font.size = 10;
ChartJS.defaults.color = '#64748b';
if (ChartJS.defaults.plugins?.legend) ChartJS.defaults.plugins.legend.display = false;
if (ChartJS.defaults.plugins?.tooltip) {
  ChartJS.defaults.plugins.tooltip.backgroundColor = '#0f172a';
  ChartJS.defaults.plugins.tooltip.padding = 8;
  ChartJS.defaults.plugins.tooltip.cornerRadius = 6;
}
