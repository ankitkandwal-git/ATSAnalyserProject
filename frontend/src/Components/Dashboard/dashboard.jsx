import React from "react";
import Header from "./header";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import AnalysisResults from "./AnalysisResults";
import { analyseService } from "../../Services/analyseService";
import { FaFilePdf, FaChartLine, FaLightbulb, FaCheckCircle, FaExclamationCircle, FaClock } from "react-icons/fa";

const Dashboard = () => {
  const [stats, setStats] = useState([
    {
      icon: <FaFilePdf className="text-3xl text-violet-500" />,
      label: "Resumes Uploaded",
      value: 0,
    },
    {
      icon: <FaChartLine className="text-3xl text-green-500" />,
      label: "Avg. ATS Score",
      value: "0%",
    },
    {
      icon: <FaLightbulb className="text-3xl text-yellow-400" />,
      label: "AI Suggestions",
      value: 0,
    },
  ]);

  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await analyseService.getAnalysisHistory();
        const history = Array.isArray(response?.history) ? response.history : [];

        setAnalysisHistory(history);

        const uploadedCount = history.length;
        const averageScore = uploadedCount
          ? Math.round(history.reduce((sum, item) => sum + (item.atsScore || 0), 0) / uploadedCount)
          : 0;
        const suggestionCount = history.reduce((sum, item) => sum + (Array.isArray(item.improvements) ? item.improvements.length : 0), 0);

        setStats(prevStats => {
          const updatedStats = [...prevStats];
          updatedStats[0].value = uploadedCount;
          updatedStats[1].value = `${averageScore}%`;
          updatedStats[2].value = suggestionCount;
          return updatedStats;
        });
      } catch (error) {
        console.error('Failed to load analysis history:', error);
      }
    };

    loadHistory();
  }, []);

  const handleResumeAnalyzed = (analysisData) => {
    const { atsScore, improvements, fileName, analysis } = analysisData;
    setStats(prevStats => {
      const updatedStats = [...prevStats];
      updatedStats[0].value = (updatedStats[0].value || 0) + 1;
      updatedStats[1].value = `${atsScore || 0}%`;
      updatedStats[2].value = (Array.isArray(improvements) ? improvements.length : 0);
      return updatedStats;
    });
    const newAnalysis = {
      id: Date.now(),
      fileName: fileName || `Resume_${Date.now()}`,
      atsScore: atsScore || 0,
      improvements: Array.isArray(improvements) ? improvements : [],
      analysis: analysis || {
        atsScore: atsScore || 0,
        improvements: Array.isArray(improvements) ? improvements : [],
      },
      timestamp: new Date().toLocaleString(),
      status: atsScore >= 75 ? 'good' : atsScore >= 50 ? 'medium' : 'low',
    };
    setAnalysisHistory(prev => [newAnalysis, ...prev.filter(item => item.fileName !== newAnalysis.fileName)].slice(0, 10));
  };

  const handleViewDetails = (analysis) => {
    setSelectedAnalysis({ analysis: analysis.analysis || analysis });
    setShowAnalysisDetails(true);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#312e81]">
        <Header onResumeAnalyzed={handleResumeAnalyzed} />
        <main className="flex-1 p-6 overflow-y-auto md:p-10">
          <h1 className="mb-6 text-3xl font-bold text-white">Welcome to your Dashboard</h1>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-[#181c2f] rounded-2xl shadow-lg p-6 flex flex-col items-center gap-2 border border-violet-500/10 hover:border-violet-400/30 transition-all group"
              >
                <div className="mb-2 transition-transform group-hover:scale-110">{stat.icon}</div>
                <div className="text-2xl font-bold text-white transition-colors group-hover:text-violet-400">{stat.value}</div>
                <div className="text-sm transition-colors text-violet-200 group-hover:text-violet-100">{stat.label}</div>
              </div>
            ))}
          </div>
          <section className="bg-[#181c2f] rounded-2xl p-8 shadow-xl border border-violet-500/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                <FaClock className="text-violet-400" />
                Recent Analysis History
              </h2>
              <span className="px-3 py-1 text-sm font-semibold border rounded-full text-violet-300 bg-violet-500/10 border-violet-500/20">
                {analysisHistory.length} analyses
              </span>
            </div>

            {analysisHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FaFilePdf className="mb-4 text-6xl text-violet-400/30" />
                <p className="text-lg text-violet-200/60">No analyses yet</p>
                <p className="text-sm text-violet-200/40">Upload a resume to start analyzing</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analysisHistory.map((analysis) => {
                  const scoreColor = 
                    analysis.status === 'good' ? 'from-green-500 to-emerald-500' :
                    analysis.status === 'medium' ? 'from-yellow-500 to-orange-500' :
                    'from-red-500 to-pink-500';
                  
                  const scoreIcon = 
                    analysis.status === 'good' ? <FaCheckCircle className="text-green-400" /> :
                    analysis.status === 'medium' ? <FaExclamationCircle className="text-yellow-400" /> :
                    <FaExclamationCircle className="text-red-400" />;

                  return (
                    <div
                      key={analysis.id}
                      className="flex items-center gap-4 p-4 transition-all duration-300 border rounded-xl bg-[#0f1419]/50 border-violet-500/20 hover:bg-[#0f1419]/80 hover:border-violet-400/40 hover:shadow-lg hover:shadow-violet-500/10 group cursor-pointer"
                    >
                      {/* Score Badge */}
                      <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${scoreColor} flex items-center justify-center shadow-lg`}>
                        <span className="text-2xl font-bold text-white">{analysis.atsScore}%</span>
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-lg font-semibold text-white truncate">{analysis.fileName}</p>
                          {scoreIcon}
                        </div>
                        <p className="text-sm text-violet-200/60">{analysis.timestamp}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <FaLightbulb className="text-sm text-yellow-400" />
                          <p className="text-sm text-violet-300">
                            {analysis.improvements.length} {analysis.improvements.length === 1 ? 'suggestion' : 'suggestions'}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleViewDetails(analysis)}
                          className="px-4 py-2 text-sm font-semibold text-white transition-all border rounded-lg bg-violet-600/50 hover:bg-violet-600 border-violet-500/30 hover:border-violet-400"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
        <AnalysisResults
          results={selectedAnalysis}
          isOpen={showAnalysisDetails}
          onClose={() => setShowAnalysisDetails(false)}
        />
      </div>
    </div>
  );
};

export default Dashboard;