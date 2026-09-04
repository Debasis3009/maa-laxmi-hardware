'use client';

import type { CategoryNode } from '@/lib/types';

export default function CategoryChips({
  categories,
  activeId,
  onSelect,
}: {
  categories: CategoryNode[];
  activeId: number | null;
  onSelect: (id: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      <Chip label="All products" active={activeId === null} onClick={() => onSelect(null)} />
      {categories.map((c) => (
        <Chip key={c.id} label={c.name} active={activeId === c.id} onClick={() => onSelect(c.id)} />
      ))}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-sm border-[1.5px] px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-rust bg-rust text-paper'
          : 'border-line bg-white text-charcoal hover:border-rust/60'
      }`}
    >
      {label}
    </button>
  );
}
