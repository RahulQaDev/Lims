import { Outlet } from 'react-router-dom';
import { FlaskRound } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
            <FlaskRound className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">LabWise LIMS</h1>
          <p className="text-sm text-slate-400 mt-1">
            Laboratory Information Management System
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
