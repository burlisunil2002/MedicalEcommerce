// ❤️ TOGGLE WISHLIST (Product Page)
$(document).on("click", ".wishlist-btn", function () {

    const btn = $(this);
    const icon = btn.find("i");
    const productId = btn.data("id");

    console.log("ProductId:", productId);

    if (!productId) {
        alert("Product ID missing");
        return;
    }

    postAjax("/Wishlist/Toggle", { productId: productId })
        .done(function (res) {

            console.log("Response:", res);

            if (res.added) {
                icon.removeClass("fa-regular")
                    .addClass("fa-solid text-red-500");
            } else {
                icon.removeClass("fa-solid text-red-500")
                    .addClass("fa-regular");
            }

            loadWishlistCount();
        })
        .fail(function (err) {
            console.error(err);
            alert("Wishlist error");
        });
});


// REMOVE WITH ANIMATION
$(document).on("click", ".remove-wishlist", function () {

    const card = $(this).closest(".wishlist-card");
    const id = $(this).data("id");

    postAjax("/Wishlist/Toggle", { productId: id })
        .done(function () {

            card.addClass("removing");

            setTimeout(() => {
                card.remove();
                checkEmpty();
            }, 300);

            loadWishlistCount();
        });
});


// EMPTY STATE CHECK
function checkEmpty() {
    if ($("#wishlistContainer").children().length === 0) {
        $("#emptyWishlist").removeClass("hidden");
    }
}

// RUN ON LOAD
$(document).ready(function () {
    checkEmpty();
});

// ❤️ LOAD COUNT
$(document).ready(function () {
    loadWishlistCount();
});

function loadWishlistCount() {
    $.get("/Wishlist/Count", function (count) {

        $("#wishlistCount").text(count);

        const icon = $("#wishlistIcon");

        if (count > 0) {
            icon.removeClass("fa-regular")
                .addClass("fa-solid text-red-500");
        } else {
            icon.removeClass("fa-solid text-red-500")
                .addClass("fa-regular text-gray-700");
        }
    });
}

function postAjax(url, data) {

    const token = $('input[name="__RequestVerificationToken"]').val();

    return $.ajax({
        url: url,
        type: "POST",
        data: data, // ✅ NOT JSON
        headers: {
            "RequestVerificationToken": token
        }
    });
}

$(document).on("click", ".move-cart", function () {

    const id = $(this).data("id");

    console.log("Sending productId:", id);

    if (!id) {
        alert("Product ID missing");
        return;
    }

    postAjax("/Cart/AddToCart", { productId: id })
        .done(function (res) {

            console.log("Success:", res);

            if (res.success) {

                postAjax("/Wishlist/Toggle", { productId: id });

                window.location.href = "/Cart";
            }
        })
        .fail(function (err) {
            console.error("ERROR:", err.responseText);
            alert("Failed to move to cart");
        });
});