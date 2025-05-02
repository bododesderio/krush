"use client"

import { useTheme } from "next-themes"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface UserActivityChartProps {
  activityData: {
    activityByDay: number[]
    activityByHour: number[]
  }
}

export function UserActivityChart({ activityData }: UserActivityChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)

  const textColor = isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"

  const dayOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: textColor,
        },
      },
      title: {
        display: true,
        text: "Activity by Day of Week",
        color: textColor,
      },
    },
    scales: {
      x: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
      y: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
    },
  }

  const hourOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: textColor,
        },
      },
      title: {
        display: true,
        text: "Activity by Hour of Day",
        color: textColor,
      },
    },
    scales: {
      x: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
          callback: (value) => hours[Number(value)].substring(0, 2),
        },
      },
      y: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
    },
  }

  const dayData = {
    labels: days,
    datasets: [
      {
        label: "Messages",
        data: activityData.activityByDay,
        backgroundColor: "#EC3353",
      },
    ],
  }

  const hourData = {
    labels: hours,
    datasets: [
      {
        label: "Messages",
        data: activityData.activityByHour,
        backgroundColor: "#EC3353",
      },
    ],
  }

  return (
    <div className="space-y-8">
      <div>
        <Bar options={dayOptions} data={dayData} height={300} />
      </div>
      <div>
        <Bar options={hourOptions} data={hourData} height={300} />
      </div>
    </div>
  )
}
