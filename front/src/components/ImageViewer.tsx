import { useState } from 'react';
import ReactDOM from 'react-dom';

type ImageViewerProps = {
  src: string;
  alt?: string;
};

const ImageViewer = ({ src, alt }: ImageViewerProps) => {
  const [isFullWindow, setIsFullWindow] = useState(false);

  const handleImageClick = () => {
    setIsFullWindow(true);
  };

  const handleCloseClick = () => {
    setIsFullWindow(false);
  };

  return (
    <>
      <img src={src} alt={alt} onClick={handleImageClick} className="block max-h-[150px] max-w-full cursor-pointer" />
      {isFullWindow && (
        ReactDOM.createPortal(
          <div className="fixed w-screen h-screen left-0 top-0 bg-fullWinImg flex items-center justify-center z-50"
            onClick={handleCloseClick}>
            <img src={src} alt={alt} className="max-w-[90%] max-h-[90%]" />
          </div>,
          document.body
        )
      )}
    </>
  );
};

export default ImageViewer;