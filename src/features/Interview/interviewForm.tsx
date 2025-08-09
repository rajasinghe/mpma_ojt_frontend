import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import InterviewNic from "./interviewNic";
import api from "../../api";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

interface DepartmentSummary {
  name: string;
  dep_id: number;
  max_count: number;
  active_count: number;
  interview_count: number;
}

const schema = z
  .object({
    name: z.string().optional(),
    email: z.string().email("Invalid email format"),
    startDate: z.string().min(1, "start date is required"),
    duration: z.object({
      value: z.number().min(1, "Duration value is required"),
      unit: z.string().min(1, "Duration unit is required"),
    }),
    selections: z
      .array(
        z.object({
          department_id: z.number().min(1, "Department is required"),
          from: z.string().optional(),
          to: z.string().optional(),
        })
      )
      .min(1, "At least one department selection is required"),
  })
  .refine(
    (data) => {
      // Validate that each selection's from date is before to date
      for (const selection of data.selections) {
        if (selection.from && selection.to) {
          const fromDate = new Date(selection.from);
          const toDate = new Date(selection.to);
          if (fromDate >= toDate) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message: "From date must be before To date for all department selections",
      path: ["selections"],
    }
  )
  .refine(
    (data) => {
      // Validate that from/to dates are within the overall start date and duration period
      const startDate = new Date(data.startDate);
      let endDate = new Date(startDate);

      // Calculate end date based on duration
      if (data.duration.unit === "week") {
        endDate.setDate(endDate.getDate() + data.duration.value * 7);
      } else if (data.duration.unit === "month") {
        endDate.setMonth(endDate.getMonth() + data.duration.value);
      } else if (data.duration.unit === "year") {
        endDate.setFullYear(endDate.getFullYear() + data.duration.value);
      }

      for (const selection of data.selections) {
        if (selection.from) {
          const fromDate = new Date(selection.from);
          if (fromDate < startDate || fromDate > endDate) {
            return false;
          }
        }
        if (selection.to) {
          const toDate = new Date(selection.to);
          if (toDate < startDate || toDate > endDate) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message:
        "Department dates must be within the interview period (start date to calculated end date)",
      path: ["selections"],
    }
  );

type FormData = z.infer<typeof schema>;

type InterviewProps = {
  id?: number;
  NIC?: string | undefined;
  selections: (
    | {
        departmentId?: number;
        fromDate?: string;
        toDate?: string;
      }
    | undefined
  )[];
  duration?: { value: number; unit: string } | undefined;
  startDate?: string | undefined;
  name?: string | undefined;
  email?: string | undefined;
  nicValidated: boolean;
  nicDisable: boolean;
  isEditing?: boolean;
};

// Helper function to calculate end date based on duration
// Uses the same logic as endDateCalculator() in helper.ts
const calculateEndDate = (
  startDate: string,
  duration: { value: number; unit: string }
): string => {
  if (!startDate || !duration.value || !duration.unit) return "";

  try {
    const endDate = new Date(startDate);

    // Add duration based on unit type (following endDateCalculator logic)
    if (duration.unit === "year") {
      endDate.setFullYear(endDate.getFullYear() + duration.value);
    } else if (duration.unit === "month") {
      endDate.setMonth(endDate.getMonth() + duration.value);
    } else if (duration.unit === "week") {
      endDate.setDate(endDate.getDate() + duration.value * 7);
    } else if (duration.unit === "day") {
      endDate.setDate(endDate.getDate() + duration.value);
    }

    // Subtract 1 day to make the end date inclusive (following endDateCalculator logic)
    endDate.setDate(endDate.getDate() - 1);

    return endDate.toISOString().split("T")[0];
  } catch (error) {
    console.log("Error calculating end date:", error);
    return "";
  }
};

export default function InterviewForm(Interview: InterviewProps) {
  const [nic, setNic] = useState<any>(Interview.NIC);
  const [nicValidated, setNicValidated] = useState(Interview.nicValidated);
  const [nicDisable, setNicDisable] = useState(Interview.nicDisable);
  const [departmentSummary, setDepartmentSummary] = useState<
    DepartmentSummary[]
  >([]);
  const navigate = useNavigate();
  const isEditing = Interview.isEditing || false;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: Interview
      ? {
          name: Interview.name,
          email: Interview.email || "",
          startDate: Interview.startDate?.split("T")[0] || "",
          duration: Interview.duration,
          selections:
            Interview.selections
              //?.filter(sel => sel !== undefined)
              ?.map((sel) => ({
                department_id: sel?.departmentId || -1,
                from: sel?.fromDate || undefined,
                to: sel?.toDate || undefined,
              })) || [],
        }
      : undefined,
  });

  const selections = watch("selections") || [
    { department_id: -1, from: "", to: "" },
  ];
  const startDate = watch("startDate");
  const duration = watch("duration");
  const lastDeptRef = useRef<HTMLDivElement | null>(null);
  const [prevCount, setPrevCount] = useState(selections.length);

  // Calculate end date for validation
  const calculatedEndDate = calculateEndDate(startDate, duration);

  const departmentSummaryLoader = async () => {
    const response = await api.get("api/department/summary");
    return response.data;
  };

  useEffect(() => {
    if (selections.length > prevCount && lastDeptRef.current) {
      lastDeptRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    setPrevCount(selections.length);
  }, [selections.length]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await departmentSummaryLoader();
        setDepartmentSummary(data);
      } catch (error) {
        console.error("Error loading department summary:", error);
      }
    };
    loadDepartments();
  }, []);

  const departmentOptions = departmentSummary.map((dept) => ({
    value: dept.dep_id,
    label: dept.name,
  }));

  const addSelection = () => {
    setValue("selections", [
      ...selections,
      { department_id: -1, from: "", to: "" },
    ]);
  };

  const removeSelection = (index: number) => {
    const newSelections = selections.filter((_, i) => i !== index);
    setValue(
      "selections",
      newSelections.length
        ? newSelections
        : [{ department_id: -1, from: "", to: "" }]
    );
  };

  // Validation function for overlapping date ranges
  const validateDateRanges = (selections: FormData["selections"]) => {
    const selectionsWithDates = selections.filter((sel) => sel.from && sel.to);

    for (let i = 0; i < selectionsWithDates.length; i++) {
      for (let j = i + 1; j < selectionsWithDates.length; j++) {
        const sel1 = selectionsWithDates[i];
        const sel2 = selectionsWithDates[j];

        const start1 = new Date(sel1.from!);
        const end1 = new Date(sel1.to!);
        const start2 = new Date(sel2.from!);
        const end2 = new Date(sel2.to!);

        // Check for overlap
        if (start1 <= end2 && start2 <= end1) {
          return {
            isValid: false,
            message: `Date ranges overlap between departments. Please ensure department durations don't conflict.`,
          };
        }
      }
    }

    return { isValid: true, message: "" };
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Validate date ranges for overlaps
      const dateValidation = validateDateRanges(data.selections);
      if (!dateValidation.isValid) {
        Swal.fire({
          icon: "error",
          title: "Date Range Conflict",
          text: dateValidation.message,
        });
        return;
      }
      const body = {
        nic: nic,
        name: data.name ? data.name : null,
        email: data.email,
        startDate: data.startDate,
        duration: `${data.duration.value} ${data.duration.unit}`,
        departments: data.selections.map((selection) => ({
          department_id: selection.department_id,
          from: selection.from ? selection.from : null,
          to: selection.to ? selection.to : null,
        })),
      };

      if (isEditing) {
        console.log("request:", body);
        const response = await api.put(`api/interview/${Interview.NIC}`, body);
        console.log(response);

        Swal.fire({
          title: "Success!",
          text: "Interview schedule changed successfully",
          icon: "success",
        }).then(() => {
          setNicValidated(true);
          setNicDisable(true);
          navigate("/OJT/interview");
        });
      } else {
        const response = await api.post("/api/interview", body);
        console.log(response);

        Swal.fire({
          title: "Success!",
          text: "Interview schedule saved successfully",
          icon: "success",
        }).then(() => {
          reset();
          setNic("");
          setNicValidated(false);
          setNicDisable(false);
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to save interview schedule",
        icon: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4">
      {/* NIC validation for unique interview */}
      <InterviewNic
        value={nic}
        onValidated={(nicVal) => {
          setNic(nicVal);
          setNicValidated(true);
          setNicDisable(true);
        }}
        disabled={nicDisable}
        setNicValidated={setNicValidated}
        setNicDisable={setNicDisable}
      />

      <div className="row mb-4">
        <div className="col-md-6">
          <label className="form-label">
            Name <span className="small">(Optional)</span>
          </label>
          <input
            {...register("name")}
            className={`form-control ${errors.name ? "is-invalid" : ""}`}
            disabled={!nicValidated || isSubmitting}
          />
          {errors.name && (
            <div className="invalid-feedback">{errors.name.message}</div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label">Email</label>
          <input
            {...register("email")}
            type="email"
            className={`form-control ${errors.email ? "is-invalid" : ""}`}
            disabled={!nicValidated || isSubmitting}
          />
          {errors.email && (
            <div className="invalid-feedback">{errors.email.message}</div>
          )}
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <label className="form-label">Start Date</label>
          <input
            {...register("startDate")}
            type="date"
            className={`form-control ${errors.startDate ? "is-invalid" : ""}`}
            min={new Date().toISOString().split("T")[0]}
            disabled={!nicValidated || isSubmitting}
          />
          {errors.startDate && (
            <div className="invalid-feedback">{errors.startDate.message}</div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label">Duration</label>
          <div className="input-group">
            <input
              type="number"
              placeholder="Value"
              {...register("duration.value", { valueAsNumber: true })}
              className={`form-control ${
                errors.duration?.value ? "is-invalid" : ""
              }`}
              disabled={!nicValidated || isSubmitting}
            />
            <select
              {...register("duration.unit")}
              className={`form-select ${
                errors.duration?.unit ? "is-invalid" : ""
              }`}
              disabled={!nicValidated || isSubmitting}
            >
              <option value="">Select unit</option>
              <option value="week">Week(s)</option>
              <option value="month">Month(s)</option>
              <option value="year">Year(s)</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {errors.duration?.value && (
              <div className="invalid-feedback d-block">
                {errors.duration.value.message}
              </div>
            )}
            {errors.duration?.unit && (
              <div className="invalid-feedback d-block">
                {errors.duration.unit.message}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <label className="me-auto">Departments</label>
        </div>

        {selections.map((selection, index) => (
          <div
            key={index}
            className="card mb-3"
            ref={index === selections.length - 1 ? lastDeptRef : null}
          >
            <div className="card-body">
              <div className="d-flex align-items-start gap-2">
                <div className="flex-grow-1">
                  <Select
                    options={departmentOptions.filter(
                      (option) =>
                        !selections.some(
                          (selection) =>
                            selection.department_id === option.value
                        )
                    )}
                    value={
                      departmentOptions.find(
                        (option) => option.value === selection.department_id
                      ) || null
                    }
                    onChange={(option) => {
                      setValue(
                        `selections.${index}.department_id`,
                        option?.value || -1
                      );
                    }}
                    isDisabled={isSubmitting || !nicValidated}
                    placeholder="Select department..."
                    isClearable={false}
                  />

                  {selection.department_id > 0 && (
                    <div className="mt-2 small">
                      {(() => {
                        const summary = departmentSummary.find(
                          (dept) => dept.dep_id === selection.department_id
                        );

                        if (!summary)
                          return (
                            <div className="text-muted">Summary not found</div>
                          );

                        return (
                          <div className="d-flex gap-3 text-muted">
                            <span>
                              Total department Interviews:{" "}
                              {summary.interview_count}
                            </span>
                            <span>
                              Current Active Trainees: {summary.active_count}
                            </span>
                            <span>Max Capacity: {summary.max_count}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => removeSelection(index)}
                    className="btn btn-outline-danger"
                    disabled={
                      selections.length === 1 || isSubmitting || !nicValidated
                    }
                  >
                    X
                  </button>
                </div>
              </div>
              {errors.selections?.[index]?.department_id && (
                <div className="text-danger small mt-1">
                  {errors.selections[index]?.department_id?.message}
                </div>
              )}

              <div className="row mt-3">
                <div className="col-md-6">
                  <div
                    className="d-flex align-items-center gap-2"
                    style={{ margin: "0.5rem" }}
                  >
                    <label className="form-label small">
                      From: <span className="small text-muted">(Optional)</span>
                    </label>
                    <input
                      {...register(`selections.${index}.from`)}
                      type="date"
                      className={`form-control form-control-sm ${
                        errors.selections?.[index]?.from ? "is-invalid" : ""
                      }`}
                      min={startDate || ""}
                      max={calculatedEndDate || ""}
                      disabled={!nicValidated || isSubmitting}
                    />
                  </div>
                  {errors.selections?.[index]?.from && (
                    <div className="invalid-feedback small">
                      {errors.selections[index]?.from?.message}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <div
                    className="d-flex align-items-center gap-2"
                    style={{ margin: "0.5rem" }}
                  >
                    <label className="form-label small">
                      To: <span className="small text-muted">(Optional)</span>
                    </label>
                    <input
                      {...register(`selections.${index}.to`)}
                      type="date"
                      className={`form-control form-control-sm ${
                        errors.selections?.[index]?.to ? "is-invalid" : ""
                      }`}
                      min={watch(`selections.${index}.from`) || startDate || ""}
                      max={calculatedEndDate || ""}
                      disabled={!nicValidated || isSubmitting}
                    />
                  </div>
                  {errors.selections?.[index]?.to && (
                    <div className="invalid-feedback small">
                      {errors.selections[index]?.to?.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center mb-3">
          <button
            type="button"
            onClick={addSelection}
            className="btn btn-sm btn-primary"
            disabled={!nicValidated || isSubmitting}
          >
            Add Department
          </button>
        </div>

        <div className="d-flex gap-2 justify-content-end">
          <button
            type="button"
            onClick={() => {
              if (isEditing) {
                reset({
                  name: "",
                  email: "",
                  startDate: "",
                  duration: { value: 0, unit: "" },
                  selections: [
                    {
                      department_id: -1,
                      from: "",
                      to: "",
                    },
                  ],
                });
                setNicValidated(Interview.nicValidated);
                setNicDisable(Interview.nicDisable);
              } else {
                reset();
                setNicValidated(false);
                setNicDisable(false);
              }
            }}
            className="btn btn-danger ms-2"
            disabled={!nicValidated || isSubmitting}
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!nicValidated || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </form>
  );
}
