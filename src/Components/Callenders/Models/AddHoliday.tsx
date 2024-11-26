import { DateSelectArg } from "@fullcalendar/core/index.js";
import { useState } from "react";
import { Modal } from "react-bootstrap";
interface props {
  visibilityState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  holidayTitleState: [string, React.Dispatch<React.SetStateAction<string>>];
  selectedDate: DateSelectArg | null;
}

export default function AddHoliday({ visibilityState, holidayTitleState, selectedDate }: props) {
  const [show, setShow] = visibilityState;
  const [title, setTitle] = holidayTitleState;
  const [error, setError] = useState<string | null>(null);
  const handleClose = () => {
    setShow(false);
    setTitle("");
    setError(null);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  return (
    <Modal centered={true} show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>New Holiday</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input
            value={title}
            autoFocus
            className="form-control"
            type="text"
            onChange={handleTitleChange}
          />
          {error && <p className="text-danger">{error}</p>}
          <div className="d-flex">
            <button
              type="button"
              className="btn btn-primary mt-2 ms-auto"
              onClick={() => {
                if (/^[A-Za-z'-][A-Za-z' -]{1,50}$/.test(title)) {
                  if (selectedDate) {
                    let calendarApi = selectedDate.view.calendar;
                    calendarApi.addEvent({
                      title: title,
                      color: "red",
                      start: selectedDate.startStr,
                      end: selectedDate.endStr,
                      allDay: selectedDate.allDay,
                    });
                    setTitle("");
                    setShow(false);
                  }
                } else {
                  setError("plz check the title of the holiday");
                }
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
