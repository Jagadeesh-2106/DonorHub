import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-backgroundLight text-textPrimary antialiased">
      {/* Header */}
      <header className="flex justify-between items-center px-6 md:px-12 py-5 border-b border-border bg-white/70 backdrop-blur-md shadow-subtle sticky top-0 z-50 transition-all">
        <div className="flex items-center space-x-2">
          <div className="bg-primary p-2 rounded-lg text-white">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <Link to="/" className="text-2xl font-bold tracking-tight text-textPrimary hover:text-primary transition">
            DonorHub
          </Link>
        </div>
        
        {/* Desktop nav */}
        <nav className="space-x-8 hidden md:flex text-sm font-semibold text-textSecondary">
          <a href="#about" className="hover:text-primary transition-all duration-200">About Platform</a>
          <a href="#contact" className="hover:text-primary transition-all duration-200">Contact Us</a>
          <Link to="/login" className="hover:text-primary transition-all duration-200 mt-0.5">Login</Link>
          <Link to="/register">
            <Button variant="secondary" className="py-1.5 px-4 text-xs font-semibold">Register</Button>
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-textPrimary hover:bg-slate-100 transition-all focus:outline-none"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-[73px] left-0 right-0 bg-white border-b border-border p-6 shadow-card flex flex-col space-y-4 md:hidden animate-fade-in-up">
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-textSecondary hover:text-primary transition-all py-2 border-b border-slate-50"
            >
              About Platform
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-textSecondary hover:text-primary transition-all py-2 border-b border-slate-50"
            >
              Contact Us
            </a>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-textSecondary hover:text-primary transition-all py-2 border-b border-slate-50"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="pt-2"
            >
              <Button className="w-full justify-center text-sm py-2">Register</Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="flex-grow container mx-auto px-6 md:px-12 py-16 md:py-24 md:flex md:items-center md:justify-between gap-12">
        <div className="max-w-xl text-center md:text-left space-y-6 animate-fade-in-up">
          <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            🚨 Immediate Impact Platform
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-textPrimary leading-tight tracking-tight">
            Centralized Blood <span className="text-primary">Availability</span> System
          </h1>
          <p className="text-base md:text-lg text-textSecondary leading-relaxed">
            Connect donors, hospitals, and patients efficiently to ensure timely blood availability during critical emergencies. Seamless coordination, simplified.
          </p>
          <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 pt-4">
            <Link to="/register">
              <Button variant="primary" className="text-base px-8 py-3.5 w-full sm:w-auto">
                Get Started Now
              </Button>
            </Link>
            <a href="#about">
              <Button variant="secondary" className="text-base px-8 py-3.5 w-full sm:w-auto">
                Learn More
              </Button>
            </a>
          </div>
        </div>

        {/* Hero SVG illustration */}
        <div className="hidden md:block max-w-lg w-full transform hover:scale-102 transition-all duration-500 animate-fade-in-up delay-100">
          <div className="bg-white/80 p-8 rounded-2xl shadow-premium border border-primary/5 backdrop-blur-sm">
            <img
              src="/assets/hero-illustration.svg"
              alt="Blood donation illustration"
              className="w-full h-auto rounded-lg select-none"
            />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="about" className="bg-white/60 backdrop-blur-sm border-t border-b border-border py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight">Unified Coordination Ecosystem</h2>
            <p className="text-textSecondary">Simplifying connections for donors, hospitals, and coordinators to maximize resource efficiency.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              title="Blood Donors"
              description="Register as a donor, update your real-time availability status, and receive alerts for compatible requests nearby."
            />
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              title="Medical Centers"
              description="Create urgent blood requests, view donation compatibility matrices, and check local inventory pools instantly."
            />
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              }
              title="System Administrators"
              description="Monitor platform health metrics, view registration flows, and review detailed diagnostic logs."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-backgroundDark border-t border-slate-800 text-slate-400 py-12 px-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2 text-white">
            <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
            <span className="font-bold tracking-tight text-lg">DonorHub</span>
          </div>
          <p className="text-sm text-slate-500">&copy; 2026 DonorHub System. Built for emergency response coordination.</p>
          <div className="flex space-x-4 text-xs font-semibold text-slate-500">
            <a href="mailto:support@donorhub.example" className="hover:text-white transition">Support Email</a>
            <span>&bull;</span>
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="p-8 rounded-xl bg-white border border-border hover:border-primary/20 premium-card-hover">
    <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-textPrimary">{title}</h3>
    <p className="text-textSecondary text-sm leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
