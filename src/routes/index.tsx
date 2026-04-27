import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth";
import { Calendar, Users, MessageCircle, ListTodo } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/events" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-10 pb-20 md:pt-14">
        <section className="text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
            Let your plans make it out
            <br />
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              the groupchat
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            RSVP, assign tasks, plan logistics, all in one place.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link
              to="/signup"
              className="bg-brand-gradient text-black font-bold px-8 py-3 rounded-full shadow-brand hover:scale-105 transition-transform"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="border-2 border-brand-yellow text-brand-yellow font-bold px-8 py-3 rounded-full hover:bg-brand-yellow hover:text-black transition-colors"
            >
              Log in
            </Link>
          </div>
        </section>

        <section className="grid md:grid-cols-4 gap-6 mt-24">
          {[
            { icon: Calendar, title: "Smart calendar", desc: "See every event in one view." },
            { icon: ListTodo, title: "Group to-dos", desc: "Assign and track tasks together." },
            { icon: Users, title: "Friend network", desc: "Build your guest list quickly." },
            { icon: MessageCircle, title: "Event chat", desc: "Coordinate without the chaos." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-6 text-center">
              <Icon className="w-10 h-10 mx-auto text-brand-yellow mb-3" />
              <h3 className="font-bold text-lg mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
