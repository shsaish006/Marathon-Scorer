import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Server, MessageSquare, Cpu, Database, 
  Settings, CheckCircle, ArrowRight, Zap, Play, 
  AlertTriangle, RefreshCw, Radio, HardDrive, Terminal, Globe
} from "lucide-react";

interface SimulatedPod {
  id: string;
  node: string;
  status: "Image Pulling" | "Warm Booting" | "Running Examples" | "Running Provisional" | "Completed" | "Evicted" | "Terminating";
  progress: number;
  cpu: number;
  memory: number;
}

export default function DevOpsVisualizer() {
  // Query simulator details from real scoring database
  const { data: latestMetrics } = useQuery<any>({
    queryKey: ["/api/metrics/latest"],
    refetchInterval: 1500
  });

  const activeTasks = latestMetrics?.activeFargateTasks || 0;
  const queueLength = latestMetrics?.kafkaQueueLength || 0;
  const cpu = latestMetrics?.cpuUtilization || 0;

  // Visualizer interactive states
  const [simulatedPods, setSimulatedPods] = useState<SimulatedPod[]>([]);
  const [node02Active, setNode02Active] = useState(true);
  const [ssmFlashing, setSsmFlashing] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "[SYSTEM] DevOps orchestrator sandbox loaded in standby state.",
    "[SYSTEM] Awaiting scoring requests or manual traffic injections..."
  ]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const [region, setRegion] = useState("us-east-1");
  const [commandInput, setCommandInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [connectingHosts, setConnectingHosts] = useState<Record<string, "active" | "connecting" | "offline">>({
    "Host-Node-01": "active",
    "Host-Node-02": "active",
    "Host-Node-03": "active"
  });

  const handleRegionChange = (newRegion: string) => {
    if (newRegion === region && connectingHosts["Host-Node-01"] === "active") return;
    
    setRegion(newRegion);
    setIsScanning(true);
    
    addLog(`aws-shell (${newRegion}) $ export AWS_DEFAULT_REGION=${newRegion}`);
    addLog(`[SYSTEM] Switched active cloud provider endpoint to region ${newRegion}.`);
    addLog(`aws-shell (${newRegion}) $ aws eks update-kubeconfig --name scorer-cluster --region ${newRegion}`);
    addLog(`[SYSTEM] Fetching Kubernetes EKS authentication details...`);
    
    setConnectingHosts({
      "Host-Node-01": "connecting",
      "Host-Node-02": node02Active ? "connecting" : "offline",
      "Host-Node-03": "connecting"
    });

    // Staggered sequence layers
    setTimeout(() => {
      addLog(`[EKS] Telemetry control plane linked successfully in ${newRegion}.`);
      addLog(`[EKS] Probing cluster host virtual instances...`);
    }, 500);

    setTimeout(() => {
      setConnectingHosts(prev => ({ ...prev, "Host-Node-01": "active" }));
      addLog(`📡 [TELEMETRY] Host-01 established secure socket at zone ${newRegion}a.`);
    }, 900);

    setTimeout(() => {
      if (node02Active) {
        setConnectingHosts(prev => ({ ...prev, "Host-Node-02": "active" }));
        addLog(`📡 [TELEMETRY] Host-02 established secure socket at zone ${newRegion}b.`);
      } else {
        addLog(`⚠️ [TELEMETRY] Host-02 at zone ${newRegion}b is offline. Evacuating task resources...`);
      }
    }, 1400);

    setTimeout(() => {
      setConnectingHosts(prev => ({ ...prev, "Host-Node-03": "active" }));
      addLog(`📡 [TELEMETRY] Host-03 established secure socket at zone ${newRegion}c.`);
      setIsScanning(false);
      addLog(`✔ [EKS SUCCESS] All reachable nodes synchronized in region ${newRegion}. Cluster ready.`);
    }, 1900);

    if (simulatedPods.length > 0) {
      addLog(`🚀 [ORCHESTRATOR] Migrating ${simulatedPods.length} active runner pods to new regional hosts...`);
      setSimulatedPods(prevPods => prevPods.map(pod => ({
        ...pod,
        status: "Image Pulling" as any,
        progress: 0,
        cpu: Math.floor(Math.random() * 15) + 5,
      })));
    }
  };

  const getZoneLabel = (suffix: string) => {
    const parts = region.split("-");
    const formattedRegion = parts.map((p, i) => i === 1 ? p.charAt(0).toUpperCase() + p.slice(1) : p.toUpperCase()).join("-");
    return `${formattedRegion}${suffix}`;
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd) return;

    setCommandInput("");
    addLog(`aws-shell (${region}) $ ${cmd}`);

    const lowerCmd = cmd.toLowerCase();
    
    if (lowerCmd === "help") {
      addLog("==========================================================================");
      addLog("💻 MOCK AWS CLOUD SHELL ORCHESTRATOR DIRECTORY:");
      addLog("  • aws configure set region [region]      - Configures active AWS CLI region");
      addLog("  • aws configure get region               - Queries active AWS CLI region");
      addLog("  • aws ssm get-parameters                 - List Parameter Store configurations");
      addLog("  • aws ssm put-parameter --key [K] --value [V]  - Hot-reload system parameter");
      addLog("  • kubectl get nodes                      - List cluster compute host servers");
      addLog("  • kubectl get nodes -o wide              - List cluster hosts with regional network specs");
      addLog("  • kubectl describe nodes                 - Inspect regional labels and zone allocations");
      addLog("  • kubectl get pods                       - Renders active task containers");
      addLog("  • kubectl delete node host-02            - Injects incident outage on host 2");
      addLog("  • kubectl scale --replicas=[N] deployment/scorer - Manually scales scoring grid");
      addLog("  • aws ecs run-task --count [N]           - Spawns custom parallel fargate pods");
      addLog("  • terraform apply                        - Provision and recycle active topology");
      addLog("  • clear                                  - Clear terminal logs console");
      addLog("==========================================================================");
    } 
    else if (lowerCmd.startsWith("aws configure set region ")) {
      const parts = cmd.trim().split(/\s+/);
      const newRegion = parts[parts.length - 1];
      const validRegions = ["us-east-1", "us-west-2", "eu-west-1", "ap-south-1"];
      if (validRegions.includes(newRegion)) {
        handleRegionChange(newRegion);
      } else {
        addLog(`[ERROR] Unknown AWS region: '${newRegion}'. Supported: ${validRegions.join(", ")}`);
      }
    }
    else if (lowerCmd === "aws configure get region") {
      addLog("--------------------------------------------------------------------------");
      addLog(`region = ${region}`);
      addLog("--------------------------------------------------------------------------");
    }
    else if (lowerCmd === "clear") {
      setConsoleLogs([`[SYSTEM] Shell console cleared. Connected to AWS Endpoint region ${region}.`]);
    }
    else if (lowerCmd === "kubectl get nodes") {
      addLog("--------------------------------------------------------------------------");
      addLog("NAME           STATUS   ROLES    AGE   VERSION");
      addLog(`host-node-01   ${connectingHosts["Host-Node-01"] === "active" ? "Ready" : "NotReady"}   worker   12d   v1.28.2-eks-${region}`);
      addLog(`host-node-02   ${node02Active && connectingHosts["Host-Node-02"] === "active" ? 'Ready' : 'NotReady'}  worker   12d   v1.28.2-eks-${region}`);
      addLog(`host-node-03   ${connectingHosts["Host-Node-03"] === "active" ? "Ready" : "NotReady"}   worker   12d   v1.28.2-eks-${region}`);
      addLog("--------------------------------------------------------------------------");
    }
    else if (lowerCmd === "kubectl get nodes -o wide") {
      addLog("-------------------------------------------------------------------------------------------------------------");
      addLog("NAME           STATUS   ROLES    AGE   VERSION             INTERNAL-IP   OS-IMAGE         KERNEL-VERSION");
      addLog(`host-node-01   ${connectingHosts["Host-Node-01"] === "active" ? "Ready" : "NotReady"}    worker   12d   v1.28.2-eks-${region}   10.0.1.42     Amazon Linux 2   5.10.184-eks`);
      addLog(`host-node-02   ${node02Active && connectingHosts["Host-Node-02"] === "active" ? "Ready" : "NotReady"}    worker   12d   v1.28.2-eks-${region}   10.0.2.19     Amazon Linux 2   5.10.184-eks`);
      addLog(`host-node-03   ${connectingHosts["Host-Node-03"] === "active" ? "Ready" : "NotReady"}    worker   12d   v1.28.2-eks-${region}   10.0.3.84     Amazon Linux 2   5.10.184-eks`);
      addLog("-------------------------------------------------------------------------------------------------------------");
    }
    else if (lowerCmd === "kubectl describe nodes") {
      addLog("--------------------------------------------------------------------------");
      addLog(`Name:               host-node-01`);
      addLog(`Roles:              worker`);
      addLog(`Labels:             topology.kubernetes.io/region=${region}`);
      addLog(`                    topology.kubernetes.io/zone=${region}a`);
      addLog(`Status:             ${connectingHosts["Host-Node-01"] === "active" ? "Ready" : "Probing"}`);
      addLog(`Capacity / Alloc:   cpu: 4 / memory: 16Gi`);
      addLog(`--`);
      addLog(`Name:               host-node-02`);
      addLog(`Roles:              worker`);
      addLog(`Labels:             topology.kubernetes.io/region=${region}`);
      addLog(`                    topology.kubernetes.io/zone=${region}b`);
      addLog(`Status:             ${node02Active ? (connectingHosts["Host-Node-02"] === "active" ? "Ready" : "Probing") : "Offline"}`);
      addLog(`Capacity / Alloc:   cpu: 4 / memory: 16Gi`);
      addLog(`--`);
      addLog(`Name:               host-node-03`);
      addLog(`Roles:              worker`);
      addLog(`Labels:             topology.kubernetes.io/region=${region}`);
      addLog(`                    topology.kubernetes.io/zone=${region}c`);
      addLog(`Status:             ${connectingHosts["Host-Node-03"] === "active" ? "Ready" : "Probing"}`);
      addLog(`Capacity / Alloc:   cpu: 4 / memory: 16Gi`);
      addLog("--------------------------------------------------------------------------");
    }
    else if (lowerCmd === "kubectl get pods") {
      if (simulatedPods.length === 0) {
        addLog("No resources found in default namespace.");
      } else {
        addLog("--------------------------------------------------------------------------");
        addLog("NAME                      READY   STATUS      RESTARTS   AGE");
        simulatedPods.forEach(p => {
          addLog(`${p.id.padEnd(25)} 1/1     ${p.status.padEnd(11)} 0          ${p.progress}%`);
        });
        addLog("--------------------------------------------------------------------------");
      }
    }
    else if (lowerCmd === "kubectl delete node host-02" || lowerCmd === "kubectl delete node host-node-02") {
      if (node02Active) {
        handleToggleNode02();
      } else {
        addLog("[ERROR] Host-Node-02 is already offline.");
      }
    }
    else if (lowerCmd.startsWith("aws ecs run-task") || lowerCmd.startsWith("kubectl scale")) {
      let count = 5;
      const countMatch = cmd.match(/--count\s+(\d+)/) || cmd.match(/--replicas=(\d+)/);
      if (countMatch) {
        count = parseInt(countMatch[1]);
      }
      
      addLog(`📡 [SCALE REQUEST] Triggering Fargate container deployment scale. Count: ${count}...`);
      const nodes = ["Host-Node-01", "Host-Node-02", "Host-Node-03"];
      const healthyNodes = node02Active ? nodes : ["Host-Node-01", "Host-Node-03"];
      
      const newPods: SimulatedPod[] = Array.from({ length: count }).map((_, idx) => {
        const targetNode = healthyNodes[idx % healthyNodes.length];
        return {
          id: `fargate-pod-${Math.random().toString(36).substring(3, 7).toUpperCase()}`,
          node: targetNode,
          status: "Image Pulling",
          progress: 0,
          cpu: Math.floor(Math.random() * 20) + 5,
          memory: Math.floor(Math.random() * 100) + 120
        };
      });
      setSimulatedPods(prev => [...prev, ...newPods]);
    }
    else if (lowerCmd === "aws ssm get-parameters") {
      addLog("--------------------------------------------------------------------------");
      addLog("SSM PARAMETER CONFIGURATIONS (JSON):");
      addLog("  {");
      addLog("    \"SCORING_STRATEGY\": \"provisional\",");
      addLog("    \"SCORING_TIMEOUT_SEC\": 180,");
      addLog("    \"MAX_CONCURRENT_TASKS\": 5,");
      addLog("    \"FARGATE_STARTUP_DELAY_MS\": 4000");
      addLog("  }");
      addLog("--------------------------------------------------------------------------");
    }
    else if (lowerCmd.includes("aws ssm put-parameter")) {
      handleHotReload();
    }
    else if (lowerCmd === "terraform apply") {
      addLog("--------------------------------------------------------------------------");
      addLog("⏵ [TERRAFORM] Initializing connection to AWS API endpoint...");
      addLog("⏵ [TERRAFORM] Refreshing active infrastructure state matrices...");
      addLog("⏵ [TERRAFORM] Applying structural alterations...");
      
      setSsmFlashing(true);
      setTimeout(() => {
        setSsmFlashing(false);
        if (!node02Active) {
          setNode02Active(true);
          setConnectingHosts(prev => ({ ...prev, "Host-Node-02": "active" }));
        }
        addLog("✔ [TERRAFORM SUCCESS] Provisioning completed successfully. 12 resources created, EKS Node health synced.");
      }, 1500);
      addLog("--------------------------------------------------------------------------");
    }
    else {
      addLog(`[ERROR] Command '${cmd}' not recognized. Type 'help' to view the active directory schema.`);
    }
  };

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLogs]);

  // Append logs helper
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  // Trigger: Traffic Surge (15x scale)
  const handleTrafficSurge = () => {
    if (simulatedPods.length > 0) {
      addLog("[WARNING] Traffic surge simulation already running.");
      return;
    }
    
    addLog("⚡ [LOAD TRAFFIC SURGE] Injecting 15 parallel solution submissions into Kafka topic...");
    addLog("📡 [KAFKA MSK] Kafka cluster buffered 15 scoring events. MSK partition offset scaling up...");
    addLog("🚀 [AWS LAMBDA] MSK trigger mapping invoked. Autoscaler spawning ECS Fargate Container tasks...");
    
    const nodes = ["Host-Node-01", "Host-Node-02", "Host-Node-03"];
    const initialPods: SimulatedPod[] = Array.from({ length: 15 }).map((_, idx) => {
      // Balance pods evenly across nodes initially
      const nodeIndex = idx % 3;
      const targetNode = nodes[nodeIndex];
      
      return {
        id: `fargate-pod-${Math.random().toString(36).substring(3, 7).toUpperCase()}`,
        node: targetNode,
        status: "Image Pulling",
        progress: 0,
        cpu: Math.floor(Math.random() * 20) + 5,
        memory: Math.floor(Math.random() * 100) + 120
      };
    });

    setSimulatedPods(initialPods);
  };

  // Trigger: Crash Node-02 / Evict Pods
  const handleToggleNode02 = () => {
    const nextState = !node02Active;
    setNode02Active(nextState);
    
    if (!nextState) {
      setConnectingHosts(prev => ({ ...prev, "Host-Node-02": "offline" }));
      addLog(`⚠️ [INCIDENT INJECTED] Severe Hardware Failure on Host-Node-02 (${region}b)!`);
      addLog("🚨 [ORCHESTRATOR] Node-02 state set to OFFLINE. Initializing Pod Eviction protocols...");
    } else {
      setConnectingHosts(prev => ({ ...prev, "Host-Node-02": "connecting" }));
      addLog(`💚 [RESOLVED] Host-Node-02 restored successfully. Node joined cluster ${region}b back in healthy standby.`);
      setTimeout(() => {
        setConnectingHosts(prev => ({ ...prev, "Host-Node-02": "active" }));
        addLog(`📡 [TELEMETRY] Host-02 joined cluster successfully in zone ${region}b.`);
      }, 1000);
    }
  };

  // Trigger: Hot reload SSM Parameters
  const handleHotReload = () => {
    setSsmFlashing(true);
    addLog("⚙️ [SSM OVERRIDE] Parameter Store updated: SCORING_STRATEGY = provisional.");
    addLog("📡 [BROADCAST] Propagating configuration hot-reload trigger (SIGUSR1) to all active containers...");
    
    // Simulate updating active pods CPU loads during sync
    setSimulatedPods(prev => prev.map(p => {
      if (p.status.startsWith("Running")) {
        return { ...p, cpu: Math.min(p.cpu + 15, 95) };
      }
      return p;
    }));

    setTimeout(() => {
      setSsmFlashing(false);
      addLog("✅ [PROPAGATED] Parameters hot-reloaded dynamically on all container runners.");
    }, 1500);
  };

  // Simulated Pods progression intervals loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (simulatedPods.length === 0) return;

      setSimulatedPods(prevPods => {
        let updated = prevPods.map(pod => {
          // If pod is on crashed node and not yet evicted, mark it Evicted
          if (!node02Active && pod.node === "Host-Node-02" && pod.status !== "Evicted" && pod.status !== "Terminating") {
            setTimeout(() => {
              addLog(`🚨 [EVICTED] Rescheduling ${pod.id} onto healthy host nodes...`);
            }, 100);
            return {
              ...pod,
              status: "Evicted",
              progress: 0,
              cpu: 0,
              memory: 0
            };
          }

          // If pod completed or evicted, handle separately
          if (pod.status === "Evicted") {
            return pod;
          }

          if (pod.status === "Terminating") {
            return pod;
          }

          if (pod.progress >= 100) {
            return { ...pod, status: "Terminating" as const, progress: 100 };
          }

          // Normal progression increment
          const nextProgress = Math.min(pod.progress + Math.floor(Math.random() * 15) + 8, 100);
          let nextStatus = pod.status;
          let nextCpu = pod.cpu;
          let nextMemory = pod.memory;

          if (nextProgress < 25) {
            nextStatus = "Image Pulling";
            nextCpu = Math.floor(Math.random() * 15) + 5;
          } else if (nextProgress < 50) {
            nextStatus = "Warm Booting";
            nextCpu = Math.floor(Math.random() * 25) + 15;
            nextMemory = Math.min(pod.memory + 40, 256);
          } else if (nextProgress < 75) {
            nextStatus = "Running Examples";
            nextCpu = Math.floor(Math.random() * 45) + 30;
            nextMemory = Math.min(pod.memory + 60, 480);
          } else if (nextProgress < 100) {
            nextStatus = "Running Provisional";
            nextCpu = Math.floor(Math.random() * 35) + 45;
          } else {
            nextStatus = "Completed";
            nextCpu = 0;
          }

          return {
            ...pod,
            status: nextStatus as any,
            progress: nextProgress,
            cpu: nextCpu,
            memory: nextMemory
          };
        });

        // Handle Rescheduling of Evicted Pods
        const evictedCount = updated.filter(p => p.status === "Evicted").length;
        if (evictedCount > 0) {
          // Remove evicted items and spawn new healthy pods on remaining nodes
          const nonEvicted = updated.filter(p => p.status !== "Evicted");
          const replacementPods: SimulatedPod[] = Array.from({ length: evictedCount }).map((_, idx) => {
            // Alternate replacements between Node 1 and Node 3
            const targetNode = idx % 2 === 0 ? "Host-Node-01" : "Host-Node-03";
            return {
              id: `fargate-pod-resched-${Math.random().toString(36).substring(3, 7).toUpperCase()}`,
              node: targetNode,
              status: "Image Pulling",
              progress: 0,
              cpu: Math.floor(Math.random() * 20) + 5,
              memory: Math.floor(Math.random() * 100) + 120
            };
          });
          
          if (replacementPods.length > 0) {
            updated = [...nonEvicted, ...replacementPods];
          }
        }

        // Clean up Terminating pods
        const activeOnly = updated.filter(p => {
          if (p.status === "Terminating") {
            setTimeout(() => {
              addLog(`✅ [CONTAINER COMPLETE] Task pod ${p.id} successfully finished execution. Fargate scaling down node capacity.`);
            }, 10);
            return false;
          }
          return true;
        });

        return activeOnly;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [simulatedPods, node02Active]);

  // Dynamic calculations for displays
  const simulatedCount = simulatedPods.length;
  const isTrafficActive = activeTasks > 0 || simulatedCount > 0;

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      {/* Header with Simulator Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Server className="h-7 w-7 text-primary" />
            DevOps Architecture Map & Pod Orchestrator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive topology and live CloudStack cluster visualizer. Inject incident alerts and traffic triggers to observe automated recovery!
          </p>
        </div>
        {/* AWS Region Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-foreground self-start sm:self-center shadow-sm">
          <Globe className="h-4 w-4 text-cyan-400 animate-pulse" />
          <span className="font-semibold text-slate-300">Active AWS Region:</span>
          <select 
            value={region} 
            onChange={(e) => handleRegionChange(e.target.value)}
            className="bg-transparent border-0 focus:ring-0 text-cyan-400 font-mono font-bold cursor-pointer outline-none ml-1 focus:outline-none"
          >
            <option value="us-east-1" className="bg-slate-950 text-foreground">us-east-1 (N. Virginia)</option>
            <option value="us-west-2" className="bg-slate-950 text-foreground">us-west-2 (Oregon)</option>
            <option value="eu-west-1" className="bg-slate-950 text-foreground">eu-west-1 (Ireland)</option>
            <option value="ap-south-1" className="bg-slate-950 text-foreground">ap-south-1 (Mumbai)</option>
          </select>
        </div>
      </div>

      {/* DevOps Operations Control Triggers Panel */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase font-mono mr-2">
          <Settings className="h-4 w-4 text-primary" />
          Orchestration Controls:
        </span>
        
        <button
          onClick={handleTrafficSurge}
          disabled={simulatedCount > 0}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-lg transition-all shadow-md"
        >
          <Zap className="h-3.5 w-3.5 fill-current" />
          <span>Traffic Surge (15x Scale)</span>
        </button>

        <button
          onClick={handleToggleNode02}
          className={`flex items-center gap-1.5 font-semibold text-xs px-4 py-2.5 rounded-lg border transition-all shadow-sm ${
            node02Active 
              ? "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20" 
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{node02Active ? "Inject Node-02 Failure" : "Restore Node-02 Host"}</span>
        </button>

        <button
          onClick={handleHotReload}
          className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground border border-border font-semibold text-xs px-4 py-2.5 rounded-lg transition-all shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>SSM Hot-Reload Config</span>
        </button>
      </div>

      {/* SVG Map Canvas with Animated Flows */}
      <div className="glass-panel rounded-2xl p-6 overflow-hidden relative min-h-[480px] flex flex-col items-center justify-center border border-border shadow-sm">
        
        {/* Advanced Layer-by-Layer Scanner overlay */}
        {isScanning && (
          <div className="absolute inset-0 bg-cyan-500/[0.03] pointer-events-none z-20 overflow-hidden flex flex-col justify-between">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_10px_#22d3ee]" />
            <div className="w-full h-10 bg-gradient-to-b from-cyan-400/20 to-transparent animate-scanner-sweep pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-[10px] tracking-widest text-cyan-400 bg-slate-950/80 px-4 py-2 rounded-lg border border-cyan-500/30 shadow-lg animate-pulse uppercase">
                Scanning Region Topology: {region}...
              </span>
            </div>
          </div>
        )}

        {/* Absolute indicators */}
        <div className="absolute top-4 left-4 flex flex-col gap-1 font-mono text-[10px] text-muted-foreground bg-muted/70 border border-border rounded-md px-3 py-2 shadow-sm z-10">
          <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold">
            <span className={`h-2 w-2 rounded-full bg-cyan-500 ${isTrafficActive ? 'animate-ping' : ''}`} />
            Active Runner Pods: {activeTasks + simulatedCount}
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-bold">
            <span className={`h-2 w-2 rounded-full bg-amber-500 ${isTrafficActive ? 'animate-pulse' : ''}`} />
            MSK Event queue: {queueLength + (simulatedCount > 0 ? simulatedCount : 0)} streams
          </span>
        </div>

        {/* Dynamic Topology Layout Grid */}
        <div className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-y-16 items-center justify-items-center mt-6 z-10">
          
          {/* Step 1: Solution Submission */}
          <div className="glass-panel-accent rounded-xl p-4 w-44 flex flex-col items-center text-center relative hover:scale-105 transition-transform duration-300 shadow-sm border border-primary/20">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-2">
              <Zap className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-foreground">Client Portal</h4>
            <p className="text-[10px] text-muted-foreground mt-1">Web browser solution code upload triggers API push.</p>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-primary hidden md:block">
              <ArrowRight className="h-4 w-4 animate-pulse" />
            </div>
          </div>

          {/* Step 2: Kafka MSK Queue */}
          <div className={`glass-panel rounded-xl p-4 w-44 flex flex-col items-center text-center relative hover:scale-105 transition-transform duration-300 shadow-sm border border-border ${
            isTrafficActive ? "border-amber-500/40 dark:border-amber-500/30 shadow-md shadow-amber-500/5" : ""
          }`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-all ${
              isTrafficActive ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"
            }`}>
              <MessageSquare className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-foreground">Kafka MSK Buffer</h4>
            <p className="text-[10px] text-muted-foreground mt-1">Event stream buffers. Dynamic backlog triggers scales.</p>
            {isTrafficActive && (
              <span className="absolute -top-2 bg-amber-500 text-black font-mono font-bold text-[9px] px-2 py-0.5 rounded-full animate-bounce">
                ACTIVE
              </span>
            )}
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-muted-foreground hidden md:block">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          {/* Step 3: AWS Lambda Event Router */}
          <div className="glass-panel rounded-xl p-4 w-44 flex flex-col items-center text-center relative hover:scale-105 transition-transform duration-300 shadow-sm border border-border">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 flex items-center justify-center mb-2">
              <Play className="h-5 w-5 rotate-90" />
            </div>
            <h4 className="text-xs font-bold text-foreground">AWS Lambda</h4>
            <p className="text-[10px] text-muted-foreground mt-1">Triggers immediately, invokes Fargate runner instantiation.</p>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-muted-foreground hidden md:block">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          {/* Step 4: AWS ECS Fargate Cluster */}
          <div className={`glass-panel-accent rounded-xl p-4 w-44 flex flex-col items-center text-center relative hover:scale-105 transition-transform duration-300 shadow-sm ${
            isTrafficActive ? "border-cyan-500/40 dark:border-cyan-500/30 shadow-md shadow-cyan-500/5" : ""
          }`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-all ${
              isTrafficActive ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 animate-pulse" : "bg-muted text-muted-foreground"
            }`}>
              <Cpu className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-foreground">AWS ECS Fargate</h4>
            <p className="text-[10px] text-muted-foreground mt-1">On-demand Java evaluation container pods.</p>
            {(activeTasks > 0 || simulatedCount > 0) && (
              <span className="absolute -top-2 bg-cyan-500 dark:bg-cyan-400 text-black font-mono font-bold text-[9px] px-2 py-0.5 rounded-full animate-pulse">
                {activeTasks + simulatedCount} PODS
              </span>
            )}
          </div>

          {/* Spacer row to wrap grid elements nicely */}
          <div className="hidden md:block col-span-4 h-2 border-t border-border w-full my-4" />

          {/* Step 5: AWS SSM Parameter Store */}
          <div className={`glass-panel rounded-xl p-4 w-44 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300 shadow-sm border border-border ${
            ssmFlashing ? "border-violet-500/50 dark:border-violet-500/50 shadow-md shadow-violet-500/10 scale-105" : ""
          }`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-all ${
              ssmFlashing ? "bg-violet-500/30 text-violet-600 dark:text-violet-400 animate-bounce" : "bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400"
            }`}>
              <Settings className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-foreground">AWS Parameter Store</h4>
            <p className="text-[10px] text-muted-foreground mt-1">Configures timeouts, active test scales, and methods dynamically.</p>
          </div>

          {/* Step 6: AWS RDS PostgreSQL */}
          <div className="glass-panel rounded-xl p-4 w-44 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300 shadow-sm border border-border">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
              <Database className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-foreground">AWS RDS Postgres</h4>
            <p className="text-[10px] text-muted-foreground mt-1">Maintains challenge parameters and transaction scorer history.</p>
          </div>

          {/* Step 7: External Review Callback API */}
          <div className="glass-panel rounded-xl p-4 w-44 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300 shadow-sm border border-border">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-foreground">Review API Call</h4>
            <p className="text-[10px] text-muted-foreground mt-1">Dispatches scores to final scoreboard system instantly.</p>
          </div>
        </div>

        {/* Decorative Grid SVG background elements connecting nodes */}
        <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 pointer-events-none hidden md:block">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path id="flowPath" d="M 120 120 Q 320 120 320 120 T 520 120 T 720 120 T 720 380 T 520 380 T 320 380 Z" fill="none" stroke="rgba(128,128,128,0.4)" strokeWidth="2" strokeDasharray="5,5" />
            {/* Glowing Packet Stream Animating on demand */}
            {isTrafficActive && (
              <>
                <circle r="6" fill="#8b5cf6" className="shadow-md">
                  <animateMotion dur="4s" repeatCount="indefinite" path="M 120 120 Q 320 120 320 120 T 520 120 T 720 120 T 720 380 T 520 380 T 320 380 Z" />
                </circle>
                <circle r="4" fill="#06b6d4" className="shadow-md">
                  <animateMotion dur="4s" begin="1.3s" repeatCount="indefinite" path="M 120 120 Q 320 120 320 120 T 520 120 T 720 120 T 720 380 T 520 380 T 320 380 Z" />
                </circle>
                <circle r="5" fill="#f59e0b" className="shadow-md">
                  <animateMotion dur="4s" begin="2.6s" repeatCount="indefinite" path="M 120 120 Q 320 120 320 120 T 520 120 T 720 120 T 720 380 T 520 380 T 320 380 Z" />
                </circle>
              </>
            )}
          </svg>
        </div>
      </div>

      {/* CloudStack Node Host Infrastructure & Live Orchestrator console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Kubernetes/CloudStack Hosts Panels */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
            <HardDrive className="h-4.5 w-4.5 text-primary" />
            CloudStack Infrastructure Cluster Hosts
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Host Node 01 */}
            <div className={`glass-panel border rounded-xl p-4 space-y-3 shadow-sm flex flex-col justify-between transition-all duration-300 ${
              connectingHosts["Host-Node-01"] === "connecting" ? "border-cyan-500/30 bg-cyan-500/[0.02]" : "border-border"
            }`}>
              <div>
                <div className="flex items-center justify-between border-b border-border pb-1.5">
                  <span className="text-xs font-bold text-foreground">{getZoneLabel("a")} (Host-01)</span>
                  <span className={`h-2 w-2 rounded-full ${
                    connectingHosts["Host-Node-01"] === "active" ? "bg-emerald-500 animate-pulse" :
                    connectingHosts["Host-Node-01"] === "connecting" ? "bg-cyan-400 animate-pulse" : "bg-muted"
                  }`} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-[9px] text-muted-foreground">
                  <div>CPU Health: <strong>{connectingHosts["Host-Node-01"] === "active" ? "100%" : "0%"}</strong></div>
                  <div>Status: <strong className={
                    connectingHosts["Host-Node-01"] === "active" ? "text-emerald-500 uppercase" :
                    connectingHosts["Host-Node-01"] === "connecting" ? "text-cyan-400 uppercase" : "text-muted-foreground uppercase"
                  }>{connectingHosts["Host-Node-01"]}</strong></div>
                  <div>RAM Load: <strong>{connectingHosts["Host-Node-01"] === "active" ? "34%" : "-"}</strong></div>
                  <div>Hosted: <strong>{connectingHosts["Host-Node-01"] === "active" ? simulatedPods.filter(p => p.node === "Host-Node-01").length : 0} pods</strong></div>
                </div>
              </div>
              <div className="pt-2 border-t border-border flex items-center gap-1">
                {connectingHosts["Host-Node-01"] === "active" ? (
                  <>
                    <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-muted-foreground font-mono">Telemetry link established</span>
                  </>
                ) : connectingHosts["Host-Node-01"] === "connecting" ? (
                  <>
                    <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin" />
                    <span className="text-[9px] text-cyan-400 font-mono font-semibold animate-pulse">Establishing socket...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground font-mono font-semibold">Telemetry link offline</span>
                  </>
                )}
              </div>
            </div>

            {/* Host Node 02 */}
            <div className={`glass-panel border rounded-xl p-4 space-y-3 shadow-sm flex flex-col justify-between transition-all duration-300 ${
              !node02Active ? "border-destructive/30 bg-destructive/5" :
              connectingHosts["Host-Node-02"] === "connecting" ? "border-cyan-500/30 bg-cyan-500/[0.02]" : "border-border"
            }`}>
              <div>
                <div className="flex items-center justify-between border-b border-border pb-1.5">
                  <span className="text-xs font-bold text-foreground">{getZoneLabel("b")} (Host-02)</span>
                  <span className={`h-2 w-2 rounded-full ${
                    !node02Active ? 'bg-destructive animate-ping' :
                    connectingHosts["Host-Node-02"] === "active" ? "bg-emerald-500 animate-pulse" :
                    connectingHosts["Host-Node-02"] === "connecting" ? "bg-cyan-400 animate-pulse" : "bg-muted"
                  }`} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-[9px] text-muted-foreground">
                  <div>CPU Health: <strong>{node02Active && connectingHosts["Host-Node-02"] === "active" ? "100%" : "0%"}</strong></div>
                  <div>Status: <strong className={
                    !node02Active ? "text-destructive uppercase" :
                    connectingHosts["Host-Node-02"] === "active" ? "text-emerald-500 uppercase" :
                    connectingHosts["Host-Node-02"] === "connecting" ? "text-cyan-400 uppercase" : "text-muted-foreground uppercase"
                  }>{!node02Active ? "Offline" : connectingHosts["Host-Node-02"]}</strong></div>
                  <div>RAM Load: <strong>{node02Active && connectingHosts["Host-Node-02"] === "active" ? "28%" : "-"}</strong></div>
                  <div>Hosted: <strong>{node02Active && connectingHosts["Host-Node-02"] === "active" ? simulatedPods.filter(p => p.node === "Host-Node-02").length : 0} pods</strong></div>
                </div>
              </div>
              <div className="pt-2 border-t border-border flex items-center gap-1">
                {!node02Active ? (
                  <>
                    <AlertTriangle className="h-3 w-3 text-destructive animate-bounce" />
                    <span className="text-[9px] text-destructive font-mono font-semibold">Incident: Rescheduling...</span>
                  </>
                ) : connectingHosts["Host-Node-02"] === "active" ? (
                  <>
                    <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-muted-foreground font-mono">Telemetry link established</span>
                  </>
                ) : connectingHosts["Host-Node-02"] === "connecting" ? (
                  <>
                    <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin" />
                    <span className="text-[9px] text-cyan-400 font-mono font-semibold animate-pulse">Establishing socket...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground font-mono font-semibold">Telemetry link offline</span>
                  </>
                )}
              </div>
            </div>

            {/* Host Node 03 */}
            <div className={`glass-panel border rounded-xl p-4 space-y-3 shadow-sm flex flex-col justify-between transition-all duration-300 ${
              connectingHosts["Host-Node-03"] === "connecting" ? "border-cyan-500/30 bg-cyan-500/[0.02]" : "border-border"
            }`}>
              <div>
                <div className="flex items-center justify-between border-b border-border pb-1.5">
                  <span className="text-xs font-bold text-foreground">{getZoneLabel("c")} (Host-03)</span>
                  <span className={`h-2 w-2 rounded-full ${
                    connectingHosts["Host-Node-03"] === "active" ? "bg-emerald-500 animate-pulse" :
                    connectingHosts["Host-Node-03"] === "connecting" ? "bg-cyan-400 animate-pulse" : "bg-muted"
                  }`} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-[9px] text-muted-foreground">
                  <div>CPU Health: <strong>{connectingHosts["Host-Node-03"] === "active" ? "100%" : "0%"}</strong></div>
                  <div>Status: <strong className={
                    connectingHosts["Host-Node-03"] === "active" ? "text-emerald-500 uppercase" :
                    connectingHosts["Host-Node-03"] === "connecting" ? "text-cyan-400 uppercase" : "text-muted-foreground uppercase"
                  }>{connectingHosts["Host-Node-03"]}</strong></div>
                  <div>RAM Load: <strong>{connectingHosts["Host-Node-03"] === "active" ? "22%" : "-"}</strong></div>
                  <div>Hosted: <strong>{connectingHosts["Host-Node-03"] === "active" ? simulatedPods.filter(p => p.node === "Host-Node-03").length : 0} pods</strong></div>
                </div>
              </div>
              <div className="pt-2 border-t border-border flex items-center gap-1">
                {connectingHosts["Host-Node-03"] === "active" ? (
                  <>
                    <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-muted-foreground font-mono">Telemetry link established</span>
                  </>
                ) : connectingHosts["Host-Node-03"] === "connecting" ? (
                  <>
                    <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin" />
                    <span className="text-[9px] text-cyan-400 font-mono font-semibold animate-pulse">Establishing socket...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground font-mono font-semibold">Telemetry link offline</span>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Interactive AWS Cloud Shell Terminal */}
        <div className="lg:col-span-4 flex flex-col space-y-2">
          <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
            <Terminal className="h-4.5 w-4.5 text-primary" />
            Interactive AWS Cloud Shell
          </h3>

          <div className="flex-1 bg-slate-950 text-slate-200 border border-slate-800 rounded-xl p-4 font-mono text-[9px] leading-relaxed flex flex-col justify-between min-h-[220px] shadow-sm">
            <div className="space-y-1.5 overflow-y-auto max-h-[140px] flex-1 pr-1.5 scrollbar-thin">
              {consoleLogs.map((log, index) => {
                let textClass = "text-slate-400";
                if (log.includes("LOAD TRAFFIC SURGE") || log.includes("PROPAGATED") || log.includes("✔")) textClass = "text-emerald-400";
                else if (log.includes("INCIDENT INJECTED") || log.includes("EVICTED") || log.includes("WARNING") || log.includes("[ERROR]")) textClass = "text-rose-400";
                else if (log.includes("SSM OVERRIDE") || log.includes("📡") || log.includes("💻")) textClass = "text-violet-400 font-bold";
                else if (log.includes("KAFKA") || log.includes("AWS") || log.includes("aws-shell")) textClass = "text-cyan-400";
                
                return (
                  <div key={index} className={textClass}>
                    {log}
                  </div>
                );
              })}
              <div ref={logEndRef} />
            </div>
            
            <form onSubmit={handleCommandSubmit} className="border-t border-slate-900 pt-2.5 flex items-center gap-1.5 text-[10px] text-slate-300">
              <span className="text-emerald-400 font-bold font-mono">aws-shell ({region}) $</span>
              <input 
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none p-0 text-slate-200 focus:ring-0 text-[10px] font-mono leading-none border-b border-transparent focus:border-cyan-500/20"
                placeholder="type 'help' for commands..."
              />
            </form>
          </div>
        </div>

      </div>

      {/* Grid of Dynamic Simulated Active Container Pods */}
      {simulatedCount > 0 && (
        <div className="space-y-4 animate-slide-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-cyan-500 animate-spin" />
              ECS Cluster Live Orchestrator: Dynamic Task Pods
            </h3>
            <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20 font-bold animate-pulse">
              AUTOSCALING SURGE RUNNING
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {simulatedPods.map((pod) => {
              let statusColor = "bg-muted text-muted-foreground border-border";
              if (pod.status === "Image Pulling") statusColor = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25";
              else if (pod.status === "Warm Booting") statusColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25";
              else if (pod.status === "Running Examples") statusColor = "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25";
              else if (pod.status === "Running Provisional") statusColor = "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25";
              else if (pod.status === "Completed") statusColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25";
              else if (pod.status === "Evicted") statusColor = "bg-destructive/10 text-destructive border-destructive/25";
              
              return (
                <div 
                  key={pod.id} 
                  className={`glass-panel border rounded-xl p-3.5 space-y-3 shadow-sm hover:scale-[1.01] transition-transform ${
                    pod.status === "Evicted" ? "border-destructive/30 bg-destructive/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-foreground flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-cyan-500" />
                      {pod.id}
                    </span>
                    <span className="text-[8px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded uppercase">
                      {pod.node.split("-").pop()}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${statusColor} block text-center w-full shadow-inner font-mono`}>
                    {pod.status}
                  </span>

                  {/* Dynamic Progress indicator */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[8px] font-mono text-muted-foreground">
                      <span>RUNNER PROCESS</span>
                      <span>{pod.progress}%</span>
                    </div>
                    <div className="w-full bg-muted/80 rounded-full h-1 overflow-hidden border border-border">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          pod.status === "Evicted" ? "bg-destructive" :
                          pod.status === "Completed" ? "bg-emerald-500" : "bg-primary"
                        }`}
                        style={{ width: `${pod.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Container statistics block */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-border font-mono text-[8px] text-muted-foreground">
                    <div>
                      CPU: <strong className="text-foreground">{pod.cpu}%</strong>
                    </div>
                    <div className="text-right">
                      RAM: <strong className="text-foreground">{pod.memory}MB</strong>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
