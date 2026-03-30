import { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, LogOut, User, Settings, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotificationStore } from '../stores/notificationStore';
import { useLocationStore } from '../stores/locationStore';
import type { Location } from '../stores/locationStore';
import NotificationDropdown from './NotificationDropdown';
import { APP_NAME } from '../utils/constants';
import { get } from '../services/api';

export default function Header() {
  const { user, logout } = useAuth();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  const { locations, currentLocationName, setLocations, setCurrentLocation, setIsHQ } = useLocationStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'LAB_DIRECTOR';

  // Fetch locations on mount
  useEffect(() => {
    get<{ success: boolean; data: Location[] }>('/locations')
      .then((res) => {
        if (res.success && res.data) {
          setLocations(res.data);
          const hqLoc = res.data.find((l: Location) => l.isHQ);
          if (hqLoc && user?.locationId === hqLoc.id) setIsHQ(true);
        }
      })
      .catch(() => { /* locations API not available yet */ });
  }, [setLocations, setIsHQ, user?.locationId]);

  useEffect(() => {
    const handleClickOutsideLoc = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setLocationOpen(false);
    };
    if (locationOpen) document.addEventListener('mousedown', handleClickOutsideLoc);
    return () => document.removeEventListener('mousedown', handleClickOutsideLoc);
  }, [locationOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      {/* Left: Lab name + search */}
      <div className="flex items-center gap-6">
        <h2 className="text-lg font-semibold text-gray-900 hidden md:block">
          {APP_NAME}
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search samples, clients, tests..."
            className="w-64 lg:w-80 pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Right: Location + Notifications + Profile */}
      <div className="flex items-center gap-2">
        {/* Location Selector */}
        <div ref={locationRef} className="relative">
          {isAdmin && locations.length > 0 ? (
            <>
              <button
                onClick={() => { setLocationOpen(!locationOpen); setNotifOpen(false); setProfileOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <MapPin className="h-4 w-4 text-blue-500" />
                <span className="hidden md:inline font-medium">{currentLocationName}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {locationOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-1">
                  <button
                    onClick={() => { setCurrentLocation(null, 'All Locations'); setLocationOpen(false); window.location.reload(); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <MapPin className="h-4 w-4" /> All Locations
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => { setCurrentLocation(loc.id, loc.name); setLocationOpen(false); window.location.reload(); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <span className="w-5 h-5 rounded bg-gray-100 text-[10px] font-bold flex items-center justify-center text-gray-600">{loc.code}</span>
                      {loc.name}
                      {loc.isHQ && <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">HQ</span>}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : locations.length > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span className="hidden md:inline">{currentLocationName}</span>
            </div>
          ) : null}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown
            isOpen={notifOpen}
            onClose={() => setNotifOpen(false)}
          />
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              {user?.firstName?.charAt(0) || 'U'}
              {user?.lastName?.charAt(0) || ''}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-gray-500 leading-tight">
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-1">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/settings/profile');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                My Profile
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <div className="border-t border-gray-100 mt-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
