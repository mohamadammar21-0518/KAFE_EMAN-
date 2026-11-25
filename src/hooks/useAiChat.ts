import { useState, useRef, useMemo } from "react";
import { useAction, useQuery } from "convex/react";
import { useUser } from "@clerk/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

import { ConvexError } from "convex/values";
import { useBranch } from "@/branch/BranchContext";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  _id?: Id<"aiMessages">;
};

export function useAiChat(activeThreadId?: Id<"aiThreads"> | null) {
  const { isSignedIn } = useUser();
  const { branchId } = useBranch();
  const saved = useQuery(
    api.ai.userChat.getThreadMessages,
    isSignedIn && activeThreadId ? { threadId: activeThreadId } : "skip",
  );
  const chat = useAction(api.ai.chat.chat);
  const inFlight = useRef(false);
  const [pending, setPending] = useState<ChatMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<Id<"aiThreads">>();
  const messages = useMemo(() => (pending ? [...(saved ?? []), pending] : (saved ?? [])), [saved, pending]);

  async function sendMessage(content: string) {
    if (inFlight.current || !content.trim()) return false;
    inFlight.current = true;
    setPending({ role: "user", content, createdAt: Date.now() });
    setError(null);
    try {
      const result = await chat({
        message: content,
        threadId: activeThreadId ?? undefined,
        branchSlug: branchId,
      });
      setThreadId(result.threadId);
      return true;
    } catch (err) {
      setError(
        err instanceof ConvexError && typeof err.data === "string"
          ? err.data
          : "Couldn’t send your message. Please try again.",
      );
      return false;
    } finally {
      setPending(null);
      inFlight.current = false;
    }
  }

  return {
    messages,
    sendMessage,
    error,
    clearError: () => setError(null),
    isLoading: !!pending,
    historyLoading: !!activeThreadId && saved === undefined,
    threadId,
  };
}
