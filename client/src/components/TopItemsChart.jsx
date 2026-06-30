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
  const labels = topItems.map((row) => row.itemName);
  const values = topItems.map((row) => row.quantitySold);

  const data = {
    labels,
    datasets: [
      {
        label: 'Units Sold',
        data: values,
        backgroundColor: 'rgba(37, 99, 235, 0.75)',
        borderRadius: 6,
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
        text: 'Top Selling Items',
        color: '#0f172a',
        font: { size: 16, weight: '600' },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  };

  if (topItems.length === 0) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.title}>Top Selling Items</h3>
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
