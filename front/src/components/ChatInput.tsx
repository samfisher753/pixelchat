import { MAX_MSG_LENGTH } from "@/constants/constants";
import { wavRecorder } from "@/models/others/WavRecorder";
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { chat } from "@/models/logic/Chat";

const ChatInput = () => {

  const [msg, setMsg] = useState<string>("");
  const inputRef: React.RefObject<HTMLInputElement> = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState<boolean>(false);

  useEffect(() => {
    focusInput();

    window.addEventListener("mouseup", stopAndSendRecording);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mouseup", stopAndSendRecording);
      window.removeEventListener("keydown", onKeyDown);
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

  const handleMsgChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMsg(e.target.value);
  }, []);

  const handleSendMsg = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && msg !== "") {
      chat.sendMsg(msg);
      setMsg("");
    }
  }, [msg]);

  const startRecording = useCallback(() => {
    wavRecorder.start();
    setRecording(true);
  }, []);

  const stopAndSendRecording = useCallback(() => {
    if (wavRecorder.recording) {
      const file: any = wavRecorder.stop();
      chat.sendVoiceNote(file);
      setRecording(false);
    }
  }, []);

  const onKeyDown = useCallback(function (this: Window, e: KeyboardEvent) {
    if (wavRecorder.recording && e.key === "Escape") {
      wavRecorder.cancel();
      setRecording(false);
    }
  }, []);

  return (
    <div className="absolute left-1/3 bottom-0">

      <button disabled={!wavRecorder.available}
        className={clsx("relative pt-[3px] pr-[3px] pb-0 pl-[3px] mr-[10px] bg-micButton rounded-md", 
          {"opacity-30 cursor-default": !wavRecorder.available,
            "cursor-pointer": wavRecorder.available,
            "bg-micButtonActive": recording
          })}
        onMouseDown={startRecording}>
        <img src="/assets/icons/mic.png" />
      </button>

      <input ref={inputRef} type="text" value={msg} onChange={handleMsgChange}
        maxLength={MAX_MSG_LENGTH}
        className="absolute text-left bottom-[10px] w-[500px] h-[25px] bg-white text-black rounded"
        onBlur={focusInput}
        onKeyDown={handleSendMsg}
        ></input>

    </div>
  );
};

export default ChatInput;