
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
        private readonly IAuditService _auditService;
        private readonly ILogger<CheckoutController> _logger;

        public CheckoutController(
            ICheckoutService checkoutService,
            IAuditService auditService,
            ILogger<CheckoutController> logger)
        {
            _checkoutService = checkoutService;
            _auditService = auditService;
            _logger = logger;
        }

        // ================= GET CHECKOUT =================

        [HttpGet]
        public async Task<IActionResult> GetCheckout(CancellationToken ct)
        {
            try
            {
                var result = await _checkoutService.GetCheckoutAsync();

                await LogAuditAsync(
                    "ViewCheckout",
                    "Checkout",
                    "Success",
                    "Checkout",
                    null,
                    "Customer accessed the checkout page.",
                    ct);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return await HandleErrorAsync(ex, "GetCheckout", ct);
            }
        }

        // ================= ADD ADDRESS =================

        [HttpPost("address")]
        public async Task<IActionResult> AddAddress(
            [FromBody] UserAddress model,
            CancellationToken ct)
        {
            if (model == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid address information."
                });
            }

            try
            {
                var result = await _checkoutService.AddAddressAsync(model);

                await LogAuditAsync(
                    "AddAddress",
                    "Checkout",
                    "Success",
                    "UserAddress",
                    null,
                    "Customer added a new delivery address.",
                    ct);

                return Ok(new
                {
                    success = true,
                    address = result
                });
            }
            catch (Exception ex)
            {
                return await HandleErrorAsync(ex, "AddAddress", ct);
            }
        }

        // ================= UPDATE ADDRESS =================

        [HttpPut("address/{id}")]
        public async Task<IActionResult> UpdateAddress(
            int id,
            [FromBody] UserAddress model,
            CancellationToken ct)
        {
            if (model == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid address information."
                });
            }

            try
            {
                var result = await _checkoutService.UpdateAddressAsync(id, model);

                await LogAuditAsync(
                    "UpdateAddress",
                    "Checkout",
                    "Success",
                    "UserAddress",
                    id.ToString(),
                    "Customer updated a delivery address.",
                    ct);

                return Ok(new
                {
                    success = true,
                    address = result
                });
            }
            catch (Exception ex)
            {
                return await HandleErrorAsync(ex, "UpdateAddress", ct, id.ToString());
            }
        }

        // ================= SELECT ADDRESS =================

        [HttpPost("select-address/{id}")]
        public async Task<IActionResult> SelectAddress(
            int id,
            CancellationToken ct)
        {
            try
            {
                await _checkoutService.SaveSelectedAddressAsync(id);

                await LogAuditAsync(
                    "SelectAddress",
                    "Checkout",
                    "Success",
                    "UserAddress",
                    id.ToString(),
                    "Customer selected a delivery address for checkout.",
                    ct);

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return await HandleErrorAsync(ex, "SelectAddress", ct, id.ToString());
            }
        }

        // ================= APPLY COUPON =================

        [HttpPost("apply-coupon")]
        public async Task<IActionResult> ApplyCoupon(
            [FromBody] ApplyCouponRequest request,
            CancellationToken ct)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.CouponCode))
            {
                await LogAuditAsync(
                    "ApplyCoupon",
                    "Checkout",
                    "Failed",
                    "Coupon",
                    null,
                    "Coupon application failed because the coupon code was empty.",
                    ct);

                return BadRequest(new
                {
                    success = false,
                    message = "Please enter a coupon code"
                });
            }

            try
            {
                await _checkoutService.ApplyCouponAsync(
                    request.CouponCode.Trim().ToUpperInvariant());

                await LogAuditAsync(
                    "ApplyCoupon",
                    "Checkout",
                    "Success",
                    "Coupon",
                    null,
                    "Customer successfully applied a coupon.",
                    ct);

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return await HandleErrorAsync(ex, "ApplyCoupon", ct);
            }
        }

        // ================= REMOVE COUPON =================

        [HttpDelete("remove-coupon")]
        public async Task<IActionResult> RemoveCoupon(CancellationToken ct)
        {
            try
            {
                await _checkoutService.RemoveCouponAsync();

                await LogAuditAsync(
                    "RemoveCoupon",
                    "Checkout",
                    "Success",
                    "Coupon",
                    null,
                    "Customer removed the applied coupon.",
                    ct);

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return await HandleErrorAsync(ex, "RemoveCoupon", ct);
            }
        }

        // ================= AUDIT LOGGING =================

        private async Task LogAuditAsync(
            string action,
            string module,
            string status,
            string entityType,
            string? entityId,
            string description,
            CancellationToken ct)
        {
            try
            {
                await _auditService.LogAsync(
                    action: action,
                    module: module,
                    status: status,
                    entityType: entityType,
                    entityId: entityId,
                    description: description,
                    cancellationToken: ct);
            }
            catch (Exception auditException)
            {
                // Audit failures should not interrupt checkout operations.
                _logger.LogError(
                    auditException,
                    "Failed to write checkout audit log for action {Action}.",
                    action);
            }
        }

        // ================= CENTRALIZED ERROR HANDLING =================

        private async Task<IActionResult> HandleErrorAsync(
            Exception ex,
            string action,
            CancellationToken ct,
            string? entityId = null)
        {
            if (ex is ArgumentException or
                InvalidOperationException or
                KeyNotFoundException)
            {
                await LogAuditAsync(
                    action,
                    "Checkout",
                    "Failed",
                    "Checkout",
                    entityId,
                    $"Checkout operation failed: {action}.",
                    ct);

                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }

            _logger.LogError(
                ex,
                "Checkout.{Action} failed.",
                action);

            await LogAuditAsync(
                action,
                "Checkout",
                "Failed",
                "Checkout",
                entityId,
                $"An unexpected error occurred during checkout operation: {action}.",
                ct);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
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
