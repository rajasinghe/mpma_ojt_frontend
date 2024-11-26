import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { z } from "zod";
import api from "../../api";

interface props {
  setPrograms: React.Dispatch<React.SetStateAction<any[]>>;
  visibilityState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
}

const schema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  code: z.union([
    z
      .string()
      .regex(/^[a-zA-Z]+$/, { message: "cannot contain any spaces,numbers or special charachters" })
      .toUpperCase()
      .min(2, { message: "code must contain letters in the range of 2-10" })
      .max(10),
    z.string().length(0),
  ]),
});

type formType = z.infer<typeof schema>;

export default function AddProgramModal({ visibilityState, setPrograms }: props) {
  const [show, setShow] = visibilityState;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<formType>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (formData: formType) => {
    console.log(formData);
    Swal.fire({
      title: "Are you Sure?",
      text: "Double check if any matching name is available before adding a new program.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Add new Program",
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
          const response = await api.post("api/programs", formData);
          console.log(response);

          //if the response is successfull then refetch the institues
          const { data } = await api.get("api/programs");
          setPrograms(data);

          Swal.fire({
            title: "Inserted!",
            text: "New program is available now.",
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
            title: "Duplicate Record",
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
  };

  const handleClose = () => {
    setShow(false);
  };

  return (
    <Modal centered={true} show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>ADD NEW PROGRAM</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label">Program Name</label>
            <input {...register("name")} className="form-control" type="text" />
            {errors.name && <p className="text-danger m-0">{errors.name.message}</p>}
          </div>

          <div className="mb-3">
            <label className="form-label">Program Code</label>
            <input {...register("code")} className="form-control" type="text" />
            {errors.code && <p className="text-danger m-0">{errors.code.message}</p>}
          </div>
          <div className="d-flex">
            <button disabled={isSubmitting} className="btn btn-primary ms-auto">
              {isSubmitting ? "Submiting..." : "Submit"}
            </button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}
