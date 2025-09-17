import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <Icon className="h-6 w-6 text-white" icon="mdi:shield-check" />
            </div>
            <h1 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text font-bold font-heading text-4xl text-transparent">
              Privacy Policy
            </h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Your privacy is our priority. Learn how we protect and handle your
            data on Kenya's leading AI-powered property rental platform.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Icon className="h-4 w-4" icon="mdi:calendar" />
            <span>Last updated: July 2025</span>
          </div>
        </div>
        <div className="space-y-8">
          <Card className="border-emerald-200 pt-0 shadow-lg">
            <CardHeader className="rounded-t-lg bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
              <CardTitle className="flex items-center gap-3">
                <Icon className="h-5 w-5" icon="mdi:information" />
                Information We Collect
              </CardTitle>
              <CardDescription className="text-emerald-100">
                Understanding what data we collect and why it matters for your
                rental experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                      <Icon
                        className="h-4 w-4 text-emerald-600"
                        icon="mdi:account"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Personal Information
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Name, email, phone number, and ID verification for
                        secure transactions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                      <Icon
                        className="h-4 w-4 text-emerald-600"
                        icon="mdi:map-marker"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Location Data
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        GPS coordinates to show nearby properties and improve
                        search results
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                      <Icon
                        className="h-4 w-4 text-emerald-600"
                        icon="mdi:robot"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        AI Interaction Data
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Chat logs with our AI assistant to improve
                        recommendations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                      <Icon
                        className="h-4 w-4 text-emerald-600"
                        icon="mdi:credit-card"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Payment Information
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        M-Pesa details and transaction history for seamless
                        payments
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 pt-0 shadow-lg">
            <CardHeader className="rounded-t-lg bg-gradient-to-r from-teal-500 to-emerald-600 p-4 text-white">
              <CardTitle className="flex items-center gap-3">
                <Icon className="h-5 w-5" icon="mdi:cog" />
                How We Use Your Data
              </CardTitle>
              <CardDescription className="text-teal-100">
                Leveraging AI and machine learning to enhance your property
                search experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-4 rounded-lg bg-emerald-50 p-4">
                  <Icon className="h-6 w-6 text-emerald-600" icon="mdi:brain" />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      AI-Powered Recommendations
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Our machine learning algorithms analyze your preferences
                      to suggest perfect rental matches
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-lg bg-emerald-50 p-4">
                  <Icon
                    className="h-6 w-6 text-emerald-600"
                    icon="mdi:shield-check"
                  />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Fraud Prevention
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Advanced AI systems detect suspicious activities to
                      protect all users in the Kenyan market
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-lg bg-emerald-50 p-4">
                  <Icon
                    className="h-6 w-6 text-emerald-600"
                    icon="mdi:chart-line"
                  />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Market Insights
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Analyze rental trends across Nairobi, Mombasa, and other
                      Kenyan cities for better pricing
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-emerald-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-emerald-700">
                  <Icon className="h-5 w-5" icon="mdi:share-variant" />
                  Data Sharing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground text-sm">
                      Verified landlords for property inquiries
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground text-sm">
                      Payment processors (Safaricom M-Pesa)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground text-sm">
                      Legal authorities when required by Kenyan law
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-2">
                    <Icon
                      className="h-4 w-4 text-red-600"
                      icon="mdi:close-circle"
                    />
                    <span className="font-medium text-red-700 text-sm">
                      We never sell your data
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-emerald-700">
                  <Icon className="h-5 w-5" icon="mdi:lock" />
                  Data Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground text-sm">
                      End-to-end encryption for all communications
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground text-sm">
                      Secure servers hosted in Kenya
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground text-sm">
                      Regular security audits and updates
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center gap-2">
                    <Icon
                      className="h-4 w-4 text-emerald-600"
                      icon="mdi:check-circle"
                    />
                    <span className="font-medium text-emerald-700 text-sm">
                      ISO 27001 certified
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="border-emerald-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-emerald-700">
                <Icon className="h-5 w-5" icon="mdi:account-cog" />
                Your Rights Under Kenyan Law
              </CardTitle>
              <CardDescription>
                In compliance with the Data Protection Act 2019, you have the
                following rights
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-emerald-50 p-4 text-center">
                  <Icon
                    className="mx-auto mb-2 h-8 w-8 text-emerald-600"
                    icon="mdi:eye"
                  />
                  <h4 className="mb-1 font-semibold text-foreground">Access</h4>
                  <p className="text-muted-foreground text-xs">
                    View all data we have about you
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4 text-center">
                  <Icon
                    className="mx-auto mb-2 h-8 w-8 text-emerald-600"
                    icon="mdi:pencil"
                  />
                  <h4 className="mb-1 font-semibold text-foreground">
                    Rectification
                  </h4>
                  <p className="text-muted-foreground text-xs">
                    Correct any inaccurate information
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4 text-center">
                  <Icon
                    className="mx-auto mb-2 h-8 w-8 text-emerald-600"
                    icon="mdi:delete"
                  />
                  <h4 className="mb-1 font-semibold text-foreground">
                    Erasure
                  </h4>
                  <p className="text-muted-foreground text-xs">
                    Request deletion of your data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
            <CardContent className="px-6 py-8 text-center">
              <Icon
                className="mx-auto mb-4 h-12 w-12 text-emerald-100"
                icon="mdi:phone"
              />
              <h3 className="mb-2 font-bold font-heading text-xl">
                Questions About Your Privacy?
              </h3>
              <p className="mb-6 text-emerald-100">
                Our Data Protection Officer is here to help you understand your
                rights
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  className="bg-white text-emerald-600 hover:bg-emerald-50"
                  variant="secondary"
                >
                  <Icon className="mr-2 h-4 w-4" icon="mdi:email" />
                  privacy@rentalai.co.ke
                </Button>
                <Button
                  className="border-white text-white hover:bg-white hover:text-emerald-600"
                  variant="outline"
                >
                  <Icon className="mr-2 h-4 w-4" icon="mdi:phone" />
                  +254 700 123 456
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2">
            <Icon
              className="h-4 w-4 text-emerald-600"
              icon="mdi:shield-check"
            />
            <span className="font-medium text-emerald-700 text-sm">
              Compliant with Kenya Data Protection Act 2019
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
