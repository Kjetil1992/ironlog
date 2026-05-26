import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const ACCENT = "#F97316";
const BG = "#0A0A0A";
const SURFACE = "#141414";
const BORDER = "#222";
const TEXT = "#F5F5F0";
const MUTED = "#666";
const GREEN = "#4caf50";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0A0A0A; color: #F5F5F0; font-family: 'DM Sans', sans-serif; }
  .tracker { min-height: 100vh; background: #0A0A0A; }
  .header { border-bottom: 1px solid #222; padding: 20px 24px; display: flex; align-items: baseline; gap: 12px; }
  .header h1 { font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem; letter-spacing: 2px; }
  .header-date { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: #666; letter-spacing: 1px; text-transform: uppercase; }
  .header-dot { width: 8px; height: 8px; background: #F97316; border-radius: 50%; margin-left: auto; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }
  .tabs { display: flex; border-bottom: 1px solid #222; padding: 0 24px; overflow-x: auto; }
  .tab { font-family: 'DM Mono', monospace; font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; padding: 14px 0; margin-right: 28px; border: none; background: none; color: #666; cursor: pointer; border-bottom: 2px solid transparent; transition: all .2s; white-space: nowrap; }
  .tab.active { color: #F97316; border-bottom-color: #F97316; }
  .tab:hover:not(.active) { color: #F5F5F0; }
  .content { padding: 24px; max-width: 680px; }
  .section-title { font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; letter-spacing: 1px; margin-bottom: 20px; }
  .section-title span { color: #F97316; }
  .form-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 8px; margin-bottom: 8px; align-items: end; }
  .field { display: flex; flex-direction: column; gap: 4px; }
  .field label { font-family: 'DM Mono', monospace; font-size: 0.6rem; letter-spacing: 2px; text-transform: uppercase; color: #666; }
  .field input, .field select { background: #141414; border: 1px solid #222; color: #F5F5F0; padding: 10px 12px; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; outline: none; transition: border-color .15s; width: 100%; }
  .field input:focus, .field select:focus { border-color: #F97316; }
  .field input::placeholder { color: #666; font-size: .8rem; }
  .btn-orange { background: #F97316; border: none; color: #000; font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 1px; padding: 10px 18px; cursor: pointer; transition: opacity .15s; white-space: nowrap; }
  .btn-orange:hover { opacity: .85; }
  .btn-outline { background: none; border: 1px solid #F97316; color: #F97316; font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 2px; padding: 11px 28px; cursor: pointer; transition: all .15s; }
  .btn-outline:hover { background: #F97316; color: #000; }
  .btn-ghost { background: none; border: 1px solid #222; color: #666; font-family: 'DM Mono', monospace; font-size: 0.7rem; letter-spacing: 1px; text-transform: uppercase; padding: 11px 18px; cursor: pointer; transition: all .15s; }
  .btn-ghost:hover { border-color: #e53e3e; color: #e53e3e; }
  .btn-remove { background: none; border: 1px solid #222; color: #666; width: 28px; height: 28px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all .15s; flex-shrink: 0; }
  .btn-remove:hover { border-color: #e53e3e; color: #e53e3e; }
  .exercise-item { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 8px; padding: 12px; background: #141414; border: 1px solid #222; margin-bottom: 6px; align-items: center; animation: slideIn .2s ease; }
  @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  .exercise-name { font-weight: 500; font-size: .9rem; }
  .exercise-val { font-family: 'DM Mono', monospace; font-size: .85rem; }
  .exercise-unit { font-size: .65rem; color: #666; font-family: 'DM Mono', monospace; }
  .save-row { margin-top: 24px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .save-msg { font-family: 'DM Mono', monospace; font-size: .75rem; color: #4caf50; letter-spacing: 1px; animation: fadeIn .3s ease; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .empty { text-align: center; padding: 60px 0; color: #666; font-family: 'DM Mono', monospace; font-size: .8rem; letter-spacing: 2px; text-transform: uppercase; }

  /* DASHBOARD */
  .dash-clock { font-family: 'Bebas Neue', sans-serif; font-size: 4.5rem; letter-spacing: 4px; color: #F5F5F0; line-height: 1; margin-bottom: 4px; }
  .dash-fulldate { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px; }
  .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
  .dash-card { background: #141414; border: 1px solid #222; padding: 22px 20px; position: relative; overflow: hidden; }
  .dash-card::before { content: ""; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: #F97316; }
  .dash-card.green::before { background: #4caf50; }
  .dash-card.blue::before { background: #3b82f6; }
  .dash-card.purple::before { background: #a855f7; }
  .dash-num { font-family: 'Bebas Neue', sans-serif; font-size: 3.2rem; line-height: 1; color: #F5F5F0; margin-bottom: 4px; }
  .dash-num.accent { color: #F97316; }
  .dash-num.green { color: #4caf50; }
  .dash-num.blue { color: #3b82f6; }
  .dash-label { font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 2px; text-transform: uppercase; color: #666; }
  .dash-sub { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: #444; margin-top: 6px; }
  .dash-muscles { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .dash-muscle-tag { font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 1px; text-transform: uppercase; border: 1px solid #F97316; color: #F97316; padding: 3px 10px; }
  .dash-streak { font-family: 'Bebas Neue', sans-serif; font-size: 3.2rem; line-height: 1; color: #a855f7; margin-bottom: 4px; }
  .dash-cta { margin-top: 28px; display: flex; gap: 12px; align-items: center; }
  .dash-last-session { background: #141414; border: 1px solid #222; padding: 16px 20px; margin-bottom: 12px; }
  .dash-last-title { font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 3px; text-transform: uppercase; color: #666; margin-bottom: 10px; }

  /* REST TIMER */
  .timer-bar { position: relative; background: #141414; border: 1px solid #F97316; padding: 16px 20px; margin-bottom: 16px; display: flex; align-items: center; gap: 16px; overflow: hidden; animation: slideIn .25s ease; }
  .timer-progress { position: absolute; bottom: 0; left: 0; height: 3px; background: #F97316; transition: width 1s linear; }
  .timer-progress.done { background: #4caf50; }
  .timer-display { font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem; letter-spacing: 3px; color: #F97316; min-width: 90px; line-height: 1; }
  .timer-display.done { color: #4caf50; }
  .timer-label { font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 2px; text-transform: uppercase; color: #666; margin-bottom: 2px; }
  .timer-sub { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: #444; }
  .timer-controls { display: flex; gap: 6px; margin-left: auto; align-items: center; }
  .timer-adj { background: #1a1a1a; border: 1px solid #333; color: #F5F5F0; font-family: 'DM Mono', monospace; font-size: 0.75rem; padding: 5px 10px; cursor: pointer; transition: all .15s; }
  .timer-adj:hover { border-color: #F97316; color: #F97316; }
  .timer-duration { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: #666; padding: 0 4px; min-width: 40px; text-align: center; }
  .timer-skip { background: none; border: 1px solid #333; color: #666; font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 1px; text-transform: uppercase; padding: 5px 12px; cursor: pointer; transition: all .15s; }
  .timer-skip:hover { border-color: #e53e3e; color: #e53e3e; }

  /* HISTORY */
  .history-entry { border: 1px solid #222; background: #141414; margin-bottom: 16px; overflow: hidden; animation: slideIn .2s ease; }
  .history-header { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid #222; gap: 12px; flex-wrap: wrap; }
  .history-date { font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 1px; }
  .history-count { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: 1px; text-transform: uppercase; color: #666; border: 1px solid #222; padding: 2px 8px; }
  .history-vol { margin-left: auto; font-family: 'DM Mono', monospace; font-size: .75rem; color: #F97316; }
  .btn-icon { background: none; border: none; color: #666; cursor: pointer; font-size: .85rem; padding: 4px; transition: color .15s; }
  .btn-icon:hover { color: #e53e3e; }
  .history-exercises { padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; }
  .hist-ex-row { display: flex; align-items: center; gap: 8px; font-size: .85rem; }
  .hist-ex-name { flex: 1; }
  .hist-ex-sets { font-family: 'DM Mono', monospace; font-size: .75rem; color: #666; background: #1a1a1a; padding: 2px 8px; border: 1px solid #222; }

  /* STATS */
  .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 28px; }
  .stat-card { background: #141414; border: 1px solid #222; padding: 18px; }
  .stat-val { font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem; color: #F97316; line-height: 1; }
  .stat-label { font-family: 'DM Mono', monospace; font-size: .6rem; letter-spacing: 2px; text-transform: uppercase; color: #666; margin-top: 4px; }
  .top-list-title { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: 3px; text-transform: uppercase; color: #666; margin-bottom: 10px; }
  .top-row { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #222; gap: 12px; }
  .top-rank { font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; color: #666; width: 20px; }
  .top-name { flex: 1; font-size: .9rem; }
  .top-count { font-family: 'DM Mono', monospace; font-size: .75rem; color: #F97316; }

  /* GRAPHS */
  .graph-section { margin-bottom: 32px; }
  .graph-title { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: 3px; text-transform: uppercase; color: #666; margin-bottom: 12px; }
  .graph-box { background: #141414; border: 1px solid #222; padding: 20px 12px 8px 4px; }
  .graph-empty { background: #141414; border: 1px solid #222; padding: 40px; text-align: center; font-family: 'DM Mono', monospace; font-size: .7rem; color: #444; letter-spacing: 2px; text-transform: uppercase; }
  .ex-selector { margin-bottom: 16px; }

  /* PROGRAMS */
  .program-card { border: 1px solid #222; background: #141414; margin-bottom: 16px; overflow: hidden; }
  .program-card.editing { border-color: #F97316; }
  .program-header { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid #222; gap: 12px; }
  .program-name { font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: 1px; flex: 1; }
  .program-badge { font-family: 'DM Mono', monospace; font-size: .65rem; color: #666; border: 1px solid #222; padding: 2px 8px; }
  .program-actions { display: flex; gap: 6px; }
  .program-body { padding: 14px 16px; }
  .prog-ex-row { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px solid #1a1a1a; font-size: .85rem; }
  .prog-ex-row:last-child { border-bottom: none; }
  .prog-ex-name { flex: 1; }
  .prog-ex-detail { font-family: 'DM Mono', monospace; font-size: .75rem; color: #666; }
  .program-footer { padding: 12px 16px; border-top: 1px solid #222; display: flex; gap: 8px; }
  .btn-load { background: none; border: 1px solid #F97316; color: #F97316; font-family: 'Bebas Neue', sans-serif; font-size: 1rem; letter-spacing: 2px; padding: 9px 20px; cursor: pointer; transition: all .15s; }
  .btn-load:hover { background: #F97316; color: #000; }
  .new-program-form { border: 1px dashed #333; padding: 20px; margin-bottom: 20px; }
  .new-program-form.active { border-color: #F97316; }
  .program-name-input { margin-bottom: 14px; }
  .load-banner { background: #1a1a1a; border: 1px solid #F97316; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; animation: slideIn .2s ease; }
  .load-banner-text { font-family: 'DM Mono', monospace; font-size: .7rem; color: #F97316; letter-spacing: 1px; flex: 1; }
  .divider { border: none; border-top: 1px solid #222; margin: 20px 0; }

  /* AUTH */
  .auth-screen { min-height: 100vh; background: #0A0A0A; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .auth-box { width: 100%; max-width: 400px; }
  .auth-title { font-family: 'Bebas Neue', sans-serif; font-size: 3rem; letter-spacing: 3px; margin-bottom: 4px; }
  .auth-title span { color: #F97316; }
  .auth-sub { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 40px; }
  .auth-form { display: flex; flex-direction: column; gap: 14px; }
  .auth-error { font-family: 'DM Mono', monospace; font-size: .75rem; color: #e53e3e; letter-spacing: 1px; padding: 10px 14px; border: 1px solid #e53e3e; background: #1a0a0a; }
  .auth-success { font-family: 'DM Mono', monospace; font-size: .75rem; color: #4caf50; letter-spacing: 1px; padding: 10px 14px; border: 1px solid #4caf50; background: #0a1a0a; }
  .auth-toggle { margin-top: 20px; font-family: 'DM Mono', monospace; font-size: .7rem; color: #666; letter-spacing: 1px; }
  .auth-toggle button { background: none; border: none; color: #F97316; cursor: pointer; font-family: 'DM Mono', monospace; font-size: .7rem; letter-spacing: 1px; text-decoration: underline; padding: 0; margin-left: 6px; }
  .btn-logout { background: none; border: 1px solid #333; color: #666; font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 1px; text-transform: uppercase; padding: 6px 12px; cursor: pointer; transition: all .15s; }
  .btn-logout:hover { border-color: #e53e3e; color: #e53e3e; }
  .user-email { font-family: 'DM Mono', monospace; font-size: 0.65rem; color: #444; letter-spacing: 1px; }
`;

const EXERCISES_BY_GROUP = {
  "Bryst": ["Benkpress","Skråbenkpress (opp)","Skråbenkpress (ned)","Hantelbenkpress","Hantelflyes","Kabelkryss","Dips (bryst)","Push-up"],
  "Rygg": ["Markløft","Chins","Pull-ups","Sittende roing","Stående roing","Ettarms hantelroing","Lat-pulldown","Hyperextensions","Omvendte flyes"],
  "Skuldre": ["Militærpress","Hantelpress (sittende)","Sidehev","Frontløft","Bakover flyes","Shrugs","Arnold press"],
  "Biceps": ["Stangcurl","Hantelcurl","Hammercurl","Konsentrasjonskurl","Kabelbicepscurl","Predikerstolcurl"],
  "Triceps": ["Triceps pushdown","Skulderpress (trang grep)","Skull crushers","Triceps dips","Overhead tricepsext.","Kickbacks"],
  "Bein": ["Knebøy","Frontknebøy","Beinpress","Utfall","Rumensk markløft","Leg curl","Leg extension","Hip thrust","Bulgarske utfall","Kalvehev"],
  "Mage": ["Crunch","Planke","Situps","Beinheving","Russian twist","Pallof press","Ab wheel"],
  "Kondisjon": ["Løping","Sykling","Roing","Hoppetau","Stairmaster","Ellipse","Svømming"],
  "Helkropp": ["Burpees","Kettlebell svings","Tyrkisk get-up","Clean & press","Thruster"],
};

const EMPTY_FORM = { name: "Benkpress", sets: "", reps: "", weight: "", group: "Bryst", customName: "" };

function today() {
  return new Date().toLocaleDateString("nb-NO", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}
function todayKey() {
  return new Date().toISOString().split("T")[0];
}
function totalVolume(exs) {
  return exs.reduce((sum,e) => sum + (parseFloat(e.sets)||0)*(parseFloat(e.reps)||0)*(parseFloat(e.weight)||0), 0);
}

function ExerciseForm({ form, setForm, onAdd }) {
  const repsRef = React.useRef(null);
  const weightRef = React.useRef(null);
  const addRef = React.useRef(null);

  function next(ref) { if (ref && ref.current) { ref.current.focus(); ref.current.select(); } }

  return (
    <>
      <div className="form-2col">
        <div className="field">
          <label>Muskelgruppe</label>
          <select value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value, name: EXERCISES_BY_GROUP[e.target.value][0], customName: "" }))}>
            {Object.keys(EXERCISES_BY_GROUP).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Øvelse</label>
          <select value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, customName: "" }))}>
            {EXERCISES_BY_GROUP[form.group].map(ex => <option key={ex} value={ex}>{ex}</option>)}
            <option value="__annet__">— Annet —</option>
          </select>
        </div>
      </div>
      {form.name === "__annet__" && (
        <div className="field" style={{ marginBottom: "8px" }}>
          <label>Navn på øvelse</label>
          <input autoFocus value={form.customName||""} onChange={e => setForm(f => ({ ...f, customName: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && next(repsRef)} placeholder="Skriv inn øvelsesnavn..." />
        </div>
      )}
      <div className="form-row">
        <div className="field">
          <label>Sett</label>
          <input type="number" min="1" value={form.sets}
            onChange={e => setForm(f => ({ ...f, sets: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && next(repsRef)}
            placeholder="3" />
        </div>
        <div className="field">
          <label>Reps</label>
          <input ref={repsRef} type="number" min="1" value={form.reps}
            onChange={e => setForm(f => ({ ...f, reps: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && next(weightRef)}
            placeholder="10" />
        </div>
        <div className="field">
          <label>Vekt (kg)</label>
          <input ref={weightRef} type="number" min="0" step="0.5" value={form.weight}
            onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && (addRef.current && addRef.current.click())}
            placeholder="60" />
        </div>
        <button ref={addRef} className="btn-orange" onClick={onAdd}>LEGG TIL</button>
      </div>
    </>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setSuccess("Sjekk e-posten din og bekreft kontoen!");
    }
    setLoading(false);
  }

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <div className="auth-title">IRON<span>LOG</span></div>
        <div className="auth-sub">{mode === "login" ? "Logg inn for å fortsette" : "Opprett konto"}</div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>E-post</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="deg@epost.no" required />
          </div>
          <div className="field">
            <label>Passord</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          <button type="submit" className="btn-orange" disabled={loading} style={{padding:"14px",fontSize:"1.2rem"}}>
            {loading ? "Venter..." : mode === "login" ? "LOGG INN" : "OPPRETT KONTO"}
          </button>
        </form>
        <div className="auth-toggle">
          {mode === "login" ? "Har du ikke konto?" : "Har du allerede konto?"}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccess(""); }}>
            {mode === "login" ? "Registrer deg" : "Logg inn"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [clock, setClock] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  // Rest timer
  const [timerActive, setTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(120);
  const [timerRemaining, setTimerRemaining] = useState(120);
  const timerRef = useState(null);
  useEffect(() => {
    if (!timerActive) return;
    const t = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    timerRef[0] = t;
    return () => clearInterval(t);
  }, [timerActive]);
  function startTimer() { setTimerRemaining(timerDuration); setTimerActive(true); }
  function stopTimer() { setTimerActive(false); setTimerRemaining(timerDuration); }
  function adjustDuration(delta) {
    const next = Math.max(15, timerDuration + delta);
    setTimerDuration(next);
    if (!timerActive) setTimerRemaining(next);
  }
  function fmtTime(s) { return String(Math.floor(s/60)).padStart(2,"0") + ":" + String(s%60).padStart(2,"0"); }

  // Log state
  const [exercises, setExercises] = useState([]);
  const [logForm, setLogForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const [loadedProgram, setLoadedProgram] = useState(null);

  // History & programs
  const [history, setHistory] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [creatingProgram, setCreatingProgram] = useState(false);
  const [progName, setProgName] = useState("");
  const [progExercises, setProgExercises] = useState([]);
  const [progForm, setProgForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [progSaved, setProgSaved] = useState(false);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load data when user logs in
  useEffect(() => {
    if (!user) { setHistory([]); setPrograms([]); return; }
    loadHistory();
    loadPrograms();
  }, [user]);

  async function loadHistory() {
    const { data } = await supabase.from("sessions").select("*").order("created_at", { ascending: false });
    if (data) setHistory(data);
  }

  async function loadPrograms() {
    const { data } = await supabase.from("programs").select("*").order("created_at", { ascending: false });
    if (data) setPrograms(data);
  }

  // --- LOG ---
  function addLogExercise() {
    const finalName = logForm.name === "__annet__" ? (logForm.customName||"").trim() : logForm.name;
    if (!finalName) return;
    setExercises(prev => [...prev, { ...logForm, name: finalName, id: Date.now() }]);
    setLogForm(f => ({ ...f, sets: "", reps: "", weight: "", customName: "" }));
    startTimer();
  }

  async function saveSession() {
    if (!exercises.length) return;
    const { data, error } = await supabase.from("sessions").insert({
      user_id: user.id,
      date: today(),
      date_key: todayKey(),
      exercises,
      program_name: loadedProgram,
    }).select().single();
    if (error) { alert("Feil ved lagring: " + error.message); return; }
    await loadHistory();
    setExercises([]);
    setLoadedProgram(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function deleteSession(id) {
    await supabase.from("sessions").delete().eq("id", id);
    setHistory(prev => prev.filter(s => s.id !== id));
  }

  function loadProgram(program) {
    const loaded = program.exercises.map(ex => ({ ...ex, id: Date.now() + Math.random() }));
    setExercises(loaded);
    setLoadedProgram(program.name);
    setTab("log");
  }

  // --- PROGRAMS ---
  function addProgExercise() {
    const finalName = progForm.name === "__annet__" ? (progForm.customName||"").trim() : progForm.name;
    if (!finalName) return;
    setProgExercises(prev => [...prev, { ...progForm, name: finalName, id: Date.now() }]);
    setProgForm(f => ({ ...f, sets: "", reps: "", weight: "", customName: "" }));
  }

  async function saveProgram() {
    if (!progName.trim() || !progExercises.length) return;
    if (editingId) {
      const { data } = await supabase.from("programs").update({ name: progName, exercises: progExercises }).eq("id", editingId).select().single();
      if (data) setPrograms(prev => prev.map(p => p.id === editingId ? data : p));
    } else {
      const { data } = await supabase.from("programs").insert({ user_id: user.id, name: progName, exercises: progExercises }).select().single();
      if (data) setPrograms(prev => [data, ...prev]);
    }
    setCreatingProgram(false);
    setEditingId(null);
    setProgName("");
    setProgExercises([]);
    setProgForm(EMPTY_FORM);
    setProgSaved(true);
    setTimeout(() => setProgSaved(false), 2500);
  }

  async function deleteProgram(id) {
    await supabase.from("programs").delete().eq("id", id);
    setPrograms(prev => prev.filter(p => p.id !== id));
  }

  function startEdit(program) {
    setEditingId(program.id);
    setProgName(program.name);
    setProgExercises(program.exercises.map(e => ({ ...e, id: Date.now() + Math.random() })));
    setProgForm(EMPTY_FORM);
    setCreatingProgram(true);
  }

  function cancelProgram() {
    setCreatingProgram(false);
    setEditingId(null);
    setProgName("");
    setProgExercises([]);
    setProgForm(EMPTY_FORM);
  }

  // Stats
  const [selectedExercise, setSelectedExercise] = useState("");
  const totalSessions = history.length;
  const totalExCount = history.reduce((s,sess) => s + sess.exercises.length, 0);
  const exFreq = {};
  history.forEach(sess => sess.exercises.forEach(e => { exFreq[e.name] = (exFreq[e.name]||0)+1; }));
  const topExercises = Object.entries(exFreq).sort((a,b) => b[1]-a[1]).slice(0,5);
  const allExerciseNames = [...new Set(history.flatMap(s => s.exercises.map(e => e.name)))].sort();

  const exerciseGraphData = [...history].reverse()
    .filter(s => s.exercises.some(e => e.name === selectedExercise))
    .map(s => {
      const ex = s.exercises.find(e => e.name === selectedExercise);
      return {
        date: s.date_key.slice(5),
        vekt: parseFloat(ex.weight) || 0,
        volum: Math.round((parseFloat(ex.sets)||0) * (parseFloat(ex.reps)||0) * (parseFloat(ex.weight)||0)),
      };
    });

  const volumeGraphData = [...history].reverse().slice(-20).map(s => ({
    date: s.date_key.slice(5),
    volum: Math.round(totalVolume(s.exercises)),
  }));

  if (authLoading) {
    return (
      <>
        <style>{styles}</style>
        <div style={{minHeight:"100vh",background:"#0A0A0A",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".8rem",color:"#444",letterSpacing:"2px"}}>LASTER...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{styles}</style>
        <AuthScreen />
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="tracker">
        <div className="header">
          <h1>IRON<span style={{color:ACCENT}}>LOG</span></h1>
          <span className="header-date">{todayKey()}</span>
          <div className="header-dot" />
          <div style={{marginLeft:"12px",display:"flex",alignItems:"center",gap:"10px"}}>
            <span className="user-email">{user.email}</span>
            <button className="btn-logout" onClick={() => supabase.auth.signOut()}>Logg ut</button>
          </div>
        </div>

        <div className="tabs">
          {[["dashboard","DASHBOARD"],["log","LOGG ØKT"],["programs","PROGRAMMER"],["history","HISTORIKK"],["stats","STATISTIKK"]].map(([key,label]) => (
            <button key={key} className={`tab${tab===key?" active":""}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        <div className="content">

          {/* ── DASHBOARD ── */}
          {tab === "dashboard" && (() => {
            const now = clock;
            const hh = String(now.getHours()).padStart(2,"0");
            const mm = String(now.getMinutes()).padStart(2,"0");
            const ss = String(now.getSeconds()).padStart(2,"0");
            const fullDate = now.toLocaleDateString("nb-NO", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

            const oneWeekAgo = new Date(now); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const sessionsThisWeek = history.filter(s => new Date(s.date_key) >= oneWeekAgo).length;

            const lastSession = history[0];
            let daysSince = null;
            if (lastSession) {
              const diff = now - new Date(lastSession.date_key);
              daysSince = Math.floor(diff / (1000*60*60*24));
            }

            const lastGroups = lastSession
              ? [...new Set(lastSession.exercises.map(e => e.group).filter(Boolean))]
              : [];

            const sessionDays = new Set(history.map(s => s.date_key));
            let streak = 0;
            const check = new Date(now);
            while (true) {
              const key = check.toISOString().split("T")[0];
              if (sessionDays.has(key)) { streak++; check.setDate(check.getDate()-1); }
              else break;
            }

            return (
              <>
                <div className="dash-clock">{hh}:{mm}<span style={{color:"#F97316",fontSize:"2.8rem"}}>:{ss}</span></div>
                <div className="dash-fulldate">{fullDate}</div>

                <div className="dash-grid">
                  <div className="dash-card">
                    <div className="dash-num accent">{sessionsThisWeek}</div>
                    <div className="dash-label">Økter siste 7 dager</div>
                    <div className="dash-sub">{sessionsThisWeek === 0 ? "Ingen økter denne uken" : sessionsThisWeek === 1 ? "Bra start!" : sessionsThisWeek >= 4 ? "Imponerende!" : "Bra jobba!"}</div>
                  </div>

                  <div className="dash-card green">
                    <div className="dash-num green">{daysSince === null ? "–" : daysSince === 0 ? "I DAG" : daysSince}</div>
                    <div className="dash-label">{daysSince === null ? "Ingen økt ennå" : daysSince === 0 ? "Siste økt" : "Dager siden siste økt"}</div>
                    <div className="dash-sub">{lastSession ? lastSession.date : "Logg din første økt"}</div>
                  </div>

                  <div className="dash-card purple" style={{gridColumn:"1/-1"}}>
                    <div className="dash-label" style={{marginBottom:"8px"}}>Muskelgrupper – forrige økt</div>
                    {lastGroups.length > 0 ? (
                      <div className="dash-muscles">
                        {lastGroups.map(g => <span key={g} className="dash-muscle-tag" style={{borderColor:"#a855f7",color:"#a855f7"}}>{g}</span>)}
                      </div>
                    ) : (
                      <div className="dash-sub" style={{marginTop:0}}>{lastSession ? "Ingen muskelgruppe registrert" : "Ingen økt logget ennå"}</div>
                    )}
                    {lastSession && (
                      <div className="dash-sub" style={{marginTop:"10px"}}>
                        {lastSession.exercises.length} øvelser · {lastSession.program_name ? lastSession.program_name : lastSession.date}
                      </div>
                    )}
                  </div>
                </div>

                <div className="dash-cta">
                  <button className="btn-orange" onClick={() => setTab("log")}>▶ LOGG NY ØKT</button>
                  {programs.length > 0 && (
                    <button className="btn-ghost" onClick={() => setTab("programs")}>SE PROGRAMMER</button>
                  )}
                </div>
              </>
            );
          })()}

          {/* ── LOG ── */}
          {tab === "log" && (
            <>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"10px"}}>
                <div className="section-title">NY <span>ØKT</span></div>
                {programs.length > 0 && !loadedProgram && (
                  <div className="field" style={{minWidth:"200px"}}>
                    <label>Last program</label>
                    <select defaultValue="" onChange={e => {
                      const p = programs.find(x => x.id === e.target.value);
                      if (p) loadProgram(p);
                    }}>
                      <option value="" disabled>Velg program...</option>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {loadedProgram && (
                <div className="load-banner">
                  <span style={{fontSize:"1rem"}}>📋</span>
                  <span className="load-banner-text">Program lastet: <strong>{loadedProgram}</strong> — rediger gjerne før du lagrer</span>
                  <button className="btn-remove" onClick={() => { setLoadedProgram(null); setExercises([]); }}>×</button>
                </div>
              )}

              {timerActive && (
                <div className="timer-bar">
                  <div className="timer-progress" style={{width: timerRemaining===0?"100%": `${((timerDuration-timerRemaining)/timerDuration)*100}%`}} />
                  <div>
                    <div className="timer-label">Pausetimer</div>
                    <div className={`timer-display${timerRemaining===0?" done":""}`}>{timerRemaining===0?"KLAR!":fmtTime(timerRemaining)}</div>
                    <div className="timer-sub">{timerRemaining===0?"Tid for neste sett 💪":`av ${fmtTime(timerDuration)}`}</div>
                  </div>
                  <div className="timer-controls">
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
                      <div className="timer-label">Juster</div>
                      <div style={{display:"flex",gap:"4px",alignItems:"center"}}>
                        <button className="timer-adj" onClick={() => adjustDuration(-15)}>−15s</button>
                        <span className="timer-duration">{fmtTime(timerDuration)}</span>
                        <button className="timer-adj" onClick={() => adjustDuration(15)}>+15s</button>
                      </div>
                    </div>
                    <button className="timer-skip" onClick={stopTimer}>Hopp over</button>
                  </div>
                </div>
              )}

              <ExerciseForm form={logForm} setForm={setLogForm} onAdd={addLogExercise} />

              {exercises.length > 0 && (
                <div style={{marginTop:"16px"}}>
                  {exercises.map(ex => (
                    <div key={ex.id} className="exercise-item">
                      <div className="exercise-name">{ex.name}</div>
                      <div><div className="exercise-val">{ex.sets||"–"}</div><div className="exercise-unit">sett</div></div>
                      <div><div className="exercise-val">{ex.reps||"–"}</div><div className="exercise-unit">reps</div></div>
                      <div><div className="exercise-val">{ex.weight||"–"}</div><div className="exercise-unit">kg</div></div>
                      <button className="btn-remove" onClick={() => setExercises(prev => prev.filter(e => e.id !== ex.id))}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="save-row">
                <button className="btn-outline" onClick={saveSession} disabled={!exercises.length}>LAGRE ØKT</button>
                {exercises.length > 0 && <button className="btn-ghost" onClick={() => { setExercises([]); setLoadedProgram(null); }}>nullstill</button>}
                {saved && <span className="save-msg">✓ ØKT LAGRET</span>}
              </div>
            </>
          )}

          {/* ── PROGRAMMER ── */}
          {tab === "programs" && (
            <>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
                <div className="section-title">TRENINGS<span>PROGRAM</span></div>
                {!creatingProgram && (
                  <button className="btn-orange" onClick={() => setCreatingProgram(true)}>+ NYTT PROGRAM</button>
                )}
              </div>

              {creatingProgram && (
                <div className="new-program-form active" style={{marginBottom:"24px"}}>
                  <div className="field program-name-input">
                    <label>Programnavn</label>
                    <input value={progName} onChange={e => setProgName(e.target.value)} placeholder='f.eks. "Push dag A"' />
                  </div>
                  <ExerciseForm form={progForm} setForm={setProgForm} onAdd={addProgExercise} />
                  {progExercises.length > 0 && (
                    <div style={{marginTop:"12px",marginBottom:"12px"}}>
                      {progExercises.map(ex => (
                        <div key={ex.id} className="exercise-item">
                          <div className="exercise-name">{ex.name}</div>
                          <div><div className="exercise-val">{ex.sets||"–"}</div><div className="exercise-unit">sett</div></div>
                          <div><div className="exercise-val">{ex.reps||"–"}</div><div className="exercise-unit">reps</div></div>
                          <div><div className="exercise-val">{ex.weight||"–"}</div><div className="exercise-unit">kg</div></div>
                          <button className="btn-remove" onClick={() => setProgExercises(prev => prev.filter(e => e.id !== ex.id))}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="save-row">
                    <button className="btn-outline" onClick={saveProgram} disabled={!progName.trim()||!progExercises.length}>
                      {editingId ? "OPPDATER" : "LAGRE PROGRAM"}
                    </button>
                    <button className="btn-ghost" onClick={cancelProgram}>avbryt</button>
                  </div>
                </div>
              )}

              {progSaved && <div className="save-msg" style={{marginBottom:"16px"}}>✓ PROGRAM LAGRET</div>}

              {programs.length === 0 && !creatingProgram && (
                <div className="empty">ingen programmer ennå</div>
              )}

              {programs.map(program => (
                <div key={program.id} className="program-card">
                  <div className="program-header">
                    <div className="program-name">{program.name}</div>
                    <div className="program-badge">{program.exercises.length} øvelser</div>
                    <div className="program-actions">
                      <button className="btn-icon" title="Rediger" onClick={() => startEdit(program)}>✏️</button>
                      <button className="btn-icon" title="Slett" onClick={() => deleteProgram(program.id)}>🗑</button>
                    </div>
                  </div>
                  <div className="program-body">
                    {program.exercises.map((ex, i) => (
                      <div key={i} className="prog-ex-row">
                        <div className="prog-ex-name">{ex.name}</div>
                        <div className="prog-ex-detail">
                          {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ""}
                          {ex.weight ? ` @ ${ex.weight}kg` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="program-footer">
                    <button className="btn-load" onClick={() => loadProgram(program)}>▶ START ØKT</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── HISTORIKK ── */}
          {tab === "history" && (
            <>
              {history.length === 0 ? <div className="empty">ingen økter ennå</div> : history.map(session => (
                <div key={session.id} className="history-entry">
                  <div className="history-header">
                    <div className="history-date">{session.date}</div>
                    {session.program_name && <div className="history-count">{session.program_name}</div>}
                    <div className="history-count">{session.exercises.length} øvelser</div>
                    {totalVolume(session.exercises) > 0 && (
                      <div className="history-vol">{totalVolume(session.exercises).toLocaleString("nb-NO")} kg</div>
                    )}
                    <button className="btn-icon" onClick={() => deleteSession(session.id)}>🗑</button>
                  </div>
                  <div className="history-exercises">
                    {session.exercises.map((ex, i) => (
                      <div key={i} className="hist-ex-row">
                        <div className="hist-ex-name">{ex.name}</div>
                        <div className="hist-ex-sets">{ex.sets}×{ex.reps}{ex.weight ? ` @ ${ex.weight}kg` : ""}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── STATISTIKK ── */}
          {tab === "stats" && (
            <>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-val">{totalSessions}</div><div className="stat-label">Totale økter</div></div>
                <div className="stat-card"><div className="stat-val">{totalExCount}</div><div className="stat-label">Øvelser logget</div></div>
                <div className="stat-card"><div className="stat-val">{programs.length}</div><div className="stat-label">Programmer</div></div>
              </div>

              {/* Totalvolum per økt */}
              <div className="graph-section">
                <div className="graph-title">Totalvolum per økt (siste 20)</div>
                {volumeGraphData.length > 0 ? (
                  <div className="graph-box">
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={volumeGraphData}>
                        <XAxis dataKey="date" tick={{fill:"#444",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fill:"#444",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} width={50} />
                        <Tooltip contentStyle={{background:"#141414",border:"1px solid #333",color:"#F5F5F0",fontFamily:"DM Mono",fontSize:"0.75rem"}} formatter={v => [`${v.toLocaleString("nb-NO")} kg`,"Volum"]} />
                        <Bar dataKey="volum" fill="#F97316" radius={[2,2,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="graph-empty">logg flere økter for å se graf</div>
                )}
              </div>

              {/* Fremgang per øvelse */}
              <div className="graph-section">
                <div className="graph-title">Vektfremgang per øvelse</div>
                <div className="field ex-selector">
                  <label>Velg øvelse</label>
                  <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)}>
                    <option value="">— Velg øvelse —</option>
                    {allExerciseNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                {selectedExercise && exerciseGraphData.length > 0 ? (
                  <div className="graph-box">
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={exerciseGraphData}>
                        <XAxis dataKey="date" tick={{fill:"#444",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fill:"#444",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} width={40} />
                        <Tooltip contentStyle={{background:"#141414",border:"1px solid #333",color:"#F5F5F0",fontFamily:"DM Mono",fontSize:"0.75rem"}} formatter={v => [`${v} kg`,"Vekt"]} />
                        <Line type="monotone" dataKey="vekt" stroke="#F97316" strokeWidth={2} dot={{fill:"#F97316",r:3}} activeDot={{r:5}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : selectedExercise ? (
                  <div className="graph-empty">logg flere økter med {selectedExercise} for å se fremgang</div>
                ) : null}
              </div>

              {topExercises.length > 0 ? (
                <div>
                  <div className="top-list-title">Mest trente øvelser</div>
                  {topExercises.map(([name, count], i) => (
                    <div key={name} className="top-row">
                      <div className="top-rank">{i+1}</div>
                      <div className="top-name">{name}</div>
                      <div className="top-count">{count}×</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">logg noen økter for å se statistikk</div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
