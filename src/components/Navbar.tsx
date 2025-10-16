import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, User, LogOut, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

export const Navbar = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    
    if (data) {
      setUserRole(data.role);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout berhasil");
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Home className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            KosKita
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/search")}>
            <Search className="mr-2 h-4 w-4" />
            Cari Kos
          </Button>

          {session ? (
            <>
              {userRole === "pemilik" && (
                <Button variant="default" size="sm" onClick={() => navigate("/dashboard")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                <User className="mr-2 h-4 w-4" />
                Masuk
              </Button>
              <Button size="sm" onClick={() => navigate("/auth?mode=register")}>
                Daftar
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
