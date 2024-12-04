import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Base from "./Pages/Base.tsx";
import TraineeDetailsAddPage from "./Pages/TraineeDetailsAddPage.tsx";
import UpdateTraineeDetails from "./Pages/UpdateTraineeDetails.tsx";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import ViewTraineesPage from "./Pages/ViewTraineesPage.tsx";
import {
  newTraineesInsertPageLoader,
  traineeAddSchedulePageLoader,
  traineesInsertFormPageLoader,
  viewTraineesPageLoader,
} from "./loaders/TraineesLoader.ts";

import { updatePageLoader } from "./loaders/UpdatePageLoader.ts";
import LandingPage from "./Components/LandingPage.tsx";
import TraineeDetailsAddPageV2 from "./Pages/TraineeDetailsAddPageV2.tsx";
import TraineeAddSchedulePage from "./Pages/TraineeAddSchedulePage.tsx";
import UploadAttendenceSheet from "./Pages/UploadAttendenceSheet.tsx";
import CalenderPage from "./Pages/CalenderPage.tsx";
import { holidaysLoader } from "./loaders/HolidaysLoader.ts";
import LoginPage from "./Pages/LoginPage.tsx";
import AttendencesPage from "./Pages/AttendencesPage.tsx";
import { viewAttendenceLoader } from "./loaders/AttendenceLoader.ts";
const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "login",
    element: <LoginPage />,
  },
  {
    path: "/Trainee",
    element: <Base />,
    children: [
      {
        path: "",
        loader: viewTraineesPageLoader,
        element: <ViewTraineesPage />,
      },
      {
        path: "add_old_records",
        loader: traineesInsertFormPageLoader,
        element: <TraineeDetailsAddPage />,
      },
      {
        path: "new",
        element: <TraineeDetailsAddPageV2 />,
        loader: newTraineesInsertPageLoader,
      },
      {
        path: ":id/add_schedules",
        element: <TraineeAddSchedulePage />,
        loader: traineeAddSchedulePageLoader,
      },
      {
        path: ":NIC_NO/update",
        loader: updatePageLoader,
        element: <UpdateTraineeDetails />,
      },
      {
        path: "attendence/new",
        element: <UploadAttendenceSheet />,
      },
      {
        path: "attendences",
        element: <AttendencesPage />,
        loader: viewAttendenceLoader,
      },
      {
        path: "calender",
        loader: holidaysLoader,
        element: <CalenderPage />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
