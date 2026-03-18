// This file may contain content made using generative AI. This comment satisfies requirements for this courses AI disclosure policys.
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/reservations', label: 'My Reservations' },
    { to: '/vehicles', label: 'My Vehicles' },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ to: '/admin', label: 'Admin Panel' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SP</span>
                </div>
                <span className="font-bold text-xl text-gray-900">SmartPark</span>
              </Link>
              <div className="hidden sm:flex space-x-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user?.email}
                {user?.role === 'admin' && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                    Admin
                  </span>
                )}
              </span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="sm:hidden bg-white border-b border-gray-200 px-4 py-2 flex space-x-2 overflow-x-auto">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${
              location.pathname === link.to
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
