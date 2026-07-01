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
import styles from './TopItemsChart.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function TopItemsChart({ topItems }) {
  const top5 = topItems.slice(0, 5);
  const labels = top5.map((row) => row.itemName);
  const values = top5.map((row) => row.quantitySold);

  const data = {
    labels,
    datasets: [
      {
        label: 'Units Sold',
        data: values,
        backgroundColor: 'rgba(5, 150, 105, 0.8)',
        hoverBackgroundColor: 'rgba(4, 120, 87, 0.95)',
        borderRadius: 8,
        maxBarThickness: 56,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top 5 Items',
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
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        grid: { color: 'rgba(148, 163, 184, 0.18)' },
      },
    },
  };

  if (top5.length === 0) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.title}>Top 5 Items</h3>
        <p className={styles.empty}>No item sales data yet.</p>
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

export default TopItemsChart;
