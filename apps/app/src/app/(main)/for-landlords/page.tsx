import { Icon } from "@iconify/react";
import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";

export default function ForLandlordsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100">
      <section className="px-4 py-20">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 border-emerald-300 bg-emerald-100 text-emerald-800">
            AI-Powered Property Management
          </Badge>
          <h1 className="mb-6 font-bold font-heading text-5xl text-emerald-900 md:text-7xl">
            Revolutionize Your{" "}
            <span className="text-emerald-600">Rental Business</span> in Kenya
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-emerald-700 text-xl">
            Harness the power of AI to automate tenant screening, rent
            collection, and property maintenance. Built specifically for Kenyan
            landlords with M-Pesa integration and local market insights.
          </p>
          <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              className="bg-emerald-600 px-8 py-4 text-lg text-white hover:bg-emerald-700"
              size="lg"
            >
              <Icon
                className="mr-2 h-5 w-5"
                icon="material-symbols:rocket-launch"
              />
              Start Free Trial
            </Button>
            <Button
              className="border-emerald-600 px-8 py-4 text-emerald-700 text-lg hover:bg-emerald-50"
              size="lg"
              variant="outline"
            >
              <Icon
                className="mr-2 h-5 w-5"
                icon="material-symbols:play-circle"
              />
              Watch Demo
            </Button>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Icon
                  className="h-8 w-8 text-emerald-600"
                  icon="material-symbols:groups"
                />
              </div>
              <h3 className="mb-2 font-bold text-2xl text-emerald-800">
                5000+
              </h3>
              <p className="text-emerald-600">Happy Landlords</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Icon
                  className="h-8 w-8 text-emerald-600"
                  icon="material-symbols:apartment"
                />
              </div>
              <h3 className="mb-2 font-bold text-2xl text-emerald-800">
                25,000+
              </h3>
              <p className="text-emerald-600">Properties Managed</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Icon
                  className="h-8 w-8 text-emerald-600"
                  icon="material-symbols:payments"
                />
              </div>
              <h3 className="mb-2 font-bold text-2xl text-emerald-800">
                KES 2.5B+
              </h3>
              <p className="text-emerald-600">Rent Collected</p>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white px-4 py-20">
        <div className="container mx-auto">
          <div className="mb-16 text-center">
            <h2 className="mb-6 font-bold font-heading text-4xl text-emerald-900 md:text-5xl">
              Smart Features for Modern Landlords
            </h2>
            <p className="mx-auto max-w-2xl text-emerald-700 text-xl">
              Our AI-powered platform streamlines every aspect of property
              management, from tenant acquisition to maintenance scheduling.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-emerald-200 transition-colors hover:border-emerald-300">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <Icon
                    className="h-6 w-6 text-emerald-600"
                    icon="material-symbols:psychology"
                  />
                </div>
                <CardTitle className="text-emerald-800">
                  AI Tenant Screening
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                <p className="text-emerald-600">
                  Automatically screen potential tenants using AI analysis of
                  credit history, employment verification, and behavioral
                  patterns.
                </p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 transition-colors hover:border-emerald-300">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <Icon
                    className="h-6 w-6 text-emerald-600"
                    icon="material-symbols:account-balance-wallet"
                  />
                </div>
                <CardTitle className="text-emerald-800">
                  M-Pesa Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                <p className="text-emerald-600">
                  Seamless rent collection through M-Pesa with automated
                  reminders and instant payment notifications.
                </p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 transition-colors hover:border-emerald-300">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <Icon
                    className="h-6 w-6 text-emerald-600"
                    icon="material-symbols:handyman"
                  />
                </div>
                <CardTitle className="text-emerald-800">
                  Smart Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                <p className="text-emerald-600">
                  Predictive maintenance alerts and automated scheduling with
                  vetted local service providers across Kenya.
                </p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 transition-colors hover:border-emerald-300">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <Icon
                    className="h-6 w-6 text-emerald-600"
                    icon="material-symbols:analytics"
                  />
                </div>
                <CardTitle className="text-emerald-800">
                  Market Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                <p className="text-emerald-600">
                  Real-time market insights and rental price optimization based
                  on Nairobi, Mombasa, and other major cities.
                </p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 transition-colors hover:border-emerald-300">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <Icon
                    className="h-6 w-6 text-emerald-600"
                    icon="material-symbols:gavel"
                  />
                </div>
                <CardTitle className="text-emerald-800">
                  Legal Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                <p className="text-emerald-600">
                  Automated lease agreements and legal document generation
                  compliant with Kenyan rental laws.
                </p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 transition-colors hover:border-emerald-300">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <Icon
                    className="h-6 w-6 text-emerald-600"
                    icon="material-symbols:chat"
                  />
                </div>
                <CardTitle className="text-emerald-800">
                  24/7 AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                <p className="text-emerald-600">
                  Intelligent chatbot handles tenant inquiries in English and
                  Swahili, providing instant responses.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="bg-emerald-50 px-4 py-20">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge className="mb-6 border-emerald-300 bg-emerald-100 text-emerald-800">
                Dashboard Overview
              </Badge>
              <h2 className="mb-6 font-bold font-heading text-4xl text-emerald-900">
                Everything You Need in One Dashboard
              </h2>
              <p className="mb-8 text-emerald-700 text-lg">
                Monitor all your properties, track rent payments, manage
                tenants, and analyze performance from a single, intuitive
                dashboard designed for the Kenyan market.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600">
                    <Icon
                      className="h-4 w-4 text-white"
                      icon="material-symbols:check"
                    />
                  </div>
                  <span className="text-emerald-800">
                    Real-time property performance metrics
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600">
                    <Icon
                      className="h-4 w-4 text-white"
                      icon="material-symbols:check"
                    />
                  </div>
                  <span className="text-emerald-800">
                    Automated rent collection tracking
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600">
                    <Icon
                      className="h-4 w-4 text-white"
                      icon="material-symbols:check"
                    />
                  </div>
                  <span className="text-emerald-800">
                    Tenant communication hub
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-bold text-emerald-800 text-xl">
                    Property Overview
                  </h3>
                  <Badge className="bg-emerald-100 text-emerald-800">
                    Live Data
                  </Badge>
                </div>
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-emerald-50 p-4">
                    <div className="font-bold text-2xl text-emerald-800">
                      KES 2.4M
                    </div>
                    <div className="text-emerald-600 text-sm">
                      Monthly Revenue
                    </div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-4">
                    <div className="font-bold text-2xl text-emerald-800">
                      96%
                    </div>
                    <div className="text-emerald-600 text-sm">
                      Occupancy Rate
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-600" />
                      <div>
                        <div className="font-medium text-emerald-800">
                          Westlands Apartment
                        </div>
                        <div className="text-emerald-600 text-sm">
                          12 units • 100% occupied
                        </div>
                      </div>
                    </div>
                    <div className="text-emerald-600">KES 180K</div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-500" />
                      <div>
                        <div className="font-medium text-emerald-800">
                          Karen Villas
                        </div>
                        <div className="text-emerald-600 text-sm">
                          8 units • 87% occupied
                        </div>
                      </div>
                    </div>
                    <div className="text-emerald-600">KES 240K</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white px-4 py-20">
        <div className="container mx-auto text-center">
          <h2 className="mb-6 font-bold font-heading text-4xl text-emerald-900 md:text-5xl">
            Trusted by Kenya's Top Landlords
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-emerald-700 text-xl">
            Join thousands of property owners who have transformed their rental
            business with our AI-powered platform.
          </p>
          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="border-emerald-200">
              <CardContent className="px-6 py-8 text-center">
                <Avatar className="mx-auto mb-4 h-16 w-16">
                  <AvatarImage src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png" />
                  <AvatarFallback>JK</AvatarFallback>
                </Avatar>
                <p className="mb-4 text-emerald-700 italic">
                  "RentaKenya has revolutionized how I manage my 50+ properties
                  in Nairobi. The AI screening has reduced bad tenants by 90%."
                </p>
                <div className="font-bold text-emerald-800">James Kariuki</div>
                <div className="text-emerald-600">
                  Property Developer, Nairobi
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200">
              <CardContent className="px-6 py-8 text-center">
                <Avatar className="mx-auto mb-4 h-16 w-16">
                  <AvatarImage src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png" />
                  <AvatarFallback>AM</AvatarFallback>
                </Avatar>
                <p className="mb-4 text-emerald-700 italic">
                  "M-Pesa integration is seamless. I collect 99% of rent on time
                  now, and the analytics help me optimize pricing."
                </p>
                <div className="font-bold text-emerald-800">Amina Mwangi</div>
                <div className="text-emerald-600">
                  Real Estate Investor, Mombasa
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200">
              <CardContent className="px-6 py-8 text-center">
                <Avatar className="mx-auto mb-4 h-16 w-16">
                  <AvatarImage src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png" />
                  <AvatarFallback>DO</AvatarFallback>
                </Avatar>
                <p className="mb-4 text-emerald-700 italic">
                  "The predictive maintenance feature saved me thousands in
                  emergency repairs. This platform is a game-changer."
                </p>
                <div className="font-bold text-emerald-800">David Ochieng</div>
                <div className="text-emerald-600">Landlord, Kisumu</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-20">
        <div className="container mx-auto text-center">
          <h2 className="mb-6 font-bold font-heading text-4xl text-white md:text-5xl">
            Ready to Transform Your Rental Business?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-emerald-100 text-xl">
            Join thousands of Kenyan landlords who have already revolutionized
            their property management with AI.
          </p>
          <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              className="bg-white px-8 py-4 text-emerald-700 text-lg hover:bg-emerald-50"
              size="lg"
            >
              <Icon
                className="mr-2 h-5 w-5"
                icon="material-symbols:rocket-launch"
              />
              Start 30-Day Free Trial
            </Button>
            <Button
              className="border-white bg-primary px-8 py-4 text-lg text-white hover:bg-white hover:text-emerald-700"
              size="lg"
              variant="outline"
            >
              <Icon className="mr-2 h-5 w-5" icon="material-symbols:call" />
              Schedule Demo
            </Button>
          </div>
          <p className="text-emerald-200 text-sm">
            No credit card required • Cancel anytime • 24/7 support in English &
            Swahili
          </p>
        </div>
      </section>
    </div>
  );
}
