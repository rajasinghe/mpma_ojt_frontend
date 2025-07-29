import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import UserForm from "../../Components/User/UserForm/UserUpdateForm";
import api from "../../api";
import Loader from "../../Components/ui/Loader/Loader";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";

export default function UserUpdatePage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [defaultLevels, setDefaultLevels] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const [userRes, accessLevelsRes] = await Promise.all([
          api.get(`/auth/user/${id}`),
          api.get("/auth/accessLevels"),
        ]);
        setUser(userRes.data);
        setDefaultLevels(accessLevelsRes.data);
      } catch (e: any) {
        if (e.response && e.response.status === 404) {
          setError("User not found");
        } else {
          setError("Failed to load user data");
        }
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  if (loading) return <Loader />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!user) return <div>User not found</div>;

  console.log("User", user);
  console.log("Default Levels", defaultLevels);

  return (
    <MainContainer
      title="Update User"
      breadCrumbs={["Home", "Users", "Update User"]}
    >
      <SubContainer>
        <UserForm user={user} defaultLevels={defaultLevels} />
      </SubContainer>
    </MainContainer>
  );
}
