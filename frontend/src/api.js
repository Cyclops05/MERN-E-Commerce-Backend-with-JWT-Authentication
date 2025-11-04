import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:4000/api", // backend base URL
});
