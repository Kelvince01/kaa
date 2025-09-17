import {
  Facebook,
  HelpCircle,
  Home,
  Info,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  Twitter,
} from "lucide-react";
import Link from "next/link";
import type React from "react";

/**
 * Footer component with navigation, contact info, and social links
 */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 pt-12 pb-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Information */}
          <div>
            <h3 className="mb-4 font-bold text-lg">Kaa</h3>
            <p className="mb-4 text-gray-400">
              Finding your perfect rental property has never been easier. Browse
              thousands of properties and connect directly with landlords.
            </p>
            <div className="flex space-x-4">
              <a
                aria-label="Twitter"
                className="text-gray-400 transition-colors hover:text-white"
                href="https://twitter.com"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                aria-label="Facebook"
                className="text-gray-400 transition-colors hover:text-white"
                href="https://facebook.com"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                aria-label="Instagram"
                className="text-gray-400 transition-colors hover:text-white"
                href="https://instagram.com"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                aria-label="LinkedIn"
                className="text-gray-400 transition-colors hover:text-white"
                href="https://linkedin.com"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-bold text-lg">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  className="flex items-center text-gray-400 hover:text-white"
                  href="/"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </li>
              <li>
                <Link
                  className="flex items-center text-gray-400 hover:text-white"
                  href="/properties"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Find Properties
                </Link>
              </li>
              <li>
                <Link
                  className="flex items-center text-gray-400 hover:text-white"
                  href="/about"
                >
                  <Info className="mr-2 h-4 w-4" />
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  className="flex items-center text-gray-400 hover:text-white"
                  href="/contact"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  className="flex items-center text-gray-400 hover:text-white"
                  href="/how-it-works"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* For Tenants */}
          <div>
            <h3 className="mb-4 font-bold text-lg">For Tenants</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  className="text-gray-400 hover:text-white"
                  href="/search-tips"
                >
                  Property Search Tips
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 hover:text-white"
                  href="/tenant-guide"
                >
                  Tenant Guide
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 hover:text-white"
                  href="/rent-calculator"
                >
                  Rent Affordability Calculator
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 hover:text-white"
                  href="/tenant-rights"
                >
                  Tenant Rights
                </Link>
              </li>
              <li>
                <Link className="text-gray-400 hover:text-white" href="/faq">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* For Landlords */}
          <div>
            <h3 className="mb-4 font-bold text-lg">For Landlords</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  className="text-gray-400 hover:text-white"
                  href="/landlord-signup"
                >
                  List Your Property
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 hover:text-white"
                  href="/landlord-guide"
                >
                  Landlord Guide
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 hover:text-white"
                  href="/pricing"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 hover:text-white"
                  href="/landlord-resources"
                >
                  Resources
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 hover:text-white"
                  href="/landlord-faq"
                >
                  Landlord FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact & Copyright */}
        <div className="mt-12 border-gray-800 border-t pt-8">
          <div className="flex flex-col md:flex-row md:justify-between">
            <div className="mb-4 md:mb-0">
              <div className="mb-2 flex items-center">
                <Phone className="mr-2 h-4 w-4 text-gray-400" />
                <span className="text-gray-400">+254 712 345 678</span>
              </div>
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-gray-400" />
                <a
                  className="text-gray-400 hover:text-white"
                  href="mailto:contact@kaa.co.ke"
                >
                  contact@kaa.co.ke
                </a>
              </div>
            </div>

            <div className="flex flex-col text-gray-400 md:flex-row md:space-x-4">
              <Link
                className="mb-2 hover:text-white md:mb-0"
                href="/privacy-policy"
              >
                Privacy Policy
              </Link>
              <Link className="mb-2 hover:text-white md:mb-0" href="/terms">
                Terms & Conditions
              </Link>
              <Link className="hover:text-white" href="/cookies">
                Cookie Policy
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center text-gray-500 text-sm">
            <p>&copy; {currentYear} Kaa. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
