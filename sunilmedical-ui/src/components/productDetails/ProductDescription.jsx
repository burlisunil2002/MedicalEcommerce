import { FileText } from "lucide-react";

export default function ProductDescription({
    product
}) {
    const description =
        product?.description?.trim();

    if (!description) {
        return null;
    }

    return (
        <article className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
        ">
            <div className="
                flex
                items-center
                gap-3
                border-b
                border-slate-100
                bg-gradient-to-r
                from-indigo-50
                to-white
                px-5
                sm:px-6
                py-4
            ">
                <div className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    bg-indigo-100
                    text-indigo-600
                ">
                    <FileText size={17} />
                </div>

                <div>
                    <p className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-widest
                        text-indigo-500
                    ">
                        Product information
                    </p>

                    <h2 className="
                        text-base
                        sm:text-lg
                        font-bold
                        text-slate-900
                    ">
                        Product Description
                    </h2>
                </div>
            </div>

            <div className="
                px-5
                sm:px-6
                py-5
                sm:py-6
            ">
                <p className="
                    whitespace-pre-line
                    text-sm
                    leading-7
                    text-slate-600
                ">
                    {description}
                </p>
            </div>
        </article>
    );
}