// ================= BASE URL =================
const BASE = typeof BASE_URL !== "undefined" ? BASE_URL : "/";

// ================= TOKEN =================
function getToken() {
    return $('input[name="__RequestVerificationToken"]').first().val() || "";
}

// ================= COMMON AJAX =================
function postAjax(url, data) {
    return $.ajax({
        url: BASE + url,
        type: "POST",
        data: {
            ...data,
            __RequestVerificationToken: getToken()
        }
    });
}

// ================= GLOBAL AUTH =================
$(document).ajaxError(function (event, xhr) {
    if (xhr.responseText && xhr.responseText.includes("<!DOCTYPE html>")) {
        window.location.href = BASE + "Account/Login";
    }
});

$(document).ready(function () {

    loadCartCount();
    refreshCartSummary();

    // ================= ADD =================
    $(document).on("click", ".add-cart-btn", function () {

        const btn = $(this);
        if (btn.data("loading")) return;
        btn.data("loading", true);

        const parent = btn.closest(".cart-area");
        const productId = parent.data("id");

        btn.prop("disabled", true).text("Adding...");

        postAjax("Cart/AddToCart", { productId })
            .done(function (res) {

                if (!res.success) {
                    alert("Add failed");
                    return;
                }

                parent.find(".qty-controller").removeClass("hidden").addClass("flex");
                parent.find(".qty").text(1);
                btn.hide();

                loadCartCount();
            })
            .always(() => {
                btn.data("loading", false);
                btn.prop("disabled", false).text("Add to Cart");
            });
    });

    // ================= PLUS =================
    $(document).on("click", ".plus", function () {

        const btn = $(this);
        if (btn.data("loading")) return;
        btn.data("loading", true);

        const parent = btn.closest(".cart-area");
        const qtySpan = parent.find(".qty");
        const productId = parent.data("id");

        postAjax("Cart/UpdateQuantity", { productId, change: 1 })
            .done(function (res) {

                if (!res.success) {
                    alert(res.message);
                    return;
                }

                qtySpan.text(res.quantity);
                loadCartCount();
                refreshCartSummary();
            })
            .always(() => btn.data("loading", false));
    });

    // ================= MINUS =================
    $(document).on("click", ".minus", function () {

        const btn = $(this);
        if (btn.data("loading")) return;
        btn.data("loading", true);

        const parent = btn.closest(".cart-area");
        const qtySpan = parent.find(".qty");
        const productId = parent.data("id");

        let qty = parseInt(qtySpan.text()) || 1;

        if (qty > 1) {

            postAjax("Cart/UpdateQuantity", { productId, change: -1 })
                .done(function (res) {

                    if (!res.success) {
                        alert(res.message);
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
                .always(() => btn.data("loading", false));

        } else {

            postAjax("Cart/Remove", { productId })
                .done(function (res) {

                    if (!res.success) {
                        alert("Remove failed");
                        return;
                    }

                    parent.remove();
                    loadCartCount();
                    refreshCartSummary();
                })
                .always(() => btn.data("loading", false));
        }
    });

    // ================= DELETE =================
    $(document).on("click", ".delete-btn", function () {

        const parent = $(this).closest(".cart-area");
        const productId = parent.data("id");

        if (!confirm("Remove item?")) return;

        postAjax("Cart/Remove", { productId })
            .done(function (res) {

                if (!res.success) {
                    alert("Delete failed");
                    return;
                }

                parent.fadeOut(200, function () {
                    $(this).remove();
                    loadCartCount();
                    refreshCartSummary();
                });
            });
    });

    // ================= COUPON =================
    $(document).on("click", "#applyCoupon", function () {

        const code = $("#couponSelect").val();

        if (!code) {
            $("#couponMsg").text("Select offer").css("color", "orange");
            return;
        }

        postAjax("Cart/ApplyCoupon", { code })
            .done(function (res) {

                if (!res.success) {
                    $("#couponMsg").text(res.message).css("color", "red");
                    return;
                }

                $("#couponMsg").text("Coupon applied 🎉").css("color", "green");
                refreshCartSummary();
            });
    });

});

// ================= SUMMARY =================
function refreshCartSummary() {
    $.get(BASE + "Cart/GetCartSummary")
        .done(function (d) {

            $("#subtotal").text("₹ " + d.subtotal.toFixed(2));
            $("#gsttotal").text("₹ " + d.gst.toFixed(2));
            $("#saved").text("₹ " + d.discount.toFixed(2));
            $("#couponAmount").text("- ₹ " + d.coupon.toFixed(2));
            $("#delivery").text(d.delivery === 0 ? "FREE" : "₹ " + d.delivery);
            $("#grandtotal").text("₹ " + d.total.toFixed(2));
        });
}

// ================= COUNT =================
function loadCartCount() {
    $.get(BASE + "Cart/GetCartCount")
        .done(c => $("#cartCount").text(c));
}