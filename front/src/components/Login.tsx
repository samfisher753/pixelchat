import { useGame } from '@/contexts/GameContext';
import { gameEventEmitter } from '@/emitters/GameEventEmitter';
import { useEffect, useRef, useState } from 'react';
import { GameEvent } from '@/enums/GameEvent';
import logo from '@/assets/logo-pixelchat.svg';
import { ArrowRight, User } from "lucide-react";

const Login = () => {

  const MAX_NICK_LENGTH: number = 15;
  const [nickname, setNickname] = useState("");
  const game = useGame();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {

    const handleErrorOnPlayerLogin = (error: number) => {
      if (error === 1)
        alert('El nombre debe tener una longitud de entre 4 y 15 carácteres.');
      else if (error === 2)
        alert('El nombre está siendo usado por otro jugador.');
    };

    gameEventEmitter.on(GameEvent.ErrorOnPlayerLogin, handleErrorOnPlayerLogin);

    if (inputRef.current) {
      inputRef.current.focus();
    }

    return () => {
      gameEventEmitter.off(GameEvent.ErrorOnPlayerLogin, handleErrorOnPlayerLogin);
    };
  }, []);

  const doLogin = () => {
    if (nickname != "") {
      game.login(nickname);
    }
  };

  const onChangeNickname = (e) => {
    const nick = e.target.value.trim();
    if (nick.length <= MAX_NICK_LENGTH) {
      setNickname(nick);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      doLogin();
    }
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E] flex flex-col justify-center items-center p-4 font-sans pointer-events-auto">
      <div className="w-full max-w-md bg-[#2C2C2C] rounded-3xl shadow-2xl overflow-hidden border border-[#383838]">
        <div className="p-8">
          <div className="flex justify-center mb-8 mx-auto w-fit">
            <img src={logo} alt="PixelChat Logo" className="h-40 object-contain drop-shadow-md" />
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">Bienvenido de nuevo</h2>
          <p className="text-neutral-400 text-center mb-8">Conéctate a tu mundo 2D</p>

          <div onKeyDown={onKeyDown} className="space-y-5">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-neutral-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-[#383838] rounded-xl leading-5 bg-[#1E1E1E] text-white placeholder-neutral-500 focus:outline-none focus:border-[#022F72] focus:ring-1 focus:ring-[#022F72] transition-colors"
                placeholder="Apodo"
                value={nickname}
                onChange={onChangeNickname}
                ref={inputRef}
                required
              />
            </div>
          </div>

          <button
            onClick={doLogin}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#022F72] hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#2C2C2C] focus:ring-[#022F72] transition-all"
          >
            Entrar <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        </div>

        <div className="px-8 py-6 bg-[#252525] border-t border-[#383838] text-center">
        </div>
      </div>
    </div>
  );
};

export default Login;