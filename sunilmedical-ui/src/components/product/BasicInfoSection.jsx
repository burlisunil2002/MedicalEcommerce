import React from "react";

export default function BasicInfoSection({
    product,
    handleChange,
    errors
}) {

    const inputClass = (field) =>
        `
        w-full
        rounded-xl
        border
        px-4
        py-3
        outline-none
        transition-all
        duration-200
        bg-white

        ${errors[field]
            ? "border-red-500 ring-2 ring-red-200"
            : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        }
    `;

    return (

        <div
            className="
            bg-white
            rounded-3xl
            shadow-lg
            p-8
            mb-8
        "
        >

            {/* Heading */}

            <div className="mb-8">

                <h2
                    className="
                    text-2xl
                    font-bold
                    text-gray-800
                "
                >
                    Product Information
                </h2>

                <p
                    className="
                    text-gray-500
                    mt-1
                "
                >
                    Enter the basic information about your product.
                </p>

            </div>

            <div
                className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-6
            "
            >

                {/* Product Name */}

                <div>

                    <label
                        className="
                        block
                        mb-2
                        font-semibold
                        text-gray-700
                        "
                    >
                        Product/Item Name
                        <span className="text-red-500 ml-1">*</span>
                    </label>

                    <input
                        type="text"
                        name="name"
                        value={product.name}
                        onChange={handleChange}
                        placeholder="Enter Product Name"
                        className={inputClass("name")}
                    />

                    {errors.name && (

                        <p
                            className="
                            mt-2
                            text-sm
                            text-red-600
                        "
                        >
                            {errors.name}
                        </p>

                    )}

                </div>

                {/* Brand */}

                <div>

                    <label
                        className="
                        block
                        mb-2
                        font-semibold
                        text-gray-700
                    "
                    >
                        Brand
                        <span className="text-red-500 ml-1">*</span>
                    </label>

                    <input
                        type="text"
                        name="brand"
                        value={product.brand}
                        onChange={handleChange}
                        placeholder="Enter Brand"
                        className={inputClass("brand")}
                    />

                    {errors.brand && (

                        <p
                            className="
                            mt-2
                            text-sm
                            text-red-600
                        "
                        >
                            {errors.brand}
                        </p>

                    )}

                </div>

                {/* Category */}

                <div>

                    <label
                        className="
                        block
                        mb-2
                        font-semibold
                        text-gray-700
                    "
                    >
                        Category
                        <span className="text-red-500 ml-1">*</span>
                    </label>

                    <input
                        type="text"
                        name="category"
                        value={product.category}
                        onChange={handleChange}
                        placeholder="Enter Category"
                        className={inputClass("category")}
                    />

                    {errors.category && (

                        <p
                            className="
                            mt-2
                            text-sm
                            text-red-600
                        "
                        >
                            {errors.category}
                        </p>

                    )}

                </div>

                {/* Price Type */}

                <div>

                    <label
                        className="
                        block
                        mb-2
                        font-semibold
                        text-gray-700
                    "
                    >
                        Price Type
                        <span className="text-red-500 ml-1">*</span>
                    </label>

                    <select
                        name="priceType"
                        value={product.priceType}
                        onChange={handleChange}
                        className={inputClass("priceType")}
                    >

                        <option value="Normal">
                            Normal
                        </option>

                        <option value="Ask For Price">
                            Ask For Price
                        </option>

                    </select>

                    {errors.priceType && (

                        <p
                            className="
                            mt-2
                            text-sm
                            text-red-600
                        "
                        >
                            {errors.priceType}
                        </p>

                    )}

                </div>

            </div>

            {/* Description */}

            <div className="mt-6">

                <label
                    className="
                    block
                    mb-2
                    font-semibold
                    text-gray-700
                "
                >
                    Description
                    <span className="text-red-500 ml-1">*</span>
                </label>

                <textarea
                    rows={6}
                    name="description"
                    value={product.description}
                    onChange={handleChange}
                    placeholder="Enter Product Description..."
                    className={inputClass("description")}
                />

                {errors.description && (

                    <p
                        className="
                        mt-2
                        text-sm
                        text-red-600
                    "
                    >
                        {errors.description}
                    </p>

                )}

            </div>

        </div>

    );

}