import { Icon } from "@iconify/react";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Switch } from "@kaa/ui/components/switch";
import { generateCustomMetadata } from "@/components/seo/metadata";

export const metadata = generateCustomMetadata("Cookie Policy");

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700">
              <Icon
                className="h-6 w-6 text-white"
                icon="material-symbols:cookie"
              />
            </div>
            <h1 className="bg-gradient-to-r from-emerald-700 to-emerald-900 bg-clip-text font-bold font-heading text-4xl text-transparent">
              Cookie Policy
            </h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Your privacy matters to us. Learn how RentSmart AI uses cookies to
            enhance your property rental experience across Kenya.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-emerald-700 text-sm">
            <Icon className="h-4 w-4" icon="material-symbols:location-on" />
            <span>Compliant with Kenya Data Protection Act 2019</span>
          </div>
        </div>
        <div className="grid gap-8">
          <Card className="border-emerald-200 pt-0 shadow-lg">
            <CardHeader className="border-emerald-200 border-b bg-gradient-to-r from-emerald-50 to-emerald-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                  <Icon
                    className="h-5 w-5 text-white"
                    icon="material-symbols:info"
                  />
                </div>
                <CardTitle className="text-emerald-900">
                  What Are Cookies?
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-6">
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files stored on your device when you
                visit RentSmart AI. They help us provide you with a personalized
                property search experience, remember your preferences, and
                improve our AI-powered recommendations for rental properties
                across Nairobi, Mombasa, Kisumu, and other Kenyan cities.
              </p>
            </CardContent>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-emerald-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                    <Icon
                      className="h-4 w-4 text-white"
                      icon="material-symbols:lock"
                    />
                  </div>
                  <CardTitle className="text-emerald-900">
                    Essential Cookies
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6">
                <p className="mb-4 text-muted-foreground text-sm">
                  Required for basic functionality and security of your account.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge
                      className="bg-emerald-100 text-emerald-700"
                      variant="secondary"
                    >
                      Authentication
                    </Badge>
                    <span className="text-sm">Login sessions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className="bg-emerald-100 text-emerald-700"
                      variant="secondary"
                    >
                      Security
                    </Badge>
                    <span className="text-sm">CSRF protection</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className="bg-emerald-100 text-emerald-700"
                      variant="secondary"
                    >
                      Preferences
                    </Badge>
                    <span className="text-sm">Language settings</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                    <Icon
                      className="h-4 w-4 text-white"
                      icon="material-symbols:psychology"
                    />
                  </div>
                  <CardTitle className="text-emerald-900">
                    AI Analytics Cookies
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6">
                <p className="mb-4 text-muted-foreground text-sm">
                  Help our AI learn your preferences for better property
                  recommendations.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge
                      className="bg-blue-100 text-blue-700"
                      variant="secondary"
                    >
                      Search History
                    </Badge>
                    <span className="text-sm">Property searches</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className="bg-blue-100 text-blue-700"
                      variant="secondary"
                    >
                      Behavior
                    </Badge>
                    <span className="text-sm">Click patterns</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className="bg-blue-100 text-blue-700"
                      variant="secondary"
                    >
                      Recommendations
                    </Badge>
                    <span className="text-sm">ML algorithms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="border-emerald-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                  <Icon
                    className="h-4 w-4 text-white"
                    icon="material-symbols:settings"
                  />
                </div>
                <CardTitle className="text-emerald-900">
                  Manage Your Cookie Preferences
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <Icon
                    className="mx-auto mb-3 h-8 w-8 text-emerald-600"
                    icon="material-symbols:toggle-on"
                  />
                  <h3 className="mb-2 font-semibold text-emerald-900">
                    Essential Cookies
                  </h3>
                  <p className="mb-3 text-muted-foreground text-sm">
                    Always active for core functionality
                  </p>
                  <Switch checked disabled />
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
                  <Icon
                    className="mx-auto mb-3 h-8 w-8 text-blue-600"
                    icon="material-symbols:analytics"
                  />
                  <h3 className="mb-2 font-semibold text-blue-900">
                    Analytics Cookies
                  </h3>
                  <p className="mb-3 text-muted-foreground text-sm">
                    Help improve our AI recommendations
                  </p>
                  <Switch defaultChecked />
                </div>
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 text-center">
                  <Icon
                    className="mx-auto mb-3 h-8 w-8 text-purple-600"
                    icon="material-symbols:ads-click"
                  />
                  <h3 className="mb-2 font-semibold text-purple-900">
                    Marketing Cookies
                  </h3>
                  <p className="mb-3 text-muted-foreground text-sm">
                    Personalized property advertisements
                  </p>
                  <Switch />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-emerald-200 border-t bg-emerald-50">
              <div className="flex w-full flex-col gap-4 sm:flex-row">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  <Icon className="mr-2 h-4 w-4" icon="material-symbols:save" />
                  Save Preferences
                </Button>
                <Button
                  className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  variant="outline"
                >
                  <Icon
                    className="mr-2 h-4 w-4"
                    icon="material-symbols:refresh"
                  />
                  Reset to Default
                </Button>
              </div>
            </CardFooter>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-emerald-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                    <Icon
                      className="h-4 w-4 text-white"
                      icon="material-symbols:schedule"
                    />
                  </div>
                  <CardTitle className="text-emerald-900">
                    Cookie Retention
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-emerald-100 border-b py-2">
                    <span className="font-medium text-sm">Session Cookies</span>
                    <Badge
                      className="border-emerald-300 text-emerald-700"
                      variant="outline"
                    >
                      Until logout
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-emerald-100 border-b py-2">
                    <span className="font-medium text-sm">
                      Preference Cookies
                    </span>
                    <Badge
                      className="border-emerald-300 text-emerald-700"
                      variant="outline"
                    >
                      1 year
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-emerald-100 border-b py-2">
                    <span className="font-medium text-sm">
                      Analytics Cookies
                    </span>
                    <Badge
                      className="border-emerald-300 text-emerald-700"
                      variant="outline"
                    >
                      2 years
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="font-medium text-sm">
                      Marketing Cookies
                    </span>
                    <Badge
                      className="border-emerald-300 text-emerald-700"
                      variant="outline"
                    >
                      90 days
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                    <Icon
                      className="h-4 w-4 text-white"
                      icon="material-symbols:gavel"
                    />
                  </div>
                  <CardTitle className="text-emerald-900">
                    Legal Compliance
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Icon
                      className="mt-0.5 h-5 w-5 text-emerald-600"
                      icon="material-symbols:check-circle"
                    />
                    <div>
                      <p className="font-medium text-sm">
                        Kenya Data Protection Act 2019
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Full compliance with local regulations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon
                      className="mt-0.5 h-5 w-5 text-emerald-600"
                      icon="material-symbols:check-circle"
                    />
                    <div>
                      <p className="font-medium text-sm">GDPR Standards</p>
                      <p className="text-muted-foreground text-xs">
                        International best practices
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon
                      className="mt-0.5 h-5 w-5 text-emerald-600"
                      icon="material-symbols:check-circle"
                    />
                    <div>
                      <p className="font-medium text-sm">Regular Audits</p>
                      <p className="text-muted-foreground text-xs">
                        Quarterly compliance reviews
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="border-emerald-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="mb-2 flex items-center justify-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                  <Icon
                    className="h-4 w-4 text-white"
                    icon="material-symbols:support-agent"
                  />
                </div>
                <CardTitle className="text-emerald-900">Need Help?</CardTitle>
              </div>
              <p className="text-muted-foreground">
                Our Kenyan support team is here to help you understand your
                privacy rights and cookie preferences.
              </p>
            </CardHeader>
            <CardContent className="px-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <Icon
                    className="mx-auto mb-2 h-6 w-6 text-emerald-600"
                    icon="material-symbols:phone"
                  />
                  <p className="font-medium text-emerald-900 text-sm">
                    Call Us
                  </p>
                  <p className="text-muted-foreground text-xs">
                    +254 700 123 456
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <Icon
                    className="mx-auto mb-2 h-6 w-6 text-emerald-600"
                    icon="material-symbols:mail"
                  />
                  <p className="font-medium text-emerald-900 text-sm">
                    Email Us
                  </p>
                  <p className="text-muted-foreground text-xs">
                    privacy@rentsmart.co.ke
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <Icon
                    className="mx-auto mb-2 h-6 w-6 text-emerald-600"
                    icon="material-symbols:chat"
                  />
                  <p className="font-medium text-emerald-900 text-sm">
                    Live Chat
                  </p>
                  <p className="text-muted-foreground text-xs">24/7 Support</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="border-emerald-200 border-t py-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <Icon className="h-4 w-4" icon="material-symbols:update" />
              <span>Last updated: January 2024</span>
            </div>
            <p className="mx-auto max-w-2xl text-muted-foreground text-xs">
              This cookie policy is part of our comprehensive privacy framework
              designed to protect Kenyan users while providing exceptional
              AI-powered property rental services across all major cities in
              Kenya.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
