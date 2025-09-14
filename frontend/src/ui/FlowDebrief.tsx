import React, { useState, useEffect, useRef } from "react";
import { X, FileText, Check } from "lucide-react";

interface FlowDebriefProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
  isLoading: boolean;
}

export function FlowDebrief({ isOpen, onClose, onSubmit, isLoading }: FlowDebriefProps) {
  const [debriefText, setDebriefText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [checklist, setChecklist] = useState({
    spelledName: false,
    dates: false,
    tasks: false
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const words = debriefText.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(debriefText.trim() ? words : 0);

    // Auto-detect checklist items
    const lower = debriefText.toLowerCase();
    setChecklist({
      spelledName: /[A-Z]—[A-Z]—[A-Z]—[A-Z]/.test(debriefText) || lower.includes("—") || lower.includes("spell"),
      dates: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}:\d{2}|\d{1,2}pm|\d{1,2}am)\b/i.test(debriefText),
      tasks: lower.includes("task") || lower.includes("follow") || lower.includes("review") || lower.includes("send") || lower.includes("call")
    });
  }, [debriefText]);

  const handleSubmit = async () => {
    if (!debriefText.trim()) return;
    await onSubmit(debriefText);
    setDebriefText("");
    setWordCount(0);
    setChecklist({ spelledName: false, dates: false, tasks: false });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/90 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm shadow-2xl max-w-2xl w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-400" size={20} />
            <h3 className="text-lg font-semibold text-white">Debrief (Flow)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-slate-300">
            Place your cursor in the box and start Flow. Use <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">Fn</kbd> to start/stop dictation.
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={debriefText}
              onChange={(e) => setDebriefText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Start Flow dictation here... Budget resolved today, we got final approval from finance this morning..."
              className="w-full h-32 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500/50 resize-none"
            />
            
            {/* Date detection hint */}
            {/\b(friday|monday|tuesday|wednesday|thursday|saturday|sunday)\s+\d{1,2}(:\d{2})?\s*(pm|am)?\b/i.test(debriefText) && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30">
                Date detected
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-400">
              Builder Log: <span className="text-white font-medium">{wordCount}</span> words via Flow
            </div>
            <div className="text-slate-400">
              <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">Cmd+Enter</kbd> to submit
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-sm font-medium text-slate-300 mb-2">Checklist:</div>
            <div className="space-y-1 text-sm">
              <div className={`flex items-center gap-2 ${checklist.spelledName ? 'text-emerald-300' : 'text-slate-400'}`}>
                <Check size={14} className={checklist.spelledName ? 'text-emerald-400' : 'text-slate-600'} />
                Spelled name? (use —C-H-E-N format)
              </div>
              <div className={`flex items-center gap-2 ${checklist.dates ? 'text-emerald-300' : 'text-slate-400'}`}>
                <Check size={14} className={checklist.dates ? 'text-emerald-400' : 'text-slate-600'} />
                Dates? (Friday 5pm, Monday 9am)
              </div>
              <div className={`flex items-center gap-2 ${checklist.tasks ? 'text-emerald-300' : 'text-slate-400'}`}>
                <Check size={14} className={checklist.tasks ? 'text-emerald-400' : 'text-slate-600'} />
                Tasks? (follow-up, review, send)
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!debriefText.trim() || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Processing..." : "Submit Debrief"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
