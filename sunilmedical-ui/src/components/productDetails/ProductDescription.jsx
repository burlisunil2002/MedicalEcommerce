import { FileText } from "lucide-react";

export default function ProductDescription({

    product

}) {

    return (

        <div
            className="
                bg-white
                rounded-3xl
                shadow-sm
                border
                p-8
            "
        >

            <div
                className="
                    flex
                    items-center
                    gap-3
                    mb-6
                "
            >

                <FileText
                    className="
                        text-blue-600
                    "
                />

                <h2
                    className="
                        text-2xl
                        font-bold
                    "
                >

                    Product Description

                </h2>

            </div>

            <div
                className="
                    whitespace-pre-line
                    leading-8
                    text-gray-700
                "
            >

                {

                    product.description ||

                    "No description available."

                }

            </div>

        </div>

    );

}