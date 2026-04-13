export const enAuthDictionary = {
login: {
  title: "Login",
  description:
    "Sign in with your existing account to manage Instagram connections, content generation, and publishing flows.",
  email: "Email",
  password: "Password",
  forgotPassword: "Forgot your password?",
  createAccount: "Create account",
  emailPlaceholder: "reviewer@example.com",
  passwordPlaceholder: "minimum 8 characters",
  submit: "Login",
  submitting: "Signing in...",
  continueError: "Unable to continue."
},

register: {
  title: "Create Account",
  description:
    "Create your account with a secure password so each user has their own protected workspace.",
  email: "Email",
  password: "Password",
  confirmPassword: "Confirm password",
  emailPlaceholder: "reviewer@example.com",
  passwordPlaceholder: "minimum 8 characters",
  confirmPasswordPlaceholder: "Repeat your password",
  submit: "Create account",
  submitting: "Creating account...",
  loginLink: "Already have an account? Sign in",
  passwordMismatch: "Passwords do not match.",
  continueError: "Unable to create your account."
},

forgotPassword: {
  title: "Reset Password",
  description:
    "Enter your email and we will generate a secure reset link if the account exists.",
  email: "Email",
  emailPlaceholder: "reviewer@example.com",
  submit: "Send reset link",
  submitting: "Sending link...",
  success:
    "If this email exists, a password reset link has been generated. In development, the link may appear below.",
  loginLink: "Back to sign in",
  continueError: "Unable to request password reset.",
  devLinkLabel: "Development reset link"
},

resetPassword: {
  title: "Choose New Password",
  description:
    "Create a new password to restore access to your account. Existing sessions will be signed out.",
  password: "New password",
  confirmPassword: "Confirm new password",
  passwordPlaceholder: "minimum 8 characters",
  confirmPasswordPlaceholder: "Repeat your new password",
  submit: "Save new password",
  submitting: "Saving password...",
  success: "Password updated successfully. Redirecting to the dashboard...",
  invalidToken: "This password reset link is missing or invalid.",
  loginLink: "Back to sign in",
  passwordMismatch: "Passwords do not match.",
  continueError: "Unable to reset password."
},
};
