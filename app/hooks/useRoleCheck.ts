"use client";
import { useSession } from "next-auth/react";
import { UserRoleType, UserRole } from "@/types/roles";

export function useRoleCheck() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  return {
    hasRole: (requiredRole: UserRoleType) => userRole === requiredRole,
    hasAnyRole: (requiredRoles: UserRoleType[]) => 
      userRole ? requiredRoles.includes(userRole) : false,
    isAdmin: () => userRole === UserRole.ADMIN,
    isPsychologist: () => userRole === UserRole.PSICOLOGO,
    currentRole: userRole,
  };
}
