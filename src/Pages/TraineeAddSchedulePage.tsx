import { useLoaderData, useNavigate, useNavigation } from "react-router-dom";
import Loader from "../Components/Loader/Loader";
import { useState } from "react";
import { Trainee } from "../Components/traineeForm/Trainee";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import AddDepartmentModal from "../Components/Modals/AddDepartmentModal";
import Swal from "sweetalert2";
import api from "../api";
const schema = z.object({
  schedules: z
    .array(
      z.object({
        department: z
          .object({
            label: z.string().min(1),
            value: z.string().min(1),
          })
          .refine((department) => department.value != ""),
        start_date: z.string().date("Select a start date"),
        end_date: z.string().date("Select a end date"),
      })
    )
    .min(1, "At least one schedule entry is required"),
});

type formType = z.infer<typeof schema>;

interface LoaderData {
  trainee: Trainee;
  departmentsList: any[];
}

export default function TraineeAddSchedulePage() {
  const { trainee, departmentsList } = useLoaderData() as LoaderData;
  const [departments, setDepartments] = useState<any[]>(departmentsList);
  const departmentsModalVisibility = useState<boolean>(false);
  const setDepartmentsModalVisibility = departmentsModalVisibility[1];
  const {
    control,
    register,
    reset,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<formType>({
    resolver: zodResolver(schema),
    defaultValues: { schedules: [{ department: { value: "", label: "" } }] },
  });

  const { fields, append, remove } = useFieldArray({ control: control, name: "schedules" });

  const { state } = useNavigation();

  const navigate = useNavigate();

  const onSubmit = async (formData: formType) => {
    let data: any = formData;
    data.schedules = data.schedules.map((schedule: any) => {
      return {
        ...schedule,
        department: schedule.department.value,
      };
    });
    data.traineeId = trainee.id;
    console.log(data);
    // API call to create a new schedule entry
    Swal.fire({
      title: "Are you Sure?",
      text: "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Insert Trainee Schedule",
    })
      .then(async (result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "Please Wait... ",
            didOpen: () => {
              Swal.showLoading();
            },
          });

          const response = await api.post("/api/trainee/schedule", data);
          console.log(response);
          Swal.fire({
            title: "created!",
            text: "schedule has been Added to the database .",
            icon: "success",
          });
          reset();
          navigate("/Trainee");
        }
      })
      .catch((errors) => {
        console.log(errors);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
          footer: '<a href="#">Why do I have this issue?</a>',
        });

        if (errors.response && errors.response.data && errors.response.data.errors) {
          const errorObject = errors.response.data.errors;
          for (const key in errorObject) {
            const error = errorObject[key][0];
            setError(key as keyof formType, { message: error }, { shouldFocus: true });
          }
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Something went wrong!" + errors,
            footer: '<a href="#">Why do I have this issue?</a>',
          });
        }
      });
  };
  return (
    <>
      {state == "loading" ? (
        <Loader />
      ) : (
        <div className="">
          {/* <button
            type="button"
            onClick={() => {
              console.log(errors);
            }}
          >
            show errors
          </button> */}
          {/* header section */}
          <section className="bg-primary-subtle ">
            <div className="px-3 fw-bold fs-3">Add Trainee Schedules</div>
          </section>
          <section className=" m-1 border border-dark-subtle border-2 rounded bg-body-tertiary px-2">
            <div className="container-fluid border border-dark rounded-2 my-2">
              <div className=" fs-5 fw-bolder">Trainee Details</div>
              <div className="">
                <div className=" fw-semibold">Reg NO - {trainee.REG_NO}</div>
                <div className="fw-semibold">ATT NO - {trainee.ATT_NO}</div>
                <div className="fw-semibold">NIC NO - {trainee.NIC_NO}</div>
              </div>
            </div>
            <div>
              <div className=" text-black-50">
                Add the department if the desired department is not in the list
              </div>
              <button
                onClick={() => {
                  setDepartmentsModalVisibility(true);
                }}
                className="mt-1 link d-inline badge btn text-dark btn-outline-primary border-3 btn-sm"
              >
                Add Department
              </button>
            </div>
            <div className="container-fluid border border-dark rounded-2 my-2">
              <div className=" fs-5 fw-bolder">Trainee Schedule</div>
              <form className="bg-body-tertiary p-2" onSubmit={handleSubmit(onSubmit)}>
                {fields.map((item, index) => (
                  <div key={item.id} className="mb-2 p-2 bg-body-secondary rounded-3">
                    <div className="mb-3">
                      <div className=" d-flex">
                        <label className="form-label">Department</label>
                        <div
                          className=" ms-auto btn btn-sm btn-close bg-danger border-danger"
                          onClick={() => {
                            remove(index);
                          }}
                        ></div>
                      </div>
                      <Controller
                        name={`schedules.${index}.department`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={departments.map((department: any) => {
                              return {
                                label: department.name,
                                value: department.id + "",
                              };
                            })}
                            onChange={(value) => field.onChange(value)}
                            placeholder="Select a Department"
                          />
                        )}
                      />
                      {errors.schedules?.[index]?.department && (
                        <p className="text-danger">{errors.schedules[index].department?.message}</p>
                      )}
                    </div>
                    <div className="d-flex mt-2">
                      <div className="w-50">
                        <label>Start Date</label>

                        <input
                          className="form-control"
                          type="date"
                          {...register(`schedules.${index}.start_date`)}
                        />

                        {errors.schedules?.[index]?.start_date && (
                          <p className="text-danger">
                            {errors.schedules[index].start_date?.message}
                          </p>
                        )}
                      </div>
                      <div className="w-50 ms-4">
                        <label>End Date</label>

                        <input
                          className="form-control"
                          type="date"
                          {...register(`schedules.${index}.end_date`)}
                        />

                        {errors.schedules?.[index]?.end_date && (
                          <p className="text-danger">{errors.schedules[index].end_date?.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    append({
                      department: {
                        label: "",
                        value: "",
                      },
                      start_date: "",
                      end_date: "",
                    })
                  }
                >
                  Add Schedule
                </button>
                <div className="d-flex">
                  <button
                    className="btn btn-danger ms-auto me-3 "
                    type="button"
                    onClick={() => {
                      reset();
                    }}
                  >
                    Reset
                  </button>
                  <button className="btn btn-primary">Submit</button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}
      <AddDepartmentModal
        setDepartments={setDepartments}
        visibilityState={departmentsModalVisibility}
      />
    </>
  );
}
