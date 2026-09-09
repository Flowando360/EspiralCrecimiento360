'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Send, ListChecks } from 'lucide-react';

const TABS = [
  { href: '/administracion/guias-flow/invitaciones', label: 'Invitaciones', icon: Send },
  { href: '/administracion/guias-flow/seguimiento', label: 'Seguimiento', icon: ListChecks },
];

export function TabsGuiasFlow() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-marmol-200">
      {TABS.map((tab) => {
        const activo = pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition',
              activo
                ? 'border-flow-500 text-flow-600'
                : 'border-transparent text-marmol-500 hover:text-marmol-700 hover:border-marmol-200'
            )}
          >
            <Icon size={15} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
