import { useParams } from "react-router-dom";

import ProductForm from "../components/product/ProductForm";

export default function EditProduct() {

    const { id } = useParams();

    return (

        <ProductForm

            mode="edit"

            productId={id}

        />

    );

}