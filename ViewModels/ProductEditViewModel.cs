namespace VivekMedicalProducts.ViewModels
{
    public class ProductEditViewModel
    {
        public int Id { get; set; }

        public bool IsHotDeal { get; set; }

        public decimal? DiscountPercentage { get; set; }

        public DateTime? DealEndDate { get; set; }
    }
}
