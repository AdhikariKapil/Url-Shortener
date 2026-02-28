import axios from "axios";

const API_BASE_URL = "/api";

//Central Api Client
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

//Endpoinsts
export const shortenUrl = async (originalUrl) => {
  return api.post("/shorten", {
    url: originalUrl,
  });
};

export const redirect = async (alias) => {
  return api.get(`/alias/${alias}`);
};

export const getAllUrl = (async) => {
  return api.get("/analytics");
};

export const getUrlAnalytics = async (alias) => {
  return api.get(`/analytics/${alias}`);
};
