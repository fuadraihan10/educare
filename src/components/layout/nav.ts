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
  Bell,
  BarChart3,
  Settings,
  GraduationCap,
  KeyRound,
  MonitorDot,
  Shield,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  description: string
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export type RoleNav = {
  groups: NavGroup[]
  disabled?: string[]
}

export const navByRole: Record<string, RoleNav> = {
  SUPER_ADMIN: {
    groups: [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, description: 'School overview and quick actions' },
        ],
      },
      {
        label: 'People',
        items: [
          { label: 'Students', href: '/admin/students', icon: Users, description: 'Manage student records and profiles' },
          { label: 'Staff', href: '/admin/staff', icon: UserRound, description: 'Manage teachers and staff members' },
          { label: 'Users', href: '/admin/users', icon: Shield, description: 'Manage all user accounts and passwords' },
          { label: 'Classes', href: '/admin/classes', icon: School, description: 'Organize classes and sections' },
        ],
      },
      {
        label: 'Academics',
        items: [
          { label: 'Subjects', href: '/admin/subjects', icon: BookOpen, description: 'Manage subjects and curriculum' },
          { label: 'Exams', href: '/admin/exams', icon: FileText, description: 'Exams, grades, and report cards' },
          { label: 'Timetable', href: '/admin/timetable', icon: CalendarDays, description: 'Class schedules and timetables' },
          { label: 'Attendance', href: '/admin/attendance', icon: CalendarCheck, description: 'Track daily attendance records' },
        ],
      },
      {
        label: 'Finance',
        items: [
          { label: 'Fees', href: '/admin/fees', icon: Wallet, description: 'Fee collection and payment tracking' },
        ],
      },
      {
        label: 'Communication',
        items: [
          { label: 'Announcements', href: '/admin/announcements', icon: Megaphone, description: 'School-wide announcements and notices' },
          { label: 'Notifications', href: '/notifications', icon: Bell, description: 'View your notifications' },
        ],
      },
      {
        label: 'System',
        items: [
          { label: 'Settings', href: '/admin/settings', icon: Settings, description: 'System configuration and preferences' },
          { label: 'Admissions', href: '/admin/admissions', icon: ClipboardList, description: 'Manage admission applications' },
          { label: 'Password Resets', href: '/admin/password-resets', icon: KeyRound, description: 'Review password reset requests and generate PINs' },
          { label: 'Active Sessions', href: '/admin/active-sessions', icon: MonitorDot, description: 'View all active user sessions across the system' },
          { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, description: 'Reports and data analytics' },
        ],
      },
    ],
  },
  ADMIN: {
    groups: [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, description: 'School overview and quick actions' },
        ],
      },
      {
        label: 'People',
        items: [
          { label: 'Students', href: '/admin/students', icon: Users, description: 'Manage student records and profiles' },
          { label: 'Staff', href: '/admin/staff', icon: UserRound, description: 'Manage teachers and staff members' },
          { label: 'Users', href: '/admin/users', icon: Shield, description: 'Manage all user accounts and passwords' },
          { label: 'Classes', href: '/admin/classes', icon: School, description: 'Organize classes and sections' },
        ],
      },
      {
        label: 'Academics',
        items: [
          { label: 'Subjects', href: '/admin/subjects', icon: BookOpen, description: 'Manage subjects and curriculum' },
          { label: 'Exams', href: '/admin/exams', icon: FileText, description: 'Exams, grades, and report cards' },
          { label: 'Timetable', href: '/admin/timetable', icon: CalendarDays, description: 'Class schedules and timetables' },
          { label: 'Attendance', href: '/admin/attendance', icon: CalendarCheck, description: 'Track daily attendance records' },
        ],
      },
      {
        label: 'Finance',
        items: [
          { label: 'Fees', href: '/admin/fees', icon: Wallet, description: 'Fee collection and payment tracking' },
        ],
      },
      {
        label: 'Communication',
        items: [
          { label: 'Announcements', href: '/admin/announcements', icon: Megaphone, description: 'School-wide announcements and notices' },
          { label: 'Notifications', href: '/notifications', icon: Bell, description: 'View your notifications' },
        ],
      },
      {
        label: 'System',
        items: [
          { label: 'Settings', href: '/admin/settings', icon: Settings, description: 'System configuration and preferences' },
          { label: 'Admissions', href: '/admin/admissions', icon: ClipboardList, description: 'Manage admission applications' },
          { label: 'Password Resets', href: '/admin/password-resets', icon: KeyRound, description: 'Review password reset requests and generate PINs' },
          { label: 'Active Sessions', href: '/admin/active-sessions', icon: MonitorDot, description: 'View all active user sessions across the system' },
          { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, description: 'Reports and data analytics' },
        ],
      },
    ],
  },
  TEACHER: {
    groups: [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard, description: 'Your teaching dashboard' },
        ],
      },
      {
        label: 'Teaching',
        items: [
          { label: 'Attendance', href: '/teacher/attendance', icon: CalendarCheck, description: 'Mark and manage attendance' },
          { label: 'Exams', href: '/teacher/exams', icon: FileText, description: 'Create exams and enter grades' },
          { label: 'Timetable', href: '/teacher/timetable', icon: CalendarDays, description: 'Your class schedule' },
        ],
      },
      {
        label: 'Communication',
        items: [
          { label: 'Announcements', href: '/teacher/announcements', icon: Megaphone, description: 'View school announcements' },
          { label: 'Notifications', href: '/notifications', icon: Bell, description: 'View your notifications' },
        ],
      },
    ],
  },
  STUDENT: {
    groups: [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard', href: '/student', icon: LayoutDashboard, description: 'Your student dashboard' },
        ],
      },
      {
        label: 'Academics',
        items: [
          { label: 'Attendance', href: '/student/attendance', icon: CalendarCheck, description: 'View your attendance record' },
          { label: 'Results', href: '/student/grades', icon: GraduationCap, description: 'View your exam results and grades' },
          { label: 'Timetable', href: '/student/timetable', icon: CalendarDays, description: 'Your class timetable' },
        ],
      },
      {
        label: 'Finance',
        items: [
          { label: 'Fees', href: '/student/fees', icon: Wallet, description: 'View and pay school fees' },
        ],
      },
      {
        label: 'Communication',
        items: [
          { label: 'Announcements', href: '/student/announcements', icon: Megaphone, description: 'View school announcements' },
          { label: 'Notifications', href: '/notifications', icon: Bell, description: 'View your notifications' },
        ],
      },
    ],
  },
  PARENT: {
    groups: [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard', href: '/parent', icon: LayoutDashboard, description: 'Your parent dashboard' },
        ],
      },
      {
        label: 'Academics',
        items: [
          { label: 'Attendance', href: '/parent/attendance', icon: CalendarCheck, description: "View your child's attendance" },
          { label: 'Results', href: '/parent/grades', icon: GraduationCap, description: "View your child's exam results" },
          { label: 'Timetable', href: '/parent/timetable', icon: CalendarDays, description: "View your child's class schedule" },
        ],
      },
      {
        label: 'Finance',
        items: [
          { label: 'Fees', href: '/parent/fees', icon: Wallet, description: 'View and pay school fees' },
        ],
      },
      {
        label: 'Communication',
        items: [
          { label: 'Announcements', href: '/parent/announcements', icon: Megaphone, description: 'View school announcements' },
          { label: 'Notifications', href: '/notifications', icon: Bell, description: 'View your notifications' },
        ],
      },
    ],
  },
}
