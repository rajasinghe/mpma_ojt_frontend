import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { z } from "zod";
import api from "../api";
import { useEffect } from "react";

interface props {
  className?: string;
  trainee: any;
}
const schema = z.object({
  accNo: z.string().regex(/^[0-9]+$/),
  branchCode: z.string().regex(/^[0-9]+$/),
});

type formType = z.infer<typeof schema>;

export default function BankDetailsForm({ trainee }: props) {
  const navigate = useNavigate();
  useEffect(() => {
    if (trainee.bankDetails) {
      setValue("accNo", trainee.bankDetails.acc_no + "");
      setValue("branchCode", trainee.bankDetails.branch_code + "");
    }
  }, [trainee]);

  const {
    register,
    reset,
    setError,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<formType>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (formData: formType) => {
    if (trainee.bankDetails) {
      //update
      await update(formData);
    } else {
      //insert
      await insert(formData);
    }
    // API call to create a new schedule entry
  };

  const update = async (formData: formType) => {
    Swal.fire({
      title: "Are you Sure?",
      text: "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Update Bank Details",
    })
      .then(async (result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "Please Wait... ",
            didOpen: () => {
              Swal.showLoading();
            },
          });

          const response = await api.put(`/api/trainee/${trainee.id}/payment`, formData);
          console.log(response);
          Swal.fire({
            title: "created!",
            text: "Bank Details has been Added to the database .",
            icon: "success",
          });
          reset();
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

  const insert = async (formData: formType) => {
    Swal.fire({
      title: "Are you Sure?",
      text: "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Insert Trainee Bank Details",
    })
      .then(async (result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "Please Wait... ",
            didOpen: () => {
              Swal.showLoading();
            },
          });
          let data = {
            ...formData,
            traineeId: trainee.id,
          };
          console.log(data);
          const response = await api.post("/api/trainee/payment", data);
          console.log(response);
          Swal.fire({
            title: "created!",
            text: "Bank Details has been Added to the database .",
            icon: "success",
          });
          reset();
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
    <section className=" m-1 border border-dark-subtle border-2 rounded bg-body-tertiary px-2">
      <div className="container-fluid border border-dark rounded-2 my-2">
        <div className=" fs-5 fw-bolder">Trainee Details</div>
        <div className="">
          <div className=" fw-semibold">Reg NO - {trainee.REG_NO}</div>
          <div className="fw-semibold">ATT NO - {trainee.ATT_NO}</div>
          <div className="fw-semibold">NIC NO - {trainee.NIC_NO}</div>
        </div>
      </div>

      <div className="container-fluid border border-dark rounded-2 my-2">
        <div className=" fs-5 fw-bolder">Bank Details</div>
        <form className="bg-body-tertiary p-2" onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label">Account Number</label>
            <input type="text" className="form-control" {...register("accNo")} />
            {errors.accNo && <p className="text-danger">{errors.accNo.message}</p>}
          </div>
          <div className="mb-3">
            <label className="form-label">Branch Code</label>
            <input type="text" className="form-control" {...register("branchCode")} />
            {errors.branchCode && <p className="text-danger">{errors.branchCode.message}</p>}
          </div>
          <div>
            <button className="btn btn-primary">{trainee.bankDetails ? "Update" : "Submit"}</button>
          </div>
        </form>
      </div>
    </section>
  );
}
