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

interface NearbyHospital {
  id: string;
  hospital_name: string;
  address: string;
  city: string;
  district: string;
  contact_person: string;
  profiles?: {
    email: string;
    phone: string;
  } | null;
  hospital_blood_inventory: {
    blood_group: string;
    quantity: number;
  }[];
}

interface InterHospitalRequest {
  id: string;
  requester_id: string;
  provider_id: string;
  blood_group: string;
  quantity: number;
  emergency_level: 'low' | 'medium' | 'high' | 'critical';
  purpose: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  requester?: {
    hospital_name: string;
    city: string;
    district: string;
    profiles?: {
      email: string;
      phone: string;
    } | null;
  } | null;
  provider?: {
    hospital_name: string;
    city: string;
    district: string;
    profiles?: {
      email: string;
      phone: string;
    } | null;
  } | null;
}

const HospitalDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'inventory' | 'nearby' | 'hospital_requests'>('requests');
  
  // Requests State
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  // Inventory State
  const [inventory, setInventory] = useState<Record<string, number>>({
    'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
  });
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [updatingGroup, setUpdatingGroup] = useState<string | null>(null);

  // Nearby Blood Banks State
  const [nearbyBanks, setNearbyBanks] = useState<NearbyHospital[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(true);
  
  // Hospital location profile
  const [myProfile, setMyProfile] = useState<{ city: string; district: string } | null>(null);

  // Filters for Nearby Blood Banks
  const [searchName, setSearchName] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [showOnlyNearby, setShowOnlyNearby] = useState(true);

  // Inter-Hospital Requests State
  const [incomingRequests, setIncomingRequests] = useState<InterHospitalRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<InterHospitalRequest[]>([]);
  const [loadingInter, setLoadingInter] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Send Transfer Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<NearbyHospital | null>(null);
  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferEmergency, setTransferEmergency] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [transferPurpose, setTransferPurpose] = useState<string>('Surgery');
  const [transferBloodGroup, setTransferBloodGroup] = useState<string>('A+');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const fetchRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    setRequestsError(null);

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
      setRequestsError(err.message || 'Failed to load blood requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchInventory = async () => {
    if (!user) return;
    setLoadingInventory(true);
    try {
      const { data, error } = await supabase
        .from('hospital_blood_inventory')
        .select('blood_group, quantity')
        .eq('hospital_id', user.id);

      if (error) throw error;

      const invMap: Record<string, number> = {
        'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
      };
      if (data) {
        data.forEach((item: any) => {
          invMap[item.blood_group] = item.quantity || 0;
        });
      }
      setInventory(invMap);
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoadingInventory(false);
    }
  };

  const fetchNearbyBanks = async () => {
    if (!user) return;
    setLoadingNearby(true);
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select(`
          id,
          hospital_name,
          address,
          city,
          district,
          contact_person,
          profiles (
            email,
            phone
          ),
          hospital_blood_inventory (
            blood_group,
            quantity
          )
        `)
        .neq('id', user.id);

      console.log('fetchNearbyBanks raw data:', data);
      console.log('fetchNearbyBanks error:', error);

      if (error) throw error;
      setNearbyBanks((data as any) || []);
    } catch (err: any) {
      console.error('Error fetching nearby banks:', err);
    } finally {
      setLoadingNearby(false);
    }
  };

  const fetchHospitalProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('city, district')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setMyProfile({
          city: data.city || '',
          district: data.district || '',
        });
        setFilterCity(data.city || '');
        setFilterDistrict(data.district || '');
      }
    } catch (err: any) {
      console.error('Error fetching hospital profile:', err);
    }
  };

  const fetchInterHospitalRequests = async () => {
    if (!user) return;
    setLoadingInter(true);
    try {
      const { data: incoming, error: incError } = await supabase
        .from('inter_hospital_requests')
        .select(`
          id,
          requester_id,
          provider_id,
          blood_group,
          quantity,
          emergency_level,
          purpose,
          status,
          created_at,
          requester:hospitals!requester_id (
            hospital_name,
            city,
            district,
            profiles (
              email,
              phone
            )
          )
        `)
        .eq('provider_id', user.id);

      if (incError) throw incError;

      const { data: outgoing, error: outError } = await supabase
        .from('inter_hospital_requests')
        .select(`
          id,
          requester_id,
          provider_id,
          blood_group,
          quantity,
          emergency_level,
          purpose,
          status,
          created_at,
          provider:hospitals!provider_id (
            hospital_name,
            city,
            district,
            profiles (
              email,
              phone
            )
          )
        `)
        .eq('requester_id', user.id);

      if (outError) throw outError;

      setIncomingRequests((incoming as any) || []);
      setOutgoingRequests((outgoing as any) || []);
    } catch (err: any) {
      console.error('Error fetching inter-hospital requests:', err);
    } finally {
      setLoadingInter(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchHospitalProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if (activeTab === 'requests') {
      fetchRequests();
    } else if (activeTab === 'inventory') {
      fetchInventory();
    } else if (activeTab === 'nearby') {
      fetchNearbyBanks();
    } else if (activeTab === 'hospital_requests') {
      fetchInterHospitalRequests();
    }
  }, [user, activeTab]);

  const handleUpdateStock = async (group: string, newQty: number) => {
    if (!user) return;
    if (newQty < 0) return;
    setUpdatingGroup(group);

    try {
      const { error } = await supabase
        .from('hospital_blood_inventory')
        .upsert({
          hospital_id: user.id,
          blood_group: group,
          quantity: newQty,
          updated_at: new Date().toISOString()
        }, { onConflict: 'hospital_id,blood_group' });

      if (error) throw error;
      setInventory(prev => ({
        ...prev,
        [group]: newQty
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    } finally {
      setUpdatingGroup(null);
    }
  };

  const handleAcceptInterRequest = async (req: InterHospitalRequest) => {
    if (!user) return;
    const confirmAccept = window.confirm(
      `Are you sure you want to approve this request of ${req.quantity} unit(s) of ${req.blood_group} for ${req.requester?.hospital_name}?`
    );
    if (!confirmAccept) return;

    setProcessingRequestId(req.id);
    try {
      // 1. Get current stock
      const { data: stockData, error: stockError } = await supabase
        .from('hospital_blood_inventory')
        .select('quantity')
        .eq('hospital_id', user.id)
        .eq('blood_group', req.blood_group)
        .maybeSingle();

      if (stockError) throw stockError;
      const currentStock = stockData?.quantity || 0;

      if (currentStock < req.quantity) {
        alert(`Insufficient stock. You only have ${currentStock} units of ${req.blood_group} available in your storage.`);
        return;
      }

      // 2. Decrement inventory
      const { error: invError } = await supabase
        .from('hospital_blood_inventory')
        .upsert({
          hospital_id: user.id,
          blood_group: req.blood_group,
          quantity: currentStock - req.quantity,
          updated_at: new Date().toISOString()
        }, { onConflict: 'hospital_id,blood_group' });

      if (invError) throw invError;

      // 3. Update status
      const { error: reqError } = await supabase
        .from('inter_hospital_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', req.id);

      if (reqError) throw reqError;

      alert('Blood transfer request approved successfully! Storage has been decremented.');
      fetchInterHospitalRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to accept request.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDeclineInterRequest = async (reqId: string) => {
    const confirmDecline = window.confirm('Are you sure you want to decline this blood transfer request?');
    if (!confirmDecline) return;

    setProcessingRequestId(reqId);
    try {
      const { error } = await supabase
        .from('inter_hospital_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', reqId);

      if (error) throw error;
      alert('Request declined.');
      fetchInterHospitalRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to decline request.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleSendTransferRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProvider) return;
    if (transferQty <= 0) {
      alert('Quantity must be a positive number.');
      return;
    }

    const providerAvailableStocks = selectedProvider.hospital_blood_inventory?.filter(inv => inv.quantity > 0) || [];
    const selectedStock = providerAvailableStocks.find(
      (inv) => inv.blood_group === transferBloodGroup
    );
    const maxQty = selectedStock ? selectedStock.quantity : 0;
    if (transferQty > maxQty) {
      alert(`Requested quantity exceeds the available stock of ${maxQty} unit(s) at ${selectedProvider.hospital_name}.`);
      return;
    }

    setSubmittingTransfer(true);
    try {
      const { error } = await supabase
        .from('inter_hospital_requests')
        .insert({
          requester_id: user.id,
          provider_id: selectedProvider.id,
          blood_group: transferBloodGroup,
          quantity: transferQty,
          emergency_level: transferEmergency,
          purpose: transferPurpose,
          status: 'pending'
        });

      if (error) throw error;

      alert(`Blood transfer request successfully sent to ${selectedProvider.hospital_name}!`);
      setIsRequestModalOpen(false);
      setTransferQty(1);
      setTransferEmergency('medium');
      setTransferPurpose('Surgery');
    } catch (err: any) {
      alert(err.message || 'Failed to send transfer request.');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const getProfileField = (bank: NearbyHospital, field: 'email' | 'phone') => {
    if (!bank.profiles) return '-';
    if (Array.isArray(bank.profiles)) {
      return bank.profiles[0]?.[field] || '-';
    }
    return (bank.profiles as any)[field] || '-';
  };

  const getInterProfileField = (bankProfile: any, field: 'email' | 'phone') => {
    if (!bankProfile) return '-';
    if (Array.isArray(bankProfile)) {
      return bankProfile[0]?.[field] || '-';
    }
    return bankProfile[field] || '-';
  };

  const filteredBanks = nearbyBanks.filter((bank) => {
    if (searchName && !bank.hospital_name.toLowerCase().includes(searchName.toLowerCase())) {
      return false;
    }
    if (filterCity && (!bank.city || !bank.city.toLowerCase().includes(filterCity.toLowerCase()))) {
      return false;
    }
    if (filterDistrict && (!bank.district || !bank.district.toLowerCase().includes(filterDistrict.toLowerCase()))) {
      return false;
    }
    if (showOnlyNearby && myProfile && (myProfile.city || myProfile.district)) {
      const matchCity = myProfile.city && bank.city && bank.city.toLowerCase() === myProfile.city.toLowerCase();
      const matchDistrict = myProfile.district && bank.district && bank.district.toLowerCase() === myProfile.district.toLowerCase();
      if (!matchCity && !matchDistrict) {
        return false;
      }
    }
    if (filterBloodGroup) {
      const hasGroup = bank.hospital_blood_inventory?.some(
        (inv) => inv.blood_group === filterBloodGroup && inv.quantity > 0
      );
      if (!hasGroup) return false;
    }
    return true;
  });

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

        {/* Navigation Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-6 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'requests'
                ? 'border-primary text-primary'
                : 'border-transparent text-textSecondary hover:text-textPrimary'
            }`}
          >
            Blood Requests
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-6 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'inventory'
                ? 'border-primary text-primary'
                : 'border-transparent text-textSecondary hover:text-textPrimary'
            }`}
          >
            My Blood Storage
          </button>
          <button
            onClick={() => setActiveTab('nearby')}
            className={`py-3 px-6 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'nearby'
                ? 'border-primary text-primary'
                : 'border-transparent text-textSecondary hover:text-textPrimary'
            }`}
          >
            Nearby Blood Banks
          </button>
          <button
            onClick={() => setActiveTab('hospital_requests')}
            className={`py-3 px-6 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'hospital_requests'
                ? 'border-primary text-primary'
                : 'border-transparent text-textSecondary hover:text-textPrimary'
            }`}
          >
            Hospital Requests
          </button>
        </div>

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Blood Requests History</h2>
            {loadingRequests ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : requestsError ? (
              <div className="bg-error/10 border border-error/20 p-4 rounded-xl text-center text-error font-semibold text-sm">
                {requestsError}
              </div>
            ) : requests.length === 0 ? (
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
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <section className="space-y-6 animate-fade-in-up">
            <div>
              <h2 className="text-xl font-bold text-textPrimary">My Blood Inventory</h2>
              <p className="text-textSecondary text-sm">Update and manage your hospital's current blood stock levels.</p>
            </div>
            {loadingInventory ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {Object.keys(inventory).map((group) => (
                  <div key={group} className="bg-white border border-border p-5 rounded-xl shadow-subtle flex flex-col justify-between items-center text-center space-y-4 hover:shadow-card transition-all duration-300">
                    <div className="bg-primary/10 text-primary font-black text-sm px-3.5 py-1.5 rounded-lg">
                      {group}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">Available Stock</span>
                      <div className="text-3xl font-black text-textPrimary tracking-tight">
                        {inventory[group]} <span className="text-xs font-semibold text-textSecondary">unit(s)</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 w-full justify-center">
                      <button
                        onClick={() => handleUpdateStock(group, Math.max(0, inventory[group] - 1))}
                        disabled={updatingGroup === group || inventory[group] <= 0}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 text-textPrimary font-bold text-lg rounded-lg transition"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={inventory[group]}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 0) {
                            handleUpdateStock(group, val);
                          }
                        }}
                        disabled={updatingGroup === group}
                        className="w-16 p-2 text-center bg-backgroundLight border border-border rounded text-sm text-textPrimary font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                      <button
                        onClick={() => handleUpdateStock(group, inventory[group] + 1)}
                        disabled={updatingGroup === group}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 text-textPrimary font-bold text-lg rounded-lg transition"
                      >
                        +
                      </button>
                    </div>
                    {updatingGroup === group && (
                      <div className="text-[10px] text-primary font-semibold animate-pulse">Saving to DB...</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Nearby Blood Banks Tab */}
        {activeTab === 'nearby' && (
          <section className="space-y-6 animate-fade-in-up">
            <div>
              <h2 className="text-xl font-bold text-textPrimary">Nearby Blood Banks & Storage</h2>
              <p className="text-textSecondary text-sm">Find resources at other medical facilities. Contact them to request transfer of compatible blood units.</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-subtle border border-border p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Hospital Name</label>
                <input
                  type="text"
                  placeholder="Search hospital..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Blood Group Needed</label>
                <select
                  value={filterBloodGroup}
                  onChange={(e) => setFilterBloodGroup(e.target.value)}
                  className="p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">All Blood Groups</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">City</label>
                <input
                  type="text"
                  placeholder="Filter by city..."
                  value={filterCity}
                  onChange={(e) => {
                    setFilterCity(e.target.value);
                    setShowOnlyNearby(false);
                  }}
                  className="p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">District</label>
                <input
                  type="text"
                  placeholder="Filter by district..."
                  value={filterDistrict}
                  onChange={(e) => {
                    setFilterDistrict(e.target.value);
                    setShowOnlyNearby(false);
                  }}
                  className="p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {myProfile && (myProfile.city || myProfile.district) ? (
                <div className="md:col-span-4 flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="showOnlyNearby"
                    checked={showOnlyNearby}
                    onChange={(e) => {
                      setShowOnlyNearby(e.target.checked);
                      if (e.target.checked) {
                        setFilterCity(myProfile.city);
                        setFilterDistrict(myProfile.district);
                      }
                    }}
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded cursor-pointer"
                  />
                  <label htmlFor="showOnlyNearby" className="text-sm font-semibold text-textSecondary cursor-pointer select-none">
                    Show only in my city ({myProfile.city || '-'}) / district ({myProfile.district || '-'})
                  </label>
                </div>
              ) : (
                <div className="md:col-span-4 text-xs text-warning bg-warning/10 p-3 rounded-lg border border-warning/20 font-sans font-medium flex items-center gap-2">
                  <span>⚠️ Location details are missing in your profile. Please set your city/district in your <Link to="/profile/edit" className="underline font-bold text-primary font-semibold">Profile</Link> to enable location-based matching. Currently displaying all blood banks.</span>
                </div>
              )}
            </div>

            {loadingNearby ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredBanks.length === 0 ? (
              <div className="bg-white border border-border p-10 rounded-xl text-center text-textSecondary shadow-subtle">
                <p className="font-semibold text-textPrimary">No matching blood banks or hospitals found</p>
                <p className="text-xs mt-1">Try resetting the filters or widening your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredBanks.map((bank) => {
                  const phone = getProfileField(bank, 'phone');
                  const email = getProfileField(bank, 'email');
                  const availableStocks = bank.hospital_blood_inventory?.filter(inv => inv.quantity > 0) || [];
                  
                  return (
                    <div key={bank.id} className="bg-white border border-border p-6 rounded-xl shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-textPrimary text-lg">{bank.hospital_name}</h3>
                          {showOnlyNearby && myProfile && (
                            (myProfile.city && bank.city?.toLowerCase() === myProfile.city.toLowerCase()) ||
                            (myProfile.district && bank.district?.toLowerCase() === myProfile.district.toLowerCase())
                          ) && (
                            <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Nearby
                            </span>
                          )}
                        </div>
                        
                        {/* Location details */}
                        <div className="flex items-center text-textSecondary text-xs space-x-1">
                          <svg className="h-4 w-4 text-textSecondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">
                            {bank.address ? `${bank.address}, ` : ''}{bank.city || '-'}{bank.district ? ` (${bank.district})` : ''}
                          </span>
                        </div>

                        {/* Contact details */}
                        <div className="border-t border-slate-50 pt-2 space-y-1.5 text-xs text-textSecondary">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-textPrimary">Contact:</span>
                            <span>{bank.contact_person || 'N/A'}</span>
                          </div>
                          {phone && phone !== '-' && (
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-textPrimary">Phone:</span>
                              <a href={`tel:${phone}`} className="text-primary hover:underline font-medium">{phone}</a>
                            </div>
                          )}
                          {email && email !== '-' && (
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-textPrimary">Email:</span>
                              <a href={`mailto:${email}`} className="text-primary hover:underline font-medium">{email}</a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stock availability */}
                      <div className="bg-slate-50/70 p-3 rounded-lg space-y-2 border border-slate-100">
                        <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">Available Stocks</span>
                        {availableStocks.length === 0 ? (
                          <span className="text-xs text-textSecondary italic block">No blood storage units registered.</span>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {availableStocks.map((stock) => (
                                <span key={stock.blood_group} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-success/10 text-success border border-success/20">
                                  {stock.blood_group}: {stock.quantity}
                                </span>
                              ))}
                            </div>
                            <Button
                              variant="primary"
                              onClick={() => {
                                setSelectedProvider(bank);
                                setTransferBloodGroup(availableStocks[0]?.blood_group || 'A+');
                                setIsRequestModalOpen(true);
                              }}
                              className="w-full text-xs justify-center font-sans py-1.5"
                            >
                              Request Blood Transfer
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Hospital Requests Tab */}
        {activeTab === 'hospital_requests' && (
          <section className="space-y-8 animate-fade-in-up font-sans">
            {/* Incoming Requests */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-textPrimary">Incoming Blood Requests</h2>
              <p className="text-textSecondary text-sm">Requests sent by other hospitals seeking your blood units.</p>
              
              {loadingInter ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : incomingRequests.length === 0 ? (
                <div className="bg-white border border-border p-8 rounded-xl text-center text-textSecondary shadow-subtle">
                  No incoming transfer requests found.
                </div>
              ) : (
                <div className="bg-white border border-border rounded-xl shadow-subtle overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-slate-50 border-b border-border">
                        <tr>
                          <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Requester</th>
                          <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Blood Group</th>
                          <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Quantity</th>
                          <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Emergency</th>
                          <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Purpose</th>
                          <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Status</th>
                          <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {incomingRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-4 font-bold text-textPrimary">
                              {req.requester?.hospital_name}
                              <div className="text-[10px] text-textSecondary font-semibold font-medium normal-case mt-0.5">
                                {req.requester?.city || '-'} ({req.requester?.district || '-'})
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="inline-block bg-primary/10 text-primary font-bold text-xs px-2.5 py-1 rounded-md">
                                {req.blood_group}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-textPrimary">{req.quantity} unit(s)</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                req.emergency_level === 'critical'
                                  ? 'bg-rose-100 text-rose-700'
                                  : req.emergency_level === 'high'
                                  ? 'bg-amber-100 text-amber-700'
                                  : req.emergency_level === 'medium'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {req.emergency_level.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-4 text-textSecondary font-semibold">{req.purpose}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                                req.status === 'accepted'
                                  ? 'bg-success/15 text-success'
                                  : req.status === 'declined'
                                  ? 'bg-error/15 text-error'
                                  : 'bg-warning/15 text-warning'
                              }`}>
                                {req.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {req.status === 'pending' ? (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="primary"
                                    onClick={() => handleAcceptInterRequest(req)}
                                    disabled={processingRequestId !== null}
                                    className="py-1 px-3 text-xs justify-center font-sans font-medium"
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    onClick={() => handleDeclineInterRequest(req.id)}
                                    disabled={processingRequestId !== null}
                                    className="py-1 px-3 text-xs justify-center font-sans font-medium"
                                  >
                                    Decline
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-textSecondary italic">Processed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-textPrimary">Outgoing Blood Requests</h2>
              <p className="text-textSecondary text-sm">Requests sent by you to other blood storage centers.</p>
              
              {loadingInter ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : outgoingRequests.length === 0 ? (
                <div className="bg-white border border-border p-8 rounded-xl text-center text-textSecondary shadow-subtle">
                  No outgoing transfer requests found.
                </div>
              ) : (
                <div className="bg-white border border-border rounded-xl shadow-subtle overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-slate-50 border-b border-border">
                        <tr>
                          <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Provider</th>
                          <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Blood Group</th>
                          <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Quantity</th>
                          <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Emergency</th>
                          <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Purpose</th>
                          <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Status</th>
                          <th className="p-4 font-semibold text-textSecondary uppercase tracking-wider text-xs">Sent Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {outgoingRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-4 font-bold text-textPrimary">
                              {req.provider?.hospital_name}
                              <div className="text-[10px] text-textSecondary font-semibold font-medium normal-case mt-0.5">
                                {req.provider?.city || '-'} ({req.provider?.district || '-'})
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="inline-block bg-primary/10 text-primary font-bold text-xs px-2.5 py-1 rounded-md">
                                {req.blood_group}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-textPrimary">{req.quantity} unit(s)</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                req.emergency_level === 'critical'
                                  ? 'bg-rose-100 text-rose-700'
                                  : req.emergency_level === 'high'
                                  ? 'bg-amber-100 text-amber-700'
                                  : req.emergency_level === 'medium'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {req.emergency_level.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-4 text-textSecondary font-semibold">{req.purpose}</td>
                            <td className="p-4 text-textSecondary font-semibold">
                              <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                                req.status === 'accepted'
                                  ? 'bg-success/15 text-success'
                                  : req.status === 'declined'
                                  ? 'bg-error/15 text-error'
                                  : 'bg-warning/15 text-warning'
                              }`}>
                                {req.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-4 text-textSecondary font-medium">
                              {new Date(req.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Request Blood Transfer Modal */}
      {isRequestModalOpen && selectedProvider && (
        <div className="fixed inset-0 bg-backgroundDark/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-card border border-border max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-textPrimary text-lg font-sans">
                Request Blood Transfer
              </h3>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-textSecondary hover:text-textPrimary text-xl"
              >
                &times;
              </button>
            </div>

            {(() => {
              const providerAvailableStocks = selectedProvider.hospital_blood_inventory?.filter(inv => inv.quantity > 0) || [];
              const selectedStock = providerAvailableStocks.find(s => s.blood_group === transferBloodGroup);
              const maxQty = selectedStock ? selectedStock.quantity : 1;

              return (
                <form onSubmit={handleSendTransferRequest} className="space-y-4 font-sans">
                  <p className="text-xs text-textSecondary">
                    Requesting blood transfer from <strong>{selectedProvider.hospital_name}</strong>.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
                      Blood Group Needed
                    </label>
                    <select
                      value={transferBloodGroup}
                      onChange={(e) => {
                        setTransferBloodGroup(e.target.value);
                        const newStock = providerAvailableStocks.find(s => s.blood_group === e.target.value);
                        if (newStock && transferQty > newStock.quantity) {
                          setTransferQty(newStock.quantity);
                        }
                      }}
                      className="w-full p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      {providerAvailableStocks.map((stock) => (
                        <option key={stock.blood_group} value={stock.blood_group}>
                          {stock.blood_group} ({stock.quantity} unit{stock.quantity > 1 ? 's' : ''} available)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
                      Quantity (Units Required)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={maxQty}
                      value={transferQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setTransferQty(Math.min(val, maxQty));
                      }}
                      className="w-full p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                    />
                    <span className="text-[10px] text-textSecondary font-semibold mt-1 block">
                      Maximum allowed: {maxQty} unit(s) based on current bank inventory.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
                      Emergency Level
                    </label>
                    <select
                      value={transferEmergency}
                      onChange={(e) => setTransferEmergency(e.target.value as any)}
                      className="w-full p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
                      Purpose / For What?
                    </label>
                    <select
                      value={transferPurpose}
                      onChange={(e) => setTransferPurpose(e.target.value)}
                      className="w-full p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="Surgery">Surgery</option>
                      <option value="Transfusion">Blood Transfusion</option>
                      <option value="Accident">Accident / Emergency Case</option>
                      <option value="Chemotherapy">Chemotherapy / Cancer Treatment</option>
                      <option value="Other">Other Medical Use</option>
                    </select>
                  </div>

                  <div className="flex gap-4 pt-2 border-t border-slate-100">
                    <Button
                      type="submit"
                      className="flex-grow justify-center text-xs"
                      loading={submittingTransfer}
                    >
                      Send Request
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsRequestModalOpen(false)}
                      className="flex-grow justify-center text-xs"
                      disabled={submittingTransfer}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;
