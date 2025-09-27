import { Icon } from "@iconify/react";
import { Separator } from "@kaa/ui/components/separator";
import { HelpButton } from "@/components/layout/help";
import { useLayout } from "@/hooks/use-layout";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { isFullScreen } = useLayout();

  if (isFullScreen) return null;

  return (
    <footer className="bg-emerald-900 px-4 py-12 text-white">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <Icon className="h-5 w-5 text-white" icon="mdi:home-search" />
              </div>
              <span className="font-bold font-heading text-xl">Kaa</span>
            </div>
            <p className="text-emerald-200 text-sm">
              Revolutionizing property rental in Kenya with AI-powered matching
              and seamless experiences.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Platform</h4>
            <div className="space-y-2 text-emerald-200 text-sm">
              <a className="block hover:text-white" href="/properties">
                Find Rentals
              </a>
              <a className="block hover:text-white" href="/ai-assistant">
                AI Assistant
              </a>
              <a className="block hover:text-white" href="/virtual-tours">
                Virtual Tours
              </a>
              <a className="block hover:text-white" href="/mobile-app">
                Mobile App
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Support</h4>
            <div className="space-y-2 text-emerald-200 text-sm">
              <a className="block hover:text-white" href="/help-center">
                Help Center
              </a>
              <a className="block hover:text-white" href="/contact-us">
                Contact Us
              </a>
              <a className="block hover:text-white" href="/safety">
                Safety
              </a>
              <a className="block hover:text-white" href="/terms-of-service">
                Terms of Service
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Connect</h4>
            <div className="flex space-x-4">
              <a className="text-emerald-200 hover:text-white" href="/facebook">
                <Icon className="h-6 w-6" icon="mdi:facebook" />
              </a>
              <a className="text-emerald-200 hover:text-white" href="/twitter">
                <Icon className="h-6 w-6" icon="mdi:twitter" />
              </a>
              <a
                className="text-emerald-200 hover:text-white"
                href="/instagram"
              >
                <Icon className="h-6 w-6" icon="mdi:instagram" />
              </a>
              <a className="text-emerald-200 hover:text-white" href="/linkedin">
                <Icon className="h-6 w-6" icon="mdi:linkedin" />
              </a>
              <HelpButton />
            </div>
          </div>
        </div>
        <Separator className="my-8 bg-emerald-800" />
        <div className="flex flex-col items-center justify-between text-emerald-200 text-sm md:flex-row">
          <p>© {currentYear} Kaa. All rights reserved.</p>
          <div className="mt-4 flex space-x-6 md:mt-0">
            <a className="hover:text-white" href="/privacy-policy">
              Privacy Policy
            </a>
            <a className="hover:text-white" href="/terms-of-service">
              Terms of Service
            </a>
            <a className="hover:text-white" href="/cookie-policy">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
