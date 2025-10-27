import { Icon } from "@iconify/react";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { ScrollArea } from "@kaa/ui/components/scroll-area";

export function AIAssistantModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700">
          <Icon className="mr-2 h-5 w-5" icon="mdi:robot-excited" />
          Ask Keja AI Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[80vh] max-w-4xl border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50 p-0">
        <div className="flex h-full flex-col">
          <DialogHeader className="border-emerald-200 border-b bg-white/80 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-teal-600">
                <Icon
                  className="h-6 w-6 text-white"
                  icon="mdi:home-assistant"
                />
              </div>
              <div>
                <DialogTitle className="font-heading text-emerald-900 text-xl">
                  Keja AI Assistant
                </DialogTitle>
                <DialogDescription className="text-emerald-700">
                  Your smart property rental companion for Kenya
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea>
            <div className="flex flex-1">
              <div className="flex flex-1 flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                      <Icon className="h-4 w-4 text-white" icon="mdi:robot" />
                    </div>
                    <div className="max-w-md rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">
                      <p className="text-gray-800">
                        Habari! I'm Keja AI, your property rental assistant. I
                        can help you find the perfect rental property in Kenya,
                        calculate affordability, and provide market insights.
                        What would you like to know?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start justify-end gap-3">
                    <div className="max-w-md rounded-lg bg-emerald-500 p-4 text-white shadow-sm">
                      <p>
                        I'm looking for a 2-bedroom apartment in Westlands,
                        Nairobi under KES 80,000 per month
                      </p>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-300">
                      <Icon
                        className="h-4 w-4 text-gray-600"
                        icon="mdi:account"
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                      <Icon className="h-4 w-4 text-white" icon="mdi:robot" />
                    </div>
                    <div className="max-w-md rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">
                      <p className="mb-3 text-gray-800">
                        Great choice! Westlands is a prime location. I found
                        several options for you:
                      </p>
                      <div className="space-y-2">
                        <div className="rounded-lg border border-emerald-200 p-3">
                          <div className="mb-2 flex items-start justify-between">
                            <h4 className="font-medium text-emerald-900">
                              Modern 2BR Apartment
                            </h4>
                            <span className="font-semibold text-emerald-600">
                              KES 75,000
                            </span>
                          </div>
                          <p className="mb-2 text-gray-600 text-sm">
                            Parklands Road, Westlands • 2 bed, 2 bath
                          </p>
                          <div className="flex gap-2">
                            <Badge className="text-xs" variant="secondary">
                              Parking
                            </Badge>
                            <Badge className="text-xs" variant="secondary">
                              Gym
                            </Badge>
                            <Badge className="text-xs" variant="secondary">
                              Security
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        className="mt-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        size="sm"
                        variant="outline"
                      >
                        View More Properties
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="border-emerald-200 border-t bg-white/80 p-6 backdrop-blur-sm">
                  <div className="flex gap-2">
                    <Input
                      className="flex-1 border-emerald-200 focus:border-emerald-500"
                      placeholder="Type your message here... (e.g., 'Find me a studio in Karen under 40k')"
                    />
                    <Button className="bg-emerald-600 px-4 text-white hover:bg-emerald-700">
                      <Icon className="h-4 w-4" icon="mdi:send" />
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      className="border-emerald-200 text-emerald-700 text-xs hover:bg-emerald-50"
                      size="sm"
                      variant="outline"
                    >
                      Calculate affordability
                    </Button>
                    <Button
                      className="border-emerald-200 text-emerald-700 text-xs hover:bg-emerald-50"
                      size="sm"
                      variant="outline"
                    >
                      Market trends in Nairobi
                    </Button>
                    <Button
                      className="border-emerald-200 text-emerald-700 text-xs hover:bg-emerald-50"
                      size="sm"
                      variant="outline"
                    >
                      Compare neighborhoods
                    </Button>
                  </div>
                </div>
              </div>
              <div className="w-80 border-emerald-200 border-l bg-white/60 backdrop-blur-sm">
                <div className="border-emerald-200 border-b p-4">
                  <h3 className="mb-3 font-medium text-emerald-900">
                    AI Insights
                  </h3>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-emerald-50 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <Icon
                          className="h-4 w-4 text-emerald-600"
                          icon="mdi:trending-up"
                        />
                        <span className="font-medium text-emerald-900 text-sm">
                          Market Trend
                        </span>
                      </div>
                      <p className="text-emerald-700 text-xs">
                        Westlands rental prices increased 8% this quarter
                      </p>
                    </div>
                    <div className="rounded-lg bg-teal-50 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <Icon
                          className="h-4 w-4 text-teal-600"
                          icon="mdi:calculator"
                        />
                        <span className="font-medium text-sm text-teal-900">
                          Affordability
                        </span>
                      </div>
                      <p className="text-teal-700 text-xs">
                        Your budget covers 85% of available properties
                      </p>
                    </div>
                    <div className="rounded-lg bg-orange-50 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <Icon
                          className="h-4 w-4 text-orange-600"
                          icon="mdi:lightbulb"
                        />
                        <span className="font-medium text-orange-900 text-sm">
                          Tip
                        </span>
                      </div>
                      <p className="text-orange-700 text-xs">
                        Consider Kilimani for similar amenities at 15% lower
                        cost
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-3 font-medium text-emerald-900">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <Button
                      className="w-full justify-start border-emerald-200 text-left hover:bg-emerald-50"
                      variant="outline"
                    >
                      <Icon
                        className="mr-2 h-4 w-4 text-emerald-600"
                        icon="mdi:map-marker"
                      />
                      Explore Neighborhoods
                    </Button>
                    <Button
                      className="w-full justify-start border-emerald-200 text-left hover:bg-emerald-50"
                      variant="outline"
                    >
                      <Icon
                        className="mr-2 h-4 w-4 text-emerald-600"
                        icon="mdi:calculator-variant"
                      />
                      Rent Calculator
                    </Button>
                    <Button
                      className="w-full justify-start border-emerald-200 text-left hover:bg-emerald-50"
                      variant="outline"
                    >
                      <Icon
                        className="mr-2 h-4 w-4 text-emerald-600"
                        icon="mdi:chart-line"
                      />
                      Market Analysis
                    </Button>
                    <Button
                      className="w-full justify-start border-emerald-200 text-left hover:bg-emerald-50"
                      variant="outline"
                    >
                      <Icon
                        className="mr-2 h-4 w-4 text-emerald-600"
                        icon="mdi:bookmark"
                      />
                      Save Preferences
                    </Button>
                  </div>
                </div>
                <div className="border-emerald-200 border-t p-4">
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-500">
                      <Icon className="h-8 w-8 text-white" icon="mdi:brain" />
                    </div>
                    <p className="mb-2 text-emerald-700 text-xs">
                      Powered by Advanced AI
                    </p>
                    <Badge
                      className="border-emerald-200 text-emerald-700 text-xs"
                      variant="outline"
                    >
                      Learning from 10K+ properties
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
