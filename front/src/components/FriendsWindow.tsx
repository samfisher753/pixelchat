import { Users } from "lucide-react";
import DraggableWindow from "./DraggableWindow";
import FriendsList from "./FriendsList";

// Ventana de amigos del chat, para verlos sin salir de la sala. La lista solo se monta mientras
// está abierta, así que cada vez que la abres se piden los datos de nuevo.
const FriendsWindow = ({ open, setWindowOpen }: { open: boolean; setWindowOpen: (open: boolean) => void }) => {
  return (
    <DraggableWindow open={open} onClose={() => setWindowOpen(false)} title="Amigos"
      icon={<Users className="w-4 h-4 text-neutral-400" />} className="w-[320px] h-[400px] max-h-full">
      <div className="flex-1 min-h-0 overflow-y-auto pb-2">
        {open && <FriendsList compact />}
      </div>
    </DraggableWindow>
  );
};

export default FriendsWindow;
