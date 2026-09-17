import { FiMenu } from "react-icons/fi";


const Hamburger = ({setIsMenuOpen}) => {
  return (
    <>
      <button
        onClick={() => setIsMenuOpen(true)}
        className="text-2xl text-white transition hover:text-gray-500 p-4"
      >
        <FiMenu />
      </button>

      
    </>
  );
};

export default Hamburger;