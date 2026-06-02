export function validateSignup(values) {
  const errors = {};
  if (!values.firstname?.trim()) errors.firstname = "First name is required";
  if (!values.lastName?.trim()) errors.lastName = "Last name is required";
  if (!values.email?.trim()) errors.email = "Email is required";
  if (!values.password || values.password.length < 6) errors.password = "Password must be at least 6 characters";
  return errors;
}

export function validateLogin(values) {
  const errors = {};
  if (!values.email?.trim()) errors.email = "Email is required";
  if (!values.password?.trim()) errors.password = "Password is required";
  return errors;
}
