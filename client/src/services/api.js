import axios from "axios";

const API = axios.create({
  baseURL: "/api",
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

export default API;