import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

export default function ComingSoon() {
  const location = useLocation();

  // Derive page name from path
  const pageName = location.pathname
    .split('/')
    .filter(Boolean)
    .map((s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' / ');

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
        <Construction className="h-10 w-10 text-blue-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h2>
      <p className="text-sm text-gray-500 max-w-md">
        The <span className="font-medium text-gray-700">{pageName}</span> module
        is currently under development. Check back soon for updates.
      </p>
    </div>
  );
}
