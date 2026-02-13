"use client";
import React, { useState, useEffect } from 'react';
// เพิ่ม Import สำหรับ Recharts
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// --- Interfaces ---
interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
}

interface Activity {
  id: number;
  action: string;
  details: string;
  created_at: string;
}

export default function InventorySystem() {
  // --- 1. การประกาศ State ---
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', stock: 0, price: 0 });

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockType, setStockType] = useState<'IN' | 'OUT'>('IN');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);

  // --- 2. ฟังก์ชันดึงข้อมูล ---
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch Products Error:", err);
      setProducts([]);
    }
  };

  const fetchactivities = async () => { 
    try {
      const res = await fetch('/api/activities');
      if (!res.ok) throw new Error("API Path Error"); 
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []); 
    } catch (err) { 
      console.error("Fetch activities Error:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchactivities();
  }, []);

  // --- 3. ฟังก์ชันจัดการข้อมูล (Handlers) ---
  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({ name: product.name, stock: product.stock, price: product.price });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', stock: 0, price: 0 });
      await fetchProducts();
      await fetchactivities(); 
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const res = await fetch(`/api/products/${selectedProduct.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: adjustmentAmount,
        type: stockType,
        price: selectedProduct.price
      }),
    });

    if (res.ok) {
      setIsStockModalOpen(false);
      setAdjustmentAmount(0);
      await fetchProducts();
      await fetchactivities(); 
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('ยืนยันการลบรายการนี้?')) {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchProducts();
        await fetchactivities(); 
      }
    }
  };

  // ฟังก์ชันกำหนดสีตามประเภทกิจกรรม
  const getActivityStyle = (action: string) => {
    switch (action) {
      case 'Stock In': 
        return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', dot: 'bg-emerald-500' };
      case 'Stock Out': 
        return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', dot: 'bg-rose-500' };
      case 'Add Product': 
        return { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', dot: 'bg-indigo-500' };
      case 'Edit Name': 
        return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', dot: 'bg-amber-500' };
      case 'Delete Product': 
        return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400' };
      default: 
        return { bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-100', dot: 'bg-slate-300' };
    }
  };

  // เตรียมข้อมูลสำหรับ Pie Chart
  const activityPieData = [
    { name: 'Stock In', value: activities.filter(a => a.action === 'Stock In').length },
    { name: 'Stock Out', value: activities.filter(a => a.action === 'Stock Out').length },
  ].filter(item => item.value > 0);

  const PIE_COLORS = ['#10b981', '#f43f5e'];

  // --- 4. การแสดงผล UI (Render) ---
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="w-64 bg-white border-r border-slate-200 p-6 hidden lg:block shadow-sm">
        <div className="text-xl font-black text-indigo-600 mb-10 tracking-tighter uppercase">Cs Stock</div>
        <nav className="space-y-2">
          {['Dashboard', 'Products', 'Reports'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'
              }`}>
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'Dashboard' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Total Products" value={products.length} color="text-indigo-600" />
              <StatCard title="Low Stock" value={products.filter(p => p.stock < 50 && p.stock > 0).length} color="text-amber-500" />
              <StatCard title="Out of Stock" value={products.filter(p => p.stock === 0).length} color="text-rose-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                 <h2 className="text-xl font-black mb-6 text-slate-800 uppercase tracking-tight italic">Recent Activity</h2>
                 <div className="space-y-3">
                   {activities.length > 0 ? activities.map((act) => {
                     const style = getActivityStyle(act.action);
                     return (
                       <div key={act.id} className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${style.bg} ${style.border}`}>
                         <div className={`w-2.5 h-2.5 rounded-full ${style.dot} flex-shrink-0`}></div>
                         <div className="flex flex-col flex-1">
                           <div className="flex justify-between items-center">
                             <span className={`font-black text-[10px] uppercase tracking-widest ${style.text}`}>{act.action}</span>
                             <span className="text-[9px] text-slate-300 font-bold">{new Date(act.created_at).toLocaleTimeString('th-TH')}</span>
                           </div>
                           <span className="text-slate-700 font-bold text-xs mt-0.5">{act.details}</span>
                         </div>
                       </div>
                     );
                   }) : (
                     <div className="text-center py-10 text-slate-400 text-xs font-bold italic uppercase">No recent activity</div>
                   )}
                 </div>
               </div>
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                <h2 className="text-xl font-black mb-6 text-slate-800 uppercase tracking-tight italic">Stock Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="font-bold text-slate-500 tracking-wide uppercase text-[11px]">In Stock Items</span>
                    <span className="text-2xl font-black text-slate-800">{products.filter(p => p.stock > 0).length}</span>
                  </div>
                  <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="font-bold text-slate-500 tracking-wide uppercase text-[11px]">Empty Stock</span>
                    <span className="text-2xl font-black text-rose-500">{products.filter(p => p.stock === 0).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Products View --- */}
        {activeTab === 'Products' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in">
              <header className="flex justify-between items-center">
               <h1 className="text-3xl font-black text-slate-800 uppercase italic">Product List</h1>
               <button onClick={() => { setEditingId(null); setFormData({name:'', stock:0, price:0}); setIsModalOpen(true); }}
                 className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-transform active:scale-95 tracking-widest text-xs uppercase hover:bg-indigo-700">+ ADD ITEM</button>
             </header>
             <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden text-sm">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 font-black text-slate-400 uppercase tracking-widest text-[11px]">
                   <tr>
                     <th className="px-8 py-5">Product Name</th>
                     <th className="px-8 py-5">Stock</th>
                     <th className="px-8 py-5">Price</th>
                     <th className="px-8 py-5 text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {products.map((item) => (
                     <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-8 py-5 font-bold text-slate-700">{item.name}</td>
                       <td className={`px-8 py-5 font-mono font-bold ${item.stock < 10 ? 'text-rose-500' : 'text-slate-500'}`}>{item.stock}</td>
                       <td className="px-8 py-5 font-bold text-indigo-600">฿{item.price.toLocaleString()}</td>
                       <td className="px-8 py-5 text-right space-x-2">
                         <button onClick={() => { setSelectedProduct(item); setStockType('IN'); setIsStockModalOpen(true); }} 
                           className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg font-bold text-[10px] hover:bg-emerald-100 transition-colors uppercase tracking-widest">IN</button>
                         <button onClick={() => { setSelectedProduct(item); setStockType('OUT'); setIsStockModalOpen(true); }} 
                           className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg font-bold text-[10px] hover:bg-rose-100 transition-colors uppercase tracking-widest">OUT</button>
                         <button onClick={() => handleEdit(item)} className="text-indigo-600 font-bold text-xs px-2 hover:underline transition-all">EDIT</button>
                         <button onClick={() => handleDelete(item.id)} className="text-rose-300 hover:text-rose-600 font-bold text-xs transition-colors">DEL</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
            </div>
        )}

        {/* --- Reports View --- */}
        {activeTab === 'Reports' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in">
            <header className="flex justify-between items-center">
              <h1 className="text-3xl font-black text-slate-800 uppercase italic">Inventory Reports</h1>
              <button onClick={() => window.print()} 
                className="bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-lg text-xs uppercase tracking-widest hover:bg-slate-700">
                Print Report
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Value" value={`฿${products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()}`} color="text-indigo-600" />
              <StatCard title="Avg. Price" value={`฿${(products.reduce((acc, p) => acc + p.price, 0) / (products.length || 1)).toFixed(2)}`} color="text-emerald-500" />
              <StatCard title="Total Units" value={products.reduce((acc, p) => acc + p.stock, 0)} color="text-slate-700" />
              <StatCard title="Activities" value={activities.length} color="text-amber-500" />
            </div>

            {/* เพิ่มส่วน Graph Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center">
                <h2 className="text-xl font-black mb-6 text-slate-800 uppercase tracking-tight italic border-l-4 border-indigo-600 pl-4 self-start">Activity Breakdown</h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {activityPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-8">
                <h2 className="text-xl font-black mb-6 text-slate-800 uppercase tracking-tight italic border-l-4 border-indigo-600 pl-4">Top Value Items</h2>
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-400 font-black uppercase tracking-widest text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-4">Product Name</th>
                      <th className="py-4 text-right">Asset Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {products
                      .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
                      .slice(0, 5)
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-5 font-bold text-slate-700">{item.name}</td>
                          <td className="py-5 text-right font-black text-indigo-600">฿{(item.price * item.stock).toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- Modals --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <form onSubmit={handleSave} className="bg-white p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black mb-6 italic uppercase tracking-tighter">{editingId ? 'Edit Product Name' : 'New Item'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                <input type="text" placeholder="Product Name" value={formData.name} required
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold" 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              {!editingId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock</label>
                    <input type="number" value={formData.stock || ""}
                      placeholder="0" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold"
                      onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price</label>
                    <input type="number" value={formData.price || ""}
                      placeholder="0.00" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold"
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-4 pt-8">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 font-bold text-slate-400 text-xs tracking-widest uppercase">CANCEL</button>
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg text-xs uppercase tracking-widest">SAVE</button>
            </div>
          </form>
        </div>
      )}

      {isStockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <form onSubmit={handleStockAdjustment} className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
            <h2 className={`text-2xl font-black mb-2 uppercase italic ${stockType === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
              Stock {stockType === 'IN' ? 'In' : 'Out'}
            </h2>
            <p className="text-slate-400 mb-6 font-bold text-sm italic tracking-widest uppercase">Item: {selectedProduct?.name}</p>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                <input type="number" value={adjustmentAmount || ""} 
                  onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                  placeholder="0" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold transition-all focus:ring-2 focus:ring-indigo-500 text-lg" required />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Update Price (฿)</label>
                <input type="number" value={selectedProduct?.price || ""} 
                  onChange={(e) => setSelectedProduct(selectedProduct ? {...selectedProduct, price: parseFloat(e.target.value) || 0} : null)}
                  placeholder="0.00" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-indigo-600 transition-all focus:ring-2 focus:ring-indigo-500 text-lg" required />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setIsStockModalOpen(false)} className="flex-1 font-bold text-slate-400 text-xs tracking-widest uppercase">CANCEL</button>
              <button type="submit" className={`flex-1 py-4 rounded-2xl font-black text-white shadow-lg text-xs tracking-widest uppercase transition-all active:scale-95 ${stockType === 'IN' ? 'bg-emerald-500' : 'bg-rose-500'}`}>CONFIRM</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color }: { title: string, value: number | string, color: string }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm transition-transform hover:scale-[1.05]">
      <p className="text-slate-400 text-[10px] font-black uppercase mb-2 tracking-widest">{title}</p>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}