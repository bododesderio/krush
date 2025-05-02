"use client"

import { useTheme } from "next-themes"

interface UserHeatMapProps {
  activityData: {
    activityByDay: number[]
    activityByHour: number[]
  }
}

export function UserHeatMap({ activityData }: UserHeatMapProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Create a 2D array for the heatmap
  const heatmapData: number[][] = Array(7)
    .fill(0)
    .map(() => Array(24).fill(0))

  // In a real app, this would be populated with actual data
  // For this demo, we'll use the day and hour data to simulate a heatmap

  // Find the max value for scaling
  const maxDayValue = Math.max(...activityData.activityByDay)
  const maxHourValue = Math.max(...activityData.activityByHour)

  // Populate the heatmap with simulated data
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // Create a pattern based on day and hour activity
      const dayFactor = activityData.activityByDay[day] / (maxDayValue || 1)
      const hourFactor = activityData.activityByHour[hour] / (maxHourValue || 1)

      // Combine factors with some randomness
      heatmapData[day][hour] = Math.round(dayFactor * hourFactor * 100 + Math.random() * 20)
    }
  }

  // Get the max value for color scaling
  const maxValue = Math.max(...heatmapData.flat())

  // Function to get color based on value
  const getColor = (value: number) => {
    const intensity = value / (maxValue || 1)

    if (isDark) {
      // Dark theme colors (pink to white)
      return `rgb(236, 51, 83, ${intensity.toFixed(2)})`
    } else {
      // Light theme colors (white to pink)
      const r = 255 - Math.round((255 - 236) * intensity)
      const g = 255 - Math.round((255 - 51) * intensity)
      const b = 255 - Math.round((255 - 83) * intensity)
      return `rgb(${r}, ${g}, ${b})`
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="flex">
          <div className="w-12"></div>
          {hours.map((hour) => (
            <div key={hour} className="w-8 text-center text-xs text-muted-foreground">
              {hour}
            </div>
          ))}
        </div>

        {days.map((day, dayIndex) => (
          <div key={day} className="flex items-center">
            <div className="w-12 text-xs font-medium">{day}</div>
            {hours.map((hour) => {
              const value = heatmapData[dayIndex][hour]
              return (
                <div
                  key={hour}
                  className="w-8 h-8 m-px rounded-sm flex items-center justify-center text-[9px]"
                  style={{ backgroundColor: getColor(value) }}
                  title={`${day} ${hour}:00 - Activity: ${value}`}
                >
                  {value > 50 && <span className="text-white">{value}</span>}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
