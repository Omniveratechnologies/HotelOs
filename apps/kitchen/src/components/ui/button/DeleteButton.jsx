import { FiTrash2 } from "react-icons/fi";

const DeleteButton = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Delete"
      className="rounded-md p-2 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
    >
      <FiTrash2 size={15} />
    </button>
  );
};

export default DeleteButton;
