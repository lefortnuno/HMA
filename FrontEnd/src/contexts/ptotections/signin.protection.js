import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SignInProtection(props) {
  const Cmp = props.Cmp;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/");
  }, []);

  return (
    <>
      <Cmp />
    </>
  );
}
