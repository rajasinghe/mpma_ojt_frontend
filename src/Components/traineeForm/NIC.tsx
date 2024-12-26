import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import api from "../../api";
import Swal from "sweetalert2";
import { useEffect } from "react";
interface NicProps {
  className: string;
  nicDisableState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  setNIC_NO: (value: React.SetStateAction<string | null>) => void;
  nic?: string;
}

const schema = z.object({
  NIC_NO: z
    .string()
    .regex(
      /^(([5-9]{1})([0-9]{1})([0,1,2,3,5,6,7,8]{1})([0-9]{6})([vVxX]))|(([1-2]{1})([0,9]{1})([0-9]{2})([0,1,2,3,5,6,7,8]{1})([0-9]{7}))$/,
      "invalid NIC format"
    ),
});

type formType = z.infer<typeof schema>;

export default function NIC({ nicDisableState, className, setNIC_NO, nic }: NicProps) {
  const [disabled, disable] = nicDisableState;
  let defaultValue = {};
  if (nic) {
    defaultValue = {
      NIC_NO: nic,
    };
  }

  useEffect(() => {
    console.log("nic Changed", nic);
  }, [nic]);

  const {
    register,
    handleSubmit,
    setFocus,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<formType>({
    resolver: zodResolver(schema),
    defaultValues: defaultValue,
  });

  const onSubmit = async (data: formType) => {
    try {
      if (nic && data.NIC_NO == nic) {
        return Swal.fire({
          title: "No Change in NIC",
          text: " ",
          icon: "error",
        });
      } else {
        const response = await api.get(`/api/trainee/eligibility/${data.NIC_NO}`);
        console.log(response);
        if (response.status == 200) {
          if (response.data.exists) {
            setFocus("NIC_NO");
            return Swal.fire({
              title: "Not Eligible",
              text: "record exists with the nic number ",
              icon: "error",
            });
          } else {
            setNIC_NO(response.data.nic);
            disable(true);
          }
        }
      }
    } catch (error) {
      console.log(error);
      setFocus("NIC_NO");
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
        footer: '<a href="#">Why do I have this issue?</a>',
      });
    }
  };

  const nicField = watch("NIC_NO");

  return (
    <div className={className}>
      <div className="border border-dark p-2 rounded-2">
        <div className="">
          <label className="form-label">NIC Number</label>
          <div className=" d-flex">
            <input
              disabled={disabled}
              type="text"
              className=" ms-auto form-control"
              {...register("NIC_NO")}
            />
            <button
              disabled={isSubmitting || disabled || nicField == nic}
              className="btn btn-sm btn-success ms-2"
              type="button"
              onClick={handleSubmit(onSubmit)}
            >
              {isSubmitting ? "Validating..." : "validate"}
            </button>
          </div>
          <div>
            {errors.NIC_NO && <p className="text-danger m-0 mt-1">{errors.NIC_NO.message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
