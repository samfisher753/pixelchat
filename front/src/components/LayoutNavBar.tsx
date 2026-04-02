import { NavLink } from "react-router-dom";
import { Home, MessageSquare, User, LogOut } from "lucide-react";
import logo from "@/assets/logo-pixelchat.svg";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";

const LayoutNavBar = () => {

  const navigate = useNavigate();
  const auth = useAuth();
  const game = useGame();

  const logout = () => {
    game!.logout();
    auth.logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-[#2C2C2C] border-b border-[#383838] flex items-center justify-between px-6 shrink-0 z-50 shadow-sm">

      {/* Left Side: Logo & Main Nav */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <img src={logo} alt="PixelChat" className="h-12 object-contain" />
        </div>

        <nav className="flex items-center gap-2">
          <NavItem to="/feed" icon={<Home className="w-4 h-4" />} label="Inicio" />
          <NavItem to="/chat" icon={<MessageSquare className="w-4 h-4" />} label="Chat" />
        </nav>
      </div>

      {/* Right Side: Profile & Logout */}
      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-2">
          <NavItem to="/profile" icon={<User className="w-4 h-4" />} label="Perfil" />
        </nav>

        <div className="w-px h-6 bg-[#383838] mx-1"></div> {/* Separator */}

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-neutral-400 hover:text-red-400 hover:bg-[#383838] rounded-lg transition-colors"
          title="Salir"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-sm hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
};

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm ${
          isActive
            ? "bg-[#022F72] text-white font-semibold shadow-md"
            : "text-neutral-400 hover:bg-[#383838] hover:text-white font-medium"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default LayoutNavBar;