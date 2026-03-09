import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Minimize2, Send, Circle, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  online?: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read?: boolean;
}

export function FloatingChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Buscar usuários e configurar Presence
  useEffect(() => {
    if (!user) return;

    // Buscar lista inicial de usuários
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, email")
        .neq("id", user.id);
      
      if (data) {
        setUsers(data.map(u => ({ ...u, online: false })));
      }
    };

    fetchUsers();

    // Configurar Realtime Presence
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const onlineUserIds = new Set(Object.keys(newState));
        
        setUsers((prevUsers) => 
          prevUsers.map((u) => ({
            ...u,
            online: onlineUserIds.has(u.id)
          }))
        );
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 2. Carregar mensagens e configurar subscription de chat
  useEffect(() => {
    if (!activeUser || !user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages' as any)
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeUser.id}),and(sender_id.eq.${activeUser.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data as unknown as Message[]);
    };

    fetchMessages();

    // Subscribe to new messages for this chat
    const channel = supabase
      .channel(`chat:${activeUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`, 
        },
        (payload) => {
            // Se a mensagem for do usuário ativo, adiciona à lista
            const newMessage = payload.new as any;
            if (newMessage.sender_id === activeUser.id) {
                setMessages((prev) => [...prev, newMessage as unknown as Message]);
            }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeUser, user]);

  // Scroll automático
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeUser, isOpen]);

  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    
    // Optimistic
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: editContent } : m));
    setEditingMessageId(null);

    await supabase.from('messages' as any).update({ content: editContent }).eq('id', id);
  };

  const handleDeleteMessage = async (id: string) => {
    // Optimistic
    setMessages(prev => prev.filter(m => m.id !== id));

    await supabase.from('messages' as any).delete().eq('id', id);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeUser || !user) return;

    const content = newMessage;
    setNewMessage("");

    // Optimistic UI update
    const tempId = Math.random().toString();
    const optimisticMsg: Message = {
        id: tempId,
        sender_id: user.id,
        receiver_id: activeUser.id,
        content,
        created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { data, error } = await supabase.from('messages' as any).insert({
        sender_id: user.id,
        receiver_id: activeUser.id,
        content
    }).select().single();

    if (error) {
        console.error("Erro ao enviar:", error);
        // Em caso de erro, poderíamos remover a mensagem otimista ou mostrar erro
    } else if (data) {
        setMessages((prev) => prev.map(m => m.id === tempId ? (data as unknown as Message) : m));
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-0 right-4 z-50 flex items-end gap-4 pointer-events-none">
      <div className="flex items-end gap-4 pointer-events-auto">
      {/* Janela de Chat Ativo */}
      {activeUser && (
        <Card className="w-80 shadow-2xl border-t border-x rounded-t-lg mb-0 flex flex-col h-96 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <CardHeader className="p-3 bg-primary text-primary-foreground rounded-t-lg flex flex-row items-center justify-between space-y-0 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Avatar className="h-8 w-8 border-2 border-background bg-background">
                  <AvatarFallback className="text-foreground">{activeUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {activeUser.online && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm truncate max-w-[120px] leading-none">{activeUser.name}</span>
                <span className="text-[10px] opacity-80 mt-1">{activeUser.online ? "Online" : "Offline"}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setActiveUser(null)}>
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setActiveUser(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex flex-col flex-1 bg-background overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-4">Inicie a conversa com {activeUser.name}</p>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex group items-end gap-2 ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender_id === user.id && !editingMessageId && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mb-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => handleStartEdit(msg)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteMessage(msg.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm relative ${
                        msg.sender_id === user.id
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none"
                      }`}
                    >
                      {editingMessageId === msg.id ? (
                        <div className="flex gap-2 items-center">
                          <Input 
                            value={editContent} 
                            onChange={(e) => setEditContent(e.target.value)}
                            className="h-7 text-xs bg-background/20 border-none text-inherit placeholder:text-inherit/50 focus-visible:ring-1 focus-visible:ring-inherit min-w-[120px]"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(msg.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                          <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-white/20 shrink-0" onClick={() => handleSaveEdit(msg.id)}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-white/20 shrink-0" onClick={handleCancelEdit}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          {msg.content}
                          <p className={`text-[10px] mt-1 text-right opacity-70 ${msg.sender_id === user.id ? "text-primary-foreground" : "text-muted-foreground"}`}>
                            {format(new Date(msg.created_at), "HH:mm")}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="p-3 border-t bg-background flex gap-2 shrink-0">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="h-9 text-sm rounded-full"
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-full" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Usuários / Botão Principal */}
      <div className="flex flex-col items-end">
        {isOpen ? (
          <Card className="w-72 shadow-2xl border-t border-x rounded-t-lg mb-0 animate-in slide-in-from-bottom-5 fade-in duration-200">
            <CardHeader 
              className="p-3 bg-primary text-primary-foreground rounded-t-lg flex flex-row items-center justify-between space-y-0 cursor-pointer hover:bg-primary/90 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span className="font-semibold text-sm">Chat ({users.filter(u => u.online).length} online)</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 max-h-[28rem] overflow-y-auto bg-background">
              <div className="divide-y divide-border/50">
                {users.map((u) => (
                  <button
                    key={u.id}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left group"
                    onClick={() => setActiveUser(u)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 border border-border group-hover:border-primary/50 transition-colors">
                        <AvatarFallback>{u.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {u.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background shadow-sm" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{u.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${u.online ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                        <p className="text-xs text-muted-foreground truncate">{u.online ? "Online" : "Offline"}</p>
                      </div>
                    </div>
                  </button>
                ))}
                {users.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <Circle className="h-8 w-8 text-muted-foreground/20 animate-pulse" />
                    <p>Nenhum usuário encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            className="rounded-t-lg rounded-b-none h-12 px-5 shadow-lg gap-2.5 font-semibold text-base hover:translate-y-[-2px] transition-transform"
            onClick={() => setIsOpen(true)}
          >
            <div className="relative">
              <MessageCircle className="h-5 w-5" />
              {users.filter(u => u.online).length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-green-400 rounded-full border border-primary animate-pulse" />
              )}
            </div>
            <span>Chat</span>
            {users.filter(u => u.online).length > 0 && (
              <span className="bg-primary-foreground text-primary text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
                {users.filter(u => u.online).length}
              </span>
            )}
          </Button>
        )}
      </div>
      </div>
    </div>
  );
}
