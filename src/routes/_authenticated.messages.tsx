import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Send, Plus, MoreVertical, LogOut, Trash2, Ban } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: (s: Record<string, unknown>) => ({
    conversation: typeof s.conversation === "string" ? s.conversation : undefined,
  }),
  component: MessagesPage,
});

interface Conversation {
  id: string;
  title: string | null;
  is_direct: boolean;
  event_id: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
  display_name: string;
}

function MessagesPage() {
  const { user } = useAuth();
  const { conversation: conversationParam } = Route.useSearch();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [text, setText] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [confirm, setConfirm] = useState<null | { kind: "leave" | "delete" | "block"; targetId?: string; targetName?: string }>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId);

  const loadConversations = async () => {
    if (!user) return;
    const { data: members } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);
    const ids = (members ?? []).map((m) => m.conversation_id);
    if (!ids.length) { setConversations([]); return; }
    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: false });
    setConversations(convs ?? []);
    if (convs && convs.length && !activeId) setActiveId(convs[0].id);
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at");
    setMessages(data ?? []);
    const senderIds = [...new Set((data ?? []).map((m) => m.sender_id))];
    if (senderIds.length) {
      const { data: ps } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", senderIds);
      setProfiles((prev) => ({ ...prev, ...Object.fromEntries((ps ?? []).map((p) => [p.id, p])) }));
    }
  };

  const loadFriends = async () => {
    if (!user) return;
    const { data: fs } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq("status", "accepted");
    const ids = (fs ?? []).map((f: any) => (f.requester_id === user.id ? f.addressee_id : f.requester_id));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, username, display_name").in("id", ids);
      setFriends(ps ?? []);
    }
  };

  const loadMembers = async (convId: string) => {
    const { data: mems } = await supabase
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", convId);
    const ids = (mems ?? []).map((m) => m.user_id);
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, username, display_name").in("id", ids);
      setMembers(ps ?? []);
    } else {
      setMembers([]);
    }
  };

  useEffect(() => { loadConversations(); loadFriends(); }, [user]);
  useEffect(() => { if (conversationParam) setActiveId(conversationParam); }, [conversationParam]);
  useEffect(() => { if (activeId) { loadMessages(activeId); loadMembers(activeId); } }, [activeId]);

  // Realtime
  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`messages:${activeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !activeId || !user) return;
    const body = text;
    setText("");
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeId,
      sender_id: user.id,
      body,
    });
    if (error) { toast.error(error.message); setText(body); }
  };

  const startConversation = async (friendId: string) => {
    if (!user) return;
    // Check existing direct conversation
    const { data: myMembers } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);
    const myIds = (myMembers ?? []).map((m) => m.conversation_id);
    if (myIds.length) {
      const { data: theirs } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", friendId)
        .in("conversation_id", myIds);
      const sharedIds = (theirs ?? []).map((m) => m.conversation_id);
      if (sharedIds.length) {
        const { data: directs } = await supabase
          .from("conversations")
          .select("id")
          .in("id", sharedIds)
          .eq("is_direct", true);
        if (directs && directs.length) {
          setActiveId(directs[0].id);
          setShowNew(false);
          await loadConversations();
          return;
        }
      }
    }
    const friendProfile = friends.find((f) => f.id === friendId);
    // Create conversation via SECURITY DEFINER RPC (auto-adds caller as member)
    const { data: convId, error } = await supabase.rpc("create_conversation", {
      _is_direct: true,
      _title: friendProfile?.display_name ?? "Chat",
      _event_id: undefined as any,
    });
    if (error || !convId) { toast.error(error?.message ?? "Failed to create chat"); return; }
    // Add the friend as the second member
    const { error: memErr } = await supabase
      .from("conversation_members")
      .insert({ conversation_id: convId as string, user_id: friendId });
    if (memErr) { toast.error(memErr.message); return; }
    await loadConversations();
    setActiveId(convId as string);
    setShowNew(false);
  };

  // Determine the "other" user in a direct chat (for blocking)
  const otherMember = active?.is_direct
    ? members.find((m) => m.id !== user?.id)
    : undefined;

  const leaveChat = async () => {
    if (!activeId || !user) return;
    const { error } = await supabase
      .from("conversation_members")
      .delete()
      .eq("conversation_id", activeId)
      .eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Left conversation");
    setActiveId(null);
    setConfirm(null);
    await loadConversations();
  };

  const deleteChat = async () => {
    if (!activeId) return;
    // Purge messages + members first (RLS allows it for deleters), then conversation
    await supabase.from("messages").delete().eq("conversation_id", activeId);
    await supabase.from("conversation_members").delete().eq("conversation_id", activeId);
    const { error } = await supabase.from("conversations").delete().eq("id", activeId);
    if (error) { toast.error(error.message); return; }
    toast.success("Conversation deleted");
    setActiveId(null);
    setConfirm(null);
    await loadConversations();
  };

  const blockUser = async () => {
    if (!user || !confirm?.targetId) return;
    const { error } = await supabase.from("blocked_users").insert({
      blocker_id: user.id,
      blocked_id: confirm.targetId,
    });
    if (error && !error.message.includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    toast.success(`Blocked ${confirm.targetName ?? "user"}`);
    // Also leave the chat
    if (activeId) {
      await supabase.from("conversation_members").delete().eq("conversation_id", activeId).eq("user_id", user.id);
      setActiveId(null);
      await loadConversations();
    }
    setConfirm(null);
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
        <aside className="bg-card border border-border rounded-xl p-5 min-h-[600px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Messages</h2>
            <button onClick={() => setShowNew(!showNew)} className="bg-brand-gradient text-black p-1.5 rounded-lg">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showNew && (
            <div className="bg-input border border-brand-yellow rounded-lg p-3 mb-4">
              <p className="text-xs text-muted-foreground mb-2">Start chat with a friend:</p>
              {friends.length === 0 && <p className="text-xs italic text-muted-foreground">Add friends first.</p>}
              {friends.map((f) => (
                <button key={f.id} onClick={() => startConversation(f.id)} className="w-full text-left py-1.5 px-2 hover:bg-card rounded text-sm">
                  <span className="text-brand-yellow font-bold">@{f.username}</span>
                  <span className="text-muted-foreground ml-1 text-xs">"{f.display_name}"</span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {conversations.length === 0 && <p className="text-sm text-muted-foreground italic">No conversations yet.</p>}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  activeId === c.id ? "bg-input border-brand-pink" : "bg-card border-border hover:border-brand-yellow"
                }`}
              >
                <div className="font-bold truncate">{c.title ?? "Chat"}</div>
                <div className="text-xs text-muted-foreground">{c.is_direct ? "Direct message" : "Group chat"}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="bg-card border border-border rounded-xl p-5 min-h-[600px] flex flex-col">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select or start a conversation.
            </div>
          ) : (
            <>
              <div className="border-b border-border pb-3 mb-4 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold">{active.title ?? "Chat"}</h2>
                  <p className="text-xs text-muted-foreground">{active.is_direct ? "Direct message" : "Group chat"}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-lg hover:bg-input text-muted-foreground hover:text-foreground transition-colors" aria-label="Chat options">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {!active.is_direct && (
                      <DropdownMenuItem onClick={() => setConfirm({ kind: "leave" })}>
                        <LogOut className="w-4 h-4 mr-2" /> Leave chat
                      </DropdownMenuItem>
                    )}
                    {active.is_direct && otherMember && (
                      <DropdownMenuItem onClick={() => setConfirm({ kind: "block", targetId: otherMember.id, targetName: otherMember.display_name })}>
                        <Ban className="w-4 h-4 mr-2" /> Block @{otherMember.username}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setConfirm({ kind: "delete" })}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[500px]">
                {messages.length === 0 && <p className="text-sm text-muted-foreground italic">No messages yet — say hi!</p>}
                {messages.map((m) => {
                  const isMine = m.sender_id === user?.id;
                  const senderName = profiles[m.sender_id]?.display_name ?? "User";
                  return (
                    <div key={m.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-xl ${isMine ? "bg-brand-gradient text-black" : "bg-input border border-border"}`}>
                        {m.body}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {isMine ? "You" : senderName} • {new Date(m.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-4 border-t border-border mt-4">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message..."
                  className="flex-1 bg-input px-4 py-3 rounded-lg border border-border focus:outline-none focus:border-brand-yellow"
                />
                <button onClick={send} className="bg-brand-gradient text-black font-bold px-5 py-3 rounded-lg flex items-center gap-1">
                  <Send className="w-4 h-4" /> Send
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "leave" && "Leave this chat?"}
              {confirm?.kind === "delete" && "Delete this chat?"}
              {confirm?.kind === "block" && `Block ${confirm.targetName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "leave" && "You won't receive new messages. The chat will continue without you."}
              {confirm?.kind === "delete" && "This permanently removes the chat and all its messages for everyone."}
              {confirm?.kind === "block" && "You'll leave this chat and won't see messages from this user."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm?.kind === "leave") leaveChat();
                else if (confirm?.kind === "delete") deleteChat();
                else if (confirm?.kind === "block") blockUser();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {confirm?.kind === "leave" ? "Leave" : confirm?.kind === "delete" ? "Delete" : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
