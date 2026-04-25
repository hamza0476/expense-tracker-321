import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, Sparkles, History, Plus, User as UserIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  role: string;
  content: string;
  created_at: string;
}

const QUICK_PROMPTS = [
  "Analyze spending",
  "Investments",
  "Budget",
];

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
};

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    if (data?.full_name) setFullName(data.full_name);
  };

  const fetchChatHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("ai_chat_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const clearHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("ai_chat_history").delete().eq("user_id", user.id);
    setMessages([]);
    toast({ title: "Chat cleared" });
  };

  const sendQuick = (text: string) => setInput(text);

  const sendMessage = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || streaming) return;

    setInput("");
    setStreaming(true);

    const newUserMessage: Message = {
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-financial-assistant`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: text }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
        if (response.status === 402) throw new Error("Payment required. Please add credits to continue.");
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", created_at: new Date().toISOString() },
      ]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1].content = assistantMessage;
                return next;
              });
            }
          } catch {
            // partial chunk
          }
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("ai_chat_history").insert({
          user_id: user.id,
          role: "assistant",
          content: assistantMessage,
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  };

  const initial = (fullName || "U").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] md:h-[calc(100vh-4rem)] max-w-md mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="You" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {initial}
              </AvatarFallback>
            )}
          </Avatar>
          <h1 className="font-bold text-primary text-base">Financial Advisor</h1>
        </div>
        <button
          onClick={clearHistory}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground"
          aria-label="History"
        >
          <History className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-3">
          {/* Default daily briefing if empty */}
          {messages.length === 0 && (
            <>
              <Card className="p-3.5 rounded-2xl rounded-tl-sm bg-card border border-border/60 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-bold tracking-wider uppercase text-primary">
                    Daily Briefing
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  Good day! Ask me anything about your spending, budgets, or savings —
                  I'll keep answers short and actionable.
                </p>
              </Card>
              <p className="text-[10px] text-muted-foreground text-center">{formatTime(new Date().toISOString())}</p>
            </>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div key={idx} className="space-y-1 animate-fade-in">
                <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                        : "bg-muted/70 text-foreground rounded-2xl rounded-tl-sm border border-border/40"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content || "…"}</p>
                  </div>
                </div>
                <p
                  className={cn(
                    "text-[10px] text-muted-foreground px-1",
                    isUser ? "text-right" : "text-left"
                  )}
                >
                  {formatTime(msg.created_at)}
                </p>
              </div>
            );
          })}

          {streaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-1.5 px-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Quick prompts */}
      <div className="px-4 pb-2 pt-1 flex gap-2 overflow-x-auto scrollbar-hide">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            onClick={() => sendQuick(q)}
            className="shrink-0 h-8 px-3.5 rounded-full border border-primary/30 text-primary text-[11px] font-bold tracking-wider uppercase hover:bg-primary/5 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className="px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 border-t border-border/40 bg-background">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted shrink-0"
            aria-label="Add"
          >
            <Plus className="h-5 w-5" />
          </button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Ask your assistant..."
            disabled={streaming}
            className="flex-1 h-10 rounded-full bg-muted/60 border-0 focus-visible:ring-1 focus-visible:ring-primary/40"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={streaming || !input.trim()}
            size="icon"
            className="h-10 w-10 rounded-full shrink-0 shadow-sm shadow-primary/20"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
