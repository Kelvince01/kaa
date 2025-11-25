"use client";

import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader } from "@kaa/ui/components/card";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";

export function AIPropertyRentalSaaSRegisterPageKenyanMarket() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-emerald-50 to-emerald-100 p-4">
      <div className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2">
        <div className="hidden lg:block">
          <div className="relative">
            <div className="absolute inset-0 rotate-3 transform rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-800" />
            <div className="relative rounded-3xl bg-white p-8 shadow-2xl">
              <div className="mb-8 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Icon
                    className="h-8 w-8 text-emerald-600"
                    icon="mdi:home-analytics"
                  />
                </div>
                <h3 className="mb-2 font-heading text-gray-900 text-xl">
                  AI-Powered Property Insights
                </h3>
                <p className="text-gray-600">
                  Smart analytics for the Kenyan rental market
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <Icon
                      className="h-5 w-5 text-emerald-600"
                      icon="mdi:chart-line"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Market Intelligence
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Real-time pricing insights across Nairobi, Mombasa, and
                      Kisumu
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <Icon
                      className="h-5 w-5 text-emerald-600"
                      icon="mdi:robot"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      AI Tenant Matching
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Smart algorithms to match properties with ideal tenants
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <Icon
                      className="h-5 w-5 text-emerald-600"
                      icon="mdi:shield-check"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Secure Transactions
                    </h4>
                    <p className="text-gray-600 text-sm">
                      M-Pesa integration with fraud protection
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 rounded-xl bg-emerald-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-emerald-800">
                    Join 2,500+ landlords in Kenya
                  </span>
                  <div className="-space-x-2 flex">
                    <div className="h-8 w-8 rounded-full border-2 border-white bg-emerald-200" />
                    <div className="h-8 w-8 rounded-full border-2 border-white bg-emerald-300" />
                    <div className="h-8 w-8 rounded-full border-2 border-white bg-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Card className="mx-auto w-full max-w-md border-0 shadow-2xl">
          <CardHeader className="pb-2 text-center">
            <div className="mb-4 flex items-center justify-center">
              <div className="rounded-xl bg-emerald-600 p-3">
                <Icon className="h-8 w-8 text-white" icon="mdi:home-city" />
              </div>
            </div>
            <h1 className="font-heading text-2xl text-gray-900">
              Join RentAI Kenya
            </h1>
            <p className="text-gray-600">
              Transform your property business with AI
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  className="border-gray-200"
                  id="firstName"
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  className="border-gray-200"
                  id="lastName"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                className="border-gray-200"
                id="email"
                placeholder="john@example.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                className="border-gray-200"
                id="phone"
                placeholder="+254 700 000 000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Select>
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Select your business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">
                    Individual Landlord
                  </SelectItem>
                  <SelectItem value="agency">Real Estate Agency</SelectItem>
                  <SelectItem value="property-management">
                    Property Management Company
                  </SelectItem>
                  <SelectItem value="developer">Property Developer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Primary Location</Label>
              <Select>
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Select your main city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nairobi">Nairobi</SelectItem>
                  <SelectItem value="mombasa">Mombasa</SelectItem>
                  <SelectItem value="kisumu">Kisumu</SelectItem>
                  <SelectItem value="nakuru">Nakuru</SelectItem>
                  <SelectItem value="eldoret">Eldoret</SelectItem>
                  <SelectItem value="thika">Thika</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
