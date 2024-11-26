import axios from "axios";

const instance = axios.create({
  baseURL: "http://10.70.4.34:4000",
  headers: {
    Accept: "application/json",
  },
});

export default instance;
