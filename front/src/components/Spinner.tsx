const Spinner = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none">
      <svg
        className="animate-spin h-12 w-12 mb-4 drop-shadow-md"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        ></circle>
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        ></path>
      </svg>
      <span className="text-sm font-medium tracking-widest uppercase drop-shadow-md">
        Cargando...
      </span>
    </div>
  );
};

export default Spinner;
