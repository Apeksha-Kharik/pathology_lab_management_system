import React, { useState, useEffect } from 'react';
import api from '../services/api';
import packageFallbackImage from '../assets/bg1.png';
import { 
    LayoutDashboard, TestTube2, UserPlus, LogOut, Trash2,
    Activity, FlaskConical, IndianRupee, Plus,
    CalendarDays, ClipboardList, FileCheck2, WalletCards, PackagePlus, Boxes,
    UserRound, Microscope, Headphones, Stethoscope, ArrowRight, CheckCircle2
} from 'lucide-react';

const loadAdminPayload = async () => {
    const [userRes, testRes, packageRes, metricsRes] = await Promise.allSettled([
        api.get('/api/admin/users'),
        api.get('/api/admin/tests'),
        api.get('/api/admin/packages'),
        api.get('/api/admin/dashboard-metrics')
    ]);

    const errors = [userRes, testRes, metricsRes]
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason?.response?.data?.message || result.reason?.message || 'Unable to load one admin section');

    return {
        users: userRes.status === 'fulfilled' ? userRes.value.data || [] : [],
        tests: testRes.status === 'fulfilled' ? testRes.value.data || [] : [],
        packages: packageRes.status === 'fulfilled' ? packageRes.value.data || [] : [],
        metrics: metricsRes.status === 'fulfilled' ? metricsRes.value.data || null : null,
        errors
    };
};

const AdminDashboard = () => {
    const [view, setView] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [tests, setTests] = useState([]);
    const [packages, setPackages] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [adminNotice, setAdminNotice] = useState("");
    const [templateMode, setTemplateMode] = useState(false);
    const [templateTargetId, setTemplateTargetId] = useState("");

    const [testForm, setTestForm] = useState({ testName: '', price: '', category: '', conditions: '', description: '', reportDescription: '', reportLetterhead: '' });
    const [templateRows, setTemplateRows] = useState([]);
    const [packageForm, setPackageForm] = useState({ packageName: '', price: '', category: 'Health Checkup', description: '', imageUrl: '', includedTests: [], parametersCount: '', homeCollection: true });
    const emptyUserForm = (role = '') => ({
        name: '', email: '', password: '', phone: '', qualification: '', role,
        age: '', gender: '', dateOfBirth: '', address: '', city: '', state: '',
        pincode: '', emergencyContactName: '', emergencyContactPhone: '', referredBy: ''
    });
    const [userForm, setUserForm] = useState(() => emptyUserForm());
    const [creatingUser, setCreatingUser] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await loadAdminPayload();
            setUsers(data.users);
            setTests(data.tests);
            setPackages(data.packages);
            setMetrics(data.metrics);
            setAdminNotice(data.errors.length ? data.errors.join(" | ") : "");
        } catch (err) {
            console.error("Error loading dashboard data:", err);
            setAdminNotice("Unable to load admin dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        loadAdminPayload()
            .then((data) => {
                if (!isMounted) return;
                setUsers(data.users);
                setTests(data.tests);
                setPackages(data.packages);
                setMetrics(data.metrics);
                setAdminNotice(data.errors.length ? data.errors.join(" | ") : "");
            })
            .catch((err) => {
                console.error("Error loading dashboard data:", err);
                if (isMounted) setAdminNotice("Unable to load admin dashboard data.");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (creatingUser) return;
        try {
            setCreatingUser(true);
            const response = await api.post('/api/admin/users', userForm);
            alert(response.data.message);
            setUserForm(emptyUserForm());
            setView('dashboard');
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed.");
        } finally {
            setCreatingUser(false);
        }
    };

    const openAddUser = () => {
        setUserForm(emptyUserForm());
        setView('addUser');
    };

    const selectUserRole = (role) => setUserForm(emptyUserForm(role));

    const handleAddTest = async (e) => {
        e.preventDefault();
        try {
            const reportTemplate = templateRows
                .map((row) => ({ parameter: row.parameter.trim(), unit: row.unit.trim(), referenceRange: row.referenceRange.trim() }))
                .filter((row) => row.parameter);
            if (templateMode && !reportTemplate.length) {
                alert("Add at least one required report parameter.");
                return;
            }
            const payload = { ...testForm, reportTemplate };
            if (templateMode && templateTargetId) {
                const [type, id] = templateTargetId.split(':');
                await api.put(type === 'package' ? `/api/admin/packages/${id}` : `/api/admin/test/${id}`, payload);
                alert("Report template saved successfully.");
            } else {
                await api.post('/api/admin/add-test', payload);
                alert("Test added successfully.");
            }
            setTestForm({ testName: '', price: '', category: '', conditions: '', description: '', reportDescription: '', reportLetterhead: '' });
            setTemplateRows([]);
            setTemplateTargetId("");
            setView('availableTests');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to add test.");
        }
    };

    const deleteUser = async (id) => {
        if (window.confirm("Delete this staff member?")) {
            try {
                await api.delete(`/api/admin/user/${id}`);
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
            setTests(prev => prev.filter(test => (test._id || test.id) !== id));
            await api.delete(`/api/admin/test/${id}`);
            alert("Deleted successfully!");
        } catch (err) {
            console.error("Server Error Detail:", err.response?.data || err.message);
            alert(`Failed to delete from server: ${err.response?.status || 'Unknown error'}`);
            fetchData(); // Refresh to bring back the item if delete failed
        }
    }
};

    const handleAddPackage = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin/packages', packageForm);
            alert('Package added successfully.');
            setPackageForm({ packageName: '', price: '', category: 'Health Checkup', description: '', imageUrl: '', includedTests: [], parametersCount: '', homeCollection: true });
            setView('availablePackages');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add package.');
        }
    };

    const editTemplate = (type, item) => {
        setTemplateTargetId(`${type}:${item._id}`);
        setTestForm({ ...item, testName: item.testName || item.packageName });
        setTemplateRows((item.reportTemplate || []).map((row) => ({ parameter: row.parameter || '', unit: row.unit || '', referenceRange: row.referenceRange || '' })));
        setView('addTest');
        setTemplateMode(true);
    };

    const deleteTemplate = async (type, item) => {
        if (!window.confirm(`Remove the report template for ${item.testName || item.packageName}? The test/package will not be deleted.`)) return;
        try {
            const payload = { ...item, reportTemplate: [], reportLetterhead: '', reportDescription: '' };
            await api.put(type === 'package' ? `/api/admin/packages/${item._id}` : `/api/admin/test/${item._id}`, payload);
            if (templateTargetId === `${type}:${item._id}`) {
                setTemplateTargetId('');
                setTemplateRows([]);
            }
            await fetchData();
            alert('Report template deleted.');
        } catch (err) {
            alert(err.response?.data?.message || 'Unable to delete report template.');
        }
    };

    const deletePackage = async (id) => {
        if (!window.confirm('Permanently remove this health package?')) return;
        try {
            await api.delete(`/api/admin/packages/${id}`);
            setPackages((previous) => previous.filter((item) => item._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete package.');
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 lg:flex-row">
            {/* Sidebar */}
            <div className="w-full bg-emerald-950 text-white flex flex-col shadow-xl lg:sticky lg:top-0 lg:h-screen lg:w-72">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">INDIPATH</h2>
                            <p className="text-[10px] text-emerald-200 uppercase font-bold tracking-widest">Admin Systems</p>
                        </div>
                    </div>
                    <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
                        <SidebarBtn active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard className="w-5 h-5" />} text="Dashboard" />
                        <SidebarBtn active={view === 'availableTests'} onClick={() => setView('availableTests')} icon={<FlaskConical className="w-5 h-5" />} text="Available Tests" />
                        <SidebarBtn active={view === 'addTest' && !templateMode} onClick={() => { setTemplateMode(false); setView('addTest'); }} icon={<TestTube2 className="w-5 h-5" />} text="Add New Test" />
                        <SidebarBtn active={view === 'addTest' && templateMode} onClick={() => { setTemplateMode(true); setTemplateTargetId(""); setTestForm({ testName: '', price: '', category: '', conditions: '', description: '', reportDescription: '', reportLetterhead: '' }); setTemplateRows([]); setView('addTest'); }} icon={<ClipboardList className="w-5 h-5" />} text="Report Templates" />
                        <SidebarBtn active={view === 'availablePackages'} onClick={() => setView('availablePackages')} icon={<Boxes className="w-5 h-5" />} text="Health Packages" />
                        <SidebarBtn active={view === 'addPackage'} onClick={() => setView('addPackage')} icon={<PackagePlus className="w-5 h-5" />} text="Add New Package" />
                        <SidebarBtn active={view === 'addUser'} onClick={openAddUser} icon={<UserPlus className="w-5 h-5" />} text="Add User" />
                    </nav>
                </div>
                <div className="mt-auto p-6">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-emerald-100/80 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {loading && (
                    <div className="mb-6 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                        Loading admin dashboard data...
                    </div>
                )}

                {adminNotice && (
                    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                        {adminNotice}
                    </div>
                )}
                
                {view === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <header>
                            <h1 className="text-3xl font-bold text-emerald-950">Dashboard Overview</h1>
                            <p className="text-slate-500">Operational snapshot across bookings, billing, samples and reports</p>
                        </header>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                            <StatsCard title="Total Bookings" value={metrics?.totals?.bookings ?? 0} icon={<ClipboardList />} color="bg-emerald-700" />
                            <StatsCard title="Today's Patients" value={metrics?.workflow?.todaysBookings ?? 0} icon={<CalendarDays />} color="bg-emerald-600" />
                            <StatsCard title="Pending Reports" value={metrics?.reports?.pending ?? 0} icon={<FileCheck2 />} color="bg-violet-600" />
                            <StatsCard title="Monthly Revenue" value={formatCurrency(metrics?.finance?.monthlyRevenue)} icon={<WalletCards />} color="bg-amber-500" />
                        </div>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                    <div>
                                        <h3 className="font-bold text-emerald-950">Lab Operations Monitor</h3>
                                        <p className="text-sm text-slate-500">Queues that need daily admin visibility</p>
                                    </div>
                                    <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">Live counts</span>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    <QueueTile label="Booking Approval" value={metrics?.workflow?.pendingBookings} tone="sky" />
                                    <QueueTile label="Pending Payments" value={metrics?.workflow?.pendingPayments} tone="amber" />
                                    <QueueTile label="Sample Processing" value={metrics?.workflow?.processingSamples} tone="indigo" />
                                    <QueueTile label="Report Approval" value={metrics?.workflow?.pendingReportApproval} tone="violet" />
                                    <QueueTile label="Reports Ready" value={metrics?.workflow?.readyReports} tone="emerald" />
                                    <QueueTile label="Pending Amount" value={formatCurrency(metrics?.finance?.pendingAmount)} tone="rose" />
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="font-bold text-emerald-950">System Composition</h3>
                                <p className="mb-5 text-sm text-slate-500">Users, patients, staff and test catalog scale</p>
                                <div className="grid gap-3">
                                    <MiniMetric label="Total Users" value={metrics?.totals?.users ?? users.length} />
                                    <MiniMetric label="Patients" value={metrics?.totals?.patients ?? 0} />
                                    <MiniMetric label="Staff Users" value={metrics?.totals?.staff ?? users.filter(u => u.role !== 'patient').length} />
                                    <MiniMetric label="Active Tests" value={metrics?.totals?.tests ?? tests.length} />
                                    <MiniMetric label="Approved Reports" value={metrics?.reports?.approved ?? 0} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 p-5">
                                <h3 className="font-bold text-emerald-950">Recent Booking Activity</h3>
                                <p className="text-sm text-slate-500">Latest operational movement across the lab</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="p-4">Booking ID</th>
                                            <th className="p-4">Patient</th>
                                            <th className="p-4">Test</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Booking</th>
                                            <th className="p-4">Payment</th>
                                            <th className="p-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(metrics?.recentBookings || []).map((booking) => (
                                            <tr key={booking._id} className="border-t border-slate-100">
                                                <td className="p-4 font-bold text-slate-800">{booking.bookingCode || booking._id}</td>
                                                <td className="p-4">{booking.name}</td>
                                                <td className="p-4">{booking.testName}</td>
                                                <td className="p-4">{booking.bookingDate || "N/A"}</td>
                                                <td className="p-4"><StatusPill value={booking.bookingStatus} /></td>
                                                <td className="p-4"><StatusPill value={booking.paymentStatus} /></td>
                                                <td className="p-4 text-right font-bold">INR {booking.amount || 0}</td>
                                            </tr>
                                        ))}
                                        {!metrics?.recentBookings?.length && (
                                            <tr>
                                                <td colSpan="7" className="p-8 text-center text-slate-500">No booking activity yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center text-emerald-950">
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
                                            <td className="p-4"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">{u.role}</span></td>
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
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                            <div>
                                <h1 className="text-3xl font-bold text-emerald-950">Test Catalog</h1>
                                <p className="text-slate-500">Manage all diagnostic offerings</p>
                            </div>
                            <button onClick={() => setView('addTest')} className="flex items-center gap-2 bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-700/15 hover:bg-emerald-800 transition-all">
                                <Plus size={18} /> Add New Test
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tests.map((test) => (
                                <div key={test._id || test.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-all">
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
                                    <div className="flex items-center gap-1 text-2xl font-black text-emerald-950 my-4">
                                        <IndianRupee size={20} /> {test.price}
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 italic">"{test.conditions || 'No special conditions'}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'availablePackages' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                            <div>
                                <h1 className="text-3xl font-bold text-emerald-950">Health Packages</h1>
                                <p className="text-slate-500">Packages patients can view and book from their portal</p>
                            </div>
                            <button onClick={() => setView('addPackage')} className="flex items-center gap-2 bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-700/15 hover:bg-emerald-800 transition-all">
                                <PackagePlus size={18} /> Add New Package
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {packages.length ? packages.map((item) => (
                                <div key={item._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <img src={item.imageUrl || packageFallbackImage} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = packageFallbackImage; }} alt={item.packageName} className="h-40 w-full object-cover" />
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">{item.category}</p><h3 className="mt-1 text-lg font-bold text-slate-800">{item.packageName}</h3></div><button onClick={() => deletePackage(item._id)} className="text-slate-300 hover:text-red-500"><Trash2 size={19} /></button></div>
                                        <p className="mt-3 min-h-10 text-sm text-slate-500">{item.description || 'Comprehensive health checkup package.'}</p>
                                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><span className="font-black text-emerald-900">INR {item.price}</span><span className="text-xs font-semibold text-slate-500">{item.includedTests?.length || item.parametersCount || 0} tests included</span></div>
                                    </div>
                                </div>
                            )) : <p className="col-span-full py-10 text-center text-slate-500">No packages have been added yet.</p>}
                        </div>
                    </div>
                )}

                {view === 'addPackage' && (
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div className="text-center"><h1 className="text-3xl font-bold text-emerald-950">Create Health Package</h1><p className="mt-2 text-slate-500">Add the package details, an image, and the tests it includes.</p></div>
                        <form onSubmit={handleAddPackage} className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2"><FormInput label="Package Name" value={packageForm.packageName} onChange={(e) => setPackageForm({...packageForm, packageName: e.target.value})} required /><FormInput label="Price (INR)" type="number" min="0" value={packageForm.price} onChange={(e) => setPackageForm({...packageForm, price: e.target.value})} required /></div>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2"><FormInput label="Category" value={packageForm.category} onChange={(e) => setPackageForm({...packageForm, category: e.target.value})} /><div><FormInput label="Image URL" type="url" placeholder="https://example.com/package.jpg" value={packageForm.imageUrl} onChange={(e) => setPackageForm({...packageForm, imageUrl: e.target.value})} /><p className="mt-2 text-xs text-slate-400">Use a direct .jpg, .png, or .webp image address—not a Google Images or Drive preview page.</p></div></div>
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><img src={packageForm.imageUrl || packageFallbackImage} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = packageFallbackImage; }} alt="Package image preview" className="h-40 w-full object-cover" /></div>
                            <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Included Tests</label><select multiple value={packageForm.includedTests} onChange={(e) => setPackageForm({...packageForm, includedTests: Array.from(e.target.selectedOptions, (option) => option.value)})} className="h-40 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-emerald-500">{tests.map((test) => <option key={test._id} value={test._id}>{test.testName}</option>)}</select><p className="text-xs text-slate-400">Hold Ctrl (or Cmd) to select multiple tests.</p></div>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2"><FormInput label="Parameters Count (optional)" type="number" min="0" value={packageForm.parametersCount} onChange={(e) => setPackageForm({...packageForm, parametersCount: e.target.value})} /><label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={packageForm.homeCollection} onChange={(e) => setPackageForm({...packageForm, homeCollection: e.target.checked})} /> Home sample collection available</label></div>
                            <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label><textarea required value={packageForm.description} onChange={(e) => setPackageForm({...packageForm, description: e.target.value})} className="h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Describe who this package is for and what it covers." /></div>
                            <button type="submit" className="w-full bg-emerald-800 text-white py-4 rounded-xl font-bold hover:bg-emerald-900 transition-all">Publish Package</button>
                        </form>
                    </div>
                )}

                {/* Add Test View */}
                {view === 'addTest' && (
                    <div className="max-w-2xl mx-auto space-y-8">
                        <h1 className="text-3xl font-bold text-emerald-950 text-center">{templateMode ? 'Create Test Report Template' : 'Create Lab Test'}</h1>
                        {templateMode && <p className="text-center text-slate-500">Set up the test details and the parameter rows technicians will use when entering results.</p>}
                        <form onSubmit={handleAddTest} className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                            {templateMode && <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Choose Test or Package</label><select required value={templateTargetId} onChange={(e) => { const [type, id] = e.target.value.split(':'); const selected = type === 'package' ? packages.find((item) => item._id === id) : tests.find((item) => item._id === id); setTemplateTargetId(e.target.value); if (selected) { setTestForm({ ...selected, testName: selected.testName || selected.packageName }); setTemplateRows((selected.reportTemplate || []).map((row) => ({ parameter: row.parameter || '', unit: row.unit || '', referenceRange: row.referenceRange || '' }))); } }} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-emerald-500"><option value="">Select an existing test or package</option><optgroup label="Tests">{tests.map((test) => <option key={test._id} value={`test:${test._id}`}>{test.testName}</option>)}</optgroup><optgroup label="Packages">{packages.map((item) => <option key={item._id} value={`package:${item._id}`}>{item.packageName}</option>)}</optgroup></select></div>}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <FormInput label="Test Name" value={testForm.testName} onChange={(e) => setTestForm({...testForm, testName: e.target.value})} required />
                                <FormInput label="Price (INR)" type="number" value={testForm.price} onChange={(e) => setTestForm({...testForm, price: e.target.value})} required />
                            </div>
                            <FormInput label="Category" value={testForm.category} onChange={(e) => setTestForm({...testForm, category: e.target.value})} required />
                            {!templateMode && <FormInput label="Conditions" value={testForm.conditions} onChange={(e) => setTestForm({...testForm, conditions: e.target.value})} />}
                            {!templateMode && <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
                                <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none h-32" 
                                    value={testForm.description} onChange={(e) => setTestForm({...testForm, description: e.target.value})} required />
                            </div>}
                            <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Report Letterhead</label><textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none h-24" value={testForm.reportLetterhead || ''} onChange={(e) => setTestForm({...testForm, reportLetterhead: e.target.value})} placeholder={'INDIPATH DIAGNOSTIC LAB\n22 Mahapurush Complex, Kankavali\nPhone: 02367-231970'} /><p className="text-xs text-slate-400">This is shown at the top of the technician entry form and saved with the report.</p></div>
                            <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Report Description (optional)</label><textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none h-24" value={testForm.reportDescription} onChange={(e) => setTestForm({...testForm, reportDescription: e.target.value})} placeholder="This description will appear above the results on the report." /></div>
                            <div className="space-y-3"><div className="flex items-center justify-between"><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Required Report Parameters</label><button type="button" onClick={() => setTemplateRows([...templateRows, { parameter: '', unit: '', referenceRange: '' }])} className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50">Add parameter</button></div>{templateRows.length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Add each required parameter here. The technician can enter only the result value later.</p>}{templateRows.map((row, index) => <div key={index} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1.4fr_1fr_1fr_auto]"><input required placeholder="Parameter name (e.g., Hemoglobin)" value={row.parameter} onChange={(e) => setTemplateRows(templateRows.map((item, i) => i === index ? { ...item, parameter: e.target.value } : item))} className="rounded-lg border border-slate-200 bg-white p-2 text-sm outline-none" /><input placeholder="Unit (e.g., g/dL)" value={row.unit} onChange={(e) => setTemplateRows(templateRows.map((item, i) => i === index ? { ...item, unit: e.target.value } : item))} className="rounded-lg border border-slate-200 bg-white p-2 text-sm outline-none" /><input placeholder="Reference range" value={row.referenceRange} onChange={(e) => setTemplateRows(templateRows.map((item, i) => i === index ? { ...item, referenceRange: e.target.value } : item))} className="rounded-lg border border-slate-200 bg-white p-2 text-sm outline-none" /><button type="button" onClick={() => setTemplateRows(templateRows.filter((_, i) => i !== index))} className="rounded-lg px-3 text-xs font-bold text-red-600 hover:bg-red-50">Remove</button></div>)}<p className="text-xs text-slate-400">Parameter name, unit, and reference range are saved by the admin and pre-filled in the technician report.</p></div>
                            <button type="submit" className="w-full bg-emerald-800 text-white py-4 rounded-xl font-bold hover:bg-emerald-900 transition-all">{templateMode ? 'Save Test Template' : 'Publish Test'}</button>
                        </form>
                        {templateMode && <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-emerald-950">Saved Report Templates</h2><div className="mt-4 space-y-3">{[...tests.map((item) => ({ type: 'test', item })), ...packages.map((item) => ({ type: 'package', item }))].filter(({ item }) => item.reportTemplate?.length || item.reportLetterhead || item.reportDescription).map(({ type, item }) => <div key={`${type}-${item._id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-bold text-slate-800">{item.testName || item.packageName}</p><p className="text-xs text-slate-500">{item.reportTemplate?.length || 0} required parameter(s)</p></div><div className="flex gap-2"><button type="button" onClick={() => editTemplate(type, item)} className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50">Edit</button><button type="button" onClick={() => deleteTemplate(type, item)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Delete</button></div></div>)}{![...tests, ...packages].some((item) => item.reportTemplate?.length || item.reportLetterhead || item.reportDescription) && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No report templates saved yet.</p>}</div></section>}
                    </div>
                )}

                {/* Add User View */}
                {view === 'addUser' && (
                    <div className="mx-auto max-w-5xl space-y-6">
                        <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
                            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-800 px-6 py-8 text-white sm:px-10">
                                <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/5" />
                                <div className="absolute -bottom-24 right-24 h-52 w-52 rounded-full bg-emerald-300/10" />
                                <div className="relative flex items-center gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                                        <UserPlus className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">User management</p>
                                        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Create a new account</h1>
                                        <p className="mt-1 text-sm text-emerald-100">Select a role to continue with the correct registration form.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
                                {[
                                    { role: 'patient', label: 'Patient', description: 'Register a patient and their contact details.', icon: UserRound, tone: 'bg-sky-50 text-sky-700' },
                                    { role: 'technician', label: 'Technician', description: 'Create access for sample and report work.', icon: Microscope, tone: 'bg-violet-50 text-violet-700' },
                                    { role: 'receptionist', label: 'Receptionist', description: 'Create access for bookings and front desk.', icon: Headphones, tone: 'bg-amber-50 text-amber-700' },
                                    { role: 'pathologist', label: 'Pathologist', description: 'Create access for report review and approval.', icon: Stethoscope, tone: 'bg-rose-50 text-rose-700' }
                                ].map(({ role, label, description, icon: RoleIcon, tone }) => {
                                    const selected = userForm.role === role;
                                    return <button key={role} type="button" onClick={() => selectUserRole(role)}
                                        className={`group relative min-h-48 rounded-2xl border p-5 text-left transition-all duration-200 ${selected ? 'border-emerald-600 bg-emerald-50 shadow-md ring-2 ring-emerald-600/10' : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg'}`}>
                                        {selected && <CheckCircle2 className="absolute right-4 top-4 h-5 w-5 text-emerald-600" />}
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${selected ? 'bg-emerald-700 text-white' : tone}`}>
                                            {React.createElement(RoleIcon, { className: 'h-6 w-6' })}
                                        </div>
                                        <h2 className="mt-5 text-lg font-bold text-slate-900">{label}</h2>
                                        <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{description}</p>
                                        <span className={`mt-4 flex items-center gap-1 text-xs font-bold ${selected ? 'text-emerald-700' : 'text-slate-500 group-hover:text-emerald-700'}`}>
                                            {selected ? 'Selected' : `Add ${label}`} <ArrowRight className="h-3.5 w-3.5" />
                                        </span>
                                    </button>;
                                })}
                            </div>
                        </section>

                        {!userForm.role && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-100/70 px-6 py-5 text-center text-sm text-slate-500">
                            Select one of the account types above to open its registration form.
                        </div>
                        }

                        {userForm.role && <form onSubmit={handleAddUser} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800"><UserPlus className="h-5 w-5" /></div>
                                <div><h2 className="text-xl font-bold capitalize text-emerald-950">New {userForm.role} details</h2><p className="text-xs text-slate-500">Fields marked by your browser as required must be completed.</p></div>
                            </div>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <FormInput label="Full Name" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} required />
                                <FormInput label="Email" type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} required />
                                <FormInput label="Phone" type="tel" value={userForm.phone} onChange={(e) => setUserForm({...userForm, phone: e.target.value})} required />
                                <FormInput label={userForm.role === 'patient' ? 'Password' : 'Temporary Password'} type="password" minLength="8" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} required />
                            </div>

                            {userForm.role === 'pathologist' && <FormInput label="Qualification" value={userForm.qualification} onChange={(e) => setUserForm({...userForm, qualification: e.target.value})} required />}

                            {userForm.role === 'patient' && <div className="space-y-6 border-t border-slate-100 pt-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <FormInput label="Age" type="number" min="18" max="120" value={userForm.age} onChange={(e) => setUserForm({...userForm, age: e.target.value})} required />
                                    <FormInput label="Date of Birth" type="date" value={userForm.dateOfBirth} onChange={(e) => setUserForm({...userForm, dateOfBirth: e.target.value})} />
                                    <SelectInput label="Gender" value={userForm.gender} onChange={(e) => setUserForm({...userForm, gender: e.target.value})} options={['Male', 'Female', 'Other', 'Prefer not to say']} />
                                </div>
                                <FormInput label="Address" value={userForm.address} onChange={(e) => setUserForm({...userForm, address: e.target.value})} required />
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <FormInput label="City" value={userForm.city} onChange={(e) => setUserForm({...userForm, city: e.target.value})} required />
                                    <FormInput label="State" value={userForm.state} onChange={(e) => setUserForm({...userForm, state: e.target.value})} />
                                    <FormInput label="Pincode" value={userForm.pincode} onChange={(e) => setUserForm({...userForm, pincode: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <FormInput label="Emergency Contact Name" value={userForm.emergencyContactName} onChange={(e) => setUserForm({...userForm, emergencyContactName: e.target.value})} />
                                    <FormInput label="Emergency Contact Phone" type="tel" value={userForm.emergencyContactPhone} onChange={(e) => setUserForm({...userForm, emergencyContactPhone: e.target.value})} />
                                </div>
                                <FormInput label="Referred By" value={userForm.referredBy} onChange={(e) => setUserForm({...userForm, referredBy: e.target.value})} />
                            </div>}

                            <button disabled={creatingUser} type="submit" className="w-full rounded-xl bg-emerald-700 py-4 font-bold text-white transition-all hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
                                {creatingUser ? 'Creating Account...' : `Create ${userForm.role.charAt(0).toUpperCase() + userForm.role.slice(1)} Account`}
                            </button>
                        </form>}
                    </div>
                )}
            </div>
        </div>
    );
};

const SidebarBtn = ({ active, onClick, icon, text }) => (
    <button onClick={onClick} className={`flex min-w-max items-center gap-3 rounded-xl p-3 transition-all duration-300 lg:w-full lg:gap-4 lg:p-4 ${active ? 'bg-white/12 text-white font-bold' : 'text-emerald-100/80 hover:text-white hover:bg-white/5'}`}>
        {icon} <span className="text-sm tracking-wide">{text}</span>
    </button>
);

const StatsCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-lg border border-slate-100 flex items-center gap-5 shadow-sm">
        <div className={`w-14 h-14 ${color} rounded-lg flex items-center justify-center text-white shadow-lg`}>{icon}</div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <p className="text-2xl font-black text-emerald-950">{value}</p>
        </div>
    </div>
);

const queueToneClasses = {
    sky: "bg-emerald-50 text-emerald-800 border-emerald-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-800 border-indigo-100",
    violet: "bg-violet-50 text-violet-800 border-violet-100",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-100",
    rose: "bg-rose-50 text-rose-800 border-rose-100"
};

const QueueTile = ({ label, value, tone = "sky" }) => (
    <div className={`rounded-lg border p-4 ${queueToneClasses[tone] || queueToneClasses.sky}`}>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-75">{label}</p>
        <p className="mt-2 text-2xl font-black">{value ?? 0}</p>
    </div>
);

const MiniMetric = ({ label, value }) => (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
        <span className="text-sm font-bold text-slate-600">{label}</span>
        <span className="text-lg font-black text-emerald-950">{value ?? 0}</span>
    </div>
);

const StatusPill = ({ value }) => {
    const good = ["Paid", "Confirmed", "Report Ready", "Approved", "Arrived", "Technician Assigned"].includes(value);
    const danger = ["Rejected", "Failed", "Cancelled"].includes(value);
    const classes = good
        ? "bg-emerald-50 text-emerald-700"
        : danger
            ? "bg-rose-50 text-rose-700"
            : "bg-amber-50 text-amber-700";

    return <span className={`rounded px-2 py-1 text-[10px] font-black uppercase ${classes}`}>{value || "N/A"}</span>;
};

const formatCurrency = (value = 0) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const FormInput = ({ label, ...props }) => (
    <div className="space-y-2 flex-1">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>
        <input {...props} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium" />
    </div>
);

const SelectInput = ({ label, options, ...props }) => (
    <div className="flex-1 space-y-2">
        <label className="px-1 text-xs font-bold uppercase tracking-widest text-slate-400">{label}</label>
        <select {...props} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
    </div>
);

export default AdminDashboard;
