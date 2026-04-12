let isProcessing = false;

// ================= TOKEN =================
function getToken() {
    return $('input[name="__RequestVerificationToken"]').first().val() || "";
}

// ================= COMMON AJAX =================
function postAjax(url, data) {
    return $.ajax({
        url: url,
        type: "POST",
        data: {
            ...data,
            __RequestVerificationToken: getToken() // ✅ send in body
        }
    });
}

$(document).ready(function () {

    loadCartCount();
    refreshCartSummary();

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

        button.prop("disabled", true).text("Adding...");

        postAjax("/Cart/AddToCart", { productId: productId })
            .done(function () {

                // ✅ UI update AFTER success (no blinking)
                parent.find(".qty-controller")
                    .removeClass("hidden")
                    .addClass("flex");

                parent.find(".qty").text(1);
                button.hide();

                loadCartCount();
            })
            .fail(function (err) {
                console.error("AddToCart error:", err.responseText);
                alert("Failed to add item");
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
        const productId = parent.data("id");

        postAjax("/Cart/UpdateQuantity", {
            productId: productId,
            change: 1
        })
            .done(function () {

                let qty = parseInt(qtySpan.text()) || 0;
                qtySpan.text(qty + 1);

                loadCartCount();

                if (window.location.pathname.includes("Cart")) {
                    refreshCartSummary();
                }
            })
            .fail(function (err) {
                console.error("Plus error:", err.responseText);
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
        const productId = parent.data("id");

        let qty = parseInt(qtySpan.text()) || 1;

        if (qty > 1) {

            postAjax("/Cart/UpdateQuantity", {
                productId: productId,
                change: -1
            })
                .done(function () {

                    qtySpan.text(qty - 1);
                    loadCartCount();

                    if (window.location.pathname.includes("Cart")) {
                        refreshCartSummary();
                    }
                })
                .fail(function (err) {
                    console.error("Minus error:", err.responseText);
                })
                .always(function () {
                    isProcessing = false;
                });

        } else {

            // REMOVE when qty = 1
            postAjax("/Cart/Remove", { productId: productId })
                .done(function () {

                    parent.find(".qty-controller")
                        .addClass("hidden")
                        .removeClass("flex");

                    parent.find(".add-cart-btn").show();

                    loadCartCount();

                    if (window.location.pathname.includes("Cart")) {
                        refreshCartSummary();
                    }
                })
                .fail(function (err) {
                    console.error("Remove error:", err.responseText);
                })
                .always(function () {
                    isProcessing = false;
                });
        }
    });


    // ================= DELETE =================
    $(document).on("click", ".delete-btn", function () {

        const parent = $(this).closest(".cart-area");
        const productId = parent.data("id");

        if (!confirm("Remove this item from cart?")) return;

        postAjax("/Cart/Remove", { productId: productId })
            .done(function () {

                parent.css({
                    transform: "scale(0.9)",
                    opacity: "0",
                    transition: "0.3s"
                });

                setTimeout(() => {
                    parent.remove();
                    loadCartCount();
                    refreshCartSummary();

                    if (window.location.pathname.includes("Cart")) {
                        refreshCartSummary();
                    }
                }, 300);
            })
            .fail(function () {
                alert("Failed to remove item");
            });
    });

});

// ================= LIVE SUMMARY =================
function refreshCartSummary() {

    $.get("/Cart/GetCartSummary")
        .done(function (data) {

            $("#subtotal").text("₹ " + data.subtotal.toFixed(2));
            $("#gsttotal").text("₹ " + data.gst.toFixed(2));
            $("#saved").text("₹ " + data.discount.toFixed(2));

            $("#couponAmount").text("- ₹ " + data.coupon.toFixed(2)); // 🔥 NEW

            $("#delivery").text(data.delivery === 0 ? "FREE" : "₹ 5");
            $("#grandtotal").text("₹ " + data.total.toFixed(2));

            // delivery animation
            let remaining = 20 - data.subtotal;

            if (remaining > 0) {
                $("#deliveryMsg").text(`Add ₹ ${remaining.toFixed(2)} more for FREE delivery`);
            } else {
                $("#deliveryMsg").text("🎉 Free delivery unlocked!");
            }

            let percent = Math.min((data.subtotal / 20) * 100, 100);
            $("#deliveryBar").css("width", percent + "%");
        });
}

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

// ================= APPLY COUPON =================
$(document).on("click", "#applyCoupon", function () {

    const code = $("#couponSelect").val();

    if (!code) {
        $("#couponMsg").text("Please select an offer").css("color", "orange");
        return;
    }

    $.post("/Cart/ApplyCoupon", {
        code: code,
        __RequestVerificationToken: getToken()
    })
        .done(function (res) {

            if (res.success) {

                $("#couponMsg")
                    .text("🎉 Coupon applied successfully!")
                    .removeClass("text-red-500")
                    .addClass("text-green-600");

                // 🔥 BUTTON COLOR CHANGE
                $("#applyCoupon")
                    .removeClass("from-blue-500 to-indigo-600")
                    .addClass("from-green-500 to-emerald-600");

                // 🔥 REFRESH TOTALS
                refreshCartSummary();
            }
        });
});