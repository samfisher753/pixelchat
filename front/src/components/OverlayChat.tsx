import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import { GameEvent } from "@/enums/GameEvent";
import { Msg } from "@/types/Msg";
import { useEffect, useRef, useState } from "react";
import ChatMsg from "./ChatMsg/ChatMsg";
import { Pos } from "@/types/Pos";
import { grid } from "@/models/logic/Grid";
import { useGame } from "@/contexts/GameContext";

const OverlayChat = () => {

  const game = useGame();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [unloadedMsgs, setUnloadedMsgs] = useState<Msg[]>([]);
  const msgsRefs = useRef<(HTMLDivElement | null)[]>([]);
  const unloadedMsgsRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playerPosRefs = useRef<(HTMLImageElement | null)[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const vel: number = 1.5;
  let t: number = -1;
  const adjustX: number = 32;
  const moveUp: number = 23;

  useEffect(() => {

    const handleNewMessage = (msg: Msg) => {
      if (msg.type === "info") return;
      msg = JSON.parse(JSON.stringify(msg));
      setUnloadedMsgs((prevMessages) => [...prevMessages, msg]);
    };

    gameEventEmitter.on(GameEvent.AddMessage, handleNewMessage);
    gameEventEmitter.on(GameEvent.UpdateOverlayChat, update);
    gameEventEmitter.on(GameEvent.DrawOverlayChat, draw);

    return () => {
      gameEventEmitter.off(GameEvent.AddMessage, handleNewMessage);
      gameEventEmitter.offAll(GameEvent.UpdateOverlayChat);
      gameEventEmitter.offAll(GameEvent.DrawOverlayChat);
    };
  }, []);

  useEffect(() => {
    gameEventEmitter.offAll(GameEvent.UpdateOverlayChat);
    gameEventEmitter.offAll(GameEvent.DrawOverlayChat);
    gameEventEmitter.on(GameEvent.UpdateOverlayChat, update);
    gameEventEmitter.on(GameEvent.DrawOverlayChat, draw);
  }, [msgs]);

  useEffect(() => {
    if (unloadedMsgsRefs.current) {
      for (let i = 0; i < unloadedMsgsRefs.current.length; ++i) {
        const ref: HTMLDivElement | null = unloadedMsgsRefs.current[i];
        if (ref) {
          const msg: Msg = unloadedMsgs[i];
          msg.width = ref.offsetWidth;
          msg.height = ref.offsetHeight;
          msg.dx = adjustX - (msg.width / 2);
          msg.dy = -msg.height;
          msg.pos = game.room!.players[msg.player!.id].pos!;
          msg.playerObject = game.room!.players[msg.player!.id];
          const dp: Pos = grid.drawPos[msg.pos!.y][msg.pos!.x];
          msg.left = dp.x + msg.dx;
          msg.top = game.defaultY! + msg.dy;
          msg.loaded = true;
        }
      }
      if (unloadedMsgs.length > 0) {
        const stillUnloaded: Msg[] = unloadedMsgs.filter((msg) => !msg.loaded);
        const loaded: Msg[] = unloadedMsgs.filter((msg) => msg.loaded);
        setUnloadedMsgs(stillUnloaded);
        for (const msg of loaded) addMsg(msg);
      }
    }
  }, [unloadedMsgs]);

  const update = () => {
    ++t;

    if (t >= 360 / vel) {
      // Move all msgs 1 pos up
      for (let msg of msgs) {
        msg.dy! -= moveUp;
      }
      t = 0;
      clean();
    }
  };

  const draw = () => {
    if (msgs.length > 0) {
      for (let i = 0; i < msgs.length; ++i) {
        const ref: HTMLDivElement = msgsRefs.current[i]!;
        const msg: Msg = msgs[i];
        const dp: Pos = grid.drawPos[msg.pos!.y][msg.pos!.x];
        msg.left = dp.x + msg.dx!;
        msg.top = game.defaultY! + msg.dy!;
        ref.style.left = msg.left + 'px';
        ref.style.top = msg.top + 'px';
        // Player pos reference image
        const playerPosImageWidth: number = 9;
        const borderRadius: number = 6;
        const leftLimit: number = msg.left + borderRadius;
        const rightLimit: number = msg.left + msg.width! - borderRadius;
        const playerPosRef: HTMLImageElement = playerPosRefs.current[i]!;
        playerPosRef.style.position = 'fixed';
        const playerPosDp: Pos = grid.drawPos[msg.playerObject!.pos!.y][msg.playerObject!.pos!.x];
        let playerPosX: number = playerPosDp.x + adjustX + msg.playerObject!.walkd!.x - 4;
        if (playerPosX < leftLimit) playerPosX = leftLimit;
        else if (playerPosX + playerPosImageWidth > rightLimit) playerPosX = rightLimit - playerPosImageWidth;
        playerPosRef.style.left = playerPosX + 'px';
        playerPosRef.style.top = Math.floor(msg.top + (msg.height! - 1)) + 'px';
      }
    }
  };

  const addMsg = (msg: Msg) => {
    if (msgs.length > 0) {
      move(msg, -1);
      clean();
    }
    setMsgs([...msgs, msg]);
  };

  const clean = () => {
    for (let i = 0; i < msgs.length; ++i) {
      if (msgs[i].dy! + msgs[i].height! <= -game.defaultY!) {
        msgs.splice(i, 1);
        setMsgs([...msgs]);
        --i;
      }
    }
  }

  const touch = (a: Msg, b: Msg) => {
    let pa: Pos = grid.drawPos[a.pos!.y][a.pos!.x];
    let pb: Pos = grid.drawPos[b.pos!.y][b.pos!.x];
    pa = { x: pa.x + a.dx!, y: a.dy! };
    pb = { x: pb.x + b.dx!, y: b.dy! };

    if ((pb.y < pa.y && pb.y + b.height! > pa.y) ||
      (pb.y < pa.y + a.height! && pb.y + b.height! >= pa.y + a.height!) ||
      (pb.y >= pa.y && pb.y + b.height! <= pa.y + a.height!)) {

      if (pa.x < pb.x && pa.x + a.width! > pb.x) return true;
      if (pa.x < pb.x + b.width! && pa.x + a.width! > pb.x + b.width!) return true;
      if (pa.x >= pb.x && pa.x + a.width! <= pb.x + b.width!) return true;
    }

    return false;
  }

  const move = (msg: Msg, iIni: number) => {
    for (let i = 0; i < msgs.length; ++i) {
      if (i !== iIni && touch(msg, msgs[i])) {
        // const b: Msg = msgs[i];
        // const bend: number = b.dy!+b.height!;
        // const aend: number = msg.dy!+msg.height!;
        msgs[i].dy = msg.dy! - msgs[i].height!;
        move(msgs[i], i);
      }
    }
  }

  return (
    <div ref={chatRef} className="absolute w-full h-full">
      <div className="invisible">
        {unloadedMsgs.map((msg, index) =>
          <ChatMsg msg={msg}
            key={index}
            ref={(el) => (unloadedMsgsRefs.current[index] = el)}
            mode="overlay" />
        )
        }
      </div>
      {msgs.map((msg, index) =>
        <div key={index} className="absolute top-[-20px]">
          <ChatMsg msg={msg}
            ref={(el) => (msgsRefs.current[index] = el)}
            mode="overlay" />
          <img src="/assets/misc/msg-pos.png" 
            ref={(el) => (playerPosRefs.current[index] = el)}/>
        </div>
      )
      }
    </div>
  );
};

export default OverlayChat;