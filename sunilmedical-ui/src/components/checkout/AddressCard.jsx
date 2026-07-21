import { FaCheckCircle, FaEdit, FaHome, FaBuilding, FaMapMarkerAlt } from "react-icons/fa";

export default function AddressCard({
    address,
    selected,
    onSelect,
    onEdit
}) {

    const getAddressIcon = () => {

        switch (address.addressType) {

            case "Office":
                return <FaBuilding className="text-blue-600 text-lg" />;

            case "Other":
                return <FaMapMarkerAlt className="text-purple-600 text-lg" />;

            default:
                return <FaHome className="text-emerald-600 text-lg" />;

        }

    };

    return (

        <div
            onClick={onSelect}
            className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300 hover:shadow-lg
            ${selected
                    ? "border-emerald-500 bg-emerald-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-emerald-300"
                }`}
        >

            {/* Selected Badge */}

            {selected && (

                <div className="absolute top-4 right-4">

                    <FaCheckCircle className="text-emerald-600 text-2xl" />

                </div>

            )}

            <div className="flex justify-between gap-4">

                <div className="flex gap-4 flex-1">

                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">

                        {getAddressIcon()}

                    </div>

                    <div className="flex-1">

                        <div className="flex items-center gap-3 flex-wrap">

                            <h3 className="font-bold text-lg text-gray-800">

                                {address.fullName}

                            </h3>

                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">

                                {address.addressType || "Home"}

                            </span>

                        </div>

                        <p className="text-gray-700 mt-3">

                            {address.addressLine1}

                        </p>

                        {address.addressLine2 && (

                            <p className="text-gray-700">

                                {address.addressLine2}

                            </p>

                        )}

                        {address.landmark && (

                            <p className="text-gray-500 text-sm mt-1">

                                Landmark :
                                <span className="font-medium">

                                    {" "}
                                    {address.landmark}

                                </span>

                            </p>

                        )}

                        <p className="text-gray-700 mt-2">

                            {address.city}, {address.state} - {address.pincode}

                        </p>

                        <p className="text-gray-700 font-medium mt-2">

                            📞 {address.mobileNumber}

                        </p>

                    </div>

                </div>

                <div>

                    <button
                        onClick={(e) => {

                            e.stopPropagation();

                            onEdit(address);

                        }}
                        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold transition"
                    >

                        <FaEdit />

                        Edit

                    </button>

                </div>

            </div>

        </div>

    );

}