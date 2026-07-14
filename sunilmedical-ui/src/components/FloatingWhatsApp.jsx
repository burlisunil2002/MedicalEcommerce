import { FaWhatsapp } from "react-icons/fa";

export default function FloatingWhatsApp() {

    const phone = "919014060858"; // Replace with your number

    const message =
        encodeURIComponent(
            "Hello, I need assistance with my order."
        );

    return (

        <>

            {/* Pulse Ring */}

            <div
                className="
fixed
bottom-6
right-6
z-[9999]
hidden
sm:block
"
            >

                <span
                    className="
absolute
inline-flex
h-16
w-16
rounded-full
bg-green-400
opacity-40
animate-ping
"
                />

                <a
                    href={`https://wa.me/${phone}?text=${message}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
relative
flex
items-center
justify-center
w-16
h-16
rounded-full
bg-[#25D366]
text-white
shadow-2xl
hover:scale-110
transition-all
duration-300
group
"
                >

                    <FaWhatsapp size={34} />

                    {/* Tooltip */}

                    <div
                        className="
absolute
right-20
whitespace-nowrap
bg-white
text-gray-800
text-sm
px-4
py-2
rounded-xl
shadow-xl
opacity-0
group-hover:opacity-100
transition
"
                    >

                        Need Help?
                        <br />
                        Chat with us

                    </div>

                </a>

            </div>

            {/* Mobile */}

            <a
                href={`https://wa.me/${phone}?text=${message}`}
                target="_blank"
                rel="noopener noreferrer"
                className="
sm:hidden

fixed
bottom-5
right-5

z-[9999]

flex
items-center
justify-center

w-14
h-14

rounded-full

bg-[#25D366]

text-white

shadow-xl

active:scale-95
transition
"
            >

                <FaWhatsapp size={30} />

            </a>

        </>

    );

}