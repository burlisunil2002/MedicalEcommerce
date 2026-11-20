using System.ComponentModel.DataAnnotations;
namespace VivekMedicalProducts.DTOs;
public class IssueSellerInvoiceRequest
{
    [Required, MaxLength(100)] public string PlaceOfSupply { get; set; } = "";
    [MaxLength(20)] public string? CustomerGSTIN { get; set; }
}
