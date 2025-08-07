import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../../api";
import Swal from "sweetalert2";

const schema = z.object({
  NIC: z
    .string()
    .min(1, "NIC is required")
    .regex(
      /^(([5-9]{1})([0-9]{1})([0,1,2,3,5,6,7,8]{1})([0-9]{6})([vVxX]))|(([1-2]{1})([0,9]{1})([0-9]{2})([0,1,2,3,5,6,7,8]{1})([0-9]{7}))$/,
      "Invalid NIC format"
    ),
});

type FormType = z.infer<typeof schema>;

interface InterviewNicProps {
  value?: string;
  onValidated?: (nic: string) => void;
  disabled?: boolean;
  setNicValidated?: (validated: boolean) => void;
  setNicDisable?: (disabled: boolean) => void;
}

interface InterviewData {
  NIC: string;
}

export default function InterviewNic({
  value = "",
  onValidated,
  disabled = false,
  setNicValidated,
  setNicDisable,
}: InterviewNicProps) {
  const [isDisabled, setIsDisabled] = useState(disabled);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: { NIC: value },
  });

  const nicField = watch("NIC");

  // Update form value when prop changes
  useEffect(() => {
    setValue("NIC", value);
  }, [value, setValue]);

  // Update disabled state when prop changes
  useEffect(() => {
    setIsDisabled(disabled);
  }, [disabled]);

  const onValidate = async (data: FormType) => {
    try {
      // Fetch all interviews
      const response = await api.get("/api/interview");
      const response2 = await api.get(`/api/portal/NIC_check/${data.NIC}`);

      const interviews: InterviewData[] = response.data.InterviewDetails || [];
      const trainees = response2.data || false;

      // Check if NIC already exists
      const exists = interviews.some((interview) => interview.NIC === data.NIC);

      if (exists || trainees.exists) {
        setFocus("NIC");
        await Swal.fire({
          title: "Not Eligible",
          text: "Interview already exists for this NIC.",
          icon: "error",
        });
        setNicValidated?.(false);
        return;
      }

      // Validation successful
      setIsDisabled(true);
      setNicValidated?.(true);
      setNicDisable?.(true);
      onValidated?.(data.NIC);
    } catch (error) {
      console.error("NIC validation error:", error);
      setFocus("NIC");
      await Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Unable to validate NIC. Please try again.",
      });
      setNicValidated?.(false);
    }
  };

  return (
    <div className="mb-3">
      <label className="form-label">NIC Number</label>
      <div className="d-flex gap-2">
        <input
          type="text"
          className={`form-control ${errors.NIC ? "is-invalid" : ""}`}
          disabled={isDisabled}
          placeholder="Enter NIC number"
          {...register("NIC")}
        />
        <button
          type="button"
          className="btn btn-success"
          disabled={isSubmitting || isDisabled || !nicField?.trim()}
          onClick={handleSubmit(onValidate)}
        >
          {isSubmitting ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Validating...
            </>
          ) : (
            "Validate"
          )}
        </button>
      </div>
      {errors.NIC && (
        <div className="invalid-feedback d-block">{errors.NIC.message}</div>
      )}
    </div>
  );
}
