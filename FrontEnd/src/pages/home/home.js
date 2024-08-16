import Template from "../../components/template/template";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  return (
    <>
      <Template><h3> HOME </h3></Template>
    </>
  );
}
