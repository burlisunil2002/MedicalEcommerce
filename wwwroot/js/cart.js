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
            __RequestVerificationToken: getToken()
        }
    });
}

// ================= GLOBAL AUTH HANDLER =================
$(document).ajaxError(function (event, xhr) {
    if (xhr.responseText && xhr.responseText.includes("<!DOCTYPE html>")) {
        window.location.href = "/Account/Login";
    }
});

$(document).ready(function () {

    loadCartCount();
    refreshCartSummary();

    // ================= ADD TO CART =================
    $(document).on("click", ".add-cart-btn", function () {

        const button = $(this);
        if (button.data("loading")) return;
        button.data("loading", true);

        const parent = button.closest(".cart-area");
        const productId = parent.data("id");

        if (!productId) {
            console.error("ProductId missing");
            button.data("loading", false);
            return;
        }

        button.prop("disabled", true).text("Adding...");

        postAjax("/Cart/AddToCart", { productId })
            .done(function (res) {

                if (!res.success) {
                    alert("Failed to add item");
                    return;
                }

                parent.find(".qty-controller")
                    .removeClass("hidden")
                    .addClass("flex");

                parent.find(".qty").text(1);
                button.hide();

                loadCartCount();
            })
            .fail(function () {
                alert("Network error. Try again.");
            })
            .always(function () {
                button.data("loading", false);
                button.prop("disabled", false).text("Add to Cart");
            });
    });

    // ================= PLUS =================
    $(document).on("click", ".plus", function () {

        const button = $(this);
        if (button.data("loading")) return;
        button.data("loading", true);

        const parent = button.closest(".cart-area");
        const qtySpan = parent.find(".qty");
        const productId = parent.data("id");

        postAjax("/Cart/UpdateQuantity", { productId, change: 1 })
            .done(function (res) {

                if (!res.success) {
                    alert(res.message || "Update failed");
                    return;
                }

                qtySpan.text(res.quantity);
                loadCartCount();
                refreshCartSummary();
            })
            .fail(function () {
                alert("Network error");
            })
            .always(function () {
                button.data("loading", false);
            });
    });

    // ================= MINUS =================
    $(document).on("click", ".minus", function () {

        const button = $(this);
        if (button.data("loading")) return;
        button.data("loading", true);

        const parent = button.closest(".cart-area");
        const qtySpan = parent.find(".qty");
        const productId = parent.data("id");

        if (!productId) {
            console.error("Invalid productId");
            button.data("loading", false);
            return;
        }

        let qty = parseInt(qtySpan.text()) || 1;

        if (qty > 1) {

            postAjax("/Cart/UpdateQuantity", { productId, change: -1 })
                .done(function (res) {

                    if (!res.success) {
                        alert(res.message || "Update failed");
                        return;
                    }

                    if (res.quantity <= 0) {
                        parent.remove();
                    } else {
                        qtySpan.text(res.quantity);
                    }

                    loadCartCount();
                    refreshCartSummary();
                })
                .fail(function () {
                    alert("Network error");
                })
                .always(function () {
                    button.data("loading", false);
                });

        } else {

            postAjax("/Cart/Remove", { productId })
                .done(function (res) {

                    if (!res.success) {
                        alert("Remove failed");
                        return;
                    }

                    parent.remove();
                    loadCartCount();
                    refreshCartSummary();
                })
                .always(function () {
                    button.data("loading", false);
                });
        }
    });

    // ================= DELETE =================
    $(document).on("click", ".delete-btn", function () {

        const parent = $(this).closest(".cart-area");
        const productId = parent.data("id");

        if (!confirm("Remove this item from cart?")) return;

        postAjax("/Cart/Remove", { productId })
            .done(function (res) {

                if (!res.success) {
                    alert("Delete failed");
                    return;
                }

                parent.fadeOut(300, function () {
                    $(this).remove();
                    loadCartCount();
                    refreshCartSummary();
                });
            })
            .fail(function () {
                alert("Failed to remove item");
            });
    });
});

// ================= CART SUMMARY =================
function refreshCartSummary() {

    $.get("/Cart/GetCartSummary")
        .done(function (data) {

            $("#subtotal").text("₹ " + data.subtotal.toFixed(2));
            $("#gsttotal").text("₹ " + data.gst.toFixed(2));
            $("#saved").text("₹ " + data.discount.toFixed(2));
            $("#couponAmount").text("- ₹ " + data.coupon.toFixed(2));

            $("#delivery").text(data.delivery === 0 ? "FREE" : "₹ " + data.delivery);
            $("#grandtotal").text("₹ " + data.total.toFixed(2));

            let remaining = 20 - data.subtotal;

            $("#deliveryMsg").text(
                remaining > 0
                    ? `Add ₹ ${remaining.toFixed(2)} more for FREE delivery`
                    : "🎉 Free delivery unlocked!"
            );

            let percent = Math.min((data.subtotal / 20) * 100, 100);
            $("#deliveryBar").css("width", percent + "%");
        })
        .fail(function () {
            console.error("Summary load failed");
        });
}

// ================= CART COUNT =================
function loadCartCount() {

    $.get("/Cart/GetCartCount")
        .done(function (data) {
            $("#cartCount").text(data);
        })
        .fail(function () {
            console.error("Cart count failed");
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
        code,
        __RequestVerificationToken: getToken()
    })
        .done(function (res) {

            if (!res.success) return;

            $("#couponMsg")
                .text("🎉 Coupon applied successfully!")
                .removeClass("text-red-500")
                .addClass("text-green-600");

            $("#applyCoupon")
                .removeClass("from-blue-500 to-indigo-600")
                .addClass("from-green-500 to-emerald-600");

            refreshCartSummary();
        });
});