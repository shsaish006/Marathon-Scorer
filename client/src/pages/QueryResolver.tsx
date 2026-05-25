import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../main";
import { 
  Send, MessageSquare, Sparkles, Code, CheckCircle, 
  HelpCircle, User, Bot, BookOpen, Settings, Zap, ArrowRight, X
} from "lucide-react";

interface Message {
  id: number;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  codeBlock?: string;
  logicBlock?: string;
}

export default function QueryResolver() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "Greetings, Contestant! I am the Fargate AI Query Resolver. I analyze scoring payloads using formal predicate logic and mathematical optimization guidelines. Select your challenge or submit a query to evaluate performance weights and hit a perfect score!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [selectedSubId, setSelectedSubId] = useState<string>("all");
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on message updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Fetch recent submissions to link in context
  const { data: submissions } = useQuery<any[]>({
    queryKey: ["/api/submissions"]
  });

  const { data: challenges } = useQuery<any[]>({
    queryKey: ["/api/challenges"]
  });

  // Preset resolver answers incorporating Predicate Logic
  const handlePresetQuery = (topic: string) => {
    setIsTyping(true);
    
    // Add user message
    const userMsg: Message = {
      id: messages.length + 1,
      sender: "user",
      text: topic,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      let botText = "";
      let code = "";
      let logic = "";

      if (topic.includes("BioSlime")) {
        botText = "Applying Predicate Logic analysis to the BioSlime cellular automata environment. We formalize slime colony state transitions based on local neighborhood grid valuations to optimize survival weights:";
        logic = `∀ x, y ∈ Grid:
ColonyState(x, y, t) = 1 (Active Slime)
NeighborCount(x, y, t) = ∑ (dr, dc) ∈ {-1, 0, 1}² \\ {(0,0)}: ColonyState(x+dr, y+dc, t)

Transition Rules (Predicate Logic):
1. Survival Rule:
   ColonyState(x, y, t) = 1 ∧ (NeighborCount(x, y, t) = 2 ∨ NeighborCount(x, y, t) = 3) → ColonyState(x, y, t+1) = 1
2. Birth Rule:
   ColonyState(x, y, t) = 0 ∧ NeighborCount(x, y, t) = 3 → ColonyState(x, y, t+1) = 1
3. Death Rule:
   ColonyState(x, y, t) = 1 ∧ (NeighborCount(x, y, t) < 2 ∨ NeighborCount(x, y, t) > 3) → ColonyState(x, y, t+1) = 0`;
        
        code = `package com.topcoder.marathon.solution;

import java.util.*;

/**
 * BioSlime Perfect Solver - Optimization Matrix.
 * Satisfies the Predicate logic constraints: Survival(x) ↔ Neighbor(x) ∈ {2,3}
 */
public class Solution {
    public int[] getMoveDirection(int[][] grid, int currentColonies) {
        int bestR = 0, bestC = 0;
        double maxScore = -1.0;
        
        // Formulating neighborhood density gradients
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[r].length; c++) {
                if (grid[r][c] == 0) {
                    double density = evaluateTransitionDensity(grid, r, c);
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

    private double evaluateTransitionDensity(int[][] grid, int r, int c) {
        int activeNeighbors = 0;
        for (int dr = -1; dr <= 1; dr++) {
            for (int dc = -1; dc <= 1; dc++) {
                if (dr == 0 && dc == 0) continue;
                int nr = (r + dr + grid.length) % grid.length;
                int nc = (c + dc + grid.length) % grid.length;
                if (grid[nr][nc] == 1) activeNeighbors++;
            }
        }
        // Perfect score targeting logic rules
        return activeNeighbors == 3 ? 1.0 : (activeNeighbors == 2 ? 0.8 : 0.1);
    }
}`;
      } else if (topic.includes("AstroRouter")) {
        botText = "Constellation Routing Optimization Proof. To achieve a perfect score, routing path costs must minimize dynamic latency indices aggravated by solar weather vectors:";
        logic = `Let G = (V, E) represent the constellation network.
∀ (u, v) ∈ E:
BaseLatency(u, v) = d(u, v) / c
SolarWeatherDecay(v) = w(v) ∈ [0, 1.0]
EffectiveCost(u, v) = BaseLatency(u, v) × (1.0 + SolarWeatherDecay(v))

Predicate Logic Constraint (Shortest Path Formulation):
∀ Path P = (v₀, v₁, ..., v_k):
Cost(P) = ∑ EffectiveCost(v_i, v_{i+1})
IsShortestPath(P) ↔ ∀ Path Q: Cost(P) ≤ Cost(Q)`;
        
        code = `import typing

class AstroRouterSolver:
    """
    Perfect AstroRouter Constellation Router.
    Implements Dijkstra's Single-Source Shortest Path under dynamic decay weights.
    """
    def compute_routing_path(self, nodes: list, latencies: list, solar_matrix: list) -> list:
        n = len(nodes)
        dist = [float('inf')] * n
        parent = [-1] * n
        dist[0] = 0
        visited = [False] * n
        
        for _ in range(n):
            u = -1
            min_dist = float('inf')
            for i in range(n):
                if not visited[i] and dist[i] < min_dist:
                    min_dist = dist[i]
                    u = i
            
            if u == -1 or u == n - 1:
                break
            visited[u] = True
            
            for v in range(n):
                if not visited[v] and latencies[u][v] > 0:
                    base = latencies[u][v]
                    decay = solar_matrix[v]
                    weight = base * (1.0 + decay)
                    
                    if dist[u] + weight < dist[v]:
                        dist[v] = dist[u] + weight
                        parent[v] = u
        
        # Backtrack perfect path
        path = []
        curr = n - 1
        while curr != -1:
            path.append(curr)
            curr = parent[curr]
        path.reverse()
        return path if path[0] == 0 else [0]`;
      } else {
        botText = "I have evaluated your context. Analyzing with Predicate Logic parameters returns optimal satisfaction weights. Try out these pre-formatted optimization proofs to instantly boost your scoreboard ranks to 100.00!";
      }

      const botMsg: Message = {
        id: messages.length + 2,
        sender: "bot",
        text: botText,
        codeBlock: code,
        logicBlock: logic,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    const userMsg: Message = {
      id: messages.length + 1,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    const lowerQuery = query.toLowerCase();

    setTimeout(() => {
      let botText = "";
      let code = "";
      let logic = "";

      if (lowerQuery.includes("bioslime") || lowerQuery.includes("slime")) {
        botText = "Applying Predicate Logic analysis to the BioSlime cellular automata environment. We formalize slime colony state transitions based on local neighborhood grid valuations to optimize survival weights:";
        logic = `∀ x, y ∈ Grid:
ColonyState(x, y, t) = 1 (Active Slime)
NeighborCount(x, y, t) = ∑ (dr, dc) ∈ {-1, 0, 1}² \\ {(0,0)}: ColonyState(x+dr, y+dc, t)

Transition Rules (Predicate Logic):
1. Survival Rule:
   ColonyState(x, y, t) = 1 ∧ (NeighborCount(x, y, t) = 2 ∨ NeighborCount(x, y, t) = 3) → ColonyState(x, y, t+1) = 1
2. Birth Rule:
   ColonyState(x, y, t) = 0 ∧ NeighborCount(x, y, t) = 3 → ColonyState(x, y, t+1) = 1
3. Death Rule:
   ColonyState(x, y, t) = 1 ∧ (NeighborCount(x, y, t) < 2 ∨ NeighborCount(x, y, t) > 3) → ColonyState(x, y, t+1) = 0`;
        
        code = `package com.topcoder.marathon.solution;

import java.util.*;

/**
 * BioSlime Perfect Solver - Optimization Matrix.
 * Satisfies the Predicate logic constraints: Survival(x) ↔ Neighbor(x) ∈ {2,3}
 */
public class Solution {
    public int[] getMoveDirection(int[][] grid, int currentColonies) {
        int bestR = 0, bestC = 0;
        double maxScore = -1.0;
        
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[r].length; c++) {
                if (grid[r][c] == 0) {
                    double density = evaluateTransitionDensity(grid, r, c);
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

    private double evaluateTransitionDensity(int[][] grid, int r, int c) {
        int activeNeighbors = 0;
        for (int dr = -1; dr <= 1; dr++) {
            for (int dc = -1; dc <= 1; dc++) {
                if (dr == 0 && dc == 0) continue;
                int nr = (r + dr + grid.length) % grid.length;
                int nc = (c + dc + grid.length) % grid.length;
                if (grid[nr][nc] == 1) activeNeighbors++;
            }
        }
        return activeNeighbors == 3 ? 1.0 : (activeNeighbors == 2 ? 0.8 : 0.1);
    }
}`;
      } else if (lowerQuery.includes("astrorouter") || lowerQuery.includes("router") || lowerQuery.includes("routing")) {
        botText = "Constellation Routing Optimization Proof. To achieve a perfect score, routing path costs must minimize dynamic latency indices aggravated by solar weather vectors:";
        logic = `Let G = (V, E) represent the constellation network.
∀ (u, v) ∈ E:
BaseLatency(u, v) = d(u, v) / c
SolarWeatherDecay(v) = w(v) ∈ [0, 1.0]
EffectiveCost(u, v) = BaseLatency(u, v) × (1.0 + SolarWeatherDecay(v))

Predicate Logic Constraint (Shortest Path Formulation):
Let Path P = (v0, v1, ..., vk):
Cost(P) = sum(EffectiveCost(vi, vi+1))
IsShortestPath(P) <-> for all Path Q: Cost(P) <= Cost(Q)`;
        
        code = `import typing

class AstroRouterSolver:
    """
    Perfect AstroRouter Constellation Router.
    Implements Dijkstra's Single-Source Shortest Path under dynamic decay weights.
    """
    def compute_routing_path(self, nodes: list, latencies: list, solar_matrix: list) -> list:
        n = len(nodes)
        dist = [float('inf')] * n
        parent = [-1] * n
        dist[0] = 0
        visited = [False] * n
        
        for _ in range(n):
            u = -1
            min_dist = float('inf')
            for i in range(n):
                if not visited[i] and dist[i] < min_dist:
                    min_dist = dist[i]
                    u = i
            
            if u == -1 or u == n - 1:
                break
            visited[u] = True
            
            for v in range(n):
                if not visited[v] and latencies[u][v] > 0:
                    base = latencies[u][v]
                    decay = solar_matrix[v]
                    weight = base * (1.0 + decay)
                    
                    if dist[u] + weight < dist[v]:
                        dist[v] = dist[u] + weight
                        parent[v] = u
        
        path = []
        curr = n - 1
        while curr != -1:
            path.append(curr)
            curr = parent[curr]
        path.reverse()
        return path if path[0] == 0 else [0]`;
      } else if (lowerQuery.includes("megagrid") || lowerQuery.includes("grid") || lowerQuery.includes("resource") || lowerQuery.includes("optimizer")) {
        botText = "MegaGrid Capacity Balancing Proof. Resolves the optimal resource distribution between multiple generators under surging load matrices to achieve economic satisfaction:";
        logic = `Let G represents generators list, L represents industrial loads demand.
∀ g ∈ G: MaxCapacity(g) = c(g), FuelCost(g) = cost(g)
TotalDemand = ∑ loads

Optimization Goal (Economic Resource Allocation):
Minimize ∑ Allocation(g) × FuelCost(g)
Subject to:
1. ∀ g ∈ G: 0 ≤ Allocation(g) ≤ MaxCapacity(g)
2. ∑ Allocation(g) = TotalDemand

Predicate Logic Rule:
∀ g₁, g₂ ∈ G: FuelCost(g₁) < FuelCost(g₂) ∧ Allocation(g₂) > 0 → Allocation(g₁) = MaxCapacity(g₁)`;

        code = `export class MegaGridOptimizer {
  /**
   * Perfect MegaGrid Resource Balancer.
   * Allocates load generators starting with the lowest cost capacity ceiling.
   */
  optimizeDistribution(generators: any[], loads: number[]): number[] {
    const totalDemand = loads.reduce((a, b) => a + b, 0);
    const outputRatios = new Array(generators.length).fill(0);
    
    // Sort energy sources based on marginal cost configuration
    const sortedGenerators = generators
      .map((g, i) => ({ i, cost: g.cost, max: g.capacity }))
      .sort((a, b) => a.cost - b.cost);

    let remainingDemand = totalDemand;
    for (const { i, max } of sortedGenerators) {
      const take = Math.min(remainingDemand, max);
      outputRatios[i] = take / max;
      remainingDemand -= take;
      if (remainingDemand <= 0) break;
    }
    
    return outputRatios;
  }
}`;
      } else if (lowerQuery.includes("hi") || lowerQuery.includes("hello") || lowerQuery.includes("hey")) {
        botText = "Greetings, Contestant! I am the Fargate AI Query Resolver, here to analyze your scoring parameters. Ask me how to optimize 'BioSlime Survival', 'AstroRouter Routing', or 'MegaGrid Resource Optimizer' to formulate predicate mathematical proofs and inject 100.00 score solvers!";
      } else {
        botText = `Query Resolution Probing Completed. We have mapped your query context '${query}' under general predicate satisfaction boundaries. 

Please request optimization proofs for one of our primary challenge engines:
1. 'BioSlime Survival Automata Proof' (Java solver optimization)
2. 'AstroRouter Constellation Routing Proof' (Python SSSP solver optimization)
3. 'MegaGrid Capacity Resource Allocation Proof' (TypeScript economic optimization)

Simply type one of the challenge names to receive the full predicate logic proof and inject the perfect scoring solver directly into your workspace!`;
      }

      const botMsg: Message = {
        id: messages.length + 2,
        sender: "bot",
        text: botText,
        codeBlock: code || undefined,
        logicBlock: logic || undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
  };

  // Inject perfect solver code into localstorage so the simulator can access it!
  const markAsPerfect = (msg: Message) => {
    if (!msg.codeBlock) return;
    localStorage.setItem("PERFECT_SOLVER_PAYLOAD", msg.codeBlock);
    alert("✨ [AI RESOLVER SUCCESS] Perfect optimization code injected! Go to the Simulator tab to run your 100.00 score solver.");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch animate-fade-in text-foreground">
      
      {/* Sidebar Details Panel (Left) */}
      <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div className="space-y-6">
          <div className="border-b border-border pb-4">
            <span className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider font-mono">
              <Sparkles className="h-4 w-4" />
              AI Co-Pilot Scorer
            </span>
            <h3 className="text-base font-bold text-foreground mt-2">Predicate Logic Solver</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Leverage formal predicate logic proofs to optimize your marathon scoring parameters and unlock perfect outputs.
            </p>
          </div>

          {/* Context Selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block font-semibold">Active Code Context</span>
            <select
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="all">Global Challenge Sandbox</option>
              {submissions?.map(sub => (
                <option key={sub.id} value={sub.id}>#SUB-2026-{String(sub.id).padStart(3, "0")} ({sub.language})</option>
              ))}
            </select>
          </div>

          {/* Presets query list */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block font-semibold">Predicate Proof Templates</span>
            <div className="space-y-2">
              <button
                onClick={() => handlePresetQuery("How do I optimize BioSlime Survival using Predicate Logic rules?")}
                className="w-full text-left text-xs bg-muted hover:bg-muted/80 border border-border rounded-lg p-2.5 transition-all text-foreground font-semibold flex items-center justify-between"
              >
                <span>BioSlime Automata Proof</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={() => handlePresetQuery("Explain the AstroRouter routing solar matrix predicate logic weights.")}
                className="w-full text-left text-xs bg-muted hover:bg-muted/80 border border-border rounded-lg p-2.5 transition-all text-foreground font-semibold flex items-center justify-between"
              >
                <span>AstroRouter SSSP Proof</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className="bg-muted border border-border rounded-xl p-3.5 text-muted-foreground text-[11px] leading-relaxed mt-6 shadow-inner">
          <strong>How it works:</strong> The Query Resolver applies formal predicate checking to evaluate active scoring parameters. Upon finding optimization vectors, click <strong>MARK PERFECT</strong> to inject the perfect solver code.
        </div>
      </div>

      {/* Chat Window (Right) */}
      <div className="lg:col-span-8 bg-card border border-border rounded-2xl flex flex-col justify-between h-[520px] shadow-sm">
        
        {/* Chat header */}
        <div className="bg-muted/40 border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">Scoring Resolution Channel</span>
              <span className="text-[10px] text-muted-foreground block font-mono">CHANNEL STATUS: ONLINE</span>
            </div>
          </div>
        </div>

        {/* Message window */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 max-w-[85%] ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              {/* Avatar indicator */}
              <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs ${
                msg.sender === "user" ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground border border-border"
              }`}>
                {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Chat bubble body */}
              <div className={`space-y-3 p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                msg.sender === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-muted/40 text-foreground border border-border rounded-tl-none"
              }`}>
                <div className="flex items-center justify-between gap-4 border-b border-border/10 pb-1.5 mb-1 text-[10px] font-semibold">
                  <span className="opacity-90 uppercase">{msg.sender === "user" ? "Contestant" : "AI RESOLVER"}</span>
                  <span className="opacity-70">{msg.timestamp}</span>
                </div>
                
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Predicate Logic output blocks */}
                {msg.logicBlock && (
                  <pre className="bg-slate-950 dark:bg-black text-cyan-400 font-mono text-[9px] p-3 rounded-lg overflow-x-auto leading-relaxed border border-border">
                    <code>{msg.logicBlock}</code>
                  </pre>
                )}

                {/* Code optimizer results block */}
                {msg.codeBlock && (
                  <div className="space-y-2 mt-2 pt-2 border-t border-border/10">
                    <span className="text-[9px] font-mono text-muted-foreground block">OPTIMIZED SOLVER:</span>
                    <pre className="bg-slate-900 dark:bg-black text-emerald-400 font-mono text-[9px] p-3 rounded-lg overflow-x-auto max-h-[150px] leading-relaxed border border-border">
                      <code>{msg.codeBlock}</code>
                    </pre>
                    <button
                      onClick={() => markAsPerfect(msg)}
                      className="w-full flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] py-2 rounded-lg transition-colors shadow-sm"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      MARK PERFECT & INJECT SOLVER
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing state bubble */}
          {isTyping && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center border border-border">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted/40 border border-border rounded-2xl rounded-tl-none p-4 text-xs text-muted-foreground font-mono animate-pulse">
                AI resolver is checking predicate rules...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSend} className="bg-muted/40 border-t border-border p-4 flex gap-2">
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
            placeholder="Ask AI Resolver: How can I optimize my BioSlime solver or AstroRouter weights?..."
            className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary shadow-inner"
          />
          <button
            type="submit"
            disabled={isTyping || !inputValue.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground p-2.5 rounded-xl transition-all disabled:opacity-40"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>

      </div>

    </div>
  );
}
