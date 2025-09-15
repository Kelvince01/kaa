import { Icon } from "@iconify/react";
import { Badge } from "@kaa/ui/components/badge";
import { Card, CardContent } from "@kaa/ui/components/card";

const features = [
	{
		icon: "material-symbols:psychology",
		title: "AI Tenant Screening",
		description:
			"Automatically evaluate potential tenants using AI algorithms that analyze credit history, employment status, and rental history specific to Kenya.",
	},
	{
		icon: "material-symbols:price-change",
		title: "Smart Rent Pricing",
		description:
			"AI-driven rent optimization based on location, property features, market trends, and seasonal demand patterns in Kenyan cities.",
	},
	{
		icon: "material-symbols:support-agent",
		title: "24/7 AI Assistant",
		description:
			"Multilingual AI chatbot that handles tenant inquiries in English, Swahili, and other local languages, providing instant support.",
	},
	{
		icon: "material-symbols:analytics",
		title: "Predictive Analytics",
		description:
			"Forecast market trends, predict maintenance needs, and identify optimal times for rent adjustments using advanced AI models.",
	},
	{
		icon: "material-symbols:mobile-friendly",
		title: "Mobile-First Design",
		description:
			"Optimized for mobile devices with offline capabilities, perfect for property managers on the go across Kenya's diverse landscapes.",
	},
	{
		icon: "material-symbols:payments",
		title: "M-Pesa Integration",
		description:
			"Seamless integration with M-Pesa and other local payment systems for automated rent collection and financial management.",
	},
];

export function FeaturesSection() {
	return (
		<section className="bg-white px-4 py-20">
			<div className="container mx-auto">
				<div className="mb-16 text-center">
					<Badge className="mb-4 border-emerald-300 bg-emerald-100 text-emerald-800">
						Powerful Features
					</Badge>
					<h2 className="mb-4 font-bold font-heading text-4xl text-emerald-900">
						Everything You Need to Manage Properties Efficiently
					</h2>
					<p className="mx-auto max-w-3xl text-emerald-700 text-xl">
						Our AI-powered platform is designed specifically for the Kenyan market, understanding
						local regulations, pricing trends, and tenant preferences.
					</p>
				</div>
				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, index) => (
						<Card key={index} className="border-emerald-200 transition-shadow hover:shadow-lg">
							<CardContent className="p-6">
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
									<Icon icon={feature.icon} className="h-6 w-6 text-emerald-600" />
								</div>
								<h3 className="mb-2 font-semibold text-emerald-800 text-xl">{feature.title}</h3>
								<p className="text-emerald-600">{feature.description}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}
