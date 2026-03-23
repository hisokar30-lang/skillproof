import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SocialProofBanner from '@/components/SocialProofBanner';

export const metadata: Metadata = {
  title: 'SkillProof - Verify Your Skills',
  description: 'Skill verification platform with programming challenges',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <SocialProofBanner />
        <main className="container mx-auto px-4 py-8 flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
