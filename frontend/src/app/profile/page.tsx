import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProductCard from "@/components/shared/ProductCard";

const mockUser = {
  name: "Juan Hortelano",
  email: "juan.hortelano@example.com",
  avatarUrl: "https://github.com/shadcn.png",
};

const mockProducts = [
  {
    name: "Tomates Frescos",
    description: "Tomates recién cosechados de nuestra huerta.",
    imageUrl: "https://via.placeholder.com/300",
  },
  {
    name: "Lechuga Romana",
    description: "Lechuga crujiente y fresca, ideal para ensaladas.",
    imageUrl: "https://via.placeholder.com/300",
  },
];

export default function ProfilePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} />
          <AvatarFallback>
            {mockUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{mockUser.name}</h1>
          <p className="text-gray-600">{mockUser.email}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">My Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {mockProducts.map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
        </div>
      </div>
    </main>
  );
}
