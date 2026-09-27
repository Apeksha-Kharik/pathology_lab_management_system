import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PolicyLinks from '../components/PolicyLinks';
import { business } from '../data/policies';
import logo from '../assets/logo.png';

export default function PolicyPage({ policy }) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${policy.title} | INDIPATH`;
    window.scrollTo({ top: 0, behavior: 'instant' });
    return () => { document.title = previousTitle; };
  }, [policy.title]);

  return (
    <div className="min-h-screen bg-[#f5fbf8] text-slate-800">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3 font-extrabold text-emerald-950">
            <img src={logo} alt="" className="h-12 w-12 rounded-lg object-contain" />
            <span>INDIPATH<span className="block text-xs font-medium">Super Speciality Pathology Lab</span></span>
          </Link>
          <Link to="/" className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800">Back to home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Patient information</p>
        <h1 className="mt-3 text-3xl font-extrabold text-emerald-950 sm:text-4xl">{policy.title}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">{policy.summary}</p>
        <p className="mt-4 text-sm text-slate-500">Last updated: 27 September 2026</p>
        <article className="mt-8 space-y-8 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-10">
          {policy.sections.map(([heading, content]) => (
            <section key={heading}>
              <h2 className="text-xl font-bold text-emerald-950">{heading}</h2>
              <p className="mt-3 leading-8 text-slate-600">{content}</p>
            </section>
          ))}
          {policy.path === '/privacy-policy' && (
            <a href="https://razorpay.com/privacy-policy/" className="inline-block font-semibold text-emerald-800 underline">Read Razorpay’s privacy policy</a>
          )}
          <section className="border-t border-emerald-100 pt-6" aria-label="Laboratory contact details">
            <h2 className="text-xl font-bold text-emerald-950">Questions? Contact the laboratory</h2>
            <address className="mt-4 space-y-2 break-words not-italic leading-7">
              <p className="font-semibold">{business.name}</p>
              <p>{business.address}</p>
              <p><a className="text-emerald-800 underline" href={`mailto:${business.email}`}>{business.email}</a></p>
              <p><a className="text-emerald-800 underline" href={`tel:${business.telephone}`}>{business.phone}</a></p>
            </address>
          </section>
        </article>
      </main>
      <footer className="bg-[#063326] text-emerald-50">
        <PolicyLinks />
        <p className="border-t border-white/10 px-4 py-5 text-center text-xs">© {new Date().getFullYear()} {business.name}</p>
      </footer>
    </div>
  );
}
