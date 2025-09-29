import React from 'react';

interface HistoricalData {
  avgHeartRate: number;
  avgHRV: number;
  lastAccess: Date | null;
}

interface UserPanelProps {
  isDarkMode: boolean;
  currentSubject: string;
  setCurrentSubject: (subject: string) => void;
  confirmedSubject: string;
  setConfirmedSubject: (subject: string) => void;
  historicalData: HistoricalData;
  isLoadingHistoricalData: boolean;
  showInstructions: boolean;
  setShowInstructions: (show: boolean) => void;
  onConfirmUser: () => void;
  onLogout: () => void;
}

const UserPanel: React.FC<UserPanelProps> = ({
  isDarkMode,
  currentSubject,
  setCurrentSubject,
  confirmedSubject,
  setConfirmedSubject,
  historicalData,
  isLoadingHistoricalData,
  showInstructions,
  setShowInstructions,
  onConfirmUser,
  onLogout,
}) => {
  return (
    <div className="mb-6">
      <div className={`${
        isDarkMode 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white/80 border-gray-200'
      } rounded-xl p-6 border backdrop-blur-sm`}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-end mb-4">
            <button 
              onClick={() => setShowInstructions(true)}
              className={`flex items-center text-sm px-3 py-1.5 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              How to use
            </button>
          </div>
          
          <div className="space-y-4">
            {!confirmedSubject ? (
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="text"
                  value={currentSubject}
                  onChange={(e) => setCurrentSubject(e.target.value)}
                  placeholder="Enter your name"
                  className={`flex-1 border ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-800/50 text-gray-200 focus:border-cyan-500' 
                      : 'border-gray-300 bg-white text-gray-700 focus:border-cyan-400'
                  } rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-cyan-400/20 text-sm transition-colors`}
                />
                <button
                  onClick={onConfirmUser}
                  className={`${
                    isDarkMode 
                      ? 'bg-cyan-600 hover:bg-cyan-700' 
                      : 'bg-cyan-500 hover:bg-cyan-600'
                  } text-white px-6 py-2.5 rounded-lg transition-colors text-sm font-medium`}
                >
                  Start
                </button>
              </div>
            ) : (
              <div className={`${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700/70' 
                  : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50/80'
              } rounded-lg p-4 border transition-colors`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">{confirmedSubject.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                        {confirmedSubject}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={onLogout}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                      isDarkMode 
                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {isLoadingHistoricalData ? (
                    <>
                      <div className={`${
                        isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-cyan-50 border-cyan-200'
                      } p-4 rounded-lg border transition-colors hover:shadow-md`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Heart Rate</p>
                        </div>
                        <div className="flex items-center justify-center h-8">
                          <div className={`w-4 h-4 rounded-full ${isDarkMode ? 'border-t-cyan-400' : 'border-t-cyan-600'} border-2 border-gray-300 animate-spin`}></div>
                        </div>
                      </div>
                      <div className={`${
                        isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-emerald-50 border-emerald-200'
                      } p-4 rounded-lg border transition-colors hover:shadow-md`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>HRV</p>
                        </div>
                        <div className="flex items-center justify-center h-8">
                          <div className={`w-4 h-4 rounded-full ${isDarkMode ? 'border-t-emerald-400' : 'border-t-emerald-600'} border-2 border-gray-300 animate-spin`}></div>
                        </div>
                      </div>
                      <div className={`${
                        isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-blue-50 border-blue-200'
                      } p-4 rounded-lg border transition-colors hover:shadow-md`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Last Session</p>
                        </div>
                        <div className="flex items-center justify-center h-8">
                          <div className={`w-4 h-4 rounded-full ${isDarkMode ? 'border-t-blue-400' : 'border-t-blue-600'} border-2 border-gray-300 animate-spin`}></div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`${
                        isDarkMode ? 'bg-gray-800/50 border-gray-600 hover:bg-gray-800/70' : 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100'
                      } p-4 rounded-lg border transition-colors hover:shadow-md`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Heart Rate</p>
                        </div>
                        <p className={`text-2xl font-semibold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                          {historicalData.avgHeartRate.toFixed(1)} <span className="text-sm font-normal text-gray-500">BPM</span>
                        </p>
                      </div>
                      <div className={`${
                        isDarkMode ? 'bg-gray-800/50 border-gray-600 hover:bg-gray-800/70' : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                      } p-4 rounded-lg border transition-colors hover:shadow-md`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>HRV</p>
                        </div>
                        <p className={`text-2xl font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          {historicalData.avgHRV.toFixed(1)} <span className="text-sm font-normal text-gray-500">ms</span>
                        </p>
                      </div>
                      <div className={`${
                        isDarkMode ? 'bg-gray-800/50 border-gray-600 hover:bg-gray-800/70' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                      } p-4 rounded-lg border transition-colors hover:shadow-md`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Last Session</p>
                        </div>
                        {historicalData.lastAccess ? (
                          <div>
                            <p className={`text-lg font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                              {new Date(historicalData.lastAccess).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                              <span className={`text-sm ml-2 font-normal ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{fontWeight: 'normal'}}>
                                {new Date(historicalData.lastAccess).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </p>
                          </div>
                        ) : (
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No data</p>
                        )}
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
  );
};

export default UserPanel;