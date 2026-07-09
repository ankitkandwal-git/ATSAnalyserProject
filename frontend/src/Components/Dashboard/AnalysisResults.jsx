import React from "react";
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaLightbulb } from "react-icons/fa";

const AnalysisResults = ({ results, isOpen, onClose }) => {
  if (!isOpen || !results) return null;

  if (results.error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl bg-gradient-to-br from-[#0f1419] to-[#1a1f3a] rounded-2xl shadow-2xl border border-violet-500/20 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-violet-500/20 bg-[#050816]">
            <h2 className="text-2xl font-bold text-white">Resume Analysis Failed</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
          <div className="p-6">
            <div className="rounded-xl border border-red-400/20 bg-red-500/5 p-5">
              <div className="flex items-center gap-3 mb-3">
                <FaExclamationCircle className="text-red-400 text-xl" />
                <h3 className="text-lg font-semibold text-red-200">Failure Reason</h3>
              </div>
              <p className="text-red-100/90 leading-relaxed">{results.error}</p>
            </div>
          </div>
          <div className="p-6 border-t border-violet-500/20 bg-[#050816]">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-lg hover:from-violet-500 hover:to-purple-500 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { analysis } = results;
  if (!analysis) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-gradient-to-br from-[#0f1419] to-[#1a1f3a] rounded-2xl shadow-2xl border border-violet-500/20 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-violet-500/20 bg-[#050816]">
          <h2 className="text-2xl font-bold text-white">Resume Analysis Results</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {analysis.atsScore && (
            <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl p-6 border border-violet-400/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" />
                  ATS Score
                </h3>
                <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text">
                  {analysis.atsScore}%
                </div>
              </div>
              <p className="text-sm text-violet-200">
                {analysis.atsScore >= 80
                  ? "Excellent! Your resume is well-optimized for ATS systems."
                  : analysis.atsScore >= 60
                  ? "Good! There's room for improvement to increase ATS compatibility."
                  : "Your resume needs significant updates to improve ATS compatibility."}
              </p>
            </div>
          )}
          {analysis.summary && (
            <div className="bg-violet-500/5 rounded-xl p-6 border border-violet-400/20">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <FaLightbulb className="text-yellow-400" />
                Summary
              </h3>
              <p className="text-violet-100 leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {analysis.strengths && analysis.strengths.length > 0 && (
            <div className="bg-green-500/5 rounded-xl p-6 border border-green-400/20">
              <h3 className="text-lg font-semibold text-green-300 mb-3 flex items-center gap-2">
                <FaCheckCircle className="text-green-400" />
                Strengths
              </h3>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-green-100">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.weaknesses && analysis.weaknesses.length > 0 && (
            <div className="bg-red-500/5 rounded-xl p-6 border border-red-400/20">
              <h3 className="text-lg font-semibold text-red-300 mb-3 flex items-center gap-2">
                <FaExclamationCircle className="text-red-400" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {analysis.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">✕</span>
                    <span className="text-red-100">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {analysis.improvements && analysis.improvements.length > 0 && (
            <div className="bg-blue-500/5 rounded-xl p-6 border border-blue-400/20">
              <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <FaLightbulb className="text-blue-400" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {analysis.improvements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">→</span>
                    <span className="text-blue-100">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.keywords && analysis.keywords.length > 0 && (
            <div className="bg-purple-500/5 rounded-xl p-6 border border-purple-400/20">
              <h3 className="text-lg font-semibold text-purple-300 mb-3">Key Skills Detected</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30 hover:bg-purple-500/30 transition-colors"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 flex gap-3 p-6 border-t border-violet-500/20 bg-[#050816]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-lg hover:from-violet-500 hover:to-purple-500 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
