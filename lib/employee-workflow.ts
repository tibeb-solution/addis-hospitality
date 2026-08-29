export type WorkflowStep = { key: string; label: string; complete: boolean; status: string; href: string }

export function getEmployeeWorkflow(profile: any, cv: any, documents: any[]): WorkflowStep[] {
  const profileComplete = Boolean(profile && [profile.full_name, profile.phone, profile.gender, profile.date_of_birth, profile.emergency_contact_name, profile.emergency_contact_relationship, profile.emergency_contact_phone, profile.desired_position, profile.highest_education].every(Boolean))
  const cvSubmitted = cv?.status === "submitted" || cv?.status === "approved"
  const cvApproved = cv?.status === "approved"
  const bothComplete = profileComplete && cvSubmitted
  
  let profileStepLabel = "Complete your profile"
  let profileStepStatus = "Required"
  if (profileComplete && !cvSubmitted) {
    profileStepLabel = "Complete CV"
    profileStepStatus = "Required"
  } else if (cvSubmitted && !profileComplete) {
    profileStepLabel = "Complete profile"
    profileStepStatus = "Required"
  } else if (bothComplete) {
    profileStepLabel = "Profile and CV completed"
    profileStepStatus = "Completed"
  }
  
  const employeeIdApproved = documents.some((doc) => ["national_id", "passport"].includes(doc.document_type) && doc.holder_type !== "collateral_relative" && doc.status === "approved")
  const collateralApproved = documents.some((doc) => doc.holder_type === "collateral_relative" && doc.status === "approved")
  return [
    { key: "profile", label: profileStepLabel, complete: bothComplete, status: profileStepStatus, href: "/employee/settings" },
    { key: "cv", label: "Submit and receive CV approval", complete: cvApproved, status: cv?.status === "rejected" ? "Needs changes" : cv?.status === "submitted" ? "Waiting for admin" : "Required", href: "/employee/cv" },
    { key: "employee-id", label: "Upload an approved ID document", complete: employeeIdApproved, status: employeeIdApproved ? "Completed" : "Required", href: "/employee/documents" },
    { key: "collateral", label: "Upload an approved collateral relative document", complete: collateralApproved, status: collateralApproved ? "Completed" : "Required", href: "/employee/documents" },
    { key: "account", label: "Admin approval", complete: profile?.status === "active", status: profile?.status === "active" ? "Completed" : "Waiting for admin", href: "/employee" },
  ]
}

export function canAccessEmployeeId(profile: any, cv: any, documents: any[]) {
  return getEmployeeWorkflow(profile, cv, documents).every((step) => step.complete)
}
