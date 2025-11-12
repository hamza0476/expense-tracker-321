import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, Trash2, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  role: string;
  content: string;
  created_at: string;
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      if (data && data.length > 0) {
        setShowWelcome(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const clearHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('ai_chat_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setMessages([]);
      setShowWelcome(true);
      toast({
        title: "Success",
        description: "Chat history cleared",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;

    const userMessage = input.trim();
    setInput("");
    setStreaming(true);
    setShowWelcome(false);

    // Add user message immediately
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-financial-assistant`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: userMessage }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        if (response.status === 402) {
          throw new Error("Payment required. Please add credits to continue.");
        }
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      // Add empty assistant message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      }]);

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
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = assistantMessage;
                return newMessages;
              });
            }
          } catch (e) {
            console.error("Parse error:", e);
          }
        }
      }

      // Save assistant message to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('ai_chat_history').insert({
          user_id: user.id,
          role: 'assistant',
          content: assistantMessage
        });
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      // Remove the empty assistant message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-xl">
              <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground" />
            </div>
            AI Financial Assistant
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">Your intelligent companion for financial insights</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory} className="shadow-sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden shadow-lg border-border/40">
        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="space-y-6">
            {showWelcome && messages.length === 0 && (
              <div className="text-center py-16 animate-fade-in">
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">How can I assist you today?</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  I'm here to help with expense tracking, budget planning, financial analysis, and personalized advice.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mt-8">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2 hover:border-primary/50"
                    onClick={() => setInput("What's my spending trend this month?")}
                  >
                    <span className="font-semibold text-sm">📊 Spending Analysis</span>
                    <span className="text-xs text-muted-foreground text-left">Analyze your monthly expenses</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2 hover:border-primary/50"
                    onClick={() => setInput("Help me create a budget")}
                  >
                    <span className="font-semibold text-sm">💰 Budget Planning</span>
                    <span className="text-xs text-muted-foreground text-left">Get personalized budget tips</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2 hover:border-primary/50"
                    onClick={() => setInput("Show me my top spending categories")}
                  >
                    <span className="font-semibold text-sm">🎯 Category Insights</span>
                    <span className="text-xs text-muted-foreground text-left">Discover spending patterns</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2 hover:border-primary/50"
                    onClick={() => setInput("Give me savings tips")}
                  >
                    <span className="font-semibold text-sm">💡 Savings Tips</span>
                    <span className="text-xs text-muted-foreground text-left">Learn how to save more</span>
                  </Button>
                </div>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="h-8 w-8 shrink-0 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground'
                      : 'bg-secondary/80 border border-border/40'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <Avatar className="h-8 w-8 shrink-0 border-2 border-primary/20">
                    <AvatarFallback className="bg-muted">
                      <span className="text-sm font-semibold">U</span>
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {streaming && (
              <div className="flex gap-3 justify-start animate-fade-in">
                <Avatar className="h-8 w-8 shrink-0 border-2 border-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-secondary/80 border border-border/40 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/30">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type your message..."
              disabled={streaming}
              className="flex-1 h-11 border-border/50 bg-background"
            />
            <Button 
              onClick={sendMessage} 
              disabled={streaming || !input.trim()}
              size="icon"
              className="h-11 w-11 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AIAssistant;
