import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, Plus, Clock, Trash2, ChevronLeft, Coffee,
} from "lucide-react";
import { useUser } from "@clerk/react";
import { useQuery, useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { AiChatPanel } from "./AiChatPanel";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type View = "chat" | "history";

export function AiChatFab() {
  const { user } = useUser();
  return <ChatWidget key={user?.id ?? "guest"} />;
}

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("chat");
  const [activeThreadId, setActiveThreadId] = useState<Id<"aiThreads"> | null>(null);
  const [draftKey, setDraftKey] = useState(0);
  const { isSignedIn } = useUser();
  const panelRef = useRef<HTMLDivElement>(null);

  const threads = useQuery(
    api.ai.userChat.getAllMyThreads,
    isSignedIn && open && view === "history" ? {} : "skip"
  );
  const deleteThread = useMutation(api.ai.userChat.deleteThread);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handleClick), 100);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handleClick); };
  }, [open]);

  useEffect(() => {
    if (!open) setView("chat");
  }, [open]);

  function handleNewChat() {
    setDraftKey((key) => key + 1);
    setActiveThreadId(null);
    setView("chat");
  }

  function handleSelectThread(id: Id<"aiThreads">) {
    setActiveThreadId(id);
    setView("chat");
  }

  async function handleDeleteThread(e: React.MouseEvent, id: Id<"aiThreads">) {
    e.stopPropagation();
    await deleteThread({ threadId: id });
    if (activeThreadId === id) setActiveThreadId(null);
  }

  function formatDate(ts: number) {
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  const content = (
    <div
      ref={panelRef}
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] z-[400] sm:bottom-6 sm:right-6 flex flex-col items-end gap-3"
    >
      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex w-[min(420px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] ring-1 ring-black/8"
            style={{ height: "min(600px, calc(100dvh - 100px - env(safe-area-inset-bottom)))" }}
            role="dialog"
            aria-label="Kafe Eman AI Assistant"
          >
            {/* Header */}
            <div
              className="relative flex items-center gap-3 px-4 py-3.5 shrink-0"
              style={{
                background: "linear-gradient(135deg, #192b22 0%, #354937 100%)",
              }}            >
              <span className="grid size-10 place-items-center rounded-full border border-[#d9c296]/60 text-[#f6dfb2]"><Coffee size={20} /></span>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <p className="font-serif text-2xl text-white leading-none">Ask Eman</p>

                </div>
                <p className="mt-0.5 text-[11px] text-white/50 truncate">
                  {isSignedIn ? "Your café concierge" : "Log in to get started"}
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-1 ml-auto shrink-0">
                {isSignedIn && (
                  <button
                    type="button"
                    onClick={() => setView(view === "history" ? "chat" : "history")}
                    title="Chat history"
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                      view === "history"
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:bg-white/15 hover:text-white"
                    )}
                  >
                    <Clock className="h-4 w-4" />
                  </button>
                )}
                {isSignedIn && (
                  <button
                    type="button"
                    onClick={handleNewChat}
                    title="New chat"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/15 hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                {/* Close — always visible, slightly larger */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 relative">
              <AnimatePresence mode="wait" initial={false}>
                {view === "history" ? (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col bg-white"
                  >
                    {/* History toolbar */}
                    <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setView("chat")}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="flex-1 text-sm font-semibold text-gray-700">Chat History</span>
                      <button
                        type="button"
                        onClick={handleNewChat}
                        className="flex items-center gap-1.5 rounded-full bg-[#355927] px-3 py-1.5 text-[11px] font-medium text-white transition-opacity hover:opacity-90"
                      >
                        <Plus className="h-3 w-3" />
                        New chat
                      </button>
                    </div>

                    {/* Thread list */}
                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                      {!threads || threads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                            <Clock className="h-5 w-5 text-gray-300" />
                          </div>
                          <p className="text-sm text-gray-400">{threads ? "No previous conversations" : "Loading conversations…"} </p>
                        </div>
                      ) : (
                        threads.map((thread) => (
                          <div key={thread._id} className="group relative">
                          <button
                            type="button"
                            onClick={() => handleSelectThread(thread._id)}
                            className={cn(
                              "group relative w-full rounded-2xl px-3.5 py-3 text-left transition-all",
                              activeThreadId === thread._id
                                ? "bg-[#355927]/8 ring-1 ring-[#355927]/20"
                                : "hover:bg-gray-50"
                            )}
                          >
                            <p className="truncate pr-7 text-sm text-gray-700 font-medium leading-snug">
                              {thread.preview}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-[11px] text-gray-400">{formatDate(thread.updatedAt)}</span>
                              <span className="text-[11px] text-gray-300">· {thread.messageCount} msg{thread.messageCount !== 1 ? "s" : ""}</span>
                            </div>
                          </button>
                            <button
                              type="button"
                              aria-label={`Delete conversation: ${thread.preview}`}
                              onClick={(e) => handleDeleteThread(e, thread._id)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-all group-hover:text-gray-600 hover:!text-red-400 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`chat-${activeThreadId ?? draftKey}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0"
                  >
                    <AiChatPanel
                      activeThreadId={activeThreadId}
                      onThreadCreated={setActiveThreadId}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close AI chat" : "Open AI chat"}
        className="flex min-h-12 items-center gap-3 rounded-full border border-[#cbb68e] bg-[#243329] px-4 py-3 text-[#fff2d9] shadow-xl">
        {open ? <X size={20} /> : <Coffee size={20} />}
        <span className="hidden text-sm font-medium sm:inline">{open ? "Close" : "Ask Eman"}</span>
      </motion.button>
    </div>
  );

  return createPortal(content, document.body);
}
