import "./styles.css";
export default function MiniLoader() {
  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center "
      style={{ height: "50vh" }}
    >
      <div className="loader"></div>
    </div>
  );
}
