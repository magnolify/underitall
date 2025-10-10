interface HeaderProps {
  isDevMode?: boolean;
}

export default function Header({ isDevMode }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-[#777] bg-[#1a1a1a] shadow-md">
      <div className="flex items-center gap-3">
        <img src="/icon.svg" alt="Logo" className="w-16 h-auto mx-auto" />
        <div>
          <div className="flex items-center gap-2"> <img src="/logo.png" alt="Logo" className="h-auto mx-auto" width="205" />
          </div>
          <p className="text-rorange font-headline font-bold text-sm tracking-wide">
        REPORT CARD GENERATOR
      </p>
        </div>
      </div>
    </header>
  );
}