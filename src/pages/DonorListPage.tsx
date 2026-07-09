import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import DonorSearchFilter from '../components/DonorSearchFilter';
import { Link } from 'react-router-dom';

interface Donor {
  id: string;
  name: string;
  blood_group: string;
  city?: string;
  district?: string;
  availability_status: boolean;
}

const DonorListPage: React.FC = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ blood_group: '', city: '', district: '', availability: '' });

  useEffect(() => {
    fetchDonors();
  }, [filters]);

  const fetchDonors = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('donors').select('id,blood_group,availability_status,city,district,profiles(name)').eq('availability_status', true);

      if (filters.blood_group) {
        query = query.eq('blood_group', filters.blood_group);
      }
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.district) {
        query = query.ilike('district', `%${filters.district}%`);
      }
      if (filters.availability) {
        query = query.eq('availability_status', filters.availability === 'true');
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      setDonors(
        (data || []).map((d: any) => ({
          id: d.id,
          blood_group: d.blood_group,
          availability_status: d.availability_status,
          city: d.city,
          district: d.district,
          name: d.profiles?.name || 'Unnamed Donor',
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to fetch donors');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-backgroundLight font-sans">
      <header className="bg-white border-b border-border shadow-subtle px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <Link to="/hospital/dashboard" className="text-textSecondary hover:text-primary transition-all">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="font-bold text-lg text-textPrimary tracking-tight">Donor Registry Search</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Search Platform Donors</h1>
          <p className="text-textSecondary text-sm mt-0.5">Filter by group, city, district, and current availability status.</p>
        </div>

        <DonorSearchFilter onFilterChange={setFilters} />

        {loading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          </div>
        )}

        {error && (
          <div className="bg-error/10 border border-error/20 p-4 rounded-xl text-center text-error font-semibold text-sm">
            {error}
          </div>
        )}

        {!loading && !error && donors.length === 0 && (
          <div className="bg-white border border-border p-10 rounded-xl text-center text-textSecondary shadow-subtle">
            <p className="font-semibold text-textPrimary">No compatible donors found</p>
            <p className="text-xs mt-1">Try broadening your search filter values.</p>
          </div>
        )}

        {!loading && donors.length > 0 && (
          <div className="bg-white border border-border rounded-xl shadow-subtle overflow-hidden animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 border-b border-border">
                  <tr>
                    <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Donor Name</th>
                    <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Blood Group</th>
                    <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">City</th>
                    <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">District</th>
                    <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">System Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {donors.map((donor) => (
                    <tr key={donor.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 font-bold text-textPrimary">{donor.name}</td>
                      <td className="p-4">
                        <span className="inline-block bg-primary/10 text-primary font-bold text-xs px-2.5 py-1 rounded-md">
                          {donor.blood_group}
                        </span>
                      </td>
                      <td className="p-4 text-textSecondary font-semibold">{donor.city || '-'}</td>
                      <td className="p-4 text-textSecondary font-semibold">{donor.district || '-'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${
                          donor.availability_status ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            donor.availability_status ? 'bg-success' : 'bg-error'
                          }`}></span>
                          {donor.availability_status ? 'Available' : 'Away'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DonorListPage;
