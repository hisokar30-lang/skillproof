'use client';

import Link from 'next/link';
import { Mail, Github, Twitter, Linkedin, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="text-2xl font-bold text-white">
              SkillProof
            </Link>
            <p className="mt-2 text-sm text-gray-400">
              Verify your coding skills through timed challenges.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/challenges" className="hover:text-white transition">Challenges</Link></li>
              <li><Link href="/progress" className="hover:text-white transition">Progress</Link></li>
              <li><Link href="/leaderboard" className="hover:text-white transition">Leaderboard</Link></li>
              <li><Link href="/certificate" className="hover:text-white transition">Certificates</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-white mb-3">Need Help?</h3>
            <p className="text-sm text-gray-400 mb-3">
              Found a bug or have a feature request? Let us know!
            </p>
            <a
              href="mailto:hisokar30@gmail.com"
              className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition"
            >
              <Mail className="w-4 h-4" />
              <span className="font-medium">hisokar30@gmail.com</span>
            </a>
            <p className="mt-2 text-xs text-gray-500">
              We typically respond within 24 hours.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {currentYear} SkillProof. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500" /> for developers
          </p>
        </div>
      </div>
    </footer>
  );
}
