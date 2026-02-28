import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

//API Endpoints
export const getHealth = async () => {
  return api.get("/health");
};

export const shortenUrl = async (originalUrl) => {
  return api.post("/shorten", {
    url: originalUrl,
  });
};

export const getAllUrl = async () => {
  return api.get("/analytics");
};

export const getUrlAnalytics = async (alias) => {
  return api.get(`/analytics/${alias}`);
};

export const getAliasUrl = async (alias) => {
  return api.get(`/alias/${alias}`);
};

export const redirect = async (alias) => {
  return axios.get(`/${alias}`);
};
