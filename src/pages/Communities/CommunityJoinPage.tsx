import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communitiesService, CommunityInfo } from '../../services/communities-service';
import { Users, ShieldCheck, Clock, CheckCircle, XCircle, ArrowRight, Sparkles } from 'lucide-react';

const CommunityJoinPage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<CommunityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (inviteCode) {
      fetchCommunity(inviteCode);
    }
  }, [inviteCode]);

  const fetchCommunity = async (code: string) => {
    try {
      const data = await communitiesService.getByInviteCode(code);
      if (!data) {
        setError('Community not found or invalid invite link.');
      } else {
        setCommunity(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch community info.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    if (!community) return;
    setRequesting(true);
    try {
      if (community.type === 'public') {
        await communitiesService.joinPublicCommunity(community.id);
        setCommunity(prev => prev ? { ...prev, is_member: true } : null);
      } else {
        await communitiesService.requestToJoin(community.id);
        setCommunity(prev => prev ? { ...prev, request_status: 'pending' } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to process request.');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium tracking-wide">Verifying Invite Link...</p>
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <XCircle size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
          <p className="text-sm text-gray-500 mb-8">{error || 'This invite link has expired or is incorrect.'}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl max-w-lg w-full overflow-hidden">
        <div className="h-32 bg-indigo-600 relative">
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
              <Users size={32} className="text-indigo-600" />
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/20">
              Community Invite
            </div>
          </div>
        </div>

        <div className="pt-14 pb-8 px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{community.name}</h1>
          <p className="text-sm text-gray-500 mb-6 line-clamp-3">{community.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-indigo-600 mb-1 flex justify-center"><Users size={18} /></div>
              <div className="text-lg font-bold text-gray-900">{community.member_count}</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Members</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-emerald-600 mb-1 flex justify-center"><ShieldCheck size={18} /></div>
              <div className="text-lg font-bold text-gray-900">Verified</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status</div>
            </div>
          </div>

          {community?.is_member ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700">
                <CheckCircle size={20} />
                <span className="text-sm font-semibold">You are already a member of this community.</span>
              </div>
              <button 
                onClick={() => navigate('/communities')}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                Go to Chat <ArrowRight size={18} />
              </button>
            </div>
          ) : community.request_status === 'pending' ? (
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
                <Clock size={24} />
              </div>
              <h3 className="font-bold text-amber-900 mb-1">Request Pending</h3>
              <p className="text-xs text-amber-700">An admin will review your request to join soon.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={handleJoinRequest}
                disabled={requesting}
                className={`w-full py-4 text-white rounded-2xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                  community.type === 'public' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                {requesting 
                  ? (community.type === 'public' ? 'Joining...' : 'Sending Request...') 
                  : (community.type === 'public' ? 'Join Community' : 'Request to Join')} 
                <Sparkles size={18} />
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityJoinPage;
