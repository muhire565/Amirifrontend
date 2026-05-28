export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAITER: 'waiter',
  CHEF: 'chef',
  DRIVER: 'driver',
};

export const PERMISSIONS = {
  MANAGE_STAFF: [ROLES.OWNER, ROLES.MANAGER],
  CREATE_STAFF: [ROLES.OWNER],
  EDIT_STAFF: [ROLES.OWNER],
  VIEW_REPORTS: [ROLES.OWNER, ROLES.MANAGER],
  MANAGE_MENU: [ROLES.OWNER, ROLES.MANAGER, ROLES.CHEF],
};

export const hasPermission = (userRole, allowedRoles) => {
  return allowedRoles.includes(userRole);
};
