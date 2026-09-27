import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { policies } from '../data/policies';

const groups = [
  { title: 'Booking & payments', paths: ['/refund-policy', '/return-policy', '/shipping-and-delivery-policy'] },
  { title: 'Privacy & terms', paths: ['/privacy-policy', '/terms-and-conditions', '/disclaimer'] },
  { title: 'Our laboratory', paths: ['/about-us', '/contact-us'] },
];

export default function PolicyLinks() {
  return (
    <nav aria-label="Policies and business information" className="border-t border-white/10 bg-black/10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-9 sm:px-6 lg:grid-cols-[0.9fr_2.1fr] lg:gap-12 lg:px-8 lg:py-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Patient resources</p>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-white">Policies & helpful information</h2>
          <p className="mt-3 max-w-xs text-sm leading-6 text-emerald-100/70">Clear information to help you book with confidence and understand our services.</p>
        </div>
        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 text-sm font-semibold text-emerald-200">{group.title}</h3>
              <ul className="space-y-1">
                {group.paths.map((path) => {
                  const policy = policies.find((item) => item.path === path);
                  return (
                    <li key={path}>
                      <NavLink to={path} className={({ isActive }) => `group -ml-2 flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm leading-5 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${isActive ? 'bg-white/5 font-semibold text-white' : 'text-emerald-50/75'}`}>
                        <span>{policy.title}</span>
                        <ChevronRight aria-hidden="true" size={14} className="shrink-0 text-emerald-300/50 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-200 motion-reduce:transform-none" />
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
