using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Services
{
    public class ProductService
    {
        private readonly ApplicationDbContext _context;

        public ProductService(ApplicationDbContext context)
        {
            _context = context;
        }

        public IEnumerable<ProductModel> GetAllProducts()
        {
            return _context.Products.ToList();
        }

        public void AddProducts(ProductModel product)
        {
            _context.Products.Add(product);
            _context.SaveChanges();
        }
    }
}