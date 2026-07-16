import React, { useState } from "react";
import { Eye, EyeOff, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cancelRegistration, registerUser, verifyOtp } from "../services/authService";
import logo from "../assets/logo.png";
import bg1 from "../assets/bg1.png";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("register");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordHint, setPasswordHint] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPasswordValidationMessage = (password) => {
    const requirements = [];

    if (password.length < 8) {
      requirements.push("at least 8 characters");
    }

    if (!/[A-Z]/.test(password)) {
      requirements.push("at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      requirements.push("at least one lowercase letter");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      requirements.push("at least one special character");
    }

    return requirements.length ? `Password must include ${requirements.join(", ")}` : "";
  };

  const validate = () => {
    const requiredFields = ["name", "email", "phone", "city", "address", "password", "confirmPassword"];
    const missingFields = requiredFields.filter((field) => !String(formData[field]).trim());

    if (missingFields.length) {
      return `Please fill all required fields: ${missingFields.join(", ")}`;
    }

    if (!emailPattern.test(formData.email)) {
      return "Please enter a valid email";
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
      setPasswordHint(validationError);
      alert(validationError);
      return;
    }

    setPasswordHint("");

    try {
      const data = await registerUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        password: formData.password
      });

      setMessage(data.devOtp ? `${data.message} Local testing OTP: ${data.devOtp}` : data.message);
      setStep("otp");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      alert("Please enter OTP");
      return;
    }

    try {
      const data = await verifyOtp({ email: formData.email, otp });
      alert(data.message);
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "OTP verification failed");
    }
  };

  const handleCancelRegistration = async () => {
    if (!formData.email) {
      setStep("register");
      return;
    }

    try {
      await cancelRegistration({ email: formData.email });
    } catch (error) {
      console.error(error);
    } finally {
      setStep("register");
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f4fbf7] text-slate-900 lg:grid-cols-[0.95fr_1.05fr]" style={{ fontFamily: "Segoe UI, Inter, system-ui, sans-serif" }}>
      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-lg">
          <button onClick={() => navigate("/")} className="mb-8 flex items-center gap-3 text-left">
            <img src={logo} alt="INDIPATH logo" className="h-12 w-12 rounded-lg object-contain" />
            <span>
              <span className="block text-xl font-extrabold text-emerald-950">INDIPATH</span>
              <span className="block text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Super Speciality Lab</span>
            </span>
          </button>

          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/8 sm:p-8">
            <div className="mb-7">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                {step === "register" ? "Patient registration" : "Email verification"}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-950">
                {step === "register" ? "Create patient account" : "Verify OTP"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
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

            {step === "register" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field icon={UserRound} label="Full name">
                  <input name="name" value={formData.name} onChange={handleChange} placeholder="Patient full name" className="field-input" />
                </Field>

                <Field icon={Mail} label="Email address">
                  <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="patient@example.com" className="field-input" />
                </Field>

                <Field icon={Phone} label="Phone number">
                  <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Mobile number" className="field-input" />
                </Field>

                <Field icon={MapPin} label="City">
                  <input name="city" value={formData.city} onChange={handleChange} placeholder="Enter city" className="field-input" />
                </Field>

                <Field icon={MapPin} label="Address">
                  <input name="address" value={formData.address} onChange={handleChange} placeholder="Enter full address" className="field-input" />
                </Field>

                <Field icon={ShieldCheck} label="Password">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    className="field-input"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-emerald-700" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </Field>

                {passwordHint && <p className="text-sm font-semibold text-amber-700">{passwordHint}</p>}

                <Field icon={ShieldCheck} label="Confirm password">
                  <input name="confirmPassword" type={showPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" className="field-input" />
                </Field>

                <button type="submit" className="w-full rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/10 hover:bg-emerald-800">
                  Register and Send OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Field icon={ShieldCheck} label="One-time password">
                  <input name="otp" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6 digit OTP" className="field-input" />
                </Field>
                <button type="submit" className="w-full rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/10 hover:bg-emerald-800">
                  Verify Account
                </button>
                <button type="button" onClick={handleCancelRegistration} className="w-full rounded-xl border border-emerald-200 px-5 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50">
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
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="ml-auto max-w-xl rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-100">Patient benefits</p>
            <h1 className="mt-4 text-5xl font-extrabold leading-tight">A clean account for bookings, receipts and approved reports.</h1>
            <p className="mt-5 leading-8 text-emerald-50/85">
              Keep patient access separate from staff operations while maintaining a simple registration process.
            </p>
          </div>
          <p className="text-sm font-semibold text-emerald-100/75">Registration uses OTP verification. Real SMTP setup remains intentionally pending.</p>
        </div>
      </section>
    </main>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white">
        {React.createElement(Icon, { size: 18, className: "shrink-0 text-emerald-700" })}
        {children}
      </span>
    </label>
  );
}

export default RegisterPage;
