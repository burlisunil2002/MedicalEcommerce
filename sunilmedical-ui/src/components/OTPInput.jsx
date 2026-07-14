import { useRef } from "react";

export default function OTPInput({
    value = "",
    setValue
}) {

    const inputs = useRef([]);

    //-----------------------------------------
    // Change
    //-----------------------------------------

    const handleChange = (e, index) => {

        const input = e.target.value.replace(/\D/g, "");

        const otp = value.padEnd(6, " ").split("");

        // Clear current box
        if (input === "") {

            otp[index] = "";

            setValue(otp.join("").trimEnd());

            return;
        }

        otp[index] = input[0];

        setValue(otp.join("").trimEnd());

        // Next Input
        if (index < 5) {

            inputs.current[index + 1]?.focus();

            inputs.current[index + 1]?.select();

        }

    };

    //-----------------------------------------
    // Keyboard
    //-----------------------------------------

    const handleKeyDown = (e, index) => {

        const otp = value.padEnd(6, " ").split("");

        switch (e.key) {

            case "Backspace":

                e.preventDefault();

                if (otp[index]) {

                    otp[index] = "";

                    setValue(otp.join("").trimEnd());

                }
                else if (index > 0) {

                    inputs.current[index - 1]?.focus();

                    otp[index - 1] = "";

                    setValue(otp.join("").trimEnd());

                }

                break;

            case "Delete":

                e.preventDefault();

                otp[index] = "";

                setValue(otp.join("").trimEnd());

                break;

            case "ArrowLeft":

                e.preventDefault();

                if (index > 0)
                    inputs.current[index - 1]?.focus();

                break;

            case "ArrowRight":

                e.preventDefault();

                if (index < 5)
                    inputs.current[index + 1]?.focus();

                break;

            default:

                break;
        }

    };

    //-----------------------------------------
    // Paste OTP
    //-----------------------------------------

    const handlePaste = (e) => {

        e.preventDefault();

        const pasted = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pasted) return;

        setValue(pasted);

        const lastIndex =
            Math.min(
                pasted.length - 1,
                5
            );

        inputs.current[lastIndex]?.focus();

    };

    //-----------------------------------------
    // Focus Select
    //-----------------------------------------

    const handleFocus = (e) => {

        e.target.select();

    };

    //-----------------------------------------

    return (

        <div className="w-full">

            <div
                className="
                    flex
                    justify-center
                    gap-2
                    sm:gap-3
                    md:gap-4
                    mt-5
                "
            >

                {

                    [...Array(6)].map((_, index) => (

                        <input

                            key={index}

                            ref={el => inputs.current[index] = el}

                            type="text"

                            inputMode="numeric"

                            autoComplete={
                                index === 0
                                    ? "one-time-code"
                                    : "off"
                            }

                            pattern="[0-9]*"

                            maxLength={1}

                            value={value[index] || ""}

                            onFocus={handleFocus}

                            onPaste={handlePaste}

                            onChange={(e) =>
                                handleChange(
                                    e,
                                    index
                                )
                            }

                            onKeyDown={(e) =>
                                handleKeyDown(
                                    e,
                                    index
                                )
                            }

                            className="
                                    w-11
                                    h-11

                                    sm:w-12
                                    sm:h-12

                                    md:w-14
                                    md:h-14

                                    lg:w-16
                                    lg:h-16

                                    rounded-xl
                                    md:rounded-2xl

                                    border-2
                                    border-gray-300

                                    bg-white

                                    text-center

                                    text-lg
                                    sm:text-xl
                                    md:text-2xl

                                    font-bold

                                    text-gray-800

                                    shadow-sm

                                    transition-all
                                    duration-300

                                    focus:border-pink-500
                                    focus:ring-4
                                    focus:ring-pink-100
                                    focus:shadow-lg

                                    hover:border-pink-300
                                    hover:shadow-md

                                    caret-transparent

                                    outline-none
                                "

                        />

                    ))

                }

            </div>

            {/* Helper Text */}

            <div className="mt-4 text-center">

                <p className="text-xs sm:text-sm text-gray-500">

                    Enter the 6-digit verification code

                </p>

            </div>

        </div>

    );

}