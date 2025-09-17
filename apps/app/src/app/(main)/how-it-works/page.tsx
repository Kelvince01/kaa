import { Icon } from "@iconify/react";
import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "How It Works",
  description: "How It Works",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
      {/* <header className="sticky top-0 z-50 border-emerald-200 border-b bg-white/80 backdrop-blur-sm">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
								<Icon icon="material-symbols:home" className="h-5 w-5 text-white" />
							</div>
							<span className="font-bold font-heading text-emerald-900 text-xl">RentKenya</span>
						</div>
						<nav className="hidden items-center space-x-8 md:flex">
							<a
								href="/features"
								className="text-emerald-700 transition-colors hover:text-emerald-900"
							>
								Features
							</a>
							<a
								href="/pricing"
								className="text-emerald-700 transition-colors hover:text-emerald-900"
							>
								Pricing
							</a>
							<a
								href="/about"
								className="text-emerald-700 transition-colors hover:text-emerald-900"
							>
								About
							</a>
							<Button
								variant="outline"
								className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
							>
								Sign In
							</Button>
							<Button className="bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
						</nav>
					</div>
				</div>
			</header> */}
      <section className="px-4 py-20">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 border-emerald-200 bg-emerald-100 text-emerald-800">
            <Icon
              className="mr-2 h-4 w-4"
              icon="material-symbols:auto-awesome"
            />
            AI-Powered Property Management
          </Badge>
          <h1 className="mb-6 font-bold font-heading text-5xl text-emerald-900 md:text-6xl">
            How RentKenya <span className="text-emerald-600">Transforms</span>{" "}
            Property Rental
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-emerald-700 text-xl">
            Discover how our AI-powered platform simplifies property management
            for landlords and tenants across Kenya, from Nairobi to Mombasa and
            beyond.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              className="bg-emerald-600 px-8 text-lg hover:bg-emerald-700"
              size="lg"
            >
              <Icon
                className="mr-2 h-5 w-5"
                icon="material-symbols:play-circle"
              />
              Watch Demo
            </Button>
            <Button
              className="border-emerald-600 px-8 text-emerald-600 text-lg hover:bg-emerald-50"
              size="lg"
              variant="outline"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>
      <section className="bg-white px-4 py-16">
        <div className="container mx-auto">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold font-heading text-4xl text-emerald-900">
              Simple Steps to Success
            </h2>
            <p className="mx-auto max-w-2xl text-emerald-700 text-lg">
              Our AI-powered platform makes property management effortless in
              just three simple steps
            </p>
          </div>
          <div className="mb-16 grid gap-8 md:grid-cols-3">
            <Card className="relative overflow-hidden border-emerald-200 transition-shadow hover:shadow-lg">
              <div className="absolute top-0 left-0 h-1 w-full bg-emerald-600" />
              <CardContent className="px-6 pt-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Icon
                    className="h-8 w-8 text-emerald-600"
                    icon="material-symbols:upload"
                  />
                </div>
                <div className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600">
                  <span className="font-bold text-white">1</span>
                </div>
                <h3 className="mb-3 font-heading font-semibold text-emerald-900 text-xl">
                  Upload Property Details
                </h3>
                <p className="mb-4 text-emerald-700">
                  Simply upload photos and basic information about your
                  property. Our AI analyzes location, amenities, and market
                  trends to optimize your listing.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className="bg-emerald-50 text-emerald-700"
                    variant="secondary"
                  >
                    Smart Pricing
                  </Badge>
                  <Badge
                    className="bg-emerald-50 text-emerald-700"
                    variant="secondary"
                  >
                    Auto-Description
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-emerald-200 transition-shadow hover:shadow-lg">
              <div className="absolute top-0 left-0 h-1 w-full bg-emerald-600" />
              <CardContent className="px-6 pt-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Icon
                    className="h-8 w-8 text-emerald-600"
                    icon="material-symbols:smart-toy"
                  />
                </div>
                <div className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600">
                  <span className="font-bold text-white">2</span>
                </div>
                <h3 className="mb-3 font-heading font-semibold text-emerald-900 text-xl">
                  AI Matches Tenants
                </h3>
                <p className="mb-4 text-emerald-700">
                  Our intelligent system automatically matches your property
                  with qualified tenants based on preferences, budget, and
                  location requirements.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className="bg-emerald-50 text-emerald-700"
                    variant="secondary"
                  >
                    Smart Matching
                  </Badge>
                  <Badge
                    className="bg-emerald-50 text-emerald-700"
                    variant="secondary"
                  >
                    Verification
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-emerald-200 transition-shadow hover:shadow-lg">
              <div className="absolute top-0 left-0 h-1 w-full bg-emerald-600" />
              <CardContent className="px-6 pt-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Icon
                    className="h-8 w-8 text-emerald-600"
                    icon="material-symbols:handshake"
                  />
                </div>
                <div className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600">
                  <span className="font-bold text-white">3</span>
                </div>
                <h3 className="mb-3 font-heading font-semibold text-emerald-900 text-xl">
                  Seamless Management
                </h3>
                <p className="mb-4 text-emerald-700">
                  Handle rent collection, maintenance requests, and tenant
                  communication all from one dashboard. M-Pesa integration makes
                  payments instant.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className="bg-emerald-50 text-emerald-700"
                    variant="secondary"
                  >
                    M-Pesa Pay
                  </Badge>
                  <Badge
                    className="bg-emerald-50 text-emerald-700"
                    variant="secondary"
                  >
                    Auto-Reminders
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-16">
        <div className="container mx-auto">
          <div className="mb-16 text-center">
            <Badge className="mb-4 bg-emerald-600 text-white">
              <Icon
                className="mr-2 h-4 w-4"
                icon="material-symbols:psychology"
              />
              AI-Powered Intelligence
            </Badge>
            <h2 className="mb-4 font-bold font-heading text-4xl text-emerald-900">
              Smart Features That Work for Kenya
            </h2>
          </div>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600">
                  <Icon
                    className="h-6 w-6 text-white"
                    icon="material-symbols:location-on"
                  />
                </div>
                <div>
                  <h3 className="mb-2 font-heading font-semibold text-emerald-900 text-xl">
                    Location Intelligence
                  </h3>
                  <p className="text-emerald-700">
                    AI analyzes neighborhood data including proximity to
                    schools, hospitals, matatu routes, and shopping centers to
                    optimize property pricing and attract the right tenants.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600">
                  <Icon
                    className="h-6 w-6 text-white"
                    icon="material-symbols:payments"
                  />
                </div>
                <div>
                  <h3 className="mb-2 font-heading font-semibold text-emerald-900 text-xl">
                    M-Pesa Integration
                  </h3>
                  <p className="text-emerald-700">
                    Seamless rent collection through M-Pesa with automatic
                    receipts, payment reminders, and instant notifications for
                    both landlords and tenants.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600">
                  <Icon
                    className="h-6 w-6 text-white"
                    icon="material-symbols:translate"
                  />
                </div>
                <div>
                  <h3 className="mb-2 font-heading font-semibold text-emerald-900 text-xl">
                    Multi-Language Support
                  </h3>
                  <p className="text-emerald-700">
                    Communicate with tenants in English, Swahili, or local
                    languages. Our AI chatbot handles inquiries 24/7 in multiple
                    languages.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600">
                  <Icon
                    className="h-6 w-6 text-white"
                    icon="material-symbols:security"
                  />
                </div>
                <div>
                  <h3 className="mb-2 font-heading font-semibold text-emerald-900 text-xl">
                    Tenant Verification
                  </h3>
                  <p className="text-emerald-700">
                    AI-powered background checks using ID verification,
                    employment history, and creditworthiness to ensure reliable
                    tenants.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <Card className="border-emerald-200 shadow-xl">
                <CardContent className="px-0">
                  <Image
                    alt="RentKenya Dashboard"
                    className="h-80 w-full rounded-t-lg object-cover"
                    src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png"
                  />
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-heading font-semibold text-emerald-900">
                          Westlands Apartment
                        </h4>
                        <p className="text-emerald-700">2BR, Nairobi</p>
                      </div>
                      <Badge className="bg-emerald-600 text-white">
                        Available
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 text-sm">
                      <span>Rent: KES 45,000/month</span>
                      <span>98% Match Score</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="-top-4 -right-4 absolute flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600">
                <Icon
                  className="h-12 w-12 text-white"
                  icon="material-symbols:auto-awesome"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white px-4 py-16">
        <div className="container mx-auto">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold font-heading text-4xl text-emerald-900">
              From Listing to Lease in Minutes
            </h2>
            <p className="mx-auto max-w-2xl text-emerald-700 text-lg">
              See how our streamlined process gets your property rented faster
              than traditional methods
            </p>
          </div>
          <div className="relative">
            <div className="-translate-x-1/2 absolute top-0 bottom-0 left-1/2 hidden w-0.5 transform bg-emerald-200 md:block" />
            <div className="space-y-12">
              <div className="flex flex-col items-center gap-8 md:flex-row">
                <div className="md:w-1/2 md:pr-8">
                  <Card className="border-emerald-200">
                    <CardContent className="px-6 py-6">
                      <div className="mb-4 flex items-center">
                        <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600">
                          <Icon
                            className="h-5 w-5 text-white"
                            icon="material-symbols:photo-camera"
                          />
                        </div>
                        <h3 className="font-heading font-semibold text-emerald-900 text-lg">
                          Property Upload (2 minutes)
                        </h3>
                      </div>
                      <p className="text-emerald-700">
                        Upload photos and basic details. Our AI automatically
                        generates compelling descriptions and suggests optimal
                        pricing based on Nairobi market data.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div className="md:w-1/2 md:pl-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 md:mx-0">
                    <Icon
                      className="h-8 w-8 text-emerald-600"
                      icon="material-symbols:upload"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-8 md:flex-row-reverse">
                <div className="md:w-1/2 md:pl-8">
                  <Card className="border-emerald-200">
                    <CardContent className="px-6 py-6">
                      <div className="mb-4 flex items-center">
                        <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600">
                          <Icon
                            className="h-5 w-5 text-white"
                            icon="material-symbols:person-search"
                          />
                        </div>
                        <h3 className="font-heading font-semibold text-emerald-900 text-lg">
                          AI Tenant Matching (24 hours)
                        </h3>
                      </div>
                      <p className="text-emerald-700">
                        Our system instantly matches your property with
                        pre-verified tenants looking for similar properties in
                        your area. No more endless viewings.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div className="md:w-1/2 md:pr-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 md:mx-0">
                    <Icon
                      className="h-8 w-8 text-emerald-600"
                      icon="material-symbols:psychology"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-8 md:flex-row">
                <div className="md:w-1/2 md:pr-8">
                  <Card className="border-emerald-200">
                    <CardContent className="px-6 py-6">
                      <div className="mb-4 flex items-center">
                        <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600">
                          <Icon
                            className="h-5 w-5 text-white"
                            icon="material-symbols:check-circle"
                          />
                        </div>
                        <h3 className="font-heading font-semibold text-emerald-900 text-lg">
                          Digital Lease Signing (5 minutes)
                        </h3>
                      </div>
                      <p className="text-emerald-700">
                        Complete the lease agreement digitally with
                        e-signatures. Automatic rent collection setup with
                        M-Pesa integration for hassle-free payments.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div className="md:w-1/2 md:pl-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 md:mx-0">
                    <Icon
                      className="h-8 w-8 text-emerald-600"
                      icon="material-symbols:contract"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-emerald-50 px-4 py-16">
        <div className="container mx-auto">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold font-heading text-4xl text-emerald-900">
              Success Stories from Kenya
            </h2>
            <p className="mx-auto max-w-2xl text-emerald-700 text-lg">
              Real landlords sharing their experience with RentKenya across
              different counties
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-emerald-200 bg-white">
              <CardContent className="px-6 py-6">
                <div className="mb-4 flex items-center">
                  <Avatar className="mr-4">
                    <AvatarImage src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png" />
                    <AvatarFallback className="bg-emerald-100 text-emerald-600">
                      JK
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-heading font-semibold text-emerald-900">
                      John Kamau
                    </h4>
                    <p className="text-emerald-700 text-sm">
                      Landlord, Nairobi
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-emerald-700">
                  "RentKenya helped me rent out my 3-bedroom apartment in
                  Kilimani within 48 hours. The AI pricing was spot-on, and the
                  M-Pesa integration made everything seamless."
                </p>
                <div className="flex items-center text-emerald-600">
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-white">
              <CardContent className="px-6 py-6">
                <div className="mb-4 flex items-center">
                  <Avatar className="mr-4">
                    <AvatarImage src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png" />
                    <AvatarFallback className="bg-emerald-100 text-emerald-600">
                      AM
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-heading font-semibold text-emerald-900">
                      Amina Mohammed
                    </h4>
                    <p className="text-emerald-700 text-sm">
                      Property Manager, Mombasa
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-emerald-700">
                  "Managing 15 properties became so much easier. The automatic
                  rent reminders and maintenance tracking saved me countless
                  hours every month."
                </p>
                <div className="flex items-center text-emerald-600">
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-white">
              <CardContent className="px-6 py-6">
                <div className="mb-4 flex items-center">
                  <Avatar className="mr-4">
                    <AvatarImage src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png" />
                    <AvatarFallback className="bg-emerald-100 text-emerald-600">
                      PO
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-heading font-semibold text-emerald-900">
                      Peter Ochieng
                    </h4>
                    <p className="text-emerald-700 text-sm">Investor, Kisumu</p>
                  </div>
                </div>
                <p className="mb-4 text-emerald-700">
                  "The tenant verification system is incredible. I've had zero
                  issues with late payments since switching to RentKenya. The AI
                  really knows how to match the right tenants."
                </p>
                <div className="flex items-center text-emerald-600">
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                  <Icon className="h-4 w-4" icon="material-symbols:star" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-20 text-white">
        <div className="container mx-auto text-center">
          <h2 className="mb-6 font-bold font-heading text-4xl">
            Ready to Transform Your Property Business?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-emerald-100 text-xl">
            Join thousands of Kenyan landlords who've already revolutionized
            their property management with AI
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              className="bg-white px-8 text-emerald-600 text-lg hover:bg-emerald-50"
              size="lg"
            >
              Start Free 30-Day Trial
            </Button>
            <Button
              className="border-white px-8 text-lg text-white hover:bg-white hover:text-emerald-600"
              size="lg"
              variant="outline"
            >
              Schedule Demo
            </Button>
          </div>
          <p className="mt-4 text-emerald-200 text-sm">
            No credit card required • Setup in under 5 minutes • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
