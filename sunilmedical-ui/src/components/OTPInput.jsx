import { useRef } from "react";

export default function OTPInput({ value, setValue }) {
    const inputs = useRef([]);

    const handleChange = (e, index) => {
        const val = e.target.value.replace(/[^0-9]/g, "");
        if (!val) return;

        const newValue = value.split("");
        newValue[index] = val;
        const final = newValue.join("").slice(0, 6);

        setValue(final);

        // move to next
        if (index < 5) {
            inputs.current[index + 1].focus();
        }
    };

    const handleBackspace = (e, index) => {
        if (e.key === "Backspace") {
            if (!value[index] && index > 0) {
                inputs.current[index - 1].focus();
            }
        }
    };

    return (
        <div className="flex justify-between gap-2 mt-4">
            {[...Array(6)].map((_, i) => (
                <input
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    type="text"
                    maxLength={1}
                    value={value[i] || ""}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleBackspace(e, i)}
                    className="w-12 h-12 text-center text-xl font-bold border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition"
                />
            ))}
        </div>
    );
}