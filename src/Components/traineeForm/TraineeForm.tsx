import { z } from "zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import Select from "react-select";
import { SelectOption } from "../../types";
import { Trainee as TraineeType } from "./Trainee";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../../api.ts";
import Swal from "sweetalert2";
import { formatDateToIso } from "../../helpers.ts";
import { useNavigate } from "react-router-dom";
// Define the validation schema
const schema = z.object({
  ATT_NO: z.coerce
    .number({ message: "Should only contain numbers" })
    .gt(0, "Enter the attendence number")
    .nonnegative(),
  REG_NO: z.string().min(1, "Enter the registration number"),
  Uname: z.string().min(1, "Enter the user name"),
  NIC_NO: z.string().min(1, "Enter the NIC number"),
  TEL_NO: z.string().regex(/^\d{9,10}$/, "Invalid Format, e.g., 0771231231"),
  TRAINING_PROGRAMME: z.string().min(1, "Enter the training programme"),
  UNIVERSITY_INSTITUTE: z.string().min(1, "Enter the university and institute"),
  Jstart_date: z.string().date("Select a starting date for the journey"),
  Jend_date: z.string().date("Select a end date for the journey"),
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
  TRAINING_PERIOD: z.object({
    label: z.string().min(1),
    value: z.string().min(1),
  }),
});

// Infer the types.
type TraineeFormValues = z.infer<typeof schema>;

interface TraineeFormProps {
  trainee?: TraineeType;
  className?: string;
  departmentOptions: any;
  periods: any;
}

export default function TraineeForm({
  trainee,
  periods,
  className,
  departmentOptions,
}: TraineeFormProps) {
  const navigate = useNavigate();
  const {
    control,
    handleSubmit,
    register,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TraineeFormValues>({
    defaultValues: trainee
      ? {
          ATT_NO: trainee.ATT_NO,
          REG_NO: trainee.REG_NO,
          Uname: trainee.name,
          NIC_NO: trainee.NIC_NO,
          TEL_NO: trainee.contact_no.toString(),
          Jstart_date: formatDateToIso(trainee.start_date),
          Jend_date: formatDateToIso(trainee.end_date),
          TRAINING_PROGRAMME: trainee.program,
          UNIVERSITY_INSTITUTE: trainee.institute,
          TRAINING_PERIOD: { value: trainee.training_period, label: trainee.training_period },
          schedules: trainee.schedules.map((schedule) => {
            console.log(schedule);
            return {
              department: {
                label: schedule.name,
                value: schedule.name,
              },
              start_date: formatDateToIso(schedule.start_date),
              end_date: formatDateToIso(schedule.end_date),
            };
          }),
        }
      : { schedules: [{ department: { value: "", label: "" } }] },
    resolver: zodResolver(schema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedules",
  });

  const onSubmit = async (data: any) => {
    console.log(data);
    if (trainee) {
      Swal.fire({
        title: "Are you Sure?",
        text: "",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Update Trainee Data",
      })
        .then(async (result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: "Please Wait... ",
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              },
            });
            data.TRAINING_PERIOD = data.TRAINING_PERIOD.value;
            data.schedules = data.schedules.map((schedule: any) => {
              return {
                ...schedule,
                department: schedule.department.value,
              };
            });
            const response = await api.put(`/api/trainee/${data.NIC_NO}`, data);
            console.log(response);
            Swal.fire({
              title: "updated!",
              text: "trainee data has been updated.",
              icon: "success",
            });
            reset();
            navigate("/Trainee", { replace: true });
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
              setError(key as keyof TraineeFormValues, { message: error }, { shouldFocus: true });
            }
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Something went wrong!" + errors,
              footer: '<a href="#">Why do I have this issue?</a>',
            });
          }
        });
    } else {
      Swal.fire({
        title: "Are you Sure?",
        text: "",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Insert Trainee Data",
      })
        .then(async (result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: "Please Wait... ",
              didOpen: () => {
                Swal.showLoading();
              },
            });
            data.TRAINING_PERIOD = data.TRAINING_PERIOD.value;
            data.schedules = data.schedules.map((schedule: any) => {
              return {
                ...schedule,
                department: schedule.department.value,
              };
            });
            const response = await api.post("/api/trainee", data);
            console.log(response);
            Swal.fire({
              title: "created!",
              text: "new Trainee has been Added to the database .",
              icon: "success",
            });
            reset();
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
              setError(key as keyof TraineeFormValues, { message: error }, { shouldFocus: true });
            }
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Something went wrong!" + errors,
              footer: '<a href="#">Why do I have this issue?</a>',
            });
          }
        });
    }

    console.log("Form Data:", data);
    console.log(errors);
  };

  return (
    <form className={className} onSubmit={handleSubmit(onSubmit)}>
      <div className=" text-danger">{errors && errors.root?.message}</div>
      <div className="fs-5 fw-semibold mb-2">Trainee Details</div>
      <div className=" bg-body-tertiary p-2">
        <div className="mb-3">
          <label className="form-label">Trainee Name</label>
          <input type="text" className="form-control" {...register("Uname")} />
          {errors.Uname && <p className="text-danger">{errors.Uname.message}</p>}
        </div>

        <div className="mb-3">
          <label className="form-label">Attendence Number</label>
          <input type="text" className="form-control" {...register("ATT_NO")} />
          {errors.ATT_NO && <p className="text-danger">{errors.ATT_NO.message}</p>}
        </div>

        <div className="mb-3">
          <label className="form-label">Registration Number</label>
          <input type="text" className="form-control" {...register("REG_NO")} />
          {errors.REG_NO && <p className="text-danger">{errors.REG_NO.message}</p>}
        </div>

        <div className="mb-3">
          <label className="form-label">NIC Number</label>
          <input
            type="text"
            disabled={trainee ? true : false}
            className="form-control"
            {...register("NIC_NO")}
          />
          {errors.NIC_NO && <p className="text-danger">{errors.NIC_NO.message}</p>}
        </div>

        <div className="mb-3">
          <label className="form-label">University/Institute</label>
          <input type="text" className="form-control" {...register("UNIVERSITY_INSTITUTE")} />
          {errors.UNIVERSITY_INSTITUTE && (
            <p className="text-danger">{errors.UNIVERSITY_INSTITUTE.message}</p>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Training Programme</label>
          <input type="text" className="form-control" {...register("TRAINING_PROGRAMME")} />
          {errors.TRAINING_PROGRAMME && (
            <p className="text-danger">{errors.TRAINING_PROGRAMME.message}</p>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Tel No</label>
          <input type="text" className="form-control" {...register("TEL_NO")} />
          {errors.TEL_NO && <p className="text-danger">{errors.TEL_NO.message}</p>}
        </div>

        <div className="mb-3">
          <label className="form-label">Training Period</label>
          <Controller
            name="TRAINING_PERIOD"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={periods.map((period: any) => {
                  return {
                    value: period.id,
                    label: period.name,
                  };
                })}
                onChange={(value) => field.onChange(value)}
                placeholder="Select a training period"
              />
            )}
          />
          {errors.TRAINING_PERIOD && (
            <p className="text-danger">{errors.TRAINING_PERIOD.message}</p>
          )}
        </div>
      </div>

      <div className="fs-5 fw-semibold mb-2">Trainee Journey</div>
      <div className="bg-body-tertiary p-2">
        <div className="w-50">
          <label>Start Date</label>

          <input className="form-control" type="date" {...register("Jstart_date")} />

          {errors.Jstart_date && <p className="text-danger ">{errors.Jstart_date.message}</p>}
        </div>
        <div className="w-50  mt-1">
          <label>End Date</label>
          <input className="form-control" type="date" {...register("Jend_date")} />
          {errors.Jend_date && <p className="text-danger">{errors.Jend_date.message}</p>}
        </div>
      </div>

      <div className="fs-5 fw-semibold mb-2">Trainee Time Schedule</div>
      <div className="bg-body-tertiary p-2">
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
                    options={departmentOptions.map((department: any): SelectOption => {
                      return {
                        label: department.Name,
                        value: department.Name,
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
                  <p className="text-danger">{errors.schedules[index].start_date?.message}</p>
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
      </div>
      <div className=" d-flex">
        <div className="ms-auto d-flex ">
          <button
            className="btn btn-danger mt-3"
            onClick={() => {
              reset();
            }}
          >
            {" "}
            Reset
          </button>
          <button disabled={isSubmitting} type="submit" className="btn btn-primary mt-3 ms-2">
            {isSubmitting ? "Submiting...." : "Submit"}
          </button>
        </div>
      </div>

      {/* <button
        type="button"
        className="btn btn-danger"
        onClick={() => {
          console.log(errors);
        }}
      >
        Show Errors
      </button> */}
    </form>
  );
}
