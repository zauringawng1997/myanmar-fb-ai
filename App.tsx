
import React, { useState, useEffect, useRef } from 'react';
import { PostRequest, ContentTone, HistoryItem, TONE_LABELS } from './types';
import { ICONS } from './constants';
import { generateFBPost, generateFBDesign } from './services/gemini';

// Admin Security (PIN: zauringawng1997)
const _SEC_KEY = "7a617572696e6761776e6731393937";
const _p_conv = (h: string) => {
  let s = '';
  for (let i = 0; i < h.length; i += 2) {
    s += String.fromCharCode(parseInt(h.substr(i, 2), 16));
  }
  return s;
};

// Google Sheet Config (Cell B1 will sync with adminAnnouncement)
const SHEET_ID = '1XMiboZM2VGFZa_hh5IwGXEMMs9DeZnQqv9jn8U6JM8A';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

export const App: React.FC = () => {
  // --- States ---
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('fb_theme');
    return saved !== null ? saved === 'dark' : true;
  });
  const [coins, setCoins] = useState<number>(6); 
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [customSystemInstruction, setCustomSystemInstruction] = useState<string>('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [adminPassInput, setAdminPassInput] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [logoClicks, setLogoClicks] = useState<number>(0);
  const [isWelcomeDone, setIsWelcomeDone] = useState<boolean>(false);
  const [usedCodes, setUsedCodes] = useState<string[]>([]);

  // Admin Configs (Remote via Sheet or Manual)
  const [adminAnnouncement, setAdminAnnouncement] = useState<string>('Vpn ခံသုံးပေးပါ၊ အဆင်ပြေကြပါစေ');
  const [adminContact, setAdminContact] = useState<string>('09253220452');
  const [adminFacebook, setAdminFacebook] = useState<string>('https://www.facebook.com/share/14FtTuT6d5W/');
  const [adminTelegram, setAdminTelegram] = useState<string>('https://t.me/smartchoice100');

  // UI / Form
  const [activeTab, setActiveTab] = useState<'topic' | 'image' | 'design'>('topic');
  const [topic, setTopic] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [tone, setTone] = useState<ContentTone>('Friendly');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showHistory, setShowHistory] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admin Tools
  const [topUpAmount, setTopUpAmount] = useState<string>('50');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Announcement from Google Sheet (B1)
  const fetchAnnouncement = async () => {
    try {
      const response = await fetch(SHEET_CSV_URL);
      const text = await response.text();
      const rows = text.split('\n');
      if (rows.length > 0) {
        const firstRow = rows[0].split(',');
        if (firstRow.length > 1) {
          const cellB1 = firstRow[1].replace(/^"(.*)"$/, '$1');
          if (cellB1 && cellB1.trim() !== "") {
            setAdminAnnouncement(cellB1);
            localStorage.setItem('fb_admin_broadcast', cellB1);
          }
        }
      }
    } catch (err) {
      console.error("Failed to sync with Google Sheet:", err);
    }
  };

  // Theme Sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fb_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fb_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const savedCoins = localStorage.getItem('fb_user_coins');
    setCoins(savedCoins !== null ? parseInt(savedCoins) : 6); 

    const savedHistory = localStorage.getItem('fb_post_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedInstruction = localStorage.getItem('fb_admin_instruction');
    if (savedInstruction) setCustomSystemInstruction(savedInstruction);

    const savedPass = localStorage.getItem('fb_admin_password');
    setAdminPassword(savedPass || _p_conv(_SEC_KEY));

    const savedBroadcast = localStorage.getItem('fb_admin_broadcast');
    if (savedBroadcast) setAdminAnnouncement(savedBroadcast);

    const savedContact = localStorage.getItem('fb_admin_contact');
    if (savedContact) setAdminContact(savedContact);

    const savedFB = localStorage.getItem('fb_admin_facebook');
    if (savedFB) setAdminFacebook(savedFB);

    const savedTG = localStorage.getItem('fb_admin_telegram');
    if (savedTG) setAdminTelegram(savedTG);

    const savedUsedCodes = localStorage.getItem('fb_used_codes');
    if (savedUsedCodes) setUsedCodes(JSON.parse(savedUsedCodes));

    const sessionAuth = sessionStorage.getItem('fb_admin_auth');
    if (sessionAuth === 'true') {
      setIsAdminLoggedIn(true);
      setRole('admin');
    }

    const welcomeStatus = localStorage.getItem('fb_welcome_done');
    if (welcomeStatus === 'true') setIsWelcomeDone(true);

    fetchAnnouncement();
  }, []);

  // --- Handlers ---
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    setTimeout(() => setLogoClicks(0), 3000);
    if (newCount >= 6) { 
      if (isAdminLoggedIn) { setRole('admin'); } else { setShowAdminLogin(true); }
      setLogoClicks(0);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassInput === adminPassword) {
      setIsAdminLoggedIn(true);
      setShowAdminLogin(false);
      setRole('admin');
      sessionStorage.setItem('fb_admin_auth', 'true');
      setAdminPassInput('');
    } else {
      alert("PIN မှားယွင်းနေပါသည်။");
    }
  };

  const handleGenerate = async () => {
    if (coins < 2) {
      setError("Coin မလုံလောက်တော့ပါ။ Admin ကို ဆက်သွယ်ပြီး Coin ဖြည့်ပါ။");
      setShowContactModal(true);
      return;
    }
    setIsLoading(true);
    setError(null);
    setResultText(null);
    setResultImage(null);
    const request: PostRequest = { type: activeTab, topic, businessName, image: image || undefined, phoneNumber, address, tone };
    try {
      if (request.type === 'design') {
        const imgUrl = await generateFBDesign(request);
        setResultImage(imgUrl);
        updateCoins(-2);
        saveToHistory(topic || "Design Post", imgUrl, 'design', true);
      } else {
        const output = await generateFBPost(request, customSystemInstruction || undefined);
        setResultText(output);
        updateCoins(-2);
        saveToHistory(activeTab === 'topic' ? topic : "Image Post", output, activeTab);
      }
    } catch (err: any) {
      setError("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCoins = (amount: number) => {
    const newCoins = Math.max(0, coins + amount);
    setCoins(newCoins);
    localStorage.setItem('fb_user_coins', newCoins.toString());
  };

  const saveToHistory = (input: string, output: string, type: any, isImage = false) => {
    const newItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), input, output, type, isImage };
    const updated = [newItem, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('fb_post_history', JSON.stringify(updated));
  };

  const handleRedeemCode = () => {
    if (!redeemInput) return;
    const cleanInput = redeemInput.trim().toUpperCase();
    if (usedCodes.includes(cleanInput)) { alert("ဤကုဒ်ကို အသုံးပြုပြီးသားပါ။"); return; }
    
    if (cleanInput.startsWith('FBGEN-')) {
      const parts = cleanInput.split('-');
      const amt = parseInt(parts[1]);
      if (!isNaN(amt)) {
        updateCoins(amt);
        const newUsed = [...usedCodes, cleanInput];
        setUsedCodes(newUsed);
        localStorage.setItem('fb_used_codes', JSON.stringify(newUsed));
        setRedeemInput('');
        setShowRedeemModal(false);
        setError(null);
        alert(`${amt} Coins ထည့်သွင်းပြီးပါပြီ။`);
        return;
      }
    }
    alert("Voucher ကုဒ် မှားယွင်းနေပါသည်။");
  };

  if (!isWelcomeDone) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0c] flex flex-col items-center justify-center p-6 text-center transition-colors">
        <div className="bg-[#1877F2] p-8 rounded-[3.5rem] shadow-2xl mb-12 animate-in zoom-in duration-700">
           <ICONS.Facebook className="w-24 h-24 text-white" />
        </div>
        <div className="mb-14">
          <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">Facebook</h1>
          <h1 className="text-5xl font-black text-[#1877F2] tracking-tighter mb-6">Post AI</h1>
          <p className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.6em]">Social Media Assistant</p>
        </div>
        <button 
          onClick={() => { setIsWelcomeDone(true); localStorage.setItem('fb_welcome_done', 'true'); }} 
          className="w-full max-w-[300px] py-6 bg-[#1877F2] text-white font-black rounded-full shadow-3xl hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest shadow-blue-600/40"
        >
          Start Generate
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0c] text-gray-900 dark:text-white pb-24 font-sans transition-all duration-300">
      
      {adminAnnouncement && (
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white py-3.5 px-4 text-center text-[12px] font-black tracking-widest flex items-center justify-center gap-3 sticky top-0 z-[100] shadow-2xl uppercase border-b border-white/10 animate-in slide-in-from-top duration-500">
           <ICONS.Megaphone className="w-4 h-4 animate-pulse" />
           <span className="drop-shadow-sm">{adminAnnouncement}</span>
        </div>
      )}

      <header className={`h-20 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 sticky ${adminAnnouncement ? 'top-[48px]' : 'top-0'} bg-gray-50/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl z-[50]`}>
        <div className="flex items-center gap-3 cursor-pointer active:scale-95 transition-transform" onClick={handleLogoClick}>
           <div className="bg-[#1877F2] p-2 rounded-xl shadow-lg">
             <ICONS.Facebook className="w-6 h-6 text-white" />
           </div>
           <span className="font-bold text-xl tracking-tighter">Post AI</span>
        </div>

        <div className="flex items-center gap-2">
           <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white transition-all bg-gray-200/50 dark:bg-white/5 rounded-xl">
             {isDarkMode ? <ICONS.Sun className="w-5 h-5" /> : <ICONS.Moon className="w-5 h-5" />}
           </button>
           
           <div className="flex items-center gap-1.5 bg-gray-200/50 dark:bg-[#1a1c22] px-3.5 py-2 rounded-full border border-black/5 dark:border-white/5 cursor-pointer hover:bg-amber-500/10 transition-colors" onClick={() => setShowRedeemModal(true)}>
              <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <ICONS.Coin className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="text-amber-600 dark:text-amber-500 font-black text-sm">{coins}</span>
              <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[10px] text-black font-black ml-0.5 animate-pulse">+</div>
           </div>

           <button onClick={() => setShowShareModal(true)} className="p-2.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"><ICONS.Copy className="w-5 h-5" /></button>
           <button onClick={() => setShowHistory(true)} className="p-2.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"><ICONS.History className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {role === 'admin' && isAdminLoggedIn ? (
          <div className="space-y-6 animate-in fade-in duration-500 pb-20">
             <div className="flex justify-between items-center bg-white dark:bg-[#15171c] p-8 rounded-[32px] border border-black/5 dark:border-white/5 shadow-xl">
                <div>
                   <h2 className="text-2xl font-black">Admin Suite</h2>
                   <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest">Master Control Active</p>
                </div>
                <button onClick={() => { setIsAdminLoggedIn(false); setRole('user'); sessionStorage.removeItem('fb_admin_auth'); }} className="px-6 py-3 bg-red-600/10 text-red-600 dark:text-red-500 font-bold rounded-xl border border-red-500/20">Logout</button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Channel Management Card */}
                <div className="bg-white dark:bg-[#15171c] p-8 rounded-[32px] border border-black/5 dark:border-white/5 space-y-4 shadow-xl">
                   <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Channel Management</h3>
                   <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-tighter ml-2">Support Phone</label>
                        <input type="text" value={adminContact} onChange={(e) => { setAdminContact(e.target.value); localStorage.setItem('fb_admin_contact', e.target.value); }} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1f2229] border border-black/5 dark:border-white/5 rounded-xl outline-none font-bold text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-tighter ml-2">Facebook URL</label>
                        <input type="text" value={adminFacebook} onChange={(e) => { setAdminFacebook(e.target.value); localStorage.setItem('fb_admin_facebook', e.target.value); }} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1f2229] border border-black/5 dark:border-white/5 rounded-xl outline-none font-bold text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-tighter ml-2">Telegram URL</label>
                        <input type="text" value={adminTelegram} onChange={(e) => { setAdminTelegram(e.target.value); localStorage.setItem('fb_admin_telegram', e.target.value); }} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1f2229] border border-black/5 dark:border-white/5 rounded-xl outline-none font-bold text-sm" />
                      </div>
                   </div>
                </div>

                <div className="bg-white dark:bg-[#15171c] p-8 rounded-[32px] border border-black/5 dark:border-white/5 space-y-4 shadow-xl">
                   <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Voucher Forge</h3>
                   <div className="flex gap-4">
                      <input type="number" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} className="w-20 px-4 py-4 bg-gray-50 dark:bg-[#1f2229] border border-black/5 dark:border-white/5 rounded-2xl outline-none font-bold" />
                      <button onClick={() => setGeneratedCode(`FBGEN-${topUpAmount}-${Math.random().toString(36).substring(2,7).toUpperCase()}`)} className="flex-1 bg-amber-500 text-black font-bold rounded-2xl">Forge Code</button>
                   </div>
                   {generatedCode && (
                     <div className="p-4 bg-gray-100 dark:bg-black/40 rounded-2xl border border-dashed border-amber-500/30 text-center">
                        <div className="text-xl font-black text-amber-600 dark:text-amber-500 tracking-widest">{generatedCode}</div>
                        <button onClick={() => { navigator.clipboard.writeText(generatedCode); alert("Copied!"); }} className="text-[10px] font-bold text-amber-500 uppercase mt-2">Copy Code</button>
                     </div>
                   )}
                </div>

                <div className="bg-white dark:bg-[#15171c] p-8 rounded-[32px] border border-black/5 dark:border-white/5 space-y-4 shadow-xl md:col-span-2">
                   <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Remote Config (Sheet Sync)</h3>
                   <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-xl border border-dashed border-gray-300 dark:border-white/10 text-center">
                      <p className="text-xs text-gray-500 mb-2">Announcement Source: Cell B1</p>
                      <p className="text-sm font-bold">"{adminAnnouncement}"</p>
                      <button onClick={fetchAnnouncement} className="mt-4 w-full py-2 bg-blue-600 text-white text-[10px] font-bold rounded-lg uppercase shadow-lg">Manual Force Re-Sync</button>
                   </div>
                </div>

                <div className="md:col-span-2 bg-white dark:bg-[#15171c] p-8 rounded-[32px] border border-black/5 dark:border-white/5 space-y-4 shadow-xl">
                   <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Master AI Kernel</h3>
                   <textarea value={customSystemInstruction} onChange={(e) => setCustomSystemInstruction(e.target.value)} placeholder="AI Kernal Logic..." className="w-full h-48 p-6 bg-gray-50 dark:bg-[#1f2229] border border-black/5 dark:border-white/5 rounded-3xl outline-none resize-none font-mono text-xs" />
                   <button onClick={() => { localStorage.setItem('fb_admin_instruction', customSystemInstruction); alert("Kernel Committed!"); }} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl">Commit Kernel Logic</button>
                </div>
             </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-700">
             <div className="bg-white dark:bg-[#15171c] rounded-[40px] border border-black/5 dark:border-white/5 overflow-hidden shadow-2xl transition-colors">
                <div className="flex border-b border-black/5 dark:border-white/5 px-4 bg-gray-50/50 dark:bg-[#0a0a0c]/40">
                  {(['topic', 'image', 'design'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-5 flex items-center justify-center gap-2 text-sm font-bold transition-all relative ${activeTab === tab ? 'text-blue-600 dark:text-blue-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      {tab === 'topic' && <ICONS.Topic className="w-4 h-4" />}
                      {tab === 'image' && <ICONS.Image className="w-4 h-4" />}
                      {tab === 'design' && <ICONS.Sparkles className="w-4 h-4" />}
                      <span className="capitalize">{tab}</span>
                      {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500" />}
                    </button>
                  ))}
                </div>

                <div className="p-8 space-y-6">
                   <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="လုပ်ငန်းအမည်" className="w-full px-6 py-4 bg-gray-50 dark:bg-[#1f2229] border border-black/5 dark:border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20" />

                   {(activeTab === 'topic' || activeTab === 'design') && (
                     <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="ဘာအကြောင်းရေးမှာလဲ..." className="w-full h-40 px-6 py-5 bg-gray-50 dark:bg-[#1f2229] border border-black/5 dark:border-white/5 rounded-2xl outline-none resize-none focus:ring-2 focus:ring-blue-500/20" />
                   )}

                   {activeTab === 'image' && (
                     <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-square bg-gray-50 dark:bg-[#1f2229] border-2 border-dashed border-black/5 dark:border-white/5 rounded-[32px] flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                        {image ? <img src={image} className="w-full h-full object-cover" /> : (
                          <div className="text-center group-hover:scale-110 transition-transform">
                             <ICONS.Image className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Product Photo</span>
                          </div>
                        )}
                        <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onload = () => setImage(r.result as string);
                            r.readAsDataURL(file);
                          }
                        }} />
                     </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="ဖုန်းနံပါတ်" className="w-full px-6 py-4 bg-gray-50 dark:bg-[#1f2229] border border-black/5 dark:border-white/5 rounded-2xl outline-none" />
                      <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="လိပ်စာ" className="w-full px-6 py-4 bg-gray-50 dark:bg-[#1f2229] border border-black/5 dark:border-white/5 rounded-2xl outline-none" />
                   </div>

                   <select value={tone} onChange={(e) => setTone(e.target.value as ContentTone)} className="w-full px-6 py-4 bg-gray-50 dark:bg-[#1f2229] border border-black/5 dark:border-white/5 rounded-2xl outline-none font-bold text-sm">
                      {Object.entries(TONE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                   </select>

                   {error && (
                     <div className="p-4 bg-red-600/10 text-red-600 dark:text-red-500 rounded-2xl flex flex-col items-center gap-3">
                        <span className="text-xs font-black text-center">{error}</span>
                        {coins < 2 && <button onClick={() => setShowRedeemModal(true)} className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest">ဖြည့်မည် (Top-up)</button>}
                     </div>
                   )}

                   <div className="grid grid-cols-2 gap-4 pt-2">
                      <button onClick={() => setShowContactModal(true)} className="py-5 bg-gray-50 dark:bg-[#1f2229] text-gray-600 dark:text-gray-400 font-bold rounded-2xl border border-black/5 dark:border-white/5 uppercase tracking-widest text-[11px]">Support</button>
                      <button 
                        onClick={handleGenerate} 
                        disabled={isLoading} 
                        className={`py-5 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all ${isLoading ? 'bg-blue-400 cursor-not-allowed' : coins < 2 ? 'bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                         {isLoading ? <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : 
                          coins < 2 ? <><ICONS.Coin className="w-5 h-5" /> Refill Coins</> : <><ICONS.Sparkles className="w-5 h-5" /> Generate Post</>
                         }
                      </button>
                   </div>
                </div>
             </div>

             {(resultText || resultImage || isLoading) && (
               <div className="animate-in slide-in-from-bottom-6 duration-700 pb-20">
                  <div className="bg-white dark:bg-[#15171c] rounded-[40px] border border-black/5 dark:border-white/5 overflow-hidden shadow-2xl">
                     <div className="p-8 border-b border-black/5 flex items-center justify-between bg-gray-50 dark:bg-white/5">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                              {businessName.substring(0,1).toUpperCase() || 'P'}
                           </div>
                           <span className="font-bold text-lg">{businessName || 'Output'}</span>
                        </div>
                        <button onClick={() => resultText && handleCopyText(resultText, 'res')} className={`p-2.5 rounded-xl transition-colors ${copiedId === 'res' ? 'bg-emerald-600 text-white' : 'text-blue-600 bg-blue-600/10'}`}><ICONS.Copy className="w-5 h-5" /></button>
                     </div>
                     {resultImage && <div className="p-6"><img src={resultImage} className="w-full rounded-[24px] shadow-2xl" /></div>}
                     <div className="p-10 whitespace-pre-wrap text-[17px] leading-relaxed font-medium">{resultText}</div>
                  </div>
               </div>
             )}
          </div>
        )}
      </main>

      {showAdminLogin && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
           <div className="absolute inset-0" onClick={() => setShowAdminLogin(false)} />
           <div className="relative w-full max-w-xs bg-white/10 rounded-[48px] shadow-3xl p-12 border border-white/5 text-center animate-in zoom-in-95 backdrop-blur-md">
              <h3 className="text-[10px] font-bold text-white/50 mb-12 uppercase tracking-[0.5em]">A C C E S S</h3>
              <input type="password" value={adminPassInput} onChange={(e) => setAdminPassInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} placeholder="••••••" autoFocus className="w-full bg-white/10 border border-white/10 rounded-[32px] p-8 mb-10 text-white font-black text-center text-4xl tracking-widest outline-none" />
              <button onClick={handleAdminLogin} className="w-full py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl">Connect Protocol</button>
           </div>
        </div>
      )}

      {showContactModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl animate-in fade-in">
           <div className="absolute inset-0" onClick={() => setShowContactModal(false)} />
           <div className="relative w-full max-w-sm bg-white dark:bg-[#15171c] rounded-[56px] shadow-3xl p-12 border border-black/5 text-center animate-in zoom-in-95 overflow-hidden">
              <button onClick={() => setShowContactModal(false)} className="absolute top-8 right-8 text-gray-400">✕</button>
              <div className="relative z-10">
                <div className="w-24 h-24 bg-[#1877F2] rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl">
                   <ICONS.Phone className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase">SUPPORT</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">Coin ဖြည့်သွင်းရန် Admin ကို တိုက်ရိုက်ဆက်သွယ်နိုင်ပါသည်။</p>
                <div className="space-y-4">
                   <a href={`tel:${adminContact}`} className="w-full py-6 bg-[#222222] text-white font-bold rounded-[32px] flex items-center px-8 gap-6 shadow-2xl transition-transform active:scale-95"><ICONS.Phone className="w-5 h-5" /><span className="text-sm uppercase tracking-widest flex-1 text-left">Call Admin</span></a>
                   <button onClick={() => { setShowContactModal(false); setShowRedeemModal(true); }} className="w-full py-6 bg-amber-600 text-black font-black rounded-[32px] flex items-center px-8 gap-6 shadow-2xl transition-transform active:scale-95"><ICONS.Coin className="w-5 h-5" /><span className="text-sm uppercase tracking-widest flex-1 text-left">Voucher Redeem</span></button>
                   <a href={adminFacebook} target="_blank" rel="noopener noreferrer" className="w-full py-6 bg-[#1877F2] text-white font-bold rounded-[32px] flex items-center px-8 gap-6 shadow-2xl transition-transform active:scale-95"><ICONS.Facebook className="w-5 h-5" /><span className="text-sm uppercase tracking-widest flex-1 text-left">Messenger</span></a>
                   <a href={adminTelegram} target="_blank" rel="noopener noreferrer" className="w-full py-6 bg-[#24A1DE] text-white font-bold rounded-[32px] flex items-center px-8 gap-6 shadow-2xl transition-transform active:scale-95"><ICONS.Telegram className="w-5 h-5" /><span className="text-sm uppercase tracking-widest flex-1 text-left">Join Telegram</span></a>
                </div>
              </div>
           </div>
        </div>
      )}

      {showRedeemModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl animate-in fade-in">
           <div className="absolute inset-0" onClick={() => setShowRedeemModal(false)} />
           <div className="relative w-full max-w-sm bg-white dark:bg-[#15171c] rounded-[48px] p-12 border border-black/5 shadow-3xl text-center">
              <h3 className="text-xl font-black mb-4 uppercase">COIN TOP-UP</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-10">Enter Voucher Code</p>
              <input type="text" value={redeemInput} onChange={(e) => setRedeemInput(e.target.value.toUpperCase())} placeholder="FBGEN-XXXX" className="w-full px-6 py-6 bg-gray-100 dark:bg-[#1f2229] border border-black/5 rounded-[28px] outline-none mb-10 text-gray-900 dark:text-white font-black text-center text-xl tracking-[4px] uppercase" />
              <div className="flex gap-4">
                 <button onClick={() => setShowRedeemModal(false)} className="flex-1 py-5 bg-gray-100 dark:bg-white/5 text-gray-500 font-bold rounded-2xl text-xs uppercase tracking-widest">Cancel</button>
                 <button onClick={handleRedeemCode} className="flex-1 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-lg text-xs uppercase tracking-widest">Redeem</button>
              </div>
           </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-[500] flex justify-end">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
           <div className="relative w-full max-w-md bg-white dark:bg-[#0a0a0c] h-full shadow-2xl flex flex-col border-l border-black/5 animate-in slide-in-from-right duration-500">
              <div className="p-8 border-b border-black/5 flex items-center justify-between bg-gray-50 dark:bg-white/5">
                 <h2 className="text-2xl font-black tracking-tight">History</h2>
                 <button onClick={() => setShowHistory(false)} className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center text-gray-400 hover:text-red-500">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-32">
                 {history.length === 0 ? <p className="text-center opacity-10 mt-20 text-4xl font-black italic">Empty</p> :
                   history.map(item => (
                     <div key={item.id} className="bg-gray-50 dark:bg-white/5 p-6 rounded-[32px] border border-black/5 space-y-4 hover:shadow-xl transition-all group">
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{new Date(item.timestamp).toLocaleString()}</div>
                        <p className="text-sm font-bold line-clamp-2 italic pr-10">{item.input}</p>
                        {item.isImage && <img src={item.output} className="w-full h-32 object-cover rounded-2xl mb-2 shadow-lg" alt="Historical design" />}
                        <div className="flex gap-3">
                           <button onClick={() => handleCopyText(item.output, item.id)} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${copiedId === item.id ? 'bg-emerald-600 text-white' : 'bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white'}`}>
                              {copiedId === item.id ? 'Copied!' : 'Copy'}
                           </button>
                           <button onClick={() => { const newHist = history.filter(h => h.id !== item.id); setHistory(newHist); localStorage.setItem('fb_post_history', JSON.stringify(newHist)); }} className="w-10 h-10 bg-red-600/10 text-red-600 rounded-xl flex items-center justify-center border border-red-500/20 hover:bg-red-600 hover:text-white"><ICONS.Trash className="w-4 h-4" /></button>
                        </div>
                     </div>
                   ))
                 }
              </div>
           </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-300">
           <div className="absolute inset-0" onClick={() => setShowShareModal(false)} />
           <div className="relative w-full max-w-sm bg-white dark:bg-[#15171c] rounded-[60px] shadow-3xl p-14 border border-black/5 text-center animate-in zoom-in-95">
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase">SHARE</h3>
              <div className="bg-white p-6 rounded-[40px] mb-10 shadow-2xl border-[8px] border-black inline-block transform rotate-3 hover:rotate-0 transition-transform duration-500">
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}`} className="w-40 h-40" alt="QR" />
              </div>
              <div className="flex justify-center gap-6 mb-12">
                 <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" className="p-4 bg-blue-600/10 rounded-2xl text-blue-600 hover:scale-110 transition-transform"><ICONS.Facebook className="w-7 h-7" /></a>
                 <a href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}`} target="_blank" className="p-4 bg-indigo-600/10 rounded-2xl text-indigo-400 hover:scale-110 transition-transform"><ICONS.Telegram className="w-7 h-7" /></a>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Close</button>
           </div>
        </div>
      )}

      {!isAdminLoggedIn && (
        <footer className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 dark:bg-[#0a0a0c]/90 backdrop-blur-3xl border-t border-black/5 flex items-center justify-around px-8 z-[100] transition-colors">
           <button onClick={() => setShowShareModal(true)} className="flex flex-col items-center gap-1.5 group">
              <ICONS.Copy className="w-6 h-6 text-gray-400 group-hover:text-[#1877F2] dark:group-hover:text-white transition-colors" />
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#1877F2] dark:group-hover:text-white uppercase tracking-widest">Share</span>
           </button>
           <button onClick={() => setShowContactModal(true)} className="flex flex-col items-center gap-1.5 group">
              <ICONS.Topic className="w-6 h-6 text-gray-400 group-hover:text-[#1877F2] dark:group-hover:text-white transition-colors" />
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#1877F2] dark:group-hover:text-white uppercase tracking-widest">Support</span>
           </button>
           <button onClick={() => setShowHistory(true)} className="flex flex-col items-center gap-1.5 group">
              <ICONS.History className="w-6 h-6 text-gray-400 group-hover:text-[#1877F2] dark:group-hover:text-white transition-colors" />
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#1877F2] dark:group-hover:text-white uppercase tracking-widest">History</span>
           </button>
           <button onClick={() => setShowRedeemModal(true)} className="flex flex-col items-center gap-1.5 group">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-black font-black text-xs shadow-sm">+</div>
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#1877F2] dark:group-hover:text-white uppercase tracking-widest">Coin</span>
           </button>
        </footer>
      )}
    </div>
  );
};
