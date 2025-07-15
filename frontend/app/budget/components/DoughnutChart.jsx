// components/DoughnutChart.jsx
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function DoughnutChart({ data }) {
  const chartData = {
    labels: ["Needs", "Wants", "Savings"],
    datasets: [
      {
        data: [data.needsPct, data.wantsPct, data.savingsPct],
        backgroundColor: ["#16a34a", "#4ade80", "#15803d"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="max-w-xs mx-auto">
      <Doughnut data={chartData} />
    </div>
  );
}

export default DoughnutChart;
