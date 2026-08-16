import {
  LayoutDashboard,
  Users,
  UserRound,
  School,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  FileText,
  CalendarDays,
  Wallet,
  Megaphone,
  BarChart3,
  Settings,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export type RoleNav = {
  items: NavItem[]
  // Routes that exist today; modules land one by one.
  disabled?: string[]
}

export const navByRole: Record<string, RoleNav> = {
  ADMIN: {
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Students', href: '/admin/students', icon: Users },
      { label: 'Staff', href: '/admin/staff', icon: UserRound },
      { label: 'Classes', href: '/admin/classes', icon: School },
      { label: 'Subjects', href: '/admin/subjects', icon: BookOpen },
      { label: 'Admissions', href: '/admin/admissions', icon: ClipboardList },
      { label: 'Attendance', href: '/admin/attendance', icon: CalendarCheck },
      { label: 'Exams & Grades', href: '/admin/exams', icon: FileText },
      { label: 'Timetable', href: '/admin/timetable', icon: CalendarDays },
      { label: 'Fees', href: '/admin/fees', icon: Wallet },
      { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
  TEACHER: {
    items: [
      { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
      { label: 'My Students', href: '/teacher/students', icon: Users },
      { label: 'Attendance', href: '/teacher/attendance', icon: CalendarCheck },
      { label: 'Exams & Grades', href: '/teacher/exams', icon: FileText },
      { label: 'Timetable', href: '/teacher/timetable', icon: CalendarDays },
      { label: 'Announcements', href: '/teacher/announcements', icon: Megaphone },
    ],
  },
  STUDENT: {
    items: [
      { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
      { label: 'Attendance', href: '/student/attendance', icon: CalendarCheck },
      { label: 'Results', href: '/student/grades', icon: GraduationCap },
      { label: 'Timetable', href: '/student/timetable', icon: CalendarDays },
      { label: 'Fees', href: '/student/fees', icon: Wallet },
      { label: 'Announcements', href: '/student/announcements', icon: Megaphone },
    ],
  },
  PARENT: {
    items: [
      { label: 'Dashboard', href: '/parent', icon: LayoutDashboard },
      { label: 'Attendance', href: '/parent/attendance', icon: CalendarCheck },
      { label: 'Results', href: '/parent/grades', icon: GraduationCap },
      { label: 'Timetable', href: '/parent/timetable', icon: CalendarDays },
      { label: 'Fees', href: '/parent/fees', icon: Wallet },
      { label: 'Announcements', href: '/parent/announcements', icon: Megaphone },
    ],
  },
}
