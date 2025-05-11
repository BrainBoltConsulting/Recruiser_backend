export enum MessageTypeEnum {
  SEND_FOR_VERIFY = 'SEND_FOR_VERIFY',
  IS_NOT_ACCEPTED = 'IS_NOT_ACCEPTED',
  VERIFY_YOUR_EMAIL = 'VERIFY_YOUR_EMAIL',
  USER_UNAUTHENTICATED = 'USER_UNAUTHENTICATED',
  INVALID_CODE = 'INVALID_CODE',
  USER_IS_NOT_ACTIVE = 'USER_IS_NOT_ACTIVE',
  INVALID_RESET_PASSWORD_TOKEN = 'INVALID_RESET_PASSWORD_TOKEN',
  USER_TOKEN_NOT_FOUND = 'USER_TOKEN_NOT_FOUND',
  USER_IS_ALREADY_EXISTS = 'USER_IS_ALREADY_EXISTS',
  PRODUCT_IS_ALREADY_EXISTS = 'PRODUCT_IS_ALREADY_EXISTS',
  USER_IS_NOT_FOUND = 'USER_IS_NOT_FOUND',
  USER_NOT_FOUND_IN_COMPANY = 'USER_NOT_FOUND_IN_COMPANY',
  CATEGORY_IS_NOT_FOUND = 'CATEGORY_IS_NOT_FOUND',
  TAB_SWITCH = 'TAB_SWITCH',
  INTERVIEW_FINISHED = 'INTERVIEW_FINISHED'
}

export const messages = {
  SEND_FOR_VERIFY: "Your email is successfully verified. Please wait till admin respond your request",
  IS_NOT_ACCEPTED: "Your application is not accepted by admin",
  VERIFY_YOUR_EMAIL: "Please verify your email",
  USER_UNAUTHENTICATED: "User unauthenticated",
  USER_IS_NOT_ACTIVE: 'Account Not Found or Inactive',
  INVALID_CODE: "Code is invalid",
  INVALID_RESET_PASSWORD_TOKEN: "Invalid reset password token",
  USER_TOKEN_NOT_FOUND: "User token is not found",
  USER_IS_ALREADY_EXISTS: "Registration Failed: Email already in use",
  PRODUCT_IS_ALREADY_EXISTS: "Product with this sku is already exists",
  USER_NOT_FOUND_IN_COMPANY: "User not found in this company",
  USER_IS_NOT_FOUND: "User is not found",
  CATEGORY_IS_NOT_FOUND: "Category is not found",
  TAB_SWITCH: "User switched tabs or minimized",
  INTERVIEW_FINISHED: "Interview is successfully finished"
}
