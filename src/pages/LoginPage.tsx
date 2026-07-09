import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../services/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const navigate = useNavigate();

  const onSubmit = async (data: LoginFormInputs) => {
    const { email, password } = data;
    const { error, data: authData } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
      return;
    }
    if (authData?.session) {
      navigate('/dashboard'); // Redirect after successful login
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-backgroundLight relative overflow-hidden">
      {/* Decorative backdrop gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center space-x-2 mb-4 hover:opacity-90 transition">
          <div className="bg-primary p-2 rounded-lg text-white">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-textPrimary">DonorHub</span>
        </Link>
        <h2 className="text-3xl font-extrabold text-textPrimary tracking-tight">Login to your account</h2>
        <p className="mt-2 text-sm text-textSecondary">
          Or{' '}
          <Link to="/register" className="font-semibold text-primary hover:text-primary-hover hover:underline transition">
            register for a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-xl shadow-card border border-border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-textPrimary mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`w-full p-3 bg-backgroundLight border rounded text-sm text-textPrimary placeholder-slate-400 font-medium focus:outline-none focus:ring-2 transition-all ${
                  errors.email ? 'border-error focus:ring-error' : 'border-border focus:ring-primary focus:border-transparent'
                }`}
                {...register('email')}
                placeholder="you@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby="email-error"
              />
              {errors.email && (
                <p id="email-error" className="text-error text-xs font-semibold mt-1.5 flex items-center">
                  <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-textPrimary mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`w-full p-3 bg-backgroundLight border rounded text-sm text-textPrimary placeholder-slate-400 font-medium focus:outline-none focus:ring-2 transition-all ${
                  errors.password ? 'border-error focus:ring-error' : 'border-border focus:ring-primary focus:border-transparent'
                }`}
                {...register('password')}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby="password-error"
              />
              {errors.password && (
                <p id="password-error" className="text-error text-xs font-semibold mt-1.5 flex items-center">
                  <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 text-textSecondary font-semibold select-none cursor-pointer">
                <input type="checkbox" className="rounded text-primary focus:ring-primary border-border" />
                <span>Keep me logged in</span>
              </label>
              <Link to="/forgot-password" className="font-semibold text-primary hover:text-primary-hover hover:underline transition">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full justify-center" loading={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
