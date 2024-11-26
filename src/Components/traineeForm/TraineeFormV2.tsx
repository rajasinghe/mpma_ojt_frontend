import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../../api.ts";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import NIC from "./NIC.tsx";
import RegNumbers from "./RegNumbers.tsx";
import AddPeriodModal from "./AddPeriodModal.tsx";
import { useNavigate } from "react-router-dom";
// Define the validation schema
const schema = z.object({
  name: z.string().min(1, "Enter the user name"),
  TEL_NO: z.string().regex(/^\d{9,10}$/, "Invalid Format, e.g., 0771231231"),
  Jstart_date: z.string().date("Select a starting date for the journey"),
  period: z.object({
    label: z.string().min(1),
    value: z.string().min(1),
  }),
});

// Infer the types.
type TraineeFormValues = z.infer<typeof schema>;

interface TraineeFormProps {
  className?: string;
  periods: any[];
  programs: any[];
  institutes: any[];
}

export default function TraineeForm({
  periods,
  className,
  institutes,
  programs,
}: TraineeFormProps) {
  const [nic, setNic] = useState<string | null>(null);
  const regNoState = useState<string | null>(null);
  const ATT_NOstate = useState<number | null>(null);
  const periodModalVisibility = useState<boolean>(false);
  const setPeriodModalVisibility = periodModalVisibility[1];

  const [program, setProgram] = useState<number | null>(null);
  const [institute, setInstitute] = useState<number | null>(null);

  const [regNo] = regNoState;
  const [attNo] = ATT_NOstate;

  const nicDisable = useState<boolean>(false);
  const regDisable = useState<boolean>(true);

  const setRegDisable = regDisable[1];
  const navigate = useNavigate();
  const [periodsList, setPeriods] = useState<any[]>(periods);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [periodsDisable, setPeriodsDisable] = useState<boolean>(false);
  const {
    control,
    handleSubmit,
    register,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TraineeFormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (nic == null) {
      setRegDisable(true);
    } else {
      setRegDisable(false);
    }
  }, [nic]);

  useEffect(() => {
    console.log(periods);
    console.log(periodsList);
  }, [periodsList]);

  const onSubmit = async (data: any) => {
    console.log(data);

    if (nic && endDate && regNo && attNo && selectedPeriod && program && institute) {
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

            const body = {
              ...data,
              NIC_NO: nic,
              ATT_NO: attNo,
              REG_NO: regNo,
              period: selectedPeriod,
              program,
              institute,
              Jend_date: endDate.toISOString().split("T")[0],
            };

            console.log(JSON.stringify(body));
            const response = await api.post("/api/trainee", body);
            console.log(response);
            Swal.fire({
              title: "created!",
              text: "new Trainee has been Added to the database .",
              icon: "success",
            });
            reset({
              name: "",
              TEL_NO: "",
              Jstart_date: "",
            });
            navigate(0);
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
  };

  return (
    <form className={className} onSubmit={handleSubmit(onSubmit)}>
      <div className=" text-danger">{errors && errors.root?.message}</div>
      {/* <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          navigate(0);
        }}
      >
        tester
      </button> */}
      <NIC nicDisableState={nicDisable} className="mb-3 " setNIC_NO={setNic} />

      <RegNumbers
        setInstitute={setInstitute}
        setProgram={setProgram}
        regNoState={regNoState}
        attNoState={ATT_NOstate}
        disabledState={regDisable}
        initialInstitutes={institutes}
        initialPrograms={programs}
      />
      {/* disabled={regNo == null && attNo == null} */}
      <fieldset disabled={regNo == null && attNo == null}>
        <div className="border border-dark p-2 rounded-2 mt-3">
          <div className="fs-5 fw-semibold mb-2">Trainee Personal Information</div>
          <div className="mb-3">
            <label className="form-label">Trainee Name</label>
            <input type="text" className="form-control" {...register("name")} />
            {errors.name && <p className="text-danger">{errors.name.message}</p>}
          </div>

          <div className="mb-3">
            <label className="form-label">Tel No</label>
            <input type="text" className="form-control" {...register("TEL_NO")} />
            {errors.TEL_NO && <p className="text-danger">{errors.TEL_NO.message}</p>}
          </div>
        </div>

        <div className="border border-dark p-2 rounded-2 mt-3">
          <div className="mb-3">
            <label className="form-label">Training Period</label>
            <Controller
              name="period"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  isDisabled={periodsDisable}
                  onChange={(value) => {
                    value && setSelectedPeriod(parseInt(value.value));
                    field.onChange(value);
                  }}
                  options={periodsList.map((period: any) => {
                    return {
                      value: period.id + "",
                      label: period.name,
                    };
                  })}
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
          <AddPeriodModal setperiods={setPeriods} visibilityState={periodModalVisibility} />

          <div className="container row px-0">
            <div className="w-50">
              <label>Start Date</label>
              <input
                className="form-control"
                type="date"
                {...register("Jstart_date")}
                onChange={(value) => {
                  //set the end date acocrdingly
                  console.log(value.target.value);
                  const startDate = new Date(value.target.value);
                  if (selectedPeriod) {
                    try {
                      const endDate = endDateCalculator(periodsList, selectedPeriod, startDate);
                      console.log(endDate);
                      setEndDate(endDate);
                      setPeriodsDisable(true);
                    } catch (error) {
                      if (error) setError("root", { message: "check the period" });
                      console.log(error);
                    }
                  } else {
                    console.log("period not selected");
                  }
                  register("Jstart_date").onChange(value);
                }}
              />
              {errors.Jstart_date && <p className="text-danger">{errors.Jstart_date.message}</p>}
            </div>
            <div className="w-50  ">
              <label>End Date</label>
              <input
                className="form-control"
                type="date"
                value={endDate ? endDate.toISOString().split("T")[0] : ""}
                readOnly
              />
            </div>
          </div>
          <div>
            <button
              className="btn btn-sm btn-dark mt-2"
              onClick={() => {
                setPeriodsDisable(false);
                reset({ Jstart_date: "" });
                setEndDate(null);
                setSelectedPeriod(null);
              }}
              type="button"
            >
              Change Period
            </button>
          </div>
        </div>

        <div className=" d-flex">
          <div className="ms-auto d-flex ">
            <button
              className="btn btn-danger mt-3"
              type="button"
              onClick={() => {
                //reset();
                console.log(selectedPeriod);
                console.log(errors);
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
      </fieldset>
    </form>
  );
}

const endDateCalculator = (periods: any[], selectedPeriod: number, startDate: Date): Date => {
  try {
    console.log("calc");
    const endDate = new Date(startDate);
    const period = periods.find((period) => {
      return period.id === selectedPeriod;
    });

    if (!period) {
      throw new Error("NO_PERIOD");
    }
    if (period.year) {
      endDate.setFullYear(endDate.getFullYear() + period.year);
    }
    if (period.Months) {
      endDate.setMonth(endDate.getMonth() + period.Months);
    }

    if (period.weeks) {
      endDate.setDate(endDate.getDate() + period.weeks * 7);
    }
    if (period.days) {
      endDate.setDate(endDate.getDate() + period.days);
    }
    endDate.setDate(endDate.getDate() - 1);
    console.log(endDate);
    return endDate;
  } catch (error) {
    console.log("error");
    console.log(error);
    throw error;
  }
};
