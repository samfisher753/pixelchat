import { Settings, MapPin, Calendar, Link as LinkIcon, Edit3 } from "lucide-react";

export function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header Cover & Avatar */}
      <div className="bg-[#2C2C2C] rounded-3xl overflow-hidden shadow-lg border border-[#383838] relative">
        <div className="h-48 bg-gradient-to-r from-[#1E1E1E] via-[#022F72] to-[#1E1E1E] w-full object-cover opacity-90" />
        
        <div className="px-8 pb-8">
          <div className="flex justify-between items-end -mt-16 mb-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-[#2C2C2C] bg-[#2C2C2C] overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300&h=300" 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute bottom-1 right-1 bg-[#383838] text-white p-2 rounded-full hover:bg-[#022F72] border-2 border-[#2C2C2C] transition-colors shadow-md">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            
            <button className="flex items-center gap-2 px-6 py-2 bg-[#383838] hover:bg-[#444444] text-white rounded-full font-bold transition-colors border border-[#444444]">
              <Settings className="w-4 h-4" />
              Editar Perfil
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">Mi Usuario</h1>
            <p className="text-neutral-400 font-medium">@mi_usuario</p>
            
            <p className="mt-4 text-neutral-300 max-w-2xl text-[15px] leading-relaxed">
              Mi misión.
            </p>

            <div className="flex items-center gap-6 mt-4 text-sm text-neutral-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>Barcelona</span>
              </div>
              <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                <LinkIcon className="w-4 h-4" />
                <a href="#" className="text-[#4b8df8] hover:underline">mi-portfolio.dev</a>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Se unió en Enero 2024</span>
              </div>
            </div>

            <div className="flex gap-6 mt-6 pt-6 border-t border-[#383838]">
              <div className="flex gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <span className="font-bold text-white">142</span>
                <span className="text-neutral-400">Amigos</span>
              </div>
              {/*
              <div className="flex gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <span className="font-bold text-white">142</span>
                <span className="text-neutral-400">Siguiendo</span>
              </div>
              <div className="flex gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <span className="font-bold text-white">894</span>
                <span className="text-neutral-400">Seguidores</span>
              </div>
              */}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="mt-6 flex border-b border-[#383838]">
        <button className="px-6 py-4 text-white border-b-2 border-white font-bold">
          Mis Posts
        </button>
        {/*
        <button className="px-6 py-4 text-neutral-500 hover:text-white font-semibold transition-colors">
          Salas Favoritas
        </button>
        */}
        <button className="px-6 py-4 text-neutral-500 hover:text-white font-semibold transition-colors">
          Me gusta
        </button>
      </div>

      <div className="py-12 text-center text-neutral-500 bg-[#1E1E1E]/50 mt-6 rounded-2xl border border-[#383838]/50">
        <p className="text-lg">Aún no has hecho ninguna publicación.</p>
        <button className="mt-4 px-6 py-2 bg-[#383838] text-white rounded-full font-bold hover:bg-[#444444] transition-colors border border-[#444444]">
          Crear mi primer post
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;
