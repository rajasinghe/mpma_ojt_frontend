import profileImg from "../../assets/SLPA_Logo-Cu9TOj32.png";
import style from "./styles.module.css";
export default function UserProfile({ id, name, email, type, courses, className }: any) {
  return (
    <div className={`${style.main_content} ${style.content_box} ${className}`}>
      <center>
        <img src={profileImg} className={`card-img-top  ${style.profile_pic}`} alt="Avatar" />
      </center>
      <div className="card-body">
        <h5 className="card-title text-center fw-bold">{name}</h5>
        <ul className="list-group list-group-flush mt-2">
          <li className="list-group-item d-flex">
            <div className=" fw-semibold">User Id :</div>
            <div className="ms-1">{id}</div>
          </li>
          <li className="list-group-item d-flex">
            <div className=" fw-semibold">Type : </div>
            <div className="ms-1">{type}</div>
          </li>
          <li className="list-group-item d-flex">
            <div className=" fw-semibold">Email :</div>
            <div className="ms-1">{email}</div>
          </li>
          <li className="list-group-item">
            <div className=" fw-semibold">Courses :</div>
            <ul>
              {/* {courses &&
                courses.map((course) => (
                  <li key={course && course.id}>{course && course.course_name}</li>
                ))} */}
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}
