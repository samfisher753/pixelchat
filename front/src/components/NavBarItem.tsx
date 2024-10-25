

const NavBarItem = ({ onClick, imgSrc }:
  {
    onClick: () => void;
    imgSrc: string;
  }
) => {

  return (
    <button className="h-[30px] w-[44px] my-2 mx-2.5 p-0"
      onClick={onClick}>
      <img src={imgSrc} />
    </button>
  );

};

export default NavBarItem;