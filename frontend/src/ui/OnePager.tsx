import React from "react";
import { Info, Undo2, Check, X } from "lucide-react";

export default function OnePager({ data, onUndo, onApply }:{ data:any, onUndo:()=>void, onApply:(id:string)=>void }) {
  // Defensive guards for initial render
  if (!data || !data.onePager) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="card p-4">
            <div className="text-slate-400">Loading one‑pager…</div>
          </div>
        </div>
        <div />
      </div>
    );
  }

  // Support both nested (onePager.opportunity.field.value) and flat (onePager.field) shapes
  const raw = data.onePager.opportunity ?? data.onePager;
  const opp = {
    budget_status: raw?.budget_status && typeof raw.budget_status === 'object' && 'value' in raw.budget_status
      ? raw.budget_status
      : { value: raw?.budget_status },
    decision_maker: raw?.decision_maker && typeof raw.decision_maker === 'object' && 'value' in raw.decision_maker
      ? raw.decision_maker
      : { value: raw?.decision_maker },
    stage: raw?.stage && typeof raw.stage === 'object' && 'value' in raw.stage
      ? raw.stage
      : { value: raw?.stage },
    next_meeting: raw?.next_meeting && typeof raw.next_meeting === 'object' && 'value' in raw.next_meeting
      ? raw.next_meeting
      : { value: raw?.next_meeting ?? null },
    tasks: Array.isArray(raw?.tasks) ? raw.tasks : []
  } as any;

  const proposed = (data.proposed as any[]) ?? [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-4">
        <Card title="Actionable Insights">
          <p className="text-slate-300">Conflicts detected: <b>{proposed.length}</b>. Auto-applies show an <span className="pill">Undo</span> button. Staged changes wait <span className="pill">24h</span> unless applied.</p>
        </Card>

        <Card title="Deal One‑Pager">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Budget">
              <span className="pill">{opp.budget_status?.value ?? "—"}</span>
            </Field>
            <Field label="Decision Maker">
              <span className="pill">{opp.decision_maker?.value ?? "—"}</span>
            </Field>
            <Field label="Stage"><span className="pill">{opp.stage?.value ?? "—"}</span></Field>
            <Field label="Next Meeting">
              <span className="pill">{opp.next_meeting?.value ? new Date(opp.next_meeting.value).toLocaleString() : "—"}</span>
            </Field>
          </div>
        </Card>

        <Card title="Tasks & Deadlines">
          <div className="space-y-2">
            {(opp.tasks || []).map((t:any, i:number) => (
              <div key={i} className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-slate-400">{t.kind} • Due {new Date(t.due).toLocaleString()}</div>
                </div>
                <button onClick={onUndo} className="btn text-rose-300 border-rose-500"><Undo2 size={16}/> Undo</button>
              </div>
            ))}
            {(!opp.tasks || opp.tasks.length === 0) && <div className="text-slate-500 text-sm">No tasks yet.</div>}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="Proposed Changes">
          <div className="space-y-2">
            {proposed.length === 0 && <div className="text-slate-500 text-sm">Nothing staged.</div>}
            {proposed.map((p:any) => (
              <div key={p.id} className="border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.field.replace("_"," ")}</div>
                  <span className="pill">{p.blast} • conf {p.confidence}</span>
                </div>
                <div className="mt-1 text-slate-300"><b>→</b> {typeof p.proposed === "string" ? p.proposed : JSON.stringify(p.proposed)}</div>
                <div className="mt-2 flex items-center gap-2">
                  {p.status === "staged" && <button onClick={() => onApply(p.id)} className="btn border-emerald-600 text-emerald-300"><Check size={16}/> Apply</button>}
                  {p.status === "staged" && <button className="btn border-slate-600 text-slate-300"><X size={16}/> Discard</button>}
                  {p.status === "staged" && <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">auto-apply in 24h</span>}
                  {p.status === "auto_applied" && <button onClick={onUndo} className="btn border-rose-500 text-rose-300"><Undo2 size={16}/> Undo</button>}
                  {p.status === "blocked" && <span className="px-2 py-1 text-xs bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">needs attention</span>}
                  <Why why={p.why}/>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Audit Log">
          <Audit />
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }:{ title:string, children:React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-slate-200 font-semibold">{title}</div>
        <div className="pill">Why?</div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }:{ label:string, children:React.ReactNode }) {
  return (
    <div>
      <div className="text-slate-400 text-sm">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Why({ why }:{ why:any[] }) {
  return (
    <details className="ml-auto">
      <summary className="link text-sm">Why?</summary>
      <div className="mt-2 text-xs text-slate-300 space-y-1">
        {why.map((w,i) => (
          <div key={i} className="border border-slate-800 rounded p-2">
            <div><b>source:</b> {w.type}</div>
            <div><b>timestamp:</b> {new Date(w.timestamp).toLocaleString()}</div>
            {"evidence" in w && <div><b>evidence:</b> {w.evidence}</div>}
            <div><b>value:</b> {typeof w.value === "string" ? w.value : JSON.stringify(w.value)}</div>
          </div>
        ))}
      </div>
    </details>
  );
}

function Audit() {
  const [items, setItems] = React.useState<any[]>([]);
  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/audit");
      setItems(await res.json());
    })();
  }, []);
  return (
    <div className="space-y-2">
      {items.length === 0 && <div className="text-slate-500 text-sm">No audit entries.</div>}
      {items.map((a,i) => (
        <div key={i} className="border border-slate-800 rounded p-2 text-xs">
          <div className="text-slate-400">{new Date(a.at).toLocaleString()} • {a.type}</div>
          <div className="text-slate-300">{a.field} — {a.type === "APPLY" ? JSON.stringify(a.new) : JSON.stringify(a.revertedTo)}</div>
        </div>
      ))}
    </div>
  );
}
