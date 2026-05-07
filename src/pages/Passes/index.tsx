export function Passes() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-mono-game text-purple-600 tracking-widest mb-1">// MEMBERSHIP PACKS</p>
        <h1 className="font-orbitron font-black text-2xl text-white tracking-wide text-glow-purple">PASSES</h1>
      </div>

      <div className="border border-purple-900/30 bg-[#0d0d1a] overflow-hidden">
        <div className="h-[2px] bg-gradient-to-r from-purple-800 via-purple-500 to-cyan-600" />
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          {/* Animated icon */}
          <div className="relative">
            <div className="w-20 h-20 border-2 border-purple-700/50 bg-purple-900/10 flex items-center justify-center">
              <span className="text-4xl">🎫</span>
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
            </span>
          </div>

          <div className="text-center">
            <p className="font-orbitron font-black text-lg text-amber-400 tracking-widest mb-2">
              UNDER DEVELOPMENT
            </p>
            <p className="text-gray-500 text-sm font-mono-game tracking-wider max-w-xs">
              Membership passes & time packs are coming soon.
            </p>
          </div>

          {/* Progress bar decoration */}
          <div className="w-48 h-1 bg-gray-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 animate-pulse" style={{ width: '60%' }} />
          </div>

          <p className="text-gray-700 text-xs font-mono-game tracking-widest">
            // LOADING MODULE…
          </p>
        </div>
      </div>
    </div>
  );
}
