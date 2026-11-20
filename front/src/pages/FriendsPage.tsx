import FriendsList from '@/components/FriendsList';

// Tus amigos y solicitudes a pantalla completa (/friends). Como el perfil de otro usuario, solo
// está montada mientras se ve, así que cada vez que entras se piden los datos de nuevo.
// En el chat, la misma lista se abre en una ventana (FriendsWindow).
export function FriendsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <FriendsList />
    </div>
  );
}

export default FriendsPage;
