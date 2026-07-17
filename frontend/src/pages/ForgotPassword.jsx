import React, { useState } from "react";
import { Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword, verifyResetOtp } from "../services/authService";
import logo from "../assets/logo.png";
import bg2 from "../assets/bg2.png";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const authFont = "Aptos, 'Avenir Next', Inter, 'Segoe UI', system-ui, sans-serif";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: ""
  });

  const updateForm = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const sendOtp = async (e) => {
    e.preventDefault();

    if (!emailPattern.test(form.email)) {
      setFormError("Please enter a valid email");
      return;
    }

    setFormError("");

    try {
      const data = await forgotPassword({ email: form.email });
      setMessage(data.devOtp ? `${data.message} Dev OTP: ${data.devOtp}` : data.message);
      setStep("otp");
    } catch (error) {
      setMessage("");
      setFormError(error.response?.data?.message || "Unable to send OTP");
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();

    if (!form.otp.trim()) {
      setFormError("Please enter OTP");
      return;
    }

    setFormError("");

    try {
      const data = await verifyResetOtp({ email: form.email, otp: form.otp.trim() });
      setMessage(data.message);
      setStep("reset");
    } catch (error) {
      setMessage("");
      setFormError(error.response?.data?.message || "OTP verification failed");
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();

    if (form.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    setFormError("");

    try {
      const data = await resetPassword({ email: form.email, password: form.password });
      alert(data.message);
      navigate("/login");
    } catch (error) {
      setMessage("");
      setFormError(error.response?.data?.message || "Password reset failed");
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f6fbf8] text-slate-900 lg:grid-cols-[1.05fr_0.95fr]" style={{ fontFamily: authFont }}>
      <section className="relative hidden overflow-hidden bg-emerald-950 lg:block">
        <div className="absolute inset-0 bg-cover bg-center opacity-55" style={{ backgroundImage: `url(${bg2})` }} />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,44,34,0.96),rgba(6,95,70,0.78))]" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white xl:p-12">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 text-left">
            <img src={logo} alt="INDIPATH logo" className="h-12 w-12 rounded-lg bg-white object-contain" />
            <span>
              <span className="block text-2xl font-extrabold">INDIPATH</span>
              <span className="block text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Super Speciality Lab</span>
            </span>
          </button>

          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]">
              <KeyRound size={15} /> Account Recovery
            </div>
            <h1 className="text-4xl font-extrabold leading-tight xl:text-5xl">Reset access to your patient portal securely.</h1>
            <p className="mt-5 text-lg leading-8 text-emerald-50/85">
              Verify your registered email with OTP before creating a new password.
            </p>
          </div>

          <span />
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        <div className="w-full max-w-md">
          <button onClick={() => navigate("/")} className="mb-8 flex items-center gap-3 text-left lg:hidden">
            <img src={logo} alt="INDIPATH logo" className="h-12 w-12 rounded-lg object-contain" />
            <span>
              <span className="block text-2xl font-extrabold text-emerald-950">INDIPATH</span>
              <span className="block text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Super Speciality Lab</span>
            </span>
          </button>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-950/10 sm:p-8">
            <div className="mb-7">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Password help</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-950">Forgot Password</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                {step === "email" && "Enter your registered email to receive an OTP."}
                {step === "otp" && "Verify the OTP sent to your registered email."}
                {step === "reset" && "Create your new password to continue."}
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

            {step === "email" && (
              <form onSubmit={sendOtp} className="space-y-4">
                <Field icon={Mail} label="Email address">
                  <input name="email" type="email" placeholder="patient@example.com" value={form.email} onChange={updateForm} className="field-input" autoComplete="email" />
                </Field>
                <button type="submit" className="w-full rounded-xl bg-emerald-700 px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200">
                  Send OTP
                </button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={verifyOtp} className="space-y-4">
                <Field icon={ShieldCheck} label="One-time password">
                  <input name="otp" placeholder="Enter OTP" value={form.otp} onChange={updateForm} className="field-input" inputMode="numeric" />
                </Field>
                <button type="submit" className="w-full rounded-xl bg-emerald-700 px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200">
                  Verify OTP
                </button>
              </form>
            )}

            {step === "reset" && (
              <form onSubmit={savePassword} className="space-y-4">
                <Field icon={LockKeyhole} label="New password">
                  <input name="password" type={showPassword ? "text" : "password"} placeholder="New password" value={form.password} onChange={updateForm} className="field-input" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="rounded-lg p-1 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </Field>
                <Field icon={LockKeyhole} label="Confirm new password">
                  <input name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Confirm new password" value={form.confirmPassword} onChange={updateForm} className="field-input" autoComplete="new-password" />
                </Field>
                <button type="submit" className="w-full rounded-xl bg-emerald-700 px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200">
                  Reset Password
                </button>
              </form>
            )}

            <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-center text-sm font-semibold text-slate-700">
              Remembered it?{" "}
              <button onClick={() => navigate("/login")} className="font-extrabold text-emerald-800 hover:text-emerald-950">
                Back to Login
              </button>
            </div>
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

export default ForgotPassword;
