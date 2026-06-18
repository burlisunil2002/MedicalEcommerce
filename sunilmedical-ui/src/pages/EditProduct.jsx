import React, {useEffect,useState} from "react";
import {useNavigate,useParams} from "react-router-dom";
import API from "../services/api";

export default function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [product, setProduct] =
        useState({
            id: 0,
            name: "",
            brand: "",
            category: "",
            description: "",
            gstPercentage: "",
            hsnCode: "",
            priceType: "Normal",
            batchNumber: "",
            expiryDate: "",
            weight: "",
            isFragile: false,
            isHotDeal: false,
            discountPercentage: "",
            dealEndDate: "",

            imageUrl: "",
            imageFile: null,

            quotationUrl: "",
            quotationFile: null,

            variants: []
        });

    useEffect(() => {
        loadProduct();
    }, []);

    const loadProduct =
        async () => {
            try {
                const res =
                    await API.get(
                        `/api/products/edit/${id}`
                    );

                const p =
                    res.data.product;

                setProduct({
                    ...p,

                    imageFile: null,
                    quotationFile: null,

                    expiryDate:
                        p.expiryDate
                            ?.split("T")[0] ||
                        "",

                    dealEndDate:
                        p.dealEndDate
                            ?.substring(
                                0,
                                16
                            ) || "",

                    variants:
                        p.variants?.map(
                            (v) => ({
                                ...v,
                                imageFile:
                                    null,
                                specifications:
                                    v.specifications ||
                                    []
                            })
                        ) || []
                });
            } catch {
                alert(
                    "Failed to load product"
                );
            } finally {
                setLoading(false);
            }
        };

    const handleChange = (
        e
    ) => {
        const {
            name,
            value,
            type,
            checked
        } = e.target;

        setProduct((prev) => ({
            ...prev,
            [name]:
                type ===
                    "checkbox"
                    ? checked
                    : value
        }));
    };

    const addVariant = () => {
        setProduct((prev) => ({
            ...prev,
            variants: [
                ...prev.variants,
                {
                    productVariantId:
                        0,
                    model: "",
                    size: "",
                    unit: "",
                    packSize: "",
                    minQuantity: 1,
                    maxQuantity:
                        "",
                    stepQuantity: 1,
                    price: "",
                    stockQuantity:
                        "",
                    imageUrl: "",
                    imageFile:
                        null,
                    specifications:
                        []
                }
            ]
        }));
    };

    const removeVariant = (
        index
    ) => {
        setProduct((prev) => ({
            ...prev,
            variants:
                prev.variants.filter(
                    (
                        _,
                        i
                    ) =>
                        i !== index
                )
        }));
    };

    const addSpecification = (
        vIndex
    ) => {
        const updated = [
            ...product.variants
        ];

        updated[
            vIndex
        ].specifications.push({
            key: "",
            value: ""
        });

        setProduct({
            ...product,
            variants:
                updated
        });
    };

    const removeSpecification =
        (
            vIndex,
            sIndex
        ) => {
            const updated = [
                ...product.variants
            ];

            updated[
                vIndex
            ].specifications =
                updated[
                    vIndex
                ].specifications.filter(
                    (
                        _,
                        i
                    ) =>
                        i !== sIndex
                );

            setProduct({
                ...product,
                variants:
                    updated
            });
        };

    const handleSubmit =
        async (e) => {
            e.preventDefault();

            setSaving(true);

            try {
                const formData =
                    new FormData();

                formData.append(
                    "Id",
                    product.id
                );

                formData.append(
                    "Name",
                    product.name
                );

                formData.append(
                    "Brand",
                    product.brand
                );

                formData.append(
                    "Category",
                    product.category
                );

                formData.append(
                    "Description",
                    product.description
                );

                formData.append(
                    "GSTPercentage",
                    product.gstPercentage
                );

                formData.append(
                    "HSNCode",
                    product.hsnCode
                );

                formData.append(
                    "PriceType",
                    product.priceType
                );

                formData.append(
                    "BatchNumber",
                    product.batchNumber
                );

                formData.append(
                    "Weight",
                    product.weight
                );

                formData.append(
                    "IsFragile",
                    product.isFragile
                );

                formData.append(
                    "IsHotDeal",
                    product.isHotDeal
                );

                formData.append(
                    "DiscountPercentage",
                    product.discountPercentage
                );

                if (
                    product.expiryDate
                ) {
                    formData.append(
                        "ExpiryDate",
                        product.expiryDate
                    );
                }

                if (
                    product.dealEndDate
                ) {
                    formData.append(
                        "DealEndDate",
                        product.dealEndDate
                    );
                }

                if (
                    product.imageFile
                ) {
                    formData.append(
                        "imageFile",
                        product.imageFile
                    );
                }

                if (
                    product.quotationFile
                ) {
                    formData.append(
                        "quotationFile",
                        product.quotationFile
                    );
                }

                product.variants.forEach(
                    (
                        v,
                        i
                    ) => {
                        formData.append(
                            `Variants[${i}].ProductVariantId`,
                            v.productVariantId
                        );

                        formData.append(
                            `Variants[${i}].Model`,
                            v.model ||
                            ""
                        );

                        formData.append(
                            `Variants[${i}].Size`,
                            v.size ||
                            ""
                        );

                        formData.append(
                            `Variants[${i}].Unit`,
                            v.unit ||
                            ""
                        );

                        formData.append(
                            `Variants[${i}].PackSize`,
                            v.packSize ||
                            ""
                        );

                        formData.append(
                            `Variants[${i}].MinQuantity`,
                            v.minQuantity ||
                            1
                        );

                        formData.append(
                            `Variants[${i}].MaxQuantity`,
                            v.maxQuantity ||
                            ""
                        );

                        formData.append(
                            `Variants[${i}].StepQuantity`,
                            v.stepQuantity ||
                            1
                        );

                        formData.append(
                            `Variants[${i}].Price`,
                            v.price ||
                            0
                        );

                        formData.append(
                            `Variants[${i}].StockQuantity`,
                            v.stockQuantity ||
                            0
                        );

                        if (
                            v.imageFile
                        ) {
                            formData.append(
                                `Variants[${i}].ImageFile`,
                                v.imageFile
                            );
                        }

                        v.specifications?.forEach(
                            (
                                s,
                                j
                            ) => {
                                formData.append(
                                    `Variants[${i}].Specifications[${j}].Key`,
                                    s.key
                                );

                                formData.append(
                                    `Variants[${i}].Specifications[${j}].Value`,
                                    s.value
                                );
                            }
                        );
                    }
                );

                await API.put(
                    `/api/products/${id}`,
                    formData
                );

          alert(
                    "Product updated successfully"
                );

                setTimeout(
                    () =>
                        navigate(
                            "/product-management"
                        ),
                    1000
                );
            } catch {
                alert(
                    "Failed to update product"
                );
            } finally {
                setSaving(false);
            }
        };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white text-xl">
                Loading Product...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-8 text-black">
            <div className="max-w-7xl mx-auto space-y-8">
                <form onSubmit={handleSubmit}>

                    {/* HEADER */}

                    <div className="flex justify-between items-center mb-10">

                        <div>
                            <h1 className="text-4xl font-bold">
                                Edit Product
                            </h1>

                            <p className="text-slate-400 mt-2">
                                Modify product details, variants and specifications
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate("/admin/products")}
                            className="
              px-6 py-3
              rounded-2xl
              border
              border-slate-600
              hover:bg-white/10
            "
                        >
                            Back
                        </button>

                    </div>

                    {/* BASIC INFORMATION */}

                    <div
                        className="
    bg-white
    rounded-3xl
    p-8
    shadow-lg
    border
    border-slate-200
  "
                    >
                        <h2 className="
  text-2xl
  font-bold
  text-slate-800
  mb-6
">                            Basic Information
                        </h2>

                        <div className="grid md:grid-cols-2 gap-5">

                            <input
                                name="name"
                                value={product.name || ""}
                                onChange={handleChange}
                                placeholder="Product Name"
                                className="input"
                            />

                            <input
                                name="brand"
                                value={product.brand || ""}
                                onChange={handleChange}
                                placeholder="Brand"
                                className="input"
                            />

                            <input
                                name="category"
                                value={product.category || ""}
                                onChange={handleChange}
                                placeholder="Category"
                                className="input"
                            />

                            <select
                                name="priceType"
                                value={product.priceType || "Normal"}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="Normal">
                                    Normal
                                </option>

                                <option value="Quote">
                                    Quote
                                </option>
                            </select>

                            <input
                                type="number"
                                name="gstPercentage"
                                value={product.gstPercentage || ""}
                                onChange={handleChange}
                                placeholder="GST %"
                                className="input"
                            />

                            <input
                                name="hsnCode"
                                value={product.hsnCode || ""}
                                onChange={handleChange}
                                placeholder="HSN Code"
                                className="input"
                            />

                        </div>

                        <textarea
                            name="description"
                            value={product.description || ""}
                            onChange={handleChange}
                            rows={5}
                            placeholder="Description"
                            className="input mt-5"
                        />

                    </div>

                    {/* PRODUCT FILES */}

                    <div className="bg-white/10 rounded-3xl p-8 mb-8">

                        <h2 className="text-2xl font-bold mb-6">
                            Product Files
                        </h2>

                        <div className="grid md:grid-cols-2 gap-8">

                            <div>

                                <label className="block mb-3">
                                    Product Image
                                </label>

                                {product.imageUrl && (
                                    <img
                                        src={product.imageUrl}
                                        className="
                    h-32
                    w-32
                    rounded-2xl
                    object-cover
                    mb-4
                  "
                                    />
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setProduct({
                                            ...product,
                                            imageFile:
                                                e.target.files[0]
                                        })
                                    }
                                    className="input"
                                />

                            </div>

                            <div>

                                <label className="block mb-3">
                                    Quotation File
                                </label>

                                <input
                                    type="file"
                                    onChange={(e) =>
                                        setProduct({
                                            ...product,
                                            quotationFile:
                                                e.target.files[0]
                                        })
                                    }
                                    className="input"
                                />

                            </div>

                        </div>

                    </div>

                    {/* MEDICAL INFORMATION */}

                    <div className="bg-white/10 rounded-3xl p-8 mb-8">

                        <h2 className="text-2xl font-bold mb-6">
                            Medical Information
                        </h2>

                        <div className="grid md:grid-cols-3 gap-5">

                            <input
                                name="batchNumber"
                                value={product.batchNumber || ""}
                                onChange={handleChange}
                                placeholder="Batch Number"
                                className="input"
                            />

                            <input
                                type="date"
                                name="expiryDate"
                                value={product.expiryDate || ""}
                                onChange={handleChange}
                                className="input"
                            />

                            <input
                                type="number"
                                name="weight"
                                value={product.weight || ""}
                                onChange={handleChange}
                                placeholder="Weight"
                                className="input"
                            />

                        </div>

                    </div>

                    {/* DEALS */}

                    <div className="bg-white/10 rounded-3xl p-8 mb-8">

                        <h2 className="text-2xl font-bold mb-6">
                            Deals & Options
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="isFragile"
                                    checked={product.isFragile}
                                    onChange={handleChange}
                                />
                                Fragile Product
                            </label>

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="isHotDeal"
                                    checked={product.isHotDeal}
                                    onChange={handleChange}
                                />
                                Hot Deal
                            </label>

                            <input
                                type="number"
                                name="discountPercentage"
                                value={
                                    product.discountPercentage || ""
                                }
                                onChange={handleChange}
                                placeholder="Discount %"
                                className="input"
                            />

                            <input
                                type="datetime-local"
                                name="dealEndDate"
                                value={product.dealEndDate || ""}
                                onChange={handleChange}
                                className="input"
                            />

                        </div>

                    </div>

                    {/* VARIANTS */}

                    <div className="bg-white/10 rounded-3xl p-8">

                        <div className="flex justify-between items-center mb-8">

                            <h2 className="text-2xl font-bold">
                                Product Variants
                            </h2>

                            <button
                                type="button"
                                onClick={addVariant}
                                className="
                bg-indigo-600
                px-5
                py-3
                rounded-2xl
                text-white
              "
                            >
                                + Add Variant
                            </button>

                        </div>

                        {product.variants.map(
                            (variant, vIndex) => (

                                <div
                                    key={vIndex}
                                    className="
bg-slate-50
border
border-slate-200
rounded-3xl
p-6
mb-6
"
                                >

                                    {/* Variant Header */}

                                    <div className="
flex
justify-between
items-center
mb-6
border-b
border-slate-200
pb-4
">
                                        <h3 className="text-xl font-bold">
                                            Variant {vIndex + 1}
                                        </h3>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeVariant(vIndex)
                                            }
                                            className="
    bg-red-500
    hover:bg-red-600
    text-white
    px-4
    py-2
    rounded-xl
    transition
  "
                                        >
                                            Remove Variant
                                        </button>
                                       

                                    </div>

                                    {/* Variant Inputs */}

                                    <div className="grid md:grid-cols-3 gap-4">

                                        <input
                                            value={variant.model || ""}
                                            onChange={(e) => {
                                                const updated = [...product.variants];
                                                updated[vIndex].model = e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            className="input"
                                        />

                                        <input
                                            value={variant.size || ""}
                                            placeholder="Size"
                                            onChange={(e) => {
                                                const updated = [...product.variants];

                                                updated[vIndex].size =
                                                    e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            className="input"
                                        />

                                        <input
                                            value={variant.unit || ""}
                                            placeholder="Unit"
                                            onChange={(e) => {
                                                const updated = [...product.variants];

                                                updated[vIndex].unit =
                                                    e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            className="input"
                                        />

                                        <input
                                            type="number"
                                            value={
                                                variant.stockQuantity || ""
                                            }
                                            placeholder="Stock Quantity"
                                            onChange={(e) => {
                                                const updated =
                                                    [...product.variants];

                                                updated[vIndex]
                                                    .stockQuantity =
                                                    e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            className="input"
                                        />

                                        <input
                                            type="number"
                                            value={variant.price || ""}
                                            onChange={(e) => {
                                                const updated = [...product.variants];
                                                updated[vIndex].price = e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            className="input"
                                        />

                                        <input
                                            type="number"
                                            value={
                                                variant.stepQuantity || ""
                                            }
                                            placeholder="Step Quantity"
                                            onChange={(e) => {
                                                const updated =
                                                    [...product.variants];

                                                updated[vIndex]
                                                    .stepQuantity =
                                                    e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            className="input"
                                        />

                                        <input
                                            type="number"
                                            value={variant.minQuantity || ""}
                                            onChange={(e) => {
                                                const updated = [...product.variants];
                                                updated[vIndex].minQuantity = e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            className="input"
                                        />

                                        <input
                                            type="number"
                                            value={variant.maxQuantity || ""}
                                            onChange={(e) => {
                                                const updated = [...product.variants];
                                                updated[vIndex].maxQuantity = e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            className="input"
                                        />

                                        <input
                                            type="number"
                                            value={variant.stepQuantity || ""}
                                            onChange={(e) => {
                                                const updated = [...product.variants];
                                                updated[vIndex].stepQuantity = e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            className="input"
                                        />

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const updated = [...product.variants];

                                                updated[vIndex].imageFile =
                                                    e.target.files[0];

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            className="input"
                                        />

                                    </div>

                                    {/* HERE PUT ALL VARIANT INPUTS */}
                                    {/* Model, Size, Unit, PackSize, Price,
                    StockQuantity, MinQuantity,
                    MaxQuantity, StepQuantity,
                    Variant Image */}

                                    {/* SPECIFICATIONS */}

                                    <div className="mt-8">

                                        <div className="flex justify-between items-center mb-5">

                                            <h4 className="text-lg font-semibold">
                                                Specifications
                                            </h4>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addSpecification(vIndex)
                                                }
                                                className="
                        bg-green-600
                        px-4
                        py-2
                        rounded-xl
                        text-white
                      "
                                            >
                                                + Add Specification
                                            </button>

                                        </div>

                                        {variant.specifications.map(
                                            (spec, sIndex) => (

                                                <div
                                                    key={sIndex}
                                                    className="
    grid
    md:grid-cols-3
    gap-4
    mb-4
  "
                                                >

                                                    <input
                                                        value={spec.key || ""}
                                                        placeholder="Specification"
                                                        onChange={(e) => {
                                                            const updated = [...product.variants];

                                                            updated[vIndex]
                                                                .specifications[sIndex]
                                                                .key = e.target.value;

                                                            setProduct({
                                                                ...product,
                                                                variants: updated
                                                            });
                                                        }}
                                                        className="input"
                                                    />

                                                    <input
                                                        value={spec.value || ""}
                                                        placeholder="Value"
                                                        onChange={(e) => {
                                                            const updated = [...product.variants];

                                                            updated[vIndex]
                                                                .specifications[sIndex]
                                                                .value = e.target.value;

                                                            setProduct({
                                                                ...product,
                                                                variants: updated
                                                            });
                                                        }}
                                                        className="input"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeSpecification(
                                                                vIndex,
                                                                sIndex
                                                            )
                                                        }
                                                        className="
      bg-red-500
      rounded-xl
      text-white
      px-4
    "
                                                    >
                                                        Remove
                                                    </button>

                                                </div>

                                            )
                                        )}

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                    {/* FOOTER */}

                    <div className="flex justify-end gap-4 mt-10">

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/product-management")
                            }
                            className="
              border
              border-slate-600
              px-8
              py-4
              rounded-2xl
            "
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="
              bg-gradient-to-r
              from-blue-600
              to-indigo-600
              px-8
              py-4
              rounded-2xl
              text-white
              font-semibold
            "
                        >
                            {
                                saving
                                    ? "Updating..."
                                    : "Update Product"
                            }
                        </button>

                    </div>

                </form>

            </div>

        </div>
    )
};
