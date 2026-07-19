import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Home,
  LogOut,
  Phone,
  Search,
  ShoppingCart,
  TestTube2,
  User,
  UserRound
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import {
  createBooking,
  downloadReport,
  downloadReceipt,
  getBookings,
  getReports,
  getTests,
  getPackages
} from "../services/patientService";
import { changePassword, updateProfile } from "../services/profileService";
import logo from "../assets/logo.png";
import packageFallbackImage from "../assets/bg1.png";
import bg2 from "../assets/bg2.png";

const dashboardFont = "Aptos, 'Avenir Next', Inter, 'Segoe UI', system-ui, sans-serif";

const packagePresentation = [
  {
    title: "Executive Wellness Check",
    category: "Preventive Care",
    description: "A balanced screening for working professionals covering core blood markers, metabolic health, organ function, and lifestyle risk indicators.",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Complete Body Profile",
    category: "Full Body",
    description: "A broad preventive profile designed to review everyday wellness, nutritional status, vital organ function, and early health risk signals.",
    imageUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Diabetes Care Panel",
    category: "Diabetes",
    description: "Focused monitoring for blood sugar trends, kidney impact, lipid balance, and long-term diabetic care planning.",
    imageUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Heart Health Screening",
    category: "Cardiac",
    description: "A cardiac-focused assessment for cholesterol, inflammation risk, and markers that support proactive heart health decisions.",
    imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Women Wellness Profile",
    category: "Women Health",
    description: "Thoughtfully selected tests for hormonal balance, anemia screening, thyroid health, vitamin levels, and overall wellness.",
    imageUrl: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Senior Citizen Care",
    category: "Senior Care",
    description: "A practical profile for older adults covering chronic health markers, organ function, bone health, and key preventive indicators.",
    imageUrl: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Thyroid & Vitamin Profile",
    category: "Energy & Fatigue",
    description: "Ideal for fatigue, weight changes, and low energy concerns, with thyroid markers and essential vitamin screening.",
    imageUrl: "https://images.unsplash.com/photo-1576671081837-49000212a370?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Liver & Kidney Function",
    category: "Organ Health",
    description: "A focused organ function review to monitor liver enzymes, kidney filtration, electrolytes, and related metabolic markers.",
    imageUrl: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Immunity & Infection Panel",
    category: "Immunity",
    description: "A clinically useful panel for infection clues, inflammation trends, blood counts, and immune response indicators.",
    imageUrl: "https://images.unsplash.com/photo-1581093458791-9f3c3900df7b?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Active Lifestyle Profile",
    category: "Fitness",
    description: "Designed for active adults, this profile reviews muscle recovery, nutrients, cardiac risk, and metabolic readiness.",
    imageUrl: "https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Child Wellness Check",
    category: "Child Care",
    description: "A compact wellness screen for children, focused on blood counts, nutritional markers, and common health indicators.",
    imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Pre-Surgery Screening",
    category: "Clinical Readiness",
    description: "Essential pre-procedure investigations to help clinicians review blood health, clotting status, and organ readiness.",
    imageUrl: "https://images.unsplash.com/photo-1583912267550-d44c12f83739?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Fever & Inflammation Check",
    category: "Acute Care",
    description: "A responsive package for fever, body ache, and infection symptoms with blood counts and inflammation-focused markers.",
    imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Essential Annual Checkup",
    category: "Annual Care",
    description: "A clean annual profile for individuals who want a reliable overview of wellness, deficiencies, and lifestyle risk factors.",
    imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Advanced Wellness Plus",
    category: "Premium Care",
    description: "A premium preventive panel combining routine diagnostics with deeper metabolic, cardiac, thyroid, and vitamin insights.",
    imageUrl: "https://images.unsplash.com/photo-1580281657527-47f249e8f4df?auto=format&fit=crop&w=900&q=80"
  }
];

const toTitleCase = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const enhancePackage = (item, index) => {
  const preset = packagePresentation[index % packagePresentation.length];
  return {
    ...item,
    packageName: toTitleCase(item.packageName || preset.title),
    category: toTitleCase(item.category || preset.category),
    description: item.description || preset.description,
    imageUrl: item.imageUrl || preset.imageUrl,
    parametersCount: item.parametersCount || item.includedTests?.length || 0
  };
};

function PatientDashboard() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState("tests");
  const [tests, setTests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTest, setSelectedTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [testsData, packagesData, bookingsData, reportsData] = await Promise.all([
        getTests(),
        getPackages(),
        getBookings(),
        getReports()
      ]);
      setTests(testsData || []);
      setPackages(packagesData || []);
      setBookings(bookingsData || []);
      setReports(reportsData || []);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to load patient dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredTests = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return tests.filter((test) => {
      return (
        test.testName?.toLowerCase().includes(search) ||
        test.category?.toLowerCase().includes(search)
      );
    });
  }, [tests, searchTerm]);

  const displayPackages = useMemo(
    () => packages.map((item, index) => enhancePackage(item, index)),
    [packages]
  );

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const handleBooked = async () => {
    setSelectedTest(null);
    setCartItems([]);
    setActive("history");
    await loadDashboard();
  };

  const handleAddToCart = (item) => {
    const packageItem = { ...item, bookingType: "Package", displayName: item.packageName };
    setCartItems((currentItems) => {
      if (currentItems.some((cartItem) => cartItem._id === item._id)) {
        return currentItems;
      }

      return [...currentItems, packageItem];
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setCartItems((currentItems) => currentItems.filter((item) => item._id !== itemId));
  };

  const handleBookFromCart = (item) => {
    setSelectedTest(item);
    setActive("tests");
  };

  const handleBookPackage = (item) => {
    setSelectedTest({ ...item, bookingType: "Package", displayName: item.packageName });
    setActive("tests");
  };

  return (
    <div className="min-h-screen bg-[#f6fbf8] text-slate-900" style={{ fontFamily: dashboardFont }}>
      <PatientNavbar
        cartItems={cartItems}
        onBookItem={handleBookFromCart}
        onLogout={handleLogout}
        onRemoveItem={handleRemoveFromCart}
        onSearchChange={setSearchTerm}
        onShowProfile={() => setActive("profile")}
        searchTerm={searchTerm}
        user={user}
      />

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        {!loading && displayPackages.length > 0 && (
          <HealthPackagesCarousel
            cartItems={cartItems}
            packages={displayPackages}
            onAddToCart={handleAddToCart}
            onBook={handleBookPackage}
          />
        )}

        <nav className="mb-6 flex flex-wrap gap-2">
          <TabButton active={active === "tests"} onClick={() => { setActive("tests"); setSelectedTest(null); }}>Available Tests</TabButton>
          <TabButton active={active === "history"} onClick={() => setActive("history")}>Booking History</TabButton>
          <TabButton active={active === "payments"} onClick={() => setActive("payments")}>Payment Status</TabButton>
          <TabButton active={active === "reports"} onClick={() => setActive("reports")}>Reports & Receipts</TabButton>
          <TabButton active={active === "profile"} onClick={() => setActive("profile")}>Profile</TabButton>
        </nav>

        {loading ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center font-semibold text-slate-500 shadow-sm">Loading dashboard...</div>
        ) : (
          <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-950/8 sm:p-7">
            {active === "tests" && (
              selectedTest ? (
                <BookingForm test={selectedTest} onCancel={() => setSelectedTest(null)} onBooked={handleBooked} />
              ) : (
                <AvailableTests tests={filteredTests} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onBook={setSelectedTest} />
              )
            )}

            {active === "history" && <BookingHistory bookings={bookings} />}
            {active === "payments" && <PaymentStatus bookings={bookings} />}
            {active === "reports" && <ReportsAndReceipts bookings={bookings} reports={reports} />}
            {active === "profile" && <ProfileSection user={user} />}
          </section>
        )}
      </main>
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition duration-200 ${active ? "bg-emerald-700 text-white shadow-emerald-950/10" : "border border-emerald-100 bg-white text-slate-600 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-md"}`}
    >
      {children}
    </button>
  );
}

function PatientNavbar({ cartItems, onBookItem, onLogout, onRemoveItem, onSearchChange, onShowProfile, searchTerm, user }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/95 shadow-sm shadow-emerald-950/5 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[minmax(190px,0.7fr)_minmax(280px,1.2fr)_auto] lg:items-center lg:px-8">
        <button className="flex items-center gap-3 text-left" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img src={logo} alt="INDIPATH logo" className="h-11 w-11 rounded-xl object-contain shadow-sm" />
          <span>
            <span className="block text-[1.35rem] font-black leading-none tracking-tight text-emerald-950">INDIPATH</span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Super Speciality Lab</span>
          </span>
        </button>

        <label className="flex min-h-[3rem] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 shadow-inner shadow-slate-200/40 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
          <Search size={19} className="shrink-0 text-emerald-700" />
          <input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tests by name or category"
            className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
          <div className="hidden items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900 xl:flex">
            <Phone size={16} className="text-emerald-700" />
            <span>02367-231970</span>
            <span className="text-emerald-400">|</span>
            <span>7448231970</span>
          </div>

          <div className="relative">
            <button onClick={() => { setProfileOpen(!profileOpen); setCartOpen(false); }} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-md" aria-label="Open profile menu">
              <UserRound size={18} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-emerald-100 bg-white p-4 shadow-2xl shadow-emerald-950/12">
                <p className="text-sm font-black text-emerald-950">{user?.name || "Patient"}</p>
                <p className="mt-1 truncate text-xs font-semibold text-slate-500">{user?.email}</p>
                <button onClick={() => { onShowProfile(); setProfileOpen(false); }} className="mt-4 w-full rounded-xl bg-emerald-50 px-4 py-2 text-left text-sm font-bold text-emerald-800 transition hover:bg-emerald-100">
                  View Profile
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => { setCartOpen(!cartOpen); setProfileOpen(false); }} className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md" aria-label="Open cart">
              <ShoppingCart size={20} />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-700 px-1 text-[11px] font-black text-white ring-2 ring-white">
                {cartItems.length}
              </span>
            </button>
            {cartOpen && (
              <div className="absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-emerald-100 bg-white p-4 shadow-2xl shadow-emerald-950/12">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-black text-emerald-950">Cart</p>
                  <p className="text-xs font-bold text-slate-500">INR {cartTotal}</p>
                </div>
                {cartItems.length ? (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-sm font-black text-slate-900">{item.packageName}</p>
                        <p className="text-xs font-semibold text-slate-500">INR {item.price}</p>
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => { onBookItem(item); setCartOpen(false); }} className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800">
                            Book
                          </button>
                          <button onClick={() => onRemoveItem(item._id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-white">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-emerald-50 p-4 text-center text-sm font-semibold text-slate-600">Your health package cart is empty.</p>
                )}
              </div>
            )}
          </div>

          <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-xl">
            <LogOut size={17} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function HealthPackagesCarousel({ cartItems, packages, onAddToCart, onBook }) {
  const carouselRef = useRef(null);

  const scrollByCard = (direction) => {
    carouselRef.current?.scrollBy({ left: direction * 380, behavior: "smooth" });
  };

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-950/8">
      <div className="relative bg-emerald-950 px-5 py-8 text-white sm:px-7">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${bg2})` }} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,44,34,0.97),rgba(6,95,70,0.78),rgba(15,118,110,0.58))]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-100">Health Packages</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-[2.5rem]">Curated checkups for preventive care</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/85">Choose from clinically relevant preventive profiles and book through the same secure patient workflow.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => scrollByCard(-1)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white/15" aria-label="Previous packages">
              <ChevronLeft size={22} />
            </button>
            <button onClick={() => scrollByCard(1)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white/15" aria-label="Next packages">
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </div>

      <div ref={carouselRef} className="flex snap-x gap-5 overflow-x-auto scroll-smooth px-5 py-6 sm:px-7">
        {packages.map((item, index) => {
          const isInCart = cartItems.some((cartItem) => cartItem._id === item._id);

          return (
            <Motion.article
              key={item._id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              className="group min-w-[82%] snap-start overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-950/10 sm:min-w-[19.5rem] lg:min-w-[20.5rem]"
            >
              <div className="relative h-44 overflow-hidden">
                <img src={item.imageUrl || packageFallbackImage} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = packageFallbackImage; }} alt={item.packageName} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-800 shadow-sm">
                  {item.category || "Package"}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-[1.08rem] font-black leading-snug text-emerald-950">{item.packageName}</h3>
                  {item.homeCollection && <span title="Home collection available" className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Home size={18} /></span>}
                </div>
                <p className="mt-3 min-h-24 text-sm leading-6 text-slate-600">{item.description || "Comprehensive health checkup package."}</p>
                <p className="mt-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{item.includedTests?.length || item.parametersCount || 0} tests / parameters included</p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-100 pt-4">
                  <span className="text-2xl font-black text-emerald-950">INR {item.price}</span>
                  <div className="flex gap-2">
                    <button onClick={() => onAddToCart(item)} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${isInCart ? "bg-emerald-50 text-emerald-800" : "bg-emerald-700 text-white hover:bg-emerald-800"}`}>
                      {isInCart ? "Added" : "Add to cart"}
                    </button>
                    <button onClick={() => onBook(item)} className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50">
                      Book
                    </button>
                  </div>
                </div>
              </div>
            </Motion.article>
          );
        })}
      </div>
    </section>
  );
}

function AvailableTests({ tests, searchTerm, setSearchTerm, onBook }) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
        <Search size={18} className="text-emerald-700" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tests by name or category"
          className="w-full bg-transparent font-semibold outline-none"
        />
      </div>

      <h2 className="mb-4 text-xl font-black text-emerald-950">Individual Tests</h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {tests.length ? tests.map((test) => (
          <div key={test._id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-950/8">
            <div className="mb-4 flex items-start justify-between gap-3">
              <TestTube2 className="mt-1 text-emerald-700" size={24} />
              <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-black uppercase text-emerald-700">{test.category}</span>
            </div>
            <h3 className="text-lg font-black text-emerald-950">{test.testName}</h3>
            <p className="mt-2 min-h-12 text-sm leading-7 text-slate-500">{test.description || "Diagnostic lab test with verified reporting."}</p>
            <div className="mt-5 flex items-center justify-between border-t border-emerald-100 pt-4">
              <span className="text-xl font-black text-emerald-950">INR {test.price}</span>
              <button onClick={() => onBook({ ...test, bookingType: "Test", displayName: test.testName })} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-800">
                Book
              </button>
            </div>
          </div>
        )) : (
          <p className="col-span-full py-8 text-center text-slate-500">No tests found.</p>
        )}
      </div>
    </div>
  );
}

function BookingForm({ test, onCancel, onBooked }) {
  const [form, setForm] = useState({
    bookingDate: "",
    timeSlot: "",
    age: "",
    gender: "",
    sampleType: "",
    notes: ""
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.bookingDate || !form.timeSlot || !form.age || !form.gender) {
      alert("Please enter patient age, gender, preferred date and time slot");
      return;
    }

    try {
      const data = await createBooking({ ...form, ...(test.bookingType === "Package" ? { packageId: test._id } : { testId: test._id }) });
      alert(data.message);
      onBooked();
    } catch (error) {
      alert(error.response?.data?.message || "Booking failed");
    }
  };

  return (
    <div>
      <button onClick={onCancel} className="mb-5 text-sm font-extrabold text-emerald-700 hover:text-emerald-950">Back to tests</button>
      <div className="mb-5 rounded-xl bg-emerald-50 p-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-700">Selected {test.bookingType || "Test"}</p>
        <h2 className="text-xl font-extrabold text-emerald-950">{test.displayName || test.testName}</h2>
        <p className="text-sm font-semibold text-emerald-800">Amount: INR {test.price}</p>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input name="selectedTest" value={test.displayName || test.testName} readOnly className="bg-slate-50" />
        <Input name="age" type="number" min="0" max="130" placeholder="Patient age" value={form.age} onChange={handleChange} />
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
        >
          <option value="">Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
        <Input name="bookingDate" type="date" value={form.bookingDate} onChange={handleChange} />
        <Input name="sampleType" placeholder="Sample type, if known" value={form.sampleType} onChange={handleChange} />
        <select
          name="timeSlot"
          value={form.timeSlot}
          onChange={handleChange}
          className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 md:col-span-2"
        >
          <option value="">Preferred time slot</option>
          <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
          <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
          <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
          <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
        </select>
        <textarea
          name="notes"
          placeholder="Additional notes"
          value={form.notes}
          onChange={handleChange}
          className="min-h-28 rounded-xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 md:col-span-2"
        />
        <button className="rounded-xl bg-emerald-700 p-3 font-extrabold text-white shadow-lg shadow-emerald-950/10 hover:bg-emerald-800 md:col-span-2">Submit Booking Request</button>
      </form>
    </div>
  );
}

function BookingHistory({ bookings }) {
  if (!bookings.length) return <EmptyState text="No booking history yet." />;

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <BookingRow key={booking._id} booking={booking} />
      ))}
    </div>
  );
}

function PaymentStatus({ bookings }) {
  if (!bookings.length) return <EmptyState text="No payments to show yet." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="p-3">Test</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Payment</th>
            <th className="p-3">Booking</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id} className="border-t border-slate-100">
              <td className="p-3 font-semibold">{booking.testName}</td>
              <td className="p-3">INR {booking.amount}</td>
              <td className="p-3"><StatusBadge value={booking.paymentStatus} /></td>
              <td className="p-3"><StatusBadge value={booking.bookingStatus || booking.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportsAndReceipts({ bookings, reports }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800"><FileText size={20} /> Download Report</h2>
        {reports.length ? reports.map((report) => (
          <ReportButton key={report._id} report={report} />
        )) : <EmptyState text="Download Report appears only when report status is ready." />}
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800"><Download size={20} /> Download Receipt</h2>
        {bookings.length ? bookings.map((booking) => (
          <ReceiptButton key={booking._id} booking={booking} />
        )) : <EmptyState text="No receipts available yet." />}
      </div>
    </div>
  );
}

function ReportButton({ report }) {
  const handleDownload = async () => {
    try {
      const blob = await downloadReport(report._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${report._id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.response?.data?.message || "Report download failed");
    }
  };

  return (
    <button onClick={handleDownload} className="mb-3 flex w-full items-center justify-between rounded-md border border-slate-200 p-4 text-left text-sm font-semibold text-blue-700">
      {report.testName || "Lab report"} <Download size={16} />
    </button>
  );
}

function ProfileSection({ user }) {
  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || ""
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: ""
  });

  const saveProfile = async (e) => {
    e.preventDefault();

    try {
      const data = await updateProfile(profile);
      localStorage.setItem("user", JSON.stringify(data.user));
      alert(data.message);
    } catch (error) {
      alert(error.response?.data?.message || "Profile update failed");
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();

    try {
      const data = await changePassword(passwords);
      setPasswords({ currentPassword: "", newPassword: "" });
      alert(data.message);
    } catch (error) {
      alert(error.response?.data?.message || "Password change failed");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="rounded-2xl border border-emerald-100 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-emerald-950"><User size={20} /> Patient Profile</h2>
        <p className="mb-4 text-sm text-slate-500">Email: {user?.email}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Full name" className="w-full" />
          <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Phone number" className="w-full" />
        </div>
        <p className="my-4 rounded-md bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Age, gender and sample details are captured during each test booking so every test request has accurate visit-specific information.
        </p>
        <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-emerald-800">Update Profile</button>
      </form>

      <form onSubmit={savePassword} className="rounded-2xl border border-emerald-100 p-5">
        <h2 className="mb-4 text-lg font-extrabold text-emerald-950">Change Password</h2>
        <Input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} placeholder="Current password" className="mb-3 w-full" />
        <Input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} placeholder="New password" className="mb-3 w-full" />
        <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white">Change Password</button>
      </form>
    </div>
  );
}

function ReceiptButton({ booking }) {
  const handleDownload = async () => {
    try {
      const blob = await downloadReceipt(booking._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${booking.bookingCode || booking._id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.response?.data?.message || "Receipt download failed");
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={booking.paymentStatus !== "Paid"}
      className="mb-3 flex w-full items-center justify-between rounded-md border border-slate-200 p-4 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {booking.testName} {booking.paymentStatus === "Paid" ? <Download size={16} /> : <span className="text-xs">Unpaid</span>}
    </button>
  );
}

function BookingRow({ booking }) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-slate-400">{booking.bookingCode}</p>
          <p className="font-bold text-slate-900">{booking.testName}</p>
          <p className="text-sm text-slate-500">Requested: {booking.bookingDate || booking.date} | {booking.timeSlot}</p>
          <p className="text-sm text-slate-500">Amount: INR {booking.amount}</p>
          {booking.notes && <p className="text-sm text-slate-500">Notes: {booking.notes}</p>}
          {booking.rejectionReason && <p className="text-sm text-red-600">Rejection reason: {booking.rejectionReason}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={booking.bookingStatus || booking.status} />
          <StatusBadge value={booking.paymentStatus} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const isGood = value === "Paid" || value === "Completed" || value === "Confirmed" || value === "Report Ready" || value === "Arrived";
  const isWarning = value === "Pending Approval" || value === "Unpaid" || value === "Technician Assigned" || value === "Processing" || value === "Sample Collected" || value === "Pending Report Approval";
  const classes = isGood
    ? "bg-green-100 text-green-700"
    : value === "Rejected"
      ? "bg-red-100 text-red-700"
      : isWarning
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-700";

  return <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${classes}`}>{value}</span>;
}

function Input({ className = "", ...props }) {
  return <input {...props} className={`rounded-xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 ${className}`} />;
}

function EmptyState({ text }) {
  return <div className="rounded-md bg-slate-50 p-6 text-center text-sm text-slate-500">{text}</div>;
}

export default PatientDashboard;
