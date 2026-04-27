# Requirements Document

## Introduction

This document specifies requirements for adding license upload and verification functionality to the garage registration process.

**Current System Problem:**
Currently, garages are immediately activated after registration without any verification or admin approval. This means:
- Garages can receive bookings immediately upon registration
- No license verification exists
- No admin oversight or approval workflow
- Unverified businesses have full access to the platform

**This is a critical business and compliance risk that must be fixed.**

**New System Behavior:**
This feature will require garage owners to upload valid license documents during registration and implement a mandatory admin verification workflow. Garages will NOT be able to receive bookings or access full system services until an admin explicitly approves their license. The system will enforce three distinct verification states:
1. **Pending Verification**: Garage registered but cannot receive bookings (waiting for admin approval)
2. **Approved**: Admin has verified the license, garage can now receive bookings and access full services
3. **Rejected**: Admin has rejected the license, garage cannot operate until they resubmit a valid license

## Glossary

- **Garage_Registration_System**: The system component that handles garage owner registration and profile creation
- **License_Upload_Component**: The UI component that allows garage owners to select and upload license documents
- **License_Validator**: The system component that validates license file format, size, and type
- **License_Storage_Service**: The system component that securely stores license documents
- **Verification_Status**: The state of a garage registration (Pending Verification, Approved, Rejected)
- **Admin_Verification_Interface**: The UI component that allows admins to review and approve/reject license documents
- **Garage_Owner**: A user with the role of garage owner who registers their garage
- **Admin**: A user with administrative privileges who verifies license documents
- **License_Document**: A digital file (PDF, JPG, or PNG) containing the garage's business license
- **Full_System_Services**: Complete access to booking management, analytics, and customer interactions

## Requirements

### Requirement 1: Mandatory License Upload

**User Story:** As a system administrator, I want license upload to be mandatory during garage registration, so that all registered garages have verified business credentials.

#### Acceptance Criteria

1. WHEN a Garage_Owner submits the registration form, THE Garage_Registration_System SHALL validate that a License_Document has been uploaded
2. IF no License_Document is uploaded, THEN THE Garage_Registration_System SHALL reject the registration and display an error message stating "License document is required"
3. THE Garage_Registration_System SHALL prevent form submission until a License_Document is attached

### Requirement 2: License File Format Validation

**User Story:** As a system administrator, I want to accept only specific file formats, so that license documents are in standard, reviewable formats.

#### Acceptance Criteria

1. WHEN a Garage_Owner uploads a License_Document, THE License_Validator SHALL verify the file format is PDF, JPG, or PNG
2. IF the uploaded file format is not PDF, JPG, or PNG, THEN THE License_Validator SHALL reject the upload and display an error message stating "Only PDF, JPG, and PNG formats are accepted"
3. THE License_Validator SHALL verify the file extension matches the actual file content type
4. IF the file extension does not match the content type, THEN THE License_Validator SHALL reject the upload and display an error message stating "Invalid file format detected"

### Requirement 3: License File Size Validation

**User Story:** As a system administrator, I want to limit license file sizes, so that storage costs remain manageable and upload performance is acceptable.

#### Acceptance Criteria

1. WHEN a Garage_Owner uploads a License_Document, THE License_Validator SHALL verify the file size does not exceed 5 megabytes
2. IF the file size exceeds 5 megabytes, THEN THE License_Validator SHALL reject the upload and display an error message stating "File size must not exceed 5MB"

### Requirement 4: Secure License Storage

**User Story:** As a system administrator, I want license documents stored securely, so that sensitive business documents are protected from unauthorized access.

#### Acceptance Criteria

1. WHEN a License_Document passes validation, THE License_Storage_Service SHALL store the file with a unique identifier
2. THE License_Storage_Service SHALL associate the stored License_Document with the corresponding garage record in the database
3. THE License_Storage_Service SHALL store the file path, original filename, file size, and upload timestamp in the database
4. THE License_Storage_Service SHALL prevent direct public access to stored License_Documents

### Requirement 5: Initial Verification Status (CRITICAL - Fixes Immediate Activation Problem)

**User Story:** As a system administrator, I want newly registered garages to have a pending status, so that they cannot access services until their license is verified.

**IMPORTANT:** This requirement fixes the current system behavior where garages are immediately active after registration. The new system MUST NOT allow garages to operate until admin approval is granted.

#### Acceptance Criteria

1. WHEN a Garage_Owner completes registration with a valid License_Document, THE Garage_Registration_System SHALL set the Verification_Status to "Pending Verification"
2. THE Garage_Registration_System SHALL NOT set the garage to active or operational status upon registration
3. THE Garage_Registration_System SHALL store the registration timestamp in the database
4. THE Garage_Registration_System SHALL display a success message stating "Registration submitted successfully. Your license is pending admin verification. You will be notified once approved and cannot receive bookings until then."
5. THE Garage_Registration_System SHALL prevent the garage from appearing in search results for car owners until Verification_Status is "Approved"

### Requirement 6: Service Access Restriction (CRITICAL - Enforces Admin Approval Requirement)

**User Story:** As a system administrator, I want to restrict unverified garages from accessing full services, so that only admin-approved legitimate businesses can receive bookings.

**IMPORTANT:** This requirement enforces that garages MUST wait for admin approval before they can operate. This is the core fix for the current system where garages can immediately receive bookings.

#### Acceptance Criteria

1. WHILE the Verification_Status is "Pending Verification", THE Garage_Registration_System SHALL prevent the garage from receiving new bookings
2. WHILE the Verification_Status is "Pending Verification", THE Garage_Registration_System SHALL prevent the garage from appearing in car owner search results
3. WHILE the Verification_Status is "Pending Verification", THE Garage_Registration_System SHALL display a prominent notification stating "Your garage is pending license verification by an administrator. You cannot receive bookings or access full services until approved. You will receive a notification once your license is reviewed."
4. WHILE the Verification_Status is "Rejected", THE Garage_Registration_System SHALL prevent the garage from accessing Full_System_Services
5. WHILE the Verification_Status is "Rejected", THE Garage_Registration_System SHALL display the rejection reason and option to resubmit
6. WHEN the Verification_Status is "Approved", THE Garage_Registration_System SHALL grant access to Full_System_Services
7. WHEN the Verification_Status is "Approved", THE Garage_Registration_System SHALL allow the garage to appear in car owner search results
8. WHEN the Verification_Status is "Approved", THE Garage_Registration_System SHALL allow the garage to receive and manage bookings

### Requirement 7: Admin License Review Interface

**User Story:** As an Admin, I want to review uploaded license documents, so that I can verify garage credentials before approval.

#### Acceptance Criteria

1. THE Admin_Verification_Interface SHALL display a list of all garages with Verification_Status "Pending Verification"
2. WHEN an Admin selects a pending garage, THE Admin_Verification_Interface SHALL display the garage details and the uploaded License_Document
3. THE Admin_Verification_Interface SHALL provide options to approve or reject the license
4. THE Admin_Verification_Interface SHALL display the License_Document in a viewable format within the interface

### Requirement 7.1: Verification Status Workflow (CRITICAL - Defines Complete Approval Process)

**User Story:** As a system administrator, I want a clear verification status workflow, so that garage operational status is always tied to admin approval.

**IMPORTANT:** This requirement defines the complete status lifecycle and ensures garages cannot bypass the admin approval requirement. The workflow is: Register → Pending → Admin Reviews → Approved/Rejected → Operational/Non-operational.

#### Acceptance Criteria

1. THE Garage_Registration_System SHALL enforce exactly three possible Verification_Status values: "Pending Verification", "Approved", "Rejected"
2. WHEN a garage is first registered, THE Garage_Registration_System SHALL set Verification_Status to "Pending Verification" and SHALL NOT allow any other initial status
3. THE Garage_Registration_System SHALL prevent any status transition from "Pending Verification" to "Approved" without explicit Admin action
4. THE Garage_Registration_System SHALL prevent any status transition from "Pending Verification" to "Rejected" without explicit Admin action
5. WHEN Verification_Status is "Pending Verification" or "Rejected", THE Garage_Registration_System SHALL prevent the garage from receiving bookings
6. WHEN Verification_Status is "Approved", THE Garage_Registration_System SHALL allow the garage to receive bookings
7. THE Garage_Registration_System SHALL log all status transitions with timestamp, Admin identifier, and reason (for rejections)
8. THE Garage_Registration_System SHALL display the current Verification_Status prominently in the garage owner dashboard

### Requirement 8: Admin License Approval (Enables Garage Operation)

**User Story:** As an Admin, I want to approve valid licenses, so that legitimate garages can start receiving bookings.

**IMPORTANT:** Admin approval is the ONLY way a garage can transition from "Pending" to operational status. This is mandatory - garages cannot bypass this approval step.

#### Acceptance Criteria

1. WHEN an Admin approves a license, THE Admin_Verification_Interface SHALL update the Verification_Status to "Approved"
2. WHEN the Verification_Status changes to "Approved", THE Garage_Registration_System SHALL record the approval timestamp and Admin identifier
3. WHEN the Verification_Status changes to "Approved", THE Garage_Registration_System SHALL grant the garage access to Full_System_Services including booking management, analytics, and customer interactions
4. WHEN the Verification_Status changes to "Approved", THE Garage_Registration_System SHALL enable the garage to appear in car owner search results
5. WHEN the Verification_Status changes to "Approved", THE Garage_Registration_System SHALL send a notification to the Garage_Owner stating "Congratulations! Your license has been approved by an administrator. Your garage is now active and can receive bookings."
6. THE Admin_Verification_Interface SHALL require explicit admin action to approve - no automatic approvals are permitted

### Requirement 9: Admin License Rejection (Prevents Garage Operation)

**User Story:** As an Admin, I want to reject invalid licenses with a reason, so that garage owners understand why their application was denied and cannot operate until they provide valid documentation.

**IMPORTANT:** Rejected garages remain non-operational and cannot receive bookings until they resubmit a valid license and receive admin approval.

#### Acceptance Criteria

1. WHEN an Admin rejects a license, THE Admin_Verification_Interface SHALL require the Admin to provide a rejection reason
2. WHEN an Admin provides a rejection reason, THE Admin_Verification_Interface SHALL update the Verification_Status to "Rejected"
3. WHEN the Verification_Status changes to "Rejected", THE Garage_Registration_System SHALL record the rejection timestamp, Admin identifier, and rejection reason
4. WHEN the Verification_Status changes to "Rejected", THE Garage_Registration_System SHALL continue to prevent the garage from accessing Full_System_Services
5. WHEN the Verification_Status changes to "Rejected", THE Garage_Registration_System SHALL continue to prevent the garage from appearing in car owner search results
6. WHEN the Verification_Status changes to "Rejected", THE Garage_Registration_System SHALL send a notification to the Garage_Owner stating "Your license has been rejected by an administrator. Reason: [rejection reason]. Please upload a valid license document to resubmit for verification. You cannot receive bookings until your license is approved."
7. WHEN the Verification_Status is "Rejected", THE Garage_Registration_System SHALL allow the Garage_Owner to upload a new License_Document

### Requirement 10: License Re-upload After Rejection (Resets to Pending Status)

**User Story:** As a Garage_Owner, I want to upload a new license after rejection, so that I can correct issues and resubmit for admin verification.

**IMPORTANT:** Re-uploading a license resets the status to "Pending Verification" - the garage must wait for admin approval again before becoming operational.

#### Acceptance Criteria

1. WHEN the Verification_Status is "Rejected", THE Garage_Registration_System SHALL display the rejection reason prominently to the Garage_Owner
2. WHEN the Verification_Status is "Rejected", THE Garage_Registration_System SHALL provide a clear option to upload a new License_Document
3. WHEN a Garage_Owner uploads a new License_Document after rejection, THE Garage_Registration_System SHALL update the Verification_Status to "Pending Verification"
4. WHEN a new License_Document is uploaded, THE License_Storage_Service SHALL replace the previous License_Document with the new one
5. WHEN the status changes to "Pending Verification" after resubmission, THE Garage_Registration_System SHALL notify the Garage_Owner stating "Your new license has been submitted for admin verification. You will be notified once it is reviewed. You cannot receive bookings until approved."
6. THE Garage_Registration_System SHALL continue to restrict access to Full_System_Services until the new license is approved by an Admin

### Requirement 11: Malicious File Prevention

**User Story:** As a system administrator, I want to prevent malicious file uploads, so that the system remains secure from attacks.

#### Acceptance Criteria

1. WHEN a Garage_Owner uploads a License_Document, THE License_Validator SHALL scan the file for executable content
2. IF executable content is detected, THEN THE License_Validator SHALL reject the upload and display an error message stating "File contains invalid content"
3. THE License_Validator SHALL sanitize the original filename to remove special characters and path traversal sequences
4. THE License_Storage_Service SHALL store files with system-generated names rather than original filenames

### Requirement 12: Registration Form Integration

**User Story:** As a Garage_Owner, I want the license upload field integrated into the registration form, so that I can complete registration in one workflow.

#### Acceptance Criteria

1. THE License_Upload_Component SHALL be displayed within the garage registration form
2. THE License_Upload_Component SHALL display accepted file formats (PDF, JPG, PNG) and maximum file size (5MB)
3. WHEN a Garage_Owner selects a file, THE License_Upload_Component SHALL display the filename and file size
4. THE License_Upload_Component SHALL provide a button to remove the selected file and choose a different one
5. WHEN a file is selected, THE License_Upload_Component SHALL display a preview for image files (JPG, PNG)

### Requirement 13: Database Schema Update

**User Story:** As a developer, I want the garage database schema to include license fields, so that license information is properly persisted.

#### Acceptance Criteria

1. THE Garage_Registration_System SHALL store the license file path in the garage database record
2. THE Garage_Registration_System SHALL store the original filename in the garage database record
3. THE Garage_Registration_System SHALL store the file size in bytes in the garage database record
4. THE Garage_Registration_System SHALL store the upload timestamp in the garage database record
5. THE Garage_Registration_System SHALL store the Verification_Status in the garage database record
6. THE Garage_Registration_System SHALL store the verification timestamp in the garage database record
7. THE Garage_Registration_System SHALL store the verifying Admin identifier in the garage database record
8. THE Garage_Registration_System SHALL store the rejection reason in the garage database record when applicable

### Requirement 14: Existing Garage Migration (Applies Verification to All Garages)

**User Story:** As a system administrator, I want existing garages without licenses to be required to upload and get verified, so that all garages in the system go through the admin approval process.

**IMPORTANT:** This requirement ensures that existing garages (which were immediately active under the old system) must now also go through the admin verification workflow. No garage should bypass the approval requirement.

#### Acceptance Criteria

1. WHEN an existing garage without a License_Document logs in, THE Garage_Registration_System SHALL display a prominent notification stating "License verification is now required. Please upload your license document immediately. Your garage will be restricted from receiving new bookings until your license is verified and approved by an administrator."
2. WHEN an existing garage without a License_Document attempts to access Full_System_Services, THE Garage_Registration_System SHALL redirect to the license upload page
3. THE Garage_Registration_System SHALL set the Verification_Status to "Pending Verification" for existing garages once they upload a License_Document
4. THE Garage_Registration_System SHALL restrict existing garages without verified licenses from appearing in car owner search results
5. THE Garage_Registration_System SHALL allow existing garages to manage their current bookings but prevent them from receiving new bookings until license is approved

### Requirement 15: License Document Retrieval

**User Story:** As an Admin, I want to download license documents, so that I can perform offline verification if needed.

#### Acceptance Criteria

1. WHEN an Admin views a garage's license in the Admin_Verification_Interface, THE Admin_Verification_Interface SHALL provide a download button
2. WHEN an Admin clicks the download button, THE License_Storage_Service SHALL serve the License_Document with the original filename
3. THE License_Storage_Service SHALL log all license document downloads with Admin identifier and timestamp

### Requirement 16: Booking System Integration (CRITICAL - Prevents Bookings for Unverified Garages)

**User Story:** As a system administrator, I want the booking system to check verification status, so that car owners cannot create bookings with unverified garages.

**IMPORTANT:** This requirement ensures the booking system enforces the admin approval requirement. This fixes the current system where any garage can receive bookings immediately after registration.

#### Acceptance Criteria

1. WHEN a car owner attempts to create a booking, THE Garage_Registration_System SHALL verify the garage's Verification_Status is "Approved"
2. IF the Verification_Status is "Pending Verification" or "Rejected", THEN THE Garage_Registration_System SHALL reject the booking attempt and display an error message stating "This garage is not currently accepting bookings"
3. THE Garage_Registration_System SHALL exclude garages with Verification_Status "Pending Verification" or "Rejected" from all car owner search results and garage listings
4. WHEN displaying garage details to car owners, THE Garage_Registration_System SHALL only show garages with Verification_Status "Approved"
5. THE Garage_Registration_System SHALL prevent API calls from creating bookings for garages with Verification_Status other than "Approved"

