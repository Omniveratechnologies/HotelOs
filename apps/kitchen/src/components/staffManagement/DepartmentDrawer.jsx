import DepartmentDetails from "./DepartmentDetails.jsx";

const DepartmentDrawer = (props) => (
  <aside
    aria-label="Department details"
    className="sticky top-4 overflow-hidden rounded-xl border border-gray-800 bg-[#111111]"
  >
    <DepartmentDetails {...props} />
  </aside>
);

export default DepartmentDrawer;
