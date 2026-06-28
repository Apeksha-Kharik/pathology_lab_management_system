import React from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  FlaskConical,
  HeartPulse,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Microscope,
  Phone,
  ShieldCheck,
  Sparkles,
  TestTube2,
  UserCheck
} from "lucide-react";
import logo from "../assets/logo.png";
import bg1 from "../assets/bg1.png";
import bg2 from "../assets/bg2.png";
import bg3 from "../assets/bg3.png";

const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 }
};

const diagnostics = [
  {
    title: "Pathology Tests",
    text: "CBC, urine routine, sugar profile, lipid profile, liver and renal function tests with clean digital tracking.",
    icon: TestTube2
  },
  {
    title: "Patient Registration",
    text: "Online test requests and receptionist walk-in booking support for daily lab visitors.",
    icon: UserCheck
  },
  {
    title: "Sample Workflow",
    text: "Arrival, payment, technician assignment, sample collection and processing stages are visible to staff.",
    icon: FlaskConical
  },
  {
    title: "Approved Reports",
    text: "Technician-submitted reports are released only after pathologist review and approval.",
    icon: FileText
  }
];

const journey = [
  {
    title: "Book test",
    text: "Patient selects test, date, slot and basic patient details.",
    icon: CalendarDays
  },
  {
    title: "Reception verifies",
    text: "Reception confirms arrival, payment and assigns technician.",
    icon: ClipboardCheck
  },
  {
    title: "Lab processes sample",
    text: "Technician updates sample status and submits structured results.",
    icon: Microscope
  },
  {
    title: "Pathologist approves",
    text: "Final report becomes available to patient only after approval.",
    icon: BadgeCheck
  }
];

const highlights = [
  "Five role-specific portals",
  "Payment status before technician assignment",
  "Patient report download after approval",
  "Daily workflow visibility for admin",
  "Walk-in and online booking support",
  "Searchable booking and report queues"
];

function HomePage() {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const go = (path) => navigate(path);

  return (
    <div className="min-h-screen bg-[#f5fbf8] text-slate-900" style={{ fontFamily: "Segoe UI, Inter, system-ui, sans-serif" }}>
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => scrollTo("home")} className="flex items-center gap-3 text-left">
            <img src={logo} alt="INDIPATH logo" className="h-12 w-12 rounded-lg object-contain" />
            <span>
              <span className="block text-xl font-extrabold tracking-tight text-emerald-950">INDIPATH</span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Super Speciality Pathology Lab</span>
            </span>
          </button>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
            <button onClick={() => scrollTo("services")} className="hover:text-emerald-700">Services</button>
            <button onClick={() => scrollTo("process")} className="hover:text-emerald-700">Process</button>
            <button onClick={() => scrollTo("quality")} className="hover:text-emerald-700">Quality</button>
            <button onClick={() => scrollTo("contact")} className="hover:text-emerald-700">Contact</button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => go("/login")}
              className="hidden items-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50 sm:inline-flex"
            >
              <LogIn size={16} /> Login
            </button>
            <button
              onClick={() => go("/register")}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-800"
            >
              Book Test <ArrowRight size={16} />
            </button>
            <button onClick={() => scrollTo("contact")} className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden">
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      <main id="home">
        <section className="relative overflow-hidden bg-emerald-950">
          <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: `url(${bg1})` }} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,44,34,0.96)_0%,rgba(6,95,70,0.82)_52%,rgba(6,78,59,0.35)_100%)]" />

          <div className="relative mx-auto grid min-h-[700px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
            <Motion.div initial="hidden" animate="visible" variants={reveal} transition={{ duration: 0.55 }} className="max-w-3xl text-white">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-50">
                <Sparkles size={15} /> Diagnostic care with organized lab workflow
              </div>
              <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-[64px]">
                Reliable pathology services, managed with clinical discipline.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-emerald-50/90 sm:text-lg">
                A practical laboratory management system for patient booking, reception billing, sample tracking, technician result entry and pathologist-approved reports.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => go("/register")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 text-sm font-extrabold text-emerald-900 shadow-lg hover:bg-emerald-50">
                  Book a Test <ArrowRight size={18} />
                </button>
                <button onClick={() => go("/login")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-6 py-4 text-sm font-extrabold text-white backdrop-blur hover:bg-white/15">
                  View Reports <Download size={18} />
                </button>
              </div>
            </Motion.div>

            <Motion.div initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.1 }} className="hidden lg:block">
              <div className="rounded-2xl border border-white/15 bg-white p-5 shadow-2xl">
                <img src={bg2} alt="Pathology laboratory equipment" className="h-64 w-full rounded-xl object-cover" />
                <div className="grid gap-3 pt-5">
                  <HeroStatus icon={CalendarDays} title="Bookings" text="Online and walk-in patient flow" />
                  <HeroStatus icon={FlaskConical} title="Samples" text="Collected, processing and report-ready stages" />
                  <HeroStatus icon={ShieldCheck} title="Reports" text="Pathologist approval before release" />
                </div>
              </div>
            </Motion.div>
          </div>
        </section>

        <section className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-xl shadow-emerald-950/8 md:grid-cols-4">
            <Metric value="5" label="Role portals" />
            <Metric value="3" label="Billing modes" />
            <Metric value="24x7" label="Patient portal" />
            <Metric value="100%" label="Approval gated" />
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Services"
            title="A working experience for patients and lab staff"
            text="The homepage now connects directly to the real portal routes and presents the lab system as a complete diagnostic workflow."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {diagnostics.map((item, index) => (
              <Motion.article
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={reveal}
                transition={{ delay: index * 0.05, duration: 0.45 }}
                className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-950/8"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  {React.createElement(item.icon, { size: 28 })}
                </div>
                <h3 className="text-lg font-extrabold text-emerald-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </Motion.article>
            ))}
          </div>
        </section>

        <section id="process" className="bg-white py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <SectionHeader
                align="left"
                eyebrow="Process"
                title="Clear patient-to-report journey"
                text="Each stage has a responsible role, so the workflow looks realistic instead of like disconnected screens."
              />
              <div className="mt-8 overflow-hidden rounded-2xl border border-emerald-100">
                <img src={bg3} alt="Diagnostic report review" className="h-80 w-full object-cover" />
              </div>
            </div>

            <div className="grid gap-4">
              {journey.map((item, index) => (
                <Motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="rounded-2xl border border-emerald-100 bg-[#f7fcf9] p-5"
                >
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
                      {React.createElement(item.icon, { size: 24 })}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Step {index + 1}</p>
                      <h3 className="mt-1 text-xl font-extrabold text-emerald-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
                    </div>
                  </div>
                </Motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="quality" className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <SectionHeader
              align="left"
              eyebrow="Quality"
              title="Professional controls that make the system feel real"
              text="The design now communicates lab trust, clean access, and patient confidence without looking childish or overdecorated."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {highlights.map((point) => (
                <div key={point} className="flex gap-3 rounded-xl border border-emerald-100 bg-white p-4">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
                  <p className="text-sm font-semibold leading-6 text-slate-700">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-950 p-6 text-white shadow-2xl shadow-emerald-950/15">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-200">Staff Access</p>
            <h3 className="mt-3 text-3xl font-extrabold">Separate portals for serious lab work.</h3>
            <div className="mt-8 grid gap-3">
              <AccessButton label="Receptionist Login" onClick={() => go("/receptionist/login")} />
              <AccessButton label="Technician Login" onClick={() => go("/technician/login")} />
              <AccessButton label="Pathologist Login" onClick={() => go("/pathologist/login")} />
            </div>
          </div>
        </section>

        <section className="bg-[#e7f7ef] py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">Patient Portal</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-emerald-950 sm:text-4xl">Book tests and access approved reports from one place.</h2>
              <p className="mt-4 max-w-2xl leading-8 text-slate-700">Patients can request tests, review booking history, check payment status and download approved reports.</p>
            </div>
            <button onClick={() => go("/register")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-6 py-4 text-sm font-extrabold text-white hover:bg-emerald-900">
              Create Patient Account <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      <footer id="contact" className="bg-[#063326] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.05fr_0.95fr_0.9fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="INDIPATH logo" className="h-12 w-12 rounded-lg bg-white object-contain" />
              <div>
                <h2 className="text-2xl font-extrabold">INDIPATH</h2>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Multidiagnostic LLP</p>
              </div>
            </div>
            <p className="mt-5 max-w-md leading-7 text-emerald-50/80">Pathology lab management for appointments, billing, sample workflow, report approval and patient access.</p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-200">Contact</h3>
            <div className="mt-5 space-y-4 text-sm text-emerald-50/85">
              <ContactLine icon={Phone} text="02367-231970, 7448231970" />
              <ContactLine icon={Mail} text="indipathlab@gmail.com" />
              <ContactLine icon={MapPin} text="Kankavali, Maharashtra 416 602" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-200">Useful Actions</h3>
            <div className="mt-5 grid gap-2">
              <FooterAction label="Patient Login" onClick={() => go("/login")} />
              <FooterAction label="Register Patient" onClick={() => go("/register")} />
              <FooterAction label="Forgot Password" onClick={() => go("/forgot-password")} />
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-5 text-center text-xs font-semibold text-emerald-50/60">
          Copyright 2026 INDIPATH Multidiagnostic LLP. Role-protected diagnostic workflow system.
        </div>
      </footer>
    </div>
  );
}

function HeroStatus({ icon, title, text }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-700">
        {React.createElement(icon, { size: 22 })}
      </span>
      <span>
        <span className="block text-sm font-extrabold text-emerald-950">{title}</span>
        <span className="block text-xs font-semibold text-slate-500">{text}</span>
      </span>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div className="border-b border-emerald-100 p-6 text-center last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <p className="text-3xl font-extrabold text-emerald-900">{value}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, text, align = "center" }) {
  const alignment = align === "left" ? "text-left" : "mx-auto text-center";

  return (
    <div className={`max-w-3xl ${alignment}`}>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-emerald-950 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-8 text-slate-600">{text}</p>
    </div>
  );
}

function AccessButton({ label, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/8 px-4 py-4 text-sm font-bold text-emerald-50 hover:bg-white/12">
      {label} <ArrowRight size={16} />
    </button>
  );
}

function ContactLine({ icon, text }) {
  return (
    <div className="flex gap-3">
      {React.createElement(icon, { className: "mt-0.5 shrink-0 text-emerald-200", size: 18 })}
      <span>{text}</span>
    </div>
  );
}

function FooterAction({ label, onClick }) {
  return (
    <button onClick={onClick} className="rounded-lg border border-white/10 px-4 py-3 text-left text-sm font-semibold text-emerald-50/85 hover:bg-white/8 hover:text-white">
      {label}
    </button>
  );
}

export default HomePage;
