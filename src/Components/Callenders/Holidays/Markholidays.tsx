import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../../../api";
import "./style.css";
import {
  DateSelectArg,
  EventAddArg,
  EventApi,
  EventClickArg,
  EventRemoveArg,
} from "@fullcalendar/core/index.js";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import AddHoliday from "../Models/AddHoliday";

interface props {
  className?: string;
  events: any;
}

export default function Markholidays({ className, events }: props) {
  //fetched holidays the database

  const AddHolidayModalVisibility = useState(false);
  const setHolidayModalVisibility = AddHolidayModalVisibility[1];
  const [selectedDate, setSelectedDate] = useState<null | DateSelectArg>(null);
  const holidayTitleState = useState("");

  useEffect(() => {
    console.log(events);
  }, []);

  function handleEventClick(clickInfo: EventClickArg): void {
    Swal.fire({
      title: "Are you Sure?",
      text: "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove Holiday",
    }).then((result) => {
      if (result.isConfirmed) {
        clickInfo.event.remove();
      }
    });
  }

  function handleDateSelect(selectInfo: DateSelectArg): void {
    console.log("click on event");
    console.log(selectInfo);
    setHolidayModalVisibility(true); //make the add holiday modal visible
    let calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // clear date selection
    setSelectedDate(selectInfo);
    /* ;
    } */
  }

  function handleEvents(events: EventApi[]): void {
    console.log("events changed");
    console.log(events);
    events.forEach((event: EventApi) => {
      console.log(event.title);
    });
  }

  const handleNewEvent = async (args: EventAddArg) => {
    const newEvent = args.event;
    console.log(newEvent);
    try {
      const response = await api.post("api/calender/event", {
        description: newEvent.title,
        startDate: newEvent.startStr,
        endDate: newEvent.endStr,
      });
      console.log(response);
    } catch (error) {
      args.revert();
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
        footer: '<a href="#">Why do I have this issue?</a>',
      });
      console.log(error);
    }
  };

  const handleEventRemove = async (args: EventRemoveArg) => {
    const event = args.event;
    console.log(event);
    try {
      const response = await api.delete("/api/calender/event", {
        params: {
          start_date: event.startStr,
          end_date: event.endStr,
        },
      });
      console.log(response);
    } catch (error) {
      args.revert();
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
        footer: '<a href="#">Why do I have this issue?</a>',
      });
    }
  };

  return (
    <>
      <div className={`small-calendar-container ${className}`}>
        <FullCalendar
          aspectRatio={1.5}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          selectable={true}
          selectMirror={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventsSet={handleEvents} //called after events are initialized/added/changed/removed
          eventContent={(eventInfo) => (
            <span>
              <strong>{eventInfo.event.title}</strong>
            </span>
          )}
          eventAdd={handleNewEvent}
          eventRemove={handleEventRemove}
          weekends={false}
        />
      </div>
      <AddHoliday
        selectedDate={selectedDate}
        holidayTitleState={holidayTitleState}
        visibilityState={AddHolidayModalVisibility}
      />
    </>
  );
}
