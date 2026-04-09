let isProcessing = false;

// 🔐 TOKEN (SAFE)
function getToken() {
    const token = $('input[name="__RequestVerificationToken"]').val();
    if (!token) {
        console.warn("Token not found");
    }
    return token;
}

$(document).ready(function () {

    loadCartCount();
    loadCartUI();

    // ================= ADD TO CART =================
    $(document).on("click", ".add-cart-btn", function () {

        if (isProcessing) return;
        isProcessing = true;

        const parent = $(this).closest(".cart-area");
        const productId = parent.data("id");
        const button = $(this);

        if (!productId) {
            console.error("ProductId missing");
            isProcessing = false;
            return;
        }

        // UI IMMEDIATE UPDATE (no flicker)
        parent.find(".qty-controller").removeClass("hidden").addClass("flex");
        button.hide();

        button.prop("disabled", true).text("Adding...");

        $.post("/Cart/AddToCart", {
            productId: productId,
            __RequestVerificationToken: getToken()
        })
            .done(function () {
                loadCartCount();
            })
            .fail(function (err) {
                console.error("AddToCart error:", err.responseText);

                // ❌ rollback UI if failed
                parent.find(".qty-controller").addClass("hidden").removeClass("flex");
                button.show();
            })
            .always(function () {
                isProcessing = false;
                button.prop("disabled", false).text("Add to Cart");
            });
    });


    // ================= PLUS =================
    $(document).on("click", ".plus", function () {

        if (isProcessing) return;
        isProcessing = true;

        const parent = $(this).closest(".cart-area");
        const qtySpan = parent.find(".qty");

        let qty = parseInt(qtySpan.text()) || 0;
        qty++;
        qtySpan.text(qty);

        const productId = parent.data("id");

        $.post("/Cart/AddToCart", {
            productId: productId,
            __RequestVerificationToken: getToken()
        })
            .done(loadCartCount)
            .fail(function (err) {
                console.error("Plus error:", err.responseText);
                qtySpan.text(qty - 1); // rollback
            })
            .always(function () {
                isProcessing = false;
            });
    });


    // ================= MINUS =================
    $(document).on("click", ".minus", function () {

        if (isProcessing) return;
        isProcessing = true;

        const parent = $(this).closest(".cart-area");
        const qtySpan = parent.find(".qty");

        let qty = parseInt(qtySpan.text()) || 1;
        const productId = parent.data("id");

        if (qty > 1) {

            qty--;
            qtySpan.text(qty);

            $.post("/Cart/DecreaseQuantity", {
                productId: productId,
                __RequestVerificationToken: getToken()
            })
                .done(loadCartCount)
                .fail(function (err) {
                    console.error("Decrease error:", err.responseText);
                    qtySpan.text(qty + 1); // rollback
                })
                .always(function () {
                    isProcessing = false;
                });

        } else {

            $.post("/Cart/Remove", {
                productId: productId,
                __RequestVerificationToken: getToken()
            })
                .done(function () {

                    parent.find(".qty-controller")
                        .addClass("hidden")
                        .removeClass("flex");

                    parent.find(".add-cart-btn").show();

                    loadCartCount();
                })
                .fail(function (err) {
                    console.error("Remove error:", err.responseText);
                })
                .always(function () {
                    isProcessing = false;
                });
        }
    });

});


// ================= CART COUNT =================
function loadCartCount() {
    $.get("/Cart/GetCartCount")
        .done(function (data) {
            $("#cartCount").text(data);
        })
        .fail(function (err) {
            console.error("Count error:", err.responseText);
        });
}


// ================= CART UI =================
function loadCartUI() {
    $.get("/Cart/GetCartItems")
        .done(function (items) {

            if (!items || items.length === 0) return;

            items.forEach(item => {

                const parent = $('.cart-area[data-id="' + item.productId + '"]');

                if (parent.length) {
                    parent.find(".add-cart-btn").hide();

                    parent.find(".qty-controller")
                        .removeClass("hidden")
                        .addClass("flex");

                    parent.find(".qty").text(item.quantity);
                }
            });

        })
        .fail(function (err) {
            console.error("Cart UI error:", err.responseText);
        });
}