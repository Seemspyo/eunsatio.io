import { ValueOf } from '@eunsatio.io/util/dist/type-def';


export const userRoles = {
  deus: 'deus',
  admin: 'admin',
  blogAdmin: 'blogAdmin',
  blogWriter: 'blogWriter',
  common: 'common'
} as const;

export type UserRole = ValueOf<typeof userRoles>;

export const allUsers = Object.values(userRoles);

export const canUploadImage = Object.values(userRoles);

export const canManageUsers = [
  userRoles.deus,
  userRoles.admin
]
