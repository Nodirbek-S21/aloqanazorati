
export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  OPERATOR = "OPERATOR"
}

export type VisitStatus = "will_come" | "wont_come" | "thinking" | "no_answer";

export interface Lead {
  id: string;
  name: string;
  surname: string;
  school: string;
  phone: string;
  status: "new" | "called";
  assignedTo?: string;
  extraData?: { label: string, value: string }[];
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface Report {
  id: string;
  operatorId: string;
  operatorName: string;
  branchId: string;
  timestamp: string; // ISO string
  leadId?: string;
  clientName?: string;
  clientPhone?: string;
  visitStatus: VisitStatus;
  tasksCompleted: string;
  callDuration?: string;
  status: "pending" | "reviewed";
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  password?: string; // Menejer va Admin uchun
  branchId?: string;
  createdAt: string;
  isApproved?: boolean; // Admin tomonidan tasdiqlanganlik holati
}
