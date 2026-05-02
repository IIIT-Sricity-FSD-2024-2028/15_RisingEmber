"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationStatus = exports.NotificationTone = exports.AwardStatus = exports.DocumentStatus = exports.DocumentType = exports.HearingStatus = exports.HearingType = exports.CaseStatus = exports.BookingStatus = exports.ServiceStatus = exports.Role = void 0;
var Role;
(function (Role) {
    Role["CUSTOMER"] = "customer";
    Role["PROVIDER"] = "provider";
    Role["ADMIN"] = "admin";
    Role["ARBITRATOR"] = "arbitrator";
})(Role || (exports.Role = Role = {}));
var ServiceStatus;
(function (ServiceStatus) {
    ServiceStatus["ACTIVE"] = "active";
    ServiceStatus["PAUSED"] = "paused";
    ServiceStatus["ARCHIVED"] = "archived";
})(ServiceStatus || (exports.ServiceStatus = ServiceStatus = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["REQUESTED"] = "requested";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["IN_PROGRESS"] = "in_progress";
    BookingStatus["COMPLETED"] = "completed";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["DISPUTED"] = "disputed";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var CaseStatus;
(function (CaseStatus) {
    CaseStatus["OPEN"] = "open";
    CaseStatus["UNDER_REVIEW"] = "under_review";
    CaseStatus["ASSIGNED"] = "assigned";
    CaseStatus["HEARING_SCHEDULED"] = "hearing_scheduled";
    CaseStatus["EVIDENCE_REVIEW"] = "evidence_review";
    CaseStatus["RESOLVED"] = "resolved";
    CaseStatus["CLOSED"] = "closed";
})(CaseStatus || (exports.CaseStatus = CaseStatus = {}));
var HearingType;
(function (HearingType) {
    HearingType["VIDEO"] = "video";
    HearingType["PHONE"] = "phone";
    HearingType["IN_PERSON"] = "in_person";
})(HearingType || (exports.HearingType = HearingType = {}));
var HearingStatus;
(function (HearingStatus) {
    HearingStatus["SCHEDULED"] = "scheduled";
    HearingStatus["COMPLETED"] = "completed";
    HearingStatus["CANCELLED"] = "cancelled";
})(HearingStatus || (exports.HearingStatus = HearingStatus = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["EVIDENCE"] = "evidence";
    DocumentType["INVOICE"] = "invoice";
    DocumentType["IDENTITY"] = "identity";
    DocumentType["CONTRACT"] = "contract";
    DocumentType["AWARD_ATTACHMENT"] = "award_attachment";
    DocumentType["OTHER"] = "other";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["UPLOADED"] = "uploaded";
    DocumentStatus["ACCEPTED"] = "accepted";
    DocumentStatus["REJECTED"] = "rejected";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
var AwardStatus;
(function (AwardStatus) {
    AwardStatus["DRAFT"] = "draft";
    AwardStatus["ISSUED"] = "issued";
    AwardStatus["AMENDED"] = "amended";
})(AwardStatus || (exports.AwardStatus = AwardStatus = {}));
var NotificationTone;
(function (NotificationTone) {
    NotificationTone["INFO"] = "info";
    NotificationTone["SUCCESS"] = "success";
    NotificationTone["WARNING"] = "warning";
    NotificationTone["CRITICAL"] = "critical";
})(NotificationTone || (exports.NotificationTone = NotificationTone = {}));
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["PENDING"] = "pending";
    ApplicationStatus["APPROVED"] = "approved";
    ApplicationStatus["REJECTED"] = "rejected";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
//# sourceMappingURL=entities.js.map