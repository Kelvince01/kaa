import { Icon } from "@iconify/react";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";

export function HeroSection() {
  return (
    <section className="px-4 py-20">
      <div className="container mx-auto">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="search-container space-y-6">
              <Badge className="border-emerald-300 bg-emerald-100 text-emerald-800">
                <Icon
                  className="mr-2 h-4 w-4"
                  icon="material-symbols:auto-awesome"
                />
                AI-Powered Property Management
              </Badge>
              <h1 className="font-bold font-heading text-5xl text-emerald-900 leading-tight lg:text-6xl">
                Revolutionize Your Property Rental Business in Kenya
              </h1>
              <p className="text-emerald-700 text-xl leading-relaxed">
                Harness the power of AI to automate tenant screening, optimize
                rent pricing, and manage your properties like never before.
                Built specifically for the Kenyan rental market.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                className="bg-emerald-600 px-8 py-6 text-lg text-white hover:bg-emerald-700"
                size="lg"
              >
                <Icon
                  className="mr-2 h-5 w-5"
                  icon="material-symbols:rocket-launch"
                />
                Start Free Trial
              </Button>
              <Button
                className="border-emerald-300 px-8 py-6 text-emerald-700 text-lg hover:bg-emerald-50"
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
            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="font-bold text-2xl text-emerald-800">500+</div>
                <div className="text-emerald-600 text-sm">
                  Properties Managed
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-emerald-800">98%</div>
                <div className="text-emerald-600 text-sm">
                  Tenant Satisfaction
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-emerald-800">24/7</div>
                <div className="text-emerald-600 text-sm">AI Support</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rotate-6 transform rounded-3xl bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-20" />
            <Card className="relative border-emerald-200 bg-white/90 shadow-2xl backdrop-blur-md">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-emerald-800 text-xl">
                      AI Dashboard
                    </h3>
                    <Badge className="bg-emerald-100 text-emerald-800">
                      Live
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-emerald-50 p-4">
                      <div className="mb-2 flex items-center space-x-2">
                        <Icon
                          className="h-5 w-5 text-emerald-600"
                          icon="material-symbols:trending-up"
                        />
                        <span className="text-emerald-700 text-sm">
                          Occupancy Rate
                        </span>
                      </div>
                      <div className="font-bold text-2xl text-emerald-800">
                        94%
                      </div>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-4">
                      <div className="mb-2 flex items-center space-x-2">
                        <Icon
                          className="h-5 w-5 text-emerald-600"
                          icon="material-symbols:payments"
                        />
                        <span className="text-emerald-700 text-sm">
                          Monthly Revenue
                        </span>
                      </div>
                      <div className="font-bold text-2xl text-emerald-800">
                        KES 2.4M
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-700 text-sm">
                        AI Tenant Screening
                      </span>
                      <span className="font-medium text-emerald-800 text-sm">
                        Active
                      </span>
                    </div>
                    <Progress className="h-2" value={85} />
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-700 text-sm">
                        Rent Optimization
                      </span>
                      <span className="font-medium text-emerald-800 text-sm">
                        Running
                      </span>
                    </div>
                    <Progress className="h-2" value={92} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
