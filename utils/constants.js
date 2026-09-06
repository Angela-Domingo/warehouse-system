// Central place for enums used across models/controllers so nothing is a "magic string" scattered
// across the codebase.

const ROLES = {
  STAFF: 'staff',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

const MOVEMENT_TYPES = {
  IN: 'in',
  OUT: 'out',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  ADJUSTMENT: 'adjustment',
};

const TRANSFER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

const ADJUSTMENT_REASONS = {
  DAMAGE: 'damage',
  THEFT: 'theft',
  RECOUNT: 'recount',
  EXPIRY: 'expiry',
  OTHER: 'other',
};

module.exports = {
  ROLES,
  MOVEMENT_TYPES,
  TRANSFER_STATUS,
  ADJUSTMENT_REASONS,
};
