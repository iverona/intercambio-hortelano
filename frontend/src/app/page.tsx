import Link from "next/link";
import ProductCard from "@/components/shared/ProductCard";

const mockProducts = [
  {
    id: "1",
    name: "Tomates Frescos",
    description: "Tomates recién cosechados de nuestra huerta.",
    imageUrl: "https://via.placeholder.com/300",
  },
  {
    id: "2",
    name: "Lechuga Romana",
    description: "Lechuga crujiente y fresca, ideal para ensaladas.",
    imageUrl: "https://via.placeholder.com/300",
  },
  {
    id: "3",
    name: "Pimientos Verdes",
    description: "Pimientos verdes orgánicos, perfectos para asar.",
    imageUrl: "https://via.placeholder.com/300",
  },
  {
    id: "4",
    name: "Cebollas",
    description: "Cebollas frescas y organicas.",
    imageUrl: "https://via.placeholder.com/300",
  },
];

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {mockProducts.map((product) => (
          <Link href={`/product/${product.id}`} key={product.id}>
            <ProductCard product={product} />
          </Link>
        ))}
      </div>
    </main>
  );
}
