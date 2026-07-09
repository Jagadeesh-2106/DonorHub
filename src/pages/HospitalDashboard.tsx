import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import { Link } from 'react-router-dom';

interface BloodRequest {
  id: string;
  blood_group: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  donor_responses_count: number;
}

const HospitalDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('blood_requests')
          .select(`
            id,
            blood_group,
            quantity,
            status,
            created_at,
            request_responses (
              id
            )
          `)
          .eq('hospital_id', user.id);

        if (error) throw error;

        const formatted = data?.map((req: any) => ({
          id: req.id,
          blood_group: req.blood_group,
          quantity: req.quantity,
          status: req.status,
          created_at: req.created_at,
          donor_responses_count: req.request_responses?.length || 0,
        }));

        setRequests(formatted || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load blood requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-backgroundLight">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-textSecondary font-semibold">Loading hospital dashboard...</p>
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
          <span className="font-bold text-lg text-textPrimary tracking-tight">Hospital Dashboard</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/donor/list" className="text-sm font-semibold text-textSecondary hover:text-primary transition" title="Search Donors">
            <span className="hidden sm:inline">Search Donors</span>
            <svg className="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
          <Link to="/profile" className="text-sm font-semibold text-textSecondary hover:text-primary transition" title="My Profile">
            <span className="hidden sm:inline">My Profile</span>
            <svg className="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
          <button onClick={signOut} className="text-sm font-bold text-primary hover:text-primary-hover transition" title="Sign Out">
            <span className="hidden sm:inline">Sign Out</span>
            <svg className="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8 animate-fade-in-up">
        {/* Banner Action */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-border p-6 rounded-xl shadow-subtle">
          <div>
            <h1 className="text-2xl font-bold text-textPrimary">Welcome back, {user?.name || 'Medical Center'}</h1>
            <p className="text-textSecondary text-sm mt-1">Manage inventories, request compatibility logs, and review donors.</p>
          </div>
          <Link to="/hospital/create-request">
            <Button variant="primary">Create Blood Request</Button>
          </Link>
        </section>

        {/* Requests Table */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Blood Requests History</h2>
          {requests.length === 0 ? (
            <div className="bg-white border border-border p-10 rounded-xl text-center text-textSecondary space-y-4 shadow-subtle">
              <p className="font-semibold text-textPrimary">No blood requests filed yet</p>
              <p className="text-sm max-w-sm mx-auto">Create a request to alert compatible donors registered in the platform registry.</p>
              <Link to="/hospital/create-request" className="inline-block">
                <Button variant="primary">Create Blood Request</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-xl shadow-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 border-b border-border">
                    <tr>
                      <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Blood Group</th>
                      <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Quantity Needed</th>
                      <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Request Status</th>
                      <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Donor Responses</th>
                      <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Filed Date</th>
                      <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4">
                          <span className="inline-block bg-primary/10 text-primary font-bold text-xs px-2.5 py-1 rounded-md">
                            {req.blood_group}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-textPrimary">{req.quantity} unit(s)</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${
                            req.status === 'pending'
                              ? 'bg-warning/10 text-warning'
                              : req.status === 'completed'
                              ? 'bg-success/10 text-success'
                              : 'bg-error/10 text-error'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              req.status === 'pending'
                                ? 'bg-warning'
                                : req.status === 'completed'
                                ? 'bg-success'
                                : 'bg-error'
                            }`}></span>
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4 text-textSecondary font-semibold">
                          {req.donor_responses_count} response(s)
                        </td>
                        <td className="p-4 text-textSecondary font-medium">
                          {new Date(req.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            to={`/hospital/request/${req.id}`}
                            className="inline-flex items-center text-primary font-semibold hover:underline text-xs"
                          >
                            Manage Request &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default HospitalDashboard;
