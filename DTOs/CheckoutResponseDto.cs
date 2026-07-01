namespace VivekMedicalProducts.DTOs
{
    public class CheckoutResponseDto
    {
        public object CartItems { get; set; } = default!;

        public object Addresses { get; set; } = default!;

        public object Summary { get; set; } = default!;

        public int? SelectedAddressId { get; set; }
    }
}