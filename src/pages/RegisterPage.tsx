import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../services/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6),
  role: z.enum(['donor', 'hospital'], { required_error: 'Role is required' }),
  name: z.string().min(2, { message: 'Name is required' }),
  blood_group: z.string().optional(),
  hospital_name: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const RegisterPage: React.FC = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const navigate = useNavigate();
  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormInputs) => {
    setSubmitError(null);
    const { email, password, role, name, blood_group, hospital_name } = data;

    const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, name },
      },
    });

    if (signUpError) {
      setSubmitError(signUpError.message);
      return;
    }

    if (signUpData?.user) {
      const profileId = signUpData.user.id;
      try {
        if (role === 'donor') {
          await supabase.from('donors').insert({
            id: profileId,
            blood_group: blood_group ?? '',
            availability_status: true,
          });
        } else if (role === 'hospital') {
          await supabase.from('hospitals').insert({
            id: profileId,
            hospital_name: hospital_name ?? name,
          });
        }

        navigate('/dashboard');
      } catch (dbError: any) {
        setSubmitError(dbError.message || 'Failed to create profile');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-backgroundLight relative overflow-hidden">
      {/* Decorative backdrop gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl opacity-30 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 translate-y-1/2"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center space-x-2 mb-4 hover:opacity-90 transition">
          <div className="bg-primary p-2 rounded-lg text-white">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-textPrimary">DonorHub</span>
        </Link>
        <h2 className="text-3xl font-extrabold text-textPrimary tracking-tight">Create your account</h2>
        <p className="mt-2 text-sm text-textSecondary">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-hover hover:underline transition">
            Login here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-xl shadow-card border border-border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-textPrimary mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                className={`w-full p-3 bg-backgroundLight border rounded text-sm text-textPrimary placeholder-slate-400 font-medium focus:outline-none focus:ring-2 transition-all ${
                  errors.name ? 'border-error focus:ring-error' : 'border-border focus:ring-primary focus:border-transparent'
                }`}
                {...register('name')}
                placeholder="John Doe"
              />
              {errors.name && <p className="text-error text-xs font-semibold mt-1.5">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-textPrimary mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className={`w-full p-3 bg-backgroundLight border rounded text-sm text-textPrimary placeholder-slate-400 font-medium focus:outline-none focus:ring-2 transition-all ${
                  errors.email ? 'border-error focus:ring-error' : 'border-border focus:ring-primary focus:border-transparent'
                }`}
                {...register('email')}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-error text-xs font-semibold mt-1.5">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-textPrimary mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className={`w-full p-3 bg-backgroundLight border rounded text-sm text-textPrimary placeholder-slate-400 font-medium focus:outline-none focus:ring-2 transition-all ${
                    errors.password ? 'border-error focus:ring-error' : 'border-border focus:ring-primary focus:border-transparent'
                  }`}
                  {...register('password')}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                />
                {errors.password && <p className="text-error text-xs font-semibold mt-1.5">{errors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-textPrimary mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className={`w-full p-3 bg-backgroundLight border rounded text-sm text-textPrimary placeholder-slate-400 font-medium focus:outline-none focus:ring-2 transition-all ${
                    errors.confirmPassword ? 'border-error focus:ring-error' : 'border-border focus:ring-primary focus:border-transparent'
                  }`}
                  {...register('confirmPassword')}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                />
                {errors.confirmPassword && <p className="text-error text-xs font-semibold mt-1.5">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-textPrimary mb-1.5">
                Register As
              </label>
              <select
                id="role"
                {...register('role')}
                className={`w-full p-3 bg-backgroundLight border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 transition-all ${
                  errors.role ? 'border-error focus:ring-error' : 'border-border focus:ring-primary focus:border-transparent'
                }`}
                defaultValue=""
              >
                <option value="" disabled>Select User Role</option>
                <option value="donor">Blood Donor</option>
                <option value="hospital">Hospital / Medical Center</option>
              </select>
              {errors.role && <p className="text-error text-xs font-semibold mt-1.5">{errors.role.message}</p>}
            </div>

            {/* Conditional Fields */}
            {selectedRole === 'donor' && (
              <div className="animate-fade-in-up">
                <label htmlFor="blood_group" className="block text-sm font-semibold text-textPrimary mb-1.5">
                  Blood Group
                </label>
                <select
                  id="blood_group"
                  {...register('blood_group')}
                  className="w-full p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  defaultValue=""
                >
                  <option value="" disabled>Select Blood Group</option>
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedRole === 'hospital' && (
              <div className="animate-fade-in-up">
                <label htmlFor="hospital_name" className="block text-sm font-semibold text-textPrimary mb-1.5">
                  Hospital Name
                </label>
                <input
                  id="hospital_name"
                  type="text"
                  {...register('hospital_name')}
                  className="w-full p-3 bg-backgroundLight border border-border rounded text-sm text-textPrimary placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="e.g. Hope Clinic"
                />
              </div>
            )}

            {submitError && <p className="text-error text-xs font-semibold mt-1 text-center">{submitError}</p>}

            <Button type="submit" className="w-full justify-center mt-2" loading={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Sign Up'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
