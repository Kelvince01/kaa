import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";
import { Badge } from "@kaa/ui/components/badge";
import { Card, CardContent } from "@kaa/ui/components/card";

const plans = [
	{
		name: "Starter",
		price: "KES 2,500",
		period: "per month",
		features: [
			"Up to 10 properties",
			"AI tenant screening",
			"M-Pesa integration",
			"Basic analytics",
		],
		buttonText: "Get Started",
		buttonVariant: "default" as const,
	},
	{
		name: "Professional",
		price: "KES 7,500",
		period: "per month",
		isPopular: true,
		features: [
			"Up to 50 properties",
			"Advanced AI features",
			"24/7 AI assistant",
			"Predictive analytics",
			"Priority support",
		],
		buttonText: "Get Started",
		buttonVariant: "default" as const,
	},
	{
		name: "Enterprise",
		price: "Custom",
		period: "pricing",
		features: [
			"Unlimited properties",
			"Custom AI models",
			"API access",
			"Dedicated support",
			"White-label options",
		],
		buttonText: "Contact Sales",
		buttonVariant: "outline" as const,
	},
];

export function PricingSection() {
	return (
		<section className="bg-white px-4 py-20">
			<div className="container mx-auto">
				<div className="mb-16 text-center">
					<h2 className="mb-4 font-bold font-heading text-4xl text-emerald-900">
						Simple, Transparent Pricing
					</h2>
					<p className="text-emerald-700 text-xl">
						Choose the plan that fits your property portfolio
					</p>
				</div>
				<div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
					{plans.map((plan, index) => (
						<Card
							key={index}
							className={`${
								plan.isPopular ? "relative border-emerald-600 shadow-lg" : "border-emerald-200"
							}`}
						>
							{plan.isPopular && (
								<div className="-top-4 -translate-x-1/2 absolute left-1/2 transform">
									<Badge className="bg-emerald-600 text-white">Most Popular</Badge>
								</div>
							)}
							<CardContent className="p-6">
								<div className="mb-6 text-center">
									<h3 className="mb-2 font-semibold text-emerald-800 text-xl">{plan.name}</h3>
									<div className="font-bold text-3xl text-emerald-900">{plan.price}</div>
									<div className="text-emerald-600">{plan.period}</div>
								</div>
								<ul className="mb-6 space-y-3">
									{plan.features.map((feature, featureIndex) => (
										<li key={featureIndex} className="flex items-center space-x-2">
											<Icon icon="material-symbols:check" className="h-5 w-5 text-emerald-600" />
											<span className="text-emerald-700">{feature}</span>
										</li>
									))}
								</ul>
								<Button
									className={
										plan.buttonVariant === "outline"
											? "w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50"
											: "w-full bg-emerald-600 text-white hover:bg-emerald-700"
									}
									variant={plan.buttonVariant}
								>
									{plan.buttonText}
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}
