import { useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import { X } from "lucide-react";

// Cada ventana que se pulsa pasa por encima de las demás
let topZIndex = 20;

type DraggableWindowProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  // Tamaño de la ventana (clases de Tailwind)
  className: string;
  children: React.ReactNode;
};

// Ventana que se mueve arrastrando su barra de título, sin salirse del contenedor (como la de salas
// o la de amigos del chat). Se centra la primera vez que se abre y luego recuerda dónde la dejaste.
const DraggableWindow = ({ open, onClose, title, icon, className, children }: DraggableWindowProps) => {

  const parentRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zIndex, setZIndex] = useState(topZIndex);
  const centered = useRef(false);

  // Antes de pintarse, para que no se vea saltar de sitio (su alto ya incluye el contenido)
  useLayoutEffect(() => {
    if (!open || centered.current) return;
    centered.current = true;
    const parent = parentRef.current!.getBoundingClientRect();
    const element = draggableRef.current!.getBoundingClientRect();
    draggableRef.current!.style.left = `${(parent.width - element.width) / 2}px`;
    draggableRef.current!.style.top = `${(parent.height - element.height) / 2}px`;
  }, [open]);

  // Al abrirla también se pone delante
  useLayoutEffect(() => {
    if (open) bringToFront();
  }, [open]);

  const bringToFront = () => setZIndex(++topZIndex);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !parentRef.current || !draggableRef.current) return;

    const parent = parentRef.current.getBoundingClientRect();
    const element = draggableRef.current.getBoundingClientRect();

    const newX = Math.min(
      Math.max(0, element.left + e.movementX - parent.left),
      parent.width - element.width
    );
    const newY = Math.min(
      Math.max(0, element.top + e.movementY - parent.top),
      parent.height - element.height
    );

    draggableRef.current.style.left = `${newX}px`;
    draggableRef.current.style.top = `${newY}px`;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div ref={parentRef}
      style={{ zIndex }}
      className={clsx("absolute w-full h-full",
        {
          "pointer-events-none": !isDragging,
          "pointer-events-auto": isDragging,
          "invisible": !open
        })}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}>
      <div ref={draggableRef}
        className={clsx("absolute flex flex-col bg-[#2C2C2C] border border-[#383838] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto", className)}
        onMouseDownCapture={bringToFront}>
        <div className="h-11 shrink-0 pl-4 pr-2 flex items-center justify-between border-b border-[#383838] cursor-move select-none"
          onMouseDown={handleMouseDown}>
          <span className="flex items-center gap-2 text-sm font-bold text-white">
            {icon}
            {title}
          </span>
          <button type="button" aria-label="Cerrar"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#383838] transition-colors"
            onMouseDown={e => e.stopPropagation()}
            onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DraggableWindow;
