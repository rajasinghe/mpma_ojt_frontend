import { useState } from "react";
import "./style.css";
interface props {
  status: string;
  onTime: string | null;
  offTime: string | null;
}

export default function FlipableTableCell({ status, onTime, offTime }: props) {
  const [isFlipped, setFlipped] = useState<boolean>(false);
  return (
    <td
      className={`p-0 ${
        status == "1" ? "table-success" : onTime || offTime ? "table-warning" : "table-danger"
      }`}
    >
      <div
        className={`flip-container ${isFlipped ? "flipped" : ""}`}
        onClick={() => {
          setFlipped(!isFlipped);
        }}
      >
        <div className="flip-card">
          <div className="front">{status}</div>
          <div className="back">
            <div className=" d-block">
              <div>on - {onTime ? onTime : "not set"}</div>
              <div>off - {offTime ? offTime : "not set"}</div>
            </div>
          </div>
        </div>
      </div>
    </td>
  );
}
