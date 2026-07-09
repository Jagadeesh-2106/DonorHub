import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../services/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const requestSchema = z.object({
  blood_group: z.enum(bloodGroups as [string, ...string[]], { required_error: 'Blood group is required' }),
  quantity: z.number().int().positive('Quantity must be a positive number'),
});

type RequestFormInputs = z.infer<typeof requestSchema>;

const CreateBloodRequest: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormInputs>({
    resolver: zodResolver(requestSchema),
  });

  const navigate = useNavigate();

  const onSubmit = async (data: RequestFormInputs) => {
    try {
      const user = supabase.auth.getUser();
      const userId = (await user).data.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase.from('blood_requests').insert({
        hospital_id: userId,
        blood_group: data.blood_group,
        quantity: data.quantity,
        status: 'pending',
      });

      if (error) throw error;

      alert('Blood request created successfully.');
      navigate('/hospital/dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to create blood request.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-backgroundLight relative overflow-hidden font-sans">
      {/* Decorative backdrop gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/hospital/dashboard" className="inline-flex items-center text-xs font-semibold text-textSecondary hover:text-primary transition mb-4">
          &larr; Back to Hospital Dashboard
        </Link>
        <h2 className="text-3xl font-extrabold text-textPrimary tracking-tight">Create Blood Request</h2>
        <p className="mt-2 text-sm text-textSecondary">
          Alert compatible donors immediately on filing.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-xl shadow-card border border-border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div>
              <label htmlFor="blood_group" className="block text-sm font-semibold text-textPrimary mb-1.5">
                Blood Group Needed
              </label>
              <select
                id="blood_group"
                {...register('blood_group')}
                className={`w-full p-3 bg-backgroundLight border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 transition-all ${
                  errors.blood_group ? 'border-error focus:ring-error' : 'border-border focus:ring-primary focus:border-transparent'
                }`}
                defaultValue=""
                aria-invalid={errors.blood_group ? 'true' : 'false'}
                aria-describedby="blood_group-error"
              >
                <option value="" disabled>Select Blood Group</option>
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
              {errors.blood_group && (
                <p id="blood_group-error" className="text-error text-xs font-semibold mt-1.5">
                  {errors.blood_group.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-semibold text-textPrimary mb-1.5">
                Quantity Required (Units)
              </label>
              <input
                id="quantity"
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                className={`w-full p-3 bg-backgroundLight border rounded text-sm text-textPrimary placeholder-slate-400 font-medium focus:outline-none focus:ring-2 transition-all ${
                  errors.quantity ? 'border-error focus:ring-error' : 'border-border focus:ring-primary focus:border-transparent'
                }`}
                placeholder="e.g. 5"
                aria-invalid={errors.quantity ? 'true' : 'false'}
                aria-describedby="quantity-error"
                min={1}
              />
              {errors.quantity && (
                <p id="quantity-error" className="text-error text-xs font-semibold mt-1.5">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-grow justify-center" loading={isSubmitting}>
                {isSubmitting ? 'Filing Request...' : 'File Request'}
              </Button>
              <Link to="/hospital/dashboard" className="flex-grow">
                <Button variant="secondary" type="button" className="w-full justify-center">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBloodRequest;
