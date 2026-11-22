import { FiMenu } from "react-icons/fi";


const Hamburger = ({setIsMenuOpen}) => {
  return (
    <>
      <button
        onClick={() => {
          if (window.innerWidth >= 1024) {
            window.dispatchEvent(new Event("kitchen-toggle-sidebar"));
          } else {
            setIsMenuOpen((current) => !current);
          }
        }}
        className="text-2xl text-white transition hover:text-gray-500 p-4"
      >
        <FiMenu />
      </button>

      
    </>
  );
};

export default Hamburger;