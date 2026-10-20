import React, { useState, useRef } from 'react';
import { 
  User, CheckCircle, Camera, GraduationCap, MapPin, Sparkles, 
  Save, LogOut, Heart, Shield, Plus, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CU_DEPARTMENTS = [
  'B.Tech Computer Science (CSE)',
  'B.Tech AI & Data Science',
  'B.Tech Mechanical Engineering',
  'B.Tech Electronics (ECE)',
  'BBA (Apex Institute)',
  'MBA (University School of Business)',
  'B.A. LL.B (Legal Studies)',
  'B.Sc Biotechnology',
  'Bachelor of Design (UI/UX / Animation)',
  'B.Pharmacy',
  'Journalism & Mass Comm'
];

const CU_BLOCKS = [
  'Academic Block 1 (North Campus)',
  'Academic Block 2 (North Campus)',
  'Academic Block 3 (Engineering)',
  'Academic Block 4 (Research)',
  'Block B (South Campus)',
  'Block C (Legal & Management)',
  'Apex Block (South Campus)'
];

const AVAILABLE_INTERESTS = [
  'Coding', 'Chandigarh Cafes', 'Kasauli Road Trips', 'Hostel Maggi',
  'Gym & Fitness', 'Bhangra', 'Bollywood', 'Guitar', 'Photography',
  'Gaming', 'Anime', 'Sukhna Lake', 'AI & Tech', 'Debate & Law',
  'Poetry', 'Design & Art', 'Indie Music', 'Sports'
];

export default function MyProfile() {
  const { user, updateProfile, uploadPhoto, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age || 20);
  const [gender, setGender] = useState(user?.gender || 'male');
  const [interestedIn, setInterestedIn] = useState(user?.interestedIn || 'female');
  const [department, setDepartment] = useState(user?.department || CU_DEPARTMENTS[0]);
  const [year, setYear] = useState(user?.year || '3rd Year');
  const [block, setBlock] = useState(user?.block || CU_BLOCKS[0]);
  const [bio, setBio] = useState(user?.bio || '');
  const [interests, setInterests] = useState(user?.interests || []);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef(null);

  const toggleInterest = (tag) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter(t => t !== tag));
    } else {
      if (interests.length < 8) {
        setInterests([...interests, tag]);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name,
        age: Number(age),
        gender,
        interestedIn,
        department,
        year,
        block,
        bio,
        interests
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await uploadPhoto(file);
      } catch (err) {
        alert('Photo upload failed: ' + err.message);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-5 pb-20 select-none">
      {/* Profile Card Header */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 text-center relative overflow-hidden">
        {/* Glow behind avatar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-rose-500/20 rounded-full blur-2xl" />

        <div className="relative inline-block mb-3">
          <img
            src={user?.photos?.[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
            alt={user?.name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-rose-500/50 shadow-xl"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg cursor-pointer"
            title="Upload photo"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        <h3 className="text-xl font-bold text-white flex items-center justify-center gap-1.5">
          {user?.name || 'Set your name'}
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        </h3>
        <p className="text-xs text-rose-300 mt-0.5">{user?.email}</p>

        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-[11px] font-medium border border-emerald-500/20 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Verified Chandigarh University Student
          </span>
        </div>
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleSave} className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
          <User className="w-4 h-4 text-rose-400" />
          Academic & Personal Details
        </h4>

        {/* Name and Age */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-[11px] font-medium text-gray-400 block mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-rose-500/50"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-400 block mb-1">Age</label>
            <input
              type="number"
              value={age}
              min={18}
              max={30}
              onChange={(e) => setAge(e.target.value)}
              className="w-full bg-slate-800 text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-rose-500/50"
              required
            />
          </div>
        </div>

        {/* Gender & Looking For */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-gray-400 block mb-1">I am a</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-slate-800 text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-rose-500/50"
            >
              <option value="male">Man</option>
              <option value="female">Woman</option>
              <option value="nonbinary">Non-binary</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-400 block mb-1">Looking for</label>
            <select
              value={interestedIn}
              onChange={(e) => setInterestedIn(e.target.value)}
              className="w-full bg-slate-800 text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-rose-500/50"
            >
              <option value="female">Women</option>
              <option value="male">Men</option>
              <option value="everyone">Everyone</option>
            </select>
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="text-[11px] font-medium text-gray-400 block mb-1">CU Department / Program</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-slate-800 text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-rose-500/50"
          >
            {CU_DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Year & Campus Block */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-gray-400 block mb-1">Year of Study</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-slate-800 text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-rose-500/50"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="Post-Graduate">Post-Graduate</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-gray-400 block mb-1">Campus Block</label>
            <select
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              className="w-full bg-slate-800 text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-rose-500/50"
            >
              {CU_BLOCKS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="text-[11px] font-medium text-gray-400 block mb-1">Bio / Campus Vibe</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell other students about your campus interests, favorite spots, and what you're looking for..."
            className="w-full bg-slate-800 text-xs text-white p-3 rounded-xl border border-white/10 outline-none focus:border-rose-500/50 resize-none placeholder:text-gray-500"
          />
        </div>

        {/* Interests Cloud */}
        <div>
          <label className="text-[11px] font-medium text-gray-400 block mb-1">
            Interests & Hobbies ({interests.length}/8 selected)
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
            {AVAILABLE_INTERESTS.map(tag => {
              const selected = interests.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    selected
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                      : 'bg-slate-800 text-gray-300 border-white/10 hover:border-rose-500/40'
                  }`}
                >
                  {tag} {selected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-500 text-white font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-rose-500/25"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving Profile...' : savedSuccess ? 'Profile Saved! ✨' : 'Save Changes'}
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className="w-full py-2.5 rounded-2xl bg-slate-800 text-gray-400 hover:text-rose-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </form>
    </div>
  );
}
