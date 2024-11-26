import "./styles.css";
export default function Loader() {
  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center "
      style={{ height: "80vh" }}
    >
      <div className="loader"></div>
      <div className="ms-5 mt-2 display-1">Loading ...</div>
    </div>
  );
}
