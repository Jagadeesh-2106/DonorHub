import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import { useNavigate, Link } from 'react-router-dom';

interface FormData {
  name: string;
  phone?: string;
  blood_group?: string;
  availability_status?: boolean;
  hospital_name?: string;
  address?: string;
  city?: string;
  district?: string;
}

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const EditProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      setSubmitError(null);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('name, phone')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        let extraData = {};
        if (user.role === 'donor') {
          const { data: donorData, error: donorError } = await supabase
            .from('donors')
            .select('blood_group, availability_status, city, district')
            .eq('id', user.id)
            .single();
          if (donorError) throw donorError;
          extraData = donorData || {};
        } else if (user.role === 'hospital') {
          const { data: hospitalData, error: hospitalError } = await supabase
            .from('hospitals')
            .select('hospital_name, address, city, district')
            .eq('id', user.id)
            .single();
          if (hospitalError) throw hospitalError;
          extraData = hospitalData || {};
        }

        reset({ ...(profileData || {}), ...extraData });
      } catch (err: any) {
        setSubmitError(err.message || 'Failed to load profile');
      }
      setLoading(false);
    };

    fetchData();
  }, [user, reset]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    setSubmitError(null);
    setLoading(true);
    try {
      const { error: profilesError } = await supabase
        .from('profiles')
        .update({ name: data.name, phone: data.phone })
        .eq('id', user.id);
      if (profilesError) throw profilesError;

      if (user.role === 'donor') {
        const { error: donorError } = await supabase
          .from('donors')
          .update({
            blood_group: data.blood_group,
            availability_status: data.availability_status,
            city: data.city,
            district: data.district,
          })
          .eq('id', user.id);
        if (donorError) throw donorError;
      } else if (user.role === 'hospital') {
        const { error: hospitalError } = await supabase
          .from('hospitals')
          .update({
            hospital_name: data.hospital_name,
            address: data.address,
            city: data.city,
            district: data.district,
          })
          .eq('id', user.id);
        if (hospitalError) throw hospitalError;
      }

      alert('Profile updated successfully!');
      navigate('/profile');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to update profile');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-backgroundLight">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-textSecondary font-semibold">Loading profile forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-backgroundLight font-sans">
      <header className="bg-white border-b border-border shadow-subtle px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <Link to="/profile" className="text-textSecondary hover:text-primary transition-all">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="font-bold text-lg text-textPrimary tracking-tight">Edit Profile</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 animate-fade-in-up">
        <div className="bg-white border border-border rounded-xl shadow-card p-6 sm:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div>
              <label className="block text-sm font-semibold text-textPrimary mb-1.5" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                {...register('name', { required: 'Name is required' })}
                className={`w-full p-3 bg-backgroundLight border rounded text-sm text-textPrimary placeholder-slate-400 font-medium focus:outline-none focus:ring-2 transition-all ${
                  errors.name ? 'border-error focus:ring-error' : 'border-border focus:ring-primary focus:border-transparent'
                }`}
              />
              {errors.name && <p className="text-error text-xs font-semibold mt-1.5">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-textPrimary mb-1.5" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                {...register('phone')}
                className="w-full p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="e.g. +1 555-0199"
              />
            </div>

            {/* Donor Fields */}
            {user?.role === 'donor' && (
              <div className="space-y-6 pt-4 border-t border-slate-100 animate-fade-in-up">
                <h3 className="font-bold text-textPrimary text-base">Donor Settings</h3>
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-1.5" htmlFor="blood_group">
                    Blood Group
                  </label>
                  <select
                    id="blood_group"
                    {...register('blood_group', { required: 'Blood group is required' })}
                    className="w-full p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                  {errors.blood_group && <p className="text-error text-xs font-semibold mt-1.5">{errors.blood_group.message}</p>}
                </div>

                <label className="flex items-center space-x-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register('availability_status')}
                    className="rounded text-primary focus:ring-primary border-border h-4 w-4"
                  />
                  <span className="text-sm font-semibold text-textPrimary">I am currently available to donate blood</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-textPrimary mb-1.5" htmlFor="city">
                      City
                    </label>
                    <input
                      id="city"
                      {...register('city')}
                      className="w-full p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-textPrimary mb-1.5" htmlFor="district">
                      District
                    </label>
                    <input
                      id="district"
                      {...register('district')}
                      className="w-full p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hospital Fields */}
            {user?.role === 'hospital' && (
              <div className="space-y-6 pt-4 border-t border-slate-100 animate-fade-in-up">
                <h3 className="font-bold text-textPrimary text-base">Hospital Settings</h3>
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-1.5" htmlFor="hospital_name">
                    Hospital Name
                  </label>
                  <input
                    id="hospital_name"
                    {...register('hospital_name', { required: 'Hospital name is required' })}
                    className={`w-full p-3 bg-backgroundLight border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 transition-all ${
                      errors.hospital_name ? 'border-error focus:ring-error' : 'border-border focus:ring-primary focus:border-transparent'
                    }`}
                  />
                  {errors.hospital_name && <p className="text-error text-xs font-semibold mt-1.5">{errors.hospital_name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-1.5" htmlFor="address">
                    Full Address
                  </label>
                  <input
                    id="address"
                    {...register('address')}
                    className="w-full p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-textPrimary mb-1.5" htmlFor="city">
                      City
                    </label>
                    <input
                      id="city"
                      {...register('city')}
                      className="w-full p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-textPrimary mb-1.5" htmlFor="district">
                      District
                    </label>
                    <input
                      id="district"
                      {...register('district')}
                      className="w-full p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {submitError && <p className="text-error text-xs font-semibold mt-1 text-center">{submitError}</p>}

            <div className="flex gap-4 pt-6 border-t border-slate-100">
              <Button type="submit" className="flex-grow justify-center" loading={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link to="/profile" className="flex-grow">
                <Button variant="secondary" type="button" className="w-full justify-center">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditProfilePage;
