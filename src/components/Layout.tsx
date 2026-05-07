import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  function handleLogout() {
    localStorage.removeItem('gc_token');
    localStorage.removeItem('gc_user');
    navigate('/login', { replace: true });
  }

  const NAV_ITEMS = [
    { to: '/',          label: 'Dashboard', icon: '⬡', adminOnly: false },
    { to: '/sessions',  label: 'Sessions',  icon: '▣', adminOnly: false },
    { to: '/inventory', label: 'Inventory', icon: '◈', adminOnly: false },
    { to: '/customers', label: 'Customers', icon: '◉', adminOnly: false },
    { to: '/offers',    label: 'Offers',    icon: '◆', adminOnly: true  },
    { to: '/reports',   label: 'Reports',   icon: '▦', adminOnly: true  },
  ].filter((item) => !item.adminOnly || isAdmin);

  const isOffersActive = location.pathname.startsWith('/offers');

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col grid-bg">
      {/* Top navbar */}
      <header className="relative scanlines bg-[#0d0d18]/95 border-b border-purple-900/50 sticky top-0 z-40 backdrop-blur-sm">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-cyan-500" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 border border-purple-500/50 bg-purple-600/10 flex items-center justify-center glow-purple">
              <span className="text-lg">🎮</span>
            </div>
            <span className="font-orbitron font-bold text-white text-sm tracking-widest text-glow-purple">
              GAME<span className="text-purple-400">CAFÉ</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            {NAV_ITEMS.map(({ to, label, icon }) => {
              const isOffers = to === '/offers';
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={isOffers
                    ? `flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wider transition-all duration-200 border whitespace-nowrap ${
                        isOffersActive
                          ? 'bg-purple-600/20 border-purple-500/60 text-purple-300 glow-purple'
                          : 'border-transparent text-gray-500 hover:text-purple-300 hover:border-purple-700/50 hover:bg-purple-900/20'
                      }`
                    : ({ isActive }) =>
                        `flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wider transition-all duration-200 border whitespace-nowrap ${
                          isActive
                            ? 'bg-purple-600/20 border-purple-500/60 text-purple-300 glow-purple'
                            : 'border-transparent text-gray-500 hover:text-purple-300 hover:border-purple-700/50 hover:bg-purple-900/20'
                        }`
                  }
                >
                  <span className="opacity-60">{icon}</span>
                  <span className="hidden sm:inline uppercase">{label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User + Logout */}
          <div className="flex items-center gap-3 shrink-0">
            {user && (
              <span className={`hidden md:inline text-xs font-bold tracking-widest uppercase px-1.5 py-0.5 border ${
                isAdmin ? 'border-purple-700/50 text-purple-500' : 'border-gray-700/50 text-gray-600'
              }`}>{user.role}</span>
            )}
            <button onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-bold tracking-widests uppercase border border-red-900/40 text-red-800 hover:border-red-700/50 hover:text-red-500 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="py-3 text-center border-t border-purple-900/30 bg-[#0d0d18]/80">
        <span className="font-mono-game text-xs text-purple-900 tracking-widest">
          GAMECAFÉ MANAGEMENT SYSTEM v3.0
        </span>
      </footer>
    </div>
  );
}
