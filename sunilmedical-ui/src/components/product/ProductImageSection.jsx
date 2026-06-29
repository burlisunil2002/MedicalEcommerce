import React from "react";
import { Upload, FileText, Trash2, Image as ImageIcon } from "lucide-react";

export default function ProductImageSection({
    product,
    handleImage,
    handleQuotation,
    removeProductImage
}) {

    return (

        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">

            {/* Header */}

            <div className="mb-8">

                <h2 className="text-2xl font-bold text-gray-800">
                    Product Files
                </h2>

                <p className="text-gray-500 mt-1">
                    Upload product image and quotation document.
                </p>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* PRODUCT IMAGE */}

                <div>

                    <label className="block font-semibold mb-3 text-gray-700">

                        Product Image

                    </label>

                    {
                        product.imagePreview ||

                            product.imageUrl ?

                            (

                                <div className="relative">

                                    <img

                                        src={
                                            product.imagePreview ||

                                            product.imageUrl
                                        }

                                        alt="Preview"

                                        className="
                                            w-full
                                            h-72
                                            object-contain
                                            rounded-2xl
                                            border
                                            bg-gray-50
                                        "
                                    />

                                    <button

                                        type="button"

                                        onClick={removeProductImage}

                                        className="
                                            absolute
                                            top-3
                                            right-3
                                            bg-red-600
                                            text-white
                                            p-2
                                            rounded-full
                                            hover:bg-red-700
                                        "
                                    >

                                        <Trash2 size={18} />

                                    </button>

                                </div>

                            )

                            :

                            (

                                <label

                                    className="
                                        border-2
                                        border-dashed
                                        border-gray-300
                                        rounded-2xl
                                        h-72
                                        flex
                                        flex-col
                                        justify-center
                                        items-center
                                        cursor-pointer
                                        hover:border-blue-500
                                        hover:bg-blue-50
                                        transition
                                    "
                                >

                                    <ImageIcon
                                        size={50}
                                        className="text-gray-400 mb-3"
                                    />

                                    <p className="font-semibold">
                                        Upload Product Image
                                    </p>

                                    <p className="text-sm text-gray-500">

                                        JPG, PNG, WEBP

                                    </p>

                                    <input

                                        hidden

                                        type="file"

                                        accept="image/*"

                                        onChange={handleImage}

                                    />

                                </label>

                            )

                    }

                </div>

                {/* QUOTATION */}

                <div>

                    <label className="block font-semibold mb-3 text-gray-700">

                        Quotation File

                    </label>

                    <label

                        className="
                            border-2
                            border-dashed
                            border-gray-300
                            rounded-2xl
                            h-72
                            flex
                            flex-col
                            justify-center
                            items-center
                            cursor-pointer
                            hover:border-green-500
                            hover:bg-green-50
                            transition
                        "
                    >

                        <FileText
                            size={50}
                            className="text-green-600 mb-4"
                        />

                        <p className="font-semibold">

                            Upload Quotation

                        </p>

                        <p className="text-sm text-gray-500">

                            PDF / DOCX

                        </p>

                        {
                            product.quotationFile &&

                            <p className="mt-3 text-green-700 text-sm">

                                {product.quotationFile.name}

                            </p>

                        }

                        <input

                            hidden

                            type="file"

                            accept=".pdf,.doc,.docx"

                            onChange={handleQuotation}

                        />

                    </label>

                </div>

            </div>

        </div>

    );

}