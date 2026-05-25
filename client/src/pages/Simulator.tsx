import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../main";
import { 
  Play, Terminal as TerminalIcon, Sparkles, 
  Layers, Code, CheckCircle, RefreshCw, Cpu, Upload
} from "lucide-react";

// Pre-loaded elegant mock solution codes to show in the code editor
const DEFAULT_CODES: Record<string, string> = {
  "BioSlime Survival": `package com.topcoder.marathon.solution;

import java.util.*;

/**
 * BioSlime Survival Solver - Standard Contestant Submission.
 * Steers the growth of slime colonies using local density gradient paths.
 */
public class Solution {
    public int[] getMoveDirection(int[][] grid, int currentColonies) {
        int bestR = 0, bestC = 0;
        double maxScore = -1.0;
        
        // Dynamic path optimization based on local cellular automata density
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[r].length; c++) {
                if (grid[r][c] == 0) {
                    double density = calculateLocalDensity(grid, r, c);
                    if (density > maxScore) {
                        maxScore = density;
                        bestR = r;
                        bestC = c;
                    }
                }
            }
        }
        return new int[]{bestR, bestC};
    }

    private double calculateLocalDensity(int[][] grid, int r, int c) {
        int count = 0;
        for (int dr = -1; dr <= 1; dr++) {
            for (int dc = -1; dc <= 1; dc++) {
                int nr = (r + dr + grid.length) % grid.length;
                int nc = (c + dc + grid.length) % grid.length;
                if (grid[nr][nc] == 1) count++;
            }
        }
        return count / 8.0;
    }
}`,
  "AstroRouter Routing": `import typing

class AstroRouterSolver:
    """
    AstroRouter Constellation Packet Router.
    Calculates shortest routing vectors under dynamic solar decay.
    """
    def compute_routing_path(self, nodes: list, latencies: list, solar_matrix: list) -> list:
        # Construct graph matrices with solar weather degradation indices
        n = len(nodes)
        path = [0]
        visited = {0}
        
        while len(visited) < n:
            curr = path[-1]
            next_node = -1
            best_weight = float('inf')
            
            for neighbor in range(n):
                if neighbor not in visited:
                    base = latencies[curr][neighbor]
                    solar_decay = solar_matrix[neighbor]
                    effective_lat = base * (1.0 + solar_decay)
                    
                    if effective_lat < best_weight:
                        best_weight = effective_lat
                        next_node = neighbor
            
            if next_node == -1:
                break
            visited.add(next_node)
            path.append(next_node)
            
        return path`,
  "MegaGrid Resource Optimizer": `export class MegaGridOptimizer {
  /**
   * MegaGrid Resource Balancer.
   * Adjusts generator loads against industrial dynamic demand surges.
   */
  optimizeDistribution(generators: any[], loads: number[]): number[] {
    const totalDemand = loads.reduce((a, b) => a + b, 0);
    const outputRatios = new Array(generators.length).fill(0);
    
    // Sort energy sources based on marginal cost configurations
    const sortedIdxs = generators
      .map((g, i) => ({ i, cost: g.cost, max: g.capacity }))
      .sort((a, b) => a.cost - b.cost);

    let remainingDemand = totalDemand;
    for (const { i, max } of sortedIdxs) {
      const take = Math.min(remainingDemand, max);
      outputRatios[i] = take / max;
      remainingDemand -= take;
      if (remainingDemand <= 0) break;
    }
    
    return outputRatios;
  }
}`
};

export default function Simulator() {
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState("");
  const [activeSubmissionId, setActiveSubmissionId] = useState<number | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCode(content);
      
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "java") {
        setLanguage("java");
        const slimeChallenge = (challenges as any[])?.find(c => c.name === "BioSlime Survival");
        if (slimeChallenge) setSelectedChallenge(slimeChallenge);
      } else if (ext === "py") {
        setLanguage("python");
        const astroChallenge = (challenges as any[])?.find(c => c.name === "AstroRouter Routing");
        if (astroChallenge) setSelectedChallenge(astroChallenge);
      } else if (ext === "ts") {
        setLanguage("typescript");
        const gridChallenge = (challenges as any[])?.find(c => c.name === "MegaGrid Resource Optimizer");
        if (gridChallenge) setSelectedChallenge(gridChallenge);
      }
    };
    reader.readAsText(file);
  };

  // Fetch Challenges
  const { data: challenges } = useQuery<any[]>({
    queryKey: ["/api/challenges"]
  });

  useEffect(() => {
    if (challenges && challenges.length > 0 && !selectedChallenge) {
      setSelectedChallenge(challenges[0]);
      const perfectCode = localStorage.getItem("PERFECT_SOLVER_PAYLOAD");
      if (perfectCode && challenges[0].name === "BioSlime Survival") {
        setCode(perfectCode);
      } else {
        setCode(DEFAULT_CODES[challenges[0].name] || "");
      }
    }
  }, [challenges, selectedChallenge]);

  // Query submissions list to refresh dashboard
  const { data: submissions } = useQuery<any[]>({
    queryKey: ["/api/submissions"],
    refetchInterval: 3000
  });

  // Poll current active submission status
  const { data: activeSub } = useQuery<any>({
    queryKey: [`/api/submissions/${activeSubmissionId}`],
    enabled: activeSubmissionId !== null,
    refetchInterval: 500 // Poll active status every 500ms
  });

  // Track logs changes for active submissions and render in terminal console
  useEffect(() => {
    if (activeSub) {
      setTerminalLogs(activeSub.logs || []);
      
      // Stop polling when evaluation completes or fails
      if (activeSub.status === "completed" || activeSub.status === "failed") {
        const timer = setTimeout(() => {
          setActiveSubmissionId(null);
          queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [activeSub]);

  // Scroll terminal logs container to base automatically on log appending
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  // Handle challenge changes to sync mock editor default solution code template
  const handleChallengeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    const selected = (challenges as any[])?.find(c => c.id === id);
    if (selected) {
      setSelectedChallenge(selected);
      setCode(DEFAULT_CODES[selected.name] || "");
      
      // Auto sync programming language choice
      if (selected.name === "BioSlime Survival") setLanguage("java");
      else if (selected.name === "AstroRouter Routing") setLanguage("python");
      else if (selected.name === "MegaGrid Resource Optimizer") setLanguage("typescript");
    }
  };

  // Submit Code solution mutation
  const submitSolution = useMutation({
    mutationFn: async () => {
      if (!selectedChallenge) throw new Error("No active challenge selected.");
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: selectedChallenge.id,
          language,
          code
        })
      });
      if (!response.ok) throw new Error("Scoring pipeline submission failed.");
      return await response.json();
    },
    onSuccess: (data) => {
      setActiveSubmissionId(data.id);
      setTerminalLogs(data.logs || []);
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSubmissionId) return; // Prevent multiple concurrent submits
    submitSolution.mutate();
  };

  const isSimulating = activeSubmissionId !== null;

  return (
    <div className="space-y-6 animate-fade-in flex-1 flex flex-col text-foreground">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <TerminalIcon className="h-7 w-7 text-primary" />
          Scoring Pipeline Simulator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit custom challenge solutions, watch AWS Fargate launch on-demand containers in real-time, and monitor live streaming Java evaluation logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
        
        {/* Solution Config & Mock Code Editor Panel (Left) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col space-y-4">
          <div className="glass-panel rounded-xl p-5 space-y-4 border border-border shadow-sm">
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              <Code className="h-4 w-4 text-primary" />
              Evaluation Workspace Settings
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase block mb-1 font-semibold">Challenge Model</label>
                <select 
                  value={selectedChallenge?.id || ""}
                  onChange={handleChallengeChange}
                  disabled={isSimulating}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  {(challenges as any[])?.map(c => (
                    <option key={c.id} value={c.id} className="bg-background text-foreground">{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase block mb-1 font-semibold">Execution Runtime</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isSimulating}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="java" className="bg-background text-foreground">Java 17 (OpenJDK)</option>
                  <option value="python" className="bg-background text-foreground">Python 3.10 (Standard)</option>
                  <option value="typescript" className="bg-background text-foreground">TypeScript 5 (Node.js 20)</option>
                </select>
              </div>
            </div>

            {/* Spec Panel details */}
            {selectedChallenge && (
              <div className="bg-muted border border-border rounded-lg p-3 text-xs font-mono shadow-inner">
                <span className="text-[10px] text-muted-foreground uppercase block mb-1 font-semibold">Active Specifications</span>
                <span className="text-foreground block font-bold">{selectedChallenge.complexity} Complexity</span>
                <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                  {selectedChallenge.description}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground">
                  <div><strong>INPUT SPEC:</strong> {selectedChallenge.inputSpec}</div>
                  <div><strong>OUTPUT SPEC:</strong> {selectedChallenge.outputSpec}</div>
                </div>
              </div>
            )}
          </div>

          {/* Solution Code Editor Frame */}
          <div className="glass-panel rounded-xl overflow-hidden flex-1 flex flex-col min-h-[300px] border border-border shadow-sm">
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400">solution_payload.{language === "java" ? "java" : language === "python" ? "py" : "ts"}</span>
                <input 
                  type="file" 
                  id="solution-file-upload" 
                  className="hidden" 
                  accept=".java,.py,.ts,.txt"
                  onChange={handleFileUpload} 
                  disabled={isSimulating}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("solution-file-upload")?.click()}
                  disabled={isSimulating}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 font-semibold text-[10px] px-2.5 py-1 rounded transition-all shadow-sm disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Upload className="h-3 w-3" />
                  <span>Upload Local File</span>
                </button>
              </div>
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isSimulating}
              className="flex-1 w-full bg-slate-950 font-mono text-[11px] text-slate-200 p-4 focus:outline-none resize-none overflow-y-auto leading-relaxed border-0 shadow-inner"
              spellCheck="false"
            />
            <div className="bg-slate-900 border-t border-slate-800 p-3 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">Total Characters: {code.length}</span>
              <button
                type="submit"
                disabled={isSimulating}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-primary/20 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    SCORING SOLUTION...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    RUN SCORING TEST
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Live Container Scoring Telemetry & Console Logger Panel (Right) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Active Container Progress indicator widget */}
          <div className="glass-panel rounded-xl p-5 space-y-4 flex flex-col justify-between border border-border shadow-sm">
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-cyan-500" />
              On-Demand Container Pipeline State
            </h3>
            
            {/* Visualizer steps bubbles */}
            <div className="space-y-4 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">1. Pipeline Ingestion (Kafka)</span>
                <span className={`font-semibold ${
                  activeSub?.status === "submitted" || activeSub?.status === "bootstrapping" || activeSub?.status?.startsWith("running") || activeSub?.status === "completed"
                    ? "text-emerald-500" : "text-muted-foreground"
                }`}>
                  {activeSub?.status === "submitted" ? "INGESTING..." : activeSub ? "COMMITTED" : "IDLE"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">2. ECR Image Container Pull</span>
                <span className={`font-semibold ${
                  activeSub?.status === "bootstrapping" ? "text-cyan-500 animate-pulse font-bold" :
                  activeSub?.status?.startsWith("running") || activeSub?.status === "completed" ? "text-emerald-500" : "text-muted-foreground"
                }`}>
                  {activeSub?.status === "bootstrapping" ? "BOOTING..." : activeSub?.status?.startsWith("running") || activeSub?.status === "completed" ? "ACTIVE" : "IDLE"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">3. Solution Evaluation (Fargate)</span>
                <span className={`font-semibold ${
                  activeSub?.status === "running_examples" ? "text-cyan-500 animate-pulse font-bold" :
                  activeSub?.status === "running_provisional" ? "text-violet-500 animate-pulse font-bold" :
                  activeSub?.status === "completed" ? "text-emerald-500" : "text-muted-foreground"
                }`}>
                  {activeSub?.status === "running_examples" ? "RUNNING EXAMPLES..." :
                   activeSub?.status === "running_provisional" ? "RUNNING PROVISIONAL..." :
                   activeSub?.status === "completed" ? "EVALUATED" : "IDLE"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">4. Score Dispatch Callback</span>
                <span className={`font-semibold ${
                  activeSub?.status === "completed" ? "text-emerald-500 font-bold" : "text-muted-foreground"
                }`}>
                  {activeSub?.status === "completed" ? "SUCCESS (200 OK)" : "IDLE"}
                </span>
              </div>
            </div>

            {/* Score completion highlight */}
            {activeSub?.status === "completed" && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mt-2 text-center text-emerald-600 dark:text-emerald-400 font-mono">
                <span className="text-[10px] text-muted-foreground uppercase block mb-1 font-semibold">Evaluation Score Success</span>
                <span className="text-2xl font-bold tracking-tight text-foreground">{activeSub.score.toFixed(4)}</span>
                <span className="text-[10px] block mt-1">Processed inside AWS Fargate in {((activeSub.processingTimeMs || 1000) / 1000).toFixed(2)}s</span>
              </div>
            )}
          </div>

          {/* Interactive terminal logs console output */}
          <div className="glass-panel rounded-xl overflow-hidden flex-1 flex flex-col bg-slate-950 min-h-[300px] border border-border shadow-sm">
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <TerminalIcon className="h-4 w-4 text-cyan-400" />
                Live Container execution_telemetry.log
              </span>
              <span className="text-[9px] font-mono bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded uppercase font-bold">
                {activeSub?.status || "STANDBY"}
              </span>
            </div>
            
            <div className="flex-1 p-4 font-mono text-[10px] leading-relaxed overflow-y-auto space-y-2 max-h-[350px]">
              {terminalLogs.length > 0 ? (
                terminalLogs.map((logLine, index) => {
                  let colorClass = "text-slate-400";
                  if (logLine.includes("⚡") || logLine.includes("KAFKA")) colorClass = "text-amber-400";
                  else if (logLine.includes("🚀") || logLine.includes("LAMBDA") || logLine.includes("ECS")) colorClass = "text-cyan-400";
                  else if (logLine.includes("[JAVA]") || logLine.includes("[BioSlimeTester]")) colorClass = "text-slate-200";
                  else if (logLine.includes("SUCCESS") || logLine.includes("Score Success")) colorClass = "text-emerald-400";
                  else if (logLine.includes("ERROR") || logLine.includes("FATAL") || logLine.includes("WARNING")) colorClass = "text-rose-400";
                  
                  return (
                    <div key={index} className={`${colorClass} whitespace-pre-wrap`}>
                      {logLine}
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-center text-slate-500 text-[11px] font-mono py-20">
                  Container logs stream here. Submit code to trigger event pipeline scoring sequence.
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
