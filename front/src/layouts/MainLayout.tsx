import { useLocation } from 'react-router-dom';
import ChatPage from '@/pages/ChatPage';
import FeedPage from '@/pages/FeedPage';
import ProfilePage from '@/pages/ProfilePage';
import { useEffect, useState } from 'react';
import { gameEventEmitter } from '@/emitters/GameEventEmitter';
import { GameEvent } from '@/enums/GameEvent';
import Spinner from '@/components/Spinner';
import { useGame } from '@/contexts/GameContext';
import Game from '@/models/logic/Game';
import LayoutNavBar from '@/components/LayoutNavBar';

const MainLayout = () => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const game: Game | null = useGame();

  useEffect(() => {

    const handleLoading = (loading: boolean) => {
      setLoading(loading);
    };
    
    gameEventEmitter.on(GameEvent.Loading, handleLoading);

    return () => {
      gameEventEmitter.off(GameEvent.Loading, handleLoading);
    };
  }, []);

  useEffect(() => {
    if (game) {
      game.createInfoSpans();
    }
  }, [game]);

  return (
    <>
      {(!game || loading) && <Spinner />}
      {game && (
        <div className="relative w-full h-screen flex flex-col overflow-hidden">
          <LayoutNavBar />
          
          <main className="flex-1 relative overflow-hidden">
            <div className={`absolute inset-0 w-full h-full overflow-y-auto transition-opacity duration-300 ${location.pathname === '/feed' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
              <FeedPage />
            </div>
            
            <div className={`absolute inset-0 w-full h-full overflow-y-auto transition-opacity duration-300 ${location.pathname === '/chat' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
              <ChatPage />
            </div>

            <div className={`absolute inset-0 w-full h-full overflow-y-auto transition-opacity duration-300 ${location.pathname === '/profile' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
              <ProfilePage />
            </div>
          </main>
        </div>
      )}
    </>
  );
};

export default MainLayout;