
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyseService } from "../../Services/analyseService";
import AnalysisResults from "./AnalysisResults";

const Header = ({ onResumeAnalyzed }) => {
    const navigate = useNavigate();
    const fileInputRef = useRef();
    const [analysisResults, setAnalysisResults] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadFileName, setUploadFileName] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');
    const pollingRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    const startPollingJob = (jobId) => {
        setLoadingMessage('Waiting for analysis results...');

        const pollJobStatus = async () => {
            try {
                const jobStatus = await analyseService.getAnalysisJobStatus(jobId);

                if (jobStatus?.state === 'completed') {
                    stopPolling();
                    setAnalysisResults({ analysis: jobStatus.result });
                    setShowResults(true);

                    const analysis = jobStatus.result?.analysis || jobStatus.result || {};

                    if (onResumeAnalyzed) {
                        onResumeAnalyzed({
                            atsScore: analysis.atsScore,
                            improvements: analysis.improvements,
                            fileName: uploadFileName,
                            analysis,
                        });
                    }

                    setIsLoading(false);
                    setUploadFileName('');
                    setLoadingMessage('');
                }

                if (jobStatus?.state === 'failed') {
                    stopPolling();
                    setAnalysisResults({ error: jobStatus.reason });
                    setShowResults(true);
                    setIsLoading(false);
                    setUploadFileName('');
                    setLoadingMessage('');
                    return;
                }

                if (jobStatus?.state === 'waiting' || jobStatus?.state === 'active') {
                    setLoadingMessage(`Analysis ${jobStatus.state}...`);
                }
            } catch (error) {
                stopPolling();
                setIsLoading(false);
                setUploadFileName('');
                setLoadingMessage('');
                alert(error?.response?.data?.error || error.message || 'Unable to fetch analysis status.');
            }
        };

        pollJobStatus();
        pollingRef.current = setInterval(pollJobStatus, 2000);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setIsLoading(true);
        setUploadFileName(file.name);
        setLoadingMessage('Uploading resume...');
        
        try {
            const uploadResult = await analyseService.uploadResume(file);
            const extractedText = uploadResult?.extractedText;

            if (!extractedText) {
                throw new Error(uploadResult?.error || 'No extracted text returned from upload.');
            }

            setLoadingMessage('Submitting analysis job...');
            const queueResult = await analyseService.queueAnalysis(extractedText);

            if (queueResult?.jobId) {
                startPollingJob(queueResult.jobId);
            } else {
                throw new Error('No job ID returned from analysis queue.');
            }
        } catch (err) {
            stopPolling();
            setLoadingMessage('');
            alert('Analysis failed!');
        } finally {
            if (!pollingRef.current) {
                setIsLoading(false);
                setUploadFileName('');
            }
        }
    };
    return(
        <>
        <nav className="relative w-full bg-gradient-to-r from-[#050816] via-[#0f1419] to-[#050816] border-b border-violet-500/20 shadow-lg shadow-violet-900/20">
            <div className="flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-6 lg:px-8 sm:gap-6">
                {/* Logo Section */}
                <div className="flex flex-col items-center flex-shrink-0 gap-1 sm:items-start">
                    <h1 className="text-2xl font-bold text-transparent sm:text-3xl bg-gradient-to-r from-violet-400 via-purple-400 to-violet-500 bg-clip-text">
                        ATS Analyzer
                    </h1>
                    <p className="text-xs font-medium tracking-wide sm:text-sm text-violet-300/70">AI Powered Resume Screening</p>
                </div>

                {/* Search Bar */}
                <div className="flex-shrink-0 w-full sm:w-64 lg:w-80">
                    <div className="flex items-center bg-[#111827]/60 border border-violet-500/30 rounded-xl px-4 py-2.5 focus-within:bg-[#111827]/80 focus-within:border-violet-400 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.25)] transition-all duration-300">
                        <svg className="w-4 h-4 mr-2 text-violet-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" placeholder="Search resumes..." className="flex-1 text-sm text-white bg-transparent outline-none placeholder-gray-400/50" />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center flex-shrink-0 gap-3 sm:gap-4">
                    <input 
                        type="file" 
                        accept=".pdf" 
                        ref={fileInputRef} 
                        style={{display: 'none'}} 
                        onChange={handleFileChange}
                    />
                    <button 
                        onClick={handleUploadClick}
                        disabled={isLoading}
                        className={`px-4 py-2 text-sm font-semibold text-white transition-all duration-200 transform rounded-lg shadow-lg ${isLoading ? 'bg-gradient-to-r from-violet-500/50 to-purple-500/50 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-500/50 hover:scale-105'}`}>
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </span>
                        ) : (
                            'Upload Resume'
                        )}
                    </button>
                </div>

                {/* Profile Section */}
                <div className="flex items-center flex-shrink-0 gap-4 pl-4 border-l sm:gap-4 sm:pl-6 border-violet-500/20">
                    {/* Profile Card */}
                    <div className="items-center hidden gap-3 px-3 py-2 transition-all duration-300 border rounded-lg cursor-pointer sm:flex bg-violet-500/5 border-violet-400/20 hover:bg-violet-500/10 hover:border-violet-400/40 group">
                        <div className="flex flex-col items-end gap-0.5">
                            <span className="text-sm font-semibold text-white transition-colors group-hover:text-violet-300">John Doe</span>
                            <span className="text-xs transition-colors text-violet-300/60 group-hover:text-violet-300/80">Active</span>
                        </div>
                        <svg className="w-4 h-4 transition-colors text-violet-400/60 group-hover:text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>

                    {/* Profile Avatar */}
                    <div className="relative group">
                        <img src="/handsome-unshaven-european-man-has-serious-self-confident-expression-wears-glasses" alt="Profile" className="object-cover w-10 h-10 transition-all duration-300 border-2 rounded-full shadow-lg border-violet-400/40 group-hover:border-violet-300 shadow-violet-500/20 group-hover:shadow-violet-400/40" />
                        <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#050816] shadow-lg shadow-green-400/50"></div>
                    </div>

                    {/* Logout Button */}
                    <button onClick={handleLogout} className="px-3 py-1.5 text-white text-sm font-medium bg-gradient-to-r from-red-500/80 to-red-600/80 rounded-lg hover:from-red-500 hover:to-red-600 shadow-lg hover:shadow-red-500/50 transition-all duration-200 transform hover:scale-105 border border-red-400/20">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
        
        {/* Loading Toast */}
        {isLoading && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl bg-gradient-to-r from-violet-600 to-purple-600 border border-violet-400/50 animate-pulse">
                <svg className="w-5 h-5 animate-spin text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-white">{loadingMessage || 'Analyzing Resume...'}</p>
                    <p className="text-xs text-violet-200">{uploadFileName}</p>
                </div>
            </div>
        )}

        <AnalysisResults 
            results={analysisResults} 
            isOpen={showResults} 
            onClose={() => setShowResults(false)} 
        />
        </>
    )
}

export default Header;