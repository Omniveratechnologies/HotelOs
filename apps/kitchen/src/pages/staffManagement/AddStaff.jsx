import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, RotateCcw, Save, UserPlus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../../components/ui/Navbar.jsx";
import Sidebar from "../../components/hamburger/SideBar.jsx";
import Button from "../../components/ui/button/Button.jsx";

import PersonalInformation from "../../components/staffManagement/PersonalInformation.jsx";
import EmploymentInformation from "../../components/staffManagement/EmploymentInformation.jsx";
import StaffPhoto from "../../components/staffManagement/StaffPhoto.jsx";
import FaceRegistration from "../../components/staffManagement/FaceRegistration.jsx";
import RegisterFaceModal from "../../components/staffManagement/RegisterFaceModal.jsx";

import { staffSchema } from "../../utils/addStaffValidation.js";
import { addStaffApi } from "../../services/addStaffApi.js";

const initialValues = {
  name: "",
  dob: "",
  phone: "",
  email: "",
  address: "",
  govIdType: "",
  govIdNumber: "",
  departmentId: "",
  designationId: "",
  shiftId: "",
  managerId: "",
  employmentType: "FULL_TIME",
  status: "ACTIVE",
  joinedOn: new Date().toISOString().slice(0, 10),
};

const getAge = (dob) => {
  if (!dob) return null;

  const birthDate = new Date(`${dob}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age < 0 ? null : age;
};

const getRecord = (response) => {
  const data = response?.data ?? response;

  return (
    data?.departments ??
    data?.designations ??
    data?.shifts ??
    data?.staff ??
    data?.items ??
    data?.item ??
    data
  );
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;

  return value._id ?? value.id ?? "";
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const mapStaffToForm = (staff) => ({
  name: staff.name ?? "",
  dob: formatDate(staff.dob),
  phone: staff.phone ?? "",
  email: staff.email ?? "",
  address: staff.address ?? "",
  govIdType: staff.govIdType ?? "",
  govIdNumber: "",
  departmentId: getId(staff.departmentId),
  designationId: getId(staff.designationId),
  shiftId: getId(staff.shiftId),
  managerId: getId(staff.managerId),
  employmentType: staff.employmentType ?? "FULL_TIME",
  status: staff.status ?? "ACTIVE",
  joinedOn: formatDate(staff.joinedOn) || initialValues.joinedOn,
});

const AddStaff = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(isEditMode);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [photo, setPhoto] = useState(null);
  const [savedStaff, setSavedStaff] = useState(null);
  const [faceStatus, setFaceStatus] = useState("NOT_REGISTERED");
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [designationHint, setDesignationHint] = useState("");

  const [staffCode, setStaffCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [addAnother, setAddAnother] = useState(false);

  const originalValuesRef = useRef(initialValues);
  const formRef = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  const dob = watch("dob");
  const departmentId = watch("departmentId");
  const age = getAge(dob);
  const currentId = id ?? savedStaff?._id ?? "";
  const baseNotes = savedStaff?.notes ?? "";
  const hasChanges = isDirty || Boolean(photo) || notes !== baseNotes;

  const loadDesignations = useCallback(async (selectedDepartmentId) => {
    setDesignationHint("");

    if (!selectedDepartmentId) {
      setDesignations([]);
      return [];
    }

    setLoadingDesignations(true);

    try {
      const result = await addStaffApi.designations(selectedDepartmentId);
      const records = getRecord(result);
      const list = Array.isArray(records)
        ? records
        : Array.isArray(records?.items)
          ? records.items
          : [];

      setDesignations(list);

      if (list.length === 0) {
        setDesignationHint("No designations found for this department.");
      }

      return list;
    } catch (error) {
      setDesignations([]);
      setDesignationHint(error.message || "Could not load designations.");
      return [];
    } finally {
      setLoadingDesignations(false);
    }
  }, []);

  useEffect(() => {
    loadDesignations(departmentId);
  }, [departmentId, loadDesignations]);

  useEffect(() => {
    const keep = getValues("designationId");

    if (keep && designations.some((item) => item._id === keep)) {
      setValue("designationId", keep);
    }
  }, [designations, getValues, setValue]);

  const refreshStaffCode = useCallback(async () => {
    if (isEditMode) return;

    setCodeLoading(true);

    try {
      const result = await addStaffApi.nextCode();
      setStaffCode(result?.data?.staffCode ?? "");
    } catch {
      setStaffCode("");
    } finally {
      setCodeLoading(false);
    }
  }, [isEditMode]);

  useEffect(() => {
    refreshStaffCode();
  }, [refreshStaffCode]);

  useEffect(() => {
    let cancelled = false;

    const asList = (result) => {
      if (result.status !== "fulfilled") return [];
      const records = getRecord(result.value);
      if (Array.isArray(records)) return records;
      return Array.isArray(records?.items) ? records.items : [];
    };

    const loadOptions = async () => {
      const results = await Promise.allSettled([
        addStaffApi.departments(),
        addStaffApi.shifts(),
        addStaffApi.staffList(),
      ]);

      if (cancelled) return;

      const [departmentResult, shiftResult, staffResult] = results;

      const departmentList = asList(departmentResult);
      const shiftList = asList(shiftResult);

      setDepartments(departmentList);
      setShifts(shiftList);
      setStaff(asList(staffResult));

      const problems = [];

      [
        ["departments", departmentResult],
        ["shifts", shiftResult],
        ["staff list", staffResult],
      ].forEach(([label, result]) => {
        if (result.status === "rejected") {
          problems.push(
            `Could not load ${label} (${result.reason?.message || "request failed"}).`,
          );
        }
      });

      if (
        departmentResult.status === "fulfilled" &&
        departmentList.length === 0
      ) {
        problems.push(
          "No departments found for this hotel. Add departments first (run the seed or create them in the database).",
        );
      }

      if (problems.length > 0) setPageError(problems.join(" "));
    };

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      reset(initialValues);
      originalValuesRef.current = initialValues;
      setSavedStaff(null);
      setLoadingStaff(false);
      return;
    }

    let cancelled = false;

    const loadExistingStaff = async () => {
      setLoadingStaff(true);
      setPageError("");
      setNotice("");

      try {
        const response = await addStaffApi.getById(id);

        if (cancelled) return;

        const existingStaff = getRecord(response);

        if (!existingStaff?._id) {
          throw new Error("Staff details could not be found.");
        }

        const formValues = mapStaffToForm(existingStaff);

        setSavedStaff(existingStaff);
        setStaffCode(existingStaff.staffCode ?? "");
        setNotes(existingStaff.notes ?? "");
        setFaceStatus(existingStaff.faceStatus ?? "NOT_REGISTERED");
        originalValuesRef.current = formValues;
        reset(formValues);
      } catch (error) {
        if (!cancelled) {
          setPageError(error.message || "Could not load staff details.");
        }
      } finally {
        if (!cancelled) setLoadingStaff(false);
      }
    };

    loadExistingStaff();

    return () => {
      cancelled = true;
    };
  }, [id, isEditMode, reset]);

  const hasChangesRef = useRef(false);
  hasChangesRef.current = hasChanges;

  useEffect(() => {
    const warnOnUnload = (event) => {
      if (!hasChangesRef.current) return;

      event.preventDefault();
      event.returnValue = "";
    };

    const warnOnLinkClick = (event) => {
      if (!hasChangesRef.current || event.defaultPrevented) return;
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey
      )
        return;

      const link = event.target.closest?.("a[href]");

      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;

      const url = new URL(link.href, window.location.href);

      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      if (
        !window.confirm(
          "You have unsaved changes. Leave this page without saving?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const saveShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    };

    window.addEventListener("beforeunload", warnOnUnload);
    document.addEventListener("click", warnOnLinkClick, true);
    document.addEventListener("keydown", saveShortcut);

    return () => {
      window.removeEventListener("beforeunload", warnOnUnload);
      document.removeEventListener("click", warnOnLinkClick, true);
      document.removeEventListener("keydown", saveShortcut);
    };
  }, []);

  const changeDepartment = () => {
    setValue("designationId", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const persistStaff = async (parsedValues) => {
    const values = { ...getValues(), ...parsedValues };

    if (values.dob) {
      const calculatedAge = getAge(values.dob);

      if (calculatedAge === null) {
        throw new Error("Please enter a valid date of birth.");
      }

      if (calculatedAge < 18) {
        throw new Error("Staff member must be at least 18 years old.");
      }
    }

    const payload = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email?.trim() || "",
      dob: values.dob || null,
      address: values.address?.trim() || "",
      govIdType: values.govIdType || "",
      departmentId: values.departmentId || null,
      designationId: values.designationId || null,
      shiftId: values.shiftId || null,
      managerId: values.managerId || null,
      employmentType: values.employmentType,
      status: values.status,
      joinedOn: values.joinedOn,
      notes: notes.trim(),

      ...(!currentId && staffCode ? { staffCode } : {}),
    };

    let current;

    if (currentId) {
      const result = await addStaffApi.update(currentId, payload);
      current = getRecord(result);

      if (!current?._id) {
        current = { ...savedStaff, ...payload, _id: currentId };
      }
    } else {
      const result = await addStaffApi.create(payload);
      current = getRecord(result);

      if (!current?._id) {
        throw new Error(
          "Staff was saved, but the response did not include its ID.",
        );
      }
    }

    current = { ...current, notes: current.notes ?? payload.notes };

    setSavedStaff(current);
    setStaffCode(current.staffCode ?? staffCode);

    if (photo) {
      const photoResult = await addStaffApi.uploadPhoto(current._id, photo);

      current = { ...current, ...getRecord(photoResult) };
      setSavedStaff(current);
      setPhoto(null);
    }

    const formValues = {
      ...mapStaffToForm(current),
      govIdNumber: values.govIdNumber ?? "",
    };

    reset(formValues);
    originalValuesRef.current = formValues;

    return current;
  };

  const submit = async (values) => {
    setPageError("");
    setNotice("");
    setLoading(true);

    try {
      const current = await persistStaff(values);

      if (!isEditMode && addAnother) {
        reset(initialValues);
        originalValuesRef.current = initialValues;
        setPhoto(null);
        setNotes("");
        setSavedStaff(null);
        setFaceStatus("NOT_REGISTERED");
        setDesignations([]);
        setNotice(
          `${current.name || "Staff member"} was added. You can add the next one.`,
        );
        refreshStaffCode();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      navigate("/manage-staff/staff-management/all-staff");
    } catch (error) {
      setPageError(error.message || "Could not save staff details.");
    } finally {
      setLoading(false);
    }
  };

  const openFaceRegistration = async () => {
    setPageError("");
    setNotice("");

    if (currentId && !hasChanges) {
      setFaceModalOpen(true);
      return;
    }

    await handleSubmit(async (values) => {
      setLoading(true);

      try {
        await persistStaff(values);
        setNotice(
          currentId
            ? "Changes saved. Capture the face now."
            : "Staff saved. Capture the face now.",
        );
        setFaceModalOpen(true);
      } catch (error) {
        setPageError(error.message || "Could not save staff details.");
      } finally {
        setLoading(false);
      }
    })();
  };

  const registerFace = async (embeddingRef) => {
    if (!currentId) {
      throw new Error("Save the staff record first.");
    }

    setFaceLoading(true);
    setPageError("");

    try {
      await addStaffApi.registerFace(currentId, embeddingRef);
      setFaceStatus("REGISTERED");
      setFaceModalOpen(false);
      setNotice("Face registered successfully.");
    } catch (error) {
      setPageError(error.message || "Could not register face.");
      throw error;
    } finally {
      setFaceLoading(false);
    }
  };

  const resetForm = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        "Reset the form? Your changes will be lost.",
      );

      if (!confirmed) return;
    }

    reset(originalValuesRef.current);
    setPhoto(null);
    setNotes(baseNotes);
    setPageError("");
    setNotice("");
  };

  const cancelForm = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Discard them?",
      );

      if (!confirmed) return;
    }

    navigate("/manage-staff/staff-management/all-staff");
  };

  return (
    <div className="relative min-h-screen bg-[#0f0f0f] text-white">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        className={`min-h-screen transition-[margin] duration-300 ease-in-out ${
          isMenuOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Navbar
          icon={<UserPlus size={18} />}
          iconColor="text-emerald-400"
          bgColor="bg-emerald-500/10"
          title={isEditMode ? "Edit Staff" : "Add Staff"}
          subtitle={
            isEditMode
              ? "Update existing staff information"
              : "Create and manage staff information"
          }
          breadcrumb={
            isEditMode
              ? "Manage Staff → Staff Management → All Staff → Edit Staff"
              : "Manage Staff → Staff Management → Add Staff"
          }
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          showPageHeading
          placeholder="Search Staff, Department, etc"
          pageAction={
            <Button type="button" variant="secondary" onClick={resetForm}>
              <RotateCcw size={15} />
              Reset Form
            </Button>
          }
        />

        <main className="mx-auto max-w-[1500px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
          {pageError && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {pageError}
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"
            >
              {notice}
            </div>
          )}

          {loadingStaff ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-gray-400">
              <LoaderCircle size={18} className="animate-spin" />
              Loading staff details...
            </div>
          ) : (
            <form
              ref={formRef}
              onSubmit={handleSubmit(submit)}
              className="space-y-5"
              aria-busy={loading}
              noValidate
            >
              <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="min-w-0 space-y-5">
                  <PersonalInformation
                    register={register}
                    errors={errors}
                    age={age}
                  />

                  <EmploymentInformation
                    register={register}
                    errors={errors}
                    departments={departments}
                    designations={designations}
                    shifts={shifts}
                    staff={staff.filter((member) => member._id !== currentId)}
                    onDepartmentChange={changeDepartment}
                    loadingDesignations={loadingDesignations}
                    designationHint={designationHint}
                    staffCode={staffCode}
                    onRefreshStaffCode={refreshStaffCode}
                    refreshingStaffCode={codeLoading}
                    canRefreshStaffCode={!isEditMode}
                    notes={notes}
                    onNotesChange={setNotes}
                  />
                </div>

                <div className="space-y-5">
                  <StaffPhoto
                    file={photo}
                    setFile={setPhoto}
                    initialPhotoUrl={savedStaff?.photoUrl}
                  />

                  <FaceRegistration
                    isSaved={Boolean(currentId)}
                    faceStatus={faceStatus}
                    loading={loading || faceLoading}
                    onRegister={openFaceRegistration}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelForm}
                  disabled={loading}
                >
                  Cancel
                </Button>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                  {!isEditMode && (
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={addAnother}
                        onChange={(event) =>
                          setAddAnother(event.target.checked)
                        }
                        className="h-4 w-4 cursor-pointer accent-emerald-500"
                      />
                      Add another staff member
                    </label>
                  )}

                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}

                    {loading
                      ? isEditMode
                        ? "Updating..."
                        : "Saving..."
                      : isEditMode
                        ? "Update Staff"
                        : "Save Staff"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </main>
      </div>

      <RegisterFaceModal
        open={faceModalOpen}
        staffId={currentId}
        loading={faceLoading}
        onClose={() => setFaceModalOpen(false)}
        onSubmit={registerFace}
      />
    </div>
  );
};

export default AddStaff;
