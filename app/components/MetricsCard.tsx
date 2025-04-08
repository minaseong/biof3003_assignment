import React from 'react';

interface MetricsCardProps {
  title: string;
  value: any;
  confidence: number;
  isDarkMode?: boolean;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ title, value, confidence, isDarkMode = false }) => {
  const getValueDisplay = () => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (value.bpm !== undefined) return `${value.bpm.toFixed(1)} BPM`;
      if (value.sdnn !== undefined) return `${value.sdnn.toFixed(1)} ms`;
    }
    return '--';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return isDarkMode ? 'bg-emerald-600' : 'bg-emerald-500';
    if (confidence >= 60) return isDarkMode ? 'bg-yellow-600' : 'bg-yellow-500';
    return isDarkMode ? 'bg-red-600' : 'bg-red-500';
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'} p-4 rounded-lg shadow-sm border`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{title}</h3>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full ${getConfidenceColor(confidence)} mr-2`} />
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{confidence.toFixed(0)}%</span>
        </div>
      </div>
      <p className={`text-2xl font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{getValueDisplay()}</p>
    </div>
  );
};

export default MetricsCard;
