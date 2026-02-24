import {
  getUtf8ByteLength,
  PASSWORD_MAX_BYTES,
  PASSWORD_MAX_BYTES_ERROR,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_ERROR,
} from "../constants/password-policy";

export const signupFieldOrder = [
  "firstName",
  "lastName",
  "email",
  "password",
  "confirmPassword",
];

export function validateSignupField(name, value, currentForm) {
  switch (name) {
    case "firstName":
    case "lastName":
      return value.trim() ? "" : "This field is required.";
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address.";
    case "password":
      if (!value) {
        return "Password is required.";
      }
      if (value.length < PASSWORD_MIN_LENGTH) {
        return PASSWORD_MIN_LENGTH_ERROR;
      }
      if (getUtf8ByteLength(value) > PASSWORD_MAX_BYTES) {
        return PASSWORD_MAX_BYTES_ERROR;
      }
      return "";
    case "confirmPassword":
      return value === currentForm.password ? "" : "Passwords do not match.";
    default:
      return "";
  }
}

export function validateSignupForm(formState) {
  return signupFieldOrder.reduce((errors, fieldName) => {
    errors[fieldName] = validateSignupField(fieldName, formState[fieldName], formState);
    return errors;
  }, {});
}
