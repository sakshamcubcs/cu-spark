import React, { useState } from 'react';
import { Heart, X, Star, MapPin, GraduationCap, CheckCircle, Sparkles, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

export default function DiscoverCard({ student, onSwipe }) {
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-[520px] text-center px-6 glass-panel rounded-3xl border border-white/10">
        <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
          <Sparkles className="w-10 h-10 text-rose-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">You're all caught up!</h3>
        <p className="text-sm text-gray-400 max-w-xs mb-6">
          You've explored all active Chandigarh University profiles for now. Check back soon or switch students to test from another profile!
        </p>
      </div>
    );
  }

  const photos = student.photos && student.photos.length > 0
    ? student.photos
    : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'];

  const nextPhoto = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="relative w-full max-w-sm mx-auto h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900 select-none flex flex-col justify-between">
      {/* Photo Carousel */}
      <div className="absolute inset-0">
        <img
          src={photos[photoIndex]}
          alt={student.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />

        {/* Photo Indicators */}
        {photos.length > 1 && (
          <div className="absolute top-3 left-4 right-4 flex gap-1.5 z-10">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  idx === photoIndex ? 'bg-white shadow-md' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Photo Navigation Click Zones */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/80 transition-all z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/80 transition-all z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Top Badges */}
      <div className="relative z-10 p-4 pt-6 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-emerald-300 text-xs font-medium border border-emerald-500/30">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          Verified CU Student
        </span>

        {student.block && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-gray-300 text-xs border border-white/10">
            <MapPin className="w-3 h-3 text-rose-400" />
            {student.block.split('(')[0]}
          </span>
        )}
      </div>

      {/* Card Content Information */}
      <div className="relative z-10 p-5 space-y-3">
        {/* Name and Age */}
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">{student.name}</h2>
            <span className="text-xl font-medium text-gray-300">{student.age}</span>
          </div>

          {/* Academic Department & Year */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-rose-200/90 mt-1">
            <span className="flex items-center gap-1 font-medium">
              <GraduationCap className="w-3.5 h-3.5 text-rose-400" />
              {student.department}
            </span>
            <span>•</span>
            <span className="text-gray-300">{student.year}</span>
          </div>
        </div>

        {/* Mutual Interests Highlight Banner */}
        {student.commonInterests && student.commonInterests.length > 0 && (
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-500/20 via-pink-500/15 to-purple-500/20 border border-rose-500/30 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              Mutual Interests ({student.commonInterests.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {student.commonInterests.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-rose-500/30 text-white text-[11px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {student.bio && (
          <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed bg-black/40 p-2.5 rounded-xl border border-white/5">
            "{student.bio}"
          </p>
        )}

        {/* Other Interest Tags */}
        <div className="flex flex-wrap gap-1.5 max-h-14 overflow-hidden">
          {student.interests?.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-slate-800/80 text-gray-300 text-[10px] border border-white/10"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Action Swipe Buttons */}
        <div className="pt-2 flex items-center justify-center gap-5">
          {/* Pass */}
          <button
            onClick={() => onSwipe(student.id, 'pass')}
            className="w-14 h-14 rounded-full bg-slate-800/90 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-lg"
            title="Pass (Left Arrow)"
          >
            <X className="w-7 h-7" />
          </button>

          {/* Super Like */}
          <button
            onClick={() => onSwipe(student.id, 'superlike')}
            className="w-12 h-12 rounded-full bg-slate-800/90 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-lg"
            title="Super Like"
          >
            <Star className="w-6 h-6 fill-amber-400/20" />
          </button>

          {/* Like */}
          <button
            onClick={() => onSwipe(student.id, 'like')}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 text-white hover:brightness-110 hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-rose-500/30"
            title="Like (Right Arrow)"
          >
            <Heart className="w-7 h-7 fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
