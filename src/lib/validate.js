import validator from "validator";

// XSS থেকে বাঁচাতে HTML escape করো
export function sanitize(str) {
  if (typeof str !== "string") return "";
  return validator.escape(str.trim());
}

// Email validate
export function isValidEmail(email) {
  return validator.isEmail(email);
}

// Password validate — minimum 8 char
export function isValidPassword(password) {
  return typeof password === "string" && password.length >= 8;
}

// Name validate — only letters, spaces, min 2 char
export function isValidName(name) {
  return typeof name === "string" && name.trim().length >= 2 && /^[a-zA-Z\s\u0980-\u09FF]+$/.test(name.trim());
}

// Phone validate
export function isValidPhone(phone) {
  return /^[0-9+\-\s]{7,15}$/.test(phone?.trim());
}

// MongoDB ObjectId validate — NoSQL injection থেকে বাঁচাতে
export function isValidObjectId(id) {
  return /^[a-f\d]{24}$/i.test(id);
}

// String sanitize — NoSQL injection operator remove করো
export function sanitizeMongoInput(obj) {
  if (typeof obj !== "object" || obj === null) return obj;
  const clean = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$")) continue; // MongoDB operator block
    const val = obj[key];
    if (typeof val === "string") {
      clean[key] = validator.escape(val.trim());
    } else if (typeof val === "object") {
      clean[key] = sanitizeMongoInput(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}