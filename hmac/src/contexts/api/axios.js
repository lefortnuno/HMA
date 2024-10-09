import axios from "axios";

export default axios.create({
  baseURL:
    `` +
    process.env.REACT_APP_SUN_API_HEAD +
    process.env.REACT_APP_SUN_API_IP_ADRESS +
    // process.env.REACT_APP_SUN_API_PORT +
    `/api/`,
});
