import { motion } from "framer-motion";
import { PropertyCard } from "../properties/components/property-card";

const properties = [
  {
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    title: "Modern Apartment in Westlands",
    location: "Westlands, Nairobi",
    price: "KES 85,000",
    beds: 3,
    baths: 2,
    area: "120 sqm",
    featured: true,
  },
  {
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    title: "Luxury Villa with Garden",
    location: "Karen, Nairobi",
    price: "KES 250,000",
    beds: 5,
    baths: 4,
    area: "350 sqm",
    featured: true,
  },
  {
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    title: "Beachfront Apartment",
    location: "Nyali, Mombasa",
    price: "KES 95,000",
    beds: 2,
    baths: 2,
    area: "95 sqm",
    featured: false,
  },
  {
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    title: "Family Home in Lavington",
    location: "Lavington, Nairobi",
    price: "KES 150,000",
    beds: 4,
    baths: 3,
    area: "220 sqm",
    featured: false,
  },
  {
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
    title: "Studio in Kilimani",
    location: "Kilimani, Nairobi",
    price: "KES 45,000",
    beds: 1,
    baths: 1,
    area: "45 sqm",
    featured: false,
  },
  {
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
    title: "Penthouse with City Views",
    location: "Upperhill, Nairobi",
    price: "KES 180,000",
    beds: 3,
    baths: 3,
    area: "160 sqm",
    featured: true,
  },
];

export default function FeaturedProperties() {
  return (
    <section className="bg-muted/30 py-20" id="properties">
      <div className="container mx-auto px-4">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="mb-4 bg-gradient-hero bg-clip-text font-bold text-4xl text-transparent md:text-5xl">
            Featured Properties
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
            Handpicked properties from our extensive collection across Kenya
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property, index) => (
            <PropertyCard
              index={index}
              key={property.title}
              property={property as any}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
