import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Base from "./Pages/Base.tsx";
import TraineeDetailsAddPage from "./Pages/TraineeDetailsAddPage.tsx";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import ViewTraineesPage from "./Pages/ViewTraineesPage.tsx";
import {
  newTraineesInsertPageLoader,
  traineeAddSchedulePageLoader,
  traineeBankDetailsLoader,
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
import AttendencesPage from "./Pages/AttendencesPage.tsx";
import { viewAttendenceLoader } from "./loaders/AttendenceLoader.ts";
import { profilePageLoader } from "./loaders/ProfilePageLoader.ts";
import ProfilePage from "./Pages/ProfilePage.tsx";
import TraineeAddBankDetailsPage from "./Pages/TraineeAddBankDetailsPage.tsx";
import LoginPage from "./Pages/LoginPage.tsx";
import ErrorHandler from "./Components/ErrorHandler.tsx";
import TraineeBankDetailsUpdatePage from "./Pages/TraineeBankDetailsUpdatePage.tsx";
import TraineeDetailsUpdatePage from "./Pages/Admin/TraineeDetailsUpdate.tsx";
import UserProfilePage from "./Pages/UserProfilePage.tsx";
import { profileLoader } from "./loaders/UserLoaders.ts";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <LandingPage />,
    children: [
      {
        path: "/OJT",
        element: <Base />,
        errorElement: <ErrorHandler />,
        children: [
          {
            path: "user_profile",
            element: <UserProfilePage />,
            loader: profileLoader,
          },
          {
            path: "trainees",
            loader: viewTraineesPageLoader,
            element: <ViewTraineesPage />,
          },
          {
            path: "add_old_records",
            loader: traineesInsertFormPageLoader,
            element: <TraineeDetailsAddPage />,
          },
          {
            path: "trainees/new",
            element: <TraineeDetailsAddPageV2 />,
            loader: newTraineesInsertPageLoader,
          },
          {
            path: "trainees/:id/add_schedules",
            element: <TraineeAddSchedulePage />,
            loader: traineeAddSchedulePageLoader,
          },
          {
            path: "attendence/new",
            element: <UploadAttendenceSheet />,
          },
          {
            path: "attendence",
            element: <AttendencesPage />,
            loader: viewAttendenceLoader,
          },
          {
            path: "calender",
            loader: holidaysLoader,
            element: <CalenderPage />,
          },
          {
            path: "trainees/:id/profile",
            loader: profilePageLoader,
            element: <ProfilePage />,
          },
          {
            path: "trainees/:id/update",
            loader: updatePageLoader,
            element: <TraineeDetailsUpdatePage />,
          },
          {
            path: "trainees/:id/bank_details",
            loader: traineeBankDetailsLoader,
            element: <TraineeAddBankDetailsPage />,
          },
          {
            path: "trainees/:id/bank_details/update",
            loader: traineeBankDetailsLoader,
            element: <TraineeBankDetailsUpdatePage />,
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
