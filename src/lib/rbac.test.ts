import { describe, it, expect } from 'vitest'
import { PERMISSIONS, hasPermission, hasAnyPermission, hasAllPermissions } from './rbac'

describe('RBAC', () => {
  describe('PERMISSIONS constant', () => {
    it('defines all resource groups', () => {
      const groups = Object.keys(PERMISSIONS)
      expect(groups).toContain('STUDENTS')
      expect(groups).toContain('STAFF')
      expect(groups).toContain('CLASSES')
      expect(groups).toContain('SUBJECTS')
      expect(groups).toContain('ATTENDANCE')
      expect(groups).toContain('EXAMS')
      expect(groups).toContain('FEES')
      expect(groups).toContain('ANNOUNCEMENTS')
      expect(groups).toContain('TIMETABLE')
      expect(groups).toContain('SETTINGS')
      expect(groups).toContain('ADMISSIONS')
      expect(groups).toContain('ANALYTICS')
      expect(groups).toContain('USERS')
      expect(groups).toContain('AUDIT')
      expect(groups).toContain('REPORTS')
    })

    it('every permission is a dotted string', () => {
      for (const group of Object.values(PERMISSIONS)) {
        for (const perm of Object.values(group)) {
          expect(perm).toMatch(/^\w+\.\w+$/)
        }
      }
    })
  })

  describe('hasPermission', () => {
    it('SUPER_ADMIN has all permissions', () => {
      const allPerms = Object.values(PERMISSIONS).flatMap(group => Object.values(group))
      for (const perm of allPerms) {
        expect(hasPermission('SUPER_ADMIN', perm)).toBe(true)
      }
    })

    it('STUDENT cannot create students', () => {
      expect(hasPermission('STUDENT', PERMISSIONS.STUDENTS.CREATE)).toBe(false)
    })

    it('STUDENT can read own student record', () => {
      expect(hasPermission('STUDENT', PERMISSIONS.STUDENTS.READ)).toBe(true)
    })

    it('TEACHER cannot delete staff', () => {
      expect(hasPermission('TEACHER', PERMISSIONS.STAFF.DELETE)).toBe(false)
    })

    it('TEACHER can create exams', () => {
      expect(hasPermission('TEACHER', PERMISSIONS.EXAMS.CREATE)).toBe(true)
    })

    it('TEACHER can write attendance', () => {
      expect(hasPermission('TEACHER', PERMISSIONS.ATTENDANCE.WRITE)).toBe(true)
    })

    it('TEACHER cannot update fees', () => {
      expect(hasPermission('TEACHER', PERMISSIONS.FEES.UPDATE)).toBe(false)
    })

    it('PARENT can read fees', () => {
      expect(hasPermission('PARENT', PERMISSIONS.FEES.READ)).toBe(true)
    })

    it('PARENT cannot confirm payments', () => {
      expect(hasPermission('PARENT', PERMISSIONS.FEES.CONFIRM)).toBe(false)
    })

    it('ADMIN has all permissions except USERS.MANAGE', () => {
      expect(hasPermission('ADMIN', PERMISSIONS.USERS.MANAGE)).toBe(false)
      expect(hasPermission('SUPER_ADMIN', PERMISSIONS.USERS.MANAGE)).toBe(true)
    })

    it('returns false for unknown role', () => {
      expect(hasPermission('UNKNOWN' as never, PERMISSIONS.STUDENTS.READ)).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('returns true when role has at least one permission', () => {
      expect(hasAnyPermission('STUDENT', PERMISSIONS.STUDENTS.CREATE, PERMISSIONS.STUDENTS.READ)).toBe(true)
    })

    it('returns false when role has none of the permissions', () => {
      expect(hasAnyPermission('STUDENT', PERMISSIONS.STUDENTS.CREATE, PERMISSIONS.STAFF.DELETE)).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('returns true when role has all permissions', () => {
      expect(hasAllPermissions('SUPER_ADMIN', PERMISSIONS.STUDENTS.READ, PERMISSIONS.STAFF.DELETE)).toBe(true)
    })

    it('returns false when role is missing one', () => {
      expect(hasAllPermissions('TEACHER', PERMISSIONS.STUDENTS.READ, PERMISSIONS.STAFF.DELETE)).toBe(false)
    })
  })

  describe('role separation', () => {
    it('TEACHER, STUDENT, PARENT cannot write settings', () => {
      for (const role of ['TEACHER', 'STUDENT', 'PARENT'] as const) {
        expect(hasPermission(role, PERMISSIONS.SETTINGS.UPDATE)).toBe(false)
      }
    })

    it('only admin-level roles can approve admissions', () => {
      expect(hasPermission('SUPER_ADMIN', PERMISSIONS.ADMISSIONS.APPROVE)).toBe(true)
      expect(hasPermission('ADMIN', PERMISSIONS.ADMISSIONS.APPROVE)).toBe(true)
      expect(hasPermission('TEACHER', PERMISSIONS.ADMISSIONS.APPROVE)).toBe(false)
      expect(hasPermission('STUDENT', PERMISSIONS.ADMISSIONS.APPROVE)).toBe(false)
      expect(hasPermission('PARENT', PERMISSIONS.ADMISSIONS.APPROVE)).toBe(false)
    })

    it('only admin-level roles can manage staff', () => {
      for (const perm of [PERMISSIONS.STAFF.CREATE, PERMISSIONS.STAFF.UPDATE, PERMISSIONS.STAFF.DELETE]) {
        expect(hasPermission('SUPER_ADMIN', perm)).toBe(true)
        expect(hasPermission('ADMIN', perm)).toBe(true)
        expect(hasPermission('TEACHER', perm)).toBe(false)
      }
    })

    it('STUDENT and PARENT have identical permissions', () => {
      const allPerms = Object.values(PERMISSIONS).flatMap(group => Object.values(group))
      for (const perm of allPerms) {
        expect(hasPermission('STUDENT', perm)).toBe(hasPermission('PARENT', perm))
      }
    })

    it('ADMIN cannot manage users (only SUPER_ADMIN can)', () => {
      expect(hasPermission('ADMIN', PERMISSIONS.USERS.MANAGE)).toBe(false)
      expect(hasPermission('SUPER_ADMIN', PERMISSIONS.USERS.MANAGE)).toBe(true)
    })
  })
})
