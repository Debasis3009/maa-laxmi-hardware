export default function BrandLogo({ className = 'h-9 w-auto' }: { className?: string }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Precision Vector Twin-Peak Geometry */}
      <svg
        viewBox="0 0 100 70"
        className={className}
        fill="currentColor"
        aria-hidden="true"
      >
        <polygon points="12,65 52,5 52,65" />
        <polygon points="56,65 88,25 88,65" />
      </svg>
      <div className="flex flex-col text-left leading-none">
        <span className="font-display text-xl sm:text-2xl font-black tracking-tight text-inherit">
          MAA LAXMI HARDWARE
        </span>
        <span className="text-[7.5px] sm:text-[9px] font-semibold tracking-wider opacity-85 text-inherit mt-0.5">
          THE BEST CHOICE FOR YOUR DREAM HOME
        </span>
      </div>
    </div>
  );
}
