import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:4000", //10.70.4.34 https://mpmaojt.slpa.lk
  headers: {
    Accept: "application/json",
  },
});

export default instance;
