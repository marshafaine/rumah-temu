import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, MapPin, Bed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const navigate = useNavigate();
  const [kosts, setKosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKost, setEditingKost] = useState<any>(null);
  
  // Form states
  const [namaKos, setNamaKos] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [alamat, setAlamat] = useState("");
  const [kota, setKota] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [tipeKos, setTipeKos] = useState<"putra" | "putri" | "campur">("putra");
  const [hargaBulanan, setHargaBulanan] = useState("");
  const [kamarTersedia, setKamarTersedia] = useState("");

  useEffect(() => {
    checkAuth();
    fetchUserKosts();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "pemilik") {
      toast.error("Anda tidak memiliki akses ke dashboard ini");
      navigate("/");
    }
  };

  const fetchUserKosts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("kosts")
      .select(`
        *,
        kost_images(image_url, is_primary)
      `)
      .eq("owner_id", session.user.id)
      .order("created_at", { ascending: false });

    if (data) {
      const kostsWithImages = data.map((kost) => ({
        ...kost,
        image_url: kost.kost_images?.find((img: any) => img.is_primary)?.image_url || kost.kost_images?.[0]?.image_url,
      }));
      setKosts(kostsWithImages);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setNamaKos("");
    setDeskripsi("");
    setAlamat("");
    setKota("");
    setKecamatan("");
    setTipeKos("putra");
    setHargaBulanan("");
    setKamarTersedia("");
    setEditingKost(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const kostData = {
      owner_id: session.user.id,
      nama_kos: namaKos,
      deskripsi,
      alamat,
      kota,
      kecamatan,
      tipe_kos: tipeKos,
      harga_bulanan: parseInt(hargaBulanan),
      kamar_tersedia: parseInt(kamarTersedia),
    };

    if (editingKost) {
      const { error } = await supabase
        .from("kosts")
        .update(kostData)
        .eq("id", editingKost.id);

      if (error) {
        toast.error("Gagal mengupdate kos");
      } else {
        toast.success("Kos berhasil diupdate");
        fetchUserKosts();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("kosts")
        .insert([kostData]);

      if (error) {
        toast.error("Gagal menambahkan kos");
      } else {
        toast.success("Kos berhasil ditambahkan");
        fetchUserKosts();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleEdit = (kost: any) => {
    setEditingKost(kost);
    setNamaKos(kost.nama_kos);
    setDeskripsi(kost.deskripsi);
    setAlamat(kost.alamat);
    setKota(kost.kota);
    setKecamatan(kost.kecamatan || "");
    setTipeKos(kost.tipe_kos);
    setHargaBulanan(kost.harga_bulanan.toString());
    setKamarTersedia(kost.kamar_tersedia.toString());
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kos ini?")) return;

    const { error } = await supabase
      .from("kosts")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Gagal menghapus kos");
    } else {
      toast.success("Kos berhasil dihapus");
      fetchUserKosts();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Pemilik</h1>
            <p className="text-muted-foreground mt-2">Kelola semua listing kos Anda</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kos Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingKost ? "Edit Kos" : "Tambah Kos Baru"}</DialogTitle>
                <DialogDescription>
                  Lengkapi informasi kos Anda dengan detail
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Kos</Label>
                  <Input
                    id="nama"
                    value={namaKos}
                    onChange={(e) => setNamaKos(e.target.value)}
                    placeholder="Contoh: Kos Sederhana Dekat Kampus"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Jelaskan detail kos Anda..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kota">Kota</Label>
                    <Input
                      id="kota"
                      value={kota}
                      onChange={(e) => setKota(e.target.value)}
                      placeholder="Contoh: Yogyakarta"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kecamatan">Kecamatan</Label>
                    <Input
                      id="kecamatan"
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      placeholder="Contoh: Depok"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alamat">Alamat Lengkap</Label>
                  <Textarea
                    id="alamat"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Jalan lengkap dengan nomor"
                    rows={2}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipe">Tipe Kos</Label>
                    <Select value={tipeKos} onValueChange={(value: "putra" | "putri" | "campur") => setTipeKos(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="putra">Putra</SelectItem>
                        <SelectItem value="putri">Putri</SelectItem>
                        <SelectItem value="campur">Campur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="harga">Harga/Bulan</Label>
                    <Input
                      id="harga"
                      type="number"
                      value={hargaBulanan}
                      onChange={(e) => setHargaBulanan(e.target.value)}
                      placeholder="1000000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kamar">Kamar Tersedia</Label>
                    <Input
                      id="kamar"
                      type="number"
                      value={kamarTersedia}
                      onChange={(e) => setKamarTersedia(e.target.value)}
                      placeholder="5"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  {editingKost ? "Update Kos" : "Tambah Kos"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        ) : kosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kosts.map((kost) => (
              <Card key={kost.id} className="overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={kost.image_url || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800"}
                    alt={kost.nama_kos}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-3 right-3" variant={kost.is_active ? "default" : "secondary"}>
                    {kost.is_active ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>
                
                <CardHeader>
                  <CardTitle className="line-clamp-1">{kost.nama_kos}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    {kost.kota}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      {kost.kamar_tersedia} kamar
                    </div>
                    <div className="font-bold text-primary">
                      {formatPrice(kost.harga_bulanan)}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(kost)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(kost.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Anda belum memiliki listing kos. Mulai tambahkan kos pertama Anda!
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kos Pertama
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
