import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../main";
import { 
  Settings, Key, AlertCircle, Save, CheckCircle, 
  Settings2, HelpCircle, ToggleLeft, Edit3, Plus, Trash2, X
} from "lucide-react";

export default function ParameterStore() {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saveSuccessKey, setSaveSuccessKey] = useState<string | null>(null);

  // New Parameter state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState("String");
  const [formError, setFormError] = useState("");

  // Fetch all SSM Parameter configs
  const { data: parameters } = useQuery<any[]>({
    queryKey: ["/api/parameters"]
  });

  // Mutator to update config values in database
  const updateParameter = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await fetch(`/api/parameters/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value })
      });
      if (!response.ok) throw new Error("AWS SSM Parameter modification failed.");
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/parameters"] });
      setSaveSuccessKey(data.key);
      setEditingKey(null);
      setTimeout(() => {
        setSaveSuccessKey(null);
      }, 3000);
    }
  });

  // Mutator to create a new parameter
  const createParameter = useMutation({
    mutationFn: async (param: { key: string; value: string; description: string; type: string }) => {
      const response = await fetch("/api/parameters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(param)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "AWS SSM Parameter creation failed.");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parameters"] });
      setNewKey("");
      setNewValue("");
      setNewDescription("");
      setNewType("String");
      setShowAddForm(false);
      setFormError("");
    },
    onError: (err: any) => {
      setFormError(err.message);
    }
  });

  // Mutator to delete a parameter
  const deleteParameter = useMutation({
    mutationFn: async (key: string) => {
      const response = await fetch(`/api/parameters/${key}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("AWS SSM Parameter deletion failed.");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parameters"] });
    }
  });

  const handleEdit = (param: any) => {
    setEditingKey(param.key);
    setEditValue(param.value);
  };

  const handleSave = (key: string) => {
    if (!editValue.trim()) return;
    updateParameter.mutate({ key, value: editValue });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    // Formatting validation
    const keyRegex = /^[A-Z_]+$/;
    if (!keyRegex.test(newKey)) {
      setFormError("Key must be UPPERCASE_ONLY and contain only letters and underscores (e.g. TIMEOUT_LIMIT).");
      return;
    }
    if (!newKey || !newValue || !newDescription) {
      setFormError("All fields are required.");
      return;
    }

    createParameter.mutate({
      key: newKey,
      value: newValue,
      description: newDescription,
      type: newType
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      {/* Header with Creation Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" />
            AWS Parameter Store (SSM)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Adjust live environment configuration properties. Changes propagate dynamically to active ECS Fargate tasks without code deployments.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-lg transition-all shadow-md self-start sm:self-center"
        >
          {showAddForm ? (
            <>
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span>Add SSM Parameter</span>
            </>
          )}
        </button>
      </div>

      {/* Add Parameter form drawer card */}
      {showAddForm && (
        <form 
          onSubmit={handleAddSubmit}
          className="glass-panel rounded-xl p-5 border border-primary/20 space-y-4 animate-slide-in"
        >
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Key className="h-4 w-4 text-primary" />
            New Environment Overrides configuration
          </h3>

          {formError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase font-mono">
                Parameter Key (UPPERCASE_ONLY)
              </label>
              <input
                type="text"
                placeholder="SCORER_TIMING_MS"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase font-mono">
                Default Value
              </label>
              <input
                type="text"
                placeholder="5000"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase font-mono">
                Storage Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
              >
                <option value="String">String</option>
                <option value="SecureString">SecureString</option>
                <option value="StringList">StringList</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase font-mono">
              Parameter Description
            </label>
            <input
              type="text"
              placeholder="Description detailing what this specific parameter sync accomplishes in ECR Fargate clusters..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createParameter.isPending}
              className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md"
            >
              {createParameter.isPending ? "Creating..." : "Save Parameter"}
            </button>
          </div>
        </form>
      )}

      {/* Info Warning banner */}
      <div className="glass-panel rounded-xl p-4 border-l-4 border-violet-500 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-violet-500 dark:text-violet-400 mt-0.5 shrink-0" />
        <div className="text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Active Propagation Sync:</strong> These configuration parameters represent variables hosted in AWS Systems Manager Parameter Store. During scoring container bootstrapping, the Fargate agent calls Systems Manager using SSM API bindings, updating its core evaluation strategies in real-time. Feel free to tweak these values to alter scoring speed or maximum capacity!
        </div>
      </div>

      {/* Parameters grid listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {parameters?.map((param) => {
          const isEditing = editingKey === param.key;
          const isSaving = updateParameter.isPending && editingKey === param.key;
          const showSuccess = saveSuccessKey === param.key;

          return (
            <div 
              key={param.key} 
              className={`glass-panel rounded-xl p-5 border flex flex-col justify-between transition-all duration-300 ${
                isEditing ? "border-primary/40 bg-primary/5" : "border-border/40 hover:border-primary/20"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground tracking-tight">
                    <Key className="h-3.5 w-3.5 text-violet-500" />
                    /marathon/scorer/{param.key}
                  </span>
                  
                  {/* Status lights */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded font-semibold uppercase">
                      {param.type}
                    </span>

                    {/* Only display delete button if user created parameter or dynamic defaults */}
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete parameter /marathon/scorer/${param.key}?`)) {
                          deleteParameter.mutate(param.key);
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                      title="Delete SSM parameter"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {param.description}
                </p>
              </div>

              {/* Form editing area */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-4">
                {isEditing ? (
                  <div className="flex items-center gap-2 w-full">
                    {param.key === "SCORING_STRATEGY" ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="example">example (evaluate example suite only)</option>
                        <option value="provisional">provisional (evaluate provisional suite only)</option>
                        <option value="both">both (evaluate example and provisional)</option>
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                      />
                    )}
                    <button
                      onClick={() => handleSave(param.key)}
                      disabled={isSaving}
                      className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                    >
                      <Save className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingKey(null)}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="font-mono text-xs text-foreground">
                      <span>VALUE: </span>
                      <strong className="text-primary font-bold">{param.value}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {showSuccess && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold animate-pulse">
                          <CheckCircle className="h-3 w-3" />
                          UPDATED
                        </span>
                      )}
                      <button
                        onClick={() => handleEdit(param)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 border border-border rounded-lg px-3 py-1.5 transition-all font-semibold"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        OVERRIDE
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Local Parameter Config explanation panel */}
      <div className="glass-panel rounded-xl p-5 space-y-4 border border-border">
        <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
          <Settings2 className="h-4 w-4 text-primary" />
          Dynamically Testing the Parameter Store overrides
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Watch the real-time interaction between parameter store keys and active scoring tasks:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[10px] text-muted-foreground mt-2">
          <div className="bg-muted/40 border border-border rounded-lg p-3">
            <strong className="text-foreground block mb-1">SCORING_STRATEGY</strong>
            Set to <code className="text-primary font-bold">"example"</code>. Submissions will evaluate only warm-up tests, completing in under 2 seconds! Set back to <code className="text-primary font-bold">"provisional"</code> to view standard multi-stage scoring.
          </div>
          <div className="bg-muted/40 border border-border rounded-lg p-3">
            <strong className="text-foreground block mb-1">FARGATE_STARTUP_DELAY_MS</strong>
            Lower this parameter to <code className="text-primary font-bold">"1000"</code> (1s). Active simulation boot speeds, image pull timings, and ECS container triggers will execute almost instantly!
          </div>
          <div className="bg-muted/40 border border-border rounded-lg p-3">
            <strong className="text-foreground block mb-1">MAX_CONCURRENT_TASKS</strong>
            Lower this capacity to <code className="text-primary font-bold">"1"</code> and submit multiple solutions consecutively inside the Simulator tab to watch the queue system holding back active submissions!
          </div>
        </div>
      </div>
    </div>
  );
}
