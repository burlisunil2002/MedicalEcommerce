import { createContext, useContext, useState } from "react";
import GlobalLoader from "../components/loader/GlobalLoader";

const LoaderContext = createContext();

export function LoaderProvider({ children }) {

    const [loader, setLoader] = useState({
        show: false,
        text: "Loading...",
        subText: "Please wait...",
        theme: "blue"
    });

    const showLoader = (
        text = "Loading...",
        subText = "Please wait...",
        theme = "blue"
    ) => {

        setLoader({
            show: true,
            text,
            subText,
            theme
        });

    };

    const hideLoader = () => {

        setLoader(prev => ({
            ...prev,
            show: false
        }));

    };

    return (

        <LoaderContext.Provider
            value={{
                showLoader,
                hideLoader
            }}
        >

            {children}

            <GlobalLoader
                show={loader.show}
                text={loader.text}
                subText={loader.subText}
                theme={loader.theme}
            />

        </LoaderContext.Provider>

    );
}

export const useLoader = () => useContext(LoaderContext);