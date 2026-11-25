import { useState, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useUser } from "@clerk/react";
import { Send, Loader2, AlertCircle, RefreshCw, List } from "lucide-react";
import { useAiChat, type ChatMessage } from "@/hooks/useAiChat";
import { AiLoginGate } from "./AiLoginGate";
import { useBranch } from "@/branch/BranchContext";
import { cn } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

interface AiChatPanelProps {
  activeThreadId?: Id<"aiThreads"> | null;
  onThreadCreated?: (id: Id<"aiThreads">) => void;
}

const SUGGESTIONS = [
  { icon: "📍", label: "Track my order", prompt: "Where is my order right now?" },
  { icon: "☕", label: "Browse the menu", prompt: "Show me today's full menu" },
  { icon: "⭐", label: "Featured today", prompt: "What's featured today?" },
  { icon: "🎟️", label: "My coupons", prompt: "Do I have any reward coupons?" },
  { icon: "🏆", label: "My loyalty points", prompt: "How many loyalty points do I have?" },
  { icon: "📍", label: "Find a branch", prompt: "Show me all branches" },
  { icon: "🕐", label: "Opening hours", prompt: "What are the branch hours?" },
];

export function AiChatPanel({ activeThreadId, onThreadCreated }: AiChatPanelProps) {
  const { isSignedIn, user } = useUser();
  const { branches, branchId } = useBranch();
  const branchLabel = branches.find((branch) => branch.id === branchId)?.label;
  const reducedMotion = useReducedMotion();
  const { messages, sendMessage, isLoading, historyLoading, error, clearError, threadId } =
    useAiChat(activeThreadId);

  const [showQuestions, setShowQuestions] = useState(false);
  const [input, setInput] = useState("");

  const conversationRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (threadId && onThreadCreated) {
      onThreadCreated(threadId as Id<"aiThreads">);
    }
  }, [threadId, onThreadCreated]);

  useEffect(() => {
    const log = conversationRef.current;
    log?.scrollTo({ top: log.scrollHeight, behavior: reducedMotion ? "instant" : "smooth" });
  }, [messages, isLoading, reducedMotion]);

  useEffect(() => {
    if (isSignedIn && window.matchMedia("(min-width: 640px)").matches) inputRef.current?.focus({ preventScroll: true });
  }, [isSignedIn]);

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  async function submit(text: string) {
    if (!text.trim() || isLoading) return;
    const msg = text.trim();
    setShowQuestions(false);
    setInput("");
    if (!(await sendMessage(msg))) setInput(msg);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit(input);
    }
  }

  if (!isSignedIn) return <AiLoginGate />;

  const firstName = user?.firstName || "there";
  const isEmpty = !historyLoading && messages.length === 0;

  return (
    <div className="ai-chat-panel flex h-full min-w-0 flex-col bg-[#faf6ed]">

      {/* ── Messages ── */}
      <div ref={conversationRef} role="log" aria-label="Conversation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">

        {historyLoading && <p role="status" className="text-sm text-gray-500">Loading conversation…</p>}
        {/* Welcome */}
        {isEmpty && (
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col items-center gap-2 pt-3 text-center">
              <img src="/Images/eman-table.webp" alt="" className="h-24 w-full rounded-2xl object-cover" />
              <div>
                <p className="font-serif text-2xl text-[#243329]">Welcome, {firstName}.</p>
                <p className="mt-0.5 text-[12px] text-gray-500 leading-relaxed max-w-[270px]">
                  {branchLabel ? `Visiting ${branchLabel}? Ask about the menu, orders, or rewards.` : "Ask about the menu, orders, or rewards."}
                </p>
              </div>
            </div>

            {/* Suggestion chips */}
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  key={s.label}
                  type="button"
                  onClick={() => void submit(s.prompt)}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-left text-xs text-gray-700 shadow-sm transition-all hover:border-[#355927]/30 hover:bg-[#355927]/5 hover:text-[#355927]"
                >
                  <span aria-hidden>{s.icon}</span>
                  {s.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <ChatBubble key={msg._id ?? i} message={msg} />
        ))}

        {/* Typing dots */}
        {isLoading && (
          <div className="flex items-end gap-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
              style={{
                background: "conic-gradient(from 120deg at 60% 40%, #4a7a35 0%, #355927 30%, #1c1f1a 60%, #4a7a35 100%)",
              }}
            >
              <span className="block h-3.5 w-3.5 rounded-full"
                style={{
                  background: "radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.6) 0%, transparent 60%)",
                }}
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:240ms]" />
            </div>
          </div>
        )}

        {(showQuestions || error) && !isEmpty && !isLoading && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(({ label, prompt }) => (
              <button key={label} type="button" onClick={() => void submit(prompt)}
                className="rounded-full border bg-white px-3 py-1 text-xs">{label}</button>
            ))}
          </div>
        )}
        {/* Error */}
        {error && (
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-400" />
            </div>
            <div className="flex-1 rounded-2xl rounded-tl-sm bg-red-50 px-3.5 py-2.5 text-[12px] text-red-600 ring-1 ring-red-100">
              <p role="alert">{error}</p>
              <button
                type="button"
                onClick={clearError}
                className="mt-1 flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Dismiss
              </button>
            </div>
          </div>
        )}


      </div>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-3">
        <form
          onSubmit={(e) => { e.preventDefault(); void submit(input); }}
          className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-[#faf6ed] px-3.5 py-2.5 shadow-sm transition-all focus-within:border-[#355927]/40 focus-within:ring-2 focus-within:ring-[#355927]/10"
        >
          {!isEmpty && !historyLoading && (
            <button type="button" title="Suggested questions" aria-label="Suggested questions"
              aria-expanded={showQuestions || !!error} disabled={isLoading}
              onClick={() => setShowQuestions((visible) => !visible)}
              className="flex h-11 w-11 shrink-0 items-center justify-center text-[#355927]"><List className="h-5 w-5" /></button>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Kafe Eman…"
            aria-label="Message the café assistant"
            maxLength={2000}
            rows={1}
            className="min-w-0 flex-1 resize-none bg-transparent text-base sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-50 leading-relaxed"
            disabled={isLoading || historyLoading}
            style={{ maxHeight: "120px" }}
          />
          <button
            type="submit"
            disabled={isLoading || historyLoading || !input.trim()}
            className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow transition-all disabled:cursor-not-allowed disabled:opacity-30"
            style={{ background: "linear-gradient(135deg, #355927 0%, #4a7a35 100%)" }}
            aria-label="Send"
          >
            {isLoading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Send className="h-3.5 w-3.5" />
            }
          </button>
        </form>
        <p className="mt-1.5 text-center text-[10px] text-gray-300">
          Find saved conversations in Chat History.
        </p>
      </div>
    </div>
  );
}

/* ── Chat bubble ── */
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className="flex h-8 w-8 shrink-0 rounded-full shadow-sm"
          style={{
            background: "conic-gradient(from 120deg at 60% 40%, #4a7a35 0%, #355927 30%, #1c1f1a 60%, #4a7a35 100%)",
          }}
        >
          <span className="m-auto block h-3 w-3 rounded-full"
            style={{ background: "radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.65) 0%, transparent 60%)" }}
          />
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "min-w-0 max-w-[calc(100%-2.5rem)] [overflow-wrap:anywhere] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-sm text-white"
            : "rounded-bl-sm bg-white text-gray-700 ring-1 ring-gray-100"
        )}
        style={isUser ? {
          background: "linear-gradient(135deg, #2d4a1e 0%, #355927 60%, #4a7a35 100%)",
        } : undefined}
      >
        <MessageContent content={message.content} isUser={isUser} />
        <p className={cn(
          "mt-1 text-[10px]",
          isUser ? "text-white/40 text-right" : "text-gray-300"
        )}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#355927]/10 text-[12px] font-semibold text-[#355927]">
          {message.role === "user" ? "You" : "AI"}
        </div>
      )}
    </motion.div>
  );
}

/* ── Markdown-ish renderer ── */
function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (/^\d+\.\s/.test(line)) {
          const num = line.match(/^(\d+)/)?.[1];
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                isUser ? "bg-white/20 text-white" : "bg-[#355927]/10 text-[#355927]"
              )}>
                {num}
              </span>
              <span className="flex-1">{renderInline(line.replace(/^\d+\.\s/, ""), isUser)}</span>
            </div>
          );
        }
        if (/^[-•*]\s/.test(line)) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className={cn(
                "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
                isUser ? "bg-white/50" : "bg-[#d4a843]/60"
              )} />
              <span className="flex-1">{renderInline(line.replace(/^[-•*]\s/, ""), isUser)}</span>
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i}>{renderInline(line, isUser)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string, isUser: boolean) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className={cn("font-semibold", isUser ? "text-white" : "text-gray-800")}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className={cn(
              "rounded px-1 py-0.5 text-[11px] font-mono",
              isUser ? "bg-white/15 text-amber-200" : "bg-[#355927]/8 text-[#355927]"
            )}>
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
