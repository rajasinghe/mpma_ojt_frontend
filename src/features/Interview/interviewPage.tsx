import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  nic: z.number(),
  name: z.string().optional(),
  startDate: z.date(),
  duration: z.string(),
  departments: z.array(z.string()),
})

type FormSchema = z.infer<typeof formSchema>;

const onSubmit = (data: FormSchema) => {
  console.log(data);
}

export default function NewInterviewPage() {

  const { register, handleSubmit, formState: { errors } } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
  });

  return (
    <MainContainer title="Trainee Interview" breadCrumbs={["Interviews", "Interview"]}>
      <SubContainer>
        <div>new interview page</div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="nic">NIC</label>
            <input type="number" id="nic" {...register("nic")} />
            {errors.nic && <span>{errors.nic.message}</span>}
          </div>
          <div>
            <label htmlFor="name">Name</label>
            <input type="text" id="name" {...register("name")} />
            {errors.name && <span>{errors.name.message}</span>}
          </div>
          <div>
            <label htmlFor="startDate">Start Date</label>
            <input type="date" id="startDate" {...register("startDate")} />
            {errors.startDate && <span>{errors.startDate.message}</span>}
          </div>
          <div>
            <label htmlFor="duration">Duration</label>
            <input type="text" id="duration" {...register("duration")} />
            {errors.duration && <span>{errors.duration.message}</span>}
          </div>
          <div>
            <label htmlFor="departments">Departments</label>
            <input type="text" id="departments" {...register("departments")} />
            {errors.departments && <span>{errors.departments.message}</span>}
          </div>
          <button type="submit">Submit</button>
        </form>
      </SubContainer>
    </MainContainer>
  );
}
