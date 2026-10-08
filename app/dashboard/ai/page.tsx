"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Topbar } from "@/components/layout/topbar"
import { useBranch } from "@/hooks/useBranch"
import{useUser} from "@/hooks/useUser"    
import { aiAPI } from "@/lib/api/ai"
import { cn } from "@/lib/utils"
import { Send, Loader2, Sparkles, RefreshCw } from "lucide-react"

const SUGGESTIONS = [
  "What are my peak hours this week?",
  "Which menu items are selling best?",
  "What inventory should I restock urgently?",
  "How is my revenue trending?",
  "What should I focus on to increase sales?",
]

function getSessionId(): string {
  if (typeof window === "undefined") return ""
  let id = sessionStorage.getItem("ai_session_id")
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem("ai_session_id", id)
  }
  return id
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  tokensUsed?: number
  fromCache?: boolean
  loading?: boolean
}

export default function AIPage() {
  const { branchId } = useBranch()
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !branchId || loading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
    }
    const loadingId = crypto.randomUUID()
    const loadingMsg: Message = {
      id: loadingId,
      role: "assistant",
      content: "",
      loading: true,
    }

    setMessages((prev) => [...prev, userMsg, loadingMsg])
    setInput("")
    setLoading(true)
    setError(null)

    if (inputRef.current) {
      inputRef.current.style.height = "auto"
    }

    try {
      const res = await aiAPI.chat(text.trim(), branchId, getSessionId())
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                id: loadingId,
                role: "assistant",
                content: res.response,
                tokensUsed: res.tokens_used,
                fromCache: res.from_cache,
              }
            : m
        )
      )
    } catch (err: any) {
      const msg = err.response?.data?.error ?? "Something went wrong. Please try again."
      setError(msg)
      setMessages((prev) => prev.filter((m) => m.id !== loadingId))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [branchId, loading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const t = e.target as HTMLTextAreaElement
    t.style.height = "auto"
    t.style.height = `${Math.min(t.scrollHeight, 128)}px`
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
    sessionStorage.removeItem("ai_session_id")
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col flex-1 bg-cream h-screen">
      <Topbar title="AI Assistant" />

      <div className="flex flex-col flex-1 max-w-3xl w-full mx-auto px-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-ink" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">MezzaniAI</p>
              <p className="text-xs text-zinc-400">Restaurant analytics assistant</p>
            </div>
          </div>
          {!isEmpty && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New chat
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">

          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
              <div className="text-center space-y-1">
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-7 h-7 text-brand-ink" />
                </div>
                <p className="text-base font-semibold text-zinc-900">
                  Ask MezzaniAI anything about your restaurant
                </p>
                <p className="text-sm text-zinc-400">
                  Powered by your real operational data — orders, inventory, staff
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={!branchId}
                    className="text-left px-4 py-3 bg-white border border-cream-border rounded-xl text-sm text-zinc-700 hover:border-brand/40 hover:bg-brand/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-cream-border disabled:hover:bg-white"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {!branchId && (
                <p className="text-xs text-amber-500 text-center">
                  No branch selected — create or select a branch from the sidebar to get started.
                </p>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-ink" />
                </div>
              )}

              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-charcoal text-white rounded-tr-sm"
                  : "bg-white border border-cream-border text-zinc-800 rounded-tl-sm shadow-sm"
              )}>
                {msg.loading ? (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs">Analysing your data...</span>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === "assistant" && (msg.fromCache || (msg.tokensUsed && msg.tokensUsed > 0)) && (
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-zinc-100">
                        {msg.fromCache && (
                          <span className="text-xs text-zinc-300">cached</span>
                        )}
                        {msg.tokensUsed && msg.tokensUsed > 0 && (
                          <span className="text-xs text-zinc-300">
                            {msg.tokensUsed} tokens
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-xl bg-charcoal flex items-center justify-center shrink-0 mt-0.5 text-white text-xs font-bold">
                  {initials}
                </div>
              )}
            </div>
          ))}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-xl">
                {error}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="py-4 border-t border-cream-border">
          <div className="flex items-end gap-3 bg-white border border-cream-border rounded-2xl px-4 py-3 focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/15 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder={branchId ? "Ask about your orders, revenue, inventory..." : "Select a branch to start chatting..."}
              rows={1}
              className="flex-1 resize-none outline-none text-sm text-zinc-800 placeholder-zinc-400 bg-transparent"
              style={{ height: "auto", maxHeight: "128px" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading || !branchId}
              className="w-8 h-8 rounded-xl bg-charcoal hover:bg-charcoal/90 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0"
            >
              {loading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Send className="w-3.5 h-3.5" />
              }
            </button>
          </div>
          <p className="text-xs text-zinc-400 text-center mt-2">
            Press Enter to send · Shift+Enter for new line · Data updates every 2 minutes
          </p>
        </div>
      </div>
    </div>
  )
}