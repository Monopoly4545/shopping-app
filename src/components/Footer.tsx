import Link from "next/link";
import { Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="text-2xl font-bold text-white">
              Shop<span className="text-blue-500">Ease.</span>
            </Link>

            <p className="mt-4 text-sm text-gray-400 leading-6">
              Discover quality products at great prices. Shop smarter, live
              better with ShopEase.
            </p>

            <div className="flex gap-4 mt-6">
              <a
                href="#"
                aria-label="Website"
                className="hover:text-blue-500 transition"
              >
                <Globe size={20} />
              </a>

              <a
                href="#"
                aria-label="Email"
                className="hover:text-blue-500 transition"
              >
                <Mail size={20} />
              </a>

              <a
                href="#"
                aria-label="Contact"
                className="hover:text-blue-500 transition"
              >
                <MessageCircle size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-5">
              Quick Links
            </h3>

            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="hover:text-blue-400">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-blue-400">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-400">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-5">
              Customer Service
            </h3>

            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/faq" className="hover:text-blue-400">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-blue-400">
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-blue-400">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-400">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-5">
              Contact Us
            </h3>

            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-blue-500" />
                support@shopease.com
              </li>

              <li className="flex items-center gap-3">
                <Phone size={18} className="text-blue-500" />
                +95 9 123 456 789
              </li>

              <li className="flex items-center gap-3">
                <MapPin size={18} className="text-blue-500" />
                Myanmar
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} ShopEase. All rights reserved.</p>

          <p>Designed with care for better shopping.</p>
        </div>
      </div>
    </footer>
  );
}
