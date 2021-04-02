import { userRoles } from './common';


export const
canWriteBlogArticle = [
  userRoles.deus,
  userRoles.admin,
  userRoles.blogAdmin,
  userRoles.blogWriter
],
canDeleteBlogArticle = [
  userRoles.deus,
  userRoles.admin,
  userRoles.blogAdmin
]

export const canManageBlogComments = [
  userRoles.deus,
  userRoles.admin,
  userRoles.blogAdmin
]
