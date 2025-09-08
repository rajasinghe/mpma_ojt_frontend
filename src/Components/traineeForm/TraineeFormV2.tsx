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

// Interface for trainee details from API
interface TraineeDetails {
  id: number;
  nickname?: string;
  NIC: string;
  email?: string;
  username: string;
  status: string;
  personal_info?: {
    id: number;
    Name?: string;
    fullName?: string;
    NIC?: string;
    Training_institute?: string;
    training_period?: string;
    start_date?: string;
    course?: string;
    address?: string;
    Mobile_No?: string;
    Resident_No?: string;
    email?: string;
  };
  Emegency_contact?: {
    id: number;
    name?: string;
    relationship?: string;
    telephone?: string;
  };
}

// Define the validation schema
const schema = z.object({
  name: z.string().min(1, "Enter the user name"),
  TEL_NO: z.string().regex(/^\d{9,10}$/, "Invalid Format, e.g., 0771231231"),
  email: z.string().nullable().optional(),
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

  // State for trainee details and auto-population
  const [traineeDetails, setTraineeDetails] = useState<TraineeDetails | null>(null);
  const [isAutoPopulating, setIsAutoPopulating] = useState<boolean>(false);
  const {
    control,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TraineeFormValues>({
    resolver: zodResolver(schema),
  });

  // Function to fetch trainee details by NIC and auto-populate form
  const fetchAndPopulateTraineeDetails = async (nicNumber: string): Promise<boolean> => {
    try {
      setIsAutoPopulating(true);
      console.log(`🔍 Fetching trainee details for NIC: ${nicNumber}`);

      const response = await api.get(`/api/portal/trainee_details/${nicNumber}`);

      if (response.status === 200 && response.data) {
        const details: TraineeDetails = response.data;
        setTraineeDetails(details);

        console.log(`✅ Trainee details found:`, details);

        // Auto-populate form fields progressively with visual feedback
        await populateFormFields(details);

        return true;
      }
    } catch (error: any) {
      console.log(`❌ No trainee details found for NIC: ${nicNumber}`, error);

      // Handle 404 gracefully - user can continue with manual entry
      if (error.response?.status === 404) {
        console.log("No existing trainee data found - continuing with manual entry");
        return false;
      }

      // For other errors, show a warning but allow manual entry
      console.warn("Error fetching trainee details:", error);
      Swal.fire({
        icon: "warning",
        title: "Unable to fetch existing data",
        text: "You can continue with manual form entry.",
        timer: 3000,
        showConfirmButton: false,
      });
      return false;
    } finally {
      setIsAutoPopulating(false);
    }

    return false; // Default return if no other path is taken
  };

  // Function to populate form fields progressively
  const populateFormFields = async (details: TraineeDetails) => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Show loading indicator
    Swal.fire({
      title: "Auto-populating form...",
      text: "Filling available details from existing records",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // Populate name field
      if (details.personal_info?.Name) {
        await delay(300);
        setValue("name", details.personal_info.Name);
        console.log(`📝 Populated name: ${details.personal_info.Name}`);
      }

      // Populate phone number (clean the format to match validation)
      if (details.personal_info?.Mobile_No) {
        await delay(300);
        // Clean phone number to remove any formatting and ensure it matches validation
        const cleanPhone = details.personal_info.Mobile_No.replace(/[^\d]/g, '');
        if (cleanPhone.length >= 9 && cleanPhone.length <= 10) {
          setValue("TEL_NO", cleanPhone);
          console.log(`📞 Populated phone: ${cleanPhone}`);
        }
      }

      // Populate email
      if (details.personal_info?.email || details.email) {
        await delay(300);
        const email = details.personal_info?.email || details.email;
        setValue("email", email);
        console.log(`📧 Populated email: ${email}`);
      }

      Swal.close();

      // Show success message
      Swal.fire({
        icon: "success",
        title: "Form Auto-populated!",
        text: "Available details have been filled. You can modify them if needed.",
        timer: 2000,
        showConfirmButton: false,
      });

    } catch (error) {
      console.error("Error during form population:", error);
      Swal.close();
    }
  };

  // Function to populate remaining fields after registration numbers are generated
  const populateRemainingFields = async () => {
    if (!traineeDetails) return;

    console.log("🔄 Populating remaining fields after registration generation");

    try {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Check if there are any additional fields that weren't populated initially
      // and populate them now that registration is complete

      // Re-populate any fields that might have been missed or need updating
      if (traineeDetails.personal_info?.start_date && !document.querySelector('input[type="date"]')?.getAttribute('value')) {
        await delay(200);
        const startDate = new Date(traineeDetails.personal_info.start_date).toISOString().split('T')[0];
        setValue("Jstart_date", startDate);
        console.log(`📅 Populated start date: ${startDate}`);
      }

      console.log("✅ Remaining fields populated successfully");

    } catch (error) {
      console.error("Error populating remaining fields:", error);
    }
  };

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

  // Effect to populate remaining fields after registration numbers are generated
  useEffect(() => {
    if (regNo && attNo && traineeDetails) {
      console.log("🎯 Registration numbers generated, populating remaining fields");
      populateRemainingFields();
    }
  }, [regNo, attNo, traineeDetails]);

  const onSubmit = async (data: any) => {
    console.log(data);

    if (
      nic &&
      endDate &&
      regNo &&
      attNo &&
      selectedPeriod &&
      program &&
      institute
    ) {
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
              email: data.email || null,
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
              email: "",
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

          if (
            errors.response &&
            errors.response.data &&
            errors.response.data.errors
          ) {
            const errorObject = errors.response.data.errors;
            for (const key in errorObject) {
              const error = errorObject[key][0];
              setError(
                key as keyof TraineeFormValues,
                { message: error },
                { shouldFocus: true }
              );
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
      <NIC
        nicDisableState={nicDisable}
        className="mb-3 "
        setNIC_NO={setNic}
        onNicValidated={fetchAndPopulateTraineeDetails}
      />

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
      <fieldset disabled={regNo == null && attNo == null || isAutoPopulating}>
        <div className="border border-dark p-2 rounded-2 mt-3">
          <div className="fs-5 fw-semibold mb-2">
            Trainee Personal Information
          </div>
          <div className="mb-3">
            <label className="form-label">Trainee Name</label>
            <input type="text" className="form-control" {...register("name")} />
            {errors.name && (
              <p className="text-danger">{errors.name.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Tel No</label>
            <input
              type="text"
              className="form-control"
              {...register("TEL_NO")}
            />
            {errors.TEL_NO && (
              <p className="text-danger">{errors.TEL_NO.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Email (optional)</label>
            <input
              type="text"
              className="form-control"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-danger">{errors.email.message}</p>
            )}
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
                  value={field.value || null}
                  isDisabled={periodsDisable}
                  onChange={(value) => {
                    value && setSelectedPeriod(parseInt(value.value));
                    field.onChange(value || { value: "", label: "" });
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
            {errors.period && (
              <p className="text-danger">{errors.period.message}</p>
            )}
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
            visibilityState={periodModalVisibility}
          />

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
                      const endDate = endDateCalculator(
                        periodsList,
                        selectedPeriod,
                        startDate
                      );
                      console.log(endDate);
                      setEndDate(endDate);
                      setPeriodsDisable(true);
                    } catch (error) {
                      if (error)
                        setError("root", { message: "check the period" });
                      console.log(error);
                    }
                  } else {
                    console.log("period not selected");
                  }
                  register("Jstart_date").onChange(value);
                }}
              />
              {errors.Jstart_date && (
                <p className="text-danger">{errors.Jstart_date.message}</p>
              )}
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
      </fieldset>

      <div className=" d-flex">
        <div className="ms-auto d-flex ">
          <button
            className="btn btn-danger mt-3"
            type="button"
            onClick={() => {
              reset();
              setNic(null);
              setProgram(null);
              setInstitute(null);
              setSelectedPeriod(null);
              setEndDate(null);
              setPeriodsDisable(false);
              setPeriods(periods);

              // Reset the reg number states
              regNoState[1](null);
              ATT_NOstate[1](null);
              nicDisable[1](false);

              console.log(selectedPeriod);
              console.log(errors);
            }}
            disabled={!nic || isSubmitting}
          >
            {" "}
            Reset
          </button>

          <button
            disabled={!nic || isSubmitting || (regNo == null && attNo == null)}
            type="submit"
            className="btn btn-primary mt-3 ms-2"
          >
            {isSubmitting ? "Submiting...." : "Submit"}
          </button>
        </div>
      </div>
    </form>
  );
}

const endDateCalculator = (
  periods: any[],
  selectedPeriod: number,
  startDate: Date
): Date => {
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
