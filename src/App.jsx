import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

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
  .exercise-inline-input { background: var(--surface2); border: 1px solid var(--border); color: var(--text); font-family: 'DM Mono', monospace; font-size: .85rem; width: 100%; padding: 4px 6px; outline: none; text-align: center; }
  .exercise-inline-input:focus { border-color: #F97316; }
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

  /* STRAVA */
  .strava-bar { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--border); padding: 12px 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .btn-strava { background: #FC4C02; border: none; color: #fff; font-family: 'Bebas Neue', sans-serif; font-size: 1rem; letter-spacing: 1px; padding: 9px 18px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: opacity .15s; white-space: nowrap; }
  .btn-strava:hover { opacity: .85; }
  .btn-strava:disabled { opacity: .5; cursor: not-allowed; }
  .strava-status { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: 1px; color: var(--muted); }
  .strava-status.connected { color: #4caf50; }
  .strava-msg { font-family: 'DM Mono', monospace; font-size: .7rem; color: #4caf50; letter-spacing: 1px; animation: fadeIn .3s ease; }
  .strava-msg.err { color: #e53e3e; }

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
  .landing-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; width: 100%; max-width: 680px; }
  @media (max-width: 500px) { .landing-grid { grid-template-columns: 1fr; max-width: 320px; } }

  /* PLAN */
  .plan-week { display: flex; flex-direction: column; gap: 8px; }
  .plan-day-card { border: 1px solid var(--border); background: var(--surface); overflow: hidden; transition: border-color .15s; }
  .plan-day-card.is-today { border-color: #F97316; }
  .plan-day-header { display: flex; align-items: center; padding: 12px 14px; gap: 10px; cursor: pointer; user-select: none; }
  .plan-day-header:hover { background: var(--surface2); }
  .plan-day-name { font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: 2px; flex: 1; }
  .plan-today-badge { font-family: 'DM Mono', monospace; font-size: .55rem; letter-spacing: 2px; text-transform: uppercase; background: #F97316; color: #000; padding: 2px 8px; }
  .plan-activity-list { padding: 0 14px 4px; }
  .plan-activity-row { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px solid var(--surface2); font-size: .85rem; }
  .plan-activity-row:last-child { border-bottom: none; }
  .plan-activity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .plan-activity-name { flex: 1; }
  .plan-activity-meta { font-family: 'DM Mono', monospace; font-size: .65rem; color: var(--muted); }
  .plan-add-form { padding: 12px 14px; border-top: 1px solid var(--border); background: var(--surface2); display: flex; flex-direction: column; gap: 8px; }
  .plan-type-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .plan-type-btn { padding: 7px 4px; border: 1px solid var(--border); background: none; color: var(--text); font-family: 'DM Mono', monospace; font-size: .6rem; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all .15s; text-align: center; }
  .plan-type-btn.active { border-color: #F97316; color: #F97316; }
  .landing-card { position: relative; border: 1px solid var(--border); background: var(--surface); cursor: pointer; transition: border-color .2s, transform .2s, box-shadow .2s; overflow: hidden; text-align: left; }
  .landing-card:hover { border-color: #F97316; transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.15); }
  .landing-card-img { width: 100%; height: 220px; object-fit: cover; display: block; transition: transform .4s ease; }
  .landing-card:hover .landing-card-img { transform: scale(1.05); }
  .landing-card-info { padding: 20px 22px 24px; }
  .landing-card-title { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; letter-spacing: 3px; margin-bottom: 6px; display: block; }
  .landing-card-sub { font-family: 'DM Mono', monospace; font-size: .6rem; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); display: block; }
  .landing-card-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #F97316; transform: scaleX(0); transition: transform .25s ease; transform-origin: left; }
  .landing-card:hover .landing-card-bar { transform: scaleX(1); }

  /* GOAL TRACKING */
  .goal-card { background: var(--surface); border: 1px solid var(--border); padding: 16px 18px; margin-bottom: 10px; position: relative; overflow: hidden; transition: border-color .15s; animation: slideIn .2s ease; }
  .goal-card::before { content: ""; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: #F97316; }
  .goal-card.achieved::before { background: #4caf50; }
  .goal-card-header { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 2px; }
  .goal-card-title { font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: 1px; flex: 1; line-height: 1.2; }
  .goal-progress-bar { height: 6px; background: var(--surface2); overflow: hidden; margin: 10px 0 6px; }
  .goal-progress-fill { height: 100%; transition: width .5s ease; }
  .goal-meta { font-family: 'DM Mono', monospace; font-size: .65rem; color: var(--muted); letter-spacing: 1px; display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
  .goal-achieved-badge { font-family: 'DM Mono', monospace; font-size: .55rem; letter-spacing: 2px; text-transform: uppercase; background: #4caf50; color: #000; padding: 2px 8px; flex-shrink: 0; align-self: center; }
  .goal-form { border: 1px dashed var(--border2); padding: 20px; margin-bottom: 20px; }
  .goal-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 12px; }
  .goal-type-btn { padding: 8px 6px; border: 1px solid var(--border); background: none; color: var(--text); font-family: 'DM Mono', monospace; font-size: .6rem; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all .15s; text-align: center; line-height: 1.4; }
  .goal-type-btn.active { border-color: #F97316; color: #F97316; background: rgba(249,115,22,0.05); }

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

  /* CALENDAR */
  .cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .cal-month-label { font-family: 'Bebas Neue', sans-serif; font-size: 1.4rem; letter-spacing: 2px; }
  .cal-nav-btn { background: none; border: 1px solid var(--border); color: var(--muted); width: 32px; height: 32px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all .15s; }
  .cal-nav-btn:hover { border-color: #F97316; color: #F97316; }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 16px; }
  .cal-dow { font-family: 'DM Mono', monospace; font-size: .55rem; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); text-align: center; padding: 6px 0; }
  .cal-cell { min-height: 52px; padding: 5px 4px 4px; display: flex; flex-direction: column; align-items: center; cursor: pointer; border: 1px solid transparent; transition: background .12s, border-color .12s; position: relative; }
  .cal-cell:hover { background: var(--surface2); }
  .cal-cell.has-activity { background: var(--surface); }
  .cal-cell.is-today .cal-num { color: #F97316; font-weight: bold; }
  .cal-cell.is-today { border-color: rgba(249,115,22,0.3); }
  .cal-cell.selected { border-color: #F97316 !important; background: rgba(249,115,22,0.08); }
  .cal-num { font-family: 'DM Mono', monospace; font-size: .72rem; color: var(--text); margin-bottom: 4px; line-height: 1; }
  .cal-num.other-month { color: var(--muted2); }
  .cal-dots { display: flex; gap: 2px; flex-wrap: wrap; justify-content: center; }
  .cal-dot { width: 6px; height: 6px; border-radius: 50%; }
  .cal-detail { background: var(--surface); border: 1px solid var(--border); padding: 14px 16px; margin-bottom: 16px; animation: slideIn .2s ease; }
  .cal-detail-date { font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 1px; margin-bottom: 10px; }
  .cal-activity-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--surface2); font-size: .85rem; }
  .cal-activity-row:last-child { border-bottom: none; }
  .cal-activity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .cal-legend { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
  .cal-legend-item { display: flex; align-items: center; gap: 5px; font-family: 'DM Mono', monospace; font-size: .6rem; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); }
`;

const PROGRAM_TEMPLATES = [
  {
    category: "PUSH / PULL / LEGS",
    programs: [
      {
        name: "Push A – Bryst & Skuldre",
        exercises: [
          { group:"Bryst",   name:"Benkpress",            sets:"4", reps:"8",  weight:"" },
          { group:"Bryst",   name:"Skråbenkpress (opp)",  sets:"3", reps:"10", weight:"" },
          { group:"Bryst",   name:"Hantelflyes",          sets:"3", reps:"12", weight:"" },
          { group:"Skuldre", name:"Militærpress",         sets:"4", reps:"8",  weight:"" },
          { group:"Skuldre", name:"Sidehev",              sets:"3", reps:"15", weight:"" },
        ],
      },
      {
        name: "Push B – Bryst & Triceps",
        exercises: [
          { group:"Bryst",   name:"Hantelbenkpress",       sets:"4", reps:"10", weight:"" },
          { group:"Bryst",   name:"Kabelkryss",            sets:"3", reps:"12", weight:"" },
          { group:"Bryst",   name:"Dips (bryst)",          sets:"3", reps:"10", weight:"" },
          { group:"Triceps", name:"Skull crushers",        sets:"3", reps:"10", weight:"" },
          { group:"Triceps", name:"Triceps pushdown",      sets:"3", reps:"12", weight:"" },
        ],
      },
      {
        name: "Push C – Skuldre & Triceps",
        exercises: [
          { group:"Skuldre", name:"Hantelpress (sittende)", sets:"4", reps:"10", weight:"" },
          { group:"Skuldre", name:"Arnold press",           sets:"3", reps:"10", weight:"" },
          { group:"Skuldre", name:"Frontløft",              sets:"3", reps:"12", weight:"" },
          { group:"Triceps", name:"Overhead tricepsext.",   sets:"3", reps:"12", weight:"" },
          { group:"Triceps", name:"Triceps dips",           sets:"3", reps:"12", weight:"" },
        ],
      },
      {
        name: "Pull A – Rygg fokus",
        exercises: [
          { group:"Rygg", name:"Markløft",           sets:"4", reps:"5",  weight:"" },
          { group:"Rygg", name:"Chins",              sets:"4", reps:"8",  weight:"" },
          { group:"Rygg", name:"Sittende roing",     sets:"3", reps:"10", weight:"" },
          { group:"Rygg", name:"Lat-pulldown",       sets:"3", reps:"12", weight:"" },
          { group:"Rygg", name:"Ettarms hantelroing",sets:"3", reps:"10", weight:"" },
        ],
      },
      {
        name: "Pull B – Rygg & Biceps",
        exercises: [
          { group:"Rygg",   name:"Pull-ups",        sets:"4", reps:"8",  weight:"" },
          { group:"Rygg",   name:"Stående roing",   sets:"3", reps:"10", weight:"" },
          { group:"Rygg",   name:"Hyperextensions", sets:"3", reps:"15", weight:"" },
          { group:"Biceps", name:"Stangcurl",       sets:"3", reps:"10", weight:"" },
          { group:"Biceps", name:"Hammercurl",      sets:"3", reps:"12", weight:"" },
        ],
      },
      {
        name: "Pull C – Biceps fokus",
        exercises: [
          { group:"Rygg",   name:"Omvendte flyes",        sets:"3", reps:"15", weight:"" },
          { group:"Biceps", name:"Hantelcurl",            sets:"3", reps:"12", weight:"" },
          { group:"Biceps", name:"Konsentrasjonskurl",    sets:"3", reps:"12", weight:"" },
          { group:"Biceps", name:"Kabelbicepscurl",       sets:"3", reps:"15", weight:"" },
          { group:"Biceps", name:"Predikerstolcurl",      sets:"3", reps:"10", weight:"" },
        ],
      },
      {
        name: "Legs A – Quad & Glutes",
        exercises: [
          { group:"Bein", name:"Knebøy",         sets:"4", reps:"8",  weight:"" },
          { group:"Bein", name:"Beinpress",       sets:"3", reps:"12", weight:"" },
          { group:"Bein", name:"Utfall",          sets:"3", reps:"12", weight:"" },
          { group:"Bein", name:"Leg extension",   sets:"3", reps:"15", weight:"" },
          { group:"Bein", name:"Kalvehev",        sets:"4", reps:"20", weight:"" },
        ],
      },
      {
        name: "Legs B – Hamstring & Posterior",
        exercises: [
          { group:"Bein", name:"Rumensk markløft", sets:"4", reps:"10", weight:"" },
          { group:"Bein", name:"Hip thrust",       sets:"4", reps:"12", weight:"" },
          { group:"Bein", name:"Bulgarske utfall", sets:"3", reps:"10", weight:"" },
          { group:"Bein", name:"Leg curl",         sets:"3", reps:"12", weight:"" },
          { group:"Bein", name:"Glute bridge",     sets:"3", reps:"15", weight:"" },
        ],
      },
    ],
  },
  {
    category: "SKADEFOREBYGGING – LØPING",
    programs: [
      {
        name: "Løping Skadeforebygging A",
        exercises: [
          { group:"Bein", name:"Hip thrust",       sets:"3", reps:"15", weight:"" },
          { group:"Bein", name:"Enbens markløft",  sets:"3", reps:"10", weight:"" },
          { group:"Bein", name:"Nordic curl",      sets:"3", reps:"8",  weight:"" },
          { group:"Bein", name:"Bulgarske utfall", sets:"3", reps:"10", weight:"" },
          { group:"Bein", name:"Kalvehev",         sets:"4", reps:"20", weight:"" },
        ],
      },
      {
        name: "Løping Skadeforebygging B",
        exercises: [
          { group:"Bein", name:"Glute bridge", sets:"3", reps:"20", weight:"" },
          { group:"Bein", name:"Utfall",       sets:"3", reps:"12", weight:"" },
          { group:"Mage", name:"Planke",       sets:"3", reps:"45", weight:"" },
          { group:"Mage", name:"Sidplanke",    sets:"3", reps:"30", weight:"" },
          { group:"Mage", name:"Bird dog",     sets:"3", reps:"12", weight:"" },
        ],
      },
    ],
  },
  {
    category: "SKADEFOREBYGGING – SYKKEL",
    programs: [
      {
        name: "Sykkel Skadeforebygging A",
        exercises: [
          { group:"Bein", name:"Hip thrust",     sets:"3", reps:"15", weight:"" },
          { group:"Bein", name:"Glute bridge",   sets:"3", reps:"20", weight:"" },
          { group:"Bein", name:"Utfall",         sets:"3", reps:"12", weight:"" },
          { group:"Bein", name:"Leg curl",       sets:"3", reps:"15", weight:"" },
          { group:"Rygg", name:"Hyperextensions",sets:"3", reps:"15", weight:"" },
        ],
      },
      {
        name: "Sykkel Skadeforebygging B",
        exercises: [
          { group:"Rygg", name:"Omvendte flyes", sets:"3", reps:"15", weight:"" },
          { group:"Mage", name:"Planke",         sets:"3", reps:"45", weight:"" },
          { group:"Mage", name:"Sidplanke",      sets:"3", reps:"30", weight:"" },
          { group:"Mage", name:"Pallof press",   sets:"3", reps:"12", weight:"" },
          { group:"Mage", name:"Deadbug",        sets:"3", reps:"10", weight:"" },
        ],
      },
    ],
  },
];

const EXERCISES_BY_GROUP = {
  "Bryst": ["Benkpress","Skråbenkpress (opp)","Skråbenkpress (ned)","Hantelbenkpress","Hantelflyes","Kabelkryss","Dips (bryst)","Push-up"],
  "Rygg": ["Markløft","Chins","Pull-ups","Sittende roing","Stående roing","Ettarms hantelroing","Lat-pulldown","Hyperextensions","Omvendte flyes"],
  "Skuldre": ["Militærpress","Hantelpress (sittende)","Sidehev","Frontløft","Bakover flyes","Shrugs","Arnold press"],
  "Biceps": ["Stangcurl","Hantelcurl","Hammercurl","Konsentrasjonskurl","Kabelbicepscurl","Predikerstolcurl"],
  "Triceps": ["Triceps pushdown","Skulderpress (trang grep)","Skull crushers","Triceps dips","Overhead tricepsext.","Kickbacks"],
  "Bein": ["Knebøy","Frontknebøy","Beinpress","Utfall","Rumensk markløft","Leg curl","Leg extension","Hip thrust","Bulgarske utfall","Kalvehev","Glute bridge","Enbens markløft","Nordic curl"],
  "Mage": ["Crunch","Planke","Sidplanke","Situps","Beinheving","Russian twist","Pallof press","Ab wheel","Bird dog","Deadbug"],
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
  return exs.reduce((sum, e) => {
    if (Array.isArray(e.sets)) {
      return sum + e.sets.reduce((s, set) => s + (parseFloat(set.reps)||0) * (parseFloat(set.weight)||0), 0);
    }
    return sum + (parseFloat(e.sets)||0) * (parseFloat(e.reps)||0) * (parseFloat(e.weight)||0);
  }, 0);
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

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

function RouteMap({ sport, user }) {
  const [waypoints, setWaypoints] = useState([]);
  const [routeLine, setRouteLine] = useState([]);
  const [distance, setDistance] = useState(null);
  const [routeName, setRouteName] = useState("");
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [savingRoute, setSavingRoute] = useState(false);

  useEffect(() => { loadSavedRoutes(); }, []);

  useEffect(() => {
    if (waypoints.length >= 2) calculateRoute();
    else { setRouteLine([]); setDistance(null); }
  }, [waypoints]);

  async function loadSavedRoutes() {
    const { data } = await supabase.from("planned_routes").select("*").eq("user_id", user.id).eq("sport", sport).order("created_at", { ascending: false });
    if (data) setSavedRoutes(data);
  }

  async function geocodeSearch() {
    if (!searchQuery.trim()) return;
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=4&accept-language=no`);
    const data = await res.json();
    setSearchResults(data);
  }

  function pickSearchResult(r) {
    setWaypoints(prev => [...prev, { lat: parseFloat(r.lat), lng: parseFloat(r.lon) }]);
    setSearchResults([]);
    setSearchQuery("");
  }

  function handleMapClick(latlng) {
    setWaypoints(prev => [...prev, { lat: latlng.lat, lng: latlng.lng }]);
  }

  function removeWaypoint(i) {
    setWaypoints(prev => prev.filter((_, idx) => idx !== i));
  }

  async function calculateRoute() {
    setRouteLoading(true);
    const profile = sport === "sykkel" ? "bike" : "foot";
    const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(";");
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes?.[0]) {
        setRouteLine(data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]));
        setDistance(Math.round(data.routes[0].distance / 100) / 10);
      }
    } catch {}
    setRouteLoading(false);
  }

  async function saveRoute() {
    if (!routeName.trim() || waypoints.length < 2) return;
    setSavingRoute(true);
    const { data } = await supabase.from("planned_routes").insert({ user_id: user.id, name: routeName, sport, waypoints, distance }).select().single();
    if (data) { setSavedRoutes(prev => [data, ...prev]); setRouteName(""); }
    setSavingRoute(false);
  }

  async function deleteRoute(id) {
    await supabase.from("planned_routes").delete().eq("id", id);
    setSavedRoutes(prev => prev.filter(r => r.id !== id));
  }

  function loadRoute(route) {
    setWaypoints(route.waypoints);
  }

  const mapCenter = [60.4, 8.5];

  return (
    <div>
      <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && geocodeSearch()}
          placeholder="Søk etter sted eller adresse..."
          style={{flex:1,background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text)",padding:"10px 12px",fontFamily:"'DM Sans',sans-serif",fontSize:".9rem",outline:"none"}}
        />
        <button className="btn-orange" onClick={geocodeSearch}>Søk</button>
      </div>

      {searchResults.length > 0 && (
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",marginBottom:"8px",maxHeight:"180px",overflowY:"auto"}}>
          {searchResults.map(r => (
            <div key={r.place_id} onClick={() => pickSearchResult(r)}
              style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid var(--border)",fontSize:".82rem",fontFamily:"'DM Sans',sans-serif"}}>
              {r.display_name}
            </div>
          ))}
        </div>
      )}

      <div style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--muted)",letterSpacing:"2px",marginBottom:"6px",textTransform:"uppercase"}}>
        Klikk på kartet for å legge til punkter
      </div>

      <MapContainer center={mapCenter} zoom={5} style={{height:"380px",border:"1px solid var(--border)",marginBottom:"12px",zIndex:0}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
        <MapClickHandler onMapClick={handleMapClick} />
        {waypoints.map((wp, i) => <Marker key={i} position={[wp.lat, wp.lng]} />)}
        {routeLine.length > 0 && <Polyline positions={routeLine} color="#F97316" weight={4} opacity={0.9} />}
      </MapContainer>

      <div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"16px",flexWrap:"wrap"}}>
        {distance !== null && (
          <div>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2rem",color:"#F97316",lineHeight:1}}>{distance}</span>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"var(--muted)",marginLeft:"4px"}}>km</span>
          </div>
        )}
        {routeLoading && <span style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"var(--muted)",letterSpacing:"1px"}}>Beregner rute...</span>}
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"var(--muted)"}}>{waypoints.length} punkt{waypoints.length !== 1 ? "er" : ""}</span>
        {waypoints.length > 0 && (
          <button onClick={() => { setWaypoints([]); setRouteLine([]); setDistance(null); }} className="btn-ghost" style={{marginLeft:"auto",padding:"6px 14px",fontSize:".65rem"}}>Nullstill</button>
        )}
      </div>

      {waypoints.length > 0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"16px"}}>
          {waypoints.map((_, i) => (
            <span key={i} onClick={() => removeWaypoint(i)}
              style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",border:"1px solid var(--border)",padding:"3px 10px",cursor:"pointer",color:"var(--muted)"}}>
              Punkt {i+1} ✕
            </span>
          ))}
        </div>
      )}

      {waypoints.length >= 2 && (
        <div style={{display:"flex",gap:"8px",marginBottom:"28px"}}>
          <input
            value={routeName}
            onChange={e => setRouteName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveRoute()}
            placeholder="Gi ruten et navn..."
            style={{flex:1,background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text)",padding:"10px 12px",fontFamily:"'DM Sans',sans-serif",fontSize:".9rem",outline:"none"}}
          />
          <button className="btn-orange" onClick={saveRoute} disabled={savingRoute}>{savingRoute ? "Lagrer..." : "LAGRE"}</button>
        </div>
      )}

      <div style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:"12px"}}>LAGREDE RUTER</div>
      {savedRoutes.length === 0 ? (
        <div className="empty">ingen ruter lagret ennå</div>
      ) : savedRoutes.map(route => (
        <div key={route.id} style={{background:"var(--surface)",border:"1px solid var(--border)",padding:"14px 16px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.1rem",letterSpacing:"1px"}}>{route.name}</div>
            {route.distance && <div style={{fontFamily:"'DM Mono',monospace",fontSize:".7rem",color:"var(--muted)",marginTop:"2px"}}>{route.distance} km</div>}
          </div>
          <button onClick={() => loadRoute(route)} className="btn-outline" style={{padding:"6px 16px",fontSize:".85rem"}}>Last inn</button>
          <button onClick={() => deleteRoute(route.id)} className="btn-icon">🗑</button>
        </div>
      ))}
    </div>
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
        <div className="auth-title">PUL<span>SE</span></div>
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
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("pulse-theme") !== "light");
  const [lightPalette, setLightPalette] = useState(() => localStorage.getItem("pulse-palette") || "krem");
  const [showSettings, setShowSettings] = useState(false);

  function setPalette(p) {
    setLightPalette(p);
    localStorage.setItem("pulse-palette", p);
  }
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [section, setSection] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [subNav, setSubNav] = useState("history");
  const [runSubNav, setRunSubNav] = useState("stats");
  const [cycleSubNav, setCycleSubNav] = useState("stats");
  const [progSubNav, setProgSubNav] = useState("mine");
  const [runs, setRuns] = useState([]);
  const [runForm, setRunForm] = useState({ distance: "", hours: "", minutes: "", seconds: "", type: "Vei", notes: "" });
  const [runSaved, setRunSaved] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [stravaSyncing, setStravaSyncing] = useState(false);
  const [stravaMsg, setStravaMsg] = useState("");
  const [rides, setRides] = useState([]);
  const [cyclingSyncing, setCyclingSyncing] = useState(false);
  const [cyclingMsg, setCyclingMsg] = useState("");

  async function checkStravaConnection() {
    const { data } = await supabase.from("strava_tokens").select("user_id").eq("user_id", user?.id).maybeSingle();
    setStravaConnected(!!data);
  }

  function connectStrava() {
    window.location.href = `/api/strava-auth?user_id=${user.id}`;
  }

  async function syncStrava() {
    setStravaSyncing(true);
    setStravaMsg("");
    try {
      const res = await fetch(`/api/strava-sync?user_id=${user.id}`);
      const data = await res.json();
      if (data.imported !== undefined) {
        setStravaMsg(data.imported > 0 ? `✓ ${data.imported} nye løpeturer importert` : "✓ Ingen nye løpeturer");
        if (data.imported > 0) await loadRuns();
      } else {
        setStravaMsg("Feil ved synk");
      }
    } catch {
      setStravaMsg("Feil ved synk");
    }
    setStravaSyncing(false);
    setTimeout(() => setStravaMsg(""), 4000);
  }

  async function loadRuns() {
    const { data } = await supabase.from("runs").select("*").order("date_key", { ascending: false });
    if (data) setRuns(data);
  }

  async function loadRides() {
    const { data } = await supabase.from("rides").select("*").order("date_key", { ascending: false });
    if (data) setRides(data);
  }

  async function syncStravaCycling() {
    setCyclingSyncing(true);
    setCyclingMsg("");
    try {
      const res = await fetch(`/api/strava-sync-cycling?user_id=${user.id}`);
      const data = await res.json();
      if (data.imported !== undefined) {
        setCyclingMsg(data.imported > 0 ? `✓ ${data.imported} nye sykkelture importert` : "✓ Ingen nye sykkelture");
        if (data.imported > 0) await loadRides();
      } else {
        setCyclingMsg("Feil ved synk");
      }
    } catch {
      setCyclingMsg("Feil ved synk");
    }
    setCyclingSyncing(false);
    setTimeout(() => setCyclingMsg(""), 4000);
  }

  function calcSpeed(distance, duration) {
    if (!distance || !duration) return null;
    return (distance / duration * 3600).toFixed(1);
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

  async function deleteRide(id) {
    await supabase.from("rides").delete().eq("id", id);
    setRides(prev => prev.filter(r => r.id !== id));
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
    const actualDelta = next - timerDuration;
    setTimerDuration(next);
    setTimerRemaining(prev => Math.max(1, prev + actualDelta));
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

  // Handle Strava OAuth callback URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("strava_connected")) {
      setSection("løping");
      setTab("running");
      setStravaMsg("✓ Strava koblet til!");
      setTimeout(() => setStravaMsg(""), 4000);
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("strava_error")) {
      setSection("løping");
      setTab("running");
      const reason = params.get("reason") || "";
      setStravaMsg("Feil: " + (reason || "Klarte ikke koble til Strava"));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Weekly plan helpers
  function loadWeeklyPlan(uid) {
    try {
      const saved = localStorage.getItem(`pulse-plan-${uid}`);
      if (saved) setWeeklyPlan(JSON.parse(saved));
    } catch {}
  }
  function savePlanDay(dayIdx, newActivities) {
    setWeeklyPlan(prev => {
      const next = prev.map((d, i) => i === dayIdx ? {...d, activities: newActivities} : d);
      localStorage.setItem(`pulse-plan-${user.id}`, JSON.stringify(next));
      return next;
    });
  }

  // Goals helpers
  function loadGoals(uid) {
    try {
      const saved = localStorage.getItem(`pulse-goals-${uid}`);
      if (saved) setGoals(JSON.parse(saved));
    } catch {}
  }
  function saveGoals(newGoals) {
    setGoals(newGoals);
    if (user) localStorage.setItem(`pulse-goals-${user.id}`, JSON.stringify(newGoals));
  }
  function addGoal() {
    if (!goalForm.title.trim() || !goalForm.target) return;
    const UNIT_LABELS = { styrke:"kg", løping_km:"km", sykkel_km:"km", okter:"økter", vekt:"kg" };
    const newGoal = {
      id: Date.now() + Math.random(),
      title: goalForm.title.trim(),
      type: goalForm.type,
      exercise: goalForm.exercise,
      target: parseFloat(goalForm.target),
      unit: goalForm.type === "egendefinert" ? (goalForm.unit || "") : UNIT_LABELS[goalForm.type] || "",
      deadline: goalForm.deadline,
      current: parseFloat(goalForm.current) || 0,
      achieved: false,
      createdAt: todayKey(),
    };
    saveGoals([...goals, newGoal]);
    setShowGoalForm(false);
    setGoalForm({ type:"styrke", title:"", exercise:"Benkpress", exerciseGroup:"Bryst", target:"", deadline:"", unit:"kg", current:"" });
  }
  function deleteGoal(id) { saveGoals(goals.filter(g => g.id !== id)); }
  function toggleGoalAchieved(id) { saveGoals(goals.map(g => g.id === id ? {...g, achieved:!g.achieved} : g)); }
  function updateGoalCurrent(id, val) { saveGoals(goals.map(g => g.id === id ? {...g, current:parseFloat(val)||0} : g)); }

  // Load data when user logs in
  useEffect(() => {
    if (!user) { setHistory([]); setPrograms([]); setProfile({ username:"", weight:"", height:"", age:"", goals:[] }); return; }
    loadHistory();
    loadPrograms();
    loadProfile();
    loadRuns();
    loadRides();
    checkStravaConnection();
    loadWeeklyPlan(user.id);
    loadGoals(user.id);
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
    const numSets = parseInt(logForm.sets) || 1;
    const setsArr = Array.from({length: numSets}, () => ({
      id: Date.now() + Math.random(),
      reps: logForm.reps || "",
      weight: logForm.weight || "",
      done: false,
    }));
    setExercises(prev => [...prev, { name: finalName, group: logForm.group, id: Date.now(), sets: setsArr, collapsed: false }]);
    setLogForm(f => ({ ...f, sets: "", reps: "", weight: "", customName: "" }));
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
    const loaded = program.exercises.map(ex => {
      const numSets = parseInt(ex.sets) || 1;
      const setsArr = Array.from({length: numSets}, () => ({
        id: Date.now() + Math.random(),
        reps: ex.reps || "",
        weight: ex.weight || "",
        done: false,
      }));
      return { name: ex.name, group: ex.group, id: Date.now() + Math.random(), sets: setsArr, collapsed: false };
    });
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
      let weight, setsDisplay, repsDisplay;
      if (Array.isArray(ex.sets)) {
        weight = ex.sets.length > 0 ? Math.max(...ex.sets.map(s => parseFloat(s.weight)||0)) : 0;
        setsDisplay = String(ex.sets.length);
        const bestSet = ex.sets.reduce((b, s) => (parseFloat(s.weight)||0) >= (parseFloat(b.weight)||0) ? s : b, ex.sets[0] || {});
        repsDisplay = bestSet?.reps || "";
      } else {
        weight = parseFloat(ex.weight) || 0;
        setsDisplay = ex.sets;
        repsDisplay = ex.reps;
      }
      if (!prByGroup[group]) prByGroup[group] = {};
      if (!prByGroup[group][ex.name] || weight > prByGroup[group][ex.name].weight) {
        prByGroup[group][ex.name] = { weight, sets: setsDisplay, reps: repsDisplay, date: session.date_key };
      }
    });
  });
  const prGroups = Object.keys(EXERCISES_BY_GROUP).filter(g => prByGroup[g]);

  // Estimated 1RM per exercise (Epley: weight × (1 + reps/30))
  const est1RM = {};
  history.forEach(session => {
    session.exercises.forEach(ex => {
      let best = 0;
      if (Array.isArray(ex.sets)) {
        ex.sets.forEach(s => {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps) || 1;
          if (w) { const v = r <= 1 ? w : Math.round(w * (1 + r / 30)); if (v > best) best = v; }
        });
      } else {
        const w = parseFloat(ex.weight) || 0;
        const r = parseInt(ex.reps) || 1;
        if (w) best = r <= 1 ? w : Math.round(w * (1 + r / 30));
      }
      if (best > (est1RM[ex.name] || 0)) est1RM[ex.name] = best;
    });
  });

  // Compute auto-progress for a goal
  function getGoalCurrent(goal) {
    const now = new Date();
    const monthKey = now.toISOString().slice(0,7);
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    switch (goal.type) {
      case "styrke": return est1RM[goal.exercise] || 0;
      case "løping_km": return Math.round(runs.filter(r => r.date_key.startsWith(monthKey)).reduce((s,r) => s + parseFloat(r.distance), 0) * 10) / 10;
      case "sykkel_km": return Math.round(rides.filter(r => r.date_key.startsWith(monthKey)).reduce((s,r) => s + parseFloat(r.distance), 0) * 10) / 10;
      case "okter": return history.filter(s => new Date(s.date_key) >= oneWeekAgo).length;
      case "vekt": return weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 0;
      case "egendefinert": return goal.current || 0;
      default: return 0;
    }
  }

  // Calendar
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedCalDay, setSelectedCalDay] = useState(null);

  // Weekly plan (localStorage)
  const [weeklyPlan, setWeeklyPlan] = useState(() => Array.from({length:7}, () => ({activities:[]})));
  const [editingPlanDay, setEditingPlanDay] = useState(null);
  const [planForm, setPlanForm] = useState({type:"styrke", programId:"", distance:"", notes:""});

  // Goals (localStorage)
  const [goals, setGoals] = useState([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ type:"styrke", title:"", exercise:"Benkpress", exerciseGroup:"Bryst", target:"", deadline:"", unit:"kg", current:"" });

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
      let vekt, volum;
      if (Array.isArray(ex.sets)) {
        vekt = ex.sets.length > 0 ? Math.max(...ex.sets.map(set => parseFloat(set.weight)||0)) : 0;
        volum = Math.round(ex.sets.reduce((sum, set) => sum + (parseFloat(set.reps)||0) * (parseFloat(set.weight)||0), 0));
      } else {
        vekt = parseFloat(ex.weight) || 0;
        volum = Math.round((parseFloat(ex.sets)||0) * (parseFloat(ex.reps)||0) * (parseFloat(ex.weight)||0));
      }
      return { date: s.date_key.slice(5), vekt, volum };
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
            <div className="landing-logo">PUL<span style={{color:ACCENT}}>SE</span></div>
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
                    <button className={`theme-btn${darkMode ? " active" : ""}`} onClick={() => { setDarkMode(true); localStorage.setItem("pulse-theme","dark"); }}>🌙 Mørk</button>
                    <button className={`theme-btn${!darkMode ? " active" : ""}`} onClick={() => { setDarkMode(false); localStorage.setItem("pulse-theme","light"); }}>☀ Lys</button>
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
                <img className="landing-card-img" src="/styrke.jpg" alt="Styrke" />
                <div className="landing-card-info">
                  <span className="landing-card-title">STYRKE</span>
                  <span className="landing-card-sub">Logg økt · programmer · PR</span>
                </div>
                <div className="landing-card-bar" />
              </button>
              <button className="landing-card" onClick={() => { setSection("løping"); setTab("running"); }}>
                <img className="landing-card-img" src="/loping.jpg" alt="Løping" />
                <div className="landing-card-info">
                  <span className="landing-card-title">LØPING</span>
                  <span className="landing-card-sub">Statistikk · tempo · PR</span>
                </div>
                <div className="landing-card-bar" />
              </button>
              <button className="landing-card" onClick={() => { setSection("sykkel"); setTab("cycling"); }}>
                <img className="landing-card-img" src="/sykkel.jpg" alt="Sykkel" />
                <div className="landing-card-info">
                  <span className="landing-card-title">SYKKEL</span>
                  <span className="landing-card-sub">Statistikk · fart · distanse</span>
                </div>
                <div className="landing-card-bar" />
              </button>
              <button className="landing-card" onClick={() => { setSection("plan"); setTab("plan"); }}>
                <img className="landing-card-img" src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80" alt="Treningsplan" />
                <div className="landing-card-info">
                  <span className="landing-card-title">PLAN</span>
                  <span className="landing-card-sub">Ukesplan · program · mål</span>
                </div>
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
                  <button className={`theme-btn${darkMode ? " active" : ""}`} onClick={() => { setDarkMode(true); localStorage.setItem("pulse-theme","dark"); }}>🌙 Mørk</button>
                  <button className={`theme-btn${!darkMode ? " active" : ""}`} onClick={() => { setDarkMode(false); localStorage.setItem("pulse-theme","light"); }}>☀ Lys</button>
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
          <button onClick={() => setSection(null)} style={{background:"none",border:"none",cursor:"pointer",padding:0,lineHeight:1,color:"inherit"}}>
            <h1>PUL<span style={{color:ACCENT}}>SE</span></h1>
          </button>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--muted)",letterSpacing:"2px",textTransform:"uppercase",background:"var(--surface2)",border:"1px solid var(--border)",padding:"2px 8px",marginLeft:"4px"}}>{section === "løping" ? "LØPING" : section === "sykkel" ? "SYKKEL" : section === "plan" ? "PLAN" : "STYRKE"}</span>
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
            ? [["running","LØPING"],["oversikt","OVERSIKT"],["profile","PROFIL"]]
            : section === "sykkel"
            ? [["cycling","SYKKEL"],["oversikt","OVERSIKT"],["profile","PROFIL"]]
            : section === "plan"
            ? [["plan","UKESPLAN"],["goals","MÅL"],["profile","PROFIL"]]
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

              {exercises.length > 0 && (() => {
                const totalSetsCount = exercises.reduce((s, ex) => s + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0);
                const doneSetsCount = exercises.reduce((s, ex) => s + (Array.isArray(ex.sets) ? ex.sets.filter(set => set.done).length : 0), 0);
                const progressPct = totalSetsCount > 0 ? Math.round(doneSetsCount / totalSetsCount * 100) : 0;
                return (
                  <div style={{marginTop:"16px"}}>
                    {/* Progress bar */}
                    <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
                      <div style={{flex:1,height:"4px",background:"var(--surface2)",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${progressPct}%`,background:progressPct===100?"#4caf50":"#F97316",transition:"width .35s ease"}} />
                      </div>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.3rem",color:progressPct===100?"#4caf50":"#F97316",lineHeight:1,minWidth:"40px",textAlign:"right"}}>{progressPct}%</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--muted)",whiteSpace:"nowrap"}}>{doneSetsCount}/{totalSetsCount} sett</div>
                    </div>

                    {exercises.map(ex => {
                      const setsArr = Array.isArray(ex.sets) ? ex.sets : [];
                      const doneSets = setsArr.filter(s => s.done).length;
                      const allDone = setsArr.length > 0 && doneSets === setsArr.length;
                      const isCollapsed = ex.collapsed;

                      const toggleCollapse = () => setExercises(prev => prev.map(x => x.id===ex.id ? {...x, collapsed:!x.collapsed} : x));
                      const updateSet = (setId, changes) => {
                        setExercises(prev => prev.map(x => {
                          if (x.id !== ex.id) return x;
                          return { ...x, sets: x.sets.map(s => s.id === setId ? {...s, ...changes} : s) };
                        }));
                      };
                      const markSetDone = (setId) => {
                        setExercises(prev => prev.map(x => {
                          if (x.id !== ex.id) return x;
                          const newSets = x.sets.map(s => s.id === setId ? {...s, done:true} : s);
                          const nowAllDone = newSets.every(s => s.done);
                          return { ...x, sets: newSets, collapsed: nowAllDone };
                        }));
                        startTimer();
                      };
                      const markSetUndone = (setId) => {
                        setExercises(prev => prev.map(x => {
                          if (x.id !== ex.id) return x;
                          return { ...x, sets: x.sets.map(s => s.id === setId ? {...s, done:false} : s), collapsed: false };
                        }));
                      };
                      const removeSet = (setId) => {
                        setExercises(prev => prev.map(x => {
                          if (x.id !== ex.id) return x;
                          return { ...x, sets: x.sets.filter(s => s.id !== setId) };
                        }));
                      };
                      const addSet = () => {
                        const last = setsArr[setsArr.length - 1];
                        setExercises(prev => prev.map(x => {
                          if (x.id !== ex.id) return x;
                          return { ...x, sets: [...x.sets, {id: Date.now()+Math.random(), reps: last?.reps||"", weight: last?.weight||"", done: false}], collapsed: false };
                        }));
                      };
                      const markAllDone = () => {
                        setExercises(prev => prev.map(x => {
                          if (x.id !== ex.id) return x;
                          return { ...x, sets: x.sets.map(s => ({...s, done:true})), collapsed: true };
                        }));
                      };

                      const maxWeight = setsArr.length > 0 ? Math.max(0, ...setsArr.map(s => parseFloat(s.weight)||0)) : 0;
                      const borderColor = allDone ? "#4caf50" : "var(--border)";

                      /* ── COLLAPSED ROW ── */
                      if (isCollapsed) {
                        return (
                          <div key={ex.id} style={{background:"var(--surface)",border:`1px solid ${borderColor}`,marginBottom:"6px",animation:"slideIn .2s ease"}}>
                            <div style={{display:"flex",alignItems:"center",padding:"10px 14px",gap:"10px",cursor:"pointer"}} onClick={toggleCollapse}>
                              <span style={{color:allDone?"#4caf50":"var(--muted)",fontSize:".75rem",fontFamily:"'DM Mono',monospace",flexShrink:0}}>
                                {allDone ? "✓" : "▶"}
                              </span>
                              <div style={{flex:1,minWidth:0}}>
                                <div className="exercise-name">{ex.name}</div>
                                <div style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:allDone?"#4caf50":"var(--muted)",marginTop:"1px"}}>
                                  {doneSets}/{setsArr.length} sett{allDone && maxWeight > 0 ? ` · maks ${maxWeight} kg` : ""}
                                </div>
                              </div>
                              {/* dot progress */}
                              <div style={{display:"flex",gap:"3px",flexShrink:0}}>
                                {setsArr.map(s => (
                                  <div key={s.id} style={{width:"7px",height:"7px",borderRadius:"50%",background:s.done?"#4caf50":"var(--border)"}} />
                                ))}
                              </div>
                              <button className="btn-remove" style={{flexShrink:0}} onClick={e => { e.stopPropagation(); setExercises(prev => prev.filter(e2 => e2.id !== ex.id)); }}>×</button>
                            </div>
                          </div>
                        );
                      }

                      /* ── EXPANDED CARD ── */
                      const allFilled = setsArr.every(s => s.reps && s.weight);
                      return (
                        <div key={ex.id} style={{background:"var(--surface)",border:`1px solid ${borderColor}`,marginBottom:"8px",animation:"slideIn .2s ease",overflow:"hidden"}}>
                          {/* Card header */}
                          <div style={{display:"flex",alignItems:"center",padding:"10px 14px",borderBottom:"1px solid var(--border)",gap:"8px"}}>
                            <button onClick={toggleCollapse} title="Komprimer" style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:".75rem",fontFamily:"'DM Mono',monospace",padding:"0 2px",flexShrink:0}}>▼</button>
                            <div className="exercise-name" style={{flex:1}}>{ex.name}</div>
                            {allFilled && !allDone && (
                              <button onClick={markAllDone} style={{fontSize:".6rem",fontFamily:"'DM Mono',monospace",letterSpacing:"1px",background:"none",border:"1px solid #4caf50",color:"#4caf50",padding:"3px 10px",cursor:"pointer",whiteSpace:"nowrap"}}>ALT FERDIG ✓</button>
                            )}
                            <button className="btn-remove" onClick={() => setExercises(prev => prev.filter(e => e.id !== ex.id))}>×</button>
                          </div>

                          {/* Per-set rows */}
                          {setsArr.map((set, setIdx) => {
                            if (set.done) {
                              return (
                                <div key={set.id} style={{display:"flex",alignItems:"center",padding:"8px 14px",borderBottom:"1px solid var(--surface2)",background:"rgba(76,175,80,0.06)",gap:"10px"}}>
                                  <button onClick={() => markSetUndone(set.id)} style={{width:"22px",height:"22px",background:"#4caf50",border:"none",color:"#000",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".75rem",fontWeight:"bold",flexShrink:0}}>✓</button>
                                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"var(--muted)",width:"44px",flexShrink:0}}>Sett {setIdx+1}</span>
                                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:".8rem",color:"#4caf50",flex:1}}>{set.reps} reps · {set.weight} kg</span>
                                </div>
                              );
                            }
                            return (
                              <div key={set.id} style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr auto auto",alignItems:"center",gap:"8px",padding:"8px 14px",borderBottom:"1px solid var(--surface2)"}}>
                                <span style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"var(--muted)"}}>Sett {setIdx+1}</span>
                                <div>
                                  <input type="number" min="1" className="exercise-inline-input" value={set.reps} placeholder="reps"
                                    onChange={e => updateSet(set.id, {reps: e.target.value})}
                                    onKeyDown={e => e.key === "Enter" && set.reps && set.weight && markSetDone(set.id)} />
                                  <div className="exercise-unit" style={{textAlign:"center"}}>reps</div>
                                </div>
                                <div>
                                  <input type="number" min="0" step="0.5" className="exercise-inline-input" value={set.weight} placeholder="kg"
                                    onChange={e => updateSet(set.id, {weight: e.target.value})}
                                    onKeyDown={e => e.key === "Enter" && set.reps && set.weight && markSetDone(set.id)} />
                                  <div className="exercise-unit" style={{textAlign:"center"}}>kg</div>
                                </div>
                                <button
                                  onClick={() => set.reps && set.weight && markSetDone(set.id)}
                                  title="Sett ferdig"
                                  style={{width:"28px",height:"28px",background:"none",border:`1px solid ${set.reps&&set.weight?"#4caf50":"var(--border)"}`,color:set.reps&&set.weight?"#4caf50":"var(--muted)",cursor:set.reps&&set.weight?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",fontSize:".9rem",flexShrink:0,transition:"all .15s"}}>✓</button>
                                <button onClick={() => removeSet(set.id)} className="btn-remove" style={{width:"22px",height:"22px",flexShrink:0}}>×</button>
                              </div>
                            );
                          })}

                          {/* Add set footer */}
                          <div style={{padding:"8px 14px"}}>
                            <button onClick={addSet}
                              style={{background:"none",border:"1px dashed var(--border)",color:"var(--muted)",fontFamily:"'DM Mono',monospace",fontSize:".6rem",letterSpacing:"1px",padding:"5px 14px",cursor:"pointer",width:"100%",transition:"all .15s"}}
                              onMouseEnter={e => {e.currentTarget.style.borderColor="#F97316";e.currentTarget.style.color="#F97316";}}
                              onMouseLeave={e => {e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)";}}>
                              + LEGG TIL SETT
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

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
              <div className="subnav" style={{marginBottom:"24px"}}>
                <button className={`subnav-btn${progSubNav==="mine"?" active":""}`} onClick={() => { setProgSubNav("mine"); setCreatingProgram(false); }}>Mine programmer</button>
                <button className={`subnav-btn${progSubNav==="maler"?" active":""}`} onClick={() => { setProgSubNav("maler"); setCreatingProgram(false); }}>Tilgjengelige</button>
              </div>

              {/* ── MINE PROGRAMMER ── */}
              {progSubNav === "mine" && (
                <>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
                    <div className="section-title">MINE<span> PROGRAM</span></div>
                    {!creatingProgram && (
                      <button className="btn-orange" onClick={() => setCreatingProgram(true)}>+ NYTT</button>
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
                    <div className="empty" style={{marginBottom:"16px"}}>ingen egne programmer ennå
                      <div style={{marginTop:"12px"}}>
                        <button className="btn-outline" style={{fontSize:".8rem",padding:"8px 16px"}} onClick={() => setProgSubNav("maler")}>Se tilgjengelige maler →</button>
                      </div>
                    </div>
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

              {/* ── TILGJENGELIGE MALER ── */}
              {progSubNav === "maler" && (
                <>
                  {progSaved && <div className="save-msg" style={{marginBottom:"16px"}}>✓ PROGRAM LAGT TIL</div>}
                  {PROGRAM_TEMPLATES.map(cat => (
                    <div key={cat.category} style={{marginBottom:"28px"}}>
                      <div className="graph-title" style={{marginBottom:"12px"}}>{cat.category}</div>
                      {cat.programs.map(tpl => {
                        const alreadyAdded = programs.some(p => p.name === tpl.name);
                        return (
                          <div key={tpl.name} className="program-card" style={{marginBottom:"10px"}}>
                            <div className="program-header">
                              <div className="program-name">{tpl.name}</div>
                              <div className="program-badge">{tpl.exercises.length} øvelser</div>
                            </div>
                            <div className="program-body">
                              {tpl.exercises.map((ex, i) => (
                                <div key={i} className="prog-ex-row">
                                  <div className="prog-ex-name">{ex.name}</div>
                                  <div className="prog-ex-detail">{ex.sets}×{ex.reps}{ex.name==="Planke"||ex.name==="Sidplanke"?"s":""}</div>
                                </div>
                              ))}
                            </div>
                            <div className="program-footer">
                              {alreadyAdded ? (
                                <span style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"#4caf50",letterSpacing:"1px"}}>✓ Lagt til i Mine programmer</span>
                              ) : (
                                <button className="btn-load" onClick={async () => {
                                  const exs = tpl.exercises.map(e => ({...e, id: Date.now() + Math.random()}));
                                  const { data } = await supabase.from("programs").insert({ user_id: user.id, name: tpl.name, exercises: exs }).select().single();
                                  if (data) { setPrograms(prev => [data, ...prev]); setProgSaved(true); setTimeout(() => setProgSaved(false), 2500); }
                                }}>+ LEGG TIL</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {/* ── LØPING ── */}
          {tab === "running" && (
            <div className="subnav" style={{marginBottom:"24px"}}>
              <button className={`subnav-btn${runSubNav==="stats"?" active":""}`} onClick={() => setRunSubNav("stats")}>Statistikk</button>
              <button className={`subnav-btn${runSubNav==="plan"?" active":""}`} onClick={() => setRunSubNav("plan")}>Planlegg tur</button>
              <button className={`subnav-btn${runSubNav==="skade"?" active":""}`} onClick={() => setRunSubNav("skade")}>Skadeforebygging</button>
            </div>
          )}
          {tab === "running" && runSubNav === "plan" && (
            <RouteMap sport="løping" user={user} />
          )}
          {tab === "running" && runSubNav === "skade" && (() => {
            const cat = PROGRAM_TEMPLATES.find(c => c.category === "SKADEFOREBYGGING – LØPING");
            return (
              <>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",letterSpacing:"2px",color:"var(--muted)",textTransform:"uppercase",marginBottom:"16px"}}>
                  Programmer for å forebygge løpeskader. Start en økt for å logge den under styrke.
                </div>
                {(cat?.programs || []).map(tpl => {
                  const alreadyAdded = programs.some(p => p.name === tpl.name);
                  return (
                    <div key={tpl.name} className="program-card" style={{marginBottom:"12px"}}>
                      <div className="program-header">
                        <div className="program-name">{tpl.name}</div>
                        <div className="program-badge">{tpl.exercises.length} øvelser</div>
                      </div>
                      <div className="program-body">
                        {tpl.exercises.map((ex, i) => (
                          <div key={i} className="prog-ex-row">
                            <div className="prog-ex-name">{ex.name}</div>
                            <div className="prog-ex-detail">{ex.sets}×{ex.reps}{ex.name==="Planke"||ex.name==="Sidplanke"?"s":""}</div>
                          </div>
                        ))}
                      </div>
                      <div className="program-footer" style={{gap:"10px"}}>
                        <button className="btn-load" onClick={() => { setSection("styrke"); loadProgram(tpl); }}>▶ START ØKT</button>
                        {alreadyAdded ? (
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"#4caf50",letterSpacing:"1px"}}>✓ I Mine programmer</span>
                        ) : (
                          <button className="btn-ghost" style={{fontSize:".75rem",padding:"9px 14px"}} onClick={async () => {
                            const exs = tpl.exercises.map(e => ({...e, id: Date.now() + Math.random()}));
                            const { data } = await supabase.from("programs").insert({ user_id: user.id, name: tpl.name, exercises: exs }).select().single();
                            if (data) setPrograms(prev => [data, ...prev]);
                          }}>+ Legg til</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
          {tab === "running" && runSubNav === "stats" && (() => {
            const totalKm = runs.reduce((s,r) => s + parseFloat(r.distance), 0);
            const totalDuration = runs.reduce((s,r) => s + r.duration, 0);
            const avgPace = runs.length ? calcPace(totalKm, totalDuration) : null;
            const longestRun = runs.length ? Math.max(...runs.map(r => parseFloat(r.distance))) : 0;

            const now = new Date();
            const monday = new Date(now);
            monday.setDate(now.getDate() - ((now.getDay()+6)%7));
            monday.setHours(0,0,0,0);
            const weekRuns = runs.filter(r => new Date(r.date_key) >= monday);
            const weekKm = weekRuns.reduce((s,r) => s + parseFloat(r.distance), 0);
            const weekDuration = weekRuns.reduce((s,r) => s + r.duration, 0);

            const monthKey = now.toISOString().slice(0,7);
            const monthRuns = runs.filter(r => r.date_key.startsWith(monthKey));
            const monthKm = monthRuns.reduce((s,r) => s + parseFloat(r.distance), 0);

            const weeklyData = (() => {
              const weeks = {};
              runs.forEach(r => {
                const d = new Date(r.date_key);
                const mon = new Date(d);
                mon.setDate(d.getDate() - ((d.getDay()+6)%7));
                const key = mon.toISOString().slice(5,10);
                weeks[key] = (weeks[key]||0) + parseFloat(r.distance);
              });
              return Object.entries(weeks).sort((a,b)=>a[0]>b[0]?1:-1).slice(-10).map(([date,km])=>({date, km: Math.round(km*10)/10}));
            })();

            const monthlyData = (() => {
              const months = {};
              runs.forEach(r => {
                const key = r.date_key.slice(0,7);
                months[key] = (months[key]||0) + parseFloat(r.distance);
              });
              return Object.entries(months).sort((a,b)=>a[0]>b[0]?1:-1).slice(-6).map(([date,km])=>({date: date.slice(5), km: Math.round(km*10)/10}));
            })();

            const prDistances = [5, 10, 21.1, 42.2];
            const prs = prDistances.map(dist => {
              const eligible = runs.filter(r => parseFloat(r.distance) >= 1);
              if (!eligible.length) return { dist, time: null };
              const best = eligible.reduce((b, r) => {
                const d = parseFloat(r.distance);
                const predicted = r.duration * Math.pow(dist / d, 1.06);
                const bDist = parseFloat(b.distance);
                const bPredicted = b.duration * Math.pow(dist / bDist, 1.06);
                return predicted < bPredicted ? r : b;
              });
              const d = parseFloat(best.distance);
              const predicted = Math.round(best.duration * Math.pow(dist / d, 1.06));
              return { dist, time: fmtDuration(predicted) };
            });

            const recentRuns = runs.slice(0, 5);

            return (
              <>
                <div className="strava-bar">
                  {stravaConnected ? (
                    <>
                      <span className="strava-status connected">● Strava tilkoblet</span>
                      <button className="btn-strava" onClick={syncStrava} disabled={stravaSyncing}>
                        {stravaSyncing ? "Synkroniserer..." : "↻ Synk fra Strava"}
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="strava-status">Ikke koblet til Strava</span>
                      <button className="btn-strava" onClick={connectStrava}>Koble til Strava</button>
                    </>
                  )}
                  {stravaMsg && <span className={`strava-msg${stravaMsg.includes("Feil") ? " err" : ""}`}>{stravaMsg}</span>}
                </div>

                {runs.length === 0 ? (
                  <div className="empty">synk fra Strava for å se statistikk</div>
                ) : (
                  <>
                    {/* Totalt */}
                    <div className="graph-title" style={{marginBottom:"10px"}}>TOTALT</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"24px"}}>
                      <div className="dash-card" style={{padding:"18px 16px"}}>
                        <div className="dash-num accent">{Math.round(totalKm*10)/10}</div>
                        <div className="dash-label">Kilometer</div>
                      </div>
                      <div className="dash-card" style={{padding:"18px 16px"}}>
                        <div className="dash-num accent">{runs.length}</div>
                        <div className="dash-label">Løpeturer</div>
                      </div>
                      <div className="dash-card" style={{padding:"18px 16px"}}>
                        <div className="dash-num accent">{avgPace||"–"}</div>
                        <div className="dash-label">Snitt tempo (min/km)</div>
                      </div>
                      <div className="dash-card" style={{padding:"18px 16px"}}>
                        <div className="dash-num accent">{Math.round(longestRun*10)/10}</div>
                        <div className="dash-label">Lengste tur (km)</div>
                      </div>
                    </div>

                    {/* Denne uken */}
                    <div className="graph-title" style={{marginBottom:"10px"}}>DENNE UKEN</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"24px"}}>
                      <div className="stat-card"><div className="stat-val">{Math.round(weekKm*10)/10}</div><div className="stat-label">Km</div></div>
                      <div className="stat-card"><div className="stat-val">{weekRuns.length}</div><div className="stat-label">Turer</div></div>
                      <div className="stat-card"><div className="stat-val">{weekDuration > 0 ? fmtDuration(weekDuration) : "–"}</div><div className="stat-label">Tid</div></div>
                    </div>

                    {/* Denne måneden */}
                    <div className="graph-title" style={{marginBottom:"10px"}}>DENNE MÅNEDEN</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"28px"}}>
                      <div className="stat-card"><div className="stat-val">{Math.round(monthKm*10)/10}</div><div className="stat-label">Km</div></div>
                      <div className="stat-card"><div className="stat-val">{monthRuns.length}</div><div className="stat-label">Turer</div></div>
                    </div>

                    {/* Ukentlig graf */}
                    <div className="graph-section">
                      <div className="graph-title">Km per uke</div>
                      <div className="graph-box">
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={weeklyData}>
                            <XAxis dataKey="date" tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} width={30} />
                            <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text)",fontFamily:"DM Mono",fontSize:"0.75rem"}} formatter={v=>[`${v} km`,"Distanse"]} />
                            <Bar dataKey="km" fill="#F97316" radius={[2,2,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Månedlig graf */}
                    <div className="graph-section">
                      <div className="graph-title">Km per måned</div>
                      <div className="graph-box">
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={monthlyData}>
                            <XAxis dataKey="date" tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} width={30} />
                            <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text)",fontFamily:"DM Mono",fontSize:"0.75rem"}} formatter={v=>[`${v} km`,"Distanse"]} />
                            <Bar dataKey="km" fill="#F97316" radius={[2,2,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Siste turer */}
                    <div className="graph-title" style={{marginBottom:"12px"}}>SISTE TURER</div>
                    {recentRuns.map(run => (
                      <div key={run.id} className="run-entry">
                        <div>
                          <div className="run-dist">{parseFloat(run.distance).toFixed(1)}</div>
                          <div className="run-dist-unit">km</div>
                        </div>
                        <div className="run-meta">
                          <div className="run-meta-date">{run.notes || run.type}</div>
                          <div className="run-meta-detail">{run.date_key} · {fmtDuration(run.duration)} · {calcPace(parseFloat(run.distance), run.duration)} min/km</div>
                        </div>
                      </div>
                    ))}

                    {/* PR-tider */}
                    <div className="graph-title" style={{marginTop:"24px",marginBottom:"12px"}}>ESTIMERTE PR-TIDER</div>
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

          {/* ── SYKKEL ── */}
          {tab === "cycling" && (
            <div className="subnav" style={{marginBottom:"24px"}}>
              <button className={`subnav-btn${cycleSubNav==="stats"?" active":""}`} onClick={() => setCycleSubNav("stats")}>Statistikk</button>
              <button className={`subnav-btn${cycleSubNav==="plan"?" active":""}`} onClick={() => setCycleSubNav("plan")}>Planlegg tur</button>
              <button className={`subnav-btn${cycleSubNav==="skade"?" active":""}`} onClick={() => setCycleSubNav("skade")}>Skadeforebygging</button>
            </div>
          )}
          {tab === "cycling" && cycleSubNav === "plan" && (
            <RouteMap sport="sykkel" user={user} />
          )}
          {tab === "cycling" && cycleSubNav === "skade" && (() => {
            const cat = PROGRAM_TEMPLATES.find(c => c.category === "SKADEFOREBYGGING – SYKKEL");
            return (
              <>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",letterSpacing:"2px",color:"var(--muted)",textTransform:"uppercase",marginBottom:"16px"}}>
                  Programmer for å forebygge sykkelskader. Start en økt for å logge den under styrke.
                </div>
                {(cat?.programs || []).map(tpl => {
                  const alreadyAdded = programs.some(p => p.name === tpl.name);
                  return (
                    <div key={tpl.name} className="program-card" style={{marginBottom:"12px"}}>
                      <div className="program-header">
                        <div className="program-name">{tpl.name}</div>
                        <div className="program-badge">{tpl.exercises.length} øvelser</div>
                      </div>
                      <div className="program-body">
                        {tpl.exercises.map((ex, i) => (
                          <div key={i} className="prog-ex-row">
                            <div className="prog-ex-name">{ex.name}</div>
                            <div className="prog-ex-detail">{ex.sets}×{ex.reps}{ex.name==="Planke"||ex.name==="Sidplanke"?"s":""}</div>
                          </div>
                        ))}
                      </div>
                      <div className="program-footer" style={{gap:"10px"}}>
                        <button className="btn-load" onClick={() => { setSection("styrke"); loadProgram(tpl); }}>▶ START ØKT</button>
                        {alreadyAdded ? (
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"#4caf50",letterSpacing:"1px"}}>✓ I Mine programmer</span>
                        ) : (
                          <button className="btn-ghost" style={{fontSize:".75rem",padding:"9px 14px"}} onClick={async () => {
                            const exs = tpl.exercises.map(e => ({...e, id: Date.now() + Math.random()}));
                            const { data } = await supabase.from("programs").insert({ user_id: user.id, name: tpl.name, exercises: exs }).select().single();
                            if (data) setPrograms(prev => [data, ...prev]);
                          }}>+ Legg til</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
          {tab === "cycling" && cycleSubNav === "stats" && (() => {
            const totalKm = rides.reduce((s,r) => s + parseFloat(r.distance), 0);
            const totalDuration = rides.reduce((s,r) => s + r.duration, 0);
            const avgSpeed = rides.length ? calcSpeed(totalKm, totalDuration) : null;
            const longestRide = rides.length ? Math.max(...rides.map(r => parseFloat(r.distance))) : 0;

            const now = new Date();
            const monday = new Date(now);
            monday.setDate(now.getDate() - ((now.getDay()+6)%7));
            monday.setHours(0,0,0,0);
            const weekRides = rides.filter(r => new Date(r.date_key) >= monday);
            const weekKm = weekRides.reduce((s,r) => s + parseFloat(r.distance), 0);
            const weekDuration = weekRides.reduce((s,r) => s + r.duration, 0);

            const monthKey = now.toISOString().slice(0,7);
            const monthRides = rides.filter(r => r.date_key.startsWith(monthKey));
            const monthKm = monthRides.reduce((s,r) => s + parseFloat(r.distance), 0);

            const weeklyData = (() => {
              const weeks = {};
              rides.forEach(r => {
                const d = new Date(r.date_key);
                const mon = new Date(d);
                mon.setDate(d.getDate() - ((d.getDay()+6)%7));
                const key = mon.toISOString().slice(5,10);
                weeks[key] = (weeks[key]||0) + parseFloat(r.distance);
              });
              return Object.entries(weeks).sort((a,b)=>a[0]>b[0]?1:-1).slice(-10).map(([date,km])=>({date, km: Math.round(km*10)/10}));
            })();

            const monthlyData = (() => {
              const months = {};
              rides.forEach(r => {
                const key = r.date_key.slice(0,7);
                months[key] = (months[key]||0) + parseFloat(r.distance);
              });
              return Object.entries(months).sort((a,b)=>a[0]>b[0]?1:-1).slice(-6).map(([date,km])=>({date: date.slice(5), km: Math.round(km*10)/10}));
            })();

            const prDistances = [20, 40, 100, 160];
            const prs = prDistances.map(dist => {
              const eligible = rides.filter(r => parseFloat(r.distance) >= 1);
              if (!eligible.length) return { dist, time: null };
              const best = eligible.reduce((b, r) => {
                const d = parseFloat(r.distance);
                const predicted = r.duration * Math.pow(dist / d, 1.02);
                const bDist = parseFloat(b.distance);
                const bPredicted = b.duration * Math.pow(dist / bDist, 1.02);
                return predicted < bPredicted ? r : b;
              });
              const d = parseFloat(best.distance);
              const predicted = Math.round(best.duration * Math.pow(dist / d, 1.02));
              return { dist, time: fmtDuration(predicted) };
            });

            const recentRides = rides.slice(0, 5);

            return (
              <>
                <div className="strava-bar">
                  {stravaConnected ? (
                    <>
                      <span className="strava-status connected">● Strava tilkoblet</span>
                      <button className="btn-strava" onClick={syncStravaCycling} disabled={cyclingSyncing}>
                        {cyclingSyncing ? "Synkroniserer..." : "↻ Synk fra Strava"}
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="strava-status">Ikke koblet til Strava</span>
                      <button className="btn-strava" onClick={connectStrava}>Koble til Strava</button>
                    </>
                  )}
                  {cyclingMsg && <span className={`strava-msg${cyclingMsg.includes("Feil") ? " err" : ""}`}>{cyclingMsg}</span>}
                </div>

                {rides.length === 0 ? (
                  <div className="empty">synk fra Strava for å se statistikk</div>
                ) : (
                  <>
                    <div className="graph-title" style={{marginBottom:"10px"}}>TOTALT</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"24px"}}>
                      <div className="dash-card" style={{padding:"18px 16px"}}>
                        <div className="dash-num accent">{Math.round(totalKm*10)/10}</div>
                        <div className="dash-label">Kilometer</div>
                      </div>
                      <div className="dash-card" style={{padding:"18px 16px"}}>
                        <div className="dash-num accent">{rides.length}</div>
                        <div className="dash-label">Turer</div>
                      </div>
                      <div className="dash-card" style={{padding:"18px 16px"}}>
                        <div className="dash-num accent">{avgSpeed||"–"}</div>
                        <div className="dash-label">Snitt fart (km/t)</div>
                      </div>
                      <div className="dash-card" style={{padding:"18px 16px"}}>
                        <div className="dash-num accent">{Math.round(longestRide*10)/10}</div>
                        <div className="dash-label">Lengste tur (km)</div>
                      </div>
                    </div>

                    <div className="graph-title" style={{marginBottom:"10px"}}>DENNE UKEN</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"24px"}}>
                      <div className="stat-card"><div className="stat-val">{Math.round(weekKm*10)/10}</div><div className="stat-label">Km</div></div>
                      <div className="stat-card"><div className="stat-val">{weekRides.length}</div><div className="stat-label">Turer</div></div>
                      <div className="stat-card"><div className="stat-val">{weekDuration > 0 ? fmtDuration(weekDuration) : "–"}</div><div className="stat-label">Tid</div></div>
                    </div>

                    <div className="graph-title" style={{marginBottom:"10px"}}>DENNE MÅNEDEN</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"28px"}}>
                      <div className="stat-card"><div className="stat-val">{Math.round(monthKm*10)/10}</div><div className="stat-label">Km</div></div>
                      <div className="stat-card"><div className="stat-val">{monthRides.length}</div><div className="stat-label">Turer</div></div>
                    </div>

                    <div className="graph-section">
                      <div className="graph-title">Km per uke</div>
                      <div className="graph-box">
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={weeklyData}>
                            <XAxis dataKey="date" tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} width={30} />
                            <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text)",fontFamily:"DM Mono",fontSize:"0.75rem"}} formatter={v=>[`${v} km`,"Distanse"]} />
                            <Bar dataKey="km" fill="#F97316" radius={[2,2,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="graph-section">
                      <div className="graph-title">Km per måned</div>
                      <div className="graph-box">
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={monthlyData}>
                            <XAxis dataKey="date" tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} width={30} />
                            <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text)",fontFamily:"DM Mono",fontSize:"0.75rem"}} formatter={v=>[`${v} km`,"Distanse"]} />
                            <Bar dataKey="km" fill="#F97316" radius={[2,2,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="graph-title" style={{marginBottom:"12px"}}>SISTE TURER</div>
                    {recentRides.map(ride => (
                      <div key={ride.id} className="run-entry">
                        <div>
                          <div className="run-dist">{parseFloat(ride.distance).toFixed(1)}</div>
                          <div className="run-dist-unit">km</div>
                        </div>
                        <div className="run-meta">
                          <div className="run-meta-date">{ride.notes || ride.type}</div>
                          <div className="run-meta-detail">{ride.date_key} · {fmtDuration(ride.duration)} · {calcSpeed(parseFloat(ride.distance), ride.duration)} km/t</div>
                        </div>
                      </div>
                    ))}

                    <div className="graph-title" style={{marginTop:"24px",marginBottom:"12px"}}>ESTIMERTE PR-TIDER</div>
                    <div className="run-pr-grid">
                      {prs.map(({dist, time}) => (
                        <div key={dist} className="run-pr-card">
                          <div className="run-pr-label">{dist} km</div>
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
              {/* Sub-nav depends on which sport section we're in */}
              {section === "styrke" && (
                <div className="subnav">
                  <button className={`subnav-btn${subNav==="history"?" active":""}`} onClick={() => setSubNav("history")}>Historikk</button>
                  <button className={`subnav-btn${subNav==="kalender"?" active":""}`} onClick={() => setSubNav("kalender")}>Kalender</button>
                  <button className={`subnav-btn${subNav==="pr"?" active":""}`} onClick={() => setSubNav("pr")}>PR</button>
                  <button className={`subnav-btn${subNav==="stats"?" active":""}`} onClick={() => setSubNav("stats")}>Statistikk</button>
                </div>
              )}
              {(section === "løping" || section === "sykkel") && (
                <div className="subnav">
                  <button className={`subnav-btn${subNav==="history"?" active":""}`} onClick={() => setSubNav("history")}>Historikk</button>
                  <button className={`subnav-btn${subNav==="kalender"?" active":""}`} onClick={() => setSubNav("kalender")}>Kalender</button>
                </div>
              )}

              {/* HISTORIKK – Styrke */}
              {subNav === "history" && section === "styrke" && (
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
                            {Array.isArray(ex.sets) ? (
                              <div className="hist-ex-sets">
                                {ex.sets.length} sett
                                {ex.sets.length > 0 && Math.max(...ex.sets.map(s => parseFloat(s.weight)||0)) > 0
                                  ? ` · maks ${Math.max(...ex.sets.map(s => parseFloat(s.weight)||0))} kg`
                                  : ""}
                              </div>
                            ) : (
                              <div className="hist-ex-sets">{ex.sets}×{ex.reps}{ex.weight ? ` @ ${ex.weight}kg` : ""}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* HISTORIKK – Løping */}
              {subNav === "history" && section === "løping" && (
                <>
                  {runs.length === 0 ? <div className="empty">ingen løpeturer ennå</div> : runs.map(run => (
                    <div key={run.id} className="run-entry">
                      <div>
                        <div className="run-dist">{parseFloat(run.distance).toFixed(1)}</div>
                        <div className="run-dist-unit">km</div>
                      </div>
                      <div className="run-meta">
                        <div className="run-meta-date">{run.notes || run.type}</div>
                        <div className="run-meta-detail">{run.date_key} · {fmtDuration(run.duration)} · {calcPace(parseFloat(run.distance), run.duration)} min/km</div>
                      </div>
                      <button className="btn-icon" onClick={() => deleteRun(run.id)}>🗑</button>
                    </div>
                  ))}
                </>
              )}

              {/* HISTORIKK – Sykkel */}
              {subNav === "history" && section === "sykkel" && (
                <>
                  {rides.length === 0 ? <div className="empty">ingen sykkelture ennå</div> : rides.map(ride => (
                    <div key={ride.id} className="run-entry">
                      <div>
                        <div className="run-dist">{parseFloat(ride.distance).toFixed(1)}</div>
                        <div className="run-dist-unit">km</div>
                      </div>
                      <div className="run-meta">
                        <div className="run-meta-date">{ride.notes || ride.type}</div>
                        <div className="run-meta-detail">{ride.date_key} · {fmtDuration(ride.duration)} · {calcSpeed(parseFloat(ride.distance), ride.duration)} km/t</div>
                      </div>
                      <button className="btn-icon" onClick={() => deleteRide(ride.id)}>🗑</button>
                    </div>
                  ))}
                </>
              )}

              {subNav === "kalender" && (() => {
                const year = calendarMonth.getFullYear();
                const month = calendarMonth.getMonth();
                const monthName = calendarMonth.toLocaleDateString("nb-NO", { month: "long", year: "numeric" });

                // Build day grid (Mon–Sun, 6 rows)
                const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const cells = [];
                for (let i = firstDow - 1; i >= 0; i--) {
                  cells.push({ date: new Date(year, month, -i), cur: false });
                }
                for (let d = 1; d <= daysInMonth; d++) {
                  cells.push({ date: new Date(year, month, d), cur: true });
                }
                while (cells.length < 42) {
                  cells.push({ date: new Date(year, month + 1, cells.length - daysInMonth - firstDow + 1), cur: false });
                }

                const fmtKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                const todayKey2 = fmtKey(new Date());

                // Activity map
                const actMap = {};
                history.forEach(s => { if (!actMap[s.date_key]) actMap[s.date_key] = []; actMap[s.date_key].push("styrke"); });
                runs.forEach(r => { if (!actMap[r.date_key]) actMap[r.date_key] = []; if (!actMap[r.date_key].includes("løping")) actMap[r.date_key].push("løping"); });
                rides.forEach(r => { if (!actMap[r.date_key]) actMap[r.date_key] = []; if (!actMap[r.date_key].includes("sykkel")) actMap[r.date_key].push("sykkel"); });

                const actColor = { styrke: "#F97316", løping: "#3b82f6", sykkel: "#4caf50" };
                const actLabel = { styrke: "Styrke", løping: "Løping", sykkel: "Sykkel" };

                // Details for selected day
                const selKey = selectedCalDay ? fmtKey(selectedCalDay) : null;
                const selSessions = selKey ? history.filter(s => s.date_key === selKey) : [];
                const selRuns = selKey ? runs.filter(r => r.date_key === selKey) : [];
                const selRides = selKey ? rides.filter(r => r.date_key === selKey) : [];

                return (
                  <>
                    <div className="cal-legend">
                      {Object.entries(actColor).map(([k, c]) => (
                        <div key={k} className="cal-legend-item">
                          <div className="cal-dot" style={{background:c}} />
                          {actLabel[k]}
                        </div>
                      ))}
                    </div>

                    <div className="cal-nav">
                      <button className="cal-nav-btn" onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}>‹</button>
                      <div className="cal-month-label">{monthName}</div>
                      <button className="cal-nav-btn" onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}>›</button>
                    </div>

                    <div className="cal-grid">
                      {["Man","Tir","Ons","Tor","Fre","Lør","Søn"].map(d => (
                        <div key={d} className="cal-dow">{d}</div>
                      ))}
                      {cells.map((cell, i) => {
                        const key = fmtKey(cell.date);
                        const acts = actMap[key] || [];
                        const isToday = key === todayKey2;
                        const isSel = key === selKey;
                        return (
                          <div key={i}
                            className={`cal-cell${acts.length ? " has-activity" : ""}${isToday ? " is-today" : ""}${isSel ? " selected" : ""}`}
                            onClick={() => setSelectedCalDay(isSel ? null : cell.date)}>
                            <div className={`cal-num${!cell.cur ? " other-month" : ""}`}>{cell.date.getDate()}</div>
                            {acts.length > 0 && (
                              <div className="cal-dots">
                                {acts.map(a => <div key={a} className="cal-dot" style={{background:actColor[a]}} />)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {selKey && (selSessions.length > 0 || selRuns.length > 0 || selRides.length > 0) && (
                      <div className="cal-detail">
                        <div className="cal-detail-date">
                          {selectedCalDay.toLocaleDateString("nb-NO", { weekday:"long", day:"numeric", month:"long" })}
                        </div>
                        {selSessions.map((s, i) => (
                          <div key={i} className="cal-activity-row">
                            <div className="cal-activity-dot" style={{background:"#F97316"}} />
                            <div style={{flex:1}}>
                              <span style={{fontWeight:500}}>Styrke</span>
                              {s.program_name && <span style={{fontFamily:"'DM Mono',monospace",fontSize:".7rem",color:"var(--muted)",marginLeft:"8px"}}>{s.program_name}</span>}
                            </div>
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:".7rem",color:"var(--muted)"}}>{s.exercises.length} øvelser · {totalVolume(s.exercises) > 0 ? `${totalVolume(s.exercises).toLocaleString("nb-NO")} kg` : ""}</div>
                          </div>
                        ))}
                        {selRuns.map((r, i) => (
                          <div key={i} className="cal-activity-row">
                            <div className="cal-activity-dot" style={{background:"#3b82f6"}} />
                            <div style={{flex:1}}><span style={{fontWeight:500}}>Løping</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:".7rem",color:"var(--muted)",marginLeft:"8px"}}>{r.notes || r.type}</span></div>
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:".7rem",color:"var(--muted)"}}>{parseFloat(r.distance).toFixed(1)} km · {fmtDuration(r.duration)}</div>
                          </div>
                        ))}
                        {selRides.map((r, i) => (
                          <div key={i} className="cal-activity-row">
                            <div className="cal-activity-dot" style={{background:"#4caf50"}} />
                            <div style={{flex:1}}><span style={{fontWeight:500}}>Sykkel</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:".7rem",color:"var(--muted)",marginLeft:"8px"}}>{r.notes || r.type}</span></div>
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:".7rem",color:"var(--muted)"}}>{parseFloat(r.distance).toFixed(1)} km · {fmtDuration(r.duration)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {selKey && selSessions.length === 0 && selRuns.length === 0 && selRides.length === 0 && (
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:".7rem",color:"var(--muted)",padding:"12px 0",letterSpacing:"1px"}}>Ingen aktivitet denne dagen.</div>
                    )}
                  </>
                );
              })()}

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
                              {est1RM[name] && est1RM[name] > (pr.weight || 0) && (
                                <div className="pr-detail" style={{color:"#F97316",marginTop:"4px"}}>Est. 1RM: {est1RM[name]} kg</div>
                              )}
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
          {/* ── UKESPLAN ── */}
          {tab === "plan" && (() => {
            const DAYS = ["Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag","Søndag"];
            const todayDow = (new Date().getDay() + 6) % 7;
            const ACT_COLOR = { styrke:"#F97316", løping:"#3b82f6", sykkel:"#4caf50", annet:"#a855f7" };
            const ACT_LABEL = { styrke:"Styrke", løping:"Løping", sykkel:"Sykkel", annet:"Annet" };

            function addPlanActivity(dayIdx) {
              const act = {type: planForm.type};
              if (planForm.type === "styrke") {
                const prog = programs.find(p => p.id === planForm.programId);
                act.programId = planForm.programId;
                act.programName = prog ? prog.name : planForm.notes || "Styrkeøkt";
              } else if (planForm.type === "løping" || planForm.type === "sykkel") {
                act.distance = planForm.distance;
                act.notes = planForm.notes;
              } else {
                act.notes = planForm.notes;
              }
              const cur = weeklyPlan[dayIdx]?.activities || [];
              savePlanDay(dayIdx, [...cur, act]);
              setEditingPlanDay(null);
              setPlanForm({type:"styrke", programId:"", distance:"", notes:""});
            }

            function removeActivity(dayIdx, actIdx) {
              const cur = weeklyPlan[dayIdx]?.activities || [];
              savePlanDay(dayIdx, cur.filter((_, i) => i !== actIdx));
            }

            return (
              <>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"10px"}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:"12px"}}>
                    <div className="section-title">UKE<span>SPLAN</span></div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"var(--muted)",letterSpacing:"1px"}}>
                      {new Date().toLocaleDateString("nb-NO",{day:"numeric",month:"long",year:"numeric"})}
                    </div>
                  </div>
                  <button
                    onClick={() => { setSection("styrke"); setTab("oversikt"); setSubNav("kalender"); }}
                    style={{display:"flex",alignItems:"center",gap:"6px",background:"none",border:"1px solid var(--border)",color:"var(--muted)",fontFamily:"'DM Mono',monospace",fontSize:".65rem",letterSpacing:"1px",padding:"7px 14px",cursor:"pointer",transition:"all .15s",textTransform:"uppercase"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#F97316";e.currentTarget.style.color="#F97316";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)";}}>
                    📅 Se kalender
                  </button>
                </div>

                <div className="plan-week">
                  {DAYS.map((dayName, dayIdx) => {
                    const isToday = dayIdx === todayDow;
                    const isEditing = editingPlanDay === dayIdx;
                    const acts = weeklyPlan[dayIdx]?.activities || [];

                    return (
                      <div key={dayIdx} className={`plan-day-card${isToday ? " is-today" : ""}`}>
                        {/* Day header */}
                        <div className="plan-day-header" onClick={() => setEditingPlanDay(isEditing ? null : dayIdx)}>
                          <div className="plan-day-name">{dayName}</div>
                          {isToday && <div className="plan-today-badge">I DAG</div>}
                          {acts.length === 0 && !isEditing && (
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--muted)",letterSpacing:"1px"}}>Hvile</div>
                          )}
                          <div style={{display:"flex",gap:"3px",marginLeft:"8px"}}>
                            {acts.map((a,i) => <div key={i} className="cal-dot" style={{background:ACT_COLOR[a.type]||"var(--muted)"}} />)}
                          </div>
                          <div style={{color:"var(--muted)",fontSize:".8rem",marginLeft:"4px"}}>{isEditing?"▲":"▼"}</div>
                        </div>

                        {/* Activities */}
                        {acts.length > 0 && (
                          <div className="plan-activity-list">
                            {acts.map((act, actIdx) => (
                              <div key={actIdx} className="plan-activity-row">
                                <div className="plan-activity-dot" style={{background:ACT_COLOR[act.type]||"var(--muted)"}} />
                                <div className="plan-activity-name">
                                  {act.type === "styrke" ? (act.programName || "Styrkeøkt") :
                                   act.type === "løping" ? `Løpetur${act.distance ? ` · ${act.distance} km` : ""}` :
                                   act.type === "sykkel" ? `Sykkeltur${act.distance ? ` · ${act.distance} km` : ""}` :
                                   act.notes || "Aktivitet"}
                                </div>
                                {isToday && act.type === "styrke" && act.programId && programs.find(p => p.id === act.programId) && (
                                  <button className="btn-load" style={{padding:"3px 10px",fontSize:".7rem"}}
                                    onClick={() => { setSection("styrke"); loadProgram(programs.find(p => p.id === act.programId)); }}>
                                    ▶
                                  </button>
                                )}
                                {isToday && act.type === "løping" && (
                                  <button className="btn-load" style={{padding:"3px 10px",fontSize:".7rem"}}
                                    onClick={() => { setSection("løping"); setTab("running"); }}>▶</button>
                                )}
                                {isToday && act.type === "sykkel" && (
                                  <button className="btn-load" style={{padding:"3px 10px",fontSize:".7rem"}}
                                    onClick={() => { setSection("sykkel"); setTab("cycling"); }}>▶</button>
                                )}
                                <button className="btn-remove" style={{width:"22px",height:"22px"}}
                                  onClick={() => removeActivity(dayIdx, actIdx)}>×</button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Edit / add form */}
                        {isEditing && (
                          <div className="plan-add-form">
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",letterSpacing:"2px",color:"var(--muted)",textTransform:"uppercase",marginBottom:"4px"}}>Legg til aktivitet</div>
                            <div className="plan-type-row">
                              {["styrke","løping","sykkel","annet"].map(t => (
                                <button key={t} className={`plan-type-btn${planForm.type===t?" active":""}`}
                                  onClick={() => setPlanForm(f => ({...f, type:t}))}>
                                  {ACT_LABEL[t]}
                                </button>
                              ))}
                            </div>

                            {planForm.type === "styrke" && (
                              <div className="field">
                                <label>Program</label>
                                <select value={planForm.programId} onChange={e => setPlanForm(f => ({...f, programId:e.target.value}))}>
                                  <option value="">— Velg program —</option>
                                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                              </div>
                            )}
                            {(planForm.type === "løping" || planForm.type === "sykkel") && (
                              <div className="field">
                                <label>Distansemål (km)</label>
                                <input type="number" step="0.5" value={planForm.distance}
                                  onChange={e => setPlanForm(f => ({...f, distance:e.target.value}))} placeholder="5" />
                              </div>
                            )}
                            {planForm.type === "annet" && (
                              <div className="field">
                                <label>Beskriv aktiviteten</label>
                                <input value={planForm.notes} onChange={e => setPlanForm(f => ({...f, notes:e.target.value}))} placeholder="f.eks. Yoga, svømming..." />
                              </div>
                            )}

                            <div style={{display:"flex",gap:"8px"}}>
                              <button className="btn-orange" style={{flex:1}} onClick={() => addPlanActivity(dayIdx)}>+ LEGG TIL</button>
                              <button className="btn-ghost" onClick={() => setEditingPlanDay(null)}>avbryt</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{marginTop:"16px",fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--muted)",letterSpacing:"1px"}}>
                  Planen lagres lokalt på denne enheten. Klikk en dag for å redigere.
                </div>
              </>
            );
          })()}

          {/* ── MÅL ── */}
          {tab === "goals" && (() => {
            const GOAL_TYPES = [
              { id:"styrke",     label:"Styrke 1RM",        icon:"🏋️" },
              { id:"løping_km",  label:"Løping km",         icon:"🏃" },
              { id:"sykkel_km",  label:"Sykkel km",         icon:"🚴" },
              { id:"okter",      label:"Ukentlige økter",   icon:"📅" },
              { id:"vekt",       label:"Kroppsvekt",        icon:"⚖️" },
              { id:"egendefinert", label:"Egendefinert",    icon:"✏️" },
            ];
            const UNIT_LABELS = { styrke:"kg", løping_km:"km", sykkel_km:"km", okter:"økter", vekt:"kg", egendefinert:"" };
            const TYPE_CURRENT_LABEL = {
              styrke: "Nåværende est. 1RM",
              løping_km: "Km denne måneden",
              sykkel_km: "Km denne måneden",
              okter: "Økter siste 7 dager",
              vekt: "Nåværende vekt",
              egendefinert: "Fremgang",
            };

            function isOverdue(goal) { return goal.deadline && goal.deadline < todayKey() && !goal.achieved; }
            function daysLeft(deadline) { return Math.ceil((new Date(deadline) - new Date(todayKey())) / (1000*60*60*24)); }

            const monthKey = new Date().toISOString().slice(0,7);
            const curRunKm = Math.round(runs.filter(r=>r.date_key.startsWith(monthKey)).reduce((s,r)=>s+parseFloat(r.distance),0)*10)/10;
            const curRideKm = Math.round(rides.filter(r=>r.date_key.startsWith(monthKey)).reduce((s,r)=>s+parseFloat(r.distance),0)*10)/10;

            return (
              <>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"10px"}}>
                  <div className="section-title">MINE <span>MÅL</span></div>
                  {!showGoalForm && (
                    <button className="btn-orange" onClick={() => setShowGoalForm(true)}>+ NY MÅL</button>
                  )}
                </div>

                {/* ── FORM ── */}
                {showGoalForm && (
                  <div className="goal-form">
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:"12px"}}>NY MÅL</div>

                    <div className="goal-type-grid">
                      {GOAL_TYPES.map(gt => (
                        <button key={gt.id}
                          className={`goal-type-btn${goalForm.type===gt.id?" active":""}`}
                          onClick={() => {
                            const auto = gt.id==="styrke" ? `${goalForm.exercise} 1RM` :
                              gt.id==="løping_km" ? "Månedlig løpedistanse" :
                              gt.id==="sykkel_km" ? "Månedlig syklingsdistanse" :
                              gt.id==="okter" ? "Ukentlige treningsøkter" :
                              gt.id==="vekt" ? "Kroppsvektmål" : "";
                            setGoalForm(f => ({...f, type:gt.id, unit:UNIT_LABELS[gt.id]||"", title: f.title || auto}));
                          }}>
                          {gt.icon}<br />{gt.label}
                        </button>
                      ))}
                    </div>

                    {/* Styrke: exercise picker */}
                    {goalForm.type === "styrke" && (
                      <>
                        <div className="form-2col" style={{marginBottom:"8px"}}>
                          <div className="field">
                            <label>Muskelgruppe</label>
                            <select value={goalForm.exerciseGroup}
                              onChange={e => setGoalForm(f => ({...f, exerciseGroup:e.target.value, exercise:EXERCISES_BY_GROUP[e.target.value][0]}))}>
                              {Object.keys(EXERCISES_BY_GROUP).map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </div>
                          <div className="field">
                            <label>Øvelse</label>
                            <select value={goalForm.exercise}
                              onChange={e => setGoalForm(f => ({...f, exercise:e.target.value}))}>
                              {EXERCISES_BY_GROUP[goalForm.exerciseGroup].map(ex => <option key={ex} value={ex}>{ex}</option>)}
                            </select>
                          </div>
                        </div>
                        {est1RM[goalForm.exercise] > 0 && (
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"#F97316",letterSpacing:"1px",marginBottom:"10px"}}>
                            Nåværende est. 1RM: {est1RM[goalForm.exercise]} kg
                          </div>
                        )}
                      </>
                    )}

                    {/* Løping hint */}
                    {goalForm.type === "løping_km" && curRunKm > 0 && (
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"#3b82f6",letterSpacing:"1px",marginBottom:"10px"}}>
                        Denne måneden: {curRunKm} km løpt
                      </div>
                    )}

                    {/* Sykkel hint */}
                    {goalForm.type === "sykkel_km" && curRideKm > 0 && (
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"#4caf50",letterSpacing:"1px",marginBottom:"10px"}}>
                        Denne måneden: {curRideKm} km syklet
                      </div>
                    )}

                    {/* Egendefinert: unit + startvalue */}
                    {goalForm.type === "egendefinert" && (
                      <div className="form-2col" style={{marginBottom:"8px"}}>
                        <div className="field">
                          <label>Enhet</label>
                          <input value={goalForm.unit} onChange={e => setGoalForm(f => ({...f, unit:e.target.value}))} placeholder="f.eks. km, reps, dager..." />
                        </div>
                        <div className="field">
                          <label>Startverdi</label>
                          <input type="number" step="any" value={goalForm.current} onChange={e => setGoalForm(f => ({...f, current:e.target.value}))} placeholder="0" />
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <div className="field" style={{marginBottom:"8px"}}>
                      <label>Navn på mål</label>
                      <input value={goalForm.title}
                        onChange={e => setGoalForm(f => ({...f, title:e.target.value}))}
                        placeholder={
                          goalForm.type==="styrke" ? `f.eks. ${goalForm.exercise} 100 kg` :
                          goalForm.type==="løping_km" ? "f.eks. 100 km i måneden" :
                          goalForm.type==="sykkel_km" ? "f.eks. 200 km i måneden" :
                          goalForm.type==="okter" ? "f.eks. 4 økter per uke" :
                          goalForm.type==="vekt" ? "f.eks. Ned til 80 kg" :
                          "Beskriv målet ditt..."
                        } />
                    </div>

                    {/* Target + deadline */}
                    <div className="form-2col" style={{marginBottom:"8px"}}>
                      <div className="field">
                        <label>Mål ({goalForm.type==="egendefinert" ? (goalForm.unit||"verdi") : UNIT_LABELS[goalForm.type]})</label>
                        <input type="number" step="any" value={goalForm.target}
                          onChange={e => setGoalForm(f => ({...f, target:e.target.value}))}
                          placeholder={goalForm.type==="styrke"?"100":goalForm.type==="okter"?"4":"50"} />
                      </div>
                      <div className="field">
                        <label>Frist (valgfritt)</label>
                        <input type="date" value={goalForm.deadline} onChange={e => setGoalForm(f => ({...f, deadline:e.target.value}))} />
                      </div>
                    </div>

                    <div className="save-row" style={{marginTop:"16px"}}>
                      <button className="btn-orange" onClick={addGoal} disabled={!goalForm.title.trim()||!goalForm.target}>LAGRE MÅL</button>
                      <button className="btn-ghost" onClick={() => { setShowGoalForm(false); setGoalForm({type:"styrke",title:"",exercise:"Benkpress",exerciseGroup:"Bryst",target:"",deadline:"",unit:"kg",current:""}); }}>avbryt</button>
                    </div>
                  </div>
                )}

                {/* ── GOAL CARDS ── */}
                {goals.length === 0 && !showGoalForm ? (
                  <div className="empty" style={{paddingTop:"40px"}}>
                    ingen mål satt ennå
                    <div style={{marginTop:"16px"}}>
                      <button className="btn-outline" style={{fontSize:".8rem",padding:"8px 16px"}} onClick={() => setShowGoalForm(true)}>Sett ditt første mål →</button>
                    </div>
                  </div>
                ) : goals.map(goal => {
                  const current = getGoalCurrent(goal);
                  const pct = goal.target > 0
                    ? goal.type==="vekt"
                      // for body weight, direction depends on whether target < starting weight; show 100% when reached
                      ? Math.min(100, Math.round(Math.abs((current - goal.target)) <= 0 ? 100 : Math.max(0, (1 - Math.abs(current - goal.target) / goal.target) * 100)))
                      : Math.min(100, Math.round((current / goal.target) * 100))
                    : 0;
                  const isAchieved = goal.achieved || (goal.type !== "vekt" && pct >= 100);
                  const unit = goal.type==="egendefinert" ? (goal.unit||"") : UNIT_LABELS[goal.type]||"";
                  const progressColor = isAchieved ? "#4caf50" : pct>66 ? "#F97316" : pct>33 ? "#a855f7" : "#3b82f6";

                  let deadlineEl = null;
                  if (goal.deadline && !isAchieved) {
                    const dl = daysLeft(goal.deadline);
                    if (dl < 0) deadlineEl = <span style={{color:"#e53e3e"}}>Forfalt for {-dl} dag{-dl!==1?"er":""} siden</span>;
                    else if (dl === 0) deadlineEl = <span style={{color:"#F97316"}}>Frist i dag!</span>;
                    else deadlineEl = <span>{dl} dag{dl!==1?"er":""} igjen · {goal.deadline}</span>;
                  } else if (goal.deadline && isAchieved) {
                    deadlineEl = <span>{goal.deadline}</span>;
                  }

                  return (
                    <div key={goal.id} className={`goal-card${isAchieved?" achieved":""}`}>
                      <div className="goal-card-header">
                        <div className="goal-card-title">{goal.title}</div>
                        {isAchieved && <div className="goal-achieved-badge">✓ Oppnådd</div>}
                        <button className="btn-icon" onClick={() => deleteGoal(goal.id)} title="Slett mål" style={{flexShrink:0}}>🗑</button>
                      </div>

                      {/* Progress numbers */}
                      <div style={{display:"flex",alignItems:"baseline",gap:"8px",marginTop:"8px"}}>
                        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2rem",color:progressColor,lineHeight:1}}>{current}</span>
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:".7rem",color:"var(--muted)"}}>/ {goal.target} {unit}</span>
                        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.2rem",color:progressColor,marginLeft:"auto"}}>{pct}%</span>
                      </div>

                      <div className="goal-progress-bar">
                        <div className="goal-progress-fill" style={{width:`${pct}%`,background:progressColor}} />
                      </div>

                      <div className="goal-meta">
                        <span>{TYPE_CURRENT_LABEL[goal.type]||""}</span>
                        {deadlineEl && <span>{deadlineEl}</span>}
                        <span style={{color:"var(--muted2)"}}>Startet {goal.createdAt}</span>
                      </div>

                      {/* Egendefinert: manual progress input */}
                      {goal.type==="egendefinert" && !isAchieved && (
                        <div style={{display:"flex",gap:"8px",marginTop:"10px",alignItems:"center",flexWrap:"wrap"}}>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--muted)",letterSpacing:"1px"}}>Oppdater fremgang:</div>
                          <input type="number" step="any"
                            defaultValue={goal.current||0}
                            onBlur={e => updateGoalCurrent(goal.id, e.target.value)}
                            style={{width:"90px",background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--text)",fontFamily:"'DM Mono',monospace",fontSize:".8rem",padding:"5px 8px",outline:"none"}} />
                          {unit && <span style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"var(--muted)"}}>{unit}</span>}
                          <button onClick={() => toggleGoalAchieved(goal.id)}
                            style={{marginLeft:"auto",background:"none",border:"1px solid #4caf50",color:"#4caf50",fontFamily:"'DM Mono',monospace",fontSize:".65rem",letterSpacing:"1px",padding:"5px 12px",cursor:"pointer",transition:"all .15s"}}>
                            Merk oppnådd ✓
                          </button>
                        </div>
                      )}

                      {/* Mark achieved button when close */}
                      {goal.type!=="egendefinert" && !isAchieved && pct >= 85 && (
                        <div style={{marginTop:"8px"}}>
                          <button onClick={() => toggleGoalAchieved(goal.id)}
                            style={{background:"none",border:"1px solid #4caf50",color:"#4caf50",fontFamily:"'DM Mono',monospace",fontSize:".65rem",letterSpacing:"1px",padding:"5px 12px",cursor:"pointer",transition:"all .15s"}}>
                            Merk som oppnådd ✓
                          </button>
                        </div>
                      )}

                      {/* Undo achieved */}
                      {goal.achieved && (
                        <div style={{marginTop:"6px"}}>
                          <button onClick={() => toggleGoalAchieved(goal.id)}
                            style={{background:"none",border:"1px solid var(--border)",color:"var(--muted)",fontFamily:"'DM Mono',monospace",fontSize:".6rem",letterSpacing:"1px",padding:"4px 10px",cursor:"pointer"}}>
                            Angre
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            );
          })()}

          {/* ── PROFIL ── */}
          {tab === "profile" && (
            <>
              <div className="profile-top">
                <div className="profile-avatar" onClick={() => avatarInputRef.current?.click()} style={{cursor:"pointer"}}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" />
                    : (profile.username ? profile.username[0].toUpperCase() : user.email[0].toUpperCase())}
                  <div className="profile-avatar-upload">Bytt bilde</div>
                  <input ref={avatarInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={uploadAvatar} />
                </div>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.6rem",letterSpacing:"2px"}}>
                    {profile.username || "Ingen navn"}
                  </div>
                  <div className="profile-email">{user.email}</div>
                </div>
              </div>

              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="profile-stat-val">{history.length}</div>
                  <div className="profile-stat-label">Styrkeøkter</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-val">{runs.length}</div>
                  <div className="profile-stat-label">Løpeturer</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-val">{rides.length}</div>
                  <div className="profile-stat-label">Sykkelture</div>
                </div>
              </div>

              <div className="profile-grid">
                <div className="field">
                  <label>Brukernavn</label>
                  <input value={profile.username} onChange={e => setProfile(p => ({...p, username: e.target.value}))} placeholder="Ditt navn" />
                </div>
                <div className="field">
                  <label>Alder</label>
                  <input type="number" value={profile.age} onChange={e => setProfile(p => ({...p, age: e.target.value}))} placeholder="25" />
                </div>
                <div className="field">
                  <label>Vekt (kg)</label>
                  <input type="number" step="0.1" value={profile.weight} onChange={e => setProfile(p => ({...p, weight: e.target.value}))} placeholder="75" />
                </div>
                <div className="field">
                  <label>Høyde (cm)</label>
                  <input type="number" value={profile.height} onChange={e => setProfile(p => ({...p, height: e.target.value}))} placeholder="180" />
                </div>
              </div>

              <div style={{marginBottom:"20px"}}>
                <div className="settings-label" style={{marginBottom:"10px"}}>Treningsmål</div>
                <div className="goal-grid">
                  {["Bygge muskler","Gå ned i vekt","Løpe maraton","Bedre kondis","Øke styrke","Bli mer fleksibel"].map(g => (
                    <button key={g} className={`goal-btn${(profile.goals||[]).includes(g)?" active":""}`} onClick={() => toggleGoal(g)}>{g}</button>
                  ))}
                </div>
              </div>

              <div className="save-row" style={{marginBottom:"32px"}}>
                <button className="btn-orange" onClick={saveProfile}>LAGRE PROFIL</button>
                {profileSaved && <span className="save-msg">✓ LAGRET</span>}
              </div>

              <hr className="divider" />

              <div style={{marginBottom:"8px"}}>
                <div className="graph-title" style={{marginBottom:"12px"}}>LOGG VEKT</div>
                <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
                  <div className="field" style={{flex:1,margin:0}}>
                    <input type="number" step="0.1" value={newWeight} onChange={e => setNewWeight(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && logWeight()} placeholder="Dagens vekt (kg)" />
                  </div>
                  <button className="btn-orange" onClick={logWeight}>LOGG</button>
                </div>
                {weightLogs.length > 1 && (
                  <div className="graph-box" style={{marginBottom:"16px"}}>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={weightLogs.slice(-20).map(l => ({date: l.logged_at?.slice(5), kg: l.weight}))}>
                        <XAxis dataKey="date" tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fill:"var(--muted)",fontSize:10,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} width={35} domain={["auto","auto"]} />
                        <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text)",fontFamily:"DM Mono",fontSize:"0.75rem"}} formatter={v=>[`${v} kg`,"Vekt"]} />
                        <Line type="monotone" dataKey="kg" stroke="#F97316" strokeWidth={2} dot={{fill:"#F97316",r:3}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <hr className="divider" />
              <button className="btn-ghost" style={{width:"100%",marginTop:"8px"}} onClick={() => supabase.auth.signOut()}>Logg ut</button>
            </>
          )}

        </div>
      </div>
    </>
  );
}
