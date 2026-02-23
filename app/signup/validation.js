export const signupFieldOrder = [
  "firstName",
  "lastName",
  "email",
  "password",
  "confirmPassword",
];

function passwordByteLength(value) {
  if (typeof Buffer !== "undefined") {
    return Buffer.byteLength(value);
  }

  return new TextEncoder().encode(value).length;
}

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
      if (value.length < 8) {
        return "Password must be at least 8 characters.";
      }
      if (passwordByteLength(value) > 32) {
        return "Password must be 32 characters or fewer.";
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
