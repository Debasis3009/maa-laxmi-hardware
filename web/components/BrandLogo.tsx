import Image from 'next/image';

export default function BrandLogo({
  variant = 'light',
  className = 'h-10 w-auto'
}: {
  variant?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center overflow-hidden rounded-md bg-[#dfeaed] ${className}`} aria-label="MAA LAXMI HARDWARE">
      <Image
        src="/maa-laxmi-logo.png"
        alt="MAA LAXMI HARDWARE — The Best Choice For Your Dream Home"
        width={310}
        height={175}
        priority
        className="h-full w-auto object-contain"
      />
    </span>
  );
}
