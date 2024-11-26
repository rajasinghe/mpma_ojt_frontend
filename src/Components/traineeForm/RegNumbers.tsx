import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Select from "react-select";
import { z } from "zod";
import AddInstituteModal from "./AddInstituteModal";
import AddProgramModal from "./AddProgramModal";
import api from "../../api";
import Swal from "sweetalert2";
import { AxiosError } from "axios";

interface formProps {
  disabledState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  initialInstitutes: any[];
  initialPrograms: any[];
  regNoState: [string | null, React.Dispatch<React.SetStateAction<string | null>>];
  attNoState: [number | null, React.Dispatch<React.SetStateAction<number | null>>];
  setProgram: React.Dispatch<React.SetStateAction<number | null>>;
  setInstitute: React.Dispatch<React.SetStateAction<number | null>>;
}

const schema = z.object({
  institute: z.object({
    label: z.string(),
    value: z.coerce.number(),
  }),
  program: z.object({
    label: z.string(),
    value: z.coerce.number(),
  }),
  code_generation_pattern: z.enum([
    "include_institute_code",
    "include_program_code",
    "include_institute_code_and_program_code",
  ]),
});

type formValues = z.infer<typeof schema>;

export default function RegNumbers({
  disabledState,
  initialInstitutes,
  initialPrograms,
  regNoState,
  attNoState,
  setProgram,
  setInstitute,
}: formProps) {
  const [disable, setDisable] = disabledState;
  const instituteModalState = useState<boolean>(false);
  const programModalState = useState<boolean>(false);
  const setInstiteModalVisiblity = instituteModalState[1];
  const setprogramModalVisibility = programModalState[1];
  const [institutes, setInstitutes] = useState<any[]>(initialInstitutes);
  const [programs, setprograms] = useState<any[]>(initialPrograms);
  const [regNo, setRegNO] = regNoState;
  const [attNo, setAttNo] = attNoState;

  const {
    handleSubmit,
    control,
    register,
    formState: { errors },
  } = useForm<formValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: formValues) => {
    console.log(data);
    try {
      const response = await api.get("api/trainee/genearateIndexes", {
        params: {
          include_institute_code: data.code_generation_pattern,
          institute: data.institute.value,
          program: data.program.value,
          code_generation_pattern: data.code_generation_pattern,
        },
      });
      console.log(response);
      setAttNo(response.data.ATT_NO);
      setRegNO(response.data.REG_NO);
      setProgram(data.program.value);
      setInstitute(data.institute.value);
      setDisable(true);
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status == 400) {
          return Swal.fire({
            icon: "error",
            title: "Improper Request",
            text: error.response?.data.message || "error",
            footer: '<a href="#">Why do I have this issue?</a>',
          });
        }
      }

      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
        footer: '<a href="#">Why do I have this issue?</a>',
      });
      console.log(error);
    }
  };

  return (
    <>
      <div className="border border-dark p-2 rounded-2">
        <div className="mb-3">
          <label className="form-label">University/Institute</label>

          <Controller
            name="institute"
            control={control}
            render={({ field }) => {
              return (
                <Select
                  isDisabled={disable}
                  {...field}
                  options={institutes.map((institute: any) => {
                    return {
                      label: institute.name,
                      value: institute.id,
                    };
                  })}
                  placeholder="Select a University/Institute"
                />
              );
            }}
          />
          {errors.institute && <p className="text-danger m-0">{errors.institute.message}</p>}
          <div className="">
            <button
              onClick={() => {
                setInstiteModalVisiblity(true);
              }}
              disabled={disable}
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
                <Select
                  {...field}
                  isDisabled={disable}
                  placeholder="Select a program"
                  options={programs.map((program: any) => {
                    return {
                      label: program.name,
                      value: program.id,
                    };
                  })}
                />
              );
            }}
          />
          {errors.program && <p className="text-danger m-0">{errors.program.message}</p>}
          <div className="">
            <button
              disabled={disable}
              onClick={() => {
                setprogramModalVisibility(true);
              }}
              className="mt-1 link d-inline badge btn text-dark btn-outline-primary border-3 btn-sm "
            >
              Add Program to the list
            </button>
          </div>
        </div>
        <div className="">
          <div className="form-check me-3">
            <input
              disabled={disable}
              {...register("code_generation_pattern")}
              value={"include_institute_code"}
              className="form-check-input"
              type="radio"
            />
            <label className="form-check-label">Include Institute Code</label>
          </div>
          <div className="form-check">
            <input
              disabled={disable}
              value={"include_program_code"}
              {...register("code_generation_pattern")}
              className="form-check-input"
              type="radio"
            />
            <label className="form-check-label">Include Program Code</label>
          </div>
          <div className="form-check ">
            <input
              disabled={disable}
              value={"include_institute_code_and_program_code"}
              {...register("code_generation_pattern")}
              className="form-check-input"
              type="radio"
            />
            <label className="form-check-label">Include Program Code and Institute Code</label>
          </div>
          {errors.code_generation_pattern && (
            <p className="text-danger m-0">{errors.code_generation_pattern.message}</p>
          )}
        </div>
        <div className=" d-flex">
          <button
            disabled={disable}
            className="btn btn-sm btn-success ms-auto"
            type="button"
            onClick={handleSubmit(onSubmit)}
          >
            Generate Indexes
          </button>
        </div>
        <div className="">
          <div className="fs-5 fw-semibold mb-2">Indexes</div>

          <div className="mb-3 d-flex">
            <label className="form-label w-25 ">Attendence Number</label>
            <input type="text" className="form-control w-25 " value={attNo ? attNo : ""} readOnly />
          </div>

          <div className="mb-3 d-flex">
            <label className="form-label w-25">Registration Number</label>
            <input type="text" className="form-control w-25" value={regNo ? regNo : ""} readOnly />
          </div>
        </div>
      </div>
      <AddInstituteModal setInstitutes={setInstitutes} visibilityState={instituteModalState} />
      <AddProgramModal setPrograms={setprograms} visibilityState={programModalState} />
    </>
  );
}
