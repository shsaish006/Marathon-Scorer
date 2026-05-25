import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingDown, DollarSign, Cpu, Clock, 
  Activity, CheckCircle2, ChevronRight, Zap 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, Legend 
} from "recharts";

export default function Dashboard() {
  // Query telemetry metrics
  const { data: metrics } = useQuery<any[]>({
    queryKey: ["/api/metrics"],
    refetchInterval: 3000
  });

  // Query database aggregates
  const { data: aggregates } = useQuery<any>({
    queryKey: ["/api/metrics/aggregates"],
    refetchInterval: 3000
  });

  // Query cost differences
  const { data: costs } = useQuery<any[]>({
    queryKey: ["/api/metrics/costs"]
  });

  // Query active submissions to count totals
  const { data: submissions } = useQuery<any[]>({
    queryKey: ["/api/submissions"],
    refetchInterval: 3000
  });

  const latest = metrics ? metrics[0] : null;

  const costSavings = aggregates?.costSavings || 82.5;
  const avgCpu = aggregates?.avgCpu || 15;
  const avgMemory = aggregates?.avgMemory || 22;
  const avgLatency = aggregates?.avgLatency || 14;
  const successRate = aggregates?.successRate || 99.2;

  // Format historical metrics data chronologically for charting
  const chartData = metrics 
    ? [...metrics].reverse().map(m => ({
        time: new Date(m.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        "Fargate Tasks": m.activeFargateTasks,
        "Kafka Queue": m.kafkaQueueLength,
        "CPU Load": m.cpuUtilization,
        "RAM Usage": m.memoryUtilization,
      }))
    : [];

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      {/* Dynamic Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary animate-pulse" />
            Infrastructure Cockpit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time serverless execution matrix, AWS Lambda triggers, and on-demand Fargate task telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-lg p-1 w-fit">
          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            TELEMETRY ONLINE
          </span>
          <span className="text-[11px] font-mono text-muted-foreground px-2">
            POLL RATE: 3.0s
          </span>
        </div>
      </div>

      {/* Grid Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cost Savings */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden flex flex-col justify-between border border-border/40 hover:border-primary/10 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">SSM Cost Savings</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-foreground tracking-tight">~{costSavings}%</span>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-mono">
              <TrendingDown className="h-3 w-3" />
              80% savings vs. legacy EC2
            </p>
          </div>
          <div className="absolute bottom-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-tl-full -mr-2 -mb-2" />
        </div>

        {/* Fargate Active Tasks */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden flex flex-col justify-between border border-border/40 hover:border-primary/10 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Fargate Active Tasks</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 dark:text-cyan-400 flex items-center justify-center">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-foreground tracking-tight">
              {latest?.activeFargateTasks ?? 0}
            </span>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-mono">
              Active cluster runner instances
            </p>
          </div>
          <div className="absolute bottom-0 right-0 h-16 w-16 bg-cyan-500/5 rounded-tl-full -mr-2 -mb-2" />
        </div>

        {/* CPU Workload */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden flex flex-col justify-between border border-border/40 hover:border-primary/10 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">SSM CPU Allocation</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-foreground tracking-tight">{latest?.cpuUtilization?.toFixed(1) || avgCpu}%</span>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-mono">
              Cluster load matrix (avg: {avgCpu}%)
            </p>
          </div>
          <div className="absolute bottom-0 right-0 h-16 w-16 bg-primary/5 rounded-tl-full -mr-2 -mb-2" />
        </div>

        {/* Success Rate */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden flex flex-col justify-between border border-border/40 hover:border-primary/10 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Evaluation Success Rate</span>
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-500 dark:text-violet-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{successRate}%</span>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-mono">
              Avg API Scorer callback success
            </p>
          </div>
          <div className="absolute bottom-0 right-0 h-16 w-16 bg-violet-500/5 rounded-tl-full -mr-2 -mb-2" />
        </div>
      </div>

      {/* Recharts Performance Graphics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Savings Area graph */}
        <div className="lg:col-span-1 glass-panel rounded-xl p-5 flex flex-col justify-between border border-border/40 min-h-[350px] shadow-sm">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              Monolithic vs Serverless Monthly Cost Comparison
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              AWS Fargate task billing scales to zero when no active submissions exist, saving ~80%.
            </p>
          </div>
          <div className="h-60 mt-4 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costs} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="month" stroke="rgba(128,128,128,0.6)" fontSize={11} />
                <YAxis stroke="rgba(128,128,128,0.6)" fontSize={11} label={{ value: 'USD ($)', angle: -90, position: 'insideLeft', fill: 'rgba(128,128,128,0.6)', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--foreground)" }}
                  labelStyle={{ fontSize: "11px", fontWeight: "bold" }}
                  itemStyle={{ fontSize: "11px" }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="LegacyEC2" name="Monolithic EC2" fill="rgba(128,128,128,0.3)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ServerlessFargate" name="On-Demand Fargate" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Fargate Tasks and Kafka Queue sizes */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 flex flex-col justify-between border border-border/40 min-h-[350px] shadow-sm">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
              Dynamic Task Allocation vs Kafka Queue Size
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Active cluster pods dynamically ramp up on Kafka event triggers and scale down immediately.
            </p>
          </div>
          <div className="h-60 mt-4 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorFargate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorQueue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="time" stroke="rgba(128,128,128,0.6)" fontSize={9} />
                <YAxis stroke="rgba(128,128,128,0.6)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--foreground)" }}
                  labelStyle={{ fontSize: "11px", fontWeight: "bold" }}
                  itemStyle={{ fontSize: "11px" }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" dataKey="Fargate Tasks" stroke="#06b6d4" fillOpacity={1} fill="url(#colorFargate)" strokeWidth={2} />
                <Area type="monotone" dataKey="Kafka Queue" stroke="#f59e0b" fillOpacity={1} fill="url(#colorQueue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Systems telemetry feed & active runner listings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry charts load */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-border/40 shadow-sm">
          <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Active Cluster Utilization Core Metrics
          </h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Percentage consumption tracking for active Docker runners.
          </p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="time" stroke="rgba(128,128,128,0.6)" fontSize={9} />
                <YAxis stroke="rgba(128,128,128,0.6)" fontSize={11} unit="%" />
                <Tooltip 
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--foreground)" }}
                  labelStyle={{ fontSize: "11px", fontWeight: "bold" }}
                  itemStyle={{ fontSize: "11px" }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" dataKey="CPU Load" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
                <Area type="monotone" dataKey="RAM Usage" stroke="#ec4899" fillOpacity={1} fill="url(#colorRam)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Submissions Pipeline list */}
        <div className="lg:col-span-1 glass-panel rounded-xl p-5 border border-border/40 flex flex-col min-h-[300px] shadow-sm">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Live Submissions Pipeline</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Recent solutions scoring states in queue.
          </p>
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[220px] pr-2">
            {submissions && submissions.length > 0 ? (
              submissions.slice(0, 5).map((sub: any) => (
                <div 
                  key={sub.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border hover:bg-muted/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">#SUB-{sub.id}</span>
                      <span className="text-[10px] bg-background text-muted-foreground px-2 py-0.5 rounded border border-border font-mono uppercase font-semibold">
                        {sub.language}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      {new Date(sub.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {/* Status Indicator bubble */}
                  <div className="text-right">
                    <span className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full inline-block ${
                      sub.status === "completed" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
                      sub.status === "failed" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                      "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 animate-pulse"
                    }`}>
                      {sub.status.replace("_", " ")}
                    </span>
                    {sub.status === "completed" && (
                      <span className="text-xs font-mono font-bold text-foreground block mt-0.5">
                        Score: {sub.score.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground font-mono text-xs py-8">
                <span>No solutions evaluated yet.</span>
                <span className="text-[10px] mt-1 text-muted-foreground/60">Use the Simulator tab to run code!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
