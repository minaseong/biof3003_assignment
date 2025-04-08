// components/ChartComponent.tsx
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useRef, useEffect, useState } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartComponentProps {
  ppgData: number[];
  valleys: { index: number; value: number }[];
  isDarkMode?: boolean;
}

export default function ChartComponent({
  ppgData,
  valleys,
  isDarkMode = false,
}: ChartComponentProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState<number>(300);
  
  // Adjust chart height based on container width to maintain aspect ratio
  useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const width = chartRef.current.clientWidth;
        // Maintain a 16:9 aspect ratio
        const height = Math.max(250, Math.min(400, width * 0.5));
        setChartHeight(height);
      }
    };
    
    // Initial size calculation
    updateDimensions();
    
    // Update on resize
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const chartData = {
    labels: Array.from({ length: ppgData.length }, (_, i) => i.toString()),
    datasets: [
      {
        label: 'PPG Signal',
        data: ppgData,
        borderColor: isDarkMode ? 'rgb(34, 211, 238)' : 'rgb(75, 192, 192)',
        tension: 0.4,
        fill: true,
        backgroundColor: isDarkMode 
          ? 'rgba(34, 211, 238, 0.1)' 
          : 'rgba(75, 192, 192, 0.2)',
        pointRadius: 0,
      },
      {
        label: 'Valleys',
        data: ppgData.map(
          (_, i) => valleys.find((v) => v.index === i)?.value || null
        ),
        pointBackgroundColor: isDarkMode ? '#ef4444' : 'red',
        pointRadius: 3,
        showLine: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        }
      },
      x: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          display: false,
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#374151',
        }
      },
      tooltip: {
        titleColor: isDarkMode ? '#f9fafb' : '#111827',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        borderColor: isDarkMode ? 'rgba(75, 85, 99, 1)' : 'rgba(203, 213, 225, 1)',
      }
    },
    animation: {
      duration: 0, // Disable animation for better performance
    },
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'} p-4 rounded-lg shadow-md h-full flex flex-col`}>
      <h2 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>PPG Signal</h2>
      <div ref={chartRef} className="flex-grow" style={{ height: `${chartHeight}px`, minHeight: '250px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
