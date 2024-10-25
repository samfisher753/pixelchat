import { useGame } from '@/contexts/GameContext';
import { gameEventEmitter } from '@/emitters/GameEventEmitter';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEvent } from '@/enums/GameEvent';

const Login = () => {

  const MAX_NICK_LENGTH: number = 15;
  const [nickname, setNickname] = useState("");
  const game = useGame();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    gameEventEmitter.on(GameEvent.ErrorOnPlayerLogin, handleErrorOnPlayerLogin);

    if (inputRef.current) {
      inputRef.current.focus();
    }

    return () => {
      gameEventEmitter.off(GameEvent.ErrorOnPlayerLogin, handleErrorOnPlayerLogin);
    };
  }, []);

  const doLogin = useCallback(() => {
    if (nickname != "") {
      game.login(nickname);
    }
  }, [nickname]);

  const onChangeNickname = useCallback((e) => {
    const nick = e.target.value.trim();
    if (nick.length <= MAX_NICK_LENGTH) {
      setNickname(nick);
    }
  }, []);

  const onKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      doLogin();
    }
  }, [nickname]);

  const handleErrorOnPlayerLogin = useCallback((error: number) => {
    if (error === 1) 
      alert('El nombre debe tener una longitud de entre 4 y 15 carácteres.');
    else if (error === 2)
      alert('El nombre está siendo usado por otro jugador.');
  }, []);

  return (
    <div className='absolute w-full h-full flex justify-center items-center pointer-events-auto'>
      <div onKeyDown={onKeyDown} className='bg-lightGrey border border-black w-[300px] p-1.5 rounded-xl flex flex-col items-center py-8'>
        <input 
          className='text-center w-[210px] rounded-md border border-black text-base font-bold py-1.5 px-3 text-black'
          placeholder='Apodo' 
          value={nickname} 
          onChange={onChangeNickname}
          ref={inputRef}>
        </input>
        <button 
          className="mt-7 bg-darkGrey border border-black text-white w-[230px] h-[47px] text-base rounded-md"
          onClick={doLogin}>
          Entrar
        </button>
      </div>
    </div>
  );
};

export default Login;