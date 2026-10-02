import { Helmet } from "react-helmet-async";

const SITE_NAME = "The Make In India";
const SITE_URL = "https://sunilmedicalproducts.online";

export default function SEO({
    title,
    description,
    canonical,
    image,
    type = "website",
    noindex = false
}) {
    const finalTitle = title
        ? `${ title} | ${ SITE_NAME}`
        : `${ SITE_NAME} | Medical Products & Healthcare Supplies`;

    const finalDescription =
        description ||
        "The Make In India is an online platform for medical products, healthcare supplies, diagnostic equipment, hospital essentials and medical equipment.";

    const finalCanonical =
        canonical || SITE_URL;

    return (
        < Helmet >

            {/* =========================
                BASIC SEO
            ========================== */
    }

            < title >{ finalTitle}</ title >

            < meta
                name = "description"
                content ={ finalDescription}
            />

            < meta
                name = "robots"
                content ={
        noindex
            ? "noindex, nofollow"
            : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
                }
            />

            {/* =========================
                CANONICAL
            ========================== */
    }

            < link
                rel = "canonical"
                href ={ finalCanonical}
            />

            {/* =========================
                OPEN GRAPH
            ========================== */
    }

            < meta
                property = "og:type"
                content ={ type}
            />

            < meta
                property = "og:site_name"
                content ={ SITE_NAME}
            />

            < meta
                property = "og:title"
                content ={ finalTitle}
            />

            < meta
                property = "og:description"
                content ={ finalDescription}
            />

            < meta
                property = "og:url"
                content ={ finalCanonical}
            />

            {
        image && (
                <>
                    < meta
                        property = "og:image"
                        content ={ image}
                    />

                    < meta
                        property = "og:image:alt"
                        content ={ finalTitle}
                    />
                </>
            )}

    {/* =========================
                TWITTER / X
            ========================== */
    }

            < meta
                name = "twitter:card"
                content = "summary_large_image"
            />

            < meta
                name = "twitter:title"
                content ={ finalTitle}
            />

            < meta
                name = "twitter:description"
                content ={ finalDescription}
            />

            {
        image && (
                < meta
                    name = "twitter:image"
                    content ={ image}
                />
            )}

        </ Helmet >
    );
}