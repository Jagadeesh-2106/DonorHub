import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Counts {
  donors: number;
  hospitals: number;
  requests: number;
  pending_requests: number;
  completed_requests: number;
}

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

const AdminDashboard: React.FC = () => {
  const { signOut } = useAuth();
  const [counts, setCounts] = useState<Counts>({
    donors: 0,
    hospitals: 0,
    requests: 0,
    pending_requests: 0,
    completed_requests: 0,
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: donorsData }, { data: hospitalsData }, { data: requestsData }, { data: recentUsersData }] =
          await Promise.all([
            supabase.from('donors').select('*', { count: 'exact' }),
            supabase.from('hospitals').select('*', { count: 'exact' }),
            supabase.from('blood_requests').select('*', { count: 'exact' }),
            supabase
              .from('profiles')
              .select('id,email,role,name')
              .order('created_at', { ascending: false })
              .limit(5),
          ]);

        const pendingReqCount = (requestsData || []).filter((r: any) => r.status === 'pending').length;
        const completedReqCount = (requestsData || []).filter((r: any) => r.status === 'completed').length;

        setCounts({
          donors: donorsData?.length || 0,
          hospitals: hospitalsData?.length || 0,
          requests: requestsData?.length || 0,
          pending_requests: pendingReqCount,
          completed_requests: completedReqCount,
        });

        setRecentUsers(recentUsersData || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch admin data');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-backgroundLight">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-textSecondary font-semibold">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-backgroundLight">
        <div className="bg-white p-8 rounded-lg shadow-card border border-border max-w-md text-center space-y-4">
          <h2 className="text-xl font-bold">Error loading admin panel</h2>
          <p className="text-textSecondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-backgroundLight font-sans">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-subtle px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-textPrimary tracking-tight">Admin Console</span>
        </div>
        <button onClick={signOut} className="text-sm font-bold text-primary hover:text-primary-hover transition" title="Sign Out">
          <span className="hidden sm:inline">Sign Out</span>
          <svg className="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10 animate-fade-in-up">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Platform Diagnostics Overview</h1>
          <p className="text-textSecondary text-sm mt-0.5">Real-time metrics, user flow summaries, and distribution ratios.</p>
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KpiCard title="Total Donors" count={counts.donors} color="border-l-primary" />
          <KpiCard title="Total Hospitals" count={counts.hospitals} color="border-l-slate-800" />
          <KpiCard title="Total Requests" count={counts.requests} color="border-l-slate-500" />
          <KpiCard title="Pending" count={counts.pending_requests} color="border-l-warning" />
          <KpiCard title="Completed" count={counts.completed_requests} color="border-l-success" />
        </section>

        {/* Double Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Registrations */}
          <section className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Recent User Registrations</h2>
            <div className="bg-white border border-border rounded-xl shadow-subtle overflow-hidden">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 border-b border-border">
                  <tr>
                    <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Name</th>
                    <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Email</th>
                    <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">System Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-4 font-bold text-textPrimary">{user.name || 'Unnamed User'}</td>
                      <td className="p-4 text-textSecondary font-semibold">{user.email}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === 'hospital'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Blood Chart */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Blood Group Distribution</h2>
            <div className="bg-white border border-border rounded-xl shadow-subtle p-6 flex flex-col justify-center">
              <BloodGroupDistribution />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

interface KpiCardProps {
  title: string;
  count: number;
  color?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, count, color }) => (
  <div className={`bg-white rounded-xl shadow-subtle p-5 border border-border border-l-4 ${color} premium-card-hover`}>
    <p className="text-3xl font-extrabold text-textPrimary tracking-tight">{count}</p>
    <p className="text-textSecondary text-xs font-semibold uppercase tracking-wider mt-1">{title}</p>
  </div>
);

const BloodGroupDistribution: React.FC = () => {
  const [data, setData] = React.useState<Record<string, number>>({});
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    const fetchDistribution = async () => {
      let distribution: Record<string, number> = {};
      try {
        for (const bg of bloodGroups) {
          const { count } = await supabase
            .from('donors')
            .select('blood_group', { count: 'exact', head: true })
            .eq('blood_group', bg);
          distribution[bg] = count || 0;
        }
        setData(distribution);
      } catch {
        setData({});
      }
    };
    fetchDistribution();
  }, []);

  const max = Math.max(...Object.values(data), 10);

  return (
    <div className="space-y-4">
      <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block mb-2">Registered Donor Counts</span>
      <div className="space-y-3">
        {bloodGroups.map((bg) => {
          const val = data[bg] || 0;
          const pct = Math.min((val / max) * 100, 100);
          return (
            <div key={bg} className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-textPrimary">Group {bg}</span>
                <span className="text-primary">{val} donor(s)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
