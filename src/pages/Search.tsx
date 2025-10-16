import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { KosCard } from "@/components/KosCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [kosts, setKosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [tipeKos, setTipeKos] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState([5000000]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKosts();
  }, [searchQuery, tipeKos, maxPrice]);

  const fetchKosts = async () => {
    setLoading(true);
    let query = supabase
      .from("kosts")
      .select(`
        *,
        kost_images(image_url, is_primary)
      `)
      .eq("is_active", true)
      .lte("harga_bulanan", maxPrice[0]);

    if (searchQuery) {
      query = query.or(`nama_kos.ilike.%${searchQuery}%,kota.ilike.%${searchQuery}%,kecamatan.ilike.%${searchQuery}%`);
    }

    if (tipeKos !== "all") {
      query = query.eq("tipe_kos", tipeKos as "putra" | "putri" | "campur");
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (data) {
      const kostsWithImages = data.map((kost) => ({
        ...kost,
        image_url: kost.kost_images?.find((img: any) => img.is_primary)?.image_url || kost.kost_images?.[0]?.image_url,
      }));
      setKosts(kostsWithImages);
    }
    setLoading(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const FilterSection = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Pencarian</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Cari kota, lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button size="icon">
            <SearchIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipe Kos</Label>
        <Select value={tipeKos} onValueChange={setTipeKos}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="putra">Putra</SelectItem>
            <SelectItem value="putri">Putri</SelectItem>
            <SelectItem value="campur">Campur</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Harga Maksimal: {formatPrice(maxPrice[0])}</Label>
        <Slider
          value={maxPrice}
          onValueChange={setMaxPrice}
          min={500000}
          max={5000000}
          step={100000}
        />
      </div>

      <Button className="w-full" onClick={fetchKosts}>
        Terapkan Filter
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-80 space-y-6">
            <div className="sticky top-24 bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Filter Pencarian
              </h2>
              <FilterSection />
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Hasil Pencarian</h1>
                <p className="text-muted-foreground mt-1">
                  Ditemukan {kosts.length} kos
                </p>
              </div>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filter Pencarian</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSection />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Memuat data...</p>
              </div>
            ) : kosts.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {kosts.map((kost) => (
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
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Tidak ada kos yang sesuai dengan kriteria pencarian Anda
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
