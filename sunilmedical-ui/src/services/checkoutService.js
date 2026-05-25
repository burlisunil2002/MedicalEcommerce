import API from "./api";

export const getCheckout =
  () => API.get("/api/checkout");

export const addAddress =
  (data) =>
    API.post("/api/checkout/address", data);

export const updateAddress =
  (id, data) =>
    API.put(`/api/checkout/address/${id}`, data);