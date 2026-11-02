const AddStaffCard = ({ title, subtitle, icon: Icon, children }) => (
  <section className="min-w-0 rounded-xl border border-gray-800 bg-[#151515] p-4 sm:p-6">
    <div className="mb-5 flex items-start gap-3">
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
          <Icon size={19} aria-hidden="true" />
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>

    {children}
  </section>
);

export default AddStaffCard;
