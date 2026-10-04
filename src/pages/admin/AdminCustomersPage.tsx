import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Phone, MapPin } from 'lucide-react';

export const AdminCustomersPage: React.FC = () => {
  const navigate = useNavigate();

  const customers = [
    { id: 'cust-1', name: 'Priya Sharma', phone: '+91 99887 76655', city: 'Hyderabad', totalBookings: 4, joined: '2026-02-10' },
    { id: 'cust-2', name: 'Karan Kapoor', phone: '+91 98112 23344', city: 'Hyderabad', totalBookings: 8, joined: '2026-01-14' },
    { id: 'cust-3', name: 'Venkat Rao', phone: '+91 94401 12233', city: 'Hyderabad', totalBookings: 12, joined: '2025-11-20' },
    { id: 'cust-4', name: 'Dr. Srinivas', phone: '+91 98760 11223', city: 'Hyderabad', totalBookings: 6, joined: '2025-12-05' },
    { id: 'cust-5', name: 'Ananya Roy', phone: '+91 91234 56789', city: 'Hyderabad', totalBookings: 3, joined: '2026-03-01' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      <button
        onClick={() => navigate('/admin/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Admin Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Customer Records</h1>
        <p className="text-xs text-slate-500 mt-1">Platform customer profiles & booking frequency</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">Customer Name</th>
              <th className="p-4">Phone Number</th>
              <th className="p-4">City</th>
              <th className="p-4">Total Bookings</th>
              <th className="p-4">First Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-900">{c.name}</td>
                <td className="p-4 font-medium text-slate-700">{c.phone}</td>
                <td className="p-4 font-medium text-slate-700">{c.city}</td>
                <td className="p-4 font-extrabold text-brand-700">{c.totalBookings} trips</td>
                <td className="p-4 text-slate-500">{c.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
