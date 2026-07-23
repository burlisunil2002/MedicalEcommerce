using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.DTOs;
using VivekMedicalProducts.Interfaces;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Services
{
    public class CheckoutService : ICheckoutService
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserContextService _userContext;
        private readonly ICartCalculationService _calc;
        private readonly IHttpContextAccessor _http;

        public CheckoutService(
            ApplicationDbContext context,
            IUserContextService userContext,
            ICartCalculationService calc,
            IHttpContextAccessor http)
        {
            _context = context;
            _userContext = userContext;
            _calc = calc;
            _http = http;
        }

        private (string? userId, string? guestId) GetIdentity()
        {
            var userId = _userContext.GetUserId();

            var guestId =
                string.IsNullOrEmpty(userId)
                ? _http.HttpContext?.Request.Cookies["guest_id"]
                : null;

            return (userId, guestId);
        }

        private async Task<CheckoutSessionModel> GetOrCreateSessionAsync()
        {
            var (userId, guestId) = GetIdentity();

            var session =
                await _context.CheckoutSessions
                .FirstOrDefaultAsync(x =>

                    x.IsActive &&

                    (

                        (userId != null && x.UserId == userId)

                        ||

                        (userId == null && x.GuestId == guestId)

                    ));

            if (session != null)
                return session;

            session = new CheckoutSessionModel
            {
                UserId = userId,

                GuestId = guestId,

                CreatedDate = DateTime.UtcNow,

                ModifiedDate = DateTime.UtcNow,

                IsActive = true
            };

            _context.CheckoutSessions.Add(session);

            await _context.SaveChangesAsync();

            return session;
        }

        private void ValidateAddress(UserAddress model)
        {
            if (string.IsNullOrWhiteSpace(model.FullName))
                throw new Exception("Full name is required.");

            if (model.FullName.Trim().Length < 3)
                throw new Exception("Please enter a valid full name.");

            if (string.IsNullOrWhiteSpace(model.MobileNumber))
                throw new Exception("Mobile number is required.");

            if (!System.Text.RegularExpressions.Regex.IsMatch(
                model.MobileNumber,
                @"^[6-9]\d{9}$"))
                throw new Exception("Enter a valid 10 digit mobile number.");

            if (string.IsNullOrWhiteSpace(model.AddressLine1))
                throw new Exception("Address is required.");

            if (model.AddressLine1.Trim().Length < 10)
                throw new Exception("Please enter a complete address.");

            if (string.IsNullOrWhiteSpace(model.City))
                throw new Exception("City is required.");

            if (string.IsNullOrWhiteSpace(model.State))
                throw new Exception("State is required.");

            if (string.IsNullOrWhiteSpace(model.Pincode))
                throw new Exception("Pincode is required.");

            if (!System.Text.RegularExpressions.Regex.IsMatch(
                model.Pincode,
                @"^\d{6}$"))
                throw new Exception("Enter a valid 6 digit pincode.");

            if (string.IsNullOrWhiteSpace(model.AddressType))
                throw new Exception("Please select address type.");
        }

        public async Task<UserAddress> AddAddressAsync(UserAddress model)
        {
            ValidateAddress(model);

            var (userId, guestId) = GetIdentity();

            model.UserId = userId;
            model.GuestId = guestId;

            model.IsDefault = !await _context.UserAddresses.AnyAsync(x =>
                (userId != null && x.UserId == userId) ||
                (guestId != null && x.GuestId == guestId));

            _context.UserAddresses.Add(model);

            await _context.SaveChangesAsync();

            return model;
        }

        public async Task SaveSelectedAddressAsync(int addressId)
        {
            var (userId, guestId) = GetIdentity();

            Console.WriteLine($"USER: {userId}");
            Console.WriteLine($"GUEST: {guestId}");
            Console.WriteLine($"ADDRESS: {addressId}");

            var session = await GetCurrentSessionAsync();

            Console.WriteLine($"SESSION ID: {session.Id}");

            session.SelectedAddressId = addressId;
            session.ModifiedDate = DateTime.UtcNow;

            var rows = await _context.SaveChangesAsync();

            Console.WriteLine($"ROWS UPDATED: {rows}");

            // Read it back from DB immediately
            var verify = await _context.CheckoutSessions
                .FirstOrDefaultAsync(x => x.Id == session.Id);

            Console.WriteLine($"DB VALUE: {verify?.SelectedAddressId}");

        }

        public async Task<UserAddress> UpdateAddressAsync(
    int id,
    UserAddress model)
        {
            ValidateAddress(model);

            var address =
                await _context.UserAddresses.FindAsync(id);

            if (address == null)
                throw new Exception("Address not found.");

            address.FullName = model.FullName.Trim();
            address.MobileNumber = model.MobileNumber.Trim();
            address.AddressLine1 = model.AddressLine1.Trim();
            address.City = model.City.Trim();
            address.State = model.State.Trim();
            address.Pincode = model.Pincode.Trim();
            address.AddressType = model.AddressType;

            await _context.SaveChangesAsync();

            return address;
        }

        public async Task ApplyCouponAsync(string couponCode)
        {
            var session = await GetOrCreateSessionAsync();

            session.CouponCode = couponCode;

            var (userId, guestId) = GetIdentity();

            var totals = await _calc.CalculateAsync(
                userId,
                guestId,
                couponCode);

            session.SubTotal = totals.Subtotal;
            session.GSTAmount = totals.GST;
            session.CouponDiscount = totals.CouponDiscount;
            session.GrandTotal = totals.Total;
            session.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task RemoveCouponAsync()
        {
            var session = await GetOrCreateSessionAsync();

            session.CouponCode = null;

            var (userId, guestId) = GetIdentity();

            var totals = await _calc.CalculateAsync(
                userId,
                guestId,
                null);

            session.SubTotal = totals.Subtotal;
            session.GSTAmount = totals.GST;
            session.CouponDiscount = totals.CouponDiscount;
            session.GrandTotal = totals.Total;
            session.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task<List<CartModel>> GetCurrentCartAsync()
        {
            var (userId, guestId) = GetIdentity();

            return await _context.Carts
                .Include(x => x.Product)
                .Include(x => x.ProductVariant)
                .Where(x =>

                    (!string.IsNullOrEmpty(userId) &&
                     x.UserId == userId)

                    ||

                    (string.IsNullOrEmpty(userId) &&
                     x.GuestId == guestId)

                )
                .ToListAsync();
        }

        public async Task<CheckoutResponseDto> GetCheckoutAsync()
        {
            var (userId, guestId) = GetIdentity();

            var session = await GetCurrentSessionAsync();

            var carts = await GetCurrentCartAsync();

            var cartItems =
                await _context.Carts
                .Include(x => x.Product)
                .Include(x => x.ProductVariant)
                .Where(x =>

                    (userId != null && x.UserId == userId)

                    ||

                    (userId == null && x.GuestId == guestId)

                )
                .Select(c => new
                {
                    c.Id,

                    c.Quantity,

                    ProductId = c.ProductId,

                    ProductName = c.Product.Name,

                    ProductImage = c.Product.ImageUrl,

                    VariantId = c.ProductVariantId,

                    VariantName =
                        c.ProductVariant != null
                        ? c.ProductVariant.Model
                        : null,

                    ProductPrice =
                        c.ProductVariant != null
                        ? c.ProductVariant.Price
                        : 0,

                    ProductFinalPrice =
        c.Product.IsHotDeal &&
        c.Product.DiscountPercentage > 0
            ? c.ProductVariant.Price -
              (c.ProductVariant.Price *
               c.Product.DiscountPercentage / 100m)
            : c.ProductVariant.Price

                })
                .ToListAsync();


            Console.WriteLine("========== GET CHECKOUT ==========");
            Console.WriteLine($"UserId: {userId}");
            Console.WriteLine($"GuestId: {guestId}");
            Console.WriteLine($"Cart Count: {cartItems.Count}");

            var addresses =
                await _context.UserAddresses
                .Where(x =>

                    (userId != null && x.UserId == userId)

                    ||

                    (userId == null && x.GuestId == guestId)

                )
                .OrderByDescending(x => x.IsDefault)
                .ToListAsync();

            // Always use the coupon saved in CheckoutSession
            var totals = await _calc.CalculateAsync(
                userId,
                guestId,
                session.CouponCode);

            session.SubTotal = totals.Subtotal;

            session.GSTAmount = totals.GST;

            session.CouponDiscount =
                totals.CouponDiscount;

            session.GrandTotal =
                totals.Total;

            session.ModifiedDate =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new CheckoutResponseDto
            {
                CartItems = cartItems,

                Addresses = addresses,

                Summary = totals,

                SelectedAddressId =
                    session.SelectedAddressId
            };
        }

        public async Task<CheckoutSessionModel> GetCurrentSessionAsync()
        {
            var (userId, guestId) = GetIdentity();

            var session = await _context.CheckoutSessions
                .FirstOrDefaultAsync(x =>
                    x.IsActive &&
                    (
                        (!string.IsNullOrEmpty(userId) && x.UserId == userId) ||
                        (string.IsNullOrEmpty(userId) && x.GuestId == guestId)
                    ));

            if (session == null)
            {
                session = new CheckoutSessionModel
                {
                    UserId = userId,
                    GuestId = string.IsNullOrEmpty(userId) ? guestId : null,
                    CreatedDate = DateTime.UtcNow,
                    ModifiedDate = DateTime.UtcNow,
                    IsActive = true
                };

                _context.CheckoutSessions.Add(session);
                await _context.SaveChangesAsync();
            }

            return session;
        }
    }
}

