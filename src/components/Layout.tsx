import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function LeftPanel() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '320px',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      viewBox="0 0 320 900"
      preserveAspectRatio="xMinYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Opaque at left edge, fully transparent at right */}
        <linearGradient id="lp-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#0a0a0f" stopOpacity="0" />
          <stop offset="15%"  stopColor="#0a0a0f" stopOpacity="0.20" />
          <stop offset="40%"  stopColor="#0a0a0f" stopOpacity="0.60" />
          <stop offset="70%"  stopColor="#0a0a0f" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0a0a0f" stopOpacity="0.97" />
        </linearGradient>
      </defs>

      {/* Single wide pool table — spans full height, flush to left edge */}
      <g>
        {/* Outer wood frame */}
        <rect x="0" y="0" width="300" height="900" rx="0"
          fill="#0b140b" stroke="#7c3aed" strokeWidth="2" strokeOpacity="0.55" />
        {/* Felt surface */}
        <rect x="16" y="16" width="268" height="868" rx="6"
          fill="#0b180b" />
        {/* Cushion inner border */}
        <rect x="16" y="16" width="268" height="868" rx="6"
          fill="none" stroke="#3b1678" strokeWidth="1.5" strokeOpacity="0.50" />

        {/* Centre line */}
        <line x1="16" y1="450" x2="284" y2="450"
          stroke="#3b1678" strokeWidth="1" strokeDasharray="10 8" strokeOpacity="0.45" />

        {/* Baulk line — upper */}
        <line x1="16" y1="220" x2="284" y2="220"
          stroke="#3b1678" strokeWidth="0.8" strokeDasharray="6 10" strokeOpacity="0.35" />
        {/* D semicircle — upper */}
        <path d="M150,220 A52,52 0 0,0 150,324"
          fill="none" stroke="#3b1678" strokeWidth="1.2" strokeOpacity="0.40" />

        {/* Baulk line — lower */}
        <line x1="16" y1="680" x2="284" y2="680"
          stroke="#3b1678" strokeWidth="0.8" strokeDasharray="6 10" strokeOpacity="0.35" />
        {/* D semicircle — lower */}
        <path d="M150,576 A52,52 0 0,1 150,680"
          fill="none" stroke="#3b1678" strokeWidth="1.2" strokeOpacity="0.40" />

        {/* Spots */}
        <circle cx="150" cy="160" r="4" fill="#7c3aed" fillOpacity="0.45" />
        <circle cx="150" cy="450" r="4" fill="#7c3aed" fillOpacity="0.45" />
        <circle cx="150" cy="740" r="4" fill="#7c3aed" fillOpacity="0.45" />

        {/* 6 pockets */}
        {([[16,16],[284,16],[16,450],[284,450],[16,884],[284,884]] as [number,number][]).map(([px,py],i) => (
          <g key={i}>
            <circle cx={px} cy={py} r="13"
              fill="#060606" stroke="#7c3aed" strokeWidth="1.8" strokeOpacity="0.55" />
            <circle cx={px} cy={py} r="6" fill="#000" />
          </g>
        ))}
      </g>

      {/* Fade overlay — transparent at screen edge, opaque toward centre */}
      <rect x="0" y="0" width="320" height="900" fill="url(#lp-fade)" />
    </svg>
  );
}

function RightPanel() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '320px',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      viewBox="0 0 320 900"
      preserveAspectRatio="xMaxYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Opaque at right edge, fully transparent at left */}
        <linearGradient id="rp-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#0a0a0f" stopOpacity="0.97" />
          <stop offset="30%"  stopColor="#0a0a0f" stopOpacity="0.85" />
          <stop offset="60%"  stopColor="#0a0a0f" stopOpacity="0.60" />
          <stop offset="85%"  stopColor="#0a0a0f" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#0a0a0f" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Single wide pool table — spans full height, flush to right edge */}
      <g>
        <rect x="20" y="0" width="300" height="900" rx="0"
          fill="#0b140b" stroke="#06b6d4" strokeWidth="2" strokeOpacity="0.55" />
        <rect x="36" y="16" width="268" height="868" rx="6"
          fill="#0b180b" />
        <rect x="36" y="16" width="268" height="868" rx="6"
          fill="none" stroke="#065a70" strokeWidth="1.5" strokeOpacity="0.50" />

        {/* Centre line */}
        <line x1="36" y1="450" x2="304" y2="450"
          stroke="#065a70" strokeWidth="1" strokeDasharray="10 8" strokeOpacity="0.45" />

        {/* Baulk line — upper */}
        <line x1="36" y1="220" x2="304" y2="220"
          stroke="#065a70" strokeWidth="0.8" strokeDasharray="6 10" strokeOpacity="0.35" />
        <path d="M170,220 A52,52 0 0,1 170,324"
          fill="none" stroke="#065a70" strokeWidth="1.2" strokeOpacity="0.40" />

        {/* Baulk line — lower */}
        <line x1="36" y1="680" x2="304" y2="680"
          stroke="#065a70" strokeWidth="0.8" strokeDasharray="6 10" strokeOpacity="0.35" />
        <path d="M170,576 A52,52 0 0,0 170,680"
          fill="none" stroke="#065a70" strokeWidth="1.2" strokeOpacity="0.40" />

        {/* Spots */}
        <circle cx="170" cy="160" r="4" fill="#06b6d4" fillOpacity="0.45" />
        <circle cx="170" cy="450" r="4" fill="#06b6d4" fillOpacity="0.45" />
        <circle cx="170" cy="740" r="4" fill="#06b6d4" fillOpacity="0.45" />

        {/* 6 pockets */}
        {([[36,16],[304,16],[36,450],[304,450],[36,884],[304,884]] as [number,number][]).map(([px,py],i) => (
          <g key={i}>
            <circle cx={px} cy={py} r="13"
              fill="#060606" stroke="#06b6d4" strokeWidth="1.8" strokeOpacity="0.55" />
            <circle cx={px} cy={py} r="6" fill="#000" />
          </g>
        ))}
      </g>

      {/* Fade overlay */}
      <rect x="0" y="0" width="320" height="900" fill="url(#rp-fade)" />
    </svg>
  );
}

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
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col grid-bg"
      style={{ position: 'relative' }}>

      <LeftPanel />
      <RightPanel />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        <header className="relative scanlines bg-[#0d0d18]/95 border-b border-purple-900/50 sticky top-0 z-40 backdrop-blur-sm">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-cyan-500" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 border border-purple-500/50 bg-purple-600/10 flex items-center justify-center glow-purple">
                <span className="text-lg">🎱</span>
              </div>
              <span className="font-orbitron font-bold text-white text-sm tracking-widest text-glow-purple">
                BENGALURU <span className="text-purple-400">SNOOKER CLUB</span>
              </span>
            </div>

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

            <div className="flex items-center gap-3 shrink-0">
              {user && (
                <span className={`hidden md:inline text-xs font-bold tracking-widest uppercase px-1.5 py-0.5 border ${
                  isAdmin ? 'border-purple-700/50 text-purple-500' : 'border-gray-700/50 text-gray-600'
                }`}>{user.role}</span>
              )}
              <button onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-bold tracking-widest uppercase border border-red-900/40 text-red-800 hover:border-red-700/50 hover:text-red-500 transition-colors">
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
            BENGALURU SNOOKER CLUB MANAGEMENT SYSTEM v3.0
          </span>
        </footer>

      </div>
    </div>
  );
}
