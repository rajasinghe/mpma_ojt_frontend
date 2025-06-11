import { useLoaderData, useNavigate, useNavigation, useSearchParams } from "react-router-dom";
import Loader from "../Components/ui/Loader/Loader";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import AddDepartmentModal from "../Components/Modals/AddDepartmentModal";
import Swal from "sweetalert2";
import api from "../api";
import { endDateCalculator, formatDateToIso } from "../helpers";
import AddPeriodModal from "../Components/traineeForm/AddPeriodModal";
import moment from "moment";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";

const schema = z.object({
  schedules: z.array(
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
  ),
  start_date: z.string().date("Select a starting date for the journey"),
  end_date: z.string().date(),
  period: z.object({
    label: z.string().min(1),
    value: z.string().min(1),
  }),
});

type formType = z.infer<typeof schema>;

interface LoaderData {
  trainee: any;
  departmentsList: any[];
  periodsList: any[];
}

export default function TraineeAddSchedulePage() {
  const { trainee, departmentsList, periodsList } = useLoaderData() as LoaderData;
  const params = useSearchParams();
  
  useEffect(() => {
    console.log(params);
    console.log(trainee);
    console.log(departmentsList);
    console.log(periodsList);
  }, []);
  
  const [departments, setDepartments] = useState<any[]>(departmentsList);
  const [periods, setPeriods] = useState<any[]>(periodsList);
  const departmentsModalVisibility = useState<boolean>(false);
  const setDepartmentsModalVisibility = departmentsModalVisibility[1];
  const periodModalVisibilityState = useState<boolean>(false);
  const setPeriodModalVisibility = periodModalVisibilityState[1];
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [manualEndDate, setManualEndDate] = useState<Date | null>(null);
  const [isManualEndDate, setIsManualEndDate] = useState<boolean>(false);
  const [IsChanged, setIsChanged] = useState<boolean>(false);
  

  const {
    control,
    reset,
    register,
    setError,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<formType>({
    resolver: zodResolver(schema),
    defaultValues: trainee.schedules
      ? {
          start_date: formatDateToIso(trainee.start_date),
          period: {
            value: trainee.training_period_id + "",
            label:
              periodsList.find((period) => trainee.training_period_id == period.id).name ||
              "not in the list",
          },
          end_date: formatDateToIso(trainee.end_date),
          schedules: trainee.schedules.map((schedule: any) => {

            return {
              start_date: formatDateToIso(schedule.start_date),
              end_date: formatDateToIso(schedule.end_date),
              department: {
                value: schedule.department_id + "",
                label: departmentsList.find((department) => department.id == schedule.department_id)
                  .name,
              },
            };
          }),
        }
      : {
          start_date: formatDateToIso(trainee.start_date),
          period: {
            value: trainee.training_period_id + "",
            label:
              periodsList.find((period) => trainee.training_period_id == period.id).name ||
              "not in the list",
          },
          schedules: [{ department: { value: "", label: "" } }],
        },
  });

  const startDate = watch("start_date");
  const selectedPeriod = watch("period");

  useEffect(() => {

    if (IsChanged && startDate && selectedPeriod?.value) {
      try {
        const newEndDate = endDateCalculator(
          periodsList,
          parseInt(selectedPeriod.value),
          new Date(startDate)
        );
        setEndDate(newEndDate);
        
        // Reset to calculated end date when period or start date changes
        setIsManualEndDate(false);
        setManualEndDate(newEndDate);
        
      } catch (error) {
        setError("root", { message: "Invalid period or start date" });
      }
    }
  }, [watch("start_date"), watch("period")]);

  useEffect(() => {

    const newEndDate = endDateCalculator(
      periodsList,
      parseInt(selectedPeriod.value),
      new Date(startDate)
    );

    if(newEndDate.getTime() !== new Date(trainee.end_date).getTime()) {
      setIsManualEndDate(true);
      setManualEndDate(new Date(trainee.end_date));
    } 
    
  },[]);

  const { fields, append, remove } = useFieldArray({ control: control, name: "schedules" });

  const { state } = useNavigation();

  const navigate = useNavigate();

  const sortAndValidateSchedules = (schedules: formType['schedules']) => {
  // Sort schedules by start date
  const sortedSchedules = [...schedules].sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  // Check that each schedule's end date is before the next schedule's start date
  for (let i = 0; i < sortedSchedules.length - 1; i++) {
    if (new Date(sortedSchedules[i].end_date) >= new Date(sortedSchedules[i + 1].start_date)) {
      return {
        isValid: false,
        message: `Schedule ending on ${new Date(sortedSchedules[i].end_date).toLocaleDateString()} must complete before next schedule starting on ${new Date(sortedSchedules[i + 1].start_date).toLocaleDateString()}`,
        sortedSchedules: schedules
      };
    }
  }

  return {
    isValid: true,
    sortedSchedules: sortedSchedules,
    message: ''
    };
  };

  const onSubmit = async (formData: formType) => {

    const validation = sortAndValidateSchedules(formData.schedules);
    
    if (!validation.isValid) {
      Swal.fire({
        icon: 'error',
        title: 'Schedule is Clashing',
        text: validation.message,
      });
      return;
    }

    // Update form data with sorted schedules
    formData.schedules = validation.sortedSchedules;

    console.log(formData);
    let data: any = formData;
    data.period = formData.period.value;
    if (endDate) {
      data.end_date = manualEndDate?.toISOString().split('T')[0];
    }
    data.schedules = data.schedules.map((schedule: any) => {
      return {
        ...schedule,
        department: schedule.department.value,
      };
    });

    console.log(data);

    // API call to create a new schedule entry
    Swal.fire({
      title: "Are you Sure?",
      text: "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Update Trainee Schedule",
    })
      .then(async (result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "Please Wait... ",
            didOpen: () => {
              Swal.showLoading();
            },
          });

          const response = await api.put(`/api/trainee/${trainee.id}/schedule`, data);
          console.log(response);
          Swal.fire({
            title: "updated!",
            text: "schedule has been updated at the database .",
            icon: "success",
          });
          //delete the interview record
          //const deleteInterViewResponse = await api.delete(`api/trainee/${trainee.id}/interview`);
          //console.log("Error",deleteInterViewResponse);
          //reset();
          navigate(`/OJT/trainees/${trainee.id}/profile`);
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
        <MainContainer title="Trainee Schedule" breadCrumbs={["Trainee", "Profile", "Schedule"]}>
          <SubContainer>
            <div className="container-fluid border border-dark rounded-2 my-2">
              <div className=" fs-5 fw-bolder">Trainee Details</div>
              <div className="">
                <div className=" fw-semibold">Reg NO - {trainee.REG_NO}</div>
                <div className="fw-semibold">ATT NO - {trainee.ATT_NO}</div>
                <div className="fw-semibold">NIC NO - {trainee.NIC_NO}</div>
              </div>
            </div>
            {trainee.interviews && trainee.interviews.length > 0 && (
              <div className="container-fluid border border-dark rounded-2 my-2">
                <div className=" fs-5 fw-bolder">Interview Details</div>
                <div className="w-50 border border-2 rounded-2 p-1 mt-2 mb-2">
                  <div>
                    <table className="table table-striped table-sm table-bordered ">
                      <thead className="table-dark">
                        <tr className="small" style={{ fontSize: "" }}>
                          <th className=" text-center">Division</th>
                          <th>Interviewed Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trainee.interviews.map((interview: any) => {
                          const createdAt = moment(interview.createdAt);
                          return (
                            <tr key={`${interview.id}`}>
                              <td>
                                {
                                  departmentsList.find(
                                    (department) => department.id == interview.departmentId
                                  ).name
                                }
                              </td>
                              <td>{createdAt.format("YYYY-MM-DD")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

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
                <div className="border border-dark p-2 rounded-2 mt-1">
                  <div className="mb-3">
                    <label className="form-label">Training Period</label>
                    <Controller
                      name="period"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={periods.map((period: any) => {
                            return {
                              value: period.id + "",
                              label: period.name,
                            };
                          })}
                            onChange={(value) => {
                              field.onChange(value);
                              setIsChanged(true);
                            }}
                          placeholder="Select a training period"
                        />
                      )}
                    />
                    {errors.period && <p className="text-danger">{errors.period.message}</p>}
                    <div className="">
                      <button
                        type="button"
                        onClick={() => {
                          setPeriodModalVisibility(true);
                        }}
                        className="mt-1 link d-inline badge btn text-dark btn-outline-primary border-3 btn-sm "
                      >
                        Add Period to the list
                      </button>
                    </div>
                  </div>
                  <AddPeriodModal
                    setperiods={setPeriods}
                    visibilityState={periodModalVisibilityState}
                  />

                  <div className="container row px-0">
                    <div className="w-50">
                      <label>Start Date</label>
                      <input
                        className="form-control"
                        type="date"
                        {...register("start_date")}
                        onChange={(e) => {
                          register("start_date").onChange(e);
                          setIsChanged(true);
                        }}
                      />
                      {errors.start_date && (
                        <p className="text-danger">{errors.start_date.message}</p>
                      )}
                    </div>
                    <div className="w-50">
                      <label>End Date</label>
                      <input
                        className="form-control"
                        type="date"
                        value={manualEndDate ? manualEndDate.toISOString().split('T')[0] : ''}
                        {...register("end_date")}
                        onChange={(e) => {
                          setIsManualEndDate(true);
                          setManualEndDate(new Date(e.target.value));
                          setEndDate(new Date(e.target.value));
                          register("end_date").onChange(e);
                        }}
                        min={watch('start_date') || ''}
                      />
                      {isManualEndDate && (
                        <small className="text-muted">
                          Manually set. (Will reset if period or start date changes)
                        </small>
                      )}
                    </div>
                  </div>
                </div>
                <div className="border border-dark p-2 rounded-2 mt-1 mb-2">
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
                          <p className="text-danger">
                            {errors.schedules[index].department?.message}
                          </p>
                        )}
                      </div>
                      <div className="d-flex mt-2">
                        <div className="w-50">
                          <label>Start Date</label>
                          <input
                            className="form-control"
                            type="date"
                            {...register(`schedules.${index}.start_date`)}
                            min={watch('start_date') || ''}
                            max={endDate ? endDate.toISOString().split("T")[0] : ''}
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
                            min={watch(`schedules.${index}.start_date`) || watch('start_date') || ''}
                            max={endDate ? endDate.toISOString().split("T")[0] : ''}
                          />
                          {errors.schedules?.[index]?.end_date && (
                            <p className="text-danger">
                              {errors.schedules[index].end_date?.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className="d-flex mt-2">
                  <div className="me-auto">
                    <button type="button" className="btn btn-primary"
                      onClick={() => navigate(-1)}>
                      <i className="bi bi-arrow-left"></i>
                    </button>
                  </div>
                  <button
                    className="btn btn-danger ms-auto me-3 "
                    type="button"
                    onClick={() => {
                      reset();
                    }}
                  >
                    Reset
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </SubContainer>
        </MainContainer>
      )}
      <AddDepartmentModal
        setDepartments={setDepartments}
        visibilityState={departmentsModalVisibility}
      />
    </>
  );
}
