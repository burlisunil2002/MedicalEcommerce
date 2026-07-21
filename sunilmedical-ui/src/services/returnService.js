import axios from "axios";

const API = "/api/order";

export async function getReturns(

    page,

    pageSize,

    search,

    status

) {

    const res = await axios.get("/api/order/returns", {

        params: {

            page,

            pageSize,

            search,

            status

        }

    });

    return res.data;

}

export async function updateReturn(id, data) {
    const res = await axios.put(
        `${API}/returns/${id}`,
        data
    );

    return res.data;
}