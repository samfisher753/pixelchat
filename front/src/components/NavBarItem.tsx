
const NavBarItem = ({ onClick, icon, label }:
  {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
  }
) => {

  return (
    <button type="button" title={label}
      className="inline-flex items-center gap-2 h-9 px-3 my-[5px] mr-2 align-top rounded-lg bg-[#383838] hover:bg-[#444444] border border-[#444444] text-white text-sm font-medium transition-colors"
      onClick={onClick}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

};

export default NavBarItem;
