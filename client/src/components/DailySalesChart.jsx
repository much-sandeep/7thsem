import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatCurrency } from '../utils/formatCurrency';
import styles from './DailySalesChart.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

function DailySalesChart({ dailySales }) {
  const labels = dailySales.map((row) => row.date);
  const values = dailySales.map((row) => row.totalSales);

  const data = {
    labels,
    datasets: [
      {
        label: 'Sales (NPR)',
        data: values,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        pointBackgroundColor: '#2563eb',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.35,
        fill: true,
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
        text: 'Weekly Sales Trend (Last 7 Days)',
        color: '#0f172a',
        font: { size: 16, weight: '600' },
        padding: { bottom: 12 },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => formatCurrency(context.parsed.y),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value),
        },
        grid: { color: 'rgba(148, 163, 184, 0.18)' },
      },
    },
  };

  if (dailySales.length === 0) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.title}>Weekly Sales Trend</h3>
        <p className={styles.empty}>No sales data yet. Create bills to see trends.</p>
      </div>
    );
  }

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartWrap}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default DailySalesChart;
