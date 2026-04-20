export { render } from "@react-email/components";
export { createEmailClient, fromAddressFor, DEFAULT_FROM } from "./client";
export {
  getResendDomainStatus,
  clearDomainCheckCache,
} from "./domain-check";
export type { DomainStatus, DomainCheckResult } from "./domain-check";
export { sendTicketEmail } from "./send-ticket";
export type { SendTicketEmailInput } from "./send-ticket";
export { generateTicketPdf } from "./pdf/generate-ticket";
export type { GenerateTicketInput } from "./pdf/generate-ticket";
export { TicketPdf } from "./pdf/ticket-pdf";
export { InvitationLetterPdf } from "./pdf/invitation-letter-pdf";
export { generateInvitationLetterPdf } from "./pdf/generate-invitation-letter";
export type { GenerateInvitationLetterInput } from "./pdf/generate-invitation-letter";
export { TicketDeliveryEmail } from "./templates/ticket-delivery";
export { TransferConfirmationEmail } from "./templates/transfer-confirmation";
export { formalSalutation, formalClosing } from "./salutation";
export {
  InvitationEmail,
  DEFAULT_INVITATION_BODY,
} from "./templates/invitation-email";
export { WaitlistNotificationEmail } from "./templates/waitlist-notification";
export { OrderReceiptEmail } from "./templates/order-receipt";
export { AftercareSequenceEmail } from "./templates/aftercare-sequence";
export { AdminAlertEmail } from "./templates/admin-alert";
export {
  sendTransferConfirmation,
  sendWaitlistNotification,
  sendOrderReceipt,
  sendAftercareSequence,
  sendAdminAlert,
  sendJobApplicationConfirm,
  sendRefundConfirmation,
  sendContactFormConfirm,
  sendPreEventReminder,
  sendPasswordReset,
  sendStaffInvite,
} from "./send-transactional";
export type {
  SendTransferConfirmationInput,
  SendWaitlistNotificationInput,
  SendOrderReceiptInput,
  SendAftercareSequenceInput,
  SendAdminAlertInput,
  SendJobApplicationConfirmInput,
  SendRefundConfirmationInput,
  SendContactFormConfirmInput,
  SendPreEventReminderInput,
  SendPasswordResetInput,
  SendStaffInviteInput,
} from "./send-transactional";
export {
  sendNewsletterEmail,
  sendNewsletterConfirm,
  sendStaffMessage,
} from "./send-newsletter";
export type {
  SendNewsletterInput,
  SendNewsletterConfirmInput,
  SendStaffMessageInput,
  UpcomingEvent,
} from "./send-newsletter";
export { NewsletterEmail } from "./templates/newsletter";
export { NewsletterConfirmEmail } from "./templates/newsletter-confirm";
export { StaffMessageEmail } from "./templates/staff-message";
export { JobApplicationConfirmEmail } from "./templates/job-application-confirm";
export type { JobApplicationConfirmEmailProps } from "./templates/job-application-confirm";
export { RefundConfirmationEmail } from "./templates/refund-confirmation";
export type { RefundConfirmationEmailProps } from "./templates/refund-confirmation";
export { ContactFormConfirmEmail } from "./templates/contact-form-confirm";
export type { ContactFormConfirmEmailProps } from "./templates/contact-form-confirm";
export { PreEventReminderEmail } from "./templates/pre-event-reminder";
export type { PreEventReminderEmailProps } from "./templates/pre-event-reminder";
export { PaymentReminderEmail } from "./templates/payment-reminder";
export type { PaymentReminderEmailProps } from "./templates/payment-reminder";
export { PasswordResetEmail } from "./templates/password-reset";
export type { PasswordResetEmailProps } from "./templates/password-reset";
export { StaffInviteEmail } from "./templates/staff-invite";
export type { StaffInviteEmailProps } from "./templates/staff-invite";
export { InvoicePdf } from "./pdf/invoice-pdf";
export { generateInvoicePdf } from "./pdf/generate-invoice";
export type { GenerateInvoiceInput } from "./pdf/generate-invoice";
export { RunsheetPdf } from "./pdf/runsheet-pdf";
export type { RunsheetPdfItem, RunsheetPdfProps } from "./pdf/runsheet-pdf";
export { generateRunsheetPdf } from "./pdf/generate-runsheet";
export type { GenerateRunsheetInput } from "./pdf/generate-runsheet";
