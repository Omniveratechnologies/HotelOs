import { useRef, useState } from "react";
import { FiFileText } from "react-icons/fi";
import { FaPlus, FaTrash } from "react-icons/fa";
import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/Hamburger/SideBar.jsx";
import API_BASE_URL from "../../config/api.js";

import WastageForm from "../../components/wastage/WastageForm.jsx";
import WastageReasonsChart from "../../components/wastage/WastageReasonsChart.jsx";

import WastageStatusCards from "../../components/wastage/WastageStatusCards.jsx";
import WastageTable from "../../components/wastage/WastageTable.jsx";
import WastageItems from "../../components/wastage/WastageItems.jsx";
import { WastageReport } from "../../utils/wastageReport.js";

const WastagePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const formRef = useRef(null);

  const handleViewReports = async () => {
    setDownloadingReport(true);
    try {
      const count = await WastageReport(API_BASE_URL, { period: "All Time" });

      console.log(`Downloaded report with ${count} records`);
    } catch (error) {
      console.error("Report download error:", error);
      alert(error.message || "Failed to download report.");
    } finally {
      setDownloadingReport(false);
    }
  };

  const refreshAll = () => setRefreshKey((k) => k + 1);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    scrollToForm();
  };

  const handleSaved = () => {
    setEditingRecord(null);
    refreshAll();
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`h-full overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-64" : "translate-x-0"
        }`}
      >
        <Navbar
          icon={<FaTrash />}
          iconColor="text-red-500"
          bgColor="bg-red-500/10"
          title="Wastage / Spoilage"
          subtitle="Record and track food wastage to maintain accurate inventory and reduce losses."
          breadcrumb="Inventory → Wastage / Spoilage"
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          showPageHeading
          pageAction={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleViewReports}
                disabled={downloadingReport}
                className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiFileText size={14} />
                {downloadingReport ? "Preparing..." : "View Reports"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingRecord(null);
                  scrollToForm();
                }}
                className="hover:bg-white-600 flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black"
              >
                <FaPlus size={12} />
                Record Wastage
              </button>
            </div>
          }
        />

        <main className="space-y-5 px-4 py-5">
          <WastageStatusCards refreshKey={refreshKey} />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px] lg:items-stretch">
            <div className="min-w-0 space-y-5">
              <div ref={formRef} className="flex flex-col gap-5 xl:flex-row">
                <div className="min-w-0 flex-[3]">
                  <WastageForm
                    editingRecord={editingRecord}
                    onSaved={handleSaved}
                    onCancelEdit={() => setEditingRecord(null)}
                  />
                </div>

                <div className="min-w-0 flex-[2]">
                  <WastageReasonsChart refreshKey={refreshKey} />
                </div>
              </div>

              <WastageTable
                refreshKey={refreshKey}
                onEdit={handleEdit}
                onDeleted={refreshAll}
              />
            </div>

            <div className="min-w-0">
              <WastageItems refreshKey={refreshKey} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WastagePage;
