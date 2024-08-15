import axios from "axios";

export default axios.create({
  baseURL:
    `http://` +
    process.env.REACT_APP_API_IP_ADRESS +
    process.env.REACT_APP_API_PORT +
    `/api/`,
});
