import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Bed } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface KosCardProps {
  id: string;
  nama_kos: string;
  kota: string;
  tipe_kos: string;
  harga_bulanan: number;
  kamar_tersedia: number;
  image_url?: string;
}

export const KosCard = ({ id, nama_kos, kota, tipe_kos, harga_bulanan, kamar_tersedia, image_url }: KosCardProps) => {
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTipeBadgeVariant = (tipe: string) => {
    if (tipe === "putra") return "default";
    if (tipe === "putri") return "secondary";
    return "outline";
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group" onClick={() => navigate(`/kos/${id}`)}>
      <div className="relative h-48 overflow-hidden">
        <img
          src={image_url || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800"}
          alt={nama_kos}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <Badge className="absolute top-3 right-3" variant={getTipeBadgeVariant(tipe_kos)}>
          {tipe_kos === "putra" ? "Putra" : tipe_kos === "putri" ? "Putri" : "Campur"}
        </Badge>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold text-lg line-clamp-1">{nama_kos}</h3>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" />
          {kota}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Bed className="h-4 w-4 mr-1" />
            {kamar_tersedia} kamar
          </div>
          <div className="text-lg font-bold text-primary">
            {formatPrice(harga_bulanan)}
            <span className="text-sm text-muted-foreground font-normal">/bulan</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button className="w-full" variant="outline">
          Lihat Detail
        </Button>
      </CardFooter>
    </Card>
  );
};
