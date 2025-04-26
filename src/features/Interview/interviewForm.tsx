import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import NIC from "../../Components/traineeForm/NIC";
import api from "../../api";
import Swal from "sweetalert2";
import { departmentSummaryLoader } from "../../loaders/DepartmentLoader";
import { useNavigate } from "react-router-dom";

interface DepartmentSummary {
  name: string;
  dep_id: number;
  max_count: number;
  active_count: number;
  interview_count: number;
}

const schema = z.object({
  name: z.string().optional(),
  startDate: z.string().min(1,"start date is required"),
  duration: z.object({
    value: z.number().min(1, "Duration value is required"),
    unit: z.string().min(1, "Duration unit is required")
  }),
  selections: z.array(
    z.object({
      departmentId: z.number().min(1, "Department is required"),
      fromDate: z.string().min(1, "From date is required"),
      toDate: z.string().min(1, "To date is required")
    })
  ).min(1, "At least one department selection is required")
});

type FormData = z.infer<typeof schema>;

type InterviewProps = {
    NIC?: string | undefined;
    selections: ({ 
      departmentId?: number;
      fromDate?: string;
      toDate?: string;
    } | undefined)[] | undefined;
    duration?: { value: number ; unit: string; } | undefined;
    startDate?: string | undefined;
    name?: string | undefined;
    nicValidated: boolean;
    nicDisable: boolean;
    isEditing?: boolean;
}

export default function InterviewForm(Interview : InterviewProps) {

      const [nic, setNic] = useState<any>(Interview.NIC);
      const [nicValidated, setNicValidated] = useState(Interview.nicValidated);
      const [nicDisable, setNicDisable] = useState(Interview.nicDisable);
      const [departmentSummary, setDepartmentSummary] = useState<DepartmentSummary[]>([]);
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
        defaultValues: Interview ?{
            name: Interview.name,
            startDate: Interview.startDate,
            duration: Interview.duration,
            selections: Interview.selections
            ?.filter(sel => sel !== undefined)
            ?.map(sel => ({
              departmentId: sel?.departmentId || -1,
              fromDate: sel?.fromDate || "",
              toDate: sel?.toDate || ""
            })) || []
          } : undefined,
      });
    
      const selections = watch("selections") || [{ departmentId: -1, fromDate: "", toDate: "" }];
    
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
        setValue("selections", [...selections, { departmentId: -1, fromDate: "", toDate: "" }]);
      };
    
      const removeSelection = (index: number) => {
        const newSelections = selections.filter((_, i) => i !== index);
        setValue("selections", newSelections.length ? newSelections : [{ departmentId: -1, fromDate: "", toDate: "" }]);
      };
    
      const onSubmit = async (data: FormData) => {
        try {
          const body ={
            nic: nic,
            name: data.name,
            startDate: data.startDate,
            duration: `${data.duration.value} ${data.duration.unit}`,
            departments: data.selections.map(selection => ({
              id: selection.departmentId,
              from: selection.fromDate,
              to: selection.toDate
            }))
          };
          
          if(isEditing){
            console.log("edit: ", body);
            //const response = await api.put("",body);

            Swal.fire({
              title: "Success!",
              text: "Interview schedule changed successfully",
              icon: "success"
            }).then(() => {
              setNicValidated(true);
              setNicDisable(true);
              navigate("/OJT/interview");
            });

          }else{
            console.log("insert: ", body);
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
          }
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
                  placeholder="Value"
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
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {errors.duration?.value && (
                  <div className="invalid-feedback d-block">{errors.duration.value.message}</div>
                )}
                {errors.duration?.unit && (
                  <div className="invalid-feedback d-block">{errors.duration.unit.message}</div>
                )}
              </div>
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

            {selections.map((selection, index) => (
              <div key={index} className="card mb-3">
                <div className="card-body">
                  <div className="d-flex align-items-start gap-2">
                    <div className="flex-grow-1">
                      <Select
                        options={departmentOptions.filter(option => 
                          !selections.some(selection => selection.departmentId === option.value))}
                        value={departmentOptions.find(
                          option => option.value === selection.departmentId
                        )|| null}
                        onChange={(option) => {
                          setValue(`selections.${index}.departmentId`, option?.value || -1)
                        }}
                        isDisabled={isSubmitting || !nicValidated}
                        placeholder="Select department..."
                        isClearable={false}
                      />
                      
                      {selection.departmentId > 0 && (
                        <div className="mt-2 small">
                          {(() => {
                            const summary = departmentSummary.find(
                              dept => dept.dep_id === selection.departmentId
                            );
                            
                            if (!summary) return (
                              <div className="text-muted">Summary not found</div>
                            );

                            return (
                              <div className="d-flex gap-3 text-muted">
                                <span>Total Interviews: {summary.interview_count}</span>
                                <span>Active Trainees: {summary.active_count}</span>
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
                        disabled={selections.length === 1 || isSubmitting || !nicValidated}
                      >
                        X
                      </button>
                    </div>
                  </div>
                  {errors.selections?.[index]?.departmentId && (
                    <div className="text-danger small mt-1">
                      {errors.selections[index]?.departmentId?.message}
                    </div>
                  )}
                
                <div className="row mt-3">
                  <div className="col-md-6">
                    <div className="d-flex align-items-center gap-2" style={{ margin: "0.5rem" }}>
                      <label className="form-label small">From:</label>
                      <input
                        {...register(`selections.${index}.fromDate`)}
                        type="date"
                        className={`form-control form-control-sm ${
                          errors.selections?.[index]?.fromDate ? "is-invalid" : ""
                        }`}
                        disabled={!nicValidated || isSubmitting}
                      />
                    </div>
                    {errors.selections?.[index]?.fromDate && (
                      <div className="invalid-feedback small">
                        {errors.selections[index]?.fromDate?.message}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center gap-2" style={{ margin: "0.5rem" }}>
                      <label className="form-label small">To:</label>
                      <input
                        {...register(`selections.${index}.toDate`)}
                        type="date"
                        className={`form-control form-control-sm ${
                          errors.selections?.[index]?.toDate ? "is-invalid" : ""
                        }`}
                        disabled={!nicValidated || isSubmitting}
                      />
                    </div>
                    {errors.selections?.[index]?.toDate && (
                      <div className="invalid-feedback small">
                        {errors.selections[index]?.toDate?.message}
                      </div>
                    )}
                  </div>
                </div>     
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex gap-2 justify-content-end">
            <button
              type="button"
              onClick={() =>{
                if(isEditing){
                  reset({
                    name: "",
                    startDate: "",
                    duration: { value: 0, unit: "" },
                    selections: [{ 
                      departmentId: -1, 
                      fromDate: "", 
                      toDate: "" 
                    }],
                  });
                }else{
                  reset();
                  setNic("");
                }
                setNicValidated(Interview.nicValidated);
                setNicDisable(Interview.nicDisable);
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
        </form>
    );
};

