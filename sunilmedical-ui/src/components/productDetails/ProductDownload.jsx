import {

    Download

} from "lucide-react";

export default function ProductDownloads({

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

            <h2
                className="
                    text-2xl
                    font-bold
                    mb-8
                "
            >

                Downloads

            </h2>

            {

                product.quotationUrl ?

                    (

                        <a

                            href={product.quotationUrl}

                            target="_blank"

                            rel="noreferrer"

                            className="
                            flex
                            items-center
                            gap-4
                            rounded-2xl
                            border
                            p-5
                            hover:bg-blue-50
                        "

                        >

                            <Download />

                            Download Quotation

                        </a>

                    )

                    :

                    (

                        <div
                            className="
                            text-gray-500
                        "
                        >

                            No downloadable files.

                        </div>

                    )

            }

        </div>

    );

}