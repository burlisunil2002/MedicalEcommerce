using Microsoft.AspNetCore.Mvc;
using VivekMedicalProducts.Interfaces;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Controllers
{
    [ApiController]
    [Route("api/checkout")]
    public class CheckoutController : ControllerBase
    {
        private readonly ICheckoutService _checkoutService;
        private readonly ILogger<CheckoutController> _logger;

        public CheckoutController(
            ICheckoutService checkoutService,
            ILogger<CheckoutController> logger)
        {
            _checkoutService = checkoutService;
            _logger = logger;
        }

        // ================= GET CHECKOUT =================

        [HttpGet]
        public async Task<IActionResult> GetCheckout(CancellationToken ct)
        {
            try
            {
                var result = await _checkoutService.GetCheckoutAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return HandleError(ex, "GetCheckout");
            }
        }

        // ================= ADD ADDRESS =================

        [HttpPost("address")]
        public async Task<IActionResult> AddAddress(
            [FromBody] UserAddress model,
            CancellationToken ct)
        {
            try
            {
                var result = await _checkoutService.AddAddressAsync(model);

                return Ok(new
                {
                    success = true,
                    address = result
                });
            }
            catch (Exception ex)
            {
                return HandleError(ex, "AddAddress");
            }
        }

        // ================= UPDATE ADDRESS =================

        [HttpPut("address/{id}")]
        public async Task<IActionResult> UpdateAddress(
            int id,
            [FromBody] UserAddress model,
            CancellationToken ct)
        {
            try
            {
                var result = await _checkoutService.UpdateAddressAsync(id, model);

                return Ok(new
                {
                    success = true,
                    address = result
                });
            }
            catch (Exception ex)
            {
                return HandleError(ex, "UpdateAddress");
            }
        }

        // ================= SELECT ADDRESS =================

        [HttpPost("select-address/{id}")]
        public async Task<IActionResult> SelectAddress(int id, CancellationToken ct)
        {
            try
            {
                await _checkoutService.SaveSelectedAddressAsync(id);

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return HandleError(ex, "SelectAddress");
            }
        }

        // ================= APPLY COUPON =================

        [HttpPost("apply-coupon")]
        public async Task<IActionResult> ApplyCoupon(
            [FromBody] ApplyCouponRequest request,
            CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.CouponCode))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Please enter a coupon code"
                });
            }

            try
            {
                await _checkoutService.ApplyCouponAsync(
                    request.CouponCode.Trim().ToUpper());

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return HandleError(ex, "ApplyCoupon");
            }
        }

        // ================= REMOVE COUPON =================

        [HttpDelete("remove-coupon")]
        public async Task<IActionResult> RemoveCoupon(CancellationToken ct)
        {
            try
            {
                await _checkoutService.RemoveCouponAsync();

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return HandleError(ex, "RemoveCoupon");
            }
        }

        // ---------------------------------------------------------------
        // Centralized error handling.
        //
        // The original code caught every exception the same way and
        // echoed ex.Message straight to the client as a 400. That means
        // a genuine bug (null ref, DB timeout, unhandled edge case)
        // comes back to the browser as "Bad Request" with an internal
        // error string attached — wrong status code, and a potential
        // information leak. Here:
        //   - expected, "the request itself was invalid" failures
        //     (ArgumentException / InvalidOperationException — throw
        //     these from the service layer for business-rule violations
        //     like "address not found" or "coupon expired") come back
        //     as 400 with their message, since the service already
        //     wrote a message safe to show a user.
        //   - anything else is logged with the full exception and
        //     returned as a generic 500, so stack traces / SQL errors
        //     never reach the client.
        // ---------------------------------------------------------------
        private IActionResult HandleError(Exception ex, string action)
        {
            if (ex is ArgumentException or InvalidOperationException or KeyNotFoundException)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }

            _logger.LogError(ex, "Checkout.{Action} failed", action);

            return StatusCode(500, new
            {
                success = false,
                message = "Something went wrong, please try again."
            });
        }
    }

    public class ApplyCouponRequest
    {
        public string CouponCode { get; set; } = "";
    }
}
