import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import { Link } from 'react-router-dom';

interface BloodRequest {
  id: string;
  hospital_name: string;
  blood_group: string;
  quantity: number;
  status: string;
  created_at: string;
}

interface RequestResponse {
  id: string;
  request_id: string;
  response: 'accepted' | 'declined';
}

const DonorDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [availability, setAvailability] = useState<boolean>(true);
  const [activeRequests, setActiveRequests] = useState<BloodRequest[]>([]);
  const [requestResponses, setRequestResponses] = useState<RequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: donorData, error: donorError } = await supabase
          .from('donors')
          .select('availability_status, blood_group')
          .eq('id', user.id)
          .single();

        if (donorError) throw donorError;
        if (donorData) {
          setAvailability(donorData.availability_status);
        }

        const bloodGroup = donorData?.blood_group || '';
        const compatibleGroups = await getCompatibleBloodGroups(bloodGroup);

        const { data: requestsData, error: requestsError } = await supabase
          .from('blood_requests')
          .select(`id, blood_group, quantity, status, created_at, hospitals (hospital_name)`)
          .eq('status', 'pending')
          .in('blood_group', compatibleGroups);

        if (requestsError) throw requestsError;
        setActiveRequests(
          (requestsData || []).map((r: any) => ({
            id: r.id,
            blood_group: r.blood_group,
            quantity: r.quantity,
            status: r.status,
            created_at: r.created_at,
            hospital_name: r.hospitals?.hospital_name || 'Unknown Hospital',
          }))
        );

        const { data: responsesData, error: responsesError } = await supabase
          .from('request_responses')
          .select('id, request_id, response')
          .eq('donor_id', user.id);

        if (responsesError) throw responsesError;
        setRequestResponses(responsesData || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const getCompatibleBloodGroups = async (recipientBloodGroup: string): Promise<string[]> => {
    const compatibility: Record<string, string[]> = {
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      'AB-': ['A-', 'B-', 'AB-', 'O-'],
      'O+': ['O+', 'O-'],
      'O-': ['O-'],
    };
    return compatibility[recipientBloodGroup] || [];
  };

  const toggleAvailability = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('donors')
        .update({ availability_status: !availability })
        .eq('id', user.id);

      if (error) throw error;
      setAvailability(!availability);
    } catch (err: any) {
      setError(err.message || 'Failed to update availability');
    }
    setLoading(false);
  };

  const respondToRequest = async (requestId: string, response: 'accepted' | 'declined') => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('request_responses').upsert({
        donor_id: user.id,
        request_id: requestId,
        response,
        response_date: new Date().toISOString(),
      });

      if (error) throw error;
      setRequestResponses((prev) => [
        ...prev.filter((r) => r.request_id !== requestId),
        { id: '', request_id: requestId, response },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to submit response');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-backgroundLight">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-textSecondary font-semibold">Loading your donor profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-backgroundLight">
        <div className="bg-white p-8 rounded-lg shadow-card border border-border max-w-md text-center space-y-4">
          <div className="text-error bg-error/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Error Loading Dashboard</h2>
          <p className="text-textSecondary text-sm">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-backgroundLight font-sans">
      {/* Navigation Header */}
      <header className="bg-white border-b border-border shadow-subtle px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-textPrimary tracking-tight">Donor Dashboard</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/profile" className="text-sm font-semibold text-textSecondary hover:text-primary transition" title="My Profile">
            <span className="hidden sm:inline">My Profile</span>
            <svg className="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
          <Link to="/notifications" className="text-sm font-semibold text-textSecondary hover:text-primary transition relative" title="Notifications">
            <span className="hidden sm:inline">Notifications</span>
            <svg className="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {requestResponses.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                {requestResponses.length}
              </span>
            )}
          </Link>
          <button onClick={signOut} className="text-sm font-bold text-primary hover:text-primary-hover transition" title="Sign Out">
            <span className="hidden sm:inline">Sign Out</span>
            <svg className="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10 animate-fade-in-up">
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-border p-6 rounded-xl shadow-subtle">
          <div>
            <h1 className="text-2xl font-bold text-textPrimary">Hello, {user?.name || 'Blood Donor'}</h1>
            <p className="text-textSecondary text-sm mt-1">Thank you for donating and supporting your local medical grid.</p>
          </div>
          <div className="flex items-center space-x-4 bg-backgroundLight px-4 py-2.5 rounded-lg border border-border">
            <div className="flex flex-col text-sm">
              <span className="text-textSecondary text-xs font-semibold uppercase tracking-wider">My Status</span>
              <span className={`font-bold mt-0.5 ${availability ? 'text-success' : 'text-error'}`}>
                {availability ? '🟢 Active & Available' : '🔴 Paused / Away'}
              </span>
            </div>
            <Button onClick={toggleAvailability} variant={availability ? 'secondary' : 'primary'} className="py-1.5 px-3 text-xs">
              {availability ? 'Go Away' : 'Go Active'}
            </Button>
          </div>
        </section>

        {/* Requests Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Compatible Requests</h2>
          {activeRequests.length === 0 ? (
            <div className="bg-white border border-border p-8 rounded-xl text-center text-textSecondary space-y-2 shadow-subtle">
              <p className="font-semibold text-textPrimary">All Quiet on Your Grid</p>
              <p className="text-sm">There are no pending blood requests compatible with your group at this moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeRequests.map((req) => {
                const existingResponse = requestResponses.find((r) => r.request_id === req.id);
                return (
                  <div
                    key={req.id}
                    className="bg-white border border-border rounded-xl p-5 shadow-subtle flex flex-col justify-between hover:border-primary/20 premium-card-hover"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-textPrimary text-base leading-tight">{req.hospital_name}</h3>
                        <span className="bg-primary/10 text-primary text-xs font-extrabold px-2.5 py-1 rounded-md">
                          Group {req.blood_group}
                        </span>
                      </div>
                      <div className="text-xs text-textSecondary space-y-1">
                        <p>Quantity Required: <strong className="text-textPrimary">{req.quantity} units</strong></p>
                        <p>Requested On: {new Date(req.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                      {existingResponse ? (
                        <span
                          className={`text-xs font-bold px-3 py-1.5 rounded-full select-none ${
                            existingResponse.response === 'accepted' ? 'bg-success/15 text-success' : 'bg-error/15 text-error'
                          }`}
                        >
                          Response: {existingResponse.response.charAt(0).toUpperCase() + existingResponse.response.slice(1)}
                        </span>
                      ) : (
                        <>
                          <Button onClick={() => respondToRequest(req.id, 'accepted')} className="py-1.5 px-4 text-xs">
                            Accept Request
                          </Button>
                          <Button onClick={() => respondToRequest(req.id, 'declined')} variant="secondary" className="py-1.5 px-4 text-xs">
                            Decline
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Responses History */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Recent Response Log</h2>
          {requestResponses.length === 0 ? (
            <p className="text-textSecondary text-sm">No recent transactions recorded.</p>
          ) : (
            <div className="bg-white border border-border rounded-xl overflow-hidden shadow-subtle">
              <ul className="divide-y divide-border">
                {requestResponses.map((resp, i) => (
                  <li key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                    <span className="text-sm font-semibold text-textPrimary">Request Reference ID: {resp.request_id.slice(0, 8)}...</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        resp.response === 'accepted' ? 'bg-success/15 text-success' : 'bg-error/15 text-error'
                      }`}
                    >
                      {resp.response.toUpperCase()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DonorDashboard;
