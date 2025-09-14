import React from "react";
import { BarChart3, Clock, CheckCircle2, AlertTriangle, Pause } from "lucide-react";

interface MetricsData {
  conflictsDetected: number;
  autoResolved: number;
  staged: number;
  blocked: number;
  timeToInsight: number;
  precisionAtApply: number;
}

interface MetricsProps {
  data: MetricsData;
  isVisible?: boolean;
}

export function Metrics({ data, isVisible = true }: MetricsProps) {
  if (!isVisible) return null;

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl backdrop-blur-sm p-4 space-y-3">
      <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
        <BarChart3 size={16} />
        <span>Session Metrics</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Conflicts Detected */}
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-xs text-slate-400">Conflicts</span>
          </div>
          <div className="text-lg font-bold text-white">{data.conflictsDetected}</div>
        </div>

        {/* Auto-Resolved */}
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="text-xs text-slate-400">Auto-Resolved</span>
          </div>
          <div className="text-lg font-bold text-emerald-300">{data.autoResolved}</div>
        </div>

        {/* Staged */}
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Pause size={14} className="text-blue-400" />
            <span className="text-xs text-slate-400">Staged</span>
          </div>
          <div className="text-lg font-bold text-blue-300">{data.staged}</div>
        </div>

        {/* Time to Insight */}
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-purple-400" />
            <span className="text-xs text-slate-400">Time to Insight</span>
          </div>
          <div className="text-lg font-bold text-purple-300">{data.timeToInsight.toFixed(1)}s</div>
        </div>
      </div>

      {/* Precision */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-emerald-300">Precision@Apply</span>
          <span className="text-lg font-bold text-emerald-300">{(data.precisionAtApply * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-emerald-400 to-teal-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${data.precisionAtApply * 100}%` }}
          />
        </div>
      </div>

      {/* Blocked Items */}
      {data.blocked > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 to-red-500/10 border border-rose-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-rose-400" />
            <span className="text-xs text-rose-300">{data.blocked} items need attention</span>
          </div>
        </div>
      )}
    </div>
  );
}
