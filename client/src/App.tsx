import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import DevOpsVisualizer from "./pages/DevOpsVisualizer";
import Simulator from "./pages/Simulator";
import ParameterStore from "./pages/ParameterStore";
import QueryResolver from "./pages/QueryResolver";
import { 
  LayoutDashboard, FileText, Trophy, Cpu, 
  Settings, BarChart3, HeartPulse, Terminal, 
  Sun, Moon, Upload, Search, Download, ExternalLink, 
  Activity, Play, CheckCircle2, XCircle, AlertCircle, Clock,
  MessageSquare, Trash2, Plus, X
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "./main";

type Tab = "dashboard" | "submissions" | "challenges" | "scorers" | "configuration" | "analytics" | "health" | "logs" | "resolver";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [currentTime, setCurrentTime] = useState("");
  
  // Submissions ledger filter states (matching the mockup exactly!)
  const [searchQuery, setSearchQuery] = useState("");
  const [challengeFilter, setChallengeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Selected submission details drawer state
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  // Manual Submission form state overrides
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualChallengeId, setManualChallengeId] = useState<number | "">("");
  const [manualLanguage, setManualLanguage] = useState("java");
  const [manualCode, setManualCode] = useState("");
  const [manualFormError, setManualFormError] = useState("");

  // Synchronize clock dynamically
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format: 2 Jun, 09:52:37 pm IST
      const day = now.getDate();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[now.getMonth()];
      
      let hours = now.getHours();
      const ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12; // hour '0' should be '12'
      
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      
      // We'll hardcode IST as the localized zone for layout similarity
      setCurrentTime(`${day} ${month}, ${String(hours).padStart(2, "0")}:${minutes}:${seconds} ${ampm} IST`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Theme Sync effect
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [theme]);

  // Queries for data
  const { data: challenges } = useQuery<any[]>({
    queryKey: ["/api/challenges"]
  });

  // Sync default manualChallengeId once challenges load
  useEffect(() => {
    if (challenges && challenges.length > 0 && manualChallengeId === "") {
      setManualChallengeId(challenges[0].id);
    }
  }, [challenges]);

  const { data: submissions } = useQuery<any[]>({
    queryKey: ["/api/submissions"],
    refetchInterval: 3000
  });

  const { data: latestMetrics } = useQuery<any>({
    queryKey: ["/api/metrics/latest"],
    refetchInterval: 3000
  });

  // Solution file upload mutation
  const uploadSolution = useMutation({
    mutationFn: async ({ challengeId, language, code }: { challengeId: number, language: string, code: string }) => {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, language, code })
      });
      if (!response.ok) throw new Error("File submission failed.");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      setActiveTab("submissions"); // Switch to submissions tab immediately
    }
  });

  // Submission delete mutation
  const deleteSubmission = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/submissions/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Submission deletion failed.");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      if (selectedSub) {
        setSelectedSub(null);
      }
    }
  });

  // Submit manual code solution form
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualFormError("");
    
    if (!manualChallengeId) {
      setManualFormError("Please select an active target challenge.");
      return;
    }
    if (!manualCode.trim()) {
      setManualFormError("Please enter some optimized solution code payload.");
      return;
    }

    uploadSolution.mutate({
      challengeId: Number(manualChallengeId),
      language: manualLanguage,
      code: manualCode
    }, {
      onSuccess: () => {
        setManualCode("");
        setShowManualForm(false);
      }
    });
  };

  // Handle uploaded files parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !challenges || challenges.length === 0) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      
      // Deduce programming language from extension
      let lang = "java";
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "py") lang = "python";
      else if (ext === "ts" || ext === "js") lang = "typescript";

      // Default to the first challenge for uploaded files
      uploadSolution.mutate({
        challengeId: challenges[0].id,
        language: lang,
        code: content
      });
    };
    reader.readAsText(file);
  };

  // Filter submissions dynamically (matching submissions ledger mock search)
  const filteredSubmissions = submissions?.filter(sub => {
    const matchesSearch = sub.id.toString().includes(searchQuery) || 
                          sub.language.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesChallenge = challengeFilter === "all" || sub.challengeId.toString() === challengeFilter;
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    
    return matchesSearch && matchesChallenge && matchesStatus;
  }) || [];

  // Export submissions logic
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Submission ID,Challenge,Status,Score,Duration"].join(",") + "\n"
      + filteredSubmissions.map(sub => {
          const challengeName = challenges?.find(c => c.id === sub.challengeId)?.name || "Challenge";
          return `#SUB-2026-${sub.id},${challengeName},${sub.status},${sub.score.toFixed(2)},${((sub.processingTimeMs || 0)/1000).toFixed(1)}s`;
        }).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Marathon_Submissions_Ledger.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex antialiased transition-colors duration-300">
      
      {/* ========================================================================== */}
      {/* LEFT SIDEBAR NAVIGATION PANEL (Exactly matches the Mockup design!) */}
      {/* ========================================================================== */}
      <aside className="w-64 border-r border-border bg-card flex flex-col justify-between shrink-0">
        <div className="flex flex-col">
          {/* Logo Brand Header */}
          <div className="h-16 border-b border-border flex items-center px-6">
            <span className="font-sans font-bold tracking-tight text-foreground text-lg">
              TC Fargate Scorer
            </span>
          </div>

          {/* Navigation group */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "dashboard"
                  ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("submissions")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "submissions"
                  ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <FileText className="h-4.5 w-4.5" />
              <span>Submissions</span>
            </button>

            <button
              onClick={() => setActiveTab("challenges")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "challenges"
                  ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Trophy className="h-4.5 w-4.5" />
              <span>Challenges</span>
            </button>

            <button
              onClick={() => setActiveTab("scorers")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "scorers"
                  ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Cpu className="h-4.5 w-4.5" />
              <span>Scorers</span>
            </button>

            <button
              onClick={() => setActiveTab("configuration")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "configuration"
                  ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Settings className="h-4.5 w-4.5" />
              <span>Configuration</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "analytics"
                  ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <BarChart3 className="h-4.5 w-4.5" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab("resolver")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "resolver"
                  ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <MessageSquare className="h-4.5 w-4.5" />
              <span>Query Resolver</span>
            </button>

            {/* SYSTEM Subgroup Header */}
            <div className="pt-6 pb-2 px-3">
              <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                SYSTEM
              </span>
            </div>

            <button
              onClick={() => setActiveTab("health")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "health"
                  ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <HeartPulse className="h-4.5 w-4.5" />
              <span>Health Monitor</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "logs"
                  ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Terminal className="h-4.5 w-4.5" />
              <span>Logs</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer options */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          {/* Theme Toggler buttons */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted/60 border border-border text-foreground hover:bg-muted transition-all"
            title="Toggle Theme Mode"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-violet-600" />}
          </button>

          {/* Solution File Uploader button */}
          <label className="flex items-center gap-2 px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs rounded-lg cursor-pointer transition-all shadow-md">
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Solution</span>
            <input 
              type="file" 
              accept=".java,.py,.ts,.js,.cpp" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>
        </div>
      </aside>

      {/* ========================================================================== */}
      {/* RIGHT MAIN FRAME AREA */}
      {/* ========================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight uppercase tracking-wide">
              {activeTab === "dashboard" && "Dashboard Metrics"}
              {activeTab === "submissions" && "Submissions Ledger"}
              {activeTab === "challenges" && "Challenges spec"}
              {activeTab === "scorers" && "Active Scorers"}
              {activeTab === "configuration" && "AWS Configuration"}
              {activeTab === "analytics" && "Advanced Analytics"}
              {activeTab === "health" && "Health Monitor"}
              {activeTab === "logs" && "Logs Console"}
              {activeTab === "resolver" && "Query Resolver Chat"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {activeTab === "dashboard" && "Real-time systems load aggregates"}
              {activeTab === "submissions" && "Manage and monitor all submission scoring activities"}
              {activeTab === "challenges" && "Active programming solver challenges"}
              {activeTab === "scorers" && "AWS ECR deployment task runner instances"}
              {activeTab === "configuration" && "Live AWS Systems Manager Parameter parameters"}
              {activeTab === "analytics" && "Historical performance distributions"}
              {activeTab === "health" && "KafkaMSK and AWS Lambda execution telemetry"}
              {activeTab === "logs" && "High-performance streaming server logs"}
              {activeTab === "resolver" && "Analyze solution payloads with formal predicate logic and mathematical proofs"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Clock Widget */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/40 border border-border px-3 py-1.5 rounded-lg">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{currentTime}</span>
            </div>

            {/* Status Pill (Exactly matches the Mockup design!) */}
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              System Online
            </div>
          </div>
        </header>

        {/* Tab content viewports */}
        <main className="flex-1 p-6 overflow-y-auto">
          
          {/* Tab 1: Dashboard */}
          {activeTab === "dashboard" && <Dashboard />}

          {/* Tab 2: Submissions (Detailed table from mockup!) */}
          {activeTab === "submissions" && (
            <div className="space-y-6">
              {/* Filters toolbar panel */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  
                  {/* Search Bar Input */}
                  <div className="relative min-w-[200px] flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search submissions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Challenge Filter Dropdown */}
                  <select 
                    value={challengeFilter}
                    onChange={(e) => setChallengeFilter(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="all">All Challenges</option>
                    {challenges?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  {/* Status Filter Dropdown */}
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="all">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="bootstrapping">Bootstrapping</option>
                    <option value="running_examples">Running Examples</option>
                    <option value="running_provisional">Running Provisional</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="flex items-center justify-center gap-2 border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {showManualForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    <span>{showManualForm ? "Hide Form" : "Add Submission"}</span>
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 border border-border bg-background hover:bg-muted text-foreground px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Manual Submission Form block */}
              {showManualForm && (
                <form 
                  onSubmit={handleManualSubmit}
                  className="glass-panel border border-primary/20 rounded-xl p-5 space-y-4 animate-slide-in text-foreground"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Plus className="h-4 w-4 text-primary" />
                      Deploy New Solution Submission
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowManualForm(false)}
                      className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                    >
                      Close Form
                    </button>
                  </div>

                  {manualFormError && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{manualFormError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase font-mono">
                        Select Scorer Target Challenge
                      </label>
                      <select
                        value={manualChallengeId}
                        onChange={(e) => setManualChallengeId(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                        required
                      >
                        {challenges?.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.complexity})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase font-mono">
                        Programming Language Environment
                      </label>
                      <select
                        value={manualLanguage}
                        onChange={(e) => setManualLanguage(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                        required
                      >
                        <option value="java">Java 21 (OpenJDK Hotspot)</option>
                        <option value="python">Python 3.12 (CPython Runtime)</option>
                        <option value="typescript">TypeScript 5.3 (Node.js ESM runner)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase font-mono">
                      Solution Code Payload
                    </label>
                    <textarea
                      placeholder={`// Type or paste your optimized solution here...\npublic class Solver {\n    public static void main(String[] args) {\n        // Your high-performance code\n    }\n}`}
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      rows={8}
                      className="w-full bg-background border border-border rounded-lg p-3 text-xs text-foreground font-mono focus:outline-none focus:border-primary resize-y"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowManualForm(false)}
                      className="bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-semibold px-4 py-2 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploadSolution.isPending}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-1.5"
                    >
                      {uploadSolution.isPending ? "Deploying Container..." : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Submit & Score solution</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Submissions Ledger Ledger Table */}
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Challenge</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Submitted</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {filteredSubmissions.length > 0 ? (
                      filteredSubmissions.map((sub: any) => {
                        const challengeName = challenges?.find(c => c.id === sub.challengeId)?.name || "Challenge";
                        return (
                          <tr key={sub.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4 font-mono font-semibold text-foreground">
                              #SUB-2026-{String(sub.id).padStart(3, "0")}
                            </td>
                            <td className="px-6 py-4 text-foreground font-semibold">{challengeName}</td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full inline-block ${
                                sub.status === "completed" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
                                sub.status === "failed" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                                "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 animate-pulse"
                              }`}>
                                {sub.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-foreground">
                              {sub.status === "completed" ? sub.score.toFixed(2) : "-"}
                            </td>
                            <td className="px-6 py-4 font-mono text-muted-foreground">
                              {sub.processingTimeMs > 0 ? `${((sub.processingTimeMs || 0)/1000).toFixed(1)}s` : "-"}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground font-mono">
                              {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 text-right flex items-center justify-end gap-3.5">
                              <button
                                onClick={() => setSelectedSub(sub)}
                                className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                              >
                                <span>View Details</span>
                                <ExternalLink className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete submission #SUB-2026-${sub.id}?`)) {
                                    deleteSubmission.mutate(sub.id);
                                  }
                                }}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10"
                                title="Delete submission record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-mono">
                          No submissions matched filter bounds.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Challenges */}
          {activeTab === "challenges" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {challenges?.map((c) => (
                  <div key={c.id} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 hover:border-primary/30 transition-all flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full inline-block ${
                        c.complexity === "Expert" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                        c.complexity === "Hard" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                        "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      }`}>
                        {c.complexity}
                      </span>
                      <h3 className="text-base font-bold text-foreground">{c.name}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                    </div>
                    <div className="border-t border-border pt-4 mt-4 space-y-2 font-mono text-[10px] text-muted-foreground">
                      <div><strong>INPUT SPEC:</strong> {c.inputSpec}</div>
                      <div><strong>OUTPUT SPEC:</strong> {c.inputSpec}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Scorers (ECR Task details) */}
          {activeTab === "scorers" && <DevOpsVisualizer />}

          {/* Tab 5: Configuration */}
          {activeTab === "configuration" && <ParameterStore />}

          {/* Tab 6: Analytics */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="glass-panel-accent rounded-xl p-5 border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Aggregated Cluster Diagnostics</h3>
                  <p className="text-xs text-muted-foreground mt-1">Average pipeline speeds, success matrices, and cost ratios.</p>
                </div>
              </div>
              <Dashboard />
            </div>
          )}

          {/* Tab 7: Health Monitor */}
          {activeTab === "health" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase block">Kafka Ingestion MSK Queue</span>
                    <h3 className="text-3xl font-bold text-foreground">
                      {latestMetrics?.kafkaQueueLength || 0}
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded w-fit mt-4">BACKLOG STABLE</span>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase block">SSM Router Latency</span>
                    <h3 className="text-3xl font-bold text-foreground">
                      {latestMetrics?.apiLatencyMs || 25}ms
                    </h3>
                  </div>
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded w-fit mt-4">OPTIMAL</span>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase block">ECR Pull Timing</span>
                    <h3 className="text-3xl font-bold text-foreground">
                      &lt;24s
                    </h3>
                  </div>
                  <span className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded w-fit mt-4">WARM BOOTED</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 8: Logs */}
          {activeTab === "logs" && <Simulator />}

          {/* Tab 9: Query Resolver */}
          {activeTab === "resolver" && <QueryResolver />}
        </main>
      </div>

      {/* ========================================================================== */}
      {/* SOLUTION DETAILS SIDE DRAWER POPUP */}
      {/* ========================================================================== */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end">
          <div className="w-full max-w-xl h-full bg-card border-l border-border shadow-2xl flex flex-col justify-between">
            <div className="flex flex-col flex-1 min-h-0">
              {/* Drawer Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Submission #SUB-2026-{selectedSub.id}</h3>
                  <span className="text-xs text-muted-foreground">Evaluation logs and scoring payload details.</span>
                </div>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="text-muted-foreground hover:text-foreground text-sm font-semibold"
                >
                  Close
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Stats block */}
                <div className="grid grid-cols-3 gap-4 font-mono text-center">
                  <div className="bg-muted/40 border border-border p-3 rounded-lg">
                    <span className="text-[9px] text-muted-foreground uppercase block">Score</span>
                    <span className="text-base font-bold text-foreground">{selectedSub.score.toFixed(2)}</span>
                  </div>
                  <div className="bg-muted/40 border border-border p-3 rounded-lg">
                    <span className="text-[9px] text-muted-foreground uppercase block">Duration</span>
                    <span className="text-base font-bold text-foreground">
                      {selectedSub.processingTimeMs > 0 ? `${((selectedSub.processingTimeMs)/1000).toFixed(1)}s` : "-"}
                    </span>
                  </div>
                  <div className="bg-muted/40 border border-border p-3 rounded-lg">
                    <span className="text-[9px] text-muted-foreground uppercase block">Status</span>
                    <span className="text-xs font-bold text-emerald-400 block mt-1 uppercase">
                      {selectedSub.status}
                    </span>
                  </div>
                </div>

                {/* Code segment */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block">Payload Source Code</span>
                  <pre className="bg-black/80 text-white font-mono text-[10px] p-4 rounded-lg overflow-x-auto max-h-[180px]">
                    <code>{selectedSub.code}</code>
                  </pre>
                </div>

                {/* Telemetry Console */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block">Container Telemetry logs</span>
                  <div className="bg-black/90 p-4 rounded-lg font-mono text-[9px] space-y-1.5 max-h-[220px] overflow-y-auto">
                    {selectedSub.logs?.map((l: string, idx: number) => (
                      <div key={idx} className="text-cyan-400 whitespace-pre-wrap">{l}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
