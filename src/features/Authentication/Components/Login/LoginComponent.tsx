import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import "./style.css";
import api from "../../../../api";
import Swal from "sweetalert2";
interface LoginComponentProps {
  className?: string;
}

function LoginComponent({}: LoginComponentProps) {
  const schema = z.object({
    username: z.string().min(1, { message: "plz enter the user name" }),
    password: z.string().min(1, { message: "plz enter the password" }),
  });
  type loginRequest = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<loginRequest>({ resolver: zodResolver(schema) });

  const navigate = useNavigate();

  //const usercontext = useContext(UserContext);

  //const login = async (data: loginRequest) => {};

  const onSubmit: SubmitHandler<loginRequest> = async (data) => {
    try {
      console.log(data);
      Swal.fire({
        title: "Please Wait",
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const response = await api.post("auth/login", data);
      localStorage.setItem("token", response.data);
      console.log(response.data);
      navigate("/OJT/trainees");
      Swal.close();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
        footer: '<a href="#">Why do I have this issue?</a>',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="login-body d-flex">
        <div className="login-mainBox mx-auto">
          <h1 className="login-title">Login</h1>
          <h3 className="login-fieldTitle nameFildTitl">Username</h3>
          <div className="login-userNameFieldArea d-flex">
            <input
              {...register("username")}
              type="text"
              className="login-field mx-auto login-input"
              placeholder="johndeere@email.com"
            />
          </div>
          <h3 className="login-fieldTitle passFildTitl">Password</h3>
          <div className="login-passwordFieldArea d-flex">
            <input
              {...register("password")}
              type="password"
              className="login-field mx-auto login-input"
              placeholder="***************"
            />
          </div>
          <div className="login-special">
            <div className="login-forgotpass-back">
              {/* <a href="#">
                <div className="login-forgotpass">Forgot password ?</div>
              </a> */}
            </div>
          </div>
          <div className="login-submit">
            <button disabled={isSubmitting} className="login-submitBtn">
              Login
            </button>
          </div>
          <div className="login-fogotPass">
            <div>
              Don’t have account?{" "}
              <Link to={"/request_account"} className="login-requestAdmin">
                Request Admin
              </Link>
            </div>
          </div>
          {/* <div className="login-ORTitleBack">---OR---</div>
          <div className="login-signInTitle">Sign in with</div>
          <div className="login-googleLogin">
            <a href="#">
              <button type="button">
                <div className="googleLoginLogo"></div> <div>Sign in with Google</div>{" "}
              </button>
            </a>
          </div> */}
        </div>
      </div>
    </form>
  );
}
/* 
interface LoginCredentials {
  username: string;
  password: string;
} */

export default LoginComponent;
