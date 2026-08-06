import React, { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Microscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { roleRoutes } from "../context/authCore";
import { useAuth } from "../context/useAuth";
import logo from "../assets/logo.png";
import bg2 from "../assets/bg2.png";

const authFont = "Aptos, 'Avenir Next', Inter, 'Segoe UI', system-ui, sans-serif";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const user = await login(formData);
      navigate(roleRoutes[user.role] || "/patient_dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f6fbf8] text-slate-900 lg:grid-cols-[1.05fr_0.95fr]" style={{ fontFamily: authFont }}>
      <section className="relative hidden overflow-hidden bg-emerald-950 lg:block">
        <div className="absolute inset-0 bg-cover bg-center opacity-55" style={{ backgroundImage: `url(${bg2})` }} />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,44,34,0.96),rgba(6,95,70,0.78))]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 text-left">
            <img src={logo} alt="INDIPATH logo" className="h-12 w-12 rounded-lg bg-white object-contain" />
            <span>
              <span className="block text-2xl font-extrabold">INDIPATH</span>
              <span className="block text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Super Speciality Lab</span>
            </span>
          </button>

          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]">
              <Microscope size={15} /> Patient Portal
            </div>
            <h1 className="text-5xl font-extrabold leading-tight">Access reports and booking history securely.</h1>
            <p className="mt-5 leading-8 text-emerald-50/85">
              Login to book tests, track payment status, download receipts and view reports after pathologist approval.
            </p>
          </div>

          <p className="text-sm font-semibold text-emerald-100/75">Role based access keeps staff and patient workflows separate.</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-md">
          <button onClick={() => navigate("/")} className="mb-8 flex items-center gap-3 text-left lg:hidden">
            <img src={logo} alt="INDIPATH logo" className="h-12 w-12 rounded-lg object-contain" />
            <span>
              <span className="block text-xl font-extrabold text-emerald-950">INDIPATH</span>
              <span className="block text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Super Speciality Lab</span>
            </span>
          </button>

          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/10 sm:p-8">
            <div className="mb-7">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Welcome back</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-950">Patient Login</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">Use your registered email and password to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-slate-700">Email address</span>
                <span className="flex min-h-[3.35rem] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                  <Mail size={20} className="text-emerald-700" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="patient@example.com"
                    className="w-full bg-transparent text-base font-semibold outline-none"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-slate-700">Password</span>
                <span className="flex min-h-[3.35rem] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                  <LockKeyhole size={20} className="text-emerald-700" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="w-full bg-transparent text-base font-semibold outline-none"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="rounded-lg p-1 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </span>
              </label>

              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => navigate("/forgot-password")} className="font-bold text-emerald-700 hover:text-emerald-900">
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="w-full rounded-xl bg-emerald-700 px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200">
                Login
              </button>
            </form>

            <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-center text-sm font-semibold text-slate-700">
              New patient?{" "}
              <button onClick={() => navigate("/register")} className="font-extrabold text-emerald-800 hover:text-emerald-950">
                Create an account
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
