import { useLocation } from 'react-router-dom';
import ChatPage from '@/pages/ChatPage';
import FeedPage from '@/pages/FeedPage';
import MyProfilePage from '@/pages/MyProfilePage';
import UserProfilePage from '@/pages/UserProfilePage';
import { useEffect, useRef, useState } from 'react';
import { gameEventEmitter } from '@/emitters/GameEventEmitter';
import { GameEvent } from '@/enums/GameEvent';
import Spinner from '@/components/Spinner';
import { useGame } from '@/contexts/GameContext';
import Game from '@/models/logic/Game';
import LayoutNavBar from '@/components/LayoutNavBar';
import LookEditor from '@/components/LookEditor';
import { useAuth } from '@/providers/AuthProvider';
import apiService from '@/services/apiService';
import type { AuthUser } from '@/types/AuthUser';
import { parseLook, randomLook, serializeLook } from '@/models/others/avatar/Look';
import { assets } from '@/models/others/Assets';

const MainLayout = () => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const game: Game | null = useGame();
  const auth = useAuth();
  const [choosingLook, setChoosingLook] = useState(false);
  const lookChecked = useRef(false);

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

  // Quien entra sin un aspecto válido (cuenta nueva o un nombre antiguo de Habbo) elige uno.
  // Los usuarios demo reciben uno aleatorio para entrar directos.
  useEffect(() => {
    const user = auth.user;
    if (loading || !game || !user || lookChecked.current) return;
    lookChecked.current = true;
    // Sin WebGL no se puede ver el configurador: esos usuarios se quedan con la silueta base
    if (parseLook(user.look) !== null || !assets.canGenerateAvatars) return;
    if (user.demo) {
      apiService.patch<AuthUser>('/users/me', { look: serializeLook(randomLook()) })
        .then(updated => {
          auth.updateUser(updated);
          game.updatePlayer(updated);
        })
        .catch(() => {});
    } else {
      setChoosingLook(true);
    }
  }, [loading, game, auth]);

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

  // Perfil de otro usuario (/u/<usuario>). A diferencia de las otras páginas, no se queda montado:
  // solo existe mientras se está viendo.
  const viewedUsername: string | null = location.pathname.startsWith('/u/')
    ? decodeURIComponent(location.pathname.slice(3))
    : null;

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
              <MyProfilePage />
            </div>

            {viewedUsername && (
              <div className="absolute inset-0 w-full h-full overflow-y-auto z-10">
                <UserProfilePage key={viewedUsername} username={viewedUsername} />
              </div>
            )}
          </main>
        </div>
      )}
      {choosingLook && <LookEditor firstTime onClose={() => setChoosingLook(false)} />}
    </>
  );
};

export default MainLayout;
