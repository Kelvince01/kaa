import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";

export function CTASection() {
	return (
		<section className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-20">
			<div className="container mx-auto text-center">
				<div className="mx-auto max-w-3xl">
					<h2 className="mb-4 font-bold font-heading text-4xl text-white">
						Ready to Transform Your Property Management?
					</h2>
					<p className="mb-8 text-emerald-100 text-xl">
						Join thousands of property managers across Kenya who are already using AI to maximize
						their rental income and minimize their workload.
					</p>
					<div className="flex flex-col justify-center gap-4 sm:flex-row">
						<Button
							size="lg"
							className="bg-white px-8 py-6 text-emerald-700 text-lg hover:bg-emerald-50"
						>
							<Icon icon="material-symbols:rocket-launch" className="mr-2 h-5 w-5" />
							Start Your Free Trial
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="border-white px-8 py-6 text-lg text-white hover:bg-white hover:text-emerald-700"
						>
							<Icon icon="material-symbols:schedule" className="mr-2 h-5 w-5" />
							Schedule Demo
						</Button>
					</div>
					<p className="mt-4 text-emerald-200 text-sm">
						No credit card required • 14-day free trial • Cancel anytime
					</p>
				</div>
			</div>
		</section>
	);
}
