import { Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { z } from "zod";
import NIC from "../traineeForm/NIC";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";
import api from "../../api";
import Select from "react-select";

interface Props {
  showState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  interview?: any;
  department: any;
  interviewSummary: any[];
  refetchInterviews: () => Promise<void>;
}

const schema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  date: z.string().date(),
});

export default function InterviewModal({
  showState,
  interview,
  interviewSummary,
  department,
  refetchInterviews,
}: Props) {
  const [show, setShow] = showState;
  const [nic, setNic] = useState<string | null>(null);
  const nicDisableState = useState<boolean>(false);
  const [summary, setSummary] = useState<any | null>(null);

  type formType = z.infer<typeof schema>;

  useEffect(() => {
    console.log(summary);
    setSummary(null);
    resetAll();
  }, [show]);

  useEffect(() => {
    console.log("interview changed", interview);
    resetAll();
    if (interview) {
      setNic(interview.NIC);
      console.log("here");
      setValue("name", interview.name);
      console.log(interview);
    } else {
      setNic(null);
      setValue("name", "");
    }
  }, [interview]);

  const {
    register,
    setError,
    reset,
    setValue,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<formType>({
    resolver: zodResolver(schema),
    defaultValues: interview ? { name: interview.name } : {},
  });

  const handleClose = () => {
    setShow(false);
  };

  const insert = async (formData: formType) => {
    try {
      const response = await Swal.fire({
        title: "New Interview",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Add to the list",
      });
      if (response.isConfirmed) {
        Swal.fire({
          title: "Please Wait... ",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        const response = await api.post("api/interview", {
          NIC: nic,
          depId: department.id,
          ...formData,
        });
        console.log(response);
        refetchInterviews();
        Swal.close();
        Swal.fire({
          title: "Inserted!",
          text: "Added to the List",
          icon: "success",
          showCloseButton: true,
          didClose: () => {
            //Swal.showLoading(false);
            setShow(false);
          },
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error,
        footer: '<a href="#">Why do I have this issue?</a>',
      });
      throw error;
    }
  };

  const update = async (formData: formType) => {
    try {
      const response = await Swal.fire({
        title: "Update Interview",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Update",
      });
      if (response.isConfirmed) {
        Swal.fire({
          title: "Please Wait... ",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        const response = await api.put(`api/interview/${interview.id}`, {
          NIC: nic,
          ...formData,
        });
        console.log(response);
        refetchInterviews(); //fetch the interviews list again
        Swal.close();
        Swal.fire({
          title: "Updated!",
          text: "Updated the Interview",
          icon: "success",
          showCloseButton: true,
          didClose: () => {
            //Swal.showLoading(false);
            setShow(false);
          },
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error,
        footer: '<a href="#">Why do I have this issue?</a>',
      });
      throw error;
    }
  };

  const resetAll = () => {
    reset();
    setSummary(null);
    nicDisableState[1](false);
    setNic(null);
  };

  const onSubmit = async (formData: formType) => {
    try {
      if (nic == null) {
        return setError("root", { message: "Validate a Nic before Submission" });
      }
      if (interview) {
        await update(formData);
      } else {
        await insert(formData);
      }

      resetAll();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Modal centered={true} show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{interview ? "Update Interview" : "Interview New Trainee"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <NIC
          nic={interview ? interview.NIC : undefined}
          className=""
          nicDisableState={nicDisableState}
          setNIC_NO={setNic}
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="form-label">Date</label>
            <Select
              isDisabled={nic == null}
              className=""
              onChange={(item: any) => {
                setValue("date", item.value);
                console.log("here");
                const summary = interviewSummary.find((summary) => item.value == summary.date);
                setSummary(summary);
              }}
              options={interviewSummary.map((summary) => {
                return {
                  value: summary.date,
                  label: summary.date,
                };
              })}
            />
            {errors.date && <p className="text-danger m-0">{errors.date.message}</p>}
          </div>

          {summary && (
            <div className="container-fluid border border-dark rounded-2 my-2 py-2">
              <div className="fw-semibold ">Scheduled count - {summary.headCount}</div>
              <div className="fw-semibold ">Department Count - {summary.departmentCount}</div>
              <div className="fw-semibold ">Interview Count - {summary.interviews}</div>
              <div className="fw-semibold ">
                Total count at the selected date will be -{" "}
                {summary.departmentCount + summary.interviews}
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              {...register("name")}
              disabled={nic == null}
              className="form-control"
              type="text"
            />
            {errors.name && <p className="text-danger m-0">{errors.name.message}</p>}
          </div>

          <div className="d-flex">
            <button disabled={isSubmitting} className="btn btn-primary ms-auto">
              {isSubmitting ? "Submiting..." : "Submit"}
            </button>
            <button
              type="button"
              className="btn btn-danger ms-2"
              onClick={() => {
                resetAll();
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}
