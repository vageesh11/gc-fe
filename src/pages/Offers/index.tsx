import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';

export function OffersLayout() {
  const { pathname } = useLocation();

  // Redirect bare /offers to /offers/discounts
  if (pathname === '/offers' || pathname === '/offers/') {
    return <Navigate to="/offers/discounts" replace />;
  }

  return (
    <div className="flex flex-col">
      {/* Sub-tab bar */}
      <div className="bg-[#0d0d1a] border-b border-purple-900/30">
        <div className="max-w-5xl mx-auto px-6 flex items-center gap-0">
          {[
            { to: '/offers/discounts', label: 'Discounts', icon: '🏷', desc: 'Promo codes & offers'  },
            { to: '/offers/passes',    label: 'Passes',    icon: '◆', desc: 'Membership time packs' },
          ].map(({ to, label, icon, desc }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-6 py-3 border-b-2 transition-all duration-150 ${
                  isActive
                    ? 'border-purple-500 text-purple-300 bg-purple-600/10'
                    : 'border-transparent text-gray-600 hover:text-purple-400 hover:bg-purple-900/10'
                }`
              }
            >
              <span className="text-sm">{icon}</span>
              <div>
                <p className="font-orbitron text-xs font-bold tracking-widest uppercase">{label}</p>
                <p className="text-gray-700 text-xs font-mono-game hidden sm:block">{desc}</p>
              </div>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Active sub-page */}
      <Outlet />
    </div>
  );
}
