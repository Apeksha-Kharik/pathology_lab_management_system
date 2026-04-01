import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, TestTube2, UserPlus, LogOut, Trash2, X, Shield, Activity, FlaskConical, Users } from 'lucide-react';

const AdminDashboard = () => {
    const [view, setView] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [tests, setTests] = useState([]);

    const [testForm, setTestForm] = useState({ testName: '', price: '', category: '', conditions: '', description: '' });
    const [userForm, setUserForm] = useState({
        name: '', email: '', password: '', mobile: '', address: '', 
        dateOfJoining: new Date().toISOString().split('T'), // FIXED: Ensure it's a string, not an array
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
            <div className="w-72 bg-[#1e3a5f] text-white flex flex-col shadow-xl">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg"><Activity className="w-6 h-6 text-white" /></div>
                        <div><h2 className="text-xl font-bold tracking-tight">INDIPATH</h2><p className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Admin Systems</p></div>
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

            <div className="flex-1 p-8 overflow-y-auto">
                {view === 'dashboard' && (
                    <div className="space-y-8">
                        <div><h1 className="text-3xl font-bold text-[#1e3a5f]">Dashboard Overview</h1><p className="text-slate-500">System Statistics</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatsCard title="Total Users" value={users.length} icon={<Users />} color="bg-blue-600" />
                            <StatsCard title="Lab Tests" value={tests.length} icon={<TestTube2 />} color="bg-[#2c5282]" />
                            <StatsCard title="Staff Members" value={users.filter(u => u.role !== 'Patient').length} icon={<Shield />} color="bg-blue-400" />
                        </div>
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                    <tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4 text-center">Action</th></tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-medium">{u.name}</td>
                                            <td className="p-4"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700">{u.role}</span></td>
                                            <td className="p-4 text-center"><button onClick={() => deleteUser(u._id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    </div>
                )}
                {/* Available Tests and Forms sections remain as you wrote them, ensuring props are passed correctly */}
            </div>
        </div>
    );
};

const SidebarBtn = ({ active, onClick, icon, text }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${active ? 'bg-blue-500/20 text-white font-bold' : 'text-blue-200 hover:text-white'}`}>
        {icon} <span className="text-sm">{text}</span>
    </button>
);

const StatsCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border flex items-center gap-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white`}>{icon}</div>
        <div><p className="text-[10px] font-bold text-slate-400 uppercase">{title}</p><p className="text-2xl font-black text-[#1e3a5f]">{value}</p></div>
    </div>
);

export default AdminDashboard;