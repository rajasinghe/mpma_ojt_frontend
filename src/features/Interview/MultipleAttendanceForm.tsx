import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";
import api from "../../api";
import AddInstituteModal from "../../Components/traineeForm/AddInstituteModal";

// Define the schema for form validation
const schema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  institute: z.string().min(1, "Institute is required"),
  numberOfInterviews: z.number().min(1, "Number of interviews must be at least 1"),
  interviews: z.array(
    z.object({
      nic: z.string().min(1, "NIC is required"),
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email format"),
      duration: z.number().min(1, "Duration must be at least 1 month"),
      departmentId: z.number().min(1, "Department is required"),
    })
  ),
});

type FormData = z.infer<typeof schema>;

export default function MultipleAttendanceForm() {
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [institutes, setInstitutes] = useState<{ id: number; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showInstituteModal, setShowInstituteModal] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      startDate: "",
      institute: "",
      numberOfInterviews: 1,
      interviews: [{ nic: "", name: "", email: "", duration: 1, departmentId: -1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "interviews", 
  });

  const numberOfInterviews = watch("numberOfInterviews");

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get("api/department/summary");
        const departmentsData = response.data.map((dept: any) => ({
          id: dept.dep_id,
          name: dept.name,
        }));
        setDepartments(departmentsData);
      } catch (error) {
        console.error("Error fetching departments:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load departments",
        });
      }
    };

    fetchDepartments();
  }, []);

  // Fetch institutes
  useEffect(() => {
    const fetchInstitutes = async () => {
      try {
        const response = await api.get("api/institutes");
        const institutesData = response.data.map((inst: any) => ({
          id: inst.id,
          name: inst.name,
        }));
        setInstitutes(institutesData);
      } catch (error) {
        console.error("Error fetching institutes:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load institutes",
        });
      }
    };

    fetchInstitutes();
  }, []);

  // Update the number of interview rows when numberOfInterviews changes
  useEffect(() => {
    const currentLength = fields.length;
    if (numberOfInterviews > currentLength) {
      // Add new rows
      const rowsToAdd = numberOfInterviews - currentLength;
      for (let i = 0; i < rowsToAdd; i++) {
        append({ nic: "", name: "", email: "", duration: 1, departmentId: -1 });
      }
    } else if (numberOfInterviews < currentLength) {
      // Remove excess rows
      const rowsToRemove = currentLength - numberOfInterviews;
      for (let i = 0; i < rowsToRemove; i++) {
        remove(currentLength - 1 - i);
      }
    }
  }, [numberOfInterviews, fields.length, append, remove]);

  const onSubmit = async (data: FormData) => {
    try {
      // Show confirmation dialog
      const result = await Swal.fire({
        title: "Add Multiple Interviews",
        text: `Are you sure you want to add ${data.numberOfInterviews} interviews?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, add them!",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      // Show loading indicator
      Swal.fire({
        title: "Adding Interviews...",
        text: "Please wait while we add the interviews.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Process each interview
      const promises = data.interviews.map(async (interview) => {
        const body = {
          nic: interview.nic,
          name: interview.name,
          email: interview.email,
          startDate: data.startDate,
          duration: `${interview.duration} month${interview.duration > 1 ? 's' : ''}`,
          departments: [
            {
              department_id: interview.departmentId,
              from: null,
              to: null,
            },
          ],
        };

        return api.post("/api/interview", body);
      });

      // Wait for all requests to complete
      await Promise.all(promises);

      // Show success message
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `${data.numberOfInterviews} interviews added successfully!`,
      });

      // Reset form
      setValue("startDate", "");
      setValue("institute", "");
      setValue("numberOfInterviews", 1);
      // Reset interview rows
      remove();
      append({ nic: "", name: "", email: "", duration: 1, departmentId: -1 });
      setShowForm(false);
    } catch (error) {
      console.error("Error adding interviews:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to add interviews. Please try again.",
      });
    }
  };

  return (
    <div className="container mt-4">
      <h2>Add Multiple Interviews</h2>
      
      {!showForm ? (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Configure Multiple Interviews</h5>
            <div className="mb-3">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className={`form-control ${errors.startDate ? "is-invalid" : ""}`}
                {...register("startDate")}
              />
              {errors.startDate && (
                <div className="invalid-feedback">{errors.startDate.message}</div>
              )}
            </div>
            
            <div className="mb-3">
              <label className="form-label">Institute</label>
              <div className="d-flex gap-2">
                <select
                  className={`form-select ${errors.institute ? "is-invalid" : ""}`}
                  {...register("institute")}
                >
                  <option value="">Select an institute</option>
                  {institutes.map((inst) => (
                    <option key={inst.id} value={inst.name}>
                      {inst.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => setShowInstituteModal(true)}
                >
                  Add New
                </button>
              </div>
              {errors.institute && (
                <div className="invalid-feedback">{errors.institute.message}</div>
              )}
            </div>
            
            <div className="mb-3">
              <label className="form-label">Number of Interviews</label>
              <input
                type="number"
                className={`form-control ${errors.numberOfInterviews ? "is-invalid" : ""}`}
                {...register("numberOfInterviews", { valueAsNumber: true })}
                min="1"
              />
              {errors.numberOfInterviews && (
                <div className="invalid-feedback">{errors.numberOfInterviews.message}</div>
              )}
            </div>
            
            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card mb-4">
            <div className="card-header">
              <h5>Interview Details</h5>
              <p className="mb-0">
                Start Date: {watch("startDate")} | Institute: {watch("institute")} | 
                Number of Interviews: {watch("numberOfInterviews")}
              </p>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>NIC</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Duration (Months)</th>
                      <th>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id}>
                        <td>
                          <input
                            type="text"
                            className={`form-control ${errors.interviews?.[index]?.nic ? "is-invalid" : ""}`}
                            {...register(`interviews.${index}.nic`)}
                            placeholder="Enter NIC"
                          />
                          {errors.interviews?.[index]?.nic && (
                            <div className="invalid-feedback">
                              {errors.interviews[index]?.nic?.message}
                            </div>
                          )}
                        </td>
                        <td>
                          <input
                            type="text"
                            className={`form-control ${errors.interviews?.[index]?.name ? "is-invalid" : ""}`}
                            {...register(`interviews.${index}.name`)}
                            placeholder="Enter name"
                          />
                          {errors.interviews?.[index]?.name && (
                            <div className="invalid-feedback">
                              {errors.interviews[index]?.name?.message}
                            </div>
                          )}
                        </td>
                        <td>
                          <input
                            type="email"
                            className={`form-control ${errors.interviews?.[index]?.email ? "is-invalid" : ""}`}
                            {...register(`interviews.${index}.email`)}
                            placeholder="Enter email"
                          />
                          {errors.interviews?.[index]?.email && (
                            <div className="invalid-feedback">
                              {errors.interviews[index]?.email?.message}
                            </div>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            className={`form-control ${errors.interviews?.[index]?.duration ? "is-invalid" : ""}`}
                            {...register(`interviews.${index}.duration`, { valueAsNumber: true })}
                            min="1"
                          />
                          {errors.interviews?.[index]?.duration && (
                            <div className="invalid-feedback">
                              {errors.interviews[index]?.duration?.message}
                            </div>
                          )}
                        </td>
                        <td>
                          <select
                            className={`form-select ${errors.interviews?.[index]?.departmentId ? "is-invalid" : ""}`}
                            {...register(`interviews.${index}.departmentId`, { valueAsNumber: true })}
                          >
                            <option value={-1}>Select Department</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                          {errors.interviews?.[index]?.departmentId && (
                            <div className="invalid-feedback">
                              {errors.interviews[index]?.departmentId?.message}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add All"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
      <AddInstituteModal
        visibilityState={[showInstituteModal, setShowInstituteModal]}
        setInstitutes={setInstitutes}
      />
    </div>
  );
}