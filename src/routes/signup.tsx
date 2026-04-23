import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    password: "",
  });

  useEffect(() => {
    if (user) navigate({ to: "/events" });
  }, [user, navigate]);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(form).some((v) => !v)) {
      toast.error("Please fill in all fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/events`,
        data: {
          username: form.username,
          display_name: `${form.first_name} ${form.last_name}`.trim(),
          first_name: form.first_name,
          last_name: form.last_name,
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Welcome to LinkUp 🚀");
    navigate({ to: "/events" });
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-yellow";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex items-center justify-center min-h-[calc(100vh-100px)] px-4 py-10">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-bold mb-2">Join LinkUp! 🚀</h2>
          <p className="text-muted-foreground mb-6">Create an account to manage your events.</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <input className={inputClass} placeholder="First Name" value={form.first_name} onChange={update("first_name")} required />
              <input className={inputClass} placeholder="Last Name" value={form.last_name} onChange={update("last_name")} required />
            </div>
            <input className={inputClass} type="email" placeholder="Email Address" value={form.email} onChange={update("email")} required />
            <input className={inputClass} placeholder="Choose Username" value={form.username} onChange={update("username")} required />
            <input className={inputClass} type="password" placeholder="Create Password (min 6 chars)" value={form.password} onChange={update("password")} required />

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-brand-gradient text-black font-bold py-3 rounded-lg hover:scale-[1.02] transition-transform disabled:opacity-50 mt-2"
            >
              {busy ? "Creating account…" : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-yellow font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
