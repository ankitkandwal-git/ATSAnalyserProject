
import React from "react";
import { FaTachometerAlt, FaFileAlt, FaBriefcase, FaCog } from "react-icons/fa";


const Sidebar = () => (
  <aside className="h-screen w-64 bg-[#050816] text-white flex flex-col py-8 px-4">
    {/* Logo Section */}
    <div className="flex flex-col items-center gap-1 pb-6 mb-10 border-b border-violet-500/20">
      <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-violet-400 via-purple-400 to-violet-500 bg-clip-text">
        ATS Analyzer
      </h1>
      <p className="text-xs font-medium tracking-wide text-violet-300/70">AI Powered Ranking</p>
    </div>
    
    <nav className="flex flex-col gap-6">
      <a href="#" className="hover:bg-[#1a1a2e] rounded-lg px-4 py-2 transition flex items-center gap-3">
        <FaTachometerAlt className="text-lg" />
        Dashboard
      </a>
      <a href="#" className="hover:bg-[#1a1a2e] rounded-lg px-4 py-2 transition flex items-center gap-3">
        <FaFileAlt className="text-lg" />
        Resume Analyzer
      </a>
      <a href="#" className="hover:bg-[#1a1a2e] rounded-lg px-4 py-2 transition flex items-center gap-3">
        <FaBriefcase className="text-lg" />
        Job Match
      </a>
      <a href="#" className="hover:bg-[#1a1a2e] rounded-lg px-4 py-2 transition flex items-center gap-3">
        <FaCog className="text-lg" />
        Setting
      </a>
    </nav>
  </aside>
);

export default Sidebar;