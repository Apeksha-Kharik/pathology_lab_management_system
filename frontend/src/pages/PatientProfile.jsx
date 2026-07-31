import React, { useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, KeyRound, Mail, MapPin, Phone, Save, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import bg2 from "../assets/bg2.png";
import { changePassword, getProfile, updateProfile } from "../services/profileService";
import { useAuth } from "../context/useAuth";

const profileFont = "Aptos, 'Avenir Next', Inter, 'Segoe UI', system-ui, sans-serif";

const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  age: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  referredBy: "",
  role: ""
};

const passwordRules = [
  { label: "Minimum 8 characters", test: (value) => value.length >= 8 },
  { label: "Uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "Lowercase letter", test: (value) => /[a-z]/.test(value) },
  { label: "Number", test: (value) => /[0-9]/.test(value) },
  { label: "Special character", test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value) }
];

function PatientProfile() {
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();
  const [profile, setProfile] = useState({ ...emptyProfile, ...user });
  const [draft, setDraft] = useState({ ...emptyProfile, ...user });
  const [mode, setMode] = useState("view");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await getProfile();
        const normalized = normalizeProfile(data);
        setProfile(normalized);
        setDraft(normalized);
      } catch (error) {
        setMessage({ type: "error", text: error.response?.data?.message || "Unable to load profile" });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const initials = useMemo(() => {
    return String(profile.name || "Patient")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile.name]);

  const passwordStatus = passwordRules.map((rule) => ({ ...rule, valid: rule.test(passwords.newPassword) }));

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const validateProfile = () => {
    if (!draft.name.trim() || !draft.phone.trim()) {
      return "Full name and mobile number are required.";
    }

    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      return "Please enter a valid email address.";
    }

    if (draft.age && (!Number.isInteger(Number(draft.age)) || Number(draft.age) < 18 || Number(draft.age) > 120)) {
      return "Age must be a whole number between 18 and 120.";
    }

    if (draft.pincode && !/^\d{6}$/.test(String(draft.pincode))) {
      return "PIN Code must be 6 digits.";
    }

    return "";
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const validationError = validateProfile();

    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    try {
      const payload = { ...draft, pincode: draft.pincode };
      const data = await updateProfile(payload);
      const normalized = normalizeProfile(data.user || payload);
      setProfile(normalized);
      setDraft(normalized);
      updateUser?.(normalized);
      setMode("view");
      setMessage({ type: "success", text: data.message || "Profile updated successfully" });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Profile update failed" });
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setMessage({ type: "error", text: "Please fill all password fields." });
      return;
    }

    if (passwordStatus.some((rule) => !rule.valid)) {
      setMessage({ type: "error", text: "Please meet all password requirements." });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: "error", text: "New password and confirm password do not match." });
      return;
    }

    try {
      const data = await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMode("view");
      setMessage({ type: "success", text: data.message || "Password changed successfully" });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Password change failed" });
    }
  };

  return (
    <main className="min-h-screen bg-[#f6fbf8] text-slate-900" style={{ fontFamily: profileFont }}>
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => navigate("/patient_dashboard")} className="flex items-center gap-3 text-left">
            <img src={logo} alt="INDIPATH logo" className="h-11 w-11 rounded-xl object-contain" />
            <span>
              <span className="block text-xl font-black text-emerald-950">INDIPATH</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Patient Profile</span>
            </span>
          </button>
          <button onClick={() => navigate("/patient_dashboard")} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50">
            <ArrowLeft size={17} /> Dashboard
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden bg-emerald-950 px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${bg2})` }} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,44,34,0.97),rgba(6,95,70,0.78))]" />
        <div className="relative mx-auto grid max-w-7xl gap-6 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-white/20 bg-white/15 text-4xl font-black shadow-2xl shadow-emerald-950/30">
            {initials}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-100">Patient account</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{profile.name || "Patient"}</h1>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-emerald-50/90">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2"><Mail size={16} /> {profile.email || "Email not added"}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2"><Phone size={16} /> {profile.phone || "Mobile not added"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {message.text && (
          <Motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-bold ${message.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-red-100 bg-red-50 text-red-800"}`}>
            {message.text}
          </Motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <Motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-950/8 sm:p-7">
            {loading ? (
              <p className="py-12 text-center text-sm font-bold text-slate-500">Loading profile...</p>
            ) : mode === "edit" ? (
              <ProfileEditForm draft={draft} onCancel={() => { setDraft(profile); setMode("view"); }} onChange={updateDraft} onSubmit={saveProfile} />
            ) : mode === "password" ? (
              <PasswordForm onCancel={() => setMode("view")} onChange={setPasswords} onSubmit={savePassword} passwordStatus={passwordStatus} passwords={passwords} />
            ) : (
              <ProfileDetails profile={profile} />
            )}
          </Motion.div>

          <aside className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-950/8 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Actions</p>
            <h2 className="mt-2 text-2xl font-black text-emerald-950">Account controls</h2>
            <div className="mt-6 grid gap-3">
              <button onClick={() => { setMode("edit"); setMessage({ type: "", text: "" }); }} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800">
                <UserRound size={18} /> Update Profile
              </button>
              <button onClick={() => { setMode("password"); setMessage({ type: "", text: "" }); }} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-800 transition hover:bg-emerald-100">
                <KeyRound size={18} /> Change Password
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function ProfileDetails({ profile }) {
  const details = [
    ["Full Name", profile.name],
    ["Email", profile.email],
    ["Mobile", profile.phone],
    ["Gender", profile.gender],
    ["Date of Birth", formatDate(profile.dateOfBirth)],
    ["Age", profile.age],
    ["Address", profile.address],
    ["City", profile.city],
    ["State", profile.state],
    ["PIN Code", profile.pincode],
    ["Emergency Contact", [profile.emergencyContactName, profile.emergencyContactPhone].filter(Boolean).join(" - ")],
    ["Referred By", profile.referredBy],
    ["Role", profile.role]
  ];

  return (
    <div>
      <div className="mb-7 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><ShieldCheck size={24} /></span>
        <div>
          <h2 className="text-3xl font-black text-emerald-950">Profile Details</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Read-only account information.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {details.map(([label, value]) => (
          <ReadOnlyField key={label} label={label} value={value || "Not added"} />
        ))}
      </div>
    </div>
  );
}

function ProfileEditForm({ draft, onCancel, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <h2 className="text-3xl font-black text-emerald-950">Update Profile</h2>
      <p className="mt-2 text-sm font-semibold text-slate-500">Keep your patient details accurate for bookings and reports.</p>
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <ProfileInput label="Full Name" value={draft.name} onChange={(value) => onChange("name", value)} />
        <ProfileInput label="Email" type="email" value={draft.email} onChange={(value) => onChange("email", value)} readOnly />
        <ProfileInput label="Mobile" value={draft.phone} onChange={(value) => onChange("phone", value)} />
        <ProfileSelect label="Gender" value={draft.gender} onChange={(value) => onChange("gender", value)} options={["", "Male", "Female", "Other", "Prefer not to say"]} />
        <ProfileInput label="Date of Birth" type="date" value={toInputDate(draft.dateOfBirth)} onChange={(value) => onChange("dateOfBirth", value)} />
        <ProfileInput label="Age" type="number" value={draft.age} onChange={(value) => onChange("age", value)} />
        <ProfileInput label="Address" value={draft.address} onChange={(value) => onChange("address", value)} className="md:col-span-2" />
        <ProfileInput label="City" value={draft.city} onChange={(value) => onChange("city", value)} />
        <ProfileInput label="State" value={draft.state} onChange={(value) => onChange("state", value)} />
        <ProfileInput label="PIN Code" value={draft.pincode} onChange={(value) => onChange("pincode", value)} />
        <ProfileInput label="Emergency Contact Name" value={draft.emergencyContactName} onChange={(value) => onChange("emergencyContactName", value)} />
        <ProfileInput label="Emergency Contact Phone" value={draft.emergencyContactPhone} onChange={(value) => onChange("emergencyContactPhone", value)} />
        <ProfileInput label="Referred By" value={draft.referredBy} onChange={(value) => onChange("referredBy", value)} />
      </div>
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">Cancel</button>
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800">
          <Save size={18} /> Save Profile
        </button>
      </div>
    </form>
  );
}

function PasswordForm({ onCancel, onChange, onSubmit, passwordStatus, passwords }) {
  const update = (field, value) => onChange((current) => ({ ...current, [field]: value }));

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <h2 className="text-3xl font-black text-emerald-950">Change Password</h2>
      <p className="mt-2 text-sm font-semibold text-slate-500">Use a strong password to keep your reports and bookings secure.</p>
      <div className="mt-7 grid gap-4">
        <ProfileInput label="Current Password" type="password" value={passwords.currentPassword} onChange={(value) => update("currentPassword", value)} />
        <ProfileInput label="New Password" type="password" value={passwords.newPassword} onChange={(value) => update("newPassword", value)} />
        <div className="grid gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:grid-cols-2">
          {passwordStatus.map((rule) => {
            const Icon = rule.valid ? CheckCircle2 : XCircle;
            return (
              <span key={rule.label} className={`inline-flex items-center gap-2 text-sm font-bold ${rule.valid ? "text-emerald-700" : "text-slate-500"}`}>
                <Icon size={17} /> {rule.label}
              </span>
            );
          })}
        </div>
        <ProfileInput label="Confirm Password" type="password" value={passwords.confirmPassword} onChange={(value) => update("confirmPassword", value)} />
      </div>
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">Cancel</button>
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800">
          <KeyRound size={18} /> Change Password
        </button>
      </div>
    </form>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-[#fbfefc] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}

function ProfileInput({ className = "", label, onChange, readOnly = false, type = "text", value }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        className={`w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${readOnly ? "bg-slate-100 text-slate-500" : "bg-slate-50 focus:bg-white"}`}
      />
    </label>
  );
}

function ProfileSelect({ label, onChange, options, value }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      <select value={value || ""} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
        {options.map((option) => (
          <option key={option || "empty"} value={option}>{option || `Select ${label}`}</option>
        ))}
      </select>
    </label>
  );
}

function normalizeProfile(data = {}) {
  return {
    ...emptyProfile,
    ...data,
    id: data.id || data._id || "",
    phone: data.phone || data.mobile || "",
    pincode: data.pincode || data.pinCode || "",
    dateOfBirth: data.dateOfBirth || ""
  };
}

function toInputDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default PatientProfile;
