import { Icon } from "@iconify/react";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import Image from "next/image";

export default function ForTenantsPage() {
  return (
    <div>
      <section className="px-4 py-20">
        <div className="container mx-auto text-center">
          <div className="mx-auto max-w-4xl">
            <Badge className="mb-6 border-emerald-200 bg-emerald-100 text-emerald-700">
              <Icon className="mr-2 h-4 w-4" icon="mdi:sparkles" />
              AI-Powered Property Search
            </Badge>
            <h1 className="mb-6 font-bold font-heading text-5xl text-emerald-900 md:text-6xl">
              Find Your Perfect
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Kenyan Home
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-emerald-700 text-xl">
              Discover rental properties across Kenya with our AI-powered
              platform. From Nairobi apartments to Mombasa villas, find your
              ideal home with intelligent matching and virtual tours.
            </p>
            <Card className="mx-auto mb-12 max-w-2xl border-emerald-200 bg-white/90 shadow-xl backdrop-blur-sm">
              <CardContent className="px-6 py-6">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <Input
                      className="border-emerald-200 focus:border-emerald-500"
                      placeholder="Enter location (e.g., Westlands, Nairobi)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select>
                      <SelectTrigger className="w-32 border-emerald-200">
                        <SelectValue placeholder="Budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20k-50k">KES 20K-50K</SelectItem>
                        <SelectItem value="50k-100k">KES 50K-100K</SelectItem>
                        <SelectItem value="100k+">KES 100K+</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="bg-emerald-600 px-8 text-white hover:bg-emerald-700">
                      <Icon className="mr-2 h-5 w-5" icon="mdi:magnify" />
                      Search
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
              <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm transition-shadow hover:shadow-lg">
                <CardContent className="px-6 py-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <Icon
                      className="h-6 w-6 text-emerald-600"
                      icon="mdi:robot"
                    />
                  </div>
                  <h3 className="mb-2 font-heading font-semibold text-emerald-900">
                    AI Matching
                  </h3>
                  <p className="text-emerald-700 text-sm">
                    Smart algorithms match you with properties based on your
                    preferences and lifestyle
                  </p>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm transition-shadow hover:shadow-lg">
                <CardContent className="px-6 py-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <Icon
                      className="h-6 w-6 text-emerald-600"
                      icon="mdi:virtual-reality"
                    />
                  </div>
                  <h3 className="mb-2 font-heading font-semibold text-emerald-900">
                    Virtual Tours
                  </h3>
                  <p className="text-emerald-700 text-sm">
                    Explore properties from anywhere with immersive 360° virtual
                    tours
                  </p>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm transition-shadow hover:shadow-lg">
                <CardContent className="px-6 py-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <Icon
                      className="h-6 w-6 text-emerald-600"
                      icon="mdi:shield-check"
                    />
                  </div>
                  <h3 className="mb-2 font-heading font-semibold text-emerald-900">
                    Verified Listings
                  </h3>
                  <p className="text-emerald-700 text-sm">
                    All properties are verified and vetted for authenticity and
                    quality
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white/50 px-4 py-16">
        <div className="container mx-auto">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-bold font-heading text-3xl text-emerald-900 md:text-4xl">
              Featured Properties
            </h2>
            <p className="mx-auto max-w-2xl text-emerald-700">
              Discover handpicked rental properties across Kenya's major cities
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="overflow-hidden border-emerald-200 bg-white transition-shadow hover:shadow-xl">
              <div className="relative">
                <Image
                  alt="Property"
                  className="h-48 w-full object-cover"
                  src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png"
                />
                <Badge className="absolute top-3 left-3 bg-emerald-600 text-white">
                  <Icon className="mr-1 h-3 w-3" icon="mdi:star" />
                  Featured
                </Badge>
                <div className="absolute top-3 right-3 rounded-full bg-white/90 p-2 backdrop-blur-sm">
                  <Icon
                    className="h-4 w-4 text-emerald-600"
                    icon="mdi:heart-outline"
                  />
                </div>
              </div>
              <CardContent className="px-6 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-emerald-900">
                    Modern 2BR Apartment
                  </h3>
                  <span className="font-bold text-emerald-600">KES 85,000</span>
                </div>
                <p className="mb-3 flex items-center text-emerald-700 text-sm">
                  <Icon className="mr-1 h-4 w-4" icon="mdi:map-marker" />
                  Westlands, Nairobi
                </p>
                <div className="flex items-center justify-between text-emerald-600 text-sm">
                  <span className="flex items-center">
                    <Icon className="mr-1 h-4 w-4" icon="mdi:bed" />2 Beds
                  </span>
                  <span className="flex items-center">
                    <Icon className="mr-1 h-4 w-4" icon="mdi:shower" />2 Baths
                  </span>
                  <span className="flex items-center">
                    <Icon className="mr-1 h-4 w-4" icon="mdi:car" />
                    Parking
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-emerald-200 bg-white transition-shadow hover:shadow-xl">
              <div className="relative">
                <Image
                  alt="Property"
                  className="h-48 w-full object-cover"
                  src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png"
                />
                <Badge className="absolute top-3 left-3 bg-teal-600 text-white">
                  <Icon className="mr-1 h-3 w-3" icon="mdi:home-variant" />
                  Villa
                </Badge>
                <div className="absolute top-3 right-3 rounded-full bg-white/90 p-2 backdrop-blur-sm">
                  <Icon
                    className="h-4 w-4 text-emerald-600"
                    icon="mdi:heart-outline"
                  />
                </div>
              </div>
              <CardContent className="px-6 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-emerald-900">
                    Beachfront Villa
                  </h3>
                  <span className="font-bold text-emerald-600">
                    KES 120,000
                  </span>
                </div>
                <p className="mb-3 flex items-center text-emerald-700 text-sm">
                  <Icon className="mr-1 h-4 w-4" icon="mdi:map-marker" />
                  Diani Beach, Mombasa
                </p>
                <div className="flex items-center justify-between text-emerald-600 text-sm">
                  <span className="flex items-center">
                    <Icon className="mr-1 h-4 w-4" icon="mdi:bed" />3 Beds
                  </span>
                  <span className="flex items-center">
                    <Icon className="mr-1 h-4 w-4" icon="mdi:shower" />3 Baths
                  </span>
                  <span className="flex items-center">
                    <Icon className="mr-1 h-4 w-4" icon="mdi:waves" />
                    Beach
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-emerald-200 bg-white transition-shadow hover:shadow-xl">
              <div className="relative">
                <Image
                  alt="Property"
                  className="h-48 w-full object-cover"
                  src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png"
                />
                <Badge className="absolute top-3 left-3 bg-emerald-500 text-white">
                  <Icon className="mr-1 h-3 w-3" icon="mdi:leaf" />
                  Eco-Friendly
                </Badge>
                <div className="absolute top-3 right-3 rounded-full bg-white/90 p-2 backdrop-blur-sm">
                  <Icon
                    className="h-4 w-4 text-emerald-600"
                    icon="mdi:heart-outline"
                  />
                </div>
              </div>
              <CardContent className="px-6 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-emerald-900">
                    Garden Apartment
                  </h3>
                  <span className="font-bold text-emerald-600">KES 65,000</span>
                </div>
                <p className="mb-3 flex items-center text-emerald-700 text-sm">
                  <Icon className="mr-1 h-4 w-4" icon="mdi:map-marker" />
                  Karen, Nairobi
                </p>
                <div className="flex items-center justify-between text-emerald-600 text-sm">
                  <span className="flex items-center">
                    <Icon className="mr-1 h-4 w-4" icon="mdi:bed" />1 Bed
                  </span>
                  <span className="flex items-center">
                    <Icon className="mr-1 h-4 w-4" icon="mdi:shower" />1 Bath
                  </span>
                  <span className="flex items-center">
                    <Icon className="mr-1 h-4 w-4" icon="mdi:flower" />
                    Garden
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-12 text-center">
            <Button className="bg-emerald-600 px-8 py-3 text-white hover:bg-emerald-700">
              View All Properties
              <Icon className="ml-2 h-5 w-5" icon="mdi:arrow-right" />
            </Button>
          </div>
        </div>
      </section>
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-16">
        <div className="container mx-auto text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 font-bold font-heading text-3xl text-white md:text-4xl">
              Your AI-Powered Rental Assistant
            </h2>
            <p className="mb-8 text-emerald-100 text-lg">
              Meet Nyumba, your intelligent property assistant that understands
              your needs and preferences to find the perfect rental match.
            </p>
            <Card className="mx-auto max-w-2xl border-emerald-300/20 bg-white/10 text-white backdrop-blur-md">
              <CardContent className="px-6 py-8">
                <div className="mb-6 flex items-center space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                    <Icon className="h-6 w-6 text-white" icon="mdi:robot" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Nyumba AI Assistant</h3>
                    <p className="text-emerald-100 text-sm">Online now</p>
                  </div>
                </div>
                <div className="mb-4 rounded-lg bg-white/10 p-4 text-left">
                  <p className="text-sm">
                    "I found 3 properties in Westlands that match your budget of
                    KES 80,000 and preference for modern amenities. Would you
                    like me to schedule virtual tours?"
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    className="border-white/20 bg-white/10 text-white placeholder:text-emerald-200"
                    placeholder="Ask me anything about rentals..."
                  />
                  <Button
                    className="bg-white text-emerald-600 hover:bg-emerald-50"
                    variant="secondary"
                  >
                    <Icon className="h-4 w-4" icon="mdi:send" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="bg-white/50 px-4 py-16">
        <div className="container mx-auto">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-bold font-heading text-3xl text-emerald-900 md:text-4xl">
              Why Choose NyumbaAI?
            </h2>
            <p className="mx-auto max-w-2xl text-emerald-700">
              Experience the future of property rental with our innovative
              features designed for the Kenyan market
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-emerald-200 bg-white text-center transition-shadow hover:shadow-lg">
              <CardContent className="px-6 py-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Icon
                    className="h-8 w-8 text-white"
                    icon="mdi:lightning-bolt"
                  />
                </div>
                <h3 className="mb-2 font-heading font-semibold text-emerald-900">
                  Instant Matching
                </h3>
                <p className="text-emerald-700 text-sm">
                  Get property recommendations in seconds based on your criteria
                </p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-white text-center transition-shadow hover:shadow-lg">
              <CardContent className="px-6 py-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Icon className="h-8 w-8 text-white" icon="mdi:phone" />
                </div>
                <h3 className="mb-2 font-heading font-semibold text-emerald-900">
                  M-Pesa Integration
                </h3>
                <p className="text-emerald-700 text-sm">
                  Pay rent and deposits seamlessly through M-Pesa
                </p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-white text-center transition-shadow hover:shadow-lg">
              <CardContent className="px-6 py-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Icon className="h-8 w-8 text-white" icon="mdi:translate" />
                </div>
                <h3 className="mb-2 font-heading font-semibold text-emerald-900">
                  Local Languages
                </h3>
                <p className="text-emerald-700 text-sm">
                  Support for Swahili, English, and other local languages
                </p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-white text-center transition-shadow hover:shadow-lg">
              <CardContent className="px-6 py-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Icon className="h-8 w-8 text-white" icon="mdi:security" />
                </div>
                <h3 className="mb-2 font-heading font-semibold text-emerald-900">
                  Safe & Secure
                </h3>
                <p className="text-emerald-700 text-sm">
                  End-to-end encryption and verified property owners
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="bg-emerald-50 px-4 py-16">
        <div className="container mx-auto text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 font-bold font-heading text-3xl text-emerald-900 md:text-4xl">
              Ready to Find Your Dream Home?
            </h2>
            <p className="mb-8 text-emerald-700 text-lg">
              Join thousands of satisfied tenants who found their perfect rental
              through NyumbaAI
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button className="bg-emerald-600 px-8 py-3 text-lg text-white hover:bg-emerald-700">
                Start Your Search
                <Icon className="ml-2 h-5 w-5" icon="mdi:arrow-right" />
              </Button>
              <Button
                className="border-emerald-600 px-8 py-3 text-emerald-600 text-lg hover:bg-emerald-50"
                variant="outline"
              >
                <Icon className="mr-2 h-5 w-5" icon="mdi:play" />
                Watch Demo
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center space-x-8 text-emerald-600">
              <div className="flex items-center">
                <Icon className="mr-2 h-5 w-5" icon="mdi:check-circle" />
                <span>No hidden fees</span>
              </div>
              <div className="flex items-center">
                <Icon className="mr-2 h-5 w-5" icon="mdi:check-circle" />
                <span>Free to use</span>
              </div>
              <div className="flex items-center">
                <Icon className="mr-2 h-5 w-5" icon="mdi:check-circle" />
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
