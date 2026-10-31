import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import apiService from '@/services/apiService';
import { useAuth } from '@/providers/AuthProvider';
import UserAvatar from '@/components/UserAvatar';

type UserSearchResult = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

// La api no busca con menos letras (ver SEARCH_MIN_LENGTH en UsersService)
const MIN_LENGTH = 2;
// Espera desde la última tecla antes de buscar, para no lanzar una petición por cada letra
const DEBOUNCE_MS = 250;

// Buscador de usuarios de la barra superior: muestra los resultados mientras escribes
const UserSearch = () => {

  const navigate = useNavigate();
  const auth = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }
    // Si se sigue escribiendo, se descarta la búsqueda anterior (y su respuesta, si llega tarde)
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await apiService.get<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(q)}`);
        if (!cancelled) setResults(found);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Se cierra al pulsar fuera
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  // Abre su perfil (el tuyo, en /profile, donde se puede editar)
  const choose = (user: UserSearchResult) => {
    setOpen(false);
    setQuery('');
    navigate(user.id === auth.user?.id ? '/profile' : `/u/${encodeURIComponent(user.username)}`);
  };

  const showPanel = open && query.trim().length >= MIN_LENGTH;

  return (
    <div ref={ref} className="relative w-56 lg:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
      <input
        type="search"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
        placeholder="Buscar usuarios"
        aria-label="Buscar usuarios"
        className="w-full bg-[#1E1E1E] text-white placeholder-neutral-500 rounded-lg pl-9 pr-3 py-2 text-sm border border-[#383838] focus:outline-none focus:border-[#022F72] focus:ring-1 focus:ring-[#022F72] transition-colors"
      />

      {showPanel && (
        <div className="absolute left-0 right-0 mt-2 bg-[#2C2C2C] border border-[#383838] rounded-xl shadow-2xl overflow-hidden">
          {loading && results.length === 0 ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-400">No hay usuarios con ese nombre.</p>
          ) : (
            <ul>
              {results.map(user => {
                return (
                  <li key={user.id}>
                    <button type="button" onClick={() => choose(user)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#383838] transition-colors">
                      <UserAvatar {...user} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user.displayName || user.username}</p>
                        <p className="text-xs text-neutral-400 truncate">@{user.username}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;
