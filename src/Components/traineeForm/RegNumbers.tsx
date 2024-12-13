import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
  trainee?: any;
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
  code_generation_pattern: z.enum(["normal", "naita", "cinec"]),
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
  trainee,
}: formProps) {
  const [disable, setDisable] = disabledState;
  const [disableCodeGenrationPattern, setdisableCodeGenrationPattern] = useState(false);
  const [instituteDisable, setInstituteDisable] = useState<boolean>(false);
  const instituteModalState = useState<boolean>(false);
  const programModalState = useState<boolean>(false);
  const setInstiteModalVisiblity = instituteModalState[1];
  const setprogramModalVisibility = programModalState[1];
  const [institutes, setInstitutes] = useState<any[]>(initialInstitutes);
  const [programs, setprograms] = useState<any[]>(initialPrograms);
  const [matchingPrograms, setMatchingprograms] = useState<any[]>(initialPrograms);
  const [regNo, setRegNO] = regNoState;
  const [attNo, setAttNo] = attNoState;

  useEffect(() => {
    if (trainee) {
      console.log(trainee.regNoViolation);

      const defaultInstitute = institutes.find((institute) => institute.id == trainee.institute_id);
      const defaultProgram = programs.find((program) => program.id == trainee.training_program_id);
      setValue("program", {
        label: defaultProgram.name,
        value: defaultProgram.id,
      });

      if (trainee.regNoViolation) {
        setdisableCodeGenrationPattern(true);
      }

      setValue("institute", {
        label: defaultInstitute.name,
        value: defaultInstitute.id,
      });
      checkAndSetCodeGenerationPattern();
    } else {
      setValue("code_generation_pattern", "normal");
    }
  }, []);

  const checkAndSetCodeGenerationPattern = () => {
    const regPattern = trainee.REG_NO.split("/");
    console.log("reg pattern", regPattern[0], regPattern[1]);
    if (regPattern[0] == "CINEC") {
      setValue("code_generation_pattern", "cinec");
    } else if (regPattern[1] == "NAITA") {
      setValue("code_generation_pattern", "naita");
    } else {
      setValue("code_generation_pattern", "normal");
    }
  };

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    register,
    formState: { errors },
  } = useForm<formValues>({ resolver: zodResolver(schema) });

  const code_generation_pattern = watch("code_generation_pattern");

  const reInvokePrograms = (programs: any[]) => {
    setprograms(programs);
    setRerun(!reRun);
  };
  const [reRun, setRerun] = useState<boolean>(false);

  useEffect(() => {
    let matchingProgrammes = programs;
    console.log(code_generation_pattern);
    if (code_generation_pattern == "naita") {
      const institute = institutes.find((institute) => institute.name == "NAITA");
      console.log(institute);
      setInstitute(institute.id);
      setValue("institute", {
        value: institute.id,
        label: institute.name,
      });
      matchingProgrammes = programs.filter((program) => program.special_code != null);
      setInstituteDisable(true);
    } else if (code_generation_pattern == "cinec") {
      const institute = institutes.find((institute) => institute.name == "CINEC Campus");
      console.log(institute);
      setValue("institute", {
        value: institute.id,
        label: institute.name,
      });
      setInstitute(institute.id);
      setInstituteDisable(true);
      matchingProgrammes = programs.filter((program) => program.special_code == null);
    } else {
      //if()
      if (trainee && trainee.regNoViolation) {
        setDisableSubmitting(true);
        const regPattern = trainee.REG_NO.split("/");
        matchingProgrammes = programs.filter(
          (program) => program.special_code == null && program.code == regPattern[0]
        );
      } else {
        matchingProgrammes = programs.filter((program) => program.special_code == null);
      }
      setInstituteDisable(false);
    }
    console.log(matchingProgrammes);
    setMatchingprograms(matchingProgrammes);
  }, [code_generation_pattern, reRun]);

  const [disableSubmiting, setDisableSubmitting] = useState<boolean>(false);

  const onSubmit = async (data: formValues) => {
    console.log(data);
    console.log(disableSubmiting);
    if (trainee && trainee.regNoViolation) {
    } else {
    }
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
          <label className="form-label">Type</label>
          <div className="form-check">
            <input
              disabled={disable || disableCodeGenrationPattern}
              value={"normal"}
              {...register("code_generation_pattern")}
              className="form-check-input"
              type="radio"
            />
            <label className="form-check-label">Normal</label>
          </div>
          <div className="form-check me-3">
            <input
              disabled={disable || disableCodeGenrationPattern}
              value={"cinec"}
              {...register("code_generation_pattern")}
              className="form-check-input"
              type="radio"
            />
            <label className="form-check-label">CINEC Special</label>
          </div>

          <div className="form-check ">
            <input
              disabled={disable || disableCodeGenrationPattern}
              {...register("code_generation_pattern")}
              value={"naita"}
              className="form-check-input"
              type="radio"
            />
            <label className="form-check-label">NAITA Craftsman</label>
          </div>
          {errors.code_generation_pattern && (
            <p className="text-danger m-0">{errors.code_generation_pattern.message}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="form-label">University/Institute</label>

          <Controller
            name="institute"
            control={control}
            render={({ field }) => {
              return (
                <Select
                  isDisabled={instituteDisable || disable}
                  {...field}
                  onChange={(e) => {
                    if (e) {
                      setInstitute(e.value);
                      setValue("institute", {
                        value: e.value,
                        label: e.label,
                      });
                    }
                  }}
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
              type="button"
              disabled={instituteDisable || disable}
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
                  onChange={(e) => {
                    if (e) {
                      setProgram(e.value);
                      setValue("program", {
                        value: e.value,
                        label: e.label,
                      });
                    }
                  }}
                  isDisabled={disable}
                  placeholder="Select a program"
                  options={matchingPrograms.map((program: any) => {
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

        <div className=" d-flex">
          <button
            disabled={disable || disableCodeGenrationPattern}
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
      <AddProgramModal
        type={code_generation_pattern}
        setPrograms={reInvokePrograms}
        visibilityState={programModalState}
      />
    </>
  );
}
