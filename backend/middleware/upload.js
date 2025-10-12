const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");  // invoices will be stored here
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

module.exports = upload;


// flutter code ke liye

// var request = http.MultipartRequest(
//   'POST',
//   Uri.parse("http://<your-server>/transactions"),
// );

// request.headers['Authorization'] = 'Bearer $token';
// request.fields['item'] = itemName;
// request.fields['amount'] = amount.toString();
// request.fields['type'] = "expense";  // or "income"

// if (invoiceFile != null) {
//   request.files.add(await http.MultipartFile.fromPath("invoice", invoiceFile.path));
// }

// var response = await request.send();
