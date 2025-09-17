import { Icon } from "@iconify/react";
import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Card, CardContent } from "@kaa/ui/components/card";

const testimonials = [
  {
    quote:
      "RentaAI has completely transformed how I manage my 50 properties in Nairobi. The AI tenant screening has reduced bad tenants by 90%.",
    name: "James Kimani",
    role: "Property Manager, Nairobi",
    avatar: "JK",
    image:
      "https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png",
  },
  {
    quote:
      "The M-Pesa integration is seamless. I now collect 98% of rent on time compared to 70% before using RentaAI.",
    name: "Mary Njeri",
    role: "Real Estate Investor, Mombasa",
    avatar: "MN",
    image:
      "https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png",
  },
  {
    quote:
      "The AI assistant handles tenant queries in Swahili perfectly. My tenants love the instant responses and I save 10 hours per week.",
    name: "Peter Ochieng",
    role: "Property Owner, Kisumu",
    avatar: "PO",
    image:
      "https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png",
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-emerald-50 px-4 py-20">
      <div className="container mx-auto">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold font-heading text-4xl text-emerald-900">
            Trusted by Property Managers Across Kenya
          </h2>
          <p className="text-emerald-700 text-xl">
            See how RentaAI is transforming property management in Kenya
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card className="border-emerald-200 bg-white" key={`${index + 1}`}>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center space-x-1">
                  {[new Array(5)].map((_, i) => (
                    <Icon
                      className="h-5 w-5 text-yellow-500"
                      icon="material-symbols:star"
                      key={`${i + 1}`}
                    />
                  ))}
                </div>
                <p className="mb-4 text-emerald-700">"{testimonial.quote}"</p>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={testimonial.image} />
                    <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-emerald-800">
                      {testimonial.name}
                    </div>
                    <div className="text-emerald-600 text-sm">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
