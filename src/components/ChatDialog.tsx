import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  otherUserName: string;
}

export const ChatDialog = ({ open, onOpenChange, conversationId, otherUserName }: ChatDialogProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && conversationId) {
      fetchMessages();
      getCurrentUser();
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`messages-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setCurrentUserId(session.user.id);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: newMessage.trim()
      }]);

    if (error) {
      toast.error("Gagal mengirim pesan");
    } else {
      setNewMessage("");
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat dengan {otherUserName}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20 rounded-lg">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.sender_id === currentUserId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border'
                }`}
              >
                <div className="text-sm break-words">{msg.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    msg.sender_id === currentUserId
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }`}
                >
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
