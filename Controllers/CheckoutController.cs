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

        public CheckoutController(
            ICheckoutService checkoutService)
        {
            _checkoutService = checkoutService;
        }

        // ================= GET CHECKOUT =================

        [HttpGet]
        public async Task<IActionResult> GetCheckout()
        {
            try
            {
                var result =
                    await _checkoutService.GetCheckoutAsync();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // ================= ADD ADDRESS =================

        [HttpPost("address")]
        public async Task<IActionResult> AddAddress(
            [FromBody] UserAddress model)
        {
            try
            {
                var result =
                    await _checkoutService.AddAddressAsync(model);

                return Ok(new
                {
                    success = true,
                    address = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // ================= UPDATE ADDRESS =================

        [HttpPut("address/{id}")]
        public async Task<IActionResult> UpdateAddress(
            int id,
            [FromBody] UserAddress model)
        {
            try
            {
                var result =
                    await _checkoutService.UpdateAddressAsync(
                        id,
                        model);

                return Ok(new
                {
                    success = true,
                    address = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // ================= SELECT ADDRESS =================

        [HttpPost("select-address/{id}")]
        public async Task<IActionResult> SelectAddress(int id)
        {
            Console.WriteLine($"Selected Address: {id}");

            await _checkoutService.SaveSelectedAddressAsync(id);

            return Ok(new { success = true });
        }

        // ================= APPLY COUPON =================

        [HttpPost("apply-coupon")]
        public async Task<IActionResult> ApplyCoupon(
            [FromBody] ApplyCouponRequest request)
        {
            try
            {
                await _checkoutService
                    .ApplyCouponAsync(request.CouponCode);

                return Ok(new
                {
                    success = true
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // ================= REMOVE COUPON =================

        [HttpDelete("remove-coupon")]
        public async Task<IActionResult> RemoveCoupon()
        {
            try
            {
                await _checkoutService
                    .RemoveCouponAsync();

                return Ok(new
                {
                    success = true
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
    }

    public class SelectAddressRequest
    {
        public int AddressId { get; set; }
    }

    public class ApplyCouponRequest
    {
        public string CouponCode { get; set; } = "";
    }
}