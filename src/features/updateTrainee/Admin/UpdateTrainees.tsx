import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";
import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import api from "../../../api";
import NIC from "../../../Components/traineeForm/NIC";
import AddInstituteModal from "../../../Components/traineeForm/AddInstituteModal";
import AddProgramModal from "../../../Components/traineeForm/AddProgramModal";
import ReactSelect from "react-select";
// Define the validation schema

const schema = z.object({
  program: z.object({
    value: z.string(),
    label: z.string(),
  }),
  institute: z.object({
    value: z.string(),
    label: z.string(),
  }),
  regNo: z.string(),
  attNo: z.coerce.number(),
  name: z.string().min(1, "Enter the user name"),
  TEL_NO: z.string().regex(/^\d{9,10}$/, "Invalid Format, e.g., 0771231231"),
  email: z.string().email("Invalid email format").optional(),
});

// Infer the types.
type TraineeFormValues = z.infer<typeof schema>;

interface loaderData {
  programs: any[];
  institutes: any[];
  trainee: any;
}

export default function UpdateTrainees() {
  const loaderData = useLoaderData() as loaderData;

  const [nic, setNic] = useState<string | null>(loaderData.trainee.NIC_NO);

  const [programs, setPrograms] = useState<any[]>(loaderData.programs);
  const [institutes, setInstitutes] = useState<any[]>(loaderData.institutes);
  const navigate = useNavigate();
  const nicDisable = useState<boolean>(false);

  const [newInstituteModalVisibility, setInstituteModalVisibility] =
    useState<boolean>(false);
  const [newProgramModalVisibility, setprogramModalVisibility] =
    useState<boolean>(false);
  const {
    handleSubmit,
    register,
    control,
    setError,
    formState: { errors },
  } = useForm<TraineeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: loaderData.trainee.name,
      program: {
        value: loaderData.trainee.training_program_id + "",
        label: programs.find(
          (program) => program.id == loaderData.trainee.training_program_id
        ).name,
      },
      institute: {
        value: loaderData.trainee.institute_id + "",
        label: institutes.find(
          (institute) => institute.id == loaderData.trainee.institute_id
        ).name,
      },
      TEL_NO: loaderData.trainee.contact_no + "",
      email: loaderData.trainee.email || "",
      regNo: loaderData.trainee.REG_NO,
      attNo: loaderData.trainee.ATT_NO,
    },
  });

  const onSubmit = async (data: TraineeFormValues) => {
    Swal.fire({
      title: "Are you Sure?",
      text: "update using superAdmin privilages.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Update Trainee Data",
    })
      .then(async (result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "Please Wait... ",
            didOpen: () => {
              Swal.showLoading();
            },
          });
          console.log({
            ...data,
            institute: data.institute.value,
            program: data.program.value,
            NIC_NO: nic,
            REG_NO: data.regNo,
            ATT_NO: data.attNo,
          });
          const response = await api.put(
            `/api/trainee/${loaderData.trainee.id}`,
            {
              ...data,
              institute: data.institute.value,
              program: data.program.value,
              NIC_NO: nic,
              REG_NO: data.regNo,
              ATT_NO: data.attNo,
            }
          );
          console.log(response);
          Swal.hideLoading();
          navigate(`/OJT/Trainees/${loaderData.trainee.id}/profile`);
          Swal.fire({
            title: "updated!",
            text: "new Trainee has been Added to the database .",
            icon: "success",
          });
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
  };
  return (
    <section className="mx-2 px-1 mt-1 border border-dark-subtle border-2 rounded bg-body-tertiary ">
      <form className="p-2" onSubmit={handleSubmit(onSubmit)}>
        <div className=" text-danger">{errors && errors.root?.message}</div>

        <NIC
          nic={loaderData.trainee.NIC_NO}
          nicDisableState={nicDisable}
          className="mb-3 "
          setNIC_NO={setNic}
        />
        <div className="mb-4">
          <label className="form-label">University/Institute</label>

          <Controller
            name="institute"
            control={control}
            render={({ field }) => {
              return (
                <ReactSelect
                  {...field}
                  options={institutes.map((institute: any) => {
                    return {
                      label: institute.name,
                      value: institute.id + "",
                    };
                  })}
                  placeholder="Select a University/Institute"
                />
              );
            }}
          />
          {errors.institute && (
            <p className="text-danger m-0">{errors.institute.message}</p>
          )}
          <div className="">
            <button
              onClick={() => {
                setInstituteModalVisibility(true);
              }}
              type="button"
              className="mt-1 link d-inline badge btn text-dark btn-outline-primary border-3 btn-sm "
            >
              Add Institute to the list
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Training Programme</label>
          <Controller
            name="program"
            control={control}
            render={({ field }) => {
              return (
                <ReactSelect
                  {...field}
                  placeholder="Select a program"
                  options={programs.map((program: any) => {
                    return {
                      label: program.name,
                      value: program.id + "",
                    };
                  })}
                />
              );
            }}
          />
          {errors.program && (
            <p className="text-danger m-0">{errors.program.message}</p>
          )}

          <div className="">
            <button
              type="button"
              onClick={() => {
                setprogramModalVisibility(true);
              }}
              className="mt-1 link d-inline badge btn text-dark btn-outline-primary border-3 btn-sm "
            >
              Add Program to the list
            </button>
          </div>
        </div>
        <div className="border border-dark p-2 rounded-2 mt-3">
          <div className="fs-5 fw-semibold mb-2">Registration Details</div>
          <div className="mb-3">
            <label className="form-label">REG NO</label>
            <input
              type="text"
              className="form-control"
              {...register("regNo")}
            />
            {errors.regNo && (
              <p className="text-danger">{errors.regNo.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Tel No</label>
            <input
              type="text"
              className="form-control"
              {...register("attNo")}
            />
            {errors.attNo && (
              <p className="text-danger">{errors.attNo.message}</p>
            )}
          </div>
        </div>
        <div className="border border-dark p-2 rounded-2 mt-3">
          <div className="fs-5 fw-semibold mb-2"> Personal Information</div>
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
        <div className="d-flex mt-2">
          <div className="me-auto">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left"></i>
            </button>
          </div>
          <div className="ms-auto">
            <button className="btn btn-primary">Update</button>
          </div>
        </div>
      </form>
      <AddInstituteModal
        setInstitutes={setInstitutes}
        visibilityState={[
          newInstituteModalVisibility,
          setInstituteModalVisibility,
        ]}
      />
      <AddProgramModal
        setPrograms={setPrograms}
        visibilityState={[newProgramModalVisibility, setprogramModalVisibility]}
      />
      {/* <button
        onClick={() => {
          console.log(errors);
        }}
      >
        console.error();
      </button> */}
    </section>
  );
}
