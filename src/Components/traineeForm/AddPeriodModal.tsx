import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { z } from "zod";
import api from "../../api";
import Swal from "sweetalert2";
interface props {
  visibilityState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  setperiods: React.Dispatch<React.SetStateAction<any[]>>;
}

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  years: z.coerce
    .number({ message: "Year must be a number " })
    .gt(0, { message: "Year must be grater than 0" })
    .int({ message: "Must be a whole number" })
    .optional(),
  months: z.coerce
    .number({ message: "Months must be a number " })
    .gt(0, { message: "Month must be Greater than 0" })
    .int({ message: "Must be a whole number" })
    .optional(),
  weeks: z.coerce
    .number({ message: "Weeks must be a number" })
    .gt(0, { message: "Weeks must be Greater than 0" })
    .int({ message: "Must be a whole number" })
    .optional(),
  days: z.coerce
    .number({ message: "Days must be a number" })
    .gt(0, { message: "Weeks must be Greater than 0" })
    .int({ message: "Must be a whole number" })
    .optional(),
});

type formType = z.infer<typeof schema>;

export default function AddPeriodModal({ visibilityState, setperiods }: props) {
  const [show, setShow] = visibilityState;
  const [yearEnable, setYearEnable] = useState(false);
  const [monthEnable, setMonthEnable] = useState(false);
  const [weeksEnable, setWeeksEnable] = useState(false);
  const [daysEnable, setDaysEnable] = useState(false);

  const {
    register,
    setError,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<formType>({ resolver: zodResolver(schema) });

  const handleClose = () => {
    setShow(false);
  };

  const onSubmit = async (formData: formType) => {
    if (formData.years || formData.months || formData.weeks || formData.days) {
      Swal.fire({
        title: "Are you Sure?",
        html: `
        <div>
            Double check if any matching name is available before adding a new period.
        </div>
        <div class="mt-2 fw-semibold">
            Make sure that the given name matches the duration provided 
        </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Add new Period",
      })
        .then(async (result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: "Please Wait... ",
              didOpen: () => {
                Swal.showLoading();
              },
            });

            //submitting the data to insert a instute
            const response = await api.post("api/periods", formData);

            console.log(response);

            //if the response is successfull then refetch the institues
            const { data } = await api.get("api/periods");
            setperiods(data);

            Swal.fire({
              title: "Inserted!",
              text: "New Period is available now.",
              icon: "success",
              didClose: () => {
                setShow(false);
              },
            });
            reset();
          }
        })
        .catch((errors) => {
          console.log(errors);
          if (errors.response.data.code == "ER_DUP_ENTRY") {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: errors.response.data.sqlMessage,
              footer: '<a href="#">Why do I have this issue?</a>',
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Something went wrong!",
              footer: '<a href="#">Why do I have this issue?</a>',
            });
          }

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
    } else {
      console.log("failed");
      setError("root", { message: "Enter a duration " });
    }
  };
  return (
    <Modal centered={true} show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>ADD NEW INSTITUTES</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit(onSubmit)}>
          {errors.root && <p className="text-danger m-0">{errors.root.message}</p>}
          <div className="mb-3">
            <label className="form-label">Period Name</label>
            <input {...register("name")} className="form-control" type="text" />
            {errors.name && <p className="text-danger m-0">{errors.name.message}</p>}
          </div>

          <div className="mb-3">
            <label className="form-label d-flex">
              <div>Years</div>
              <div className="ms-auto form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={yearEnable}
                  onChange={(e) => {
                    if (e.currentTarget.checked) {
                      setYearEnable(true);
                    } else {
                      setYearEnable(false);
                    }
                  }}
                  id="flexCheckDefault"
                />
                <label className="form-check-label">Enable</label>
              </div>
            </label>
            <input
              disabled={yearEnable ? false : true}
              {...register("years")}
              className="form-control"
              type="number"
            />
            {errors.years && <p className="text-danger m-0">{errors.years.message}</p>}
          </div>
          <div className="mb-3">
            <label className="form-label d-flex">
              Months
              <div className="ms-auto form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={monthEnable}
                  onChange={(e) => {
                    if (e.currentTarget.checked) {
                      setMonthEnable(true);
                    } else {
                      setMonthEnable(false);
                    }
                  }}
                  id="flexCheckDefault"
                />
                <label className="form-check-label">Enable</label>
              </div>
            </label>
            <input
              {...register("months")}
              disabled={monthEnable ? false : true}
              className="form-control "
              type="text"
            />
            {errors.months && <p className="text-danger m-0">{errors.months.message}</p>}
          </div>
          <div className="mb-3">
            <label className="form-label d-flex">
              Weeks
              <div className="ms-auto form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={weeksEnable}
                  onChange={(e) => {
                    if (e.currentTarget.checked) {
                      setWeeksEnable(true);
                    } else {
                      setWeeksEnable(false);
                    }
                  }}
                  id="flexCheckDefault"
                />
                <label className="form-check-label">Enable</label>
              </div>
            </label>
            <input
              {...register("weeks")}
              disabled={weeksEnable ? false : true}
              className="form-control"
              type="text"
            />
            {errors.weeks && <p className="text-danger m-0">{errors.weeks.message}</p>}
          </div>
          <div className="mb-3">
            <label className="form-label d-flex">
              Days
              <div className="ms-auto form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={daysEnable}
                  onChange={(e) => {
                    if (e.currentTarget.checked) {
                      setDaysEnable(true);
                    } else {
                      setDaysEnable(false);
                    }
                  }}
                  id="flexCheckDefault"
                />
                <label className="form-check-label">Enable</label>
              </div>
            </label>
            <input
              {...register("days")}
              disabled={daysEnable ? false : true}
              className="form-control"
              type="text"
            />
            {errors.days && <p className="text-danger m-0">{errors.days.message}</p>}
          </div>
          {/* <div className="form-check">
            <input className="form-check-input" type="checkbox" {...register("months")} />
            <label className="form-check-label">Government</label>
          </div> */}
          <div className="d-flex">
            <button
              disabled={isSubmitting}
              type="button"
              onClick={() => {
                reset();
              }}
              className="btn btn-danger ms-auto"
            >
              Reset
            </button>
            <button
              disabled={isSubmitting}
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="btn btn-primary ms-1"
            >
              {isSubmitting ? "Submiting..." : "Submit"}
            </button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}
