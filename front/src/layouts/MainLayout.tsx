import { useLocation } from 'react-router-dom';
import ChatPage from '@/pages/ChatPage';
import FeedPage from '@/pages/FeedPage';
import ProfilePage from '@/pages/ProfilePage';
import { useEffect, useRef, useState } from 'react';
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

  const feedRef    = useRef<HTMLDivElement>(null);
  const chatRef    = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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

  // Usar `inert` para desactivar completamente la interactividad de las páginas
  // inactivas, incluyendo canvas y elementos con handlers DOM directos.
  // `pointer-events-none` en CSS no bloquea descendientes con handlers de DOM.
  useEffect(() => {
    const pages = [
      { ref: feedRef,    path: '/feed' },
      { ref: chatRef,    path: '/chat' },
      { ref: profileRef, path: '/profile' },
    ];
    for (const { ref, path } of pages) {
      if (!ref.current) continue;
      if (location.pathname === path) {
        ref.current.removeAttribute('inert');
      } else {
        ref.current.setAttribute('inert', '');
      }
    }
  }, [location.pathname]);

  const pageClass = (path: string) =>
    `absolute inset-0 w-full h-full overflow-y-auto transition-opacity duration-300 ${
      location.pathname === path ? 'opacity-100 z-10' : 'opacity-0 z-0'
    }`;

  return (
    <>
      {(!game || loading) && <Spinner />}
      {game && (
        <div className="relative w-full h-screen flex flex-col overflow-hidden">
          <LayoutNavBar />
          
          <main className="flex-1 relative overflow-hidden">
            <div ref={feedRef} className={pageClass('/feed')}>
              <FeedPage />
            </div>
            
            <div ref={chatRef} className={pageClass('/chat')}>
              <ChatPage />
            </div>

            <div ref={profileRef} className={pageClass('/profile')}>
              <ProfilePage />
            </div>
          </main>
        </div>
      )}
    </>
  );
};

export default MainLayout;
