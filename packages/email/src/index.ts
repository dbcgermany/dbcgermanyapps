export { render } from "@react-email/components";
export {
  createEmailClient,
  fromAddressFor,
  replyToAddressFor,
  DEFAULT_FROM,
} from "./client";
export {
  getResendDomainStatus,
  clearDomainCheckCache,
} from "./domain-check";
export type { DomainStatus, DomainCheckResult } from "./domain-check";
export { sendTicketEmail } from "./send-ticket";
export type { SendTicketEmailInput } from "./send-ticket";
export { computeCateringUrl } from "./catering";
export { sendTicketsForOrder } from "./send-tickets-for-order";
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
  sendIncubationApplicationConfirm,
  sendRefundConfirmation,
  sendContactFormConfirm,
  sendPreEventReminder,
  sendPasswordReset,
  sendStaffInvite,
  sendStaffCredentials,
  sendStaffEmailChanged,
  sendStaffPaused,
  sendChapterDelegateInvite,
  sendChapterDelegateInvitesBatch,
  sendChapterDelegateOutcome,
  sendPaymentReminder,
  sendTeamFriendCodeRedeemed,
} from "./send-transactional";
export type {
  SendTransferConfirmationInput,
  SendWaitlistNotificationInput,
  SendOrderReceiptInput,
  SendAftercareSequenceInput,
  SendAdminAlertInput,
  SendJobApplicationConfirmInput,
  SendIncubationApplicationConfirmInput,
  SendRefundConfirmationInput,
  SendContactFormConfirmInput,
  SendPreEventReminderInput,
  SendPasswordResetInput,
  SendStaffInviteInput,
  SendStaffCredentialsInput,
  SendStaffEmailChangedInput,
  SendStaffPausedInput,
  SendPaymentReminderInput,
  SendChapterDelegateOutcomeInput,
  SendTeamFriendCodeRedeemedInput,
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
export { IncubationApplicationConfirmEmail } from "./templates/incubation-confirm";
export type { IncubationApplicationConfirmEmailProps } from "./templates/incubation-confirm";
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
export { StaffCredentialsEmail } from "./templates/staff-credentials";
export type { StaffCredentialsEmailProps } from "./templates/staff-credentials";
export { StaffEmailChangedEmail } from "./templates/staff-email-changed";
export type { StaffEmailChangedEmailProps } from "./templates/staff-email-changed";
export { StaffPausedEmail } from "./templates/staff-paused";
export type { StaffPausedEmailProps } from "./templates/staff-paused";
export { ChapterDelegateAmbassadorInviteEmail } from "./templates/chapter-delegate-ambassador-invite";
export type { ChapterDelegateAmbassadorInviteEmailProps } from "./templates/chapter-delegate-ambassador-invite";
export { ChapterDelegateTeamMemberInviteEmail } from "./templates/chapter-delegate-team-member-invite";
export type { ChapterDelegateTeamMemberInviteEmailProps } from "./templates/chapter-delegate-team-member-invite";
export {
  ChapterDelegateOutcomeEmail,
  chapterDelegateOutcomeSubject,
} from "./templates/chapter-delegate-outcome";
export type {
  ChapterDelegateOutcomeEmailProps,
  ChapterDelegateOutcome,
} from "./templates/chapter-delegate-outcome";
export { TeamFriendCodeRedeemedEmail } from "./templates/team-friend-code-redeemed";
export type { TeamFriendCodeRedeemedEmailProps } from "./templates/team-friend-code-redeemed";
export { AskSpeakersEmail } from "./templates/ask-speakers";
export type {
  AskSpeakersEmailProps,
  AskSpeakersEmailSpeaker,
} from "./templates/ask-speakers";
export { sendAskSpeakersEmail } from "./send-ask-speakers";
export type { SendAskSpeakersInput } from "./send-ask-speakers";
export { SpeakerQuestionsPdf } from "./pdf/speaker-questions-pdf";
export type {
  SpeakerQuestionsPdfProps,
  SpeakerQuestionsPdfSpeakerGroup,
  SpeakerQuestionsPdfQuestion,
} from "./pdf/speaker-questions-pdf";
export { generateSpeakerQuestionsPdf } from "./pdf/generate-speaker-questions";
export type { GenerateSpeakerQuestionsInput } from "./pdf/generate-speaker-questions";
export { InvoicePdf } from "./pdf/invoice-pdf";
export { generateInvoicePdf } from "./pdf/generate-invoice";
export type { GenerateInvoiceInput } from "./pdf/generate-invoice";
export { RunsheetPdf } from "./pdf/runsheet-pdf";
export type { RunsheetPdfItem, RunsheetPdfProps } from "./pdf/runsheet-pdf";
export { generateRunsheetPdf } from "./pdf/generate-runsheet";
export type { GenerateRunsheetInput } from "./pdf/generate-runsheet";
export { BriefingPackPdf } from "./pdf/briefing-pack-pdf";
export type { BriefingPackPdfProps } from "./pdf/briefing-pack-pdf";
export { generateBriefingPackPdf } from "./pdf/generate-briefing-pack";
export type { GenerateBriefingPackInput } from "./pdf/generate-briefing-pack";
export { CertificatePdf } from "./pdf/certificate-pdf";
export type { CertificatePdfProps } from "./pdf/certificate-pdf";
export { generateCertificatePdf } from "./pdf/generate-certificate";
export type { GenerateCertificateInput } from "./pdf/generate-certificate";
export { SponsorsPdf } from "./pdf/sponsors-pdf";
export type {
  SponsorsPdfProps,
  SponsorEntry,
  SponsorTier,
} from "./pdf/sponsors-pdf";
export { generateSponsorsPdf } from "./pdf/generate-sponsors";
export type {
  GenerateSponsorsInput,
  SponsorRow,
} from "./pdf/generate-sponsors";
export { generateOutcomesWorksheetPdf } from "./pdf/generate-outcomes-worksheet";
export { generateGlossaryCardPdf } from "./pdf/generate-glossary-card";
export { generateWhatsappCardPdf } from "./pdf/generate-whatsapp-card";
export {
  SUPPORTED_LOCALES,
  isSupportedLocale,
  resolveLocale,
  localeFromCountry,
  resolveRecipientLocale,
} from "./locale-resolver";
export type { Locale, ResolveRecipientLocaleInput } from "./locale-resolver";
export {
  PREVIEW_CONTACT,
  PREVIEW_TICKET,
  PREVIEW_ORDER,
  PREVIEW_BRAND,
  PREVIEW_ASK_SPEAKERS,
  buildPreviewEventFixture,
  previewNewsletterBody,
  previewNewsletterSubject,
  previewStaffMessage,
  previewAftercare,
  previewAdminAlert,
} from "./preview-fixtures";
export type {
  PreviewLocale,
  PreviewEventRow,
  PreviewTierRow,
  PreviewEventFixture,
} from "./preview-fixtures";
