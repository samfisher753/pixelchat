import { MAX_MSG_LENGTH } from "@/constants/constants";
import { wavRecorder } from "@/models/others/WavRecorder";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Mic } from "lucide-react";
import { useGame } from "@/contexts/GameContext";

const ChatInput = () => {

  const [msg, setMsg] = useState<string>("");
  const inputRef: React.RefObject<HTMLInputElement> = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState<boolean>(false);
  const [micAvailable, setMicAvailable] = useState<boolean>(wavRecorder.available);
  const game = useGame();

  useEffect(() => {
    const unsubscribe = wavRecorder.onAvailableChange((available) => {
      setMicAvailable(available);
    });

    focusInput();

    const stopAndSendRecording = () => {
      if (wavRecorder.recording) {
        const file: any = wavRecorder.stop();
        game!.sendVoiceNote(file);
        setRecording(false);
      }
    };
  
    const onKeyDown = function (this: Window, e: KeyboardEvent) {
      if (wavRecorder.recording && e.key === "Escape") {
        wavRecorder.cancel();
        setRecording(false);
      }
    };

    window.addEventListener("mouseup", stopAndSendRecording);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mouseup", stopAndSendRecording);
      window.removeEventListener("keydown", onKeyDown);
      unsubscribe();
    };
  },[]);

  const focusInput = () => {
    if (inputRef.current) {
      const ua: string = navigator.userAgent.toLowerCase();
      const isAndroid: boolean = ua.includes('android');
      const isIPhone = (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i));
      if (!isAndroid && !isIPhone) inputRef.current.focus();
    }
  };

  const handleMsgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsg(e.target.value);
  };

  const handleSendMsg = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && msg !== "") {
      game!.sendMsg(msg);
      setMsg("");
    }
  };

  const startRecording = () => {
    wavRecorder.start();
    setRecording(true);
  };

  return (
    <div className="absolute left-1/3 top-0 h-full flex items-center gap-2">

      <button type="button" disabled={!micAvailable}
        title={micAvailable ? 'Mantén pulsado para grabar una nota de voz' : 'Micrófono no disponible'}
        aria-label="Grabar nota de voz"
        className={clsx("flex items-center justify-center w-9 h-9 rounded-lg border transition-colors",
          {"opacity-40 cursor-default bg-[#383838] border-[#444444] text-neutral-400": !micAvailable,
            "cursor-pointer bg-[#383838] hover:bg-[#444444] border-[#444444] text-white": micAvailable && !recording,
            "bg-red-500 border-red-400 text-white animate-pulse": recording
          })}
        onMouseDown={startRecording}>
        <Mic className="w-4 h-4" />
      </button>

      <input ref={inputRef} type="text" value={msg} onChange={handleMsgChange}
        maxLength={MAX_MSG_LENGTH}
        placeholder="Escribe un mensaje…"
        aria-label="Mensaje"
        className="h-9 w-[500px] max-w-[calc(66vw-60px)] px-3 bg-[#1E1E1E] text-white text-sm placeholder-neutral-500 rounded-lg border border-[#383838] outline-none focus:border-pixelchatBlue focus:ring-1 focus:ring-pixelchatBlue transition-colors"
        onBlur={focusInput}
        onKeyDown={handleSendMsg}
        ></input>

    </div>
  );
};

export default ChatInput;