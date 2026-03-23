'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Award, Download, Share2, CheckCircle, Lock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface CertificateEligibility {
  eligible: boolean;
  completedCount: number;
}

interface Certificate {
  id: string;
  title: string;
  issue_date: string;
  challenge_ids: string[];
  blockchain_verified: boolean;
}

interface Challenge {
  id: string;
  title: string;
  category: string;
  completed: boolean;
}

const REQUIRED_CHALLENGES = 10;

export default function CertificatePage() {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<CertificateEligibility | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();

      // Get eligibility
      const { data: eligibilityData } = await supabase
        .rpc('check_certificate_eligibility', { user_uuid: user?.id });

      if (eligibilityData) {
        setEligibility(eligibilityData[0]);
      }

      // Get certificates
      const { data: certData } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user?.id)
        .order('issue_date', { ascending: false });

      setCertificates(certData || []);

      // Get challenges with completion status
      const { data: allChallenges } = await supabase
        .from('challenges')
        .select('id, title, category');

      const { data: completedSubs } = await supabase
        .from('submissions')
        .select('challenge_id')
        .eq('user_id', user?.id)
        .eq('status', 'passed');

      const completedIds = new Set(completedSubs?.map(s => s.challenge_id) || []);

      const mappedChallenges = (allChallenges || []).map(c => ({
        ...c,
        completed: completedIds.has(c.id),
      }));

      setChallenges(mappedChallenges);
    } catch (e) {
      console.error('Error fetching certificate data:', e);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async () => {
    if (!eligibility?.eligible || !user) return;

    setGenerating(true);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();

      const completedChallengeIds = challenges
        .filter(c => c.completed)
        .map(c => c.id)
        .slice(0, REQUIRED_CHALLENGES);

      const certificateTitle = `SkillProof Developer Certificate - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

      const { data: newCert, error } = await supabase
        .from('certificates')
        .insert({
          user_id: user.id,
          challenge_ids: completedChallengeIds,
          title: certificateTitle,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Certificate generated successfully!');
      await fetchData();
    } catch (error) {
      console.error('Certificate generation error:', error);
      toast.error('Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const downloadCertificate = (certId: string) => {
    window.open(`/api/certificate/${certId}`, '_blank');
  };

  const shareOnLinkedIn = (cert: Certificate) => {
    const text = encodeURIComponent(
      `I just earned my ${cert.title} from SkillProof! Check it out: ${window.location.origin}/certificate/verify/${cert.id}`
    );
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + '/certificate/verify/' + cert.id)}`,
      '_blank'
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Certificates</h1>
        <p className="text-gray-600 mb-6">Please log in to view your certificates.</p>
        <Link href="/login" className="text-primary-600 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-200 rounded w-2/3 mx-auto"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const progress = eligibility ? (eligibility.completedCount / REQUIRED_CHALLENGES) * 100 : 0;
  const remaining = REQUIRED_CHALLENGES - (eligibility?.completedCount || 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2 text-center">Certificates</h1>
      <p className="text-gray-600 text-center mb-8">Earn certificates by completing challenges</p>

      {/* Progress Section */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className={`rounded-xl p-8 ${eligibility?.eligible ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${eligibility?.eligible ? 'bg-green-500' : 'bg-gray-300'}`}>
              <Award className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center mb-2">
            {eligibility?.eligible ? 'You Are Eligible!' : 'Keep Going!'}
          </h2>

          <p className="text-center text-gray-600 mb-6">
            {eligibility?.eligible
              ? 'You have completed 10+ challenges and can now generate your certificate!'
              : `Complete ${remaining} more ${remaining === 1 ? 'challenge' : 'challenges'} to earn your certificate.`}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-primary-600 rounded-full h-3 transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            ></div>
          </div>

          <p className="text-center text-sm text-gray-600">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            {eligibility?.completedCount || 0} / {REQUIRED_CHALLENGES} challenges completed
          </p>

          {eligibility?.eligible && (
            <button
              onClick={generateCertificate}
              disabled={generating}
              className="w-full mt-6 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Award className="w-5 h-5" />
              {generating ? 'Generating...' : 'Generate Certificate'}
            </button>
          )}
        </div>
      </div>

      {/* Your Certificates */}
      {certificates.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Your Certificates</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div key={cert.id} className="bg-white rounded-xl shadow-md border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary-600" />
                  </div>
                  {cert.blockchain_verified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>

                <h3 className="font-semibold mb-1">{cert.title}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Issued: {new Date(cert.issue_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => downloadCertificate(cert.id)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => shareOnLinkedIn(cert)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Share2 className="w-4 h-4" />
                    LinkedIn
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Challenge Progress */}
      <div className="max-w-2xl mx-auto mt-12">
        <h2 className="text-xl font-bold mb-4">Challenge Progress</h2>
        <div className="space-y-2">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                challenge.completed ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {challenge.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-400" />
                )}
                <span className={challenge.completed ? 'text-gray-900' : 'text-gray-500'}>
                  {challenge.title}
                </span>
              </div>
              <span className="text-sm text-gray-500 capitalize">{challenge.category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
