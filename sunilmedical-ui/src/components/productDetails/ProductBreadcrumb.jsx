import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProductBreadcrumb({

    category,

    productName

}) {

    return (

        <nav
            className="
                flex
                items-center
                flex-wrap
                gap-2
                text-sm
                text-gray-500
                mb-6
            "
        >

            <Link
                to="/"
                className="
                    flex
                    items-center
                    gap-1
                    hover:text-blue-600
                    transition
                "
            >

                <Home size={16} />

                Home

            </Link>

            <ChevronRight size={16} />

            <Link
                to={`/category/${category}`}
                className="
                    hover:text-blue-600
                    transition
                "
            >

                {category}

            </Link>

            <ChevronRight size={16} />

            <span
                className="
                    text-gray-900
                    font-semibold
                    truncate
                    max-w-[250px]
                "
            >

                {productName}

            </span>

        </nav>

    );

}