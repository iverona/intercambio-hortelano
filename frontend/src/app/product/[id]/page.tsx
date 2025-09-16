import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const mockProduct = {
  name: "Tomates Frescos",
  description: "Tomates recién cosechados de nuestra huerta. Son perfectos para ensaladas, salsas o para comer solos. Cultivados sin pesticidas.",
  imageUrl: "https://via.placeholder.com/600",
  seller: {
    name: "Juan Hortelano",
    avatarUrl: "https://github.com/shadcn.png",
  },
};

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
            src={mockProduct.imageUrl}
            alt={mockProduct.name}
            className="w-full rounded-lg shadow-md"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{mockProduct.name}</h1>
          <p className="text-gray-600 mb-4">{mockProduct.description}</p>
          <div className="flex items-center space-x-4 mb-4">
            <Avatar>
              <AvatarImage src={mockProduct.seller.avatarUrl} alt={mockProduct.seller.name} />
              <AvatarFallback>
                {mockProduct.seller.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{mockProduct.seller.name}</p>
              <p className="text-sm text-gray-500">Vendedor</p>
            </div>
          </div>
          <Button size="lg">Contactar al Vendedor</Button>
        </div>
      </div>
    </main>
  );
}
