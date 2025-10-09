interface HeaderProps {
  isDevMode?: boolean;
}

export default function Header({ isDevMode }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-[#777] bg-[#1a1a1a] shadow-md">
      <div className="flex items-center gap-3">
        <img src="/icon.svg" alt="Logo" className="w-16 h-auto mx-auto" />
        <div>
          <div className="flex items-center gap-2"> <img src="/logo.png" alt="Logo" className="h-auto mx-auto" width="190" />
            {isDevMode && (
              <span className="text-xs bg-yellow-500/20 text-yellow-300 font-mono px-2 py-0.5 rounded-full" data-testid="badge-dev-mode">
                DEV
              </span>
            )}
          </div>
          <p className="font-mono text-m text-orange-300" style={{ color: '#f2633a' }}>REPORT CARD GENERATOR</p>
        </div>
      </div>
    </header>
  );
}
