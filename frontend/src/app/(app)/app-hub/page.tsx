"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  SkipForward,
  Volume2,
  Calendar,
  FileText,
  Tv,
  Code,
  Music,
  ExternalLink,
  Plus,
  Settings,
  Sparkles,
  RefreshCw,
  Send,
  Loader2,
  ShieldCheck,
  Disc3,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { modulesApi } from "@/lib/api/modules";
import { useUIStore } from "@/store/useUIStore";
import type { AppModule } from "@/types";

export default function AppHubPage() {
  const pushToast = useUIStore((s) => s.pushToast);

  const [modules, setModules] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedModule, setSelectedModule] = useState<AppModule | null>(null);

  // Active module interactive states
  // 1. Spotify
  const [spotifyTrack, setSpotifyTrack] = useState("Cyberpunk 2077: Rebel Path");
  const [spotifyArtist, setSpotifyArtist] = useState("P.T. Adamczyk");
  const [isSpotifyPlaying, setIsSpotifyPlaying] = useState(false);
  const [spotifyVolume, setSpotifyVolume] = useState(75);

  // 2. Google Calendar
  const [calendarEvents, setCalendarEvents] = useState<Array<{ id: string; title: string; time: string; location: string }>>([
    { id: "1", title: "ASCEND Deep Study Session", time: "14:00 - 16:00", location: "Home Office" },
    { id: "2", title: "Gym & Conditioning Workout", time: "18:00 - 19:30", location: "Athletic Club" },
    { id: "3", title: "ARC Daily Quest Review", time: "21:30 - 22:00", location: "ASCEND OS" },
  ]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");

  // 3. Notion
  const [notionPages, setNotionPages] = useState<Array<{ id: string; title: string; last_edited: string; tags: string[] }>>([
    { id: "1", title: "Semester Study Blueprint 2026", last_edited: "Today at 10:30 AM", tags: ["Exam", "Study"] },
    { id: "2", title: "12 Core Stats & Training Methodology", last_edited: "Yesterday", tags: ["ASCEND", "Fitness"] },
    { id: "3", title: "Quarterly Objectives & Milestones", last_edited: "Oct 28", tags: ["Goals"] },
  ]);
  const [newNoteTitle, setNewNoteTitle] = useState("");

  // 4. YouTube Focus
  const [currentStreamId, setCurrentStreamId] = useState("jfKfPfyJRdk");

  // 5. GitHub Dev
  const [githubRepos, setGithubRepos] = useState<Array<{ name: string; stars: number; language: string; visibility: string }>>([
    { name: "ascend-app", stars: 128, language: "TypeScript / Python", visibility: "Private" },
    { name: "jarvis-core", stars: 64, language: "Python", visibility: "Private" },
    { name: "hunter-neural-net", stars: 42, language: "Rust", visibility: "Public" },
  ]);

  // Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configIdentifier, setConfigIdentifier] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqAppName, setReqAppName] = useState("");
  const [reqAppDesc, setReqAppDesc] = useState("");
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  async function loadRegistry() {
    try {
      setLoading(true);
      const data = await modulesApi.getRegistry();
      setModules(data);
      if (data.length > 0 && !selectedModule) {
        setSelectedModule(data[0] as AppModule);
      }
    } catch {
      pushToast({ variant: "danger", title: "Could not load integrations registry" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegistry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggle(mod: AppModule) {
    try {
      const nextState = !mod.is_enabled;
      await modulesApi.toggleModule(mod.id, nextState);
      setModules((prev) =>
        prev.map((m) => (m.id === mod.id ? { ...m, is_enabled: nextState } : m))
      );
      if (selectedModule && selectedModule.id === mod.id) {
        setSelectedModule({ ...selectedModule, is_enabled: nextState });
      }
      pushToast({
        variant: nextState ? "success" : "info",
        title: `${mod.name} ${nextState ? "Enabled" : "Disabled"}`,
      });
    } catch {
      pushToast({ variant: "danger", title: "Failed to toggle module" });
    }
  }

  async function handleConnect(mod: AppModule) {
    try {
      await modulesApi.configureModule(mod.id, {
        is_connected: true,
        account_identifier: configIdentifier.trim() || `${mod.id}_user_account`,
      });
      setModules((prev) =>
        prev.map((m) =>
          m.id === mod.id
            ? { ...m, is_connected: true, account_identifier: configIdentifier || "Connected Account" }
            : m
        )
      );
      if (selectedModule && selectedModule.id === mod.id) {
        setSelectedModule({
          ...selectedModule,
          is_connected: true,
          account_identifier: configIdentifier || "Connected Account",
        });
      }
      setShowConfigModal(false);
      setConfigIdentifier("");
      pushToast({ variant: "success", title: `${mod.name} Account Connected` });
    } catch {
      pushToast({ variant: "danger", title: "Could not connect module account" });
    }
  }

  async function handleDisconnect(mod: AppModule) {
    try {
      await modulesApi.configureModule(mod.id, { is_connected: false, account_identifier: "" });
      setModules((prev) =>
        prev.map((m) => (m.id === mod.id ? { ...m, is_connected: false, account_identifier: null } : m))
      );
      if (selectedModule && selectedModule.id === mod.id) {
        setSelectedModule({ ...selectedModule, is_connected: false, account_identifier: null });
      }
      pushToast({ variant: "info", title: `${mod.name} Disconnected` });
    } catch {
      pushToast({ variant: "danger", title: "Could not disconnect module" });
    }
  }

  // --- Spotify Actions ---
  async function handleSpotifyPlay() {
    setIsSpotifyPlaying(!isSpotifyPlaying);
    await modulesApi.executeAction("spotify", isSpotifyPlaying ? "pause" : "play", { track: spotifyTrack });
  }

  async function handleSpotifyNext() {
    const res = await modulesApi.executeAction("spotify", "next");
    if (res?.track) {
      setSpotifyTrack(res.track);
      setSpotifyArtist(res.artist || "Ascend Audio");
      setIsSpotifyPlaying(true);
    }
  }

  // --- Calendar Actions ---
  async function handleCreateCalendarEvent() {
    if (!newEventTitle.trim()) return;
    const time = newEventTime.trim() || "Tomorrow at 10:00 AM";
    const res = await modulesApi.executeAction("google_calendar", "create_event", {
      title: newEventTitle.trim(),
      time,
    });
    setCalendarEvents((prev) => [
      ...prev,
      { id: String(Date.now()), title: newEventTitle.trim(), time, location: "ASCEND Schedule" },
    ]);
    setNewEventTitle("");
    setNewEventTime("");
    pushToast({ variant: "success", title: "Event Scheduled", description: res?.message });
  }

  // --- Notion Actions ---
  async function handleCreateNotionPage() {
    if (!newNoteTitle.trim()) return;
    const res = await modulesApi.executeAction("notion", "create_page", {
      title: newNoteTitle.trim(),
    });
    setNotionPages((prev) => [
      { id: String(Date.now()), title: newNoteTitle.trim(), last_edited: "Just now", tags: ["Workspace"] },
      ...prev,
    ]);
    setNewNoteTitle("");
    pushToast({ variant: "success", title: "Notion Page Created", description: res?.message });
  }

  // --- Submit Integration Request ---
  async function handleSubmitRequest() {
    if (!reqAppName.trim()) return;
    setIsSubmittingReq(true);
    try {
      const res = await modulesApi.requestIntegration({
        app_name: reqAppName.trim(),
        description: reqAppDesc.trim() || "User requested application module.",
      });
      pushToast({ variant: "success", title: "Integration Request Submitted", description: res.message });
      setShowRequestModal(false);
      setReqAppName("");
      setReqAppDesc("");
    } catch {
      pushToast({ variant: "danger", title: "Could not submit request" });
    } finally {
      setIsSubmittingReq(false);
    }
  }

  const filteredModules = modules.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || m.category.toLowerCase().includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-arc-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-white tracking-wide">
              App Hub & Integration Centre
            </h1>
            <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              EXPANDABLE PLATFORM
            </span>
          </div>
          <p className="mt-1 font-body text-xs text-ink-muted">
            Integrate external application capabilities directly inside ASCEND. Control them with your dashboard or ARC AI.
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto text-xs py-2 px-3.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Request New App</span>
        </button>
      </div>

      {/* Main Grid: Left Catalog, Right Interactive Dedicated UI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Modules List & Search (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-faint" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules..."
                className="w-full rounded-lg border border-panel-border bg-void/60 pl-8 pr-3 py-2 text-xs font-body text-ink-primary focus:border-arc-500 focus:outline-none"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-panel-border bg-void/60 px-2.5 py-2 text-xs font-body text-ink-secondary focus:border-arc-500 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="music">Music</option>
              <option value="productivity">Productivity</option>
              <option value="notes">Notes</option>
              <option value="media">Media</option>
              <option value="software">Dev</option>
            </select>
          </div>

          <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
            {filteredModules.map((mod) => {
              const isSelected = selectedModule?.id === mod.id;
              return (
                <div
                  key={mod.id}
                  onClick={() => setSelectedModule(mod)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-arc-500/60 bg-arc-500/10 shadow-glow-arc-sm"
                      : "border-white/5 bg-void/50 hover:border-white/20 hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
                        style={{ backgroundColor: `${mod.color}15`, color: mod.color }}
                      >
                        {mod.id === "spotify" && <Music className="h-5 w-5" />}
                        {mod.id === "google_calendar" && <Calendar className="h-5 w-5" />}
                        {mod.id === "notion" && <FileText className="h-5 w-5" />}
                        {mod.id === "youtube_focus" && <Tv className="h-5 w-5" />}
                        {mod.id === "github_dev" && <Code className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-sm font-bold text-white">{mod.name}</h3>
                          <span className="font-mono text-[9px] uppercase text-ink-faint">
                            {mod.category}
                          </span>
                        </div>
                        <p className="font-body text-[11px] text-ink-muted line-clamp-1 mt-0.5">
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          mod.is_connected ? "bg-emerald-400 shadow-[0_0_8px_#34D399]" : "bg-white/20"
                        }`}
                        title={mod.is_connected ? "Connected" : "Disconnected"}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] font-mono text-ink-faint">
                    <span>
                      {mod.is_connected ? (
                        <span className="text-emerald-400">Connected: {mod.account_identifier || "Active"}</span>
                      ) : (
                        <span>Ready to connect</span>
                      )}
                    </span>
                    <span className="text-arc-300 font-semibold">
                      {mod.supported_actions.length} Actions
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dedicated Interactive View for Selected Module (7 cols) */}
        <div className="lg:col-span-7">
          {selectedModule ? (
            <GlassCard padding="lg" glow="arc" className="space-y-5">
              {/* Module Header & Connection Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 shadow-lg"
                    style={{ backgroundColor: `${selectedModule.color}20`, color: selectedModule.color }}
                  >
                    {selectedModule.id === "spotify" && <Music className="h-6 w-6" />}
                    {selectedModule.id === "google_calendar" && <Calendar className="h-6 w-6" />}
                    {selectedModule.id === "notion" && <FileText className="h-6 w-6" />}
                    {selectedModule.id === "youtube_focus" && <Tv className="h-6 w-6" />}
                    {selectedModule.id === "github_dev" && <Code className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg font-bold text-white">{selectedModule.name}</h2>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9px] text-ink-secondary">
                        v1.0.0
                      </span>
                    </div>
                    <p className="font-body text-xs text-ink-muted">{selectedModule.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(selectedModule)}
                    className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-all ${
                      selectedModule.is_enabled
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                        : "bg-white/5 text-ink-faint border border-white/10 hover:text-white"
                    }`}
                  >
                    {selectedModule.is_enabled ? "Enabled" : "Disabled"}
                  </button>

                  {selectedModule.is_connected ? (
                    <button
                      onClick={() => handleDisconnect(selectedModule)}
                      className="rounded-lg bg-crimson-500/15 border border-crimson-500/30 px-3 py-1.5 font-mono text-xs text-crimson-300 hover:bg-crimson-500/25"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowConfigModal(true)}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      Connect Account
                    </button>
                  )}
                </div>
              </div>

              {/* DEDICATED LIVE INTERFACE PER MODULE */}

              {/* 1. SPOTIFY INTERFACE */}
              {selectedModule.id === "spotify" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#0A2616] to-[#04100A] p-5 shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 rounded-xl bg-void/80 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden group">
                        <Disc3 className={`h-10 w-10 text-emerald-400 ${isSpotifyPlaying ? "animate-spin-slow" : ""}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-bold">
                          {isSpotifyPlaying ? "NOW PLAYING" : "PLAYBACK PAUSED"}
                        </span>
                        <h4 className="font-display text-base font-bold text-white truncate">{spotifyTrack}</h4>
                        <p className="font-body text-xs text-emerald-200/80 truncate">{spotifyArtist}</p>

                        <div className="mt-3 flex items-center gap-3">
                          <button
                            onClick={handleSpotifyPlay}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-black hover:scale-105 transition-transform"
                          >
                            {isSpotifyPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                          </button>
                          <button
                            onClick={handleSpotifyNext}
                            className="text-emerald-400 hover:text-white transition-colors"
                          >
                            <SkipForward className="h-5 w-5" />
                          </button>
                          <div className="flex items-center gap-1.5 ml-4">
                            <Volume2 className="h-4 w-4 text-emerald-400/80" />
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={spotifyVolume}
                              onChange={(e) => setSpotifyVolume(Number(e.target.value))}
                              className="h-1 w-20 accent-emerald-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { name: "Deep Study & Focus", count: "45 Tracks" },
                      { name: "Cyberpunk High-BPM", count: "32 Tracks" },
                      { name: "Midnight Coding Lofi", count: "88 Tracks" },
                    ].map((pl, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSpotifyTrack(`${pl.name} Stream`);
                          setIsSpotifyPlaying(true);
                        }}
                        className="cursor-pointer rounded-lg border border-white/5 bg-void/50 p-2.5 hover:border-emerald-500/40 transition-colors"
                      >
                        <p className="font-display font-semibold text-white truncate">{pl.name}</p>
                        <p className="font-mono text-[10px] text-ink-faint mt-0.5">{pl.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. GOOGLE CALENDAR INTERFACE */}
              {selectedModule.id === "google_calendar" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="Add study session or event..."
                      className="flex-1 rounded-lg border border-panel-border bg-void/60 px-3 py-1.5 text-xs font-body text-ink-primary focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      placeholder="Time (e.g. 15:00)"
                      className="w-32 rounded-lg border border-panel-border bg-void/60 px-3 py-1.5 text-xs font-body text-ink-primary focus:border-blue-500 focus:outline-none"
                    />
                    <button onClick={handleCreateCalendarEvent} className="btn-primary text-xs py-1.5 px-3">
                      Add Event
                    </button>
                  </div>

                  <div className="space-y-2">
                    {calendarEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded-lg border border-white/5 bg-void/60 p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                            📅
                          </div>
                          <div>
                            <h5 className="font-display text-xs font-bold text-white">{ev.title}</h5>
                            <span className="font-mono text-[10px] text-blue-300">{ev.time}</span>
                            <span className="text-ink-faint text-[10px] ml-2">• {ev.location}</span>
                          </div>
                        </div>
                        <span className="rounded bg-blue-500/10 text-blue-300 font-mono text-[9px] px-2 py-0.5">
                          Synced
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. NOTION INTERFACE */}
              {selectedModule.id === "notion" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      placeholder="Create new workspace note or document..."
                      className="flex-1 rounded-lg border border-panel-border bg-void/60 px-3 py-1.5 text-xs font-body text-ink-primary focus:border-arc-500 focus:outline-none"
                    />
                    <button onClick={handleCreateNotionPage} className="btn-primary text-xs py-1.5 px-3">
                      Create Note
                    </button>
                  </div>

                  <div className="space-y-2">
                    {notionPages.map((pg) => (
                      <div
                        key={pg.id}
                        className="rounded-lg border border-white/5 bg-void/60 p-3 flex items-center justify-between hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-neutral-400" />
                          <div>
                            <h5 className="font-display text-xs font-semibold text-white">{pg.title}</h5>
                            <span className="font-mono text-[10px] text-ink-faint">Edited: {pg.last_edited}</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {pg.tags.map((t, idx) => (
                            <span key={idx} className="rounded bg-white/5 px-2 py-0.5 font-mono text-[9px] text-ink-secondary">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. YOUTUBE FOCUS INTERFACE */}
              {selectedModule.id === "youtube_focus" && (
                <div className="space-y-4">
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-crimson-500/30 bg-black shadow-lg">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${currentStreamId}?autoplay=0`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <div className="flex gap-2">
                    {[
                      { title: "Lofi Hip Hop Study", id: "jfKfPfyJRdk" },
                      { title: "Synthwave Chill", id: "4xDzrJKXOOY" },
                      { title: "Deep Focus Ambient", id: "S_MOd40xSQQ" },
                    ].map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentStreamId(s.id)}
                        className={`flex-1 rounded-lg border p-2 text-left font-body text-xs transition-colors ${
                          currentStreamId === s.id
                            ? "border-crimson-500/60 bg-crimson-500/10 text-white font-semibold"
                            : "border-white/5 bg-void/50 text-ink-muted hover:text-white"
                        }`}
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. GITHUB DEV INTERFACE */}
              {selectedModule.id === "github_dev" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {githubRepos.map((r, i) => (
                      <div key={i} className="rounded-xl border border-purple-500/30 bg-void/60 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <Code className="h-4 w-4 text-purple-400" />
                          <span className="font-mono text-[9px] text-ink-faint">★ {r.stars}</span>
                        </div>
                        <h5 className="font-display text-xs font-bold text-white truncate">{r.name}</h5>
                        <p className="font-mono text-[10px] text-purple-300">{r.language}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-white/5 bg-void/40 p-3 font-mono text-[11px] text-ink-muted space-y-1">
                    <div className="text-white font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      Recent Telemetry Commits
                    </div>
                    <div>› <span className="text-purple-300">a4f89d1</span> feat: Owner Control Centre and Modular App Hub</div>
                    <div>› <span className="text-purple-300">e81c2b0</span> feat: Real-time hardware telemetry and desktop installer</div>
                  </div>
                </div>
              )}

              {/* Supported Actions & ARC AI Commands */}
              <div className="border-t border-white/10 pt-4">
                <h4 className="font-mono text-[11px] uppercase tracking-wider text-arc-400 font-bold mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Supported ARC AI Voice / Chat Directives
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedModule.supported_actions.map((act) => (
                    <div
                      key={act.id}
                      className="rounded-lg border border-white/5 bg-void/50 p-2 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-white block text-[11px]">{act.name}</span>
                        <span className="text-ink-faint text-[10px]">{act.description}</span>
                      </div>
                      {act.requires_confirmation && (
                        <span className="rounded bg-amber-500/10 text-amber-300 text-[8px] font-mono px-1.5 py-0.5">
                          Requires Confirm
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          ) : (
            <div className="flex h-full items-center justify-center p-12 text-center text-ink-faint">
              Select an application module to inspect and launch its live interface.
            </div>
          )}
        </div>
      </div>

      {/* Connect Account Modal */}
      {showConfigModal && selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <GlassCard padding="lg" className="w-full max-w-md">
            <h3 className="font-display text-base font-bold text-white mb-2">
              Connect {selectedModule.name}
            </h3>
            <p className="font-body text-xs text-ink-muted mb-4">
              Enter your account identifier or API credential. You can also connect in interactive sandbox mode.
            </p>

            <label className="hud-label mb-1 block">Account Identifier / Email</label>
            <input
              value={configIdentifier}
              onChange={(e) => setConfigIdentifier(e.target.value)}
              placeholder="e.g. user@spotify.com or Developer Key"
              className="w-full rounded-lg border border-panel-border bg-void/60 p-2.5 text-xs font-body text-ink-primary mb-4 focus:border-arc-500 focus:outline-none"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfigModal(false)} className="btn-secondary text-xs px-3 py-1.5">
                Cancel
              </button>
              <button onClick={() => handleConnect(selectedModule)} className="btn-primary text-xs px-4 py-1.5">
                Authorize & Connect
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Request Integration Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <GlassCard padding="lg" className="w-full max-w-md">
            <h3 className="font-display text-base font-bold text-white mb-2">
              Request New Application Integration
            </h3>
            <p className="font-body text-xs text-ink-muted mb-4">
              Submit an application you want Antigravity and ASCEND to integrate into the central ecosystem.
            </p>

            <div className="space-y-3">
              <div>
                <label className="hud-label mb-1 block">Application Name</label>
                <input
                  value={reqAppName}
                  onChange={(e) => setReqAppName(e.target.value)}
                  placeholder="e.g. Discord, Telegram, WhatsApp, VS Code"
                  className="w-full rounded-lg border border-panel-border bg-void/60 p-2.5 text-xs font-body text-ink-primary focus:border-arc-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="hud-label mb-1 block">Desired Features & Use Case</label>
                <textarea
                  value={reqAppDesc}
                  onChange={(e) => setReqAppDesc(e.target.value)}
                  rows={3}
                  placeholder="Explain how you want to interact with this application inside ASCEND..."
                  className="w-full rounded-lg border border-panel-border bg-void/60 p-2.5 text-xs font-body text-ink-primary focus:border-arc-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowRequestModal(false)} className="btn-secondary text-xs px-3 py-1.5">
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={isSubmittingReq}
                  className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
                >
                  {isSubmittingReq ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  Submit Request
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
