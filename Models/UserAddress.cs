namespace VivekMedicalProducts.Models
{
    public class UserAddress
    {
        public int Id { get; set; }

        public string? UserId { get; set; }

        public string? GuestId { get; set; }

        public string FullName { get; set; }

        public string MobileNumber { get; set; }

        public string AddressLine1 { get; set; }

        public string? AddressLine2 { get; set; }

        public string? Landmark { get; set; }


        public string City { get; set; }

        public string State { get; set; }

        public string Pincode { get; set; }

        public string AddressType { get; set; } = "Home";

        public bool IsDefault { get; set; }
    }
}