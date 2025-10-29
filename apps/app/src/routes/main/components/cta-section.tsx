import { Icon } from "@iconify/react";
import { Button } from "@kaa/ui/components/button";
// import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section className="bg-linear-to-r from-emerald-600 to-emerald-700 px-4 py-20">
      <div className="container mx-auto text-center">
        <div className="mx-auto max-w-3xl">
          {/* <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          > */}
          <h2 className="mb-4 font-bold font-heading text-4xl text-white">
            Ready to Transform Your Property Management?
          </h2>
          <p className="mb-8 text-emerald-100 text-xl">
            Join thousands of property managers across Kenya who are already
            using AI to maximize their rental income and minimize their
            workload.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              className="bg-white px-8 py-6 text-emerald-700 text-lg hover:bg-emerald-50"
              size="lg"
            >
              <Icon
                className="mr-2 h-5 w-5"
                icon="material-symbols:rocket-launch"
              />
              Start Your Free Trial
            </Button>
            <Button
              className="border-white px-8 py-6 text-lg text-white hover:bg-white hover:text-emerald-700"
              size="lg"
              variant="outline"
            >
              <Icon className="mr-2 h-5 w-5" icon="material-symbols:schedule" />
              Schedule Demo
            </Button>
          </div>
          <p className="mt-4 text-emerald-200 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
          {/* </motion.div> */}
        </div>
      </div>
    </section>
  );
}
