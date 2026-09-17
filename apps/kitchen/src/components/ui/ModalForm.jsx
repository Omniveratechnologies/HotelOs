import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import FormField from "./FormField";

const ModalForm = ({
  isOpen,
  onClose,
  title = "Add New",
  subtitle = "",
  fields = [],
  submitText = "Submit",
  onSubmit,
  initialData = {},
}) => {
  const getInitialValues = () => {
    return fields.reduce((acc, field) => {
      acc[field.name] = initialData[field.name] ?? field.defaultValue ?? "";

      return acc;
    }, {});
  };

  const [formData, setFormData] = useState(getInitialValues);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialValues());
    }
  }, [isOpen, initialData]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit(formData);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-gray-800 bg-[#111111] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">{title}</h2>

            {subtitle && (
              <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.name}
                className={field.fullWidth ? "sm:col-span-2" : ""}
              >
                <FormField
                  {...field}
                  value={formData[field.name] ?? ""}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-700 px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalForm;
