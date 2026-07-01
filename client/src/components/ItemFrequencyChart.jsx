import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import styles from './ItemFrequencyChart.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MAX_BARS = 8;

/**
 * Derive a readable frequency series from FP-Growth itemsets.
 * Prefers single-item itemsets (individual item frequency); if none are
 * present, falls back to the highest-support itemsets so the chart still
 * shows something meaningful.
 */
function buildSeries(itemsets) {
  if (!Array.isArray(itemsets) || itemsets.length === 0) {
    return [];
  }

  const singles = itemsets.filter((entry) => entry.items.length === 1);
  const source = singles.length > 0 ? singles : itemsets;

  return source
    .map((entry) => ({
      label: entry.items.join(' + '),
      value: entry.support,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_BARS);
}

function ItemFrequencyChart({ itemsets }) {
  const series = buildSeries(itemsets);

  const data = {
    labels: series.map((row) => row.label),
    datasets: [
      {
        label: 'Support Count',
        data: series.map((row) => row.value),
        backgroundColor: 'rgba(4, 120, 87, 0.8)',
        hoverBackgroundColor: 'rgba(4, 120, 87, 0.95)',
        borderRadius: 8,
        maxBarThickness: 44,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Item Frequency',
        color: '#0f172a',
        font: { size: 16, weight: '600' },
        padding: { bottom: 12 },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        grid: { color: 'rgba(148, 163, 184, 0.18)' },
      },
      y: {
        grid: { display: false },
      },
    },
  };

  if (series.length === 0) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.title}>Item Frequency</h3>
        <p className={styles.empty}>
          No frequent itemsets yet. Add more bills to surface patterns.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartWrap}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export default ItemFrequencyChart;
