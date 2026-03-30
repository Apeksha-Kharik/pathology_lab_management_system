import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    LayoutDashboard, TestTube2, UserPlus, Users, LogOut, 
    Trash2, X, Shield, Activity, FlaskConical
} from 'lucide-react';

const AdminDashboard = () => {
    const [view, setView] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [tests, setTests] = useState([]);

    const [testForm, setTestForm] = useState({
        testName: '', price: '', category: '', conditions: '', description: ''
    });

    const [userForm, setUserForm] = useState({
        name: '', 
        email: '', 
        password: '', 
        mobile: '', 
        address: '', 
        // FIX: Changed to a single string value instead of an array
        dateOfJoining: new Date().toISOString().split('T'), 
        role: 'Technician'
    });

    const fetchData = async () => {
        try {
            const userRes = await axios.get('http://localhost:5000/api/admin/users');
            setUsers(userRes.data || []);
            const testRes = await axios.get('http://localhost:5000/api/admin/tests');
            setTests(testRes.data || []); 
        } catch (err) {
            console.error("Error loading dashboard data:", err);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/register', userForm);
            alert(response.data.message);
            // Reset form to default
            setUserForm({
                name: '', email: '', password: '', mobile: '', address: '', 
                dateOfJoining: new Date().toISOString().split('T'), role: 'Technician'
            });
            setView('dashboard');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed.");
        }
    };

    const handleAddTest = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/admin/add-test', testForm);
            alert("Test added successfully! 🧪");
            setTestForm({ testName: '', price: '', category: '', conditions: '', description: '' });
            setView('dashboard');
            fetchData();
        } catch (err) {
            alert("Failed to add test.");
        }
    };


    const deleteUser = async (id) => {
        if (window.confirm("Delete this staff member?")) {
            await axios.delete(`http://localhost:5000/api/admin/user/${id}`);
            fetchData();
        }
    };

    const deleteTest = async (id) => {
        if (window.confirm("Permanently remove this lab test?")) {
            await axios.delete(`http://localhost:5000/api/admin/test/${id}`);
            fetchData();
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* SIDEBAR */}
            <div className="w-72 bg-[#1e3a5f] text-white flex flex-col shadow-xl">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">INDIPATH</h2>
                            <p className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Admin Systems</p>
                        </div>
                    </div>
                    
                    <nav className="flex flex-col gap-2">
                        <SidebarBtn active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard className="w-5 h-5" />} text="Dashboard" />
                        <SidebarBtn active={view === 'availableTests'} onClick={() => setView('availableTests')} icon={<FlaskConical className="w-5 h-5" />} text="Available Tests" />
                        <SidebarBtn active={view === 'addTest'} onClick={() => setView('addTest')} icon={<TestTube2 className="w-5 h-5" />} text="Add New Test" />
                        <SidebarBtn active={view === 'addUser'} onClick={() => setView('addUser')} icon={<UserPlus className="w-5 h-5" />} text="Add Staff User" />
                    </nav>
                </div>
                <div className="mt-auto p-6">
                    <button className="w-full flex items-center gap-3 p-3 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 p-8 overflow-y-auto">
                
                {/* 1. DASHBOARD VIEW */}
                {view === 'dashboard' && (
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold text-[#1e3a5f]">Dashboard Overview</h1>
                            <p className="text-slate-500">System Statistics and Staff Directory</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatsCard title="Total Users" value={users.length} icon={<Users />} color="bg-blue-600" />
                            <StatsCard title="Lab Tests" value={tests.length} icon={<TestTube2 />} color="bg-[#2c5282]" />
                            <StatsCard title="Staff Members" value={users.filter(u => u.role !== 'Patient').length} icon={<Shield />} color="bg-blue-400" />
                        </div>

                        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-[#1e3a5f]">User Directory</h3>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                    <tr>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Contact</th>
                                        <th className="p-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* FIX: Removed the .filter() so Patients are now visible */}
                                    {users.map((u) => (
                                        <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-medium">{u.name}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                    u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 
                                                    u.role === 'Patient' ? 'bg-green-100 text-green-700' : 
                                                    'bg-blue-50 text-blue-700'
                                                }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-500 text-sm">{u.mobile}</td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => deleteUser(u._id)} className="text-red-400 hover:text-red-600 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    </div>
                )}

                {/* 2. AVAILABLE TESTS VIEW (Cards) */}
                {view === 'availableTests' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-[#1e3a5f]">Available Lab Tests</h2>
                            <button onClick={() => setView('dashboard')} className="text-sm font-bold text-blue-600 hover:underline">Back to Dashboard</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tests.length > 0 ? (
                                tests.map((test) => (
                                    <div key={test._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                                <FlaskConical className="w-5 h-5" />
                                            </div>
                                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded uppercase">
                                                {test.category}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-800 mb-1">{test.testName}</h3>
                                        <p className="text-slate-500 text-xs mb-4 line-clamp-2">{test.description || 'Routine diagnostic laboratory testing.'}</p>
                                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                                            <span className="text-[#1e3a5f] font-black text-xl">₹{test.price}</span>
                                            <button onClick={() => deleteTest(test._id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 font-medium">No tests found in the database.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. FORMS (Add Test / Add User) */}
                {(view === 'addTest' || view === 'addUser') && (
                    <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mt-10">
                        <div className="flex justify-between mb-8">
                            <h2 className="text-2xl font-bold text-[#1e3a5f]">
                                {view === 'addTest' ? 'Register New Lab Test' : 'Authorize Staff Member'}
                            </h2>
                            <X className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setView('dashboard')} />
                        </div>
                        
                        {view === 'addTest' ? (
                            <form onSubmit={handleAddTest} className="space-y-4">
                                <FormInput label="Test Name" placeholder="e.g. Full Body Checkup" value={testForm.testName} onChange={(e) => setTestForm({...testForm, testName: e.target.value})} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput label="Price (₹)" type="number" placeholder="500" value={testForm.price} onChange={(e) => setTestForm({...testForm, price: e.target.value})} />
                                    <FormInput label="Category" placeholder="e.g. Blood" value={testForm.category} onChange={(e) => setTestForm({...testForm, category: e.target.value})} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Description/Instructions</label>
                                    <textarea className="w-full p-3 border-2 border-slate-100 rounded-xl h-24 focus:border-blue-500 outline-none" placeholder="Enter test requirements..." value={testForm.conditions} onChange={(e) => setTestForm({...testForm, conditions: e.target.value})} />
                                </div>
                                <button className="w-full bg-[#1e3a5f] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-[#152a45] transition-all mt-4">Save to Atlas Cloud</button>
                            </form>
                        ) : (
                            <form onSubmit={handleAddUser} className="space-y-4">
                                <FormInput label="Full Name" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} />
                                <FormInput label="Email Address" type="email" placeholder="staff@gmail.com" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} />
                                <FormInput label="Mobile" value={userForm.mobile} onChange={(e) => setUserForm({...userForm, mobile: e.target.value})} />
                                <FormInput label="Password" type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} />
                                
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Residential Address</label>
                                    <textarea className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none" rows="2" value={userForm.address} onChange={(e) => setUserForm({...userForm, address: e.target.value})} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput label="Date of Joining" type="date" value={userForm.dateOfJoining} onChange={(e) => setUserForm({...userForm, dateOfJoining: e.target.value})} />
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                                        <select className="w-full p-3 border-2 border-slate-100 rounded-xl bg-white" value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})}>
                                            <option value="Technician">Technician</option>
                                            <option value="Pathologist">Pathologist</option>
                                            <option value="Admin">Admin</option>
                                            <option value="Receptionist">Receptionist</option>
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-[#1e3a5f] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-[#152a45] transition-all mt-4">Create Account</button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/* UI COMPONENTS */
const SidebarBtn = ({ active, onClick, icon, text }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${active ? 'bg-blue-500/20 text-white font-bold border border-blue-400/30 shadow-sm' : 'text-blue-200 hover:bg-white/5 hover:text-white'}`}>
        {icon} <span className="text-sm">{text}</span>
    </button>
);

const FormInput = ({ label, ...props }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
        <input {...props} className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none transition-colors" />
    </div>
);

const StatsCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-blue-200 transition-colors">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white shadow-inner`}>{icon}</div>
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-black text-[#1e3a5f]">{value}</p>
        </div>
    </div>
);

export default AdminDashboard;