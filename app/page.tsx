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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSampling, setIsSampling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [signalCombination, setSignalCombination] = useState('default');
  const [showConfig, setShowConfig] = useState(false);
  const [currentSubject, setCurrentSubject] = useState('');
  const [confirmedSubject, setConfirmedSubject] = useState('');
  const [isLoadingHistoricalData, setIsLoadingHistoricalData] = useState(false);
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
      
      setIsLoadingHistoricalData(true);
      
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
      } finally {
        setIsLoadingHistoricalData(false);
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
    setUploadSuccess(false);
    
    if (ppgData.length === 0) {
      console.warn('No PPG data to send to MongoDB');
      alert('Cannot send data to MongoDB: No PPG data available. Please start recording first.');
      setIsUploading(false);
      return;
    }
    
    if (ppgData.length < 50) {
      console.warn('Not enough PPG data points to send to MongoDB');
      alert(`Cannot send data to MongoDB: Not enough PPG data (${ppgData.length} points). Please record for a longer duration.`);
      setIsUploading(false);
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
        setUploadSuccess(true);
        
        // Reset to normal state after 3 seconds
        setTimeout(() => {
          setUploadSuccess(false);
          setIsUploading(false);
        }, 3000);
      } else {
        console.error('❌ Upload failed:', result.error);
        setIsUploading(false);
      }
    } catch (error) {
      console.error('🚨 Network error - failed to save data:', error);
      setIsUploading(false);
    }
  };

  // Reset upload states when recording starts again
  useEffect(() => {
    if (isRecording) {
      setUploadSuccess(false);
      setIsUploading(false);
    }
  }, [isRecording]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-gray-800 shadow-md' : 'bg-white shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>HeartLens</h1>
          
          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${
              isDarkMode 
                ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* User Panel - Moved to top */}
        <div className="mb-8">
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-8 border`}>
            <div className="max-w-3xl mx-auto">
              <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-6`}>Welcome to HeartLens</h2>
              <div className="space-y-6">
                {!confirmedSubject ? (
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={currentSubject}
                      onChange={(e) => setCurrentSubject(e.target.value)}
                      placeholder="Tell us your name"
                      className={`flex-1 border ${
                        isDarkMode 
                          ? 'border-gray-700 bg-gray-700/50 text-gray-200 focus:border-cyan-500' 
                          : 'border-gray-200 bg-white/80 text-gray-700 focus:border-cyan-400'
                      } rounded-xl px-6 py-3 backdrop-blur-sm focus:ring-1 focus:ring-cyan-400 text-lg`}
                    />
                    <button
                      onClick={confirmUser}
                      className={`${
                        isDarkMode 
                          ? 'bg-cyan-600 hover:bg-cyan-700' 
                          : 'bg-cyan-500 hover:bg-cyan-600'
                      } text-white px-8 py-3 rounded-xl transition-all duration-300 text-lg font-medium shadow-sm hover:shadow`}
                    >
                      Confirm User
                    </button>
                  </div>
                ) : (
                  <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-br from-gray-50 to-white border-gray-100'} rounded-xl p-6 border`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 via-cyan-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-md ring-2 ring-white">
                          <span className="text-white text-2xl font-bold">{confirmedSubject.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="space-y-1">
                          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Welcome!</h3>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Logged in as <span className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{confirmedSubject}</span></p>
                          </div>
                        </div>
                      </div>
                      {isLoadingHistoricalData ? (
                        <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-600' : 'bg-white/80 border-gray-100'} px-5 py-3 rounded-xl border text-right shadow-sm min-w-[150px] h-16 flex items-center justify-center`}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded-full ${isDarkMode ? 'border-t-cyan-400' : 'border-t-cyan-600'} border-2 border-gray-200 animate-spin`}></div>
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</span>
                          </div>
                        </div>
                      ) : (
                        historicalData.lastAccess && (
                          <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-600' : 'bg-white/80 border-gray-100'} px-5 py-3 rounded-xl border text-right shadow-sm`}>
                            <p className="text-sm font-medium text-cyan-500 mb-1">Last Session</p>
                            <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{new Date(historicalData.lastAccess).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}</p>
                          </div>
                        )
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {isLoadingHistoricalData ? (
                        <>
                          <div className={`${isDarkMode ? 'bg-gray-800/50 border-cyan-900/50' : 'bg-gradient-to-br from-cyan-50 via-cyan-100/30 to-cyan-50 border-cyan-100/50'} p-5 rounded-xl border shadow-sm flex flex-col`}>
                            <div className="flex items-center space-x-2 mb-2">
                              <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Average Heart Rate</p>
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                              <div className="flex items-center space-x-2">
                                <div className={`w-4 h-4 rounded-full ${isDarkMode ? 'border-t-cyan-400' : 'border-t-cyan-600'} border-2 border-gray-200 animate-spin`}></div>
                              </div>
                            </div>
                          </div>
                          <div className={`${isDarkMode ? 'bg-gray-800/50 border-emerald-900/50' : 'bg-gradient-to-br from-emerald-50 via-emerald-100/30 to-emerald-50 border-emerald-100/50'} p-5 rounded-xl border shadow-sm flex flex-col`}>
                            <div className="flex items-center space-x-2 mb-2">
                              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Average HRV</p>
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                              <div className="flex items-center space-x-2">
                                <div className={`w-4 h-4 rounded-full ${isDarkMode ? 'border-t-emerald-400' : 'border-t-emerald-600'} border-2 border-gray-200 animate-spin`}></div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={`${isDarkMode ? 'bg-gray-800/50 border-cyan-900/50' : 'bg-gradient-to-br from-cyan-50 via-cyan-100/30 to-cyan-50 border-cyan-100/50'} p-5 rounded-xl border shadow-sm`}>
                            <div className="flex items-center space-x-2 mb-2">
                              <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Average Heart Rate</p>
                            </div>
                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                              {historicalData.avgHeartRate.toFixed(1)}
                              <span className={`text-lg font-normal ${isDarkMode ? 'text-cyan-500' : 'text-cyan-600'} ml-1`}>BPM</span>
                            </p>
                          </div>
                          <div className={`${isDarkMode ? 'bg-gray-800/50 border-emerald-900/50' : 'bg-gradient-to-br from-emerald-50 via-emerald-100/30 to-emerald-50 border-emerald-100/50'} p-5 rounded-xl border shadow-sm`}>
                            <div className="flex items-center space-x-2 mb-2">
                              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Average HRV</p>
                            </div>
                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                              {historicalData.avgHRV.toFixed(1)}
                              <span className={`text-lg font-normal ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'} ml-1`}>ms</span>
                            </p>
                          </div>
                        </>
                      )}
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
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-6 border`}>
              <div className="flex flex-col space-y-4">
                {/* Header with Controls */}
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Camera Feed</h2>
                    <button
                      onClick={() => setShowConfig((prev) => !prev)}
                      className={`text-sm ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'} flex items-center space-x-1`}
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
                          ? isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-400 hover:bg-red-500 text-white'
                          : isDarkMode ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-cyan-400 hover:bg-cyan-500 text-white'
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
                          ? isDarkMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-400 hover:bg-emerald-500 text-white'
                          : isDarkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-white'
                      } ${!isRecording || !confirmedSubject ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSampling ? '⏹ STOP SAMPLING' : '⏺ START SAMPLING'}
                    </button>
                  </div>
                </div>

                {/* Camera Feed */}
                <div className={`relative w-full rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
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
                  <div className={`mt-2 p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
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
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-6 border`}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Chart Section */}
                <div className="lg:col-span-2 h-full">
                  <ChartComponent ppgData={ppgData} valleys={valleys} isDarkMode={isDarkMode} />
                </div>
                
                {/* Metrics Section */}
                <div className="space-y-4 h-full flex flex-col">
                  <MetricsCard
                    title="HEART RATE"
                    value={heartRate || {}}
                    confidence={heartRate?.confidence || 0}
                    isDarkMode={isDarkMode}
                  />
                  <MetricsCard
                    title="HRV"
                    value={hrv || {}}
                    confidence={hrv?.confidence || 0}
                    isDarkMode={isDarkMode}
                  />
                  <MetricsCard
                    title="SIGNAL QUALITY"
                    value={signalQuality || '--'}
                    confidence={qualityConfidence || 0}
                    isDarkMode={isDarkMode}
                  />
                  
                  {/* Save Data Button - Moved inside metrics column for better layout */}
                  <div className="mt-auto pt-4">
                    <button
                      onClick={pushDataToMongo}
                      className={`w-full px-6 py-3 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
                        uploadSuccess
                          ? isDarkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                          : isUploading
                          ? isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-400 text-white'
                          : isDarkMode ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-cyan-400 hover:bg-cyan-500 text-white'
                      }`}
                      disabled={!confirmedSubject || isUploading || uploadSuccess}
                    >
                      {uploadSuccess 
                        ? '✅ Data successfully uploaded!'
                        : isUploading 
                        ? 'Loading...' 
                        : 'Save Data to MongoDB'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
