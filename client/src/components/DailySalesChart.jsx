import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import styles from './DailySalesChart.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
        label: 'Daily Sales ($)',
        data: values,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.3,
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
        text: 'Daily Sales',
        color: '#0f172a',
        font: { size: 16, weight: '600' },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value}`,
        },
      },
    },
  };

  if (dailySales.length === 0) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.title}>Daily Sales</h3>
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
