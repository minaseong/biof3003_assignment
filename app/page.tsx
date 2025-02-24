// app/page.tsx
'use client';
import { useState } from 'react';
import CameraFeed from './components/CameraFeed';
import MetricsCard from './components/MetricsCard';
import SignalCombinationSelector from './components/SignalCombinationSelector';
import ChartComponent from './components/ChartComponent';
import usePPGProcessing from './hooks/usePPGProcessing';
import useSignalQuality from './hooks/useSignalQuality';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [signalCombination, setSignalCombination] = useState('default');
  const [showConfig, setShowConfig] = useState(false);

  const {
    ppgData,
    valleys,
    heartRate,
    confidence,
    hrv,
    processFrame,
    startCamera,
    stopCamera,
  } = usePPGProcessing(isRecording, signalCombination);

  const { signalQuality, qualityConfidence } = useSignalQuality(ppgData);

  return (
    <div className="flex flex-col items-center p-4">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-4">HeartLen</h1>

      {/* Recording Button */}
      <button
        onClick={() => setIsRecording(!isRecording)}
        className={`p-3 rounded-lg text-sm transition-all duration-300 ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-cyan-500 hover:bg-cyan-600 text-white'
        }`}
      >
        {isRecording ? '⏹ STOP' : '⏺ START'} RECORDING
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full max-w-4xl">
        {/* Left Column: Camera Feed */}
        <div>
          <CameraFeed
            isRecording={isRecording}
            startCamera={startCamera}
            stopCamera={stopCamera}
            processFrame={processFrame}
          />
        </div>

        {/* Right Column: Metrics and Chart */}
        <div className="space-y-4">
          {/* Metrics Cards */}
          <MetricsCard
            title="HEART RATE"
            value={heartRate}
            unit="BPM"
            confidence={confidence}
          />
          <MetricsCard
            title="HRV"
            value={hrv.sdnn}
            unit="ms"
            confidence={hrv.confidence}
          />
          <MetricsCard
            title="SIGNAL QUALITY"
            value={signalQuality}
            unit=""
            confidence={qualityConfidence}
          />

          {/* Chart */}
          <ChartComponent ppgData={ppgData} valleys={valleys} />
        </div>
      </div>

      {/* Signal Combination Selector */}
      <button
        onClick={() => setShowConfig((prev) => !prev)}
        className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 mt-4"
      >
        Toggle Config
      </button>
      {showConfig && (
        <SignalCombinationSelector
          signalCombination={signalCombination}
          setSignalCombination={setSignalCombination}
        />
      )}
    </div>
  );
}
