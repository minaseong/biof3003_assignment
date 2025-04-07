// app/page.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import MetricsCard from './components/MetricsCard';
import SignalCombinationSelector from './components/SignalCombinationSelector';
import ChartComponent from './components/ChartComponent';
import usePPGProcessing from './hooks/usePPGProcessing';
import useSignalQuality from './hooks/useSignalQuality';

interface HistoricalData {
  avgHeartRate: number;
  avgHRV: number;
  lastAccess: Date | null;
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSampling, setIsSampling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [signalCombination, setSignalCombination] = useState('default');
  const [showConfig, setShowConfig] = useState(false);
  const [currentSubject, setCurrentSubject] = useState('');
  const [confirmedSubject, setConfirmedSubject] = useState('');
  const [historicalData, setHistoricalData] = useState<HistoricalData>({
    avgHeartRate: 0,
    avgHRV: 0,
    lastAccess: null
  });

  // Define refs for video and canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    ppgData,
    valleys,
    heartRate,
    hrv,
    processFrame,
    startCamera,
    stopCamera,
  } = usePPGProcessing(isRecording, signalCombination, videoRef, canvasRef);

  const { signalQuality, qualityConfidence } = useSignalQuality(ppgData);

  // Fetch historical data when subject is confirmed
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!confirmedSubject) return;
      
      try {
        const response = await fetch(`/api/historical-data?subjectId=${confirmedSubject}`);
        const data = await response.json();
        
        if (data.success) {
          setHistoricalData({
            avgHeartRate: data.avgHeartRate,
            avgHRV: data.avgHRV,
            lastAccess: data.lastAccess ? new Date(data.lastAccess) : null
          });
        }
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };

    fetchHistoricalData();
  }, [confirmedSubject]);

  // Confirm User Function
  const confirmUser = () => {
    if (currentSubject.trim()) {
      setConfirmedSubject(currentSubject.trim());
    } else {
      alert('Please enter a valid Subject ID.');
    }
  };

  // Start or stop recording
  useEffect(() => {
    if (isRecording) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isRecording]);

  // Process frames when recording
  useEffect(() => {
    let animationFrame: number;
    const processFrameLoop = () => {
      if (isRecording && videoRef.current && canvasRef.current) {
        processFrame();
        animationFrame = requestAnimationFrame(processFrameLoop);
      }
    };

    if (isRecording) {
      processFrameLoop();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isRecording]);

  // Automatically send data every 10 seconds when sampling is enabled
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isSampling && ppgData.length > 0) {
      intervalId = setInterval(() => {
        pushDataToMongo();
      }, 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSampling, ppgData.length]);

  const pushDataToMongo = async () => {
    if (isUploading) return;
    if (!confirmedSubject) {
      alert('Please confirm your Subject ID first.');
      return;
    }

    setIsUploading(true);
    if (ppgData.length === 0) {
      console.warn('No PPG data to send to MongoDB');
      return;
    }

    const recordData = {
      subjectId: confirmedSubject,
      heartRate: {
        bpm: isNaN(heartRate.bpm) ? 0 : heartRate.bpm,
        confidence: hrv.confidence || 0,
      },
      hrv: {
        sdnn: isNaN(hrv.sdnn) ? 0 : hrv.sdnn,
        confidence: hrv.confidence || 0,
      },
      ppgData: ppgData,
      timestamp: new Date(),
    };

    try {
      const response = await fetch('/api/save-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Data successfully saved to MongoDB:', result.data);
      } else {
        console.error('❌ Upload failed:', result.error);
      }
    } catch (error) {
      console.error('🚨 Network error - failed to save data:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-cyan-600">HeartLens</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* User Panel - Moved to top */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Welcome to HeartLens</h2>
              <div className="space-y-6">
                {!confirmedSubject ? (
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={currentSubject}
                      onChange={(e) => setCurrentSubject(e.target.value)}
                      placeholder="Tell us your name"
                      className="flex-1 border border-gray-200 rounded-xl px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-lg"
                    />
                    <button
                      onClick={confirmUser}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-xl transition-all duration-300 text-lg font-medium shadow-sm hover:shadow"
                    >
                      Confirm User
                    </button>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 via-cyan-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-md ring-2 ring-white">
                          <span className="text-white text-2xl font-bold">{confirmedSubject.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold text-gray-800">Welcome back!</h3>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <p className="text-gray-600">Logged in as <span className="font-medium text-gray-800">{confirmedSubject}</span></p>
                          </div>
                        </div>
                      </div>
                      {historicalData.lastAccess && (
                        <div className="bg-white/80 px-5 py-3 rounded-xl border border-gray-100 text-right shadow-sm">
                          <p className="text-sm font-medium text-cyan-600 mb-1">Last Session</p>
                          <p className="text-gray-700 font-medium">{new Date(historicalData.lastAccess).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-cyan-50 via-cyan-100/30 to-cyan-50 p-5 rounded-xl border border-cyan-100/50 shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <p className="text-sm font-medium text-gray-600">Average Heart Rate</p>
                        </div>
                        <p className="text-3xl font-bold text-cyan-700">
                          {historicalData.avgHeartRate.toFixed(1)}
                          <span className="text-lg font-normal text-cyan-600 ml-1">BPM</span>
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 via-emerald-100/30 to-emerald-50 p-5 rounded-xl border border-emerald-100/50 shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <p className="text-sm font-medium text-gray-600">Average HRV</p>
                        </div>
                        <p className="text-3xl font-bold text-emerald-700">
                          {historicalData.avgHRV.toFixed(1)}
                          <span className="text-lg font-normal text-emerald-600 ml-1">ms</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Camera Feed and Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex flex-col space-y-4">
                {/* Header with Controls */}
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-700">Camera Feed</h2>
                    <button
                      onClick={() => setShowConfig((prev) => !prev)}
                      className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center space-x-1"
                    >
                      <span>{showConfig ? 'Hide Config' : 'Show Config'}</span>
                      <span>{showConfig ? '▼' : '▶'}</span>
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (!confirmedSubject) {
                          alert('Please input your Subject ID and confirm before proceeding with recording.');
                          return;
                        }
                        setIsRecording(prev => !prev);
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                        isRecording
                          ? 'bg-red-400 hover:bg-red-500 text-white'
                          : 'bg-cyan-400 hover:bg-cyan-500 text-white'
                      } ${!confirmedSubject ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isRecording ? '⏹ STOP' : '⏺ START'} RECORDING
                    </button>
                    <button
                      onClick={() => {
                        if (!confirmedSubject) {
                          alert('Please input your Subject ID and confirm before proceeding with sampling.');
                          return;
                        }
                        if (!isRecording) {
                          alert('Please start recording before starting sampling.');
                          return;
                        }
                        setIsSampling(prev => !prev);
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                        isSampling
                          ? 'bg-emerald-400 hover:bg-emerald-500 text-white'
                          : 'bg-gray-300 hover:bg-gray-400 text-white'
                      } ${!isRecording || !confirmedSubject ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSampling ? '⏹ STOP SAMPLING' : '⏺ START SAMPLING'}
                    </button>
                  </div>
                </div>

                {/* Camera Feed */}
                <div className="relative w-full rounded-lg overflow-hidden bg-gray-100">
                  <div className="flex items-center justify-center">
                    <div className="relative w-full max-w-[640px]">
                      <CameraFeed videoRef={videoRef} canvasRef={canvasRef} />
                      {!isRecording && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                          <div className="text-center">
                            <p className="text-white text-lg font-medium mb-2">Camera Feed</p>
                            <p className="text-white/80 text-sm">Click &quot;START RECORDING&quot; to begin</p>
                          </div>
                        </div>
                      )}
                      {isRecording && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                          <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                          RECORDING
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Config Panel */}
                {showConfig && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <SignalCombinationSelector
                      signalCombination={signalCombination}
                      setSignalCombination={setSignalCombination}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Chart and Metrics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Combined Chart and Metrics Block */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2">
                  <ChartComponent ppgData={ppgData} valleys={valleys} />
                </div>
                
                {/* Metrics Section */}
                <div className="space-y-4">
                  <MetricsCard
                    title="HEART RATE"
                    value={heartRate || {}}
                    confidence={heartRate?.confidence || 0}
                  />
                  <MetricsCard
                    title="HRV"
                    value={hrv || {}}
                    confidence={hrv?.confidence || 0}
                  />
                  <MetricsCard
                    title="SIGNAL QUALITY"
                    value={signalQuality || '--'}
                    confidence={qualityConfidence || 0}
                  />
                </div>
              </div>
              {/* Save Data Button */}
              <div className="mt-6">
                <button
                  onClick={pushDataToMongo}
                  className="w-full bg-cyan-400 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!confirmedSubject}
                >
                  Save Data to MongoDB
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
