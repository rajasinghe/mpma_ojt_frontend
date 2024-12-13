import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { z } from "zod";
import api from "../../api";

interface props {
  visibilityState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  setInstitutes: React.Dispatch<React.SetStateAction<any[]>>;
}

const schema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  government: z.boolean(),
});

type formtype = z.infer<typeof schema>;

export default function AddInstituteModal({ visibilityState, setInstitutes }: props) {
  const [show, setShow] = visibilityState;
  const handleClose = () => {
    setShow(false);
    reset();
  };

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<formtype>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (formData: formtype) => {
    console.log(formData);
    Swal.fire({
      title: "Are you Sure?",
      text: "Double check if any matching name is available before adding a new institute.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Add new Institute",
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
          const response = await api.post("api/institutes", formData);
          console.log(response);

          //if the response is successfull then refetch the institues
          const { data } = await api.get("api/institutes");
          setInstitutes(data);

          Swal.fire({
            title: "Inserted!",
            text: "New instute is available now.",
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
            setError(key as keyof formtype, { message: error }, { shouldFocus: true });
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
    <Modal centered={true} show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>ADD NEW INSTITUTES</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form>
          <div className="mb-3">
            <label className="form-label">Institute Name</label>
            <input {...register("name")} className="form-control" type="text" />
            {errors.name && <p className="text-danger m-0">{errors.name.message}</p>}
          </div>

          <div className="form-check">
            <input className="form-check-input" type="checkbox" {...register("government")} />
            <label className="form-check-label">Government</label>
          </div>
          <div className="d-flex">
            <button
              type="button"
              onClick={() => {
                let submission = handleSubmit(onSubmit);
                submission();
              }}
              disabled={isSubmitting}
              className="btn btn-primary ms-auto"
            >
              {isSubmitting ? "Submiting..." : "Submit"}
            </button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}
