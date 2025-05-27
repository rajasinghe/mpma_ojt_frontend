import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import api from "../../../api";
import NIC from "../../../Components/traineeForm/NIC";
import RegNumbers from "../../../Components/traineeForm/RegNumbers";
// Define the validation schema
const schema = z.object({
  name: z.string().min(1, "Enter the user name"),
  TEL_NO: z.string().regex(/^\d{9,10}$/, "Invalid Format, e.g., 0771231231"),
});

// Infer the types.
type TraineeFormValues = z.infer<typeof schema>;

interface loaderData {
  programs: any[];
  institutes: any[];
  trainee: any;
}

export default function UpdateTrainees() {
  useEffect(() => {
    console.log(loaderData);
  }, []);

  const loaderData = useLoaderData() as loaderData;
  const [nic, setNic] = useState<string | null>(loaderData.trainee.NIC_NO);
  const regNoState = useState<string | null>(loaderData.trainee.REG_NO);
  const ATT_NOstate = useState<number | null>(loaderData.trainee.ATT_NO);

  const [program, setProgram] = useState<number | null>(loaderData.trainee.training_program_id);
  const [institute, setInstitute] = useState<number | null>(loaderData.trainee.institute_id);

  const [regNo] = regNoState;
  const [attNo] = ATT_NOstate;

  const nicDisable = useState<boolean>(false);
  const regDisable = useState<boolean>(true);
  useEffect(() => {
    if (nic == null) {
      setRegDisable(true);
    } else {
      setRegDisable(false);
    }
  }, [nic]);
  useEffect(() => {
    console.log("changed", regDisable[0]);
  }, regDisable);
  const setRegDisable = regDisable[1];
  const navigate = useNavigate();
  const {
    handleSubmit,
    register,

    setError,
    formState: { errors },
  } = useForm<TraineeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: loaderData.trainee.name,
      TEL_NO: loaderData.trainee.contact_no + "",
    },
  });

  const onSubmit = async (data: any) => {
    console.log(data);
    console.log(nic);
    console.log(regNo);
    console.log(attNo);
    console.log(program);
    if (nic && regNo && attNo && program && institute) {
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
              program,
              institute,
            };

            console.log(body);
            const response = await api.put(`/api/trainee/${loaderData.trainee.id}`, body);
            console.log(response);
            Swal.fire({
              title: "updated!",
              text: "new Trainee has been Added to the database .",
              icon: "success",
            });
            navigate("../");
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
    <section className="mx-2 px-1 mt-1 border border-dark-subtle border-2 rounded bg-body-tertiary ">
      <form className="p-2" onSubmit={handleSubmit(onSubmit)}>
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
          nic={loaderData.trainee.NIC_NO}
          nicDisableState={nicDisable}
          className="mb-3 "
          setNIC_NO={setNic}
        />

        <RegNumbers
          setInstitute={setInstitute}
          setProgram={setProgram}
          regNoState={regNoState}
          attNoState={ATT_NOstate}
          disabledState={regDisable}
          initialInstitutes={loaderData.institutes}
          initialPrograms={loaderData.programs}
          trainee={loaderData.trainee}
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
        <div className="d-flex mt-2">
          <div className="me-auto">
            <button type="button" className="btn btn-primary"
              onClick={() => navigate(-1)}>
              <i className="bi bi-arrow-left"></i>
            </button>
          </div>
          <div className="ms-auto">
            <button className="btn btn-primary">Update</button>
          </div>
        </div>
        </fieldset>
      </form>
    </section>
  );
}
