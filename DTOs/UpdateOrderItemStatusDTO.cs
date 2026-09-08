using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace VivekMedicalProducts.DTOs
{
	public class UpdateOrderStatusDto
	{
		public string? PaymentStatus { get; set; }

		public string? ItemOrderStatus { get; set; }
	}
}
