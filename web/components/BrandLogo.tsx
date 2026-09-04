export default function BrandLogo({ 
  variant = 'light', 
  className = 'h-10 w-auto' 
}: { 
  variant?: 'light' | 'dark'; 
  className?: string;
}) {
  const isDark = variant === 'dark';

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Exact 2-Tone Mountain Peaks */}
      <svg
        viewBox="0 0 160 100"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Large Left Peak - White Right Slope */}
        <polygon points="70,12 110,88 70,88" fill="#FFFFFF" />
        {/* Large Left Peak - Deep Navy Left Face */}
        <polygon points="70,12 15,88 70,88" fill="#0B3C6D" />

        {/* Small Right Peak - White Right Slope */}
        <polygon points="105,38 145,88 105,88" fill="#FFFFFF" />
        {/* Small Right Peak - Deep Navy Left Face */}
        <polygon points="105,38 72,88 105,88" fill="#0B3C6D" />
      </svg>

      {/* Brand Typography */}
      <div className="flex flex-col text-left leading-none">
        <span
          className={`font-display text-xl sm:text-2xl font-black tracking-tight ${
            isDark ? 'text-[#0B3C6D]' : 'text-white'
          }`}
        >
          MAA LAXMI HARDWARE
        </span>
        <span
          className={`mt-1 text-[8px] sm:text-[9.5px] font-bold tracking-[0.14em] uppercase ${
            isDark ? 'text-[#0B3C6D]/80' : 'text-slate-200'
          }`}
        >
          The Best Choice For Your Dream Home
        </span>
      </div>
    </div>
  );
}
