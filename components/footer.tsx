import React from "react";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Camera,
  Linkedin,
  Youtube,
} from 'lucide-react';

const Footer = () => {
  return (
    <footer
      className="bg-[#0e1626] text-white px-6 md:px-20 py-10"
      role="contentinfo"
      aria-label="Footer"
    >
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-28">
        {/* Logo and About */}
        <div>
          <div className="flex gap-5">
            <Link href="/" className="flex items-center" aria-label="GBU Home">
              <img
                src="/1.png"
                alt="GBU Logo"
                className="h-13 w-auto"
              />
            </Link>
            <Link href="/" className="flex items-center" aria-label="GBU Home">
              <img
                src="/nssLogo.png"
                alt="GBU Logo"
                className="h-11 w-auto"
              />
            </Link>
            <Link href="/" className="flex items-center" aria-label="GBU Home">
              <img
                src="/myBharatLogo.png"
                alt="GBU Logo"
                className="h-12 w-auto"
              />
            </Link>
            </div>
          <p className="text-gray-400 text-sm mt-4">
            Gautam Buddha University, Greater Noida, is committed to providing
            world-class education and fostering innovation for a better
            tomorrow.
          </p>
         <div
      className="flex gap-4 mt-4 text-xl"
      aria-label="Social media links"
    >
      <Facebook className="w-6 h-6 text-blue-600 hover:text-blue-800" />

        <Instagram className="w-6 h-6 text-pink-500 hover:text-pink-700 transition-colors" />
        <Camera className="w-6 h-6 text-gray-600 hover:text-black transition-colors" />
        <Linkedin className="w-6 h-6 text-blue-700 hover:text-blue-900 transition-colors" />
        <Youtube className="w-6 h-6 text-red-600 hover:text-red-800 transition-colors" />
    </div>
        </div>

        {/* Quick Links */}
        <nav aria-label="Quick links">
          <h3 className="font-semibold text-lg mb-3">Quick Links</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            {[
              "About",
              "Volunteer Registration",
            ].map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>


        {/* Contact */}
        <section aria-label="Contact information">
          <h3 className="font-semibold text-lg mb-3">Contact Us</h3>
          <address className="not-italic text-gray-300 text-sm">
            <strong>Address:</strong>
            <br />
            NSS Cell Admin Office 
            <br />
            Gautam Buddha University
            <br />
            Greater Noida, Uttar Pradesh
            <br />
            PIN: 201312
          </address>
          <p className="mt-2 text-sm text-gray-300">
            <strong>Phone:</strong>{" "}
            <a
              href="tel:+911202344000"
              className="hover:text-orange-500"
            >
              +91-120-234-4000
            </a>
            <br />
            <strong>Email:</strong>{" "}
            <a
              href="mailto:info@gbu.ac.in"
              className="hover:text-orange-500"
            >
              nss@gbu.ac.in
            </a>
          </p>
          <div className="mt-4">
            <label
              htmlFor="newsletter-email"
              className="font-semibold text-sm block mb-1"
            >
              Subscribe to Newsletter
            </label>
          </div>
        </section>
      </div>

      {/* Bottom Line */}
      <div className="mt-6 border-t border-gray-700 pt-4 text-sm text-gray-400 flex flex-col md:flex-row justify-between">
        <p>© 2025 Gautam Buddha University. All rights reserved.</p>
        <div>
          <p>
            Designed and developed by{" "}
            <a href="#" className="hover:text-white font-semibold cursor-pointer">
              NSS Cell, Gautam Buddha University
            </a>{" "}
          </p>
        </div>
        <div className="flex gap-4 mt-2 md:mt-0">
          {["Privacy Policy", "Terms of Use", "Sitemap"].map((link) => (
            <a
              key={link}
              href="#"
              className="hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
