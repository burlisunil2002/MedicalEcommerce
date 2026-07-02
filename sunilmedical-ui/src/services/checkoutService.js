import API from "./api";

export const getCheckout = () =>
    API.get("/api/checkout");

export const addAddress = (data) =>
    API.post("/api/checkout/address", data);

export const updateAddress = (id, data) =>
    API.put(`/api/checkout/address/${id}`, data);

export const selectAddress = async (id) => {

    console.log("Calling select-address API with:", id);

    const response = await API.post(`/api/checkout/select-address/${id}`);

    console.log("Response:", response);

    return response;
};