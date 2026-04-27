import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Search, Check, X, UserPlus, Mail, MessageSquare, Copy, Share2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/friends")({
  component: FriendsPage,
});

interface Profile {
  id: string;
  username: string;
  display_name: string;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
}

function FriendsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  const loadData = async () => {
    if (!user) return;
    const { data: fs } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    setFriendships(fs ?? []);

    const otherIds = new Set<string>();
    (fs ?? []).forEach((f) => {
      otherIds.add(f.requester_id === user.id ? f.addressee_id : f.requester_id);
    });
    if (otherIds.size) {
      const { data: ps } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", [...otherIds]);
      setProfiles(Object.fromEntries((ps ?? []).map((p) => [p.id, p])));
    }
  };

  useEffect(() => { loadData(); }, [user]);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
        .neq("id", user?.id ?? "")
        .limit(8);
      setResults(data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [search, user]);

  const sendRequest = async (addresseeId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: "pending",
    });
    if (error) { toast.error("Already requested or friends"); return; }
    toast.success("Friend request sent!");
    loadData();
  };

  const respond = async (id: string, status: "accepted" | "declined") => {
    await supabase.from("friendships").update({ status }).eq("id", id);
    toast.success(status === "accepted" ? "Friend added!" : "Request declined");
    loadData();
  };

  const removeFriend = async (id: string) => {
    if (!confirm("Remove this friend?")) return;
    await supabase.from("friendships").delete().eq("id", id);
    loadData();
  };

  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter((f) => f.status === "pending" && f.addressee_id === user?.id);
  const outgoing = friendships.filter((f) => f.status === "pending" && f.requester_id === user?.id);

  const otherId = (f: Friendship) => (f.requester_id === user?.id ? f.addressee_id : f.requester_id);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-8 sm:space-y-6">
          <section className="sm:bg-card sm:border sm:border-border rounded-xl p-0 sm:p-6">
            <h2 className="text-xl font-bold mb-1">Find Friends 🔍</h2>
            <p className="text-sm text-muted-foreground mb-4">Search by username or name</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by @username or name..."
                className="w-full bg-input pl-10 pr-4 py-3 rounded-lg border border-border focus:outline-none focus:border-brand-yellow"
              />
            </div>
            {results.length > 0 && (
              <ul className="mt-4 space-y-2">
                {results.map((p) => {
                  const existing = friendships.find((f) => otherId(f) === p.id);
                  return (
                    <li key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <span className="text-brand-yellow font-bold">@{p.username}</span>
                        <span className="text-muted-foreground ml-2">"{p.display_name}"</span>
                      </div>
                      {existing ? (
                        <span className="text-xs text-muted-foreground">{existing.status}</span>
                      ) : (
                        <button onClick={() => sendRequest(p.id)} className="bg-brand-gradient text-black font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
                          <UserPlus className="w-3 h-3" /> Add
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="sm:bg-card sm:border sm:border-border rounded-xl p-0 sm:p-6">
            <h2 className="text-xl font-bold mb-1">My Network 👥</h2>
            <p className="text-sm text-muted-foreground mb-4">{accepted.length} connected friend{accepted.length === 1 ? "" : "s"}</p>
            <ul className="divide-y divide-border">
              {accepted.length === 0 && <li className="text-sm text-muted-foreground italic py-3">No friends yet — search above to add some!</li>}
              {accepted.map((f) => {
                const p = profiles[otherId(f)];
                if (!p) return null;
                return (
                  <li key={f.id} className="flex items-center justify-between py-3">
                    <div>
                      <span className="text-brand-yellow font-bold">@{p.username}</span>
                      <span className="text-muted-foreground ml-2">"{p.display_name}"</span>
                    </div>
                    <button onClick={() => removeFriend(f.id)} className="bg-input hover:bg-destructive hover:text-destructive-foreground px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="space-y-8 sm:space-y-6">
          <section className="sm:bg-card sm:border sm:border-border rounded-xl p-0 sm:p-6">
            <h2 className="text-xl font-bold mb-1">Friend Requests 🔔</h2>
            <p className="text-sm text-muted-foreground mb-4">{incoming.length} waiting</p>
            <ul className="space-y-2">
              {incoming.length === 0 && <li className="text-sm text-muted-foreground italic">No new requests.</li>}
              {incoming.map((f) => {
                const p = profiles[otherId(f)];
                if (!p) return null;
                return (
                  <li key={f.id} className="bg-input p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-brand-yellow font-bold">@{p.username}</span>
                      <span className="text-muted-foreground ml-2">"{p.display_name}"</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => respond(f.id, "accepted")} className="bg-going text-black px-3 py-1.5 rounded-lg font-bold">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => respond(f.id, "declined")} className="bg-no text-black px-3 py-1.5 rounded-lg font-bold">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {outgoing.length > 0 && (
            <section className="sm:bg-card sm:border sm:border-border rounded-xl p-0 sm:p-6">
              <h2 className="text-xl font-bold mb-3">Pending Sent ✉️</h2>
              <ul className="space-y-2">
                {outgoing.map((f) => {
                  const p = profiles[otherId(f)];
                  if (!p) return null;
                  return (
                    <li key={f.id} className="text-sm">
                      <span className="text-brand-yellow font-bold">@{p.username}</span>
                      <span className="text-muted-foreground ml-2">"{p.display_name}"</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
