using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;

    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly EmailService _emailService;

        public HomeController(ApplicationDbContext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public IActionResult ProductsPage()
        {
            // Fetch products from the database
            var products = _context.Products.ToList();

            // Pass them to the view
            return View(products);
        }


        public IActionResult HomePage()
        {
            return View();
        }

        public IActionResult AboutUs()
        {
            return View();
        }

        public IActionResult ContactUs()
        {
            return View();
        }

        public IActionResult AddProducts()
        {
            return View();
        }

        public IActionResult FAQ()
        {
            return View();
        }

        public IActionResult TermsPage()
        {
            return View();
        }

        // -------- NEW ENQUIRY ACTIONS --------

        [HttpGet]
        public IActionResult Enquiry()
        {
            return View();
        }



        [HttpPost]
        public IActionResult Enquiry(EnquiryModel model)
        {
            if (ModelState.IsValid)
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var user = _context.Users.FirstOrDefault(x => x.Id == userId);

                // ✅ overwrite user input (security)
                model.Name = user?.CustomerName;
                model.Email = user?.Email;
                model.Contact = user?.MobileNo;

                _context.Enquiry.Add(model);
                _context.SaveChanges();

                _emailService.SendEnquiryMail(model);

                TempData["Success"] = "Your Enquiry submitted successfully";

                return RedirectToAction("Enquiry");
            }

            return View(model);
        }

        public IActionResult EnquiryList(DateTime? fromDate, DateTime? toDate)
        {
            var enquiries = _context.Enquiry.AsQueryable();

            if (fromDate.HasValue)
            {
                var from = fromDate.Value.Date;
                enquiries = enquiries.Where(x => x.CreatedDate >= from);
            }

            if (toDate.HasValue)
            {
                var to = toDate.Value.Date.AddDays(1);
                enquiries = enquiries.Where(x => x.CreatedDate < to);
            }

            return View(enquiries
                .OrderByDescending(x => x.CreatedDate)
                .ToList());
        }
        public IActionResult ExportToExcel()
        {
            var enquiries = _context.Enquiry.OrderByDescending(x => x.CreatedDate).ToList();

            using (var workbook = new ClosedXML.Excel.XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Enquiries");

                worksheet.Cell(1, 1).Value = "Name";
                worksheet.Cell(1, 2).Value = "Email";
                worksheet.Cell(1, 3).Value = "Contact";
                worksheet.Cell(1, 4).Value = "Product";
                worksheet.Cell(1, 5).Value = "Remarks";
                worksheet.Cell(1, 6).Value = "Date";


                for (int i = 0; i < enquiries.Count; i++)
                {
                    worksheet.Cell(i + 2, 1).Value = enquiries[i].Name;
                    worksheet.Cell(i + 2, 2).Value = enquiries[i].Email;
                    worksheet.Cell(i + 2, 3).Value = enquiries[i].Contact;
                    worksheet.Cell(i + 2, 4).Value = enquiries[i].ProductName;
                    worksheet.Cell(i + 2, 5).Value = enquiries[i].Remarks;
                    worksheet.Cell(i + 2, 6).Value = enquiries[i].CreatedDate;

                }

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    var content = stream.ToArray();

                    return File(content,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "EnquiryList.xlsx");
                }
            }
        }
    }

