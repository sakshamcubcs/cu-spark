import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import DiscoverCard from './components/DiscoverCard';
import MatchesList from './components/MatchesList';
import ChatView from './components/ChatView';
import MyProfile from './components/MyProfile';
import AuthModal from './components/AuthModal';
import CallModal from './components/CallModal';
import MatchCelebrationModal from './components/MatchCelebrationModal';

function MainApp() {
  const { user, token, loading } = useAuth();

  const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'matches' | 'profile'
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [discoverList, setDiscoverList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeCelebration, setActiveCelebration] = useState(null);
  const [matchCount, setMatchCount] = useState(0);
  const [privacyMode, setPrivacyMode] = useState(false);

  // Fetch Discover list
  const fetchDiscover = () => {
    if (!token) return;
    fetch('/api/matches/discover', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.users) {
          setDiscoverList(data.users);
          setCurrentIndex(0);
        }
      })
      .catch(console.error);
  };

  // Fetch match count
  const fetchMatchCount = () => {
    if (!token) return;
    fetch('/api/matches/list', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.matches) {
          setMatchCount(data.matches.length);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (token) {
      fetchDiscover();
      fetchMatchCount();
    }
  }, [token, user?.id]);

  // Handle Swipe
  const handleSwipe = async (targetUserId, type) => {
    try {
      const res = await fetch('/api/matches/swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ toUserId: targetUserId, type })
      });
      const data = await res.json();

      if (data.success && data.isMatch && data.match) {
        // Trigger It's a Match celebration!
        setActiveCelebration(data.match);
        fetchMatchCount();
      }

      // Move to next card
      setCurrentIndex(prev => prev + 1);
    } catch (err) {
      console.error('Swipe error:', err);
    }
  };

  // Keyboard navigation for card swiping
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== 'discover' || currentIndex >= discoverList.length) return;
      const currentStudent = discoverList[currentIndex];
      if (!currentStudent) return;

      if (e.key === 'ArrowLeft') {
        handleSwipe(currentStudent.id, 'pass');
      } else if (e.key === 'ArrowRight') {
        handleSwipe(currentStudent.id, 'like');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, currentIndex, discoverList]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-full border-4 border-rose-500 border-t-transparent animate-spin mb-4" />
        <p className="text-xs text-rose-300 font-mono">Loading CU Spark...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const currentStudent = discoverList[currentIndex];

  return (
    <div className={`min-h-screen bg-slate-950 text-white flex flex-col relative transition-all duration-300 ${privacyMode ? 'filter blur-md select-none pointer-events-none' : ''}`}>
      {/* Top Navbar */}
      <Navbar
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
        onOpenProfile={() => {
          setSelectedMatchId(null);
          setActiveTab('profile');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 pb-24 flex flex-col justify-center">
        {activeTab === 'discover' && (
          <div className="w-full">
            <DiscoverCard
              student={currentStudent}
              onSwipe={handleSwipe}
            />
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="w-full">
            {selectedMatchId ? (
              <ChatView
                matchId={selectedMatchId}
                onBack={() => {
                  setSelectedMatchId(null);
                  fetchMatchCount();
                }}
              />
            ) : (
              <MatchesList
                onSelectMatch={(id) => setSelectedMatchId(id)}
              />
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="w-full">
            <MyProfile />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedMatchId(null);
          setActiveTab(tab);
        }}
        matchCount={matchCount}
      />

      {/* WebRTC Video & Audio Call Modal */}
      <CallModal />

      {/* Match Celebration Modal */}
      {activeCelebration && (
        <MatchCelebrationModal
          match={activeCelebration}
          onClose={() => setActiveCelebration(null)}
          onStartChat={(matchId) => {
            setActiveCelebration(null);
            setSelectedMatchId(matchId);
            setActiveTab('matches');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
