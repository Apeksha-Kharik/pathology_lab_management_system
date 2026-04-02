import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    LayoutDashboard, TestTube2, UserPlus, LogOut, Trash2, X, 
    Shield, Activity, FlaskConical, Users, IndianRupee, Plus 
} from 'lucide-react';

const AdminDashboard = () => {
    const [view, setView] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [tests, setTests] = useState([]);

    const [testForm, setTestForm] = useState({ testName: '', price: '', category: '', conditions: '', description: '' });
    const [userForm, setUserForm] = useState({
        name: '', email: '', password: '', mobile: '', address: '', 
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

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/register', userForm);
            alert(response.data.message);
            setUserForm({ name: '', email: '', password: '', mobile: '', address: '', dateOfJoining: new Date().toISOString().split('T'), role: 'Technician' });
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
            setView('availableTests');
            fetchData();
        } catch (err) {
            alert("Failed to add test.");
        }
    };

    const deleteUser = async (id) => {
        if (window.confirm("Delete this staff member?")) {
            try {
                await axios.delete(`http://localhost:5000/api/admin/user/${id}`);
                setUsers(prev => prev.filter(user => user._id !== id));
            } catch (err) {
                console.error("User delete error:", err);
                alert("Error deleting user.");
            }
        }
    };

    const deleteTest = async (id) => {
    if (!id) {
        alert("Error: Test ID is missing.");
        return;
    }

    if (window.confirm("Permanently remove this lab test?")) {
        try {
            // Log the URL to your console to verify it looks like: 
            // http://localhost:5000/api/admin/test/64f1a...
            console.log("Deleting URL:", `http://localhost:5000/api/admin/test/${id}`);

            // 1. Update UI first (Optimistic)
            setTests(prev => prev.filter(test => (test._id || test.id) !== id));

            // 2. Send request
            await axios.delete(`http://localhost:5000/api/admin/test/${id}`);
            alert("Deleted successfully!");
        } catch (err) {
            console.error("Server Error Detail:", err.response?.data || err.message);
            alert(`Failed to delete from server: ${err.response?.status || 'Unknown error'}`);
            fetchData(); // Refresh to bring back the item if delete failed
        }
    }
};

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Sidebar */}
            <div className="w-72 bg-[#1e3a5f] text-white flex flex-col shadow-xl sticky top-0 h-screen">
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
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 overflow-y-auto">
                
                {view === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <header>
                            <h1 className="text-3xl font-bold text-[#1e3a5f]">Dashboard Overview</h1>
                            <p className="text-slate-500">Live system statistics</p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatsCard title="Total Users" value={users.length} icon={<Users />} color="bg-blue-600" />
                            <StatsCard title="Active Tests" value={tests.length} icon={<TestTube2 />} color="bg-[#2c5282]" />
                            <StatsCard title="Staff Count" value={users.filter(u => u.role !== 'Patient').length} icon={<Shield />} color="bg-blue-400" />
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center text-[#1e3a5f]">
                                <h3 className="font-bold">System Users</h3>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                                    <tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4 text-center">Action</th></tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-medium text-sm">{u.name}</td>
                                            <td className="p-4"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700">{u.role}</span></td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => deleteUser(u._id)} className="text-red-400 hover:text-red-600 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {view === 'availableTests' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-bold text-[#1e3a5f]">Test Catalog</h1>
                                <p className="text-slate-500">Manage all diagnostic offerings</p>
                            </div>
                            <button onClick={() => setView('addTest')} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
                                <Plus size={18} /> Add New Test
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tests.map((test) => (
                                <div key={test._id || test.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <FlaskConical size={24} />
                                        </div>
                                        <button 
                                            onClick={() => deleteTest(test._id || test.id)} 
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">{test.testName}</h3>
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{test.category}</span>
                                    <div className="flex items-center gap-1 text-2xl font-black text-[#1e3a5f] my-4">
                                        <IndianRupee size={20} /> {test.price}
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 italic">"{test.conditions || 'No special conditions'}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add Test View */}
                {view === 'addTest' && (
                    <div className="max-w-2xl mx-auto space-y-8">
                        <h1 className="text-3xl font-bold text-[#1e3a5f] text-center">Create Lab Test</h1>
                        <form onSubmit={handleAddTest} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <FormInput label="Test Name" value={testForm.testName} onChange={(e) => setTestForm({...testForm, testName: e.target.value})} required />
                                <FormInput label="Price (INR)" type="number" value={testForm.price} onChange={(e) => setTestForm({...testForm, price: e.target.value})} required />
                            </div>
                            <FormInput label="Category" value={testForm.category} onChange={(e) => setTestForm({...testForm, category: e.target.value})} required />
                            <FormInput label="Conditions" value={testForm.conditions} onChange={(e) => setTestForm({...testForm, conditions: e.target.value})} />
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
                                <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32" 
                                    value={testForm.description} onChange={(e) => setTestForm({...testForm, description: e.target.value})} required />
                            </div>
                            <button type="submit" className="w-full bg-[#1e3a5f] text-white py-4 rounded-xl font-bold hover:bg-blue-900 transition-all">Publish Test</button>
                        </form>
                    </div>
                )}

                {/* Add User View */}
                {view === 'addUser' && (
                    <div className="max-w-2xl mx-auto space-y-8">
                        <h1 className="text-3xl font-bold text-[#1e3a5f] text-center">Staff Registration</h1>
                        <form onSubmit={handleAddUser} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <FormInput label="Full Name" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} required />
                                <FormInput label="Email" type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} required />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <FormInput label="Password" type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} required />
                                <FormInput label="Mobile" value={userForm.mobile} onChange={(e) => setUserForm({...userForm, mobile: e.target.value})} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Role</label>
                                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                    value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})}>
                                    <option value="Technician">Technician</option>
                                    <option value="Pathologist">Pathologist</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <FormInput label="Address" value={userForm.address} onChange={(e) => setUserForm({...userForm, address: e.target.value})} required />
                            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all">Register Staff</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

const SidebarBtn = ({ active, onClick, icon, text }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${active ? 'bg-blue-500/20 text-white font-bold' : 'text-blue-200 hover:text-white hover:bg-white/5'}`}>
        {icon} <span className="text-sm tracking-wide">{text}</span>
    </button>
);

const StatsCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-5 shadow-sm">
        <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>{icon}</div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <p className="text-3xl font-black text-[#1e3a5f]">{value}</p>
        </div>
    </div>
);

const FormInput = ({ label, ...props }) => (
    <div className="space-y-2 flex-1">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>
        <input {...props} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
    </div>
);

export default AdminDashboard;