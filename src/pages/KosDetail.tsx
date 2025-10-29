import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Bed, Phone, MessageCircle, ArrowLeft, Check, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { toast } from "sonner";
import { ChatDialog } from "@/components/ChatDialog";

export default function KosDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kost, setKost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<any>(null);
  const [hasInterest, setHasInterest] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    if (id) {
      fetchKostDetail();
    }
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
      if (id) {
        checkExistingInterest(session.user.id, id);
        checkExistingConversation(session.user.id, id);
      }
    }
  };

  const checkExistingInterest = async (userId: string, kostId: string) => {
    const { data } = await supabase
      .from('interests')
      .select('id')
      .eq('student_id', userId)
      .eq('kost_id', kostId)
      .single();
    
    setHasInterest(!!data);
  };

  const checkExistingConversation = async (userId: string, kostId: string) => {
    const { data } = await supabase
      .from('conversations')
      .select('id')
      .eq('student_id', userId)
      .eq('kost_id', kostId)
      .single();
    
    if (data) setConversationId(data.id);
  };

  const fetchKostDetail = async () => {
    const { data: kostData, error } = await supabase
      .from("kosts")
      .select(`
        *,
        kost_images(image_url, is_primary),
        facilities(nama_fasilitas),
        profiles(full_name, phone)
      `)
      .eq("id", id)
      .single();

    if (kostData) {
      setKost(kostData);
      setOwner(kostData.profiles);
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

  const handleWhatsApp = () => {
    if (owner?.phone) {
      const message = encodeURIComponent(`Halo, saya tertarik dengan kos ${kost.nama_kos}`);
      window.open(`https://wa.me/${owner.phone}?text=${message}`, "_blank");
    }
  };

  const handleShowInterest = async () => {
    if (!currentUserId) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/auth");
      return;
    }

    const { error: interestError } = await supabase
      .from('interests')
      .insert([{
        kost_id: id,
        student_id: currentUserId,
        message: `Saya tertarik dengan ${kost.nama_kos}`
      }]);

    if (interestError) {
      if (interestError.code === '23505') {
        toast.error("Anda sudah menunjukkan minat pada kos ini");
      } else {
        toast.error("Gagal menunjukkan minat");
      }
      return;
    }

    // Create conversation
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .insert([{
        kost_id: id,
        owner_id: kost.owner_id,
        student_id: currentUserId
      }])
      .select()
      .single();

    if (convData) {
      setConversationId(convData.id);
      setHasInterest(true);
      toast.success("Minat berhasil dikirim! Pemilik akan segera menghubungi Anda.");
    }
  };

  const handleOpenChat = () => {
    if (!currentUserId) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/auth");
      return;
    }

    if (conversationId) {
      setChatOpen(true);
    } else {
      toast.error("Tunjukkan minat terlebih dahulu untuk memulai chat");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 text-center">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!kost) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 text-center">
          <p className="text-muted-foreground">Kos tidak ditemukan</p>
          <Button className="mt-4" onClick={() => navigate("/search")}>
            Kembali ke Pencarian
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {kost.kost_images && kost.kost_images.length > 0 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {kost.kost_images.map((img: any, index: number) => (
                    <CarouselItem key={index}>
                      <div className="relative h-[400px] rounded-lg overflow-hidden">
                        <img
                          src={img.image_url}
                          alt={`${kost.nama_kos} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            ) : (
              <div className="relative h-[400px] rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800"
                  alt={kost.nama_kos}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Details */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <h1 className="text-3xl font-bold">{kost.nama_kos}</h1>
                    <Badge variant={kost.tipe_kos === "putra" ? "default" : kost.tipe_kos === "putri" ? "secondary" : "outline"}>
                      {kost.tipe_kos === "putra" ? "Putra" : kost.tipe_kos === "putri" ? "Putri" : "Campur"}
                    </Badge>
                  </div>

                  <div className="flex items-center text-muted-foreground mb-4">
                    <MapPin className="h-5 w-5 mr-2" />
                    <p>{kost.alamat}, {kost.kecamatan ? `${kost.kecamatan}, ` : ""}{kost.kota}</p>
                  </div>

                  <div className="flex items-center gap-4 text-lg">
                    <div className="flex items-center">
                      <Bed className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>{kost.kamar_tersedia} kamar tersedia</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-3">Deskripsi</h2>
                  <p className="text-muted-foreground leading-relaxed">{kost.deskripsi}</p>
                </div>

                {kost.facilities && kost.facilities.length > 0 && (
                  <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold mb-4">Fasilitas</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {kost.facilities.map((facility: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span>{facility.nama_fasilitas}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Harga per bulan</p>
                  <p className="text-3xl font-bold text-primary">{formatPrice(kost.harga_bulanan)}</p>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold">Pemilik Kos</h3>
                  <p className="text-muted-foreground">{owner?.full_name || "Nama tidak tersedia"}</p>

                  {currentUserId && currentUserId !== kost.owner_id && (
                    <div className="space-y-2 mb-4">
                      {!hasInterest ? (
                        <Button className="w-full" onClick={handleShowInterest}>
                          <Heart className="mr-2 h-4 w-4" />
                          Saya Tertarik
                        </Button>
                      ) : (
                        <Button className="w-full" onClick={handleOpenChat}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Buka Chat
                        </Button>
                      )}
                    </div>
                  )}

                  {owner?.phone && (
                    <div className="space-y-2">
                      <Button className="w-full" variant="outline" onClick={handleWhatsApp}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Hubungi via WhatsApp
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <a href={`tel:${owner.phone}`}>
                          <Phone className="mr-2 h-4 w-4" />
                          Telepon
                        </a>
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <p className="text-xs text-muted-foreground">
                    Pastikan untuk mengecek langsung kondisi kos sebelum melakukan pembayaran
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {conversationId && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          conversationId={conversationId}
          otherUserName={owner?.full_name || "Pemilik"}
        />
      )}
    </div>
  );
}
