import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";

export default function NotificationPage() {
  return (
    <MainContainer
      title="Notifications"
      breadCrumbs={["Home", "Notifications"]}
    >
      <SubContainer>
        <div>Notifications</div>
      </SubContainer>
    </MainContainer>
  );
}
