type UserAvatarProps = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  className?: string;
};

// Foto de perfil redonda; sin foto, la inicial del nombre
const UserAvatar = ({ username, displayName, avatarUrl, className = 'w-9 h-9' }: UserAvatarProps) => (
  <div className={`${className} shrink-0 rounded-full bg-[#383838] overflow-hidden flex items-center justify-center`}>
    {avatarUrl
      ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      : <span className="text-sm font-bold text-white">{(displayName || username).charAt(0).toUpperCase()}</span>}
  </div>
);

export default UserAvatar;
