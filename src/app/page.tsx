import Link from 'next/link';
import HeroCTA from '@/components/HeroCTA';
import DailyChallenge from '@/components/DailyChallenge';

export default function HomePage() {
  return (
    <div>
      {/* Daily Challenge Banner */}
      <section className="py-6">
        <DailyChallenge />
      </section>

      <section className="text-center py-20">
        <h1 className="text-5xl font-bold mb-4">Verify Your Skills</h1>
        <p className="text-xl text-gray-600 mb-8">
          SkillProof helps you prove your abilities through short, timed coding challenges.
          Earn badges, track your progress, and showcase your expertise.
        </p>
        <HeroCTA />
      </section>

      <section className="py-16 bg-white rounded-lg shadow-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose a Challenge</h3>
              <p className="text-gray-600">Pick from a variety of coding challenges across different difficulty levels and categories.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💻</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Write Code</h3>
              <p className="text-gray-600">Complete the challenge within the time limit. Our automated judging system evaluates your solution.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Earn Badges</h3>
              <p className="text-gray-600">Earn points and badges as you complete challenges. Build a verifiable skill profile.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Popular Categories</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {['Algorithms', 'Data Structures', 'Web Development', 'Databases', 'Security', 'DevOps'].map(cat => (
            <span key={cat} className="bg-gray-200 px-4 py-2 rounded-full text-gray-800">
              {cat}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
