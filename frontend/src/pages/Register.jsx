import React, { useState } from "react";
import { CalendarDays, CheckCircle2, Eye, EyeOff, Mail, MapPin, Phone, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cancelRegistration, registerUser, verifyOtp } from "../services/authService";
import logo from "../assets/logo.png";
import bg1 from "../assets/bg1.png";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const authFont = "Aptos, 'Avenir Next', Inter, 'Segoe UI', system-ui, sans-serif";
const passwordRules = [
  { label: "At least 8 characters", test: (value) => value.length >= 8 },
  { label: "One uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value) => /[a-z]/.test(value) },
  { label: "One special character", test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value) }
];

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("register");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    city: "",
    address: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPasswordValidationMessage = (password) => {
    const requirements = passwordRules.filter((rule) => !rule.test(password)).map((rule) => rule.label.toLowerCase());

    return requirements.length ? `Password must include ${requirements.join(", ")}` : "";
  };

  const validate = () => {
    const requiredFields = ["name", "email", "phone", "age", "city", "address", "password", "confirmPassword"];
    const missingFields = requiredFields.filter((field) => !String(formData[field]).trim());
    const patientAge = Number(formData.age);

    if (missingFields.length) {
      return `Please fill all required fields: ${missingFields.join(", ")}`;
    }

    if (!emailPattern.test(formData.email)) {
      return "Please enter a valid email";
    }

    if (!Number.isInteger(patientAge) || patientAge < 18 || patientAge > 120) {
      return "Age must be a whole number between 18 and 120";
    }

    const passwordValidationMessage = getPasswordValidationMessage(formData.password);
    if (passwordValidationMessage) {
      return passwordValidationMessage;
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");

    try {
      const data = await registerUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        age: formData.age,
        city: formData.city,
        address: formData.address,
        password: formData.password
      });

      setMessage(data.devOtp ? `${data.message} Dev OTP: ${data.devOtp}` : data.message);
      setStep("otp");
    } catch (error) {
      setMessage("");
      setFormError(error.response?.data?.message || "Registration failed");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      setFormError("Please enter OTP");
      return;
    }

    setFormError("");

    try {
      const data = await verifyOtp({ email: formData.email, otp: otp.trim() });
      alert(data.message);
      navigate("/login");
    } catch (error) {
      setMessage("");
      setFormError(error.response?.data?.message || "OTP verification failed");
    }
  };

  const handleCancelRegistration = async () => {
    if (formData.email) {
      try {
        await cancelRegistration({ email: formData.email });
      } catch (error) {
        console.error(error);
      }
    }

    setOtp("");
    setMessage("");
    setFormError("");
    setStep("register");
  };

  return (
    <main className="grid min-h-screen bg-[#f6fbf8] text-slate-900 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]" style={{ fontFamily: authFont }}>
      <section className="flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
        <div className="w-full max-w-2xl">
          <button onClick={() => navigate("/")} className="mb-6 flex items-center gap-3 text-left sm:mb-8">
            <img src={logo} alt="INDIPATH logo" className="h-12 w-12 rounded-lg object-contain sm:h-14 sm:w-14" />
            <span>
              <span className="block text-2xl font-extrabold text-emerald-950">INDIPATH</span>
              <span className="block text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 sm:tracking-[0.18em]">Super Speciality Lab</span>
            </span>
          </button>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-950/10 sm:p-8">
            <div className="mb-7">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
                {step === "register" ? "Patient registration" : "Email verification"}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-950 sm:text-4xl">
                {step === "register" ? "Create patient account" : "Verify OTP"}
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                {step === "register"
                  ? "Register once, then book tests and access approved reports from the patient portal."
                  : `Enter the OTP sent to ${formData.email}.`}
              </p>
            </div>

            {message && (
              <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-900">
                {message}
              </div>
            )}

            {formError && (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
                {formError}
              </div>
            )}

            {step === "register" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field icon={UserRound} label="Full name">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Patient full name" className="field-input" autoComplete="name" />
                  </Field>

                  <Field icon={Mail} label="Email address">
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="patient@example.com" className="field-input" autoComplete="email" />
                  </Field>

                  <Field icon={Phone} label="Phone number">
                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Mobile number" className="field-input" autoComplete="tel" />
                  </Field>

                  <Field icon={CalendarDays} label="Age">
                    <input name="age" type="number" min="18" max="120" value={formData.age} onChange={handleChange} placeholder="18 or above" className="field-input" />
                  </Field>

                  <Field icon={MapPin} label="City">
                    <input name="city" value={formData.city} onChange={handleChange} placeholder="Enter city" className="field-input" autoComplete="address-level2" />
                  </Field>

                  <Field icon={MapPin} label="Address">
                    <input name="address" value={formData.address} onChange={handleChange} placeholder="Enter full address" className="field-input" autoComplete="street-address" />
                  </Field>
                </div>

                <Field icon={ShieldCheck} label="Password">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a secure password"
                    className="field-input"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="rounded-lg p-1 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </Field>

                <PasswordRules password={formData.password} />

                <Field icon={ShieldCheck} label="Confirm password">
                  <input name="confirmPassword" type={showPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" className="field-input" autoComplete="new-password" />
                </Field>

                <button type="submit" className="w-full rounded-xl bg-emerald-700 px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200">
                  Register and Send OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Field icon={ShieldCheck} label="One-time password">
                  <input name="otp" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6 digit OTP" className="field-input" inputMode="numeric" />
                </Field>
                <button type="submit" className="w-full rounded-xl bg-emerald-700 px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200">
                  Verify Account
                </button>
                <button type="button" onClick={handleCancelRegistration} className="w-full rounded-xl border border-emerald-200 px-5 py-3.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50">
                  Edit registration details
                </button>
              </form>
            )}

            <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-center text-sm font-semibold text-slate-700">
              Already registered?{" "}
              <button onClick={() => navigate("/login")} className="font-extrabold text-emerald-800 hover:text-emerald-950">
                Login
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative hidden overflow-hidden bg-emerald-950 lg:block">
        <div className="absolute inset-0 bg-cover bg-center opacity-55" style={{ backgroundImage: `url(${bg1})` }} />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,44,34,0.95),rgba(6,95,70,0.76))]" />
        <div className="relative flex h-full flex-col justify-center p-10 text-white xl:p-12">
          <div className="ml-auto max-w-xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-100">Patient benefits</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight xl:text-5xl">A clean account for bookings, receipts and approved reports.</h1>
            <p className="mt-5 text-lg leading-8 text-emerald-50/85">
              Keep patient access separate from staff operations while maintaining a simple registration process.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-slate-700">{label}</span>
      <span className="flex min-h-[3.35rem] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
        {React.createElement(Icon, { size: 20, className: "shrink-0 text-emerald-700" })}
        {children}
      </span>
    </label>
  );
}

function PasswordRules({ password }) {
  return (
    <div className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 sm:grid-cols-2">
      {passwordRules.map((rule) => {
        const isValid = rule.test(password);
        const Icon = isValid ? CheckCircle2 : XCircle;

        return (
          <span key={rule.label} className={isValid ? "flex items-center gap-2 text-emerald-700" : "flex items-center gap-2 text-slate-500"}>
            <Icon size={17} />
            {rule.label}
          </span>
        );
      })}
    </div>
  );
}

export default RegisterPage;
