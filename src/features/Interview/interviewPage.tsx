import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";
import NIC from "../../Components/traineeForm/NIC";
import api from "../../api";
import Swal from "sweetalert2";
import { departmentSummaryLoader } from "../../loaders/DepartmentLoader";

interface DepartmentSummary {
  name: string;
  dep_id: number;
  max_count: number;
  active_count: number;
  interview_count: number;
  lastUpdated: Date;
}

const schema = z.object({
  name: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  duration: z.object({
    value: z.number().min(1, "Duration value is required"),
    unit: z.string().min(1, "Duration unit is required")
  }),
  selections: z.array(
    z.object({
      departmentId: z.number().min(1, "Department is required"),
    })
  ).min(1, "At least one department selection is required")
});

export default function NewInterviewPage() {
  const [nic, setNic] = useState<any>(null);
  const [nicValidated, setNicValidated] = useState(false);
  const [nicDisable, setNicDisable] = useState(false);
  const [departmentSummary, setDepartmentSummary] = useState<DepartmentSummary[]>([]);
  //const [liveSummaries, setLiveSummaries] = useState<Record<number, DepartmentSummary>>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      startDate: "",
      duration: {
        value: 0,
        unit: ""
      },
      selections: [{ departmentId: 0 }]
    }
  });

  const selections = watch("selections") || [{ departmentId: 0 }];

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

  const departmentOptions = departmentSummary.map(dept => ({
    value: dept.dep_id,
    label: dept.name
  }));

  const addSelection = () => {
    setValue("selections", [...selections, { departmentId: 0 }]);
  };

  const removeSelection = (index: number) => {
    const newSelections = selections.filter((_, i) => i !== index);
    setValue("selections", newSelections.length ? newSelections : [{ departmentId: 0 }]);
  };

  const getDepartmentSummary = (departmentId: number) => {
    if (!departmentId) return null;
    return departmentSummary[departmentId] || null;
  };

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const body ={
        nic: nic,
        name: data.name,
        startDate: data.startDate,
        duration: `${data.duration.value} ${data.duration.unit}`,
        departments: data.selections.map(selection => selection.departmentId)
      };

      console.log(JSON.stringify(body));
      //const response = await api.post("",body);

      Swal.fire({
        title: "Success!",
        text: "Interview schedule saved successfully",
        icon: "success"
      }).then(() => {
        reset();
        setNic("");
        setNicValidated(false);
        setNicDisable(false);
      });
    } catch (error) {
      console.error("Form submission error:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to save interview schedule",
        icon: "error"
      });
    }
  };

  return (
    <MainContainer title="Trainee Interview" breadCrumbs={["Interviews", "Interview"]}>
      <SubContainer>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <NIC
            nicDisableState={[nicDisable, setNicDisable]}
            className="mb-3"
            setNIC_NO={(value) => {
              setNic(value);
              setNicValidated(true);
            }}
            nic={nic}
          />

          <div className="mb-4">
            <label className="form-label">Name</label>
            <input
              {...register("name")}
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              disabled={!nicValidated || isSubmitting}
            />
            {errors.name && (
              <div className="invalid-feedback">{errors.name.message}</div>
            )}
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label">Start Date</label>
              <input
                {...register("startDate")}
                type="date"
                className={`form-control ${errors.startDate ? "is-invalid" : ""}`}
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
                  {...register("duration.value", { valueAsNumber: true })}
                  className={`form-control ${errors.duration?.value ? "is-invalid" : ""}`}
                  disabled={!nicValidated || isSubmitting}
                />
                <select
                  {...register("duration.unit")}
                  className={`form-select ${errors.duration?.unit ? "is-invalid" : ""}`}
                  disabled={!nicValidated || isSubmitting}
                >
                  <option value="">Select unit</option>
                  <option value="week">Week(s)</option>
                  <option value="month">Month(s)</option>
                  <option value="year">Year(s)</option>
                </select>
              </div>
              {errors.duration?.value && (
                <div className="invalid-feedback d-block">{errors.duration.value.message}</div>
              )}
              {errors.duration?.unit && (
                <div className="invalid-feedback d-block">{errors.duration.unit.message}</div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <label className="me-auto">Departments</label>
              <button
                type="button"
                onClick={addSelection}
                className="btn btn-sm btn-primary"
                disabled={!nicValidated || isSubmitting}
              >
                Add Department
              </button>
            </div>

            {selections.map((_, index) => (
              <div key={index} className="card mb-3">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-11">
                      <Select
                        options={departmentOptions}
                        onChange={(option) => 
                          setValue(`selections.${index}.departmentId`, option?.value || 0)
                        }
                        isDisabled={isSubmitting || !nicValidated}
                        placeholder="Select department..."
                      />
                        {selections[index].departmentId > 0 && (
                        <div className="mt-2 small">
                          {(() => {
                          const summary = getDepartmentSummary(selections[index].departmentId);
                          if (!summary) return <div className="text-muted">Loading summary...</div>;
                          
                          return (
                            <div className="d-flex gap-3 text-muted">
                            <span>Summary:</span>
                            <span>Total Interviews: {summary.interview_count}</span>
                            <span>Active Trainees: {summary.active_count}</span>
                            <span>Max Capacity: {summary.max_count}</span>
                            </div>
                          );
                          })()}
                        </div>
                        )}
                    </div>
                    <div className="col-md-1">
                      <button
                        type="button"
                        onClick={() => removeSelection(index)}
                        className="btn btn-outline-danger"
                        disabled={selections.length === 1 || isSubmitting}
                      >
                        X
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex gap-2 justify-content-end">
            <button
              type="button"
              onClick={() => reset()}
              className="btn btn-secondary"
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
        </form>
      </SubContainer>
    </MainContainer>
  );
}
