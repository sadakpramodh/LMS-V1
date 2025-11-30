export interface Permission {
  id: string;
  name: string;
  description: string;
  module: "litigation" | "pre-litigation" | "arbitration" | "admin" | "users";
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissionIds: string[];
  isSystem?: boolean;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  roleIds: string[];
  userIds: string[];
}

// Re-exporting LocalUser extension in localData.ts or keeping it here?
// The plan said "Extend LocalUser". Since LocalUser is in localData.ts, 
// I will keep the base definitions here and update localData.ts to use/extend them.
