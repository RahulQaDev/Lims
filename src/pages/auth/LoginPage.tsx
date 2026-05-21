import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS: { role: string; username: string; password: string }[] = [
  { role: 'Admin',     username: 'admin',          password: 'admin123' },
  { role: 'Lab Head',  username: 'labhead',        password: 'labhead123' },
  { role: 'QA Head',   username: 'qa_user',        password: 'test123' },
  { role: 'Booking',   username: 'booking_user',   password: 'test123' },
  { role: 'Reception', username: 'reception_user', password: 'test123' },
  { role: 'Analyst',   username: 'analyst_user',   password: 'test123' },
  { role: 'Reviewer',  username: 'reviewer_user',  password: 'test123' },
  { role: 'Approver',  username: 'approver_user',  password: 'test123' },
  { role: 'Accounts',  username: 'accounts_user',  password: 'test123' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    try {
      await login(username, password);
      toast.success('Welcome back!');
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const role = (storedUser?.role || '').toUpperCase();
      if (role === 'BOOKING') {
        navigate('/dashboard/booking');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl p-8">
      <h2 className="text-xl font-semibold text-white text-center mb-6">
        Sign in to your account
      </h2>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a6fb] focus:border-[#00a6fb]"
              autoComplete="username"
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a6fb] focus:border-[#00a6fb]"
              autoComplete="current-password"
            />
          </div>
        </div>

        <Button
          type="submit"
          loading={isLoading}
          icon={<LogIn className="h-4 w-4" />}
          className="w-full justify-center py-2.5"
        >
          Sign In
        </Button>
      </form>

      {/* ── Demo credentials ── */}
      <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-3">
          <KeyRound className="h-3 w-3" /> Demo Accounts
          <span className="text-slate-500 font-normal normal-case tracking-normal">— click to fill</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.username}
              type="button"
              onClick={() => fillDemo(a.username, a.password)}
              className="flex items-center justify-between gap-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 px-2.5 py-1.5 text-left transition-colors"
            >
              <span className="text-slate-200 font-medium">{a.role}</span>
              <span className="font-mono text-[10px] text-slate-400 truncate">{a.username}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-3 text-center">
          Passwords: <span className="font-mono text-slate-400">admin123</span> · <span className="font-mono text-slate-400">labhead123</span> · <span className="font-mono text-slate-400">test123</span>
        </p>
      </div>

      <p className="text-xs text-slate-500 text-center mt-4">
        Contact your administrator for account access
      </p>
    </div>
  );
}
