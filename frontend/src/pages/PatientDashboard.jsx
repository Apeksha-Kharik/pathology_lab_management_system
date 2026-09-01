import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  FlaskConical,
  HeartPulse,
  LogOut,
  MapPin,
  Phone,
  Printer,
  Search,
  ShieldCheck,
  ShoppingCart,
  TestTube2,
  UserRound,
  X
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import {
  createBooking,
  downloadReport,
  downloadReceipt,
  getBookings,
  getPackages,
  getReports,
  getTests
} from "../services/patientService";
import logo from "../assets/logo.png";
import bg1 from "../assets/bg1.png";
import bg2 from "../assets/bg2.png";
import bg3 from "../assets/bg3.png";

const dashboardFont = "Aptos, 'Avenir Next', Inter, 'Segoe UI', system-ui, sans-serif";
const showLegacyDashboardSections = false;

const _healthPackageCards = [
  {
    id: "pkg-01",
    type: "package",
    title: "Executive Wellness Check",
    imageUrl: bg2,
    chips: ["72 profiles", "110 parameters", "24 hr report"],
    price: 1499,
    oldPrice: 2999,
    discount: "50% off"
  },
  {
    id: "pkg-02",
    type: "package",
    title: "Complete Body Profile",
    imageUrl: bg1,
    chips: ["85 profiles", "125 parameters", "Same day"],
    price: 1899,
    oldPrice: 3799,
    discount: "50% off"
  },
  {
    id: "pkg-03",
    type: "package",
    title: "Diabetes Care Panel",
    imageUrl: bg3,
    chips: ["18 profiles", "42 parameters", "12 hr report"],
    price: 899,
    oldPrice: 1599,
    discount: "44% off"
  },
  {
    id: "pkg-04",
    type: "package",
    title: "Heart Health Screening",
    imageUrl: bg2,
    chips: ["24 profiles", "58 parameters", "24 hr report"],
    price: 1199,
    oldPrice: 2199,
    discount: "45% off"
  },
  {
    id: "pkg-05",
    type: "package",
    title: "Women Wellness Profile",
    imageUrl: bg1,
    chips: ["34 profiles", "76 parameters", "24 hr report"],
    price: 1399,
    oldPrice: 2499,
    discount: "44% off"
  },
  {
    id: "pkg-06",
    type: "package",
    title: "Senior Citizen Care",
    imageUrl: bg3,
    chips: ["52 profiles", "92 parameters", "Free fasting"],
    price: 1699,
    oldPrice: 3299,
    discount: "48% off"
  },
  {
    id: "pkg-07",
    type: "package",
    title: "Thyroid & Vitamin Profile",
    imageUrl: bg2,
    chips: ["12 profiles", "28 parameters", "12 hr report"],
    price: 799,
    oldPrice: 1399,
    discount: "43% off"
  },
  {
    id: "pkg-08",
    type: "package",
    title: "Liver & Kidney Function",
    imageUrl: bg1,
    chips: ["16 profiles", "38 parameters", "Same day"],
    price: 999,
    oldPrice: 1799,
    discount: "44% off"
  },
  {
    id: "pkg-09",
    type: "package",
    title: "Immunity & Infection Panel",
    imageUrl: bg3,
    chips: ["14 profiles", "33 parameters", "Urgent slots"],
    price: 1099,
    oldPrice: 1999,
    discount: "45% off"
  },
  {
    id: "pkg-10",
    type: "package",
    title: "Active Lifestyle Profile",
    imageUrl: bg2,
    chips: ["28 profiles", "63 parameters", "24 hr report"],
    price: 1299,
    oldPrice: 2399,
    discount: "46% off"
  },
  {
    id: "pkg-11",
    type: "package",
    title: "Child Wellness Check",
    imageUrl: bg1,
    chips: ["10 profiles", "22 parameters", "Pediatric care"],
    price: 699,
    oldPrice: 1299,
    discount: "46% off"
  },
  {
    id: "pkg-12",
    type: "package",
    title: "Pre-Surgery Screening",
    imageUrl: bg3,
    chips: ["20 profiles", "45 parameters", "Doctor ready"],
    price: 1599,
    oldPrice: 2899,
    discount: "45% off"
  },
  {
    id: "pkg-13",
    type: "package",
    title: "Fever & Inflammation Check",
    imageUrl: bg2,
    chips: ["9 profiles", "19 parameters", "Fast report"],
    price: 599,
    oldPrice: 1099,
    discount: "45% off"
  },
  {
    id: "pkg-14",
    type: "package",
    title: "Essential Annual Checkup",
    imageUrl: bg1,
    chips: ["40 profiles", "80 parameters", "24 hr report"],
    price: 1299,
    oldPrice: 2499,
    discount: "48% off"
  },
  {
    id: "pkg-15",
    type: "package",
    title: "Advanced Wellness Plus",
    imageUrl: bg3,
    chips: ["96 profiles", "145 parameters", "Premium care"],
    price: 2499,
    oldPrice: 4999,
    discount: "50% off"
  }
];

const popularTestCards = [
  { id: "test-01", type: "test", title: "Complete Blood Count", icon: TestTube2, chips: ["29 parameters", "Same day", "Blood"], price: 299 },
  { id: "test-02", type: "test", title: "Thyroid Profile Total", icon: HeartPulse, chips: ["T3 T4 TSH", "12 hr report", "Serum"], price: 449 },
  { id: "test-03", type: "test", title: "Lipid Profile", icon: FlaskConical, chips: ["9 parameters", "Fasting", "Serum"], price: 599 },
  { id: "test-04", type: "test", title: "Liver Function Test", icon: ShieldCheck, chips: ["12 parameters", "Same day", "Serum"], price: 699 },
  { id: "test-05", type: "test", title: "Kidney Function Test", icon: BadgeCheck, chips: ["11 parameters", "Same day", "Serum"], price: 649 },
  { id: "test-06", type: "test", title: "HbA1c", icon: TestTube2, chips: ["Diabetes", "3 month avg", "Blood"], price: 399 },
  { id: "test-07", type: "test", title: "Vitamin D Total", icon: HeartPulse, chips: ["Deficiency", "24 hr report", "Serum"], price: 899 },
  { id: "test-08", type: "test", title: "Vitamin B12", icon: FlaskConical, chips: ["Energy", "24 hr report", "Serum"], price: 749 },
  { id: "test-09", type: "test", title: "CRP Quantitative", icon: ShieldCheck, chips: ["Inflammation", "Same day", "Blood"], price: 499 },
  { id: "test-10", type: "test", title: "Urine Routine", icon: BadgeCheck, chips: ["Microscopy", "Same day", "Urine"], price: 199 },
  { id: "test-11", type: "test", title: "Blood Sugar Fasting", icon: TestTube2, chips: ["Glucose", "Fasting", "Plasma"], price: 99 },
  { id: "test-12", type: "test", title: "Electrolytes Profile", icon: HeartPulse, chips: ["Na K Cl", "Same day", "Serum"], price: 499 },
  { id: "test-13", type: "test", title: "Iron Studies", icon: FlaskConical, chips: ["Anemia", "24 hr report", "Serum"], price: 799 },
  { id: "test-14", type: "test", title: "Dengue NS1 Antigen", icon: ShieldCheck, chips: ["Fever", "Rapid report", "Blood"], price: 699 },
  { id: "test-15", type: "test", title: "ESR", icon: BadgeCheck, chips: ["Inflammation", "Same day", "Blood"], price: 149 }
];

const packageImages = [bg2, bg1, bg3];
const testIcons = [TestTube2, HeartPulse, FlaskConical, ShieldCheck, BadgeCheck];

const mapPackageToCard = (item, index) => ({
  id: `package-${item._id}`,
  sourceId: item._id,
  type: "package",
  bookingType: "Package",
  title: item.packageName,
  code: item.packageCode,
  description: item.description || "Comprehensive health checkup package.",
  includedTests: item.includedTests || [],
  imageUrl: item.imageUrl || packageImages[index % packageImages.length],
  fallbackImageUrl: packageImages[index % packageImages.length],
  chips: [
    `${item.includedTests?.length || 0} tests included`,
    item.homeCollection ? "Home collection" : "Visit lab",
    "Pending approval"
  ],
  price: Number(item.discountPrice ?? item.price ?? 0),
  oldPrice: item.oldPrice || Math.round(Number(item.price || 0) * 1.8),
  discount: item.discount || "Best value"
});

const mapTestToCard = (item, index) => ({
  id: `test-${item._id}`,
  sourceId: item._id,
  type: "test",
  bookingType: "Test",
  title: item.testName,
  icon: testIcons[index % testIcons.length],
  chips: [
    item.category || "Lab test",
    item.sampleType || "Sample",
    "Pending approval"
  ],
  price: Number(item.price || 0)
});

const filterShowcaseItems = (items, searchTerm) => {
  const search = searchTerm.trim().toLowerCase();

  if (!search) {
    return items;
  }

  return items.filter((item) => {
    const searchableText = [
      item.title,
      item.type,
      item.discount,
      ...(item.chips || [])
    ].join(" ").toLowerCase();

    return searchableText.includes(search);
  });
};

const getCartStorageKey = (user) => {
  const identifier = user?.id || user?._id || user?.email || "guest";
  return `indipath_cart_${identifier}`;
};

const getBookingRequestsStorageKey = (user) => {
  const identifier = user?.id || user?._id || user?.email || "guest";
  return `indipath_booking_requests_${identifier}`;
};

const readStoredCart = (storageKey) => {
  try {
    const savedCart = localStorage.getItem(storageKey);
    return savedCart ? JSON.parse(savedCart) : [];
  } catch {
    return [];
  }
};

const readStoredBookingRequests = (storageKey) => {
  try {
    const savedRequests = localStorage.getItem(storageKey);
    return savedRequests ? JSON.parse(savedRequests) : [];
  } catch {
    return [];
  }
};

const getSampleCollectionLabel = (collectionType) => {
  const value = String(collectionType || "").trim().toLowerCase();

  if (value.includes("home")) return "Home Visit";
  if (value.includes("lab") || value.includes("visit")) return "Lab Visit";

  return "N/A";
};

const buildBookingHistoryRows = (localRequests, serverBookings) => {
  const localRows = localRequests.map((booking) => ({
    id: booking.bookingId,
    code: booking.bookingId,
    patientCode: booking.patientCode || "Pending",
    status: booking.status || "Pending Approval",
    paymentStatus: booking.paymentStatus || "Pending",
    testName: booking.itemTitle,
    bookingType: booking.itemType,
    patientName: booking.patient?.name || "",
    age: booking.patient?.age || "",
    gender: booking.patient?.gender || "",
    mobile: booking.patient?.mobile || "",
    email: booking.patient?.email || "",
    sampleCollection: getSampleCollectionLabel(booking.collectionType),
    date: booking.preferredDate,
    timeSlot: booking.timeSlot,
    amount: booking.amount
  }));

  const serverRows = serverBookings.map((booking) => ({
    id: booking._id,
    code: booking.bookingCode || booking._id,
    patientCode: booking.patientCode || "Pending",
    status: booking.bookingStatus || booking.status || "Pending Approval",
    paymentStatus: booking.paymentStatus || "Pending",
    testName: booking.testName,
    bookingType: booking.bookingType || "Test",
    patientName: booking.name || booking.patientName || "",
    age: booking.age || "",
    gender: booking.gender || "",
    mobile: booking.phone || "",
    email: booking.email || "",
    sampleCollection: getSampleCollectionLabel(booking.collectionType || "Lab"),
    date: booking.bookingDate || booking.date || "",
    timeSlot: booking.timeSlot || "",
    amount: booking.amount || ""
  }));

  return [...localRows, ...serverRows];
};

function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const cartStorageKey = useMemo(() => getCartStorageKey(user), [user]);
  const bookingRequestsStorageKey = useMemo(() => getBookingRequestsStorageKey(user), [user]);
  const [active, setActive] = useState("tests");
  const [patientView, setPatientView] = useState("book");
  const [tests, setTests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState(() => readStoredCart(cartStorageKey));
  const [bookingRequests, setBookingRequests] = useState(() => readStoredBookingRequests(bookingRequestsStorageKey));
  const [bookingItem, setBookingItem] = useState(null);

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

  const healthPackageRows = useMemo(
    () => packages.map(mapPackageToCard),
    [packages]
  );

  const popularTestRows = useMemo(
    () => tests.length ? tests.map(mapTestToCard) : popularTestCards,
    [tests]
  );

  const filteredHealthPackages = useMemo(
    () => filterShowcaseItems(healthPackageRows, searchTerm),
    [healthPackageRows, searchTerm]
  );

  const filteredPopularTests = useMemo(
    () => filterShowcaseItems(popularTestRows, searchTerm),
    [popularTestRows, searchTerm]
  );

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const handleAddToCart = (item) => {
    setCartItems((currentItems) => {
      if (currentItems.some((cartItem) => cartItem.id === item.id)) {
        return currentItems;
      }

      const nextItems = [...currentItems, item];
      localStorage.setItem(cartStorageKey, JSON.stringify(nextItems));
      return nextItems;
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setCartItems((currentItems) => {
      const nextItems = currentItems.filter((item) => item.id !== itemId);
      localStorage.setItem(cartStorageKey, JSON.stringify(nextItems));
      return nextItems;
    });
  };

  const handleOpenBooking = (item) => {
    setBookingItem(item);
  };

  const handleCloseBooking = () => {
    setBookingItem(null);
  };

  const handleBookingRequested = (request) => {
    if (request?.serverBooking) {
      loadDashboard();
      return;
    }

    setBookingRequests((currentRequests) => {
      const nextRequests = [request, ...currentRequests];
      localStorage.setItem(bookingRequestsStorageKey, JSON.stringify(nextRequests));
      return nextRequests;
    });
  };

  const bookingHistoryRows = useMemo(
    () => buildBookingHistoryRows(bookingRequests, bookings),
    [bookingRequests, bookings]
  );

  return (
    <div className="min-h-screen bg-[#f6fbf8] text-slate-900" style={{ fontFamily: dashboardFont }}>
      <PatientNavbar
        cartItems={cartItems}
        onBookNow={handleOpenBooking}
        onLogout={handleLogout}
        onRemoveItem={handleRemoveFromCart}
        onSearchChange={setSearchTerm}
        onShowProfile={() => navigate("/patient/profile")}
        searchTerm={searchTerm}
        user={user}
      />

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-3">
          <button onClick={() => setPatientView("book")} className={`rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition-colors ${patientView === "book" ? "bg-emerald-700 text-white" : "border border-emerald-100 bg-white text-emerald-800 hover:bg-emerald-50"}`}>
            Book Tests
          </button>
          <button onClick={() => setPatientView("history")} className={`rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition-colors ${patientView === "history" ? "bg-emerald-700 text-white" : "border border-emerald-100 bg-white text-emerald-800 hover:bg-emerald-50"}`}>
            Booking History
          </button>
          <button onClick={() => setPatientView("downloads")} className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition-colors ${patientView === "downloads" ? "bg-emerald-700 text-white" : "border border-emerald-100 bg-white text-emerald-800 hover:bg-emerald-50"}`}>
            <FileText size={17} /> Reports & Receipts
          </button>
        </div>

        {!loading && patientView === "book" && (
          <div className="mb-8 space-y-8">
            <ShowcaseRow
              cartItems={cartItems}
              eyebrow="Health Packages"
              items={filteredHealthPackages}
              onAddToCart={handleAddToCart}
              onBookNow={handleOpenBooking}
              subtitle="Preventive profiles with bundled savings, fast reporting, and clean patient-facing booking flow."
              title="Health Packages"
            />
            <ShowcaseRow
              cartItems={cartItems}
              eyebrow="Popular Tests"
              items={filteredPopularTests}
              onAddToCart={handleAddToCart}
              onBookNow={handleOpenBooking}
              subtitle="Frequently booked individual diagnostics presented in the same responsive carousel pattern."
              title="Popular Tests"
            />
          </div>
        )}

        {!loading && patientView === "history" && (
          <BookingHistoryTable bookings={bookingHistoryRows} />
        )}

        {!loading && patientView === "downloads" && (
          <DownloadsSection bookings={bookings} reports={reports} user={user} />
        )}

        {showLegacyDashboardSections && (
          <>
            <nav className="mb-6 flex flex-wrap gap-2">
              <TabButton active={active === "tests"} onClick={() => setActive("tests")}>Available Tests</TabButton>
              <TabButton active={active === "history"} onClick={() => setActive("history")}>Booking History</TabButton>
              <TabButton active={active === "payments"} onClick={() => setActive("payments")}>Payment Status</TabButton>
              <TabButton active={active === "reports"} onClick={() => setActive("reports")}>Reports & Receipts</TabButton>
            </nav>

            {loading ? (
              <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center font-semibold text-slate-500 shadow-sm">Loading dashboard...</div>
            ) : (
              <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-950/8 sm:p-7">
                {active === "tests" && <AvailableTests tests={filteredTests} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onBook={() => {}} />}
                {active === "history" && <BookingHistory bookings={bookings} />}
                {active === "payments" && <PaymentStatus bookings={bookings} />}
                {active === "reports" && <ReportsAndReceipts bookings={bookings} reports={reports} />}
              </section>
            )}
          </>
        )}
      </main>

      <PatientDashboardFooter
        onDownloads={() => setPatientView("downloads")}
        onHistory={() => setPatientView("history")}
        onProfile={() => navigate("/patient/profile")}
        onTests={() => setPatientView("book")}
      />

      {bookingItem && (
        <BookingWizardModal
          item={bookingItem}
          onBookingRequested={handleBookingRequested}
          onClose={handleCloseBooking}
          user={user}
        />
      )}
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

function PatientNavbar({ cartItems, onBookNow, onLogout, onRemoveItem, onSearchChange, onShowProfile, searchTerm, user }) {
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
                      <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-sm font-black text-slate-900">{item.title}</p>
                        <p className="text-xs font-semibold text-slate-500">INR {item.price}</p>
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => { onBookNow(item); setCartOpen(false); }} className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800">
                            {item.type === "package" ? "Book Package" : "Book Now"}
                          </button>
                          <button onClick={() => onRemoveItem(item.id)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800">
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

function PatientDashboardFooter({ onDownloads, onHistory, onProfile, onTests }) {
  return (
    <footer className="mt-10 border-t border-emerald-100 bg-[#063326] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.1fr_0.9fr_0.9fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="INDIPATH logo" className="h-12 w-12 rounded-xl bg-white object-contain" />
            <div>
              <h2 className="text-2xl font-black">INDIPATH</h2>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Super Speciality Pathology Lab</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm font-semibold leading-7 text-emerald-50/75">
            Secure patient booking, receptionist approval, payment receipts, and pathologist-approved diagnostic reports in one portal.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-bold text-emerald-50">Pending approval tracking</span>
            <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-bold text-emerald-50">PDF reports</span>
            <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-bold text-emerald-50">Paid receipts</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-200">Patient Actions</h3>
          <div className="mt-5 grid gap-2">
            <FooterButton label="Book Tests" onClick={onTests} />
            <FooterButton label="Booking History" onClick={onHistory} />
            <FooterButton label="Downloads" onClick={onDownloads} />
            <FooterButton label="Profile" onClick={onProfile} />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-200">Support</h3>
          <div className="mt-5 space-y-4 text-sm font-semibold leading-7 text-emerald-50/80">
            <p className="flex gap-3"><Phone className="mt-1 shrink-0 text-emerald-200" size={17} /> 02367-231970, 7448231970</p>
            <p className="flex gap-3"><FileText className="mt-1 shrink-0 text-emerald-200" size={17} /> Reports appear after pathologist approval.</p>
            <p className="flex gap-3"><MapPin className="mt-1 shrink-0 text-emerald-200" size={17} /> 22 Mahapurush Complex, BazarPeth Kankavali, Tal. Kankavali - 416 602</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs font-semibold text-emerald-50/60">
        Copyright 2026 INDIPATH. Patient IDs are generated after receptionist confirmation.
      </div>
    </footer>
  );
}

function FooterButton({ label, onClick }) {
  return (
    <button onClick={onClick} className="rounded-xl border border-white/10 px-4 py-3 text-left text-sm font-bold text-emerald-50/85 transition-colors hover:bg-white/8 hover:text-white">
      {label}
    </button>
  );
}

function ShowcaseRow({ cartItems, eyebrow, items, onAddToCart, onBookNow, subtitle, title }) {
  const rowRef = useRef(null);

  const scrollRow = (direction) => {
    rowRef.current?.scrollBy({
      left: direction * Math.max(rowRef.current.clientWidth * 0.85, 320),
      behavior: "smooth"
    });
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-950/8">
      <div className="relative bg-emerald-950 px-6 py-8 text-white sm:px-8">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${bg2})` }} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,44,34,0.97),rgba(6,95,70,0.78),rgba(15,118,110,0.58))]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-100">{eyebrow}</p>
            <h2 className="mt-2 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-[2.65rem]">{title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/85">{subtitle}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => scrollRow(-1)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/15" aria-label={`Scroll ${title} left`}>
              <ChevronLeft size={22} />
            </button>
            <button onClick={() => scrollRow(1)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/15" aria-label={`Scroll ${title} right`}>
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-7 sm:px-8">
        {items.length ? (
          <div ref={rowRef} className="flex gap-6 overflow-x-auto scroll-smooth pb-2">
            {items.map((item) => {
              const isInCart = cartItems.some((cartItem) => cartItem.id === item.id);

              return (
                <ShowcaseCard
                  key={item.id}
                  item={item}
                  isInCart={isInCart}
                  onAddToCart={onAddToCart}
                  onBookNow={onBookNow}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-8 text-center text-sm font-bold text-slate-600">
            No {title.toLowerCase()} found for this search.
          </div>
        )}
      </div>
    </section>
  );
}

function ShowcaseCard({ item, isInCart, onAddToCart, onBookNow }) {
  const [showTests, setShowTests] = useState(false);
  const Icon = item.icon || CalendarDays;
  const imageSrc = item.imageUrl || item.fallbackImageUrl;

  return (
    <article className="flex min-h-[31rem] shrink-0 basis-[88%] flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-[0_10px_35px_rgba(2,44,34,0.07)] transition-shadow duration-300 hover:border-emerald-300 hover:shadow-[0_18px_45px_rgba(2,44,34,0.12)] sm:basis-[calc((100%_-_24px)/2)] lg:basis-[calc((100%_-_48px)/3)]">
      <div className="relative h-48 overflow-hidden bg-emerald-50">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={item.title}
            onError={(event) => {
              if (!item.fallbackImageUrl || event.currentTarget.dataset.fallbackApplied) return;
              event.currentTarget.dataset.fallbackApplied = "true";
              event.currentTarget.src = item.fallbackImageUrl;
            }}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#ecfdf5,#f8fafc)]">
            <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-emerald-700 shadow-lg shadow-emerald-950/10">
              <Icon size={46} />
            </span>
          </div>
        )}
        {item.discount && (
          <span className="absolute right-4 top-4 rounded-full bg-emerald-700 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-sm">
            {item.discount}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="min-h-16 text-[1.28rem] font-black leading-snug text-emerald-950">{item.title}</h3>

        <div className="mt-4 flex min-h-20 flex-wrap content-start gap-2.5">
          {item.chips.map((chip) => (
            <span key={chip} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-5 border-t border-emerald-100 pt-5">
          <div className="flex min-h-9 items-center gap-2">
            <span className="text-[1.7rem] font-black text-emerald-950">INR {item.price}</span>
            {item.oldPrice && <span className="text-sm font-bold text-slate-400 line-through">INR {item.oldPrice}</span>}
          </div>
        </div>

        {item.type === "package" && <div className="mb-4"><p className="text-sm text-slate-600">{item.description}</p><button type="button" onClick={() => setShowTests(!showTests)} className="mt-3 text-sm font-black text-emerald-700">{showTests ? "Hide Tests" : "View Tests"}</button>{showTests && <div className="mt-2 max-h-40 overflow-auto rounded-xl bg-emerald-50 p-3">{item.includedTests.length ? item.includedTests.map((test, index) => <p key={test._id || test} className="py-1 text-sm font-semibold">{index + 1}. {test.testName || test}</p>) : <p className="text-sm text-slate-500">No test details available.</p>}</div>}</div>}
        <div className="mt-auto space-y-2">
          <button
            onClick={() => onAddToCart(item)}
            className={`w-full rounded-2xl px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-950/10 transition-colors duration-200 ${isInCart ? "bg-emerald-900" : "bg-emerald-700 hover:bg-emerald-800"}`}
          >
            {isInCart ? "Added to Cart" : item.type === "package" ? "Add Package to Cart" : "Add to Cart"}
          </button>
          {isInCart && (
            <button
              onClick={() => onBookNow(item)}
              className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3.5 text-sm font-black text-emerald-800 shadow-sm transition-colors duration-200 hover:bg-emerald-50"
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

const timeSlots = [
  "07:00 AM - 09:00 AM",
  "09:00 AM - 11:00 AM",
  "11:00 AM - 01:00 PM",
  "04:00 PM - 06:00 PM"
];

const nearestLab = {
  name: "INDIPATH Super Speciality Pathology Lab",
  address: "Near Main Road, Kankavali, Maharashtra 416602",
  timings: "Mon-Sat, 7:00 AM - 8:00 PM",
  contact: "02367-231970, 7448231970",
  map: "https://maps.google.com/?q=Kankavali%20Maharashtra%20416602"
};

const createBlankBookingForm = () => ({
  name: "",
  age: "",
  gender: "",
  mobile: "",
  email: "",
  prescribedBy: "",
  notes: "",
  preferredDate: "",
  timeSlot: "",
  houseNo: "",
  building: "",
  street: "",
  landmark: "",
  area: "",
  city: "",
  taluka: "",
  district: "",
  state: "",
  pinCode: ""
});

const createSelfBookingForm = (user) => ({
  ...createBlankBookingForm(),
  name: user?.name || "",
  age: user?.age || "",
  gender: user?.gender || "",
  mobile: user?.phone || "",
  email: user?.email || "",
  street: user?.address || "",
  city: user?.city || "",
  state: user?.state || "",
  pinCode: user?.pincode || user?.pinCode || ""
});

function BookingWizardModal({ item, onBookingRequested, onClose, user }) {
  const [step, setStep] = useState(1);
  const [patientType, setPatientType] = useState("self");
  const [collectionType, setCollectionType] = useState("home");
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() => createSelfBookingForm(user));

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updatePatientType = (value) => {
    setPatientType(value);
    setError("");

    if (value === "self") {
      setForm(createSelfBookingForm(user));
      return;
    }

    setForm(createBlankBookingForm());
  };

  const selectedItems = [item];
  const totalAmount = selectedItems.reduce((sum, selectedItem) => sum + Number(selectedItem.price || 0), 0);

  const validateStep = () => {
    if (step === 1) {
      const patientFields = ["name", "age", "gender", "mobile", "email"];
      const missingPatient = patientFields.some((field) => !String(form[field] || "").trim());

      if (missingPatient || !form.preferredDate || !form.timeSlot) {
        return "Please complete patient details, preferred date, and time slot.";
      }
    }

    if (step === 2 && collectionType === "home") {
      const addressFields = ["houseNo", "street", "area", "city", "taluka", "district", "state", "pinCode"];
      const missingAddress = addressFields.some((field) => !String(form[field] || "").trim());

      if (missingAddress) {
        return "Please complete the home collection address.";
      }
    }

    return "";
  };

  const goNext = () => {
    const validationError = validateStep();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setStep((current) => Math.min(current + 1, 3));
  };

  const confirmBooking = async () => {
    const id = `IND-${Date.now().toString().slice(-6)}`;
    const location = collectionType === "home"
      ? `${form.houseNo}, ${form.building ? `${form.building}, ` : ""}${form.street}, ${form.landmark ? `${form.landmark}, ` : ""}${form.area}, ${form.city}, ${form.taluka}, ${form.district}, ${form.state} - ${form.pinCode}`
      : `${nearestLab.name}, ${nearestLab.address}`;

    try {
      setSubmitting(true);
      setError("");

      if (item.sourceId) {
        const data = await createBooking({
          ...(item.bookingType === "Package" ? { packageId: item.sourceId } : { testId: item.sourceId }),
          age: form.age,
          gender: form.gender,
          patientName: form.name,
          phone: form.mobile,
          email: form.email,
          bookingDate: form.preferredDate,
          timeSlot: form.timeSlot,
          notes: form.notes,
          doctorNotes: form.prescribedBy,
          homeSample: collectionType === "home",
          collectionType: collectionType === "home" ? "Home Collection" : "Visit Lab",
          address: location,
          sampleType: ""
        });

        setBookingId(data.booking?.bookingCode || id);
        onBookingRequested({ serverBooking: data.booking });
        setStep(4);
        return;
      }

      onBookingRequested({
        bookingId: id,
        status: "Pending Approval",
        paymentStatus: "Pending",
        itemId: item.id,
        itemTitle: item.title,
        itemType: item.type === "package" ? "Package" : "Test",
        amount: totalAmount,
        patient: {
          name: form.name,
          age: form.age,
          gender: form.gender,
          mobile: form.mobile,
          email: form.email,
          prescribedBy: form.prescribedBy,
          notes: form.notes
        },
        collectionType: collectionType === "home" ? "Home Collection" : "Visit Lab",
        location,
        preferredDate: form.preferredDate,
        timeSlot: form.timeSlot,
        createdAt: new Date().toISOString()
      });
      setBookingId(id);
      setStep(4);
    } catch (error) {
      setError(error.response?.data?.message || "Booking request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const summaryText = [
    `Booking ID: ${bookingId}`,
    `Item: ${item.title}`,
    `Patient: ${form.name}`,
    `Date/Time: ${form.preferredDate}, ${form.timeSlot}`,
    `Collection: ${collectionType === "home" ? "Home Collection" : "Visit Lab"}`,
    `Amount: INR ${totalAmount}`,
    "Payment Status: Pay at lab / pending"
  ].join("\n");

  const downloadSummary = () => {
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${bookingId || "booking"}-summary.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-emerald-950/35 px-4 py-6 backdrop-blur-md">
      <Motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl shadow-emerald-950/25"
      >
        <div className="flex items-start justify-between gap-4 border-b border-emerald-100 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Secure booking</p>
            <h2 className="mt-1 text-2xl font-black text-emerald-950 sm:text-3xl">{step === 4 ? "Booking Request Submitted" : item.title}</h2>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800" aria-label="Close booking modal">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-5.5rem)] overflow-y-auto px-5 py-6 sm:px-7">
          {step < 4 && <WizardProgress step={step} />}
          {error && <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</div>}

          {step === 1 && (
            <div className="space-y-6">
              <SegmentedChoice
                value={patientType}
                onChange={updatePatientType}
                options={[
                  { value: "self", label: "Self", description: "Use your registered patient details." },
                  { value: "other", label: "Other Patient", description: "Book for a family member or another patient." }
                ]}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <WizardField label="Name" value={form.name} onChange={(value) => updateField("name", value)} />
                <WizardField label="Age" type="number" value={form.age} onChange={(value) => updateField("age", value)} />
                <WizardSelect label="Gender" value={form.gender} onChange={(value) => updateField("gender", value)} options={["", "Male", "Female", "Other", "Prefer not to say"]} />
                <WizardField label="Mobile" value={form.mobile} onChange={(value) => updateField("mobile", value)} />
                <WizardField label="Email" type="email" value={form.email} onChange={(value) => updateField("email", value)} />
                <WizardField label="Prescribed By / Doctor" value={form.prescribedBy} onChange={(value) => updateField("prescribedBy", value)} />
                <WizardField label="Preferred Date" type="date" value={form.preferredDate} onChange={(value) => updateField("preferredDate", value)} />
                <WizardSelect label="Time Slot" value={form.timeSlot} onChange={(value) => updateField("timeSlot", value)} options={["", ...timeSlots]} />
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black text-slate-700">Notes if needed</span>
                  <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <SegmentedChoice
                value={collectionType}
                onChange={(value) => { setCollectionType(value); setError(""); }}
                options={[
                  { value: "home", label: "Home Collection", description: "Technician visits your selected address." },
                  { value: "lab", label: "Visit Lab", description: "Walk in at the nearest INDIPATH lab." }
                ]}
              />

              {collectionType === "home" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <WizardField label="House / Flat No." value={form.houseNo} onChange={(value) => updateField("houseNo", value)} />
                  <WizardField label="Building" value={form.building} onChange={(value) => updateField("building", value)} />
                  <WizardField label="Street" value={form.street} onChange={(value) => updateField("street", value)} />
                  <WizardField label="Landmark" value={form.landmark} onChange={(value) => updateField("landmark", value)} />
                  <WizardField label="Area" value={form.area} onChange={(value) => updateField("area", value)} />
                  <WizardField label="City" value={form.city} onChange={(value) => updateField("city", value)} />
                  <WizardField label="Taluka" value={form.taluka} onChange={(value) => updateField("taluka", value)} />
                  <WizardField label="District" value={form.district} onChange={(value) => updateField("district", value)} />
                  <WizardField label="State" value={form.state} onChange={(value) => updateField("state", value)} />
                  <WizardField label="PIN Code" value={form.pinCode} onChange={(value) => updateField("pinCode", value)} />
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50">
                  <div className="flex h-56 items-center justify-center bg-[linear-gradient(135deg,#d1fae5,#f8fafc)] text-emerald-800">
                    <div className="text-center">
                      <MapPin size={52} className="mx-auto mb-3" />
                      <p className="text-sm font-black uppercase tracking-[0.18em]">Nearest Lab Location</p>
                    </div>
                  </div>
                  <div className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <h3 className="text-xl font-black text-emerald-950">{nearestLab.name}</h3>
                      <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">{nearestLab.address}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">Timings: {nearestLab.timings}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">Contact: {nearestLab.contact}</p>
                    </div>
                    <a href={nearestLab.map} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800">
                      <MapPin size={18} /> View Map
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <BookingReview item={item} form={form} collectionType={collectionType} totalAmount={totalAmount} />
          )}

          {step === 4 && (
            <BookingSuccess
              bookingId={bookingId}
              collectionType={collectionType}
              form={form}
              item={item}
              onBookMore={onClose}
              onDownload={downloadSummary}
              totalAmount={totalAmount}
            />
          )}

          {step < 4 && (
            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-emerald-100 pt-5 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => step === 1 ? onClose() : setStep((current) => current - 1)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                {step === 1 ? "Cancel" : "Back"}
              </button>
              <button type="button" onClick={step === 3 ? confirmBooking : goNext} disabled={submitting} className="rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60">
                {step === 3 ? (submitting ? "Submitting..." : "Submit Request") : "Next"}
              </button>
            </div>
          )}
        </div>
      </Motion.div>
    </div>
  );
}

function WizardProgress({ step }) {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      {["Patient", "Collection", "Review"].map((label, index) => {
        const number = index + 1;
        const active = step >= number;

        return (
          <div key={label} className={`rounded-2xl border px-4 py-3 transition ${active ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-500"}`}>
            <p className="text-xs font-black uppercase tracking-[0.18em]">Step {number}</p>
            <p className="mt-1 text-sm font-black">{label}</p>
          </div>
        );
      })}
    </div>
  );
}

function SegmentedChoice({ options, onChange, value }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const active = value === option.value;

        return (
          <button key={option.value} type="button" onClick={() => onChange(option.value)} className={`rounded-3xl border p-5 text-left transition duration-300 ${active ? "border-emerald-300 bg-emerald-50 shadow-lg shadow-emerald-950/8" : "border-slate-200 bg-white hover:border-emerald-200 hover:shadow-md"}`}>
            <span className="text-lg font-black text-emerald-950">{option.label}</span>
            <span className="mt-2 block text-sm font-semibold leading-6 text-slate-600">{option.description}</span>
          </button>
        );
      })}
    </div>
  );
}

function WizardField({ label, onChange, readOnly = false, type = "text", value }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        className={`w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${readOnly ? "bg-emerald-50 text-slate-600" : "bg-slate-50 focus:bg-white"}`}
      />
    </label>
  );
}

function WizardSelect({ disabled = false, label, onChange, options, value }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      <select
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${disabled ? "bg-emerald-50 text-slate-600" : "bg-slate-50 focus:bg-white"}`}
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>{option || `Select ${label}`}</option>
        ))}
      </select>
    </label>
  );
}

function BookingReview({ collectionType, form, item, totalAmount }) {
  const address = `${form.houseNo}, ${form.building ? `${form.building}, ` : ""}${form.street}, ${form.landmark ? `${form.landmark}, ` : ""}${form.area}, ${form.city}, ${form.taluka}, ${form.district}, ${form.state} - ${form.pinCode}`;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
      <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
        <h3 className="text-xl font-black text-emerald-950">Booking Review</h3>
        <div className="mt-5 space-y-4">
          <ReviewLine label="Selected" value={item.title} />
          <ReviewLine label="Patient" value={`${form.name}, ${form.age} yrs, ${form.gender}`} />
          <ReviewLine label="Contact" value={`${form.mobile} | ${form.email}`} />
          <ReviewLine label="Doctor" value={form.prescribedBy || "Not specified"} />
          <ReviewLine label="Date & Time" value={`${form.preferredDate} | ${form.timeSlot}`} />
          <ReviewLine label="Collection" value={collectionType === "home" ? "Home Collection" : "Visit Lab"} />
          <ReviewLine label={collectionType === "home" ? "Address" : "Lab"} value={collectionType === "home" ? address : `${nearestLab.name}, ${nearestLab.address}`} />
          {form.notes && <ReviewLine label="Notes" value={form.notes} />}
        </div>
      </div>

      <div className="rounded-3xl bg-emerald-950 p-6 text-white shadow-xl shadow-emerald-950/15">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Amount</p>
        <p className="mt-3 text-4xl font-black">INR {totalAmount}</p>
        <p className="mt-3 text-sm font-semibold leading-7 text-emerald-50/80">Payment status will remain pending until lab confirmation or collection payment.</p>
      </div>
    </div>
  );
}

function ReviewLine({ label, value }) {
  return (
    <div className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-slate-800">{value}</p>
    </div>
  );
}

function BookingSuccess({ bookingId, collectionType, form, item, onBookMore, onDownload, totalAmount }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={58} />
      </div>
      <h3 className="mt-5 text-3xl font-black text-emerald-950">Booking request submitted</h3>
      <p className="mt-2 text-sm font-semibold text-slate-600">Booking ID: <span className="text-emerald-800">{bookingId}</span></p>
      <p className="mt-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
        Status: Pending Approval. Your booking will be confirmed only after receptionist approval.
      </p>

      <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-left">
        <ReviewLine label="Selected" value={item.title} />
        <ReviewLine label="Patient" value={form.name} />
        <ReviewLine label="Date & Time" value={`${form.preferredDate} | ${form.timeSlot}`} />
        <ReviewLine label="Collection" value={collectionType === "home" ? "Home Collection" : "Visit Lab"} />
        <ReviewLine label="Amount" value={`INR ${totalAmount}`} />
        <ReviewLine label="Booking Status" value="Pending Approval" />
        <ReviewLine label="Payment Status" value="Pending / Pay at lab" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button onClick={onDownload} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50">
          <Download size={18} /> Download
        </button>
        <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50">
          <Printer size={18} /> Print
        </button>
        <button onClick={onBookMore} className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800">
          Book More Tests
        </button>
        <button onClick={() => { window.location.href = "/"; }} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">
          Go to Home
        </button>
      </div>
    </div>
  );
}

const safeFilePart = (value) => String(value || "patient").trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "patient";

const buildPatientDownloadName = (name, patientCode, documentType) => {
  return `${safeFilePart(name)}-${safeFilePart(patientCode || "pending-patient-id")}-${safeFilePart(documentType).toUpperCase()}.pdf`;
};

function DownloadsSection({ bookings, reports, user }) {
  const paidBookings = bookings.filter((booking) => booking.paymentStatus === "Paid");

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-950/8">
        <div className="border-b border-emerald-100 px-5 py-5 sm:px-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Downloads</p>
          <h2 className="mt-1 text-3xl font-black text-emerald-950">Reports</h2>
        </div>
        <div className="p-5 sm:p-7">
          {reports.length ? reports.map((report) => (
            <ReportButton key={report._id} report={report} user={user} />
          )) : <EmptyState text="Reports will appear here after pathologist approval." />}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-950/8">
        <div className="border-b border-emerald-100 px-5 py-5 sm:px-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Downloads</p>
          <h2 className="mt-1 text-3xl font-black text-emerald-950">Receipts</h2>
        </div>
        <div className="p-5 sm:p-7">
          {paidBookings.length ? paidBookings.map((booking) => (
            <ReceiptButton key={booking._id} booking={booking} user={user} />
          )) : <EmptyState text="Receipts will appear here after payment is marked paid." />}
        </div>
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

function BookingHistoryTable({ bookings }) {
  if (!bookings.length) {
    return (
      <section className="rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-xl shadow-emerald-950/8">
        <h2 className="text-2xl font-black text-emerald-950">Booking History</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">No booking requests yet.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-950/8">
      <div className="border-b border-emerald-100 px-5 py-5 sm:px-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Patient Portal</p>
        <h2 className="mt-1 text-3xl font-black text-emerald-950">Booking History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-emerald-50 text-xs uppercase tracking-[0.12em] text-emerald-900">
            <tr>
              <th className="px-4 py-4">Booking ID</th>
              <th className="px-4 py-4">Patient ID</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Payment</th>
              <th className="px-4 py-4">Test / Package</th>
              <th className="px-4 py-4">Type</th>
              <th className="px-4 py-4">Patient</th>
              <th className="px-4 py-4">Age</th>
              <th className="px-4 py-4">Gender</th>
              <th className="px-4 py-4">Mobile</th>
              <th className="px-4 py-4">Email</th>
              <th className="px-4 py-4">Sample Collection</th>
              <th className="px-4 py-4">Date</th>
              <th className="px-4 py-4">Time</th>
              <th className="px-4 py-4">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-t border-emerald-50 align-top">
                <td className="px-4 py-4 font-black text-emerald-950">{booking.code}</td>
                <td className="px-4 py-4 font-black text-emerald-800">{booking.patientCode || "Pending"}</td>
                <td className="px-4 py-4"><StatusBadge value={booking.status} /></td>
                <td className="px-4 py-4"><StatusBadge value={booking.paymentStatus} /></td>
                <td className="px-4 py-4 font-bold text-slate-900">{booking.testName}</td>
                <td className="px-4 py-4 text-slate-600">{booking.bookingType}</td>
                <td className="px-4 py-4 text-slate-600">{booking.patientName || "N/A"}</td>
                <td className="px-4 py-4 text-slate-600">{booking.age || "N/A"}</td>
                <td className="px-4 py-4 text-slate-600">{booking.gender || "N/A"}</td>
                <td className="px-4 py-4 text-slate-600">{booking.mobile || "N/A"}</td>
                <td className="px-4 py-4 text-slate-600">{booking.email || "N/A"}</td>
                <td className="px-4 py-4 text-slate-600">{booking.sampleCollection || "N/A"}</td>
                <td className="px-4 py-4 text-slate-600">{booking.date || "N/A"}</td>
                <td className="px-4 py-4 text-slate-600">{booking.timeSlot || "N/A"}</td>
                <td className="px-4 py-4 font-black text-emerald-950">INR {booking.amount || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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

function ApprovedReportsPanel({ reports }) {
  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-950/8 sm:p-7">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Patient Portal</p>
        <h2 className="mt-1 text-3xl font-black text-emerald-950">Approved Reports</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">View your signed report in the browser or download a PDF copy.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.length ? reports.map((report) => <ReportButton key={report._id} report={report} />) : <div className="md:col-span-2 xl:col-span-3"><EmptyState text="Reports appear here after pathologist approval." /></div>}
      </div>
    </section>
  );
}

function ReportsAndReceipts({ bookings, reports }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800"><FileText size={20} /> Approved Reports</h2>
        {reports.length ? reports.map((report) => (
          <ReportButton key={report._id} report={report} />
        )) : <EmptyState text="Reports appear here after pathologist approval." />}
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

function ReportButton({ report, user }) {
  const [reportAction, setReportAction] = useState("");

  const handleView = async () => {
    try {
      setReportAction("view");
      const blob = await downloadReport(report._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      alert(error.reportMessage || error.response?.data?.message || "Report preview failed");
    } finally {
      setReportAction("");
    }
  };
  const handleDownload = async () => {
    try {
      setReportAction("download");
      const blob = await downloadReport(report._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildPatientDownloadName(report.bookingId?.name || user?.name, report.bookingId?.patientCode || user?.patientCode, "RPT");
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.reportMessage || error.response?.data?.message || "Report download failed");
    } finally {
      setReportAction("");
    }
  };

  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <p className="font-bold text-slate-800">{report.testName || "Lab report"}</p>
        <p className="mt-1 text-xs text-slate-500">Approved report</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleView} disabled={Boolean(reportAction)} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
          <Eye size={16} /> {reportAction === "view" ? "Opening..." : "View Report"}
        </button>
        <button type="button" onClick={handleDownload} disabled={Boolean(reportAction)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
          <Download size={16} /> {reportAction === "download" ? "Downloading..." : "Download"}
        </button>
      </div>
    </div>
  );
}

function ReceiptButton({ booking, user }) {
  const [receiptAction, setReceiptAction] = useState("");

  const handleView = async () => {
    try {
      setReceiptAction("view");
      const blob = await downloadReceipt(booking._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      alert(error.response?.data?.message || "Receipt preview failed");
    } finally {
      setReceiptAction("");
    }
  };

  const handleDownload = async () => {
    try {
      setReceiptAction("download");
      const blob = await downloadReceipt(booking._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildPatientDownloadName(booking.name || user?.name, booking.patientCode || user?.patientCode, "RCT");
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.response?.data?.message || "Receipt download failed");
    } finally {
      setReceiptAction("");
    }
  };

  return (
    <div className="mb-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <p className="font-bold text-slate-800">{booking.testName || "Payment receipt"}</p>
        <p className="mt-1 text-xs text-slate-500">{booking.paymentStatus === "Paid" ? "Paid receipt" : "Receipt available after payment"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleView}
          disabled={booking.paymentStatus !== "Paid" || Boolean(receiptAction)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Eye size={16} /> {receiptAction === "view" ? "Opening..." : "View Receipt"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={booking.paymentStatus !== "Paid" || Boolean(receiptAction)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={16} /> {receiptAction === "download" ? "Downloading..." : "Download"}
        </button>
      </div>
    </div>
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
          <p className="text-sm text-slate-500">Sample Collection: {getSampleCollectionLabel(booking.collectionType || "Lab")}</p>
          <p className="text-sm text-slate-500">Amount: INR {booking.amount}</p>
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
  const isWarning = value === "Pending" || value === "Pending Approval" || value === "Unpaid" || value === "Technician Assigned" || value === "Processing" || value === "Sample Collected" || value === "Pending Report Approval";
  const classes = isGood
    ? "bg-green-100 text-green-700"
    : value === "Rejected"
      ? "bg-red-100 text-red-700"
      : isWarning
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-700";

  return <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${classes}`}>{value}</span>;
}

function EmptyState({ text }) {
  return <div className="rounded-md bg-slate-50 p-6 text-center text-sm text-slate-500">{text}</div>;
}

export default PatientDashboard;
