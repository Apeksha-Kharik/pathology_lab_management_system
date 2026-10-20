export default function DashboardDeskNav({ activeView, onChange, views, counts = {}, label = "Dashboard sections" }) {
  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
      <div role="tablist" aria-label={label} className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
        {views.map((view) => {
          const Icon = view.icon;
          const active = activeView === view.id;

          return (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(view.id)}
              className={`flex min-h-24 items-center gap-4 rounded-2xl px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-emerald-100 ${active ? "bg-emerald-700 text-white shadow-lg shadow-emerald-950/10" : "bg-emerald-50 text-emerald-950 hover:bg-emerald-100"}`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white/15 text-white" : "bg-white text-emerald-700"}`}>
                <Icon size={21} />
              </span>
              <span>
                <span className="block text-sm font-black">{view.label}</span>
                <span className={`mt-1 block text-xs font-semibold ${active ? "text-emerald-50/85" : "text-slate-500"}`}>{counts[view.id] !== undefined ? `${counts[view.id]} bookings - ` : ""}{view.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

