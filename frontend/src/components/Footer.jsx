import React, { useState } from 'react';
import { Instagram, Youtube, Mail } from 'lucide-react';
import { login, register } from '../utils/api';
import ForgotPasswordModal from './ForgotPasswordModal';

const Footer = ({ user, setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear errors when user types
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // Login
        const result = await login({
          email: formData.email,
          password: formData.password
        });
        
        setUser(result.user);
        setSuccess('Welcome back! 🎸');
        
        // Clear form
        setFormData({ email: '', password: '', username: '', confirmPassword: '' });
        
        // Scroll to top after successful login
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1000);

      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const result = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });

        setUser(result.user);
        setSuccess('Account created! Welcome to StreamSurf! 🎬');
        
        // Clear form
        setFormData({ email: '', password: '', username: '', confirmPassword: '' });
        
        // Scroll to top after successful registration
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsAnimating(true);
    setError('');
    setSuccess('');
    setTimeout(() => {
      setIsLogin(!isLogin);
      setFormData({ email: '', password: '', username: '', confirmPassword: '' });
      setIsAnimating(false);
    }, 300);
  };

  // Don't show login form if user is already logged in
  if (user) {
    return (
      <footer className="relative bg-black pt-32 pb-16">
        {/* Purple Diamond Separator */}
        <div className="flex justify-center mb-12">
          <div className="w-4 h-4 bg-purple-600 rotate-45 animate-pulse"></div>
        </div>

        <div className="max-w-2xl mx-auto px-6">
          {/* Logged In Message */}
          <div className="text-center mb-20">
            <h3 className="text-2xl md:text-3xl text-white mb-4 uppercase tracking-[0.3em] font-light">
              Welcome, {user.username}!
            </h3>
            <p className="text-white/50 text-sm">
              You're logged in and ready to explore
            </p>
          </div>

          {/* Purple Diamond Separator */}
          <div className="flex justify-center my-16">
            <div className="w-4 h-4 bg-purple-600 rotate-45 animate-pulse"></div>
          </div>

          {/* Follow Section */}
          <div className="text-center mb-16">
            <h4 className="text-xl text-white mb-8 uppercase tracking-[0.3em] font-light">
              Follow
            </h4>
            <div className="flex justify-center gap-8 flex-wrap">
              <a href="#" className="text-white hover:text-purple-500 transition-all duration-300 hover:scale-110">
                <Instagram size={28} strokeWidth={1.5} />
              </a>
              <a href="#" className="text-white hover:text-purple-500 transition-all duration-300 hover:scale-110">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-purple-500 transition-all duration-300 hover:scale-110">
                <Youtube size={28} strokeWidth={1.5} />
              </a>
              <a href="#" className="text-white hover:text-purple-500 transition-all duration-300 hover:scale-110">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.5 2h-3L8 8H2v8h6l2.5 6h3l2.5-6h6V8h-6l-2.5-6z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-purple-500 transition-all duration-300 hover:scale-110">
                <Mail size={28} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left mb-12 pt-12 border-t border-white/10">
            <div>
              <a href="#" className="block text-white/60 hover:text-white transition-colors text-sm mb-2">
                Home
              </a>
            </div>
            <div>
              <a href="#" className="block text-white/60 hover:text-white transition-colors text-sm mb-2">
                About
              </a>
            </div>
            <div>
              <a href="#" className="block text-white/60 hover:text-white transition-colors text-sm mb-2">
                Privacy Policy
              </a>
            </div>
            <div>
              <a href="#" className="block text-white/60 hover:text-white transition-colors text-sm mb-2">
                Contact
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center pt-8 border-t border-white/10">
            <p className="text-white/40 text-xs">
              © 2024 StreamSurf. All rights reserved. Made with 🎸 and code.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer id="login-section" className="relative bg-black pt-32 pb-16">
      {/* Purple Diamond Separator */}
      <div className="flex justify-center mb-12">
        <div className="w-4 h-4 bg-purple-600 rotate-45 animate-pulse"></div>
      </div>

      <div className="max-w-2xl mx-auto px-6">
        {/* Login/Register Form Section */}
        <div className="text-center mb-20">
          <h3 className="text-2xl md:text-3xl text-white mb-4 uppercase tracking-[0.3em] font-light">
            {isLogin ? 'Enter The Vault' : 'Join StreamSurf'}
          </h3>

          <p className="text-white/50 text-sm mb-10">
            {isLogin ? 'Access your exclusive content' : 'Create your account and dive in'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 text-green-400 text-sm rounded">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={`space-y-6 max-w-md mx-auto transition-all duration-300 ${
              isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {/* Email Field - Always visible */}
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              className="bg-transparent border border-white/30 text-white px-6 py-4 w-full
                       focus:outline-none focus:border-purple-500 transition-all text-sm
                       placeholder:text-white/40 placeholder:text-sm"
              required
              disabled={loading}
            />

            {/* Username - Only for Register */}
            {!isLogin && (
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                className="bg-transparent border border-white/30 text-white px-6 py-4 w-full
                         focus:outline-none focus:border-purple-500 transition-all text-sm
                         placeholder:text-white/40 placeholder:text-sm animate-fadeIn"
                required
                disabled={loading}
              />
            )}

            {/* Password Field - Always visible */}
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="bg-transparent border border-white/30 text-white px-6 py-4 w-full
                       focus:outline-none focus:border-purple-500 transition-all text-sm
                       placeholder:text-white/40 placeholder:text-sm"
              required
              disabled={loading}
            />

            {/* Confirm Password - Only for Register */}
            {!isLogin && (
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="bg-transparent border border-white/30 text-white px-6 py-4 w-full
                         focus:outline-none focus:border-purple-500 transition-all text-sm
                         placeholder:text-white/40 placeholder:text-sm animate-fadeIn"
                required
                disabled={loading}
              />
            )}

            {/* Forgot Password - Only for Login */}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-white/50 hover:text-white text-xs transition-colors"
                  disabled={loading}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Privacy Policy - Only for Register */}
            {!isLogin && (
              <p className="text-xs text-white/50">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="border-2 border-white text-white px-12 py-3 uppercase tracking-[0.3em] text-sm w-full
                       hover:bg-white hover:text-black transition-all duration-300 mt-6
                       hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                isLogin ? 'Login' : 'Create Account'
              )}
            </button>

            {/* Toggle Between Login/Register */}
            <div className="text-center pt-4">
              <p className="text-white/60 text-sm">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                {' '}
                <button
                  type="button"
                  onClick={toggleForm}
                  disabled={loading}
                  className="text-purple-400 hover:text-purple-300 transition-colors font-medium disabled:opacity-50"
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Purple Diamond Separator */}
        <div className="flex justify-center my-16">
          <div className="w-4 h-4 bg-purple-600 rotate-45 animate-pulse"></div>
        </div>

        {/* Follow Section */}
        <div className="text-center mb-16">
          <h4 className="text-xl text-white mb-8 uppercase tracking-[0.3em] font-light">
            Follow
          </h4>
          <div className="flex justify-center gap-8 flex-wrap">
            <a href="#" className="text-white hover:text-purple-500 transition-all duration-300 hover:scale-110">
              <Instagram size={28} strokeWidth={1.5} />
            </a>
            <a href="#" className="text-white hover:text-purple-500 transition-all duration-300 hover:scale-110">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" className="text-white hover:text-purple-500 transition-all duration-300 hover:scale-110">
              <Youtube size={28} strokeWidth={1.5} />
            </a>
            <a href="#" className="text-white hover:text-purple-500 transition-all duration-300 hover:scale-110">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.5 2h-3L8 8H2v8h6l2.5 6h3l2.5-6h6V8h-6l-2.5-6z" />
              </svg>
            </a>
            <a href="#" className="text-white hover:text-purple-500 transition-all duration-300 hover:scale-110">
              <Mail size={28} strokeWidth={1.5} />
            </a>
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left mb-12 pt-12 border-t border-white/10">
          <div>
            <a href="#" className="block text-white/60 hover:text-white transition-colors text-sm mb-2">
              Home
            </a>
          </div>
          <div>
            <a href="#" className="block text-white/60 hover:text-white transition-colors text-sm mb-2">
              About
            </a>
          </div>
          <div>
            <a href="#" className="block text-white/60 hover:text-white transition-colors text-sm mb-2">
              Privacy Policy
            </a>
          </div>
          <div>
            <a href="#" className="block text-white/60 hover:text-white transition-colors text-sm mb-2">
              Contact
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center pt-8 border-t border-white/10">
          <p className="text-white/40 text-xs">
            © 2024 StreamSurf. All rights reserved. Made with 🎸 and code.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />
    </footer>
  );
};

export default Footer;