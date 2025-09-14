import React, { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Undo2, CheckCircle2, AlertTriangle, Clock, Info, Loader2, PlayCircle } from "lucide-react";
import OnePager from "./OnePager";
import { useWispr } from "../lib/wispr";
import { Stopwatch } from "./Stopwatch";
import { Metrics } from "./Metrics";
import { FlowDebrief } from "./FlowDebrief";

type AppState = any;

export default function App() {
  const [data, setData] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [manualText, setManualText] = useState("");
  const [showFlowDebrief, setShowFlowDebrief] = useState(false);
  const [metrics, setMetrics] = useState({
    conflictsDetected: 0,
    autoResolved: 0,
    staged: 0,
    blocked: 0,
    timeToInsight: 0,
    precisionAtApply: 1.0
  });
  const [insightStartTime, setInsightStartTime] = useState<number | null>(null);
  // Function to process manual text input (from desktop WISPR Flow)
  const processManualText = async (text: string) => {
    console.log("Manual text input:", text);
    if (!text || text.trim().length === 0) return;
    
    setLoading(true);
    const t0 = performance.now();
    
    try {
      // Use the same logic as voice input
      const low = text.toLowerCase();
      const endpoint = low.includes("bookmark that") ? "/api/bookmark" : "/api/storytime";
      console.log(`Sending manual text to ${endpoint}:`, text);

      const postCtrl = new AbortController();
      const postTimeout = setTimeout(() => postCtrl.abort(), 15000);
      const res = await fetch(`${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
        signal: postCtrl.signal
      });
      clearTimeout(postTimeout);

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const js = await res.json();
      console.log("API response:", js);
      
      if (endpoint.endsWith("storytime")) {
        setInsight(js.actionableInsight);
        // Update metrics based on response
        if (js.proposed) {
          const newMetrics = { ...metrics };
          newMetrics.conflictsDetected += js.proposed.length;
          
          js.proposed.forEach((item: any) => {
            if (item.status === "auto_applied") {
              newMetrics.autoResolved++;
            } else if (item.status === "staged") {
              newMetrics.staged++;
            } else if (item.status === "blocked") {
              newMetrics.blocked++;
            }
          });
          
          // Calculate time to insight
          if (insightStartTime) {
            newMetrics.timeToInsight = (performance.now() - insightStartTime) / 1000;
          }
          
          setMetrics(newMetrics);
        }
      } else if (js.banner) {
        setToast(js.banner);
        setTimeout(() => setToast(null), 2500);
      }
      
      setToast("📝 Text processed successfully!");
      setTimeout(() => setToast(null), 3000);
      
    } catch (err) {
      console.error("API call failed:", err);
      setToast("Error processing text. Please try again.");
      setTimeout(() => setToast(null), 3000);
    } finally {
      // Refresh data
      try {
        const getCtrl = new AbortController();
        const getTimeout = setTimeout(() => getCtrl.abort(), 12000);
        const res2 = await fetch("/api/data", { signal: getCtrl.signal });
        clearTimeout(getTimeout);
        if (res2.ok) {
          setData(await res2.json());
        }
      } catch (e) {
        console.warn("/api/data refresh failed", e);
      }
      setLoading(false);
      (window as any).__ROX_STOPWATCH?.stop();
    }
  };

  const { startPTT, stopPTT, isFallback, isDictating, error, supported } = useWispr({
    onTranscriptFinal: async (t) => {
      console.log("🎤 Transcript received:", t); // Debug log
      console.log("🎤 Transcript length:", t?.trim().length); // Debug log
      if (!t || t.trim().length === 0) {
        console.log("❌ Empty transcript, skipping");
        return;
      }
      
      // Heuristic: if user said "bookmark that" send /bookmark, else treat as storytime
      const low = (t || "").toLowerCase();
      console.log("🎤 Lowercase transcript:", low); // Debug log
      console.log("🎤 Contains 'bookmark that':", low.includes("bookmark that")); // Debug log
      
      setLoading(true);
      setInsightStartTime(performance.now());
      const t0 = performance.now();
      try {
        const endpoint = low.includes("bookmark that") ? "/api/bookmark" : "/api/storytime";
        console.log(`🚀 Sending to ${endpoint}:`, t); // Debug log

        // POST with timeout
        const postCtrl = new AbortController();
        const postTimeout = setTimeout(() => postCtrl.abort(), 15000);
          const res = await fetch(`${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: t }),
          signal: postCtrl.signal
        });
        clearTimeout(postTimeout);

        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }

        const js = await res.json();
        console.log("API response:", js); // Debug log
        
        if (endpoint.endsWith("storytime")) {
          setInsight(js.actionableInsight);
        } else if (js.banner) {
          setToast(js.banner);
          setTimeout(() => setToast(null), 2500);
        }
      } catch (err) {
        console.error("API call failed:", err);
        setToast("Error processing speech. Please try again.");
        setTimeout(() => setToast(null), 3000);
      } finally {
        // Refresh with timeout
        try {
          const getCtrl = new AbortController();
          const getTimeout = setTimeout(() => getCtrl.abort(), 12000);
          const res2 = await fetch("/api/data", { signal: getCtrl.signal });
          clearTimeout(getTimeout);
          if (res2.ok) {
            setData(await res2.json());
          }
        } catch (e) {
          console.warn("/api/data refresh failed", e);
        }
        setLoading(false);
        (window as any).__ROX_STOPWATCH?.stop();
      }
      // stopwatch stops when Actionable Insight renders
    },
    onStart: () => { setIsProcessing(true); (window as any).__ROX_STOPWATCH?.start(); },
    onStop: () => setIsProcessing(false),
  });

  useEffect(() => {
    // Reset to demo state on page load
    fetch("/api/reset-demo", { method: "POST" })
      .then(() => fetch("/api/data"))
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  // System dictation is handled by the useWispr hook
  // Cleanup is handled by the useWispr hook

  // Not using word counter with system dictation
  const words: string[] = [];

  // Not using word counter with system dictation
  const builderBadge = useMemo(() => (
    <div className="pill">System Dictation</div>
  ), []);

  if (!data) return <div className="p-10 text-slate-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 animate-pulse shadow-lg shadow-emerald-400/20" />
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 animate-ping opacity-20" />
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Nexus
            </div>
            <div className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 rounded-full border border-emerald-500/30 backdrop-blur-sm">
              Demo Tenant
            </div>
            <div className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 rounded-full border border-blue-500/30 backdrop-blur-sm">
              Balanced Mode
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Stopwatch />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Error States */}
            {!supported && (
              <div className="p-4 bg-gradient-to-r from-rose-500/10 to-red-500/10 border border-rose-500/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-rose-400" size={20} />
                  <div className="text-rose-200 font-medium">Browser Not Supported</div>
                </div>
                <div className="text-rose-300/80 text-sm mt-1">
                  Speech recognition not available. Use Chrome desktop or integrate Wispr Flow SDK.
                </div>
              </div>
          )}

          {/* WISPR Flow Integration Options */}
          {isFallback && supported && (
            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-blue-200 font-semibold">🎤 WISPR Flow Integration</div>
                <button
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  className="px-3 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                >
                  {showApiKeyInput ? "Hide" : "Setup Options"}
                </button>
              </div>
              <div className="text-blue-300/80 text-sm mb-3">
                Currently using Web Speech API fallback. Choose your preferred WISPR Flow integration method.
              </div>
              
              {showApiKeyInput && (
                <div className="space-y-4">
                  {/* Option 1: Web API */}
                  <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="text-blue-200 text-sm font-medium mb-2">Option 1: WISPR Flow Web API (Recommended)</div>
                    <div className="text-blue-300/80 text-sm mb-3">
                      Use WISPR Flow's web API directly in your browser. Same quality as desktop app.
                    </div>
                    <ol className="text-blue-300/80 text-sm space-y-1 ml-4 mb-3">
                      <li>1. Visit <a href="https://platform.wisprflow.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">WISPR Flow Platform</a></li>
                      <li>2. Sign up or log in</li>
                      <li>3. Go to "API Keys" section</li>
                      <li>4. Create a new API key</li>
                      <li>5. Paste it below:</li>
                    </ol>
                    
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Your WISPR Flow API key..."
                        className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim()) {
                              localStorage.setItem('wispr_api_key', input.value.trim());
                              setToast("🎉 WISPR Flow API key saved! Refresh the page to use WISPR Flow.");
                              setTimeout(() => setToast(null), 3000);
                              input.value = '';
                              setShowApiKeyInput(false);
                            }
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const input = document.querySelector('input[type="password"]') as HTMLInputElement;
                          if (input?.value.trim()) {
                            localStorage.setItem('wispr_api_key', input.value.trim());
                            setToast("🎉 WISPR Flow API key saved! Refresh the page to use WISPR Flow.");
                            setTimeout(() => setToast(null), 3000);
                            input.value = '';
                            setShowApiKeyInput(false);
                          }
                        }}
                        className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Option 2: Desktop Integration */}
                  <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="text-blue-200 text-sm font-medium mb-2">Option 2: Use Your Desktop WISPR Flow</div>
                    <div className="text-blue-300/80 text-sm mb-3">
                      Use your existing WISPR Flow desktop app with Fn key dictation.
                    </div>
                    <div className="space-y-2 text-blue-300/80 text-sm">
                      <div className="font-medium">How to use:</div>
                      <ol className="space-y-1 ml-4">
                        <li>1. Keep this app open in your browser</li>
                        <li>2. Click in the text input area below</li>
                        <li>3. Press <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Fn</kbd> to start WISPR Flow dictation</li>
                        <li>4. Speak your text</li>
                        <li>5. Press <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Fn</kbd> again to stop</li>
                        <li>6. The text will appear in the input, then click "Process Text"</li>
                      </ol>
                    </div>
                    
                    <div className="mt-3 p-3 bg-slate-900/50 rounded border border-slate-600/50">
                      <div className="text-blue-200 text-sm font-medium mb-2">Manual Text Input:</div>
                      <div className="flex gap-2">
                        <textarea
                          placeholder="Type or paste text here (use Fn key for WISPR Flow dictation)..."
                          className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500/50 resize-none"
                          rows={3}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              const textarea = e.target as HTMLTextAreaElement;
                              if (textarea.value.trim()) {
                                processManualText(textarea.value.trim());
                                textarea.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            const textarea = (e.target as HTMLElement).parentElement?.querySelector('textarea') as HTMLTextAreaElement;
                            if (textarea?.value.trim()) {
                              processManualText(textarea.value.trim());
                              textarea.value = '';
                            }
                          }}
                          className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                        >
                          Process Text
                        </button>
                      </div>
                      <div className="text-slate-400 text-xs mt-2">
                        💡 Tip: Use <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">Ctrl+Enter</kbd> to quickly process text
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-400" size={20} />
                <div className="text-amber-200 font-medium">Speech Error</div>
              </div>
              <div className="text-amber-300/80 text-sm mt-1">{error}</div>
            </div>
          )}

          {/* Actionable Insight */}
          {insight && (
            <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl backdrop-blur-sm shadow-lg shadow-emerald-500/5">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="text-emerald-400" size={22} />
                <div className="text-emerald-300 font-semibold text-lg">Actionable Insight</div>
              </div>
              <div className="text-white text-lg leading-relaxed whitespace-pre-line">{insight}</div>
            </div>
          )}

          {/* Toast Notification */}
          {toast && (
            <div className="p-4 bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Info className="text-sky-400" size={20} />
                <div className="text-sky-200">{toast}</div>
              </div>
            </div>
          )}


          {/* Push-to-Talk Section */}
          <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="text-slate-400 text-sm">
                {isDictating ? (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Listening...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500"></span>
                    </span>
                    Click button to start dictating
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                className={`
                  group relative px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 
                  ${isDictating 
                    ? 'bg-gradient-to-r from-rose-500 to-red-500 shadow-lg shadow-rose-500/25 scale-105' 
                    : 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 shadow-lg hover:shadow-xl hover:scale-105'
                  }
                  border ${isDictating ? 'border-rose-400/50' : 'border-slate-500/50'}
                  backdrop-blur-sm
                `}
                onClick={() => {
                  if (isDictating) {
                    stopPTT();
                  } else {
                    startPTT();
                  }
                }}
                aria-pressed={isDictating}
              >
                <div className="flex items-center gap-3">
                  {isDictating ? (
                    <Mic className="animate-pulse" size={20} />
                  ) : (
                    <MicOff size={20} />
                  )}
                  <span>{isDictating ? "Stop Listening" : "Start Speaking"}</span>
                </div>
                {isDictating && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-500/20 to-red-500/20 animate-pulse" />
                )}
              </button>
              
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <div className={`w-2 h-2 rounded-full ${isDictating ? 'bg-emerald-400' : 'bg-slate-500'} animate-pulse`} />
                  <span>{isDictating ? "🎤 Listening for speech..." : "Click button to start dictating"}</span>
                </div>
                
                {/* Debug Test Button */}
                <button
                  onClick={() => {
                    console.log("🧪 Testing with 'bookmark that test item'");
                    processManualText("bookmark that test item");
                  }}
                  className="px-3 py-1 text-xs bg-purple-500/20 text-purple-300 rounded border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                >
                  Test Bookmark
                </button>
                
                {/* Flow Debrief Button */}
                <button
                  onClick={() => setShowFlowDebrief(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg"
                >
                  📝 Debrief (Flow)
                </button>
            </div>
          </div>

          {/* OnePager Component */}
          <OnePager 
            data={data} 
            onUndo={async () => {
              await fetch("/api/undo", { method: "POST" });
              const res = await fetch("/api/data");
              if (res.ok) setData(await res.json());
            }}
            onApply={async (id: string) => {
              await fetch("/api/apply", { 
                method: "POST", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
              });
              const res = await fetch("/api/data");
              if (res.ok) setData(await res.json());
            }}
          />
          </div>
        </div>

        {/* Sidebar with Metrics */}
        <div className="lg:col-span-1 space-y-6">
          <Metrics data={metrics} />
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800/90 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm shadow-2xl">
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin text-emerald-400" size={18} />
              <span className="font-medium">Processing your request…</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Flow Debrief Overlay */}
      <FlowDebrief
        isOpen={showFlowDebrief}
        onClose={() => setShowFlowDebrief(false)}
        onSubmit={async (text: string) => {
          setLoading(true);
          try {
            const res = await fetch("/api/storytime", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transcript: text })
            });
            
            if (res.ok) {
              const result = await res.json();
              if (result.actionableInsight) {
                setInsight(result.actionableInsight);
              }
              // Refresh data
              const dataRes = await fetch("/api/data");
              if (dataRes.ok) setData(await dataRes.json());
            }
          } catch (error) {
            console.error("Flow debrief failed:", error);
            setToast("Error processing debrief. Please try again.");
            setTimeout(() => setToast(null), 3000);
          } finally {
            setLoading(false);
          }
        }}
        isLoading={loading}
      />
    </div>
  );
}
