import { Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { z } from "zod";
import NIC from "../traineeForm/NIC";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";
import api from "../../api";
import { useNavigate } from "react-router-dom";
interface Props {
  showState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  interview?: any;
  department: any;
  refetchInterviews: () => Promise<void>;
}
const schema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
});

export default function InterviewModal({
  showState,
  interview,
  department,
  refetchInterviews,
}: Props) {
  const [show, setShow] = showState;
  const [nic, setNic] = useState<string | null>(null);
  const nicDisableState = useState<boolean>(false);
  type formType = z.infer<typeof schema>;
  useEffect(() => {
    console.log("interview changed", interview);
    if (interview) {
      setNic(interview.NIC);
      setValue("name", interview.name);
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

  const insert = async (name: any) => {
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
          name: name,
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

  const update = async (name: any) => {
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
          name: name,
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

  const onSubmit = async (formData: formType) => {
    try {
      if (nic == null) {
        return setError("root", { message: "Validate a Nic before Submission" });
      }
      if (interview) {
        await update(formData.name);
      } else {
        await insert(formData.name);
      }

      reset();
      setNic(null);
      nicDisableState[1](false);
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
                reset();
                nicDisableState[1](false);
                setNic(null);
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
