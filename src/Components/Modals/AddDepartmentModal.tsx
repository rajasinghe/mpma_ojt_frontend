import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { z } from "zod";
import api from "../../api";
interface props {
  visibilityState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  setDepartments: React.Dispatch<React.SetStateAction<any[]>>;
}

const schema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  max_count: z.coerce
    .number({ message: "max count must be a number" })
    .gt(0, { message: "max count is required" }),
});

type FormType = z.infer<typeof schema>;

export default function AddDepartmentModal({ visibilityState, setDepartments }: props) {
  const [show, setShow] = visibilityState;

  const {
    register,
    reset,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormType>({ resolver: zodResolver(schema) });
  
  const handleClose = () => {
    setShow(false);
  };

  const onSubmit = (formData: FormType) => {
    console.log(formData);
    Swal.fire({
      title: "Are you Sure?",
      text: "Double check if any matching name is available before adding a new Department.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Add new Department",
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
          const response = await api.post("api/department", formData);
          console.log(response);

          //if the response is successfull then refetch the institues
          const { data } = await api.get("api/department");
          setDepartments(data);

          Swal.fire({
            title: "Inserted!",
            text: "New Department is available now.",
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
            setError(key as keyof FormType, { message: error }, { shouldFocus: true });
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label">Institute Name</label>
            <input {...register("name")} className="form-control" type="text" />
            {errors.name && <p className="text-danger m-0">{errors.name.message}</p>}
          </div>

          <div className="mb-3">
            <label className="form-label">Max Count</label>
            <input {...register("max_count")} className="form-control" type="text" />
            {errors.max_count && <p className="text-danger m-0">{errors.max_count.message}</p>}
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
