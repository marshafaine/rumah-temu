import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { KosCard } from "@/components/KosCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-kos.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredKosts, setFeaturedKosts] = useState<any[]>([]);

  useEffect(() => {
    fetchFeaturedKosts();
  }, []);

  const fetchFeaturedKosts = async () => {
    const { data, error } = await supabase
      .from("kosts")
      .select(`
        *,
        kost_images(image_url, is_primary)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (data) {
      const kostsWithImages = data.map((kost) => ({
        ...kost,
        image_url: kost.kost_images?.find((img: any) => img.is_primary)?.image_url || kost.kost_images?.[0]?.image_url,
      }));
      setFeaturedKosts(kostsWithImages);
    }
  };

  const handleSearch = () => {
    navigate(`/search?q=${searchQuery}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-accent/60" />
        </div>

        <div className="container relative z-10 text-center text-white space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold animate-fade-in">
            Temukan Kos Impianmu
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            Platform terpercaya untuk mahasiswa mencari kos nyaman dan terjangkau
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto bg-white rounded-full p-2 shadow-strong flex gap-2">
            <div className="flex-1 flex items-center px-4">
              <MapPin className="h-5 w-5 text-muted-foreground mr-2" />
              <Input
                placeholder="Cari berdasarkan kota atau lokasi..."
                className="border-0 focus-visible:ring-0 text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button size="lg" className="rounded-full" onClick={handleSearch}>
              <Search className="mr-2 h-5 w-5" />
              Cari Kos
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Pencarian Mudah</h3>
              <p className="text-muted-foreground">
                Filter kos berdasarkan lokasi, harga, dan fasilitas yang kamu butuhkan
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Terpercaya</h3>
              <p className="text-muted-foreground">
                Semua listing kos telah diverifikasi untuk keamanan dan kenyamanan Anda
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Proses Cepat</h3>
              <p className="text-muted-foreground">
                Hubungi pemilik kos langsung melalui WhatsApp atau telepon
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Kosts */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Kos Unggulan</h2>
              <p className="text-muted-foreground mt-2">Pilihan terbaik dari berbagai kota</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/search")}>
              Lihat Semua
            </Button>
          </div>

          {featuredKosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredKosts.map((kost) => (
                <KosCard
                  key={kost.id}
                  id={kost.id}
                  nama_kos={kost.nama_kos}
                  kota={kost.kota}
                  tipe_kos={kost.tipe_kos}
                  harga_bulanan={kost.harga_bulanan}
                  kamar_tersedia={kost.kamar_tersedia}
                  image_url={kost.image_url}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Belum ada kos yang tersedia. Jadilah yang pertama mendaftarkan kos Anda!
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-accent">
        <div className="container text-center text-white space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Punya Kos untuk Disewakan?</h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Daftarkan kos Anda dan jangkau ribuan mahasiswa yang mencari tempat tinggal
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth?mode=register")}>
            Daftar Sebagai Pemilik
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/30">
        <div className="container text-center text-muted-foreground">
          <p>&copy; 2025 KosKita. Platform pencarian kos digital untuk mahasiswa Indonesia.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
