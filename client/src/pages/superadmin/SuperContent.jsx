import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Image, Trash2, Plus, Zap, Layout, Save, X, Eye } from 'lucide-react';

const ContentManagement = () => {
    const { axios, token } = useAppContext();
    const [activeTab, setActiveTab] = useState('hero'); // 'hero', 'flash'
    
    // Data States
    const [banners, setBanners] = useState([]);
    const [flashSale, setFlashSale] = useState({ 
        title: '', subtitle: '', discount: '', endDate: '', active: true 
    });
    
    // Add Banner Form State
    const [newBanner, setNewBanner] = useState({ 
        title: '', subtitle: '', bgColor: '#f0fdf4', image: null 
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            const bRes = await axios.get('/api/content/banners');
            if (bRes.data.success) setBanners(bRes.data.banners);

            const fRes = await axios.get('/api/content/flash-sale');
            if (fRes.data.success && fRes.data.sale) {
                const sale = fRes.data.sale;
                // Format date for input field (YYYY-MM-DDTHH:MM)
                const dateStr = sale.endTime ? new Date(sale.endTime).toISOString().slice(0, 16) : '';
                setFlashSale({ ...sale, endDate: dateStr });
            }
        } catch (error) { console.error("Fetch error"); }
    };

    useEffect(() => { fetchData(); }, []);

    // --- HANDLERS ---

    // 1. Hero Banner Upload
    const handleAddBanner = async (e) => {
        e.preventDefault();
        if(!newBanner.image) return toast.error("Image required");

        setLoading(true);
        const formData = new FormData();
        formData.append('title', newBanner.title);
        formData.append('subtitle', newBanner.subtitle);
        formData.append('bgColor', newBanner.bgColor);
        formData.append('image', newBanner.image);

        try {
            const { data } = await axios.post('/api/content/add-banner', formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            if(data.success) {
                toast.success("Banner Added Successfully!");
                setNewBanner({ title: '', subtitle: '', bgColor: '#f0fdf4', image: null });
                setPreviewImage(null);
                fetchData();
            } else toast.error(data.message);
        } catch (error) { toast.error("Upload failed"); }
        finally { setLoading(false); }
    };

    // Helper for Image Preview
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewBanner({ ...newBanner, image: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    // 2. Delete Banner
    const handleDeleteBanner = async (id) => {
        if(!confirm("Delete this banner?")) return;
        try {
            const { data } = await axios.post('/api/content/delete-banner', { id }, { headers: { Authorization: `Bearer ${token}` } });
            if(data.success) { toast.success("Deleted"); fetchData(); }
        } catch (error) { toast.error("Delete failed"); }
    };

    // 3. Update Flash Sale
    const handleUpdateFlash = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post('/api/content/update-flash-sale', flashSale, { headers: { Authorization: `Bearer ${token}` } });
            if(data.success) toast.success("Flash Sale Updated!");
        } catch (error) { toast.error("Update failed"); }
        finally { setLoading(false); }
    };

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-8 max-w-5xl mx-auto pb-10">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <Layout className="text-purple-600"/> Content Manager
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Manage homepage banners and promotional events.</p>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                    <button onClick={()=>setActiveTab('hero')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab==='hero' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Hero Banners</button>
                    <button onClick={()=>setActiveTab('flash')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab==='flash' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Flash Sale</button>
                </div>
            </div>

            {/* --- HERO SLIDER TAB --- */}
            {activeTab === 'hero' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: Add Form */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit sticky top-6">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b pb-2"><Plus size={18} className="text-green-600"/> Create New Slide</h3>
                        <form onSubmit={handleAddBanner} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Main Title</label>
                                <input required placeholder="e.g. Fresh Veggies" value={newBanner.title} onChange={e=>setNewBanner({...newBanner, title:e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Subtitle</label>
                                <input required placeholder="e.g. Flat 30% Off" value={newBanner.subtitle} onChange={e=>setNewBanner({...newBanner, subtitle:e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Background Color</label>
                                <div className="flex gap-2 items-center">
                                    <input type="color" value={newBanner.bgColor} onChange={e=>setNewBanner({...newBanner, bgColor:e.target.value})} className="h-10 w-10 cursor-pointer rounded-lg border-0 p-0" />
                                    <span className="text-sm text-gray-600 font-mono">{newBanner.bgColor}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Banner Image</label>
                                <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${previewImage ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`}>
                                    <input type="file" id="bannerImg" className="hidden" onChange={handleImageChange} accept="image/*" />
                                    <label htmlFor="bannerImg" className="cursor-pointer w-full flex flex-col items-center">
                                        {previewImage ? (
                                            <div className="relative w-full h-32">
                                                <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
                                                <button type="button" onClick={(e)=>{e.preventDefault(); setPreviewImage(null); setNewBanner({...newBanner, image:null})}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"><X size={14}/></button>
                                            </div>
                                        ) : (
                                            <>
                                                <Image className="text-gray-400 mb-2" size={32} />
                                                <span className="text-xs text-gray-500 font-medium">Click to upload image</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-100 flex items-center justify-center gap-2">
                                {loading ? "Uploading..." : <><Save size={18}/> Publish Slide</>}
                            </button>
                        </form>
                    </div>

                    {/* Right: List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-bold text-gray-800 text-lg">Active Banners ({banners.length})</h3>
                        {banners.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-400">No banners active. Add one to start.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {banners.map((b) => (
                                    <div key={b._id} className="relative h-48 rounded-2xl overflow-hidden shadow-sm border border-gray-200 flex items-center transition-transform hover:scale-[1.01]" style={{backgroundColor: b.bgColor}}>
                                        <div className="p-8 flex-1 z-10">
                                            <span className="bg-white/50 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2 inline-block">Preview</span>
                                            <h4 className="font-black text-2xl text-gray-900 leading-tight">{b.title}</h4>
                                            <p className="text-gray-700 font-medium mt-1">{b.subtitle}</p>
                                        </div>
                                        <img src={b.image} className="h-full w-1/2 object-contain absolute right-0 bottom-0" alt="" />
                                        
                                        <button onClick={()=>handleDeleteBanner(b._id)} className="absolute top-4 right-4 bg-white/90 p-2.5 rounded-full text-red-500 hover:bg-red-500 hover:text-white shadow-md transition-all z-20">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- FLASH SALE TAB --- */}
            {activeTab === 'flash' && (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-orange-50">
                        <div className="flex items-center gap-3 mb-6 border-b border-orange-100 pb-4">
                            <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                                <Zap size={24}/>
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-gray-800">Flash Deal Configuration</h3>
                                <p className="text-sm text-gray-500">Set up a countdown timer for special offers.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateFlash} className="space-y-5">
                            {/* Toggle Switch */}
                            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <span className="font-bold text-gray-700">Enable Flash Sale Section</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={flashSale.active} onChange={e=>setFlashSale({...flashSale, active: e.target.checked})} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                </label>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Deal Title</label>
                                <input value={flashSale.title} onChange={e=>setFlashSale({...flashSale, title:e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="e.g. Midnight Madness" />
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Subtitle / Description</label>
                                <input value={flashSale.subtitle} onChange={e=>setFlashSale({...flashSale, subtitle:e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="e.g. 50% Off on Electronics" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Discount Tag</label>
                                    <input placeholder="e.g. 50%" value={flashSale.discount} onChange={e=>setFlashSale({...flashSale, discount:e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-center font-bold text-orange-600" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">End Time</label>
                                    <input type="datetime-local" value={flashSale.endDate} onChange={e=>setFlashSale({...flashSale, endDate:e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-200 flex items-center justify-center gap-2 mt-4">
                                {loading ? "Saving..." : <><Save size={20}/> Update Deal Settings</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default ContentManagement;