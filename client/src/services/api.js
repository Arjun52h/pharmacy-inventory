import axios from "axios";

const API = axios.create({
  baseURL: "/api",
});

const CLOCK_API = axios.create({
  baseURL: "",
});

export const getBatches = (search = "") =>
  API.get(`/batches?search=${encodeURIComponent(search)}`);

export const getMedicineBatches = (name) =>
  API.get(`/batches/medicine/${encodeURIComponent(name)}`);

export const createBatch = (data) =>
  API.post("/batches", data);

export const dispenseMedicine = (data) =>
  API.post("/batches/dispense", data);

export const getExpiringBatches = (days = 30) =>
  API.get(`/batches/expiring?days=${days}`);

export const getMedicineStock = () =>
  API.get("/batches/stock/summary");

export const runDailyAutomation = () =>
  CLOCK_API.post("/clock");

export default API;