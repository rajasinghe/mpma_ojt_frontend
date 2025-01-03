import { useEffect } from "react";
import profileImg from "../../../assets/SLPA_Logo-Cu9TOj32.png";
import style from "./styles.module.css";
export default function UserProfile({ user, className }: any) {
  useEffect(() => {
    console.log(user);
  });
  return (
    <div className={`${style.main_content} ${style.content_box} ${className}`}>
      <center>
        <img src={profileImg} className={`card-img-top  ${style.profile_pic}`} alt="Avatar" />
      </center>
      <div className="card-body">
        <h5 className="card-title text-center fw-bold">{user.name}</h5>
        <ul className="list-group list-group-flush mt-2">
          <li className="list-group-item d-flex">
            <div className=" fw-semibold">User Id :</div>
            <div className="ms-1">{user.id} </div>
          </li>
          <li className="list-group-item d-flex">
            <div className=" fw-semibold">Type : </div>
            <div className="ms-1">{user.type}</div>
          </li>
          <li className="list-group-item d-flex">
            <div className=" fw-semibold">username :</div>
            <div className="ms-1">{user.username}</div>
          </li>
          <li className="list-group-item">
            <div className=" fw-semibold">Aceess Levels :</div>
            <ul>
              {" "}
              {user &&
                user.accessLevels.map((accessLevel: any) => (
                  <li key={accessLevel && accessLevel.id}>{accessLevel && accessLevel.access}</li>
                ))}{" "}
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}
