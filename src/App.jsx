import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const ACCENT = "#F97316";

const LIGHT_PALETTES = {
  krem:     { bg: "#F0ECE4", surface: "#FAF7F2", surface2: "#E8E3DA", border: "#DDD8CF", border2: "#C8C3BA" },
  skifer:   { bg: "#E4E9EF", surface: "#F0F4F8", surface2: "#D8DFE8", border: "#C4CDD8", border2: "#AEBBC8" },
  salvie:   { bg: "#E4EDE6", surface: "#F0F6F1", surface2: "#D4E2D8", border: "#BCCFC2", border2: "#A4BCAC" },
  lavendel: { bg: "#EAE6F0", surface: "#F4F1F8", surface2: "#DDD8E8", border: "#C8C0D8", border2: "#B0A8C8" },
  kobolt:   { bg: "#B8CCE4", surface: "#D0E2F4", surface2: "#A0B8D4", border: "#88A8C8", border2: "#6890B4" },
  mynte:    { bg: "#A8D4BE", surface: "#C4E8D4", surface2: "#8CC4A8", border: "#6CAE90", border2: "#4E9878" },
  rose:     { bg: "#ECC0CC", surface: "#F8D4DC", surface2: "#DCA8B8", border: "#CC8CA0", border2: "#BC7090" },
  gull:     { bg: "#E8C870", surface: "#F4DC98", surface2: "#D8B450", border: "#C8A030", border2: "#B88C18" },
};

function themeVars(dark, palette = "krem") {
  if (dark) return `
    :root {
      --bg: #0A0A0A; --surface: #141414; --surface2: #1a1a1a;
      --border: #222; --border2: #333;
      --text: #F5F5F0; --muted: #666; --muted2: #444;
    }
  `;
  const p = LIGHT_PALETTES[palette] || LIGHT_PALETTES.krem;
  return `
    :root {
      --bg: ${p.bg}; --surface: ${p.surface}; --surface2: ${p.surface2};
      --border: ${p.border}; --border2: ${p.border2};
      --text: #111111; --muted: #888; --muted2: #AAAAAA;
    }
  `;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
  .tracker { min-height: 100vh; background: var(--bg); }
  .header { border-bottom: 1px solid var(--border); padding: 20px 24px; display: flex; align-items: baseline; gap: 12px; }
  .header h1 { font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem; letter-spacing: 2px; }
  .header-date { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; }
  .header-dot { width: 8px; height: 8px; background: #F97316; border-radius: 50%; margin-left: auto; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }
  .tabs { display: flex; border-bottom: 1px solid var(--border); padding: 0 24px; overflow-x: auto; }
  .tab { font-family: 'DM Mono', monospace; font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; padding: 14px 0; margin-right: 28px; border: none; background: none; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all .2s; white-space: nowrap; }
  .tab.active { color: #F97316; border-bottom-color: #F97316; }
  .tab:hover:not(.active) { color: var(--text); }
  .content { padding: 24px; max-width: 680px; }
  .section-title { font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; letter-spacing: 1px; margin-bottom: 20px; }
  .section-title span { color: #F97316; }
  .form-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 8px; margin-bottom: 8px; align-items: end; }
  .field { display: flex; flex-direction: column; gap: 4px; }
  .field label { font-family: 'DM Mono', monospace; font-size: 0.6rem; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); }
  .field input, .field select { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 10px 12px; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; outline: none; transition: border-color .15s; width: 100%; }
  .field input:focus, .field select:focus { border-color: #F97316; }
  .field input::placeholder { color: var(--muted); font-size: .8rem; }
  .btn-orange { background: #F97316; border: none; color: #000; font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 1px; padding: 10px 18px; cursor: pointer; transition: opacity .15s; white-space: nowrap; }
  .btn-orange:hover { opacity: .85; }
  .btn-outline { background: none; border: 1px solid #F97316; color: #F97316; font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 2px; padding: 11px 28px; cursor: pointer; transition: all .15s; }
  .btn-outline:hover { background: #F97316; color: #000; }
  .btn-ghost { background: none; border: 1px solid var(--border); color: var(--muted); font-family: 'DM Mono', monospace; font-size: 0.7rem; letter-spacing: 1px; text-transform: uppercase; padding: 11px 18px; cursor: pointer; transition: all .15s; }
  .btn-ghost:hover { border-color: #e53e3e; color: #e53e3e; }
  .btn-remove { background: none; border: 1px solid var(--border); color: var(--muted); width: 28px; height: 28px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all .15s; flex-shrink: 0; }
  .btn-remove:hover { border-color: #e53e3e; color: #e53e3e; }
  .exercise-item { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 8px; padding: 12px; background: var(--surface); border: 1px solid var(--border); margin-bottom: 6px; align-items: center; animation: slideIn .2s ease; }
  @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  .exercise-name { font-weight: 500; font-size: .9rem; }
  .exercise-val { font-family: 'DM Mono', monospace; font-size: .85rem; }
  .exercise-unit { font-size: .65rem; color: var(--muted); font-family: 'DM Mono', monospace; }
  .save-row { margin-top: 24px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .save-msg { font-family: 'DM Mono', monospace; font-size: .75rem; color: #4caf50; letter-spacing: 1px; animation: fadeIn .3s ease; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .empty { text-align: center; padding: 60px 0; color: var(--muted); font-family: 'DM Mono', monospace; font-size: .8rem; letter-spacing: 2px; text-transform: uppercase; }

  /* DASHBOARD */
  .dash-clock { font-family: 'Bebas Neue', sans-serif; font-size: 4.5rem; letter-spacing: 4px; color: var(--text); line-height: 1; margin-bottom: 4px; }
  .dash-fulldate { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px; }
  .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
  .dash-card { background: var(--surface); border: 1px solid var(--border); padding: 22px 20px; position: relative; overflow: hidden; }
  .dash-card::before { content: ""; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: #F97316; }
  .dash-card.green::before { background: #4caf50; }
  .dash-card.blue::before { background: #3b82f6; }
  .dash-card.purple::before { background: #a855f7; }
  .dash-num { font-family: 'Bebas Neue', sans-serif; font-size: 3.2rem; line-height: 1; color: var(--text); margin-bottom: 4px; }
  .dash-num.accent { color: #F97316; }
  .dash-num.green { color: #4caf50; }
  .dash-num.blue { color: #3b82f6; }
  .dash-label { font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); }
  .dash-sub { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: var(--muted2); margin-top: 6px; }
  .dash-muscles { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .dash-muscle-tag { font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 1px; text-transform: uppercase; border: 1px solid #F97316; color: #F97316; padding: 3px 10px; }
  .dash-streak { font-family: 'Bebas Neue', sans-serif; font-size: 3.2rem; line-height: 1; color: #a855f7; margin-bottom: 4px; }
  .dash-cta { margin-top: 28px; display: flex; gap: 12px; align-items: center; }
  .dash-last-session { background: var(--surface); border: 1px solid var(--border); padding: 16px 20px; margin-bottom: 12px; }
  .dash-last-title { font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }

  /* REST TIMER */
  .timer-bar { position: relative; background: var(--surface); border: 1px solid #F97316; padding: 16px 20px; margin-bottom: 16px; display: flex; align-items: center; gap: 16px; overflow: hidden; animation: slideIn .25s ease; }
  .timer-progress { position: absolute; bottom: 0; left: 0; height: 3px; background: #F97316; transition: width 1s linear; }
  .timer-progress.done { background: #4caf50; }
  .timer-display { font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem; letter-spacing: 3px; color: #F97316; min-width: 90px; line-height: 1; }
  .timer-display.done { color: #4caf50; }
  .timer-label { font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 2px; }
  .timer-sub { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: var(--muted2); }
  .timer-controls { display: flex; gap: 6px; margin-left: auto; align-items: center; }
  .timer-adj { background: var(--surface2); border: 1px solid var(--border2); color: var(--text); font-family: 'DM Mono', monospace; font-size: 0.75rem; padding: 5px 10px; cursor: pointer; transition: all .15s; }
  .timer-adj:hover { border-color: #F97316; color: #F97316; }
  .timer-duration { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: var(--muted); padding: 0 4px; min-width: 40px; text-align: center; }
  .timer-skip { background: none; border: 1px solid var(--border2); color: var(--muted); font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 1px; text-transform: uppercase; padding: 5px 12px; cursor: pointer; transition: all .15s; }
  .timer-skip:hover { border-color: #e53e3e; color: #e53e3e; }

  /* HISTORY */
  .history-entry { border: 1px solid var(--border); background: var(--surface); margin-bottom: 16px; overflow: hidden; animation: slideIn .2s ease; }
  .history-header { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--border); gap: 12px; flex-wrap: wrap; }
  .history-date { font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 1px; }
  .history-count { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); border: 1px solid var(--border); padding: 2px 8px; }
  .history-vol { margin-left: auto; font-family: 'DM Mono', monospace; font-size: .75rem; color: #F97316; }
  .btn-icon { background: none; border: none; color: var(--muted); cursor: pointer; font-size: .85rem; padding: 4px; transition: color .15s; }
  .btn-icon:hover { color: #e53e3e; }
  .history-exercises { padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; }
  .hist-ex-row { display: flex; align-items: center; gap: 8px; font-size: .85rem; }
  .hist-ex-name { flex: 1; }
  .hist-ex-sets { font-family: 'DM Mono', monospace; font-size: .75rem; color: var(--muted); background: var(--surface2); padding: 2px 8px; border: 1px solid var(--border); }

  /* STATS */
  .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 28px; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); padding: 18px; }
  .stat-val { font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem; color: #F97316; line-height: 1; }
  .stat-label { font-family: 'DM Mono', monospace; font-size: .6rem; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 4px; }
  .top-list-title { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
  .top-row { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); gap: 12px; }
  .top-rank { font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; color: var(--muted); width: 20px; }
  .top-name { flex: 1; font-size: .9rem; }
  .top-count { font-family: 'DM Mono', monospace; font-size: .75rem; color: #F97316; }

  /* PR */
  .pr-group { margin-bottom: 28px; }
  .pr-group-title { font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem; letter-spacing: 2px; color: #F97316; margin-bottom: 10px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
  .pr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
  .pr-card { background: var(--surface); border: 1px solid var(--border); padding: 14px; position: relative; overflow: hidden; transition: border-color .15s; }
  .pr-card:hover { border-color: #F97316; }
  .pr-card::before { content: ""; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: #F97316; }
  .pr-exercise { font-size: .8rem; font-weight: 500; margin-bottom: 8px; color: var(--text); line-height: 1.3; }
  .pr-weight { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; color: #F97316; line-height: 1; }
  .pr-weight-unit { font-family: 'DM Mono', monospace; font-size: .65rem; color: var(--muted); margin-left: 2px; }
  .pr-detail { font-family: 'DM Mono', monospace; font-size: .65rem; color: var(--muted2); margin-top: 4px; }

  /* GRAPHS */
  .graph-section { margin-bottom: 32px; }
  .graph-title { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
  .graph-box { background: var(--surface); border: 1px solid var(--border); padding: 20px 12px 8px 4px; }
  .graph-empty { background: var(--surface); border: 1px solid var(--border); padding: 40px; text-align: center; font-family: 'DM Mono', monospace; font-size: .7rem; color: var(--muted2); letter-spacing: 2px; text-transform: uppercase; }
  .ex-selector { margin-bottom: 16px; }

  /* PROGRAMS */
  .program-card { border: 1px solid var(--border); background: var(--surface); margin-bottom: 16px; overflow: hidden; }
  .program-card.editing { border-color: #F97316; }
  .program-header { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--border); gap: 12px; }
  .program-name { font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: 1px; flex: 1; }
  .program-badge { font-family: 'DM Mono', monospace; font-size: .65rem; color: var(--muted); border: 1px solid var(--border); padding: 2px 8px; }
  .program-actions { display: flex; gap: 6px; }
  .program-body { padding: 14px 16px; }
  .prog-ex-row { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px solid var(--surface2); font-size: .85rem; }
  .prog-ex-row:last-child { border-bottom: none; }
  .prog-ex-name { flex: 1; }
  .prog-ex-detail { font-family: 'DM Mono', monospace; font-size: .75rem; color: var(--muted); }
  .program-footer { padding: 12px 16px; border-top: 1px solid var(--border); display: flex; gap: 8px; }
  .btn-load { background: none; border: 1px solid #F97316; color: #F97316; font-family: 'Bebas Neue', sans-serif; font-size: 1rem; letter-spacing: 2px; padding: 9px 20px; cursor: pointer; transition: all .15s; }
  .btn-load:hover { background: #F97316; color: #000; }
  .new-program-form { border: 1px dashed var(--border2); padding: 20px; margin-bottom: 20px; }
  .new-program-form.active { border-color: #F97316; }
  .program-name-input { margin-bottom: 14px; }
  .load-banner { background: var(--surface2); border: 1px solid #F97316; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; animation: slideIn .2s ease; }
  .load-banner-text { font-family: 'DM Mono', monospace; font-size: .7rem; color: #F97316; letter-spacing: 1px; flex: 1; }
  .divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }

  /* RUNNING */
  .run-type-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; margin-bottom: 16px; }
  .run-type-btn { padding: 8px 4px; border: 1px solid var(--border); background: none; color: var(--text); font-family: 'DM Mono', monospace; font-size: .6rem; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all .15s; text-align: center; }
  .run-type-btn.active { border-color: #F97316; color: #F97316; }
  .run-time-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .pace-display { background: var(--surface2); border: 1px solid var(--border); padding: 14px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
  .pace-val { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; color: #F97316; line-height: 1; }
  .pace-label { font-family: 'DM Mono', monospace; font-size: .6rem; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); }
  .run-entry { border: 1px solid var(--border); background: var(--surface); margin-bottom: 10px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; animation: slideIn .2s ease; }
  .run-dist { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; color: #F97316; line-height: 1; min-width: 60px; }
  .run-dist-unit { font-family: 'DM Mono', monospace; font-size: .6rem; color: var(--muted); }
  .run-meta { flex: 1; }
  .run-meta-date { font-family: 'Bebas Neue', sans-serif; font-size: 1rem; letter-spacing: 1px; }
  .run-meta-detail { font-family: 'DM Mono', monospace; font-size: .7rem; color: var(--muted); margin-top: 3px; }
  .run-stat-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 24px; }
  .run-pr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; }
  .run-pr-card { background: var(--surface); border: 1px solid var(--border); padding: 14px; position: relative; overflow: hidden; }
  .run-pr-card::before { content:""; position:absolute; top:0; left:0; width:3px; height:100%; background:#F97316; }
  .run-pr-label { font-family: 'DM Mono', monospace; font-size: .6rem; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
  .run-pr-val { font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; color: #F97316; line-height: 1; }
  .run-pr-sub { font-family: 'DM Mono', monospace; font-size: .65rem; color: var(--muted2); margin-top: 3px; }

  /* SUBNAV */
  .subnav { display: flex; gap: 4px; background: var(--surface2); padding: 4px; margin-bottom: 24px; }
  .subnav-btn { flex: 1; font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: 2px; text-transform: uppercase; padding: 9px 4px; border: none; background: none; color: var(--muted); cursor: pointer; transition: all .2s; text-align: center; }
  .subnav-btn.active { background: var(--bg); color: #F97316; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }

  /* PROFILE */
  .profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: #F97316; display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 2rem; color: #000; margin-bottom: 16px; position: relative; overflow: hidden; flex-shrink: 0; }
  .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .profile-avatar-upload { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .2s; cursor: pointer; font-size: .6rem; font-family: 'DM Mono', monospace; letter-spacing: 1px; color: #fff; }
  .profile-avatar:hover .profile-avatar-upload { opacity: 1; }
  .profile-top { display: flex; align-items: center; gap: 20px; margin-bottom: 28px; }
  .profile-email { font-family: 'DM Mono', monospace; font-size: .7rem; color: var(--muted); letter-spacing: 1px; margin-top: 4px; }
  .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .goal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
  .goal-btn { padding: 10px 8px; border: 1px solid var(--border); background: none; color: var(--text); font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all .15s; text-align: center; }
  .goal-btn.active { border-color: #F97316; color: #F97316; }
  .profile-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 28px; }
  .profile-stat { background: var(--surface2); padding: 14px 10px; text-align: center; }
  .profile-stat-val { font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; color: #F97316; line-height: 1; }
  .profile-stat-label { font-family: 'DM Mono', monospace; font-size: .55rem; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 4px; }

  /* SETTINGS */
  .btn-settings { background: none; border: 1px solid var(--border); color: var(--muted); font-size: 1rem; width: 32px; height: 32px; cursor: pointer; transition: all .15s; display: flex; align-items: center; justify-content: center; }
  .btn-settings:hover { border-color: #F97316; color: #F97316; }
  .settings-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; animation: fadeIn .2s ease; }
  .settings-panel { position: fixed; top: 0; right: 0; height: 100vh; width: 280px; background: var(--surface); border-left: 1px solid var(--border); z-index: 101; padding: 28px 24px; display: flex; flex-direction: column; gap: 0; animation: slideInRight .25s ease; }
  @keyframes slideInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
  .settings-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
  .settings-title { font-family: 'Bebas Neue', sans-serif; font-size: 1.4rem; letter-spacing: 2px; }
  .settings-close { background: none; border: none; color: var(--muted); font-size: 1.2rem; cursor: pointer; padding: 4px; transition: color .15s; }
  .settings-close:hover { color: #e53e3e; }
  .settings-section { margin-bottom: 28px; }
  .settings-label { font-family: 'DM Mono', monospace; font-size: .6rem; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
  .theme-toggle { display: flex; gap: 8px; }
  .theme-btn { flex: 1; padding: 10px; border: 1px solid var(--border); background: none; color: var(--text); font-family: 'DM Mono', monospace; font-size: .7rem; letter-spacing: 1px; cursor: pointer; transition: all .15s; }
  .theme-btn.active { border-color: #F97316; color: #F97316; background: none; }
  .palette-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .palette-swatch { aspect-ratio: 1; border-radius: 50%; border: 3px solid transparent; cursor: pointer; transition: all .15s; outline: none; }
  .palette-swatch.active { border-color: #F97316; transform: scale(1.1); }
  .palette-name { font-family: 'DM Mono', monospace; font-size: .55rem; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); text-align: center; margin-top: 6px; }

  /* LANDING */
  .landing { min-height: 100vh; background: var(--bg); display: flex; flex-direction: column; }
  .landing-header { padding: 32px 28px 0; display: flex; align-items: center; justify-content: space-between; }
  .landing-logo { font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem; letter-spacing: 2px; }
  .landing-body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 24px; }
  .landing-greeting { font-family: 'DM Mono', monospace; font-size: .7rem; color: var(--muted); letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px; text-align: center; }
  .landing-question { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; letter-spacing: 2px; margin-bottom: 40px; text-align: center; }
  .landing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; max-width: 500px; }
  @media (max-width: 460px) { .landing-grid { grid-template-columns: 1fr; max-width: 300px; } }
  .landing-card { position: relative; border: 1px solid var(--border); background: var(--surface); padding: 44px 28px 36px; cursor: pointer; transition: all .2s; overflow: hidden; text-align: left; }
  .landing-card:hover { border-color: #F97316; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
  .landing-card-icon { font-size: 2.8rem; margin-bottom: 20px; line-height: 1; display: block; }
  .landing-card-title { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; letter-spacing: 3px; margin-bottom: 8px; display: block; }
  .landing-card-sub { font-family: 'DM Mono', monospace; font-size: .6rem; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); display: block; }
  .landing-card-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #F97316; transform: scaleX(0); transition: transform .25s ease; transform-origin: left; }
  .landing-card:hover .landing-card-bar { transform: scaleX(1); }
  .landing-card-arrow { position: absolute; top: 20px; right: 20px; font-size: 1.2rem; color: var(--border2); transition: color .2s; }
  .landing-card:hover .landing-card-arrow { color: #F97316; }

  /* AUTH */
  .auth-screen { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .auth-box { width: 100%; max-width: 400px; }
  .auth-title { font-family: 'Bebas Neue', sans-serif; font-size: 3rem; letter-spacing: 3px; margin-bottom: 4px; }
  .auth-title span { color: #F97316; }
  .auth-sub { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 40px; }
  .auth-form { display: flex; flex-direction: column; gap: 14px; }
  .auth-error { font-family: 'DM Mono', monospace; font-size: .75rem; color: #e53e3e; letter-spacing: 1px; padding: 10px 14px; border: 1px solid #e53e3e; background: var(--surface); }
  .auth-success { font-family: 'DM Mono', monospace; font-size: .75rem; color: #4caf50; letter-spacing: 1px; padding: 10px 14px; border: 1px solid #4caf50; background: var(--surface); }
  .auth-toggle { margin-top: 20px; font-family: 'DM Mono', monospace; font-size: .7rem; color: #666; letter-spacing: 1px; }
  .auth-toggle button { background: none; border: none; color: #F97316; cursor: pointer; font-family: 'DM Mono', monospace; font-size: .7rem; letter-spacing: 1px; text-decoration: underline; padding: 0; margin-left: 6px; }
  .btn-logout { background: none; border: 1px solid #333; color: #666; font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 1px; text-transform: uppercase; padding: 6px 12px; cursor: pointer; transition: all .15s; }
  .btn-logout:hover { border-color: #e53e3e; color: #e53e3e; }
  .user-email { font-family: 'DM Mono', monospace; font-size: 0.65rem; color: var(--muted2); letter-spacing: 1px; }
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
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("ironlog-theme") !== "light");
  const [lightPalette, setLightPalette] = useState(() => localStorage.getItem("ironlog-palette") || "krem");
  const [showSettings, setShowSettings] = useState(false);

  function setPalette(p) {
    setLightPalette(p);
    localStorage.setItem("ironlog-palette", p);
  }
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [section, setSection] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [subNav, setSubNav] = useState("history");
  const [runSubNav, setRunSubNav] = useState("log");
  const [runs, setRuns] = useState([]);
  const [runForm, setRunForm] = useState({ distance: "", hours: "", minutes: "", seconds: "", type: "Vei", notes: "" });
  const [runSaved, setRunSaved] = useState(false);

  async function loadRuns() {
    const { data } = await supabase.from("runs").select("*").order("date_key", { ascending: false });
    if (data) setRuns(data);
  }

  async function saveRun() {
    const dist = parseFloat(runForm.distance);
    const secs = (parseInt(runForm.hours)||0)*3600 + (parseInt(runForm.minutes)||0)*60 + (parseInt(runForm.seconds)||0);
    if (!dist || !secs) return;
    const { data, error } = await supabase.from("runs").insert({
      user_id: user.id, date: today(), date_key: todayKey(),
      distance: dist, duration: secs, type: runForm.type, notes: runForm.notes
    }).select().single();
    if (error) { alert("Feil: " + error.message); return; }
    if (data) setRuns(prev => [data, ...prev]);
    setRunForm({ distance: "", hours: "", minutes: "", seconds: "", type: "Vei", notes: "" });
    setRunSaved(true);
    setTimeout(() => setRunSaved(false), 2500);
  }

  async function deleteRun(id) {
    await supabase.from("runs").delete().eq("id", id);
    setRuns(prev => prev.filter(r => r.id !== id));
  }

  function fmtDuration(secs) {
    const h = Math.floor(secs/3600);
    const m = Math.floor((secs%3600)/60);
    const s = secs%60;
    return h > 0 ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${m}:${String(s).padStart(2,"0")}`;
  }

  function calcPace(distance, duration) {
    if (!distance || !duration) return null;
    const paceSeconds = duration / distance;
    const pm = Math.floor(paceSeconds / 60);
    const ps = Math.round(paceSeconds % 60);
    return `${pm}:${String(ps).padStart(2,"0")}`;
  }

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

  // Profile
  const [profile, setProfile] = useState({ username: "", weight: "", height: "", age: "", goals: [] });
  const [profileSaved, setProfileSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const avatarInputRef = React.useRef(null);

  const [weightLogs, setWeightLogs] = useState([]);
  const [newWeight, setNewWeight] = useState("");

  async function loadProfile() {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile({ username: data.username||"", weight: data.weight||"", height: data.height||"", age: data.age||"", goals: data.goals||[] });
      if (data.avatar_url) setAvatarUrl(data.avatar_url);
    }
    const { data: wl } = await supabase.from("weight_logs").select("*").order("logged_at", { ascending: true });
    if (wl) setWeightLogs(wl);
  }

  async function saveProfile() {
    await supabase.from("profiles").upsert({ id: user.id, username: profile.username, weight: profile.weight, height: profile.height, age: profile.age, goals: profile.goals, updated_at: new Date().toISOString() });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  function toggleGoal(g) {
    setProfile(p => {
      const goals = p.goals || [];
      return { ...p, goals: goals.includes(g) ? goals.filter(x => x !== g) : [...goals, g] };
    });
  }

  async function logWeight() {
    if (!newWeight) return;
    const { data } = await supabase.from("weight_logs").insert({ user_id: user.id, weight: parseFloat(newWeight), logged_at: todayKey() }).select().single();
    if (data) setWeightLogs(prev => [...prev, data]);
    setNewWeight("");
  }

  async function uploadAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      setAvatarUrl(url);
      await supabase.from("profiles").upsert({ id: user.id, avatar_url: url, updated_at: new Date().toISOString() });
    }
  }

  // Load data when user logs in
  useEffect(() => {
    if (!user) { setHistory([]); setPrograms([]); setProfile({ username:"", weight:"", height:"", age:"", goals:[] }); return; }
    loadHistory();
    loadPrograms();
    loadProfile();
    loadRuns();
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
      const { data, error } = await supabase.from("programs").update({ name: progName, exercises: progExercises }).eq("id", editingId).select().single();
      if (error) { alert("Feil ved lagring av program: " + error.message); return; }
      if (data) setPrograms(prev => prev.map(p => p.id === editingId ? data : p));
    } else {
      const { data, error } = await supabase.from("programs").insert({ user_id: user.id, name: progName, exercises: progExercises }).select().single();
      if (error) { alert("Feil ved lagring av program: " + error.message); return; }
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

  // PR
  const prByGroup = {};
  history.forEach(session => {
    session.exercises.forEach(ex => {
      const group = ex.group || "Annet";
      const weight = parseFloat(ex.weight) || 0;
      if (!prByGroup[group]) prByGroup[group] = {};
      if (!prByGroup[group][ex.name] || weight > prByGroup[group][ex.name].weight) {
        prByGroup[group][ex.name] = { weight, sets: ex.sets, reps: ex.reps, date: session.date_key };
      }
    });
  });
  const prGroups = Object.keys(EXERCISES_BY_GROUP).filter(g => prByGroup[g]);

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
        <style>{themeVars(darkMode, lightPalette) + styles}</style>
        <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".8rem",color:"var(--muted)",letterSpacing:"2px"}}>LASTER...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{themeVars(darkMode, lightPalette) + styles}</style>
        <AuthScreen />
      </>
    );
  }

  if (!section) {
    return (
      <>
        <style>{themeVars(darkMode, lightPalette) + styles}</style>
        <div className="landing">
          <div className="landing-header">
            <div className="landing-logo">IRON<span style={{color:ACCENT}}>LOG</span></div>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <button className="btn-settings" onClick={() => setShowSettings(true)} title="Innstillinger">⚙</button>
            </div>
          </div>
          {showSettings && (
            <>
              <div className="settings-overlay" onClick={() => setShowSettings(false)} />
              <div className="settings-panel">
                <div className="settings-header">
                  <div className="settings-title">INNSTILLINGER</div>
                  <button className="settings-close" onClick={() => setShowSettings(false)}>✕</button>
                </div>
                <div className="settings-section">
                  <div className="settings-label">Tema</div>
                  <div className="theme-toggle">
                    <button className={`theme-btn${darkMode ? " active" : ""}`} onClick={() => { setDarkMode(true); localStorage.setItem("ironlog-theme","dark"); }}>🌙 Mørk</button>
                    <button className={`theme-btn${!darkMode ? " active" : ""}`} onClick={() => { setDarkMode(false); localStorage.setItem("ironlog-theme","light"); }}>☀ Lys</button>
                  </div>
                </div>
                {!darkMode && (
                  <div className="settings-section">
                    <div className="settings-label">Fargepalett</div>
                    <div className="palette-grid">
                      {Object.entries({krem:"#F0ECE4", skifer:"#E4E9EF", salvie:"#E4EDE6", lavendel:"#EAE6F0", kobolt:"#B8CCE4", mynte:"#A8D4BE", rose:"#ECC0CC", gull:"#E8C870"}).map(([name, color]) => (
                        <div key={name}>
                          <button className={`palette-swatch${lightPalette===name?" active":""}`} style={{background:color, width:"100%"}} onClick={() => setPalette(name)} />
                          <div className="palette-name">{name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{marginTop:"auto"}}>
                  <div className="settings-label">Konto</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:".7rem",color:"var(--muted)",marginBottom:"12px"}}>{user.email}</div>
                  <button className="btn-ghost" style={{width:"100%"}} onClick={() => supabase.auth.signOut()}>Logg ut</button>
                </div>
              </div>
            </>
          )}
          <div className="landing-body">
            <div className="landing-greeting">Hva trener du i dag?</div>
            <div className="landing-question">VELG AKTIVITET</div>
            <div className="landing-grid">
              <button className="landing-card" onClick={() => { setSection("styrke"); setTab("dashboard"); }}>
                <span className="landing-card-arrow">→</span>
                <span className="landing-card-icon">🏋️</span>
                <span className="landing-card-title">STYRKE</span>
                <span className="landing-card-sub">Logg økt · programmer · PR</span>
                <div className="landing-card-bar" />
              </button>
              <button className="landing-card" onClick={() => { setSection("løping"); setTab("running"); }}>
                <span className="landing-card-arrow">→</span>
                <span className="landing-card-icon">🏃</span>
                <span className="landing-card-title">LØPING</span>
                <span className="landing-card-sub">Logg tur · historikk · stats</span>
                <div className="landing-card-bar" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{themeVars(darkMode, lightPalette) + styles}</style>
      <div className="tracker">
        {showSettings && (
          <>
            <div className="settings-overlay" onClick={() => setShowSettings(false)} />
            <div className="settings-panel">
              <div className="settings-header">
                <div className="settings-title">INNSTILLINGER</div>
                <button className="settings-close" onClick={() => setShowSettings(false)}>✕</button>
              </div>

              <div className="settings-section">
                <div className="settings-label">Tema</div>
                <div className="theme-toggle">
                  <button className={`theme-btn${darkMode ? " active" : ""}`} onClick={() => { setDarkMode(true); localStorage.setItem("ironlog-theme","dark"); }}>🌙 Mørk</button>
                  <button className={`theme-btn${!darkMode ? " active" : ""}`} onClick={() => { setDarkMode(false); localStorage.setItem("ironlog-theme","light"); }}>☀ Lys</button>
                </div>
              </div>

              {!darkMode && (
                <div className="settings-section">
                  <div className="settings-label">Fargepalett</div>
                  <div className="palette-grid">
                    {Object.entries({krem:"#F0ECE4", skifer:"#E4E9EF", salvie:"#E4EDE6", lavendel:"#EAE6F0", kobolt:"#B8CCE4", mynte:"#A8D4BE", rose:"#ECC0CC", gull:"#E8C870"}).map(([name, color]) => (
                      <div key={name}>
                        <button className={`palette-swatch${lightPalette===name?" active":""}`}
                          style={{background:color, width:"100%"}}
                          onClick={() => setPalette(name)} />
                        <div className="palette-name">{name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{marginTop:"auto"}}>
                <div className="settings-label">Konto</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:".7rem",color:"var(--muted)",marginBottom:"12px"}}>{user.email}</div>
                <button className="btn-ghost" style={{width:"100%"}} onClick={() => supabase.auth.signOut()}>Logg ut</button>
              </div>
            </div>
          </>
        )}

        <div className="header">
          <button onClick={() => setSection(null)} style={{background:"none",border:"none",cursor:"pointer",padding:0,lineHeight:1}}>
            <h1>IRON<span style={{color:ACCENT}}>LOG</span></h1>
          </button>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--muted)",letterSpacing:"2px",textTransform:"uppercase",background:"var(--surface2)",border:"1px solid var(--border)",padding:"2px 8px",marginLeft:"4px"}}>{section === "løping" ? "LØPING" : "STYRKE"}</span>
          <span className="header-date" style={{marginLeft:"8px"}}>{todayKey()}</span>
          <div className="header-dot" />
          <div style={{marginLeft:"12px",display:"flex",alignItems:"center",gap:"8px"}}>
            <button onClick={() => setTab("profile")} title="Profil" style={{
              width:"32px", height:"32px", borderRadius:"50%", border:"1px solid var(--border)",
              background: avatarUrl ? "none" : "#F97316", overflow:"hidden", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'Bebas Neue',sans-serif", fontSize:"1rem", color:"#000", padding:0, flexShrink:0
            }}>
              {avatarUrl ? <img src={avatarUrl} alt="profil" style={{width:"100%",height:"100%",objectFit:"cover"}} /> : (profile.username ? profile.username[0].toUpperCase() : user.email[0].toUpperCase())}
            </button>
            <button className="btn-settings" onClick={() => setShowSettings(true)} title="Innstillinger">⚙</button>
            <button className="btn-logout" onClick={() => supabase.auth.signOut()}>Logg ut</button>
          </div>
        </div>

        <div className="tabs">
          {(section === "løping"
            ? [["running","LOGG"],["profile","PROFIL"]]
            : [["dashboard","DASHBOARD"],["log","LOGG ØKT"],["programs","PROGRAMMER"],["oversikt","OVERSIKT"],["profile","PROFIL"]]
          ).map(([key,label]) => (
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

          {/* ── LØPING ── */}
          {tab === "running" && (() => {
            const previewPace = calcPace(parseFloat(runForm.distance), (parseInt(runForm.hours)||0)*3600 + (parseInt(runForm.minutes)||0)*60 + (parseInt(runForm.seconds)||0));
            const totalKm = runs.reduce((s,r) => s + parseFloat(r.distance), 0);
            const avgPace = runs.length ? calcPace(totalKm, runs.reduce((s,r) => s + r.duration, 0)) : null;
            const bestPace = runs.length ? calcPace(1, Math.min(...runs.map(r => r.duration / r.distance))) : null;
            const weeklyData = (() => {
              const weeks = {};
              runs.forEach(r => {
                const d = new Date(r.date_key);
                const monday = new Date(d);
                monday.setDate(d.getDate() - ((d.getDay()+6)%7));
                const key = monday.toISOString().slice(5,10);
                weeks[key] = (weeks[key]||0) + parseFloat(r.distance);
              });
              return Object.entries(weeks).sort((a,b)=>a[0]>b[0]?1:-1).slice(-10).map(([date,km])=>({date, km: Math.round(km*10)/10}));
            })();
            const prDistances = [5, 10, 21.1, 42.2];
            const prs = prDistances.map(dist => {
              const eligible = runs.filter(r => parseFloat(r.distance) >= dist);
              if (!eligible.length) return { dist, time: null };
              const best = eligible.reduce((b,r) => {
                const pace = r.duration / parseFloat(r.distance);
                return pace < b.duration / parseFloat(b.distance) ? r : b;
              });
              const estSecs = Math.round(best.duration / parseFloat(best.distance) * dist);
              return { dist, time: fmtDuration(estSecs) };
            });

            return (
              <>
                <div className="subnav">
                  <button className={`subnav-btn${runSubNav==="log"?" active":""}`} onClick={() => setRunSubNav("log")}>Logg</button>
                  <button className={`subnav-btn${runSubNav==="history"?" active":""}`} onClick={() => setRunSubNav("history")}>Historikk</button>
                  <button className={`subnav-btn${runSubNav==="stats"?" active":""}`} onClick={() => setRunSubNav("stats")}>Statistikk</button>
                </div>

                {runSubNav === "log" && (
                  <>
                    <div className="section-title">NY <span>LØPETUR</span></div>
                    <div className="run-type-grid">
                      {["Vei","Terreng","Mølle","Intervall"].map(t => (
                        <button key={t} className={`run-type-btn${runForm.type===t?" active":""}`} onClick={() => setRunForm(f=>({...f,type:t}))}>{t}</button>
                      ))}
                    </div>
                    <div className="form-2col" style={{marginBottom:"8px"}}>
                      <div className="field">
                        <label>Distanse (km)</label>
                        <input type="number" step="0.01" min="0" value={runForm.distance} onChange={e=>setRunForm(f=>({...f,distance:e.target.value}))} placeholder="5.0" />
                      </div>
                    </div>
                    <div className="run-time-row">
                      <div className="field">
                        <label>Timer</label>
                        <input type="number" min="0" max="9" value={runForm.hours} onChange={e=>setRunForm(f=>({...f,hours:e.target.value}))} placeholder="0" />
                      </div>
                      <div className="field">
                        <label>Minutter</label>
                        <input type="number" min="0" max="59" value={runForm.minutes} onChange={e=>setRunForm(f=>({...f,minutes:e.target.value}))} placeholder="25" />
                      </div>
                      <div className="field">
                        <label>Sekunder</label>
                        <input type="number" min="0" max="59" value={runForm.seconds} onChange={e=>setRunForm(f=>({...f,seconds:e.target.value}))} placeholder="0" />
                      </div>
                    </div>
                    {previewPace && (
                      <div className="pace-display">
                        <div>
                          <div className="pace-label">Tempo</div>
                          <div className="pace-val">{previewPace}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div className="pace-label">min/km</div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".7rem",color:"var(--muted)",marginTop:"4px"}}>{runForm.distance} km · {fmtDuration((parseInt(runForm.hours)||0)*3600+(parseInt(runForm.minutes)||0)*60+(parseInt(runForm.seconds)||0))}</div>
                        </div>
                      </div>
                    )}
                    <div className="field" style={{marginBottom:"16px"}}>
                      <label>Notater (valgfritt)</label>
                      <input value={runForm.notes} onChange={e=>setRunForm(f=>({...f,notes:e.target.value}))} placeholder="Føltes bra, vind fra nord..." />
                    </div>
                    <div className="save-row">
                      <button className="btn-outline" onClick={saveRun} disabled={!runForm.distance||(!runForm.minutes&&!runForm.seconds&&!runForm.hours)}>LAGRE LØPETUR</button>
                      {runSaved && <span className="save-msg">✓ LØPETUR LAGRET</span>}
                    </div>
                  </>
                )}

                {runSubNav === "history" && (
                  <>
                    {runs.length === 0 ? <div className="empty">ingen løpeturer ennå</div> : runs.map(run => (
                      <div key={run.id} className="run-entry">
                        <div>
                          <div className="run-dist">{parseFloat(run.distance).toFixed(1)}</div>
                          <div className="run-dist-unit">km</div>
                        </div>
                        <div className="run-meta">
                          <div className="run-meta-date">{run.date}</div>
                          <div className="run-meta-detail">
                            {fmtDuration(run.duration)} · {calcPace(parseFloat(run.distance), run.duration)} min/km · {run.type}
                            {run.notes && ` · ${run.notes}`}
                          </div>
                        </div>
                        <button className="btn-icon" onClick={() => deleteRun(run.id)}>🗑</button>
                      </div>
                    ))}
                  </>
                )}

                {runSubNav === "stats" && (
                  <>
                    <div className="run-stat-row">
                      <div className="stat-card"><div className="stat-val">{Math.round(totalKm*10)/10}</div><div className="stat-label">Totale km</div></div>
                      <div className="stat-card"><div className="stat-val">{runs.length}</div><div className="stat-label">Løpeturer</div></div>
                      <div className="stat-card"><div className="stat-val">{bestPace||"–"}</div><div className="stat-label">Beste tempo</div></div>
                    </div>

                    <div className="graph-section">
                      <div className="graph-title">Km per uke</div>
                      {weeklyData.length > 0 ? (
                        <div className="graph-box">
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={weeklyData}>
                              <XAxis dataKey="date" tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} />
                              <YAxis tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} width={35} />
                              <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text)",fontFamily:"DM Mono",fontSize:"0.75rem"}} formatter={v=>[`${v} km`,"Distanse"]} />
                              <Bar dataKey="km" fill="#F97316" radius={[2,2,0,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : <div className="graph-empty">logg løpeturer for å se ukentlig oversikt</div>}
                    </div>

                    <div className="top-list-title" style={{marginBottom:"12px"}}>Estimerte PR-tider</div>
                    <div className="run-pr-grid">
                      {prs.map(({dist, time}) => (
                        <div key={dist} className="run-pr-card">
                          <div className="run-pr-label">{dist === 21.1 ? "Halvmaraton" : dist === 42.2 ? "Maraton" : `${dist} km`}</div>
                          <div className="run-pr-val">{time || "–"}</div>
                          <div className="run-pr-sub">{time ? "estimert" : "ikke nok data"}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            );
          })()}

          {/* ── OVERSIKT ── */}
          {tab === "oversikt" && (
            <>
              <div className="subnav">
                <button className={`subnav-btn${subNav==="history"?" active":""}`} onClick={() => setSubNav("history")}>Historikk</button>
                <button className={`subnav-btn${subNav==="pr"?" active":""}`} onClick={() => setSubNav("pr")}>PR</button>
                <button className={`subnav-btn${subNav==="stats"?" active":""}`} onClick={() => setSubNav("stats")}>Statistikk</button>
              </div>

              {subNav === "history" && (
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

              {subNav === "pr" && (
                <>
                  {prGroups.length === 0 ? (
                    <div className="empty">logg økter for å se dine rekorder</div>
                  ) : prGroups.map(group => (
                    <div key={group} className="pr-group">
                      <div className="pr-group-title">{group}</div>
                      <div className="pr-grid">
                        {Object.entries(prByGroup[group])
                          .sort((a, b) => b[1].weight - a[1].weight)
                          .map(([name, pr]) => (
                            <div key={name} className="pr-card">
                              <div className="pr-exercise">{name}</div>
                              <div>
                                <span className="pr-weight">{pr.weight > 0 ? pr.weight : "–"}</span>
                                {pr.weight > 0 && <span className="pr-weight-unit">kg</span>}
                              </div>
                              {pr.sets && pr.reps && <div className="pr-detail">{pr.sets}×{pr.reps} reps</div>}
                              <div className="pr-detail">{pr.date}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {subNav === "stats" && (
                <>
                  <div className="stats-grid">
                    <div className="stat-card"><div className="stat-val">{totalSessions}</div><div className="stat-label">Totale økter</div></div>
                    <div className="stat-card"><div className="stat-val">{totalExCount}</div><div className="stat-label">Øvelser logget</div></div>
                    <div className="stat-card"><div className="stat-val">{programs.length}</div><div className="stat-label">Programmer</div></div>
                  </div>
                  <div className="graph-section">
                    <div className="graph-title">Totalvolum per økt (siste 20)</div>
                    {volumeGraphData.length > 0 ? (
                      <div className="graph-box">
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={volumeGraphData}>
                            <XAxis dataKey="date" tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} width={50} />
                            <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text)",fontFamily:"DM Mono",fontSize:"0.75rem"}} formatter={v => [`${v.toLocaleString("nb-NO")} kg`,"Volum"]} />
                            <Bar dataKey="volum" fill="#F97316" radius={[2,2,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <div className="graph-empty">logg flere økter for å se graf</div>}
                  </div>
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
                            <XAxis dataKey="date" tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} width={40} />
                            <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text)",fontFamily:"DM Mono",fontSize:"0.75rem"}} formatter={v => [`${v} kg`,"Vekt"]} />
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
                  ) : <div className="empty">logg noen økter for å se statistikk</div>}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
