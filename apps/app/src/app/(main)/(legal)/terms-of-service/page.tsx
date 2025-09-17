import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-12 text-center">
          {/* <div className="mb-6 inline-flex items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
							<Icon icon="ph:house-line-bold" className="h-6 w-6 text-white" />
						</div>
						<h1 className="font-bold font-heading text-3xl text-emerald-900">RentAI Kenya</h1>
					</div> */}
          <h2 className="mb-4 font-bold font-heading text-4xl text-emerald-900">
            Terms of Service
          </h2>
          <p className="mx-auto max-w-2xl text-emerald-700 text-lg">
            Your AI-powered property rental platform built for the Kenyan
            market. Please read these terms carefully before using our services.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 text-sm">
            <Icon className="h-4 w-4" icon="ph:calendar" />
            <span>Last updated: July 2025</span>
          </div>
        </div>
        <Card className="mb-8 border-emerald-200 pt-0 shadow-lg">
          <CardHeader className="rounded-t-lg bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" icon="ph:info-bold" />
              Important Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-medium text-emerald-800">
                By accessing or using RentAI Kenya, you agree to be bound by
                these Terms of Service and our Privacy Policy. These terms are
                specifically designed for property rental services in Kenya and
                comply with local regulations.
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card className="border-emerald-200 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <Icon
                  className="h-5 w-5 text-emerald-600"
                  icon="ph:user-circle-bold"
                />
                1. Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              <p className="mb-4 text-gray-700">
                These Terms of Service ("Terms") govern your use of RentAI
                Kenya's platform, including our AI-powered property matching,
                virtual tours, and rental management services. By creating an
                account or using our services, you acknowledge that you:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <Icon
                    className="mt-0.5 h-4 w-4 text-emerald-500"
                    icon="ph:check-circle-fill"
                  />
                  Are at least 18 years old and legally capable of entering
                  contracts in Kenya
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    className="mt-0.5 h-4 w-4 text-emerald-500"
                    icon="ph:check-circle-fill"
                  />
                  Have read and understood these Terms and our Privacy Policy
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    className="mt-0.5 h-4 w-4 text-emerald-500"
                    icon="ph:check-circle-fill"
                  />
                  Agree to comply with all applicable Kenyan laws and
                  regulations
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <Icon
                  className="h-5 w-5 text-emerald-600"
                  icon="ph:robot-bold"
                />
                2. AI-Powered Services
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              <p className="mb-4 text-gray-700">
                RentAI Kenya utilizes artificial intelligence to enhance your
                property rental experience. Our AI services include:
              </p>
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-emerald-900">
                    <Icon className="h-4 w-4" icon="ph:magnifying-glass-bold" />
                    Smart Property Matching
                  </h4>
                  <p className="text-emerald-700 text-sm">
                    AI algorithms match tenants with suitable properties based
                    on preferences, budget, and location in Kenya.
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-emerald-900">
                    <Icon
                      className="h-4 w-4"
                      icon="ph:currency-circle-dollar-bold"
                    />
                    Dynamic Pricing
                  </h4>
                  <p className="text-emerald-700 text-sm">
                    Market-based rental price suggestions considering Kenyan
                    property market trends and local factors.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-amber-800 text-sm">
                  <strong>Disclaimer:</strong> AI recommendations are based on
                  data analysis and should not be considered as professional
                  real estate advice. Always verify property details and conduct
                  due diligence before making rental decisions.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <Icon
                  className="h-5 w-5 text-emerald-600"
                  icon="ph:shield-check-bold"
                />
                3. User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 font-semibold text-emerald-900">
                    For Property Owners/Landlords:
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <Icon
                        className="mt-0.5 h-4 w-4 text-emerald-500"
                        icon="ph:check-circle-fill"
                      />
                      Provide accurate property information and photos
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon
                        className="mt-0.5 h-4 w-4 text-emerald-500"
                        icon="ph:check-circle-fill"
                      />
                      Maintain valid property ownership or management
                      authorization
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon
                        className="mt-0.5 h-4 w-4 text-emerald-500"
                        icon="ph:check-circle-fill"
                      />
                      Comply with Kenyan rental laws and regulations
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-emerald-900">
                    For Tenants:
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <Icon
                        className="mt-0.5 h-4 w-4 text-emerald-500"
                        icon="ph:check-circle-fill"
                      />
                      Provide truthful information about income and rental
                      history
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon
                        className="mt-0.5 h-4 w-4 text-emerald-500"
                        icon="ph:check-circle-fill"
                      />
                      Respect property viewing schedules and guidelines
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon
                        className="mt-0.5 h-4 w-4 text-emerald-500"
                        icon="ph:check-circle-fill"
                      />
                      Honor rental agreements and payment terms
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <Icon
                  className="h-5 w-5 text-emerald-600"
                  icon="ph:credit-card-bold"
                />
                4. Payment Terms & Fees
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <h4 className="mb-2 font-semibold text-emerald-900">
                  Service Fees (in Kenyan Shillings)
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-emerald-700 text-sm">
                      Property Listing Fee:
                    </p>
                    <p className="font-bold text-emerald-900">
                      KES 500/month per property
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-emerald-700 text-sm">
                      Transaction Fee:
                    </p>
                    <p className="font-bold text-emerald-900">
                      2.5% of monthly rent
                    </p>
                  </div>
                </div>
              </div>
              <p className="mb-4 text-gray-700">
                Payments are processed through secure channels including M-Pesa,
                bank transfers, and major credit cards. All fees are subject to
                applicable Kenyan taxes including VAT where applicable.
              </p>
              <div className="flex items-center gap-2 text-emerald-600">
                <Icon className="h-4 w-4" icon="ph:shield-check" />
                <span className="text-sm">
                  Secure payment processing with 256-bit SSL encryption
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <Icon
                  className="h-5 w-5 text-emerald-600"
                  icon="ph:scales-bold"
                />
                5. Kenyan Legal Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              <p className="mb-4 text-gray-700">
                RentAI Kenya operates in compliance with Kenyan laws and
                regulations, including but not limited to:
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Icon
                      className="mt-0.5 h-4 w-4 text-emerald-500"
                      icon="ph:check-circle-fill"
                    />
                    <span className="text-gray-700 text-sm">
                      The Landlord and Tenant Act
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon
                      className="mt-0.5 h-4 w-4 text-emerald-500"
                      icon="ph:check-circle-fill"
                    />
                    <span className="text-gray-700 text-sm">
                      Data Protection Act, 2019
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon
                      className="mt-0.5 h-4 w-4 text-emerald-500"
                      icon="ph:check-circle-fill"
                    />
                    <span className="text-gray-700 text-sm">
                      Consumer Protection Act
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Icon
                      className="mt-0.5 h-4 w-4 text-emerald-500"
                      icon="ph:check-circle-fill"
                    />
                    <span className="text-gray-700 text-sm">
                      Competition Act
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon
                      className="mt-0.5 h-4 w-4 text-emerald-500"
                      icon="ph:check-circle-fill"
                    />
                    <span className="text-gray-700 text-sm">
                      Anti-Money Laundering regulations
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon
                      className="mt-0.5 h-4 w-4 text-emerald-500"
                      icon="ph:check-circle-fill"
                    />
                    <span className="text-gray-700 text-sm">
                      Central Bank of Kenya guidelines
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <Icon
                  className="h-5 w-5 text-emerald-600"
                  icon="ph:warning-bold"
                />
                6. Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="mb-2 font-medium text-red-800">
                  Important Limitation Notice:
                </p>
                <p className="text-red-700 text-sm">
                  RentAI Kenya acts as a platform facilitating connections
                  between property owners and tenants. We are not responsible
                  for the actual rental agreements, property conditions, or
                  disputes between parties.
                </p>
              </div>
              <p className="mb-4 text-gray-700">
                Our liability is limited to the maximum extent permitted by
                Kenyan law. We recommend all users to:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <Icon
                    className="mt-0.5 h-4 w-4 text-emerald-500"
                    icon="ph:check-circle-fill"
                  />
                  Conduct thorough property inspections before signing
                  agreements
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    className="mt-0.5 h-4 w-4 text-emerald-500"
                    icon="ph:check-circle-fill"
                  />
                  Verify all property ownership and legal documentation
                </li>
                <li className="flex items-start gap-2">
                  <Icon
                    className="mt-0.5 h-4 w-4 text-emerald-500"
                    icon="ph:check-circle-fill"
                  />
                  Seek legal advice for complex rental agreements
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <Icon
                  className="h-5 w-5 text-emerald-600"
                  icon="ph:phone-bold"
                />
                7. Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <h4 className="mb-3 font-semibold text-emerald-900">
                  Get in Touch
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Icon
                      className="h-5 w-5 text-emerald-600"
                      icon="ph:envelope-bold"
                    />
                    <div>
                      <p className="font-medium text-emerald-900">
                        Email Support
                      </p>
                      <p className="text-emerald-700 text-sm">
                        support@rentai.co.ke
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon
                      className="h-5 w-5 text-emerald-600"
                      icon="ph:phone-bold"
                    />
                    <div>
                      <p className="font-medium text-emerald-900">
                        Phone Support
                      </p>
                      <p className="text-emerald-700 text-sm">
                        +254 700 123 456
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon
                      className="h-5 w-5 text-emerald-600"
                      icon="ph:map-pin-bold"
                    />
                    <div>
                      <p className="font-medium text-emerald-900">
                        Office Address
                      </p>
                      <p className="text-emerald-700 text-sm">Nairobi, Kenya</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-12 text-center">
          <div className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
            <h3 className="mb-2 font-bold font-heading text-xl">
              Ready to Get Started?
            </h3>
            <p className="mb-4 opacity-90">
              Join thousands of Kenyans who trust RentAI for their property
              rental needs
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button className="bg-white text-emerald-600 hover:bg-emerald-50">
                <Icon className="mr-2 h-4 w-4" icon="ph:plus-bold" />
                List Your Property
              </Button>
              <Button
                className="border-white text-white hover:bg-white hover:text-emerald-600"
                variant="outline"
              >
                <Icon className="mr-2 h-4 w-4" icon="ph:house-bold" />
                Find a Property
              </Button>
            </div>
          </div>
        </div>
        {/* <div className="mt-8 text-center text-emerald-600 text-sm">
					<p>© 2024 RentAI Kenya. All rights reserved. Made with ❤️ for Kenya.</p>
				</div> */}
      </div>
    </div>
  );
}
