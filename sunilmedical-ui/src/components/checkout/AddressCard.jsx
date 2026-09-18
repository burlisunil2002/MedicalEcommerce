import React, {
    memo,
    useCallback
} from "react";

import {
    FaCheckCircle,
    FaEdit,
    FaHome,
    FaBuilding,
    FaMapMarkerAlt
} from "react-icons/fa";


const ADDRESS_ICONS = {
    Office: FaBuilding,
    Other: FaMapMarkerAlt,
    Home: FaHome
};


const ADDRESS_ICON_COLORS = {
    Office: "text-blue-600 bg-blue-50",
    Other: "text-purple-600 bg-purple-50",
    Home: "text-emerald-600 bg-emerald-50"
};


const AddressCard = memo(
    function AddressCard({
        address,
        selected = false,
        onSelect,
        onEdit
    }) {

        const type =
            address?.addressType ||
            "Home";


        const Icon =
            ADDRESS_ICONS[type] ||
            FaHome;


        const iconStyle =
            ADDRESS_ICON_COLORS[type] ||
            ADDRESS_ICON_COLORS.Home;


        const handleSelect =
            useCallback(() => {

                if (
                    onSelect &&
                    address
                ) {
                    onSelect(address);
                }

            }, [
                onSelect,
                address
            ]);


        const handleEdit =
            useCallback(
                event => {

                    event.stopPropagation();

                    if (
                        onEdit &&
                        address
                    ) {
                        onEdit(address);
                    }

                },
                [
                    onEdit,
                    address
                ]
            );


        return (
            <article
                className={`
                    relative
                    w-full
                    rounded-2xl
                    border-2
                    bg-white
                    transition-all
                    duration-200
                    ${
                        selected
                            ? `
                                border-emerald-500
                                bg-emerald-50/40
                                shadow-sm
                              `
                            : `
                                border-gray-200
                                hover:border-emerald-300
                                hover:shadow-sm
                              `
                    }
                `}
            >

                {/* =================================================
                    SELECT BUTTON
                ================================================= */}

                <button
                    type="button"
                    onClick={
                        handleSelect
                    }
                    aria-pressed={
                        selected
                    }
                    className="
                        w-full
                        cursor-pointer
                        text-left
                        focus:outline-none
                        focus:ring-2
                        focus:ring-emerald-500
                        focus:ring-inset
                        rounded-2xl
                        p-4
                        sm:p-5
                    "
                >

                    <div
                        className="
                            flex
                            items-start
                            gap-3
                            sm:gap-4
                            pr-8
                        "
                    >

                        {/* ICON */}

                        <div
                            className={`
                                flex
                                h-11
                                w-11
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                ${iconStyle}
                            `}
                            aria-hidden="true"
                        >
                            <Icon
                                className="
                                    text-base
                                "
                            />
                        </div>


                        {/* DETAILS */}

                        <div
                            className="
                                min-w-0
                                flex-1
                            "
                        >

                            <div
                                className="
                                    flex
                                    flex-wrap
                                    items-center
                                    gap-2
                                "
                            >

                                <h3
                                    className="
                                        text-base
                                        font-bold
                                        text-gray-900
                                        break-words
                                    "
                                >
                                    {address?.fullName ||
                                        "Customer"}
                                </h3>


                                <span
                                    className={`
                                        rounded-full
                                        px-2.5
                                        py-1
                                        text-[10px]
                                        font-bold
                                        uppercase
                                        tracking-wide
                                        ${
                                            selected
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-gray-100 text-gray-600"
                                        }
                                    `}
                                >
                                    {type}
                                </span>

                            </div>


                            {/* ADDRESS */}

                            <div
                                className="
                                    mt-3
                                    space-y-1
                                    text-sm
                                    leading-5
                                    text-gray-600
                                "
                            >

                                {address?.addressLine1 && (
                                    <p className="break-words">
                                        {address.addressLine1}
                                    </p>
                                )}

                                {address?.addressLine2 && (
                                    <p className="break-words">
                                        {address.addressLine2}
                                    </p>
                                )}

                                {address?.landmark && (
                                    <p
                                        className="
                                            text-xs
                                            text-gray-500
                                        "
                                    >
                                        <span className="font-semibold">
                                            Landmark:
                                        </span>{" "}
                                        {address.landmark}
                                    </p>
                                )}

                                {(address?.city ||
                                    address?.state ||
                                    address?.pincode) && (

                                    <p className="break-words">

                                        {address?.city}

                                        {address?.city &&
                                        address?.state
                                            ? ", "
                                            : ""}

                                        {address?.state}

                                        {address?.pincode
                                            ? ` - ${address.pincode}`
                                            : ""}

                                    </p>
                                )}

                                {address?.mobileNumber && (
                                    <p
                                        className="
                                            pt-1
                                            font-medium
                                            text-gray-800
                                        "
                                    >
                                        📞{" "}
                                        {address.mobileNumber}
                                    </p>
                                )}

                            </div>

                        </div>

                    </div>


                    {/* SELECT INDICATOR */}

                    <div
                        className="
                            absolute
                            right-4
                            top-4
                        "
                    >

                        {selected ? (

                            <FaCheckCircle
                                className="
                                    text-xl
                                    text-emerald-600
                                "
                                aria-label="Selected address"
                            />

                        ) : (

                            <span
                                className="
                                    block
                                    h-5
                                    w-5
                                    rounded-full
                                    border-2
                                    border-gray-300
                                "
                                aria-hidden="true"
                            />

                        )}

                    </div>

                </button>


                {/* =================================================
                    EDIT
                ================================================= */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        border-t
                        border-gray-100
                        px-4
                        py-2
                        sm:px-5
                    "
                >

                    <span
                        className="
                            text-[11px]
                            text-gray-400
                        "
                    >
                        {selected
                            ? "Selected for delivery"
                            : "Click address to select"}
                    </span>


                    <button
                        type="button"
                        onClick={
                            handleEdit
                        }
                        className="
                            inline-flex
                            min-h-9
                            items-center
                            gap-1.5
                            rounded-lg
                            px-3
                            py-1.5
                            text-sm
                            font-semibold
                            text-emerald-600
                            transition
                            hover:bg-emerald-50
                            hover:text-emerald-700
                            focus:outline-none
                            focus:ring-2
                            focus:ring-emerald-500
                            focus:ring-offset-1
                        "
                        aria-label={`Edit address for ${
                            address?.fullName ||
                            "customer"
                        }`}
                    >

                        <FaEdit
                            aria-hidden="true"
                        />

                        Edit

                    </button>

                </div>

            </article>
        );
    }
);


export default AddressCard;