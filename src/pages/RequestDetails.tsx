import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';

interface DonorResponse {
  id: string;
  donor_id: string;
  response: 'accepted' | 'declined';
  response_date: string;
  donor_name?: string;
}

interface RequestDetailsData {
  id: string;
  blood_group: string;
  quantity: number;
  status: string;
  created_at: string;
  hospital_id: string;
  hospitals: {
    hospital_name: string;
  };
}

const RequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [request, setRequest] = useState<RequestDetailsData | null>(null);
  const [responses, setResponses] = useState<DonorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [localStock, setLocalStock] = useState<number | null>(null);
  const [fulfillingFromStorage, setFulfillingFromStorage] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: requestData, error: reqError } = await supabase
          .from('blood_requests')
          .select(`
            id,
            blood_group,
            quantity,
            status,
            created_at,
            hospital_id,
            hospitals (
              hospital_name
            )
          `)
          .eq('id', id)
          .single();

        if (reqError || !requestData) throw reqError || new Error('Request not found.');

        if (requestData.hospital_id !== user.id && user.role !== 'admin') {
          throw new Error('Access denied.');
        }

        setRequest({
          id: requestData.id,
          blood_group: requestData.blood_group,
          quantity: requestData.quantity,
          status: requestData.status,
          created_at: requestData.created_at,
          hospital_id: requestData.hospital_id,
          hospitals: {
            hospital_name: Array.isArray(requestData.hospitals)
              ? (requestData.hospitals[0] as any)?.hospital_name || 'Unknown Hospital'
              : (requestData.hospitals as any)?.hospital_name || 'Unknown Hospital',
          },
        });

        if (user.role === 'hospital' && requestData.hospital_id === user.id) {
          const { data: invData, error: invError } = await supabase
            .from('hospital_blood_inventory')
            .select('quantity')
            .eq('hospital_id', user.id)
            .eq('blood_group', requestData.blood_group)
            .maybeSingle();

          if (!invError && invData) {
            setLocalStock(invData.quantity);
          } else {
            setLocalStock(0);
          }
        }

        const { data: responsesData, error: respError } = await supabase
          .from('request_responses')
          .select(`
            id,
            donor_id,
            response,
            response_date,
            donors (
              profiles (
                name
              )
            )
          `)
          .eq('request_id', id);

        if (respError) throw respError;

        setResponses(
          (responsesData || []).map((r: any) => ({
            id: r.id,
            donor_id: r.donor_id,
            response: r.response,
            response_date: r.response_date,
            donor_name: r.donors?.profiles?.name || 'Unnamed Donor',
          }))
        );
      } catch (err: any) {
        setError(err.message || 'Failed to load request details');
      }
      setLoading(false);
    };

    fetchData();
  }, [id, user]);

  const handleFulfillFromStorage = async () => {
    if (!id || !request || localStock === null || !user) return;
    if (localStock < request.quantity) {
      alert('Insufficient stock in your local blood storage.');
      return;
    }

    const confirmFulfill = window.confirm(
      `Are you sure you want to fulfill this request of ${request.quantity} unit(s) of ${request.blood_group} from your local storage? This will decrement your stock from ${localStock} to ${localStock - request.quantity}.`
    );

    if (!confirmFulfill) return;

    setFulfillingFromStorage(true);
    try {
      // 1. Decrement inventory stock
      const { error: invError } = await supabase
        .from('hospital_blood_inventory')
        .upsert({
          hospital_id: user.id,
          blood_group: request.blood_group,
          quantity: localStock - request.quantity,
          updated_at: new Date().toISOString()
        }, { onConflict: 'hospital_id,blood_group' });

      if (invError) throw invError;

      // 2. Mark request as completed
      const { error: reqError } = await supabase
        .from('blood_requests')
        .update({ status: 'completed' })
        .eq('id', id);

      if (reqError) throw reqError;

      // 3. Update states
      setLocalStock(localStock - request.quantity);
      setRequest({ ...request, status: 'completed' });
      alert('Request successfully fulfilled using your blood storage!');
    } catch (err: any) {
      alert(err.message || 'Failed to fulfill request from storage.');
    } finally {
      setFulfillingFromStorage(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!id) return;
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('blood_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      if (request) setRequest({ ...request, status: newStatus });
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
    setUpdatingStatus(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-backgroundLight">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-textSecondary font-semibold">Loading request details...</p>
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
          <h2 className="text-xl font-bold">Failed to load request</h2>
          <p className="text-textSecondary text-sm">{error}</p>
          <Link to="/hospital/dashboard">
            <Button className="w-full mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="min-h-screen bg-backgroundLight font-sans">
      <header className="bg-white border-b border-border shadow-subtle px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <Link to="/hospital/dashboard" className="text-textSecondary hover:text-primary transition-all">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="font-bold text-lg text-textPrimary tracking-tight">Request Details</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8 animate-fade-in-up">
        {/* Info Card */}
        <section className="bg-white border border-border rounded-xl p-6 shadow-subtle grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Blood Group</span>
            <p className="text-lg font-bold text-primary flex items-center">
              <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded font-extrabold text-sm mr-2">
                {request.blood_group}
              </span>
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Quantity Required</span>
            <p className="text-lg font-bold text-textPrimary">{request.quantity} Unit(s)</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Current Status</span>
            <p className="flex items-center mt-1">
              <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${
                request.status === 'pending'
                  ? 'bg-warning/10 text-warning'
                  : request.status === 'completed'
                  ? 'bg-success/10 text-success'
                  : 'bg-error/10 text-error'
              }`}>
                {request.status.toUpperCase()}
              </span>
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Requested On</span>
            <p className="text-sm font-semibold text-textPrimary">
              {new Date(request.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </p>
          </div>
        </section>

        {/* Local Storage Fulfillment */}
        {user?.role === 'hospital' && request.hospital_id === user.id && request.status === 'pending' && (
          <section className="bg-white border border-border rounded-xl p-6 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-bold text-textPrimary text-base font-sans">Local Storage Fulfillment</h3>
                <p className="text-xs text-textSecondary mt-0.5 font-sans">
                  Check and consume units from your own blood bank registry to satisfy this request.
                </p>
              </div>
              <div>
                {localStock !== null ? (
                  <div className="text-sm font-semibold font-sans">
                    Current {request.blood_group} Stock:{' '}
                    <span
                      className={`font-black ${
                        localStock >= request.quantity ? 'text-success' : 'text-error'
                      }`}
                    >
                      {localStock} unit(s)
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-textSecondary font-sans">Checking inventory...</span>
                )}
              </div>
            </div>

            {localStock !== null && (
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-xs text-textSecondary max-w-lg font-sans">
                  {localStock >= request.quantity
                    ? `You have sufficient stock. Fulfilling will deduct ${request.quantity} units of ${request.blood_group} from your storage and complete the request.`
                    : `You have insufficient stock (${localStock}/${request.quantity} units required). Please update your inventory in the dashboard or search nearby blood banks.`}
                </p>
                <Button
                  variant="primary"
                  onClick={handleFulfillFromStorage}
                  disabled={localStock < request.quantity || fulfillingFromStorage}
                  loading={fulfillingFromStorage}
                  className="w-full sm:w-auto text-xs justify-center font-sans"
                >
                  Fulfill from Storage
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Action Controls */}
        {(user?.role === 'hospital' || user?.role === 'admin') && request.status === 'pending' && (
          <section className="bg-white border border-border rounded-xl p-6 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-textPrimary text-base">Modify Request Status</h3>
              <p className="text-xs text-textSecondary mt-0.5">Transition this request when you receive the units or wish to abort.</p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <Button
                variant="primary"
                onClick={() => updateStatus('completed')}
                disabled={updatingStatus}
                className="flex-grow sm:flex-none justify-center text-xs"
              >
                Mark as Completed
              </Button>
              <Button
                variant="secondary"
                onClick={() => updateStatus('cancelled')}
                disabled={updatingStatus}
                className="flex-grow sm:flex-none justify-center text-xs"
              >
                Cancel Request
              </Button>
            </div>
          </section>
        )}

        {/* Responses Table */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Active Donor Responses</h2>
          {responses.length === 0 ? (
            <div className="bg-white border border-border p-10 rounded-xl text-center text-textSecondary shadow-subtle">
              <p className="font-semibold text-textPrimary">No responses recorded</p>
              <p className="text-xs max-w-xs mx-auto mt-2">Compatible donors will appear here once they accept or decline this request on their dashboard.</p>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-xl shadow-subtle overflow-hidden">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 border-b border-border">
                  <tr>
                    <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Donor Name</th>
                    <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Decision</th>
                    <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Response Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {responses.map((resp) => (
                    <tr key={resp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 font-bold text-textPrimary">{resp.donor_name}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${
                          resp.response === 'accepted' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                        }`}>
                          {resp.response.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-textSecondary font-medium">
                        {new Date(resp.response_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default RequestDetails;
