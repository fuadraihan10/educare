import 'dotenv/config'
import { PrismaClient, Role, UserStatus, StudentStatus, Gender, AttendanceStatus } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

async function main() {
  console.log('Seeding database...')

  // 1. School
  console.log('Creating school...')
  const school = await prisma.school.upsert({
    where: { id: 'seed-school-001' },
    update: {},
    create: {
      id: 'seed-school-001',
      name: 'Educare Ideal School and College',
      shortName: 'EISC',
      address: 'Dhaka, Bangladesh',
      city: 'Dhaka',
      phone: '+880-1700-000000',
      email: 'info@educare.edu.bd',
      timezone: 'UTC',
    },
  })

  // 2. Academic year
  console.log('Creating academic year...')
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2026-2027' },
    update: { isActive: true },
    create: {
      id: 'seed-ay-001',
      name: '2026-2027',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-06-30'),
      isActive: true,
      schoolId: school.id,
    },
  })

  await prisma.school.update({
    where: { id: school.id },
    data: { currentAcademicYearId: academicYear.id },
  })

  // 3. Terms
  console.log('Creating terms...')
  const term1 = await prisma.term.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: 'Term 1' } },
    update: {},
    create: {
      id: 'seed-term-001',
      academicYearId: academicYear.id,
      name: 'Term 1',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-15'),
      isActive: true,
    },
  })

  // 4. Classes
  console.log('Creating classes...')
  const classNames = [
    { name: 'Class 6', section: 'Proton', code: 'CLS6-PRO', room: 'Room 101' },
    { name: 'Class 6', section: 'A', code: 'CLS6-A', room: 'Room 102' },
    { name: 'Class 6', section: 'B', code: 'CLS6-B', room: 'Room 103' },
    { name: 'Class 7', section: 'A', code: 'CLS7-A', room: 'Room 201' },
    { name: 'Class 7', section: 'B', code: 'CLS7-B', room: 'Room 202' },
    { name: 'Class 8', section: 'A', code: 'CLS8-A', room: 'Room 301' },
    { name: 'Class 9', section: 'A', code: 'CLS9-A', room: 'Room 401' },
  ]

  const classes = []
  for (let i = 0; i < classNames.length; i++) {
    const cls = await prisma.class.upsert({
      where: { code: classNames[i].code },
      update: {},
      create: {
        id: `seed-class-${String(i + 1).padStart(3, '0')}`,
        ...classNames[i],
        academicYearId: academicYear.id,
      },
    })
    classes.push(cls)
  }

  // 5. Subjects
  console.log('Creating subjects...')
  const subjectNames = [
    { name: 'Mathematics', code: 'MATH', description: 'Core mathematics' },
    { name: 'English', code: 'ENG', description: 'English language and literature' },
    { name: 'Science', code: 'SCI', description: 'General science' },
    { name: 'History', code: 'HIST', description: 'World history' },
    { name: 'Geography', code: 'GEO', description: 'Physical and human geography' },
    { name: 'Art', code: 'ART', description: 'Visual arts' },
    { name: 'Physical Education', code: 'PE', description: 'Physical education and sports' },
    { name: 'Computer Science', code: 'CS', description: 'Computer fundamentals' },
  ]

  const subjects = []
  for (let i = 0; i < subjectNames.length; i++) {
    const subj = await prisma.subject.upsert({
      where: { code: subjectNames[i].code },
      update: {},
      create: {
        id: `seed-subject-${String(i + 1).padStart(3, '0')}`,
        ...subjectNames[i],
      },
    })
    subjects.push(subj)
  }

  // 6. Admin user
  console.log('Creating admin user...')
  const adminPassword = await hash('Admin@12345', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@educare.edu.bd' },
    update: {},
    create: {
      id: 'seed-admin-001',
      regNo: 'ADM-0001',
      email: 'admin@educare.edu.bd',
      passwordHash: adminPassword,
      name: 'System Administrator',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      schoolId: school.id,
    },
  })

  // 7. Teacher user
  console.log('Creating teacher user...')
  const teacherPassword = await hash('Teacher@12345', 12)
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@educare.edu.bd' },
    update: {},
    create: {
      id: 'seed-teacher-user-001',
      regNo: 'TCH-0001',
      email: 'teacher@educare.edu.bd',
      passwordHash: teacherPassword,
      name: 'Test Teacher',
      role: Role.TEACHER,
      status: UserStatus.ACTIVE,
      schoolId: school.id,
    },
  })

  const teacher = await prisma.teacher.upsert({
    where: { employeeId: 'T001' },
    update: {},
    create: {
      id: 'seed-teacher-001',
      userId: teacherUser.id,
      employeeId: 'T001',
      name: 'Test Teacher',
      email: 'teacher@educare.edu.bd',
      gender: Gender.MALE,
      qualification: 'M.Sc Mathematics',
      specialization: 'Mathematics',
      designation: 'Senior Teacher',
      status: UserStatus.ACTIVE,
    },
  })

  // 8. Student user
  console.log('Creating student user...')
  const studentPassword = await hash('Student@12345', 12)
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@educare.edu.bd' },
    update: {},
    create: {
      id: 'seed-student-user-001',
      regNo: 'STU-2026-0001',
      email: 'student@educare.edu.bd',
      passwordHash: studentPassword,
      name: 'Test Student',
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
      schoolId: school.id,
    },
  })

  const student = await prisma.student.upsert({
    where: { admissionNo: 'ADM001' },
    update: {},
    create: {
      id: 'seed-student-001',
      userId: studentUser.id,
      admissionNo: 'ADM001',
      firstName: 'Test',
      lastName: 'Student',
      dob: new Date('2012-03-15'),
      gender: Gender.MALE,
      guardianName: 'Test Parent',
      guardianRelation: 'Father',
      guardianPhone: '+880-1700-000001',
      classId: classes[0].id,
      rollNo: 1,
      status: StudentStatus.ACTIVE,
    },
  })

  // 9. Parent user
  console.log('Creating parent user...')
  const parentPassword = await hash('Parent@12345', 12)
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@educare.edu.bd' },
    update: {},
    create: {
      id: 'seed-parent-user-001',
      regNo: 'PAR-0001',
      email: 'parent@educare.edu.bd',
      passwordHash: parentPassword,
      name: 'Test Parent',
      role: Role.PARENT,
      status: UserStatus.ACTIVE,
      schoolId: school.id,
    },
  })

  // Link parent to student
  await prisma.studentGuardian.upsert({
    where: { studentId_parentUserId: { studentId: student.id, parentUserId: parentUser.id } },
    update: {},
    create: {
      id: 'seed-guardian-001',
      studentId: student.id,
      parentUserId: parentUser.id,
      relation: 'Father',
    },
  })

  // 10. Teacher assignment
  console.log('Creating teacher assignments...')
  await prisma.teacherAssignment.upsert({
    where: { classId_subjectId_academicYearId: { classId: classes[0].id, subjectId: subjects[0].id, academicYearId: academicYear.id } },
    update: {},
    create: {
      id: 'seed-assign-001',
      classId: classes[0].id,
      subjectId: subjects[0].id,
      teacherId: teacher.id,
      academicYearId: academicYear.id,
    },
  })

  // Set class teacher
  await prisma.class.update({ where: { id: classes[0].id }, data: { classTeacherId: teacher.id } })

  // 11. Grade scales
  console.log('Creating grade scales...')
  const gradeScales = [
    { label: 'A+', minPercent: 90, maxPercent: 100, points: 4.0, order: 1 },
    { label: 'A', minPercent: 80, maxPercent: 89.99, points: 3.7, order: 2 },
    { label: 'B+', minPercent: 70, maxPercent: 79.99, points: 3.3, order: 3 },
    { label: 'B', minPercent: 60, maxPercent: 69.99, points: 3.0, order: 4 },
    { label: 'C+', minPercent: 50, maxPercent: 59.99, points: 2.3, order: 5 },
    { label: 'C', minPercent: 40, maxPercent: 49.99, points: 2.0, order: 6 },
    { label: 'D', minPercent: 30, maxPercent: 39.99, points: 1.0, order: 7 },
    { label: 'F', minPercent: 0, maxPercent: 29.99, points: 0.0, order: 8 },
  ]

  for (const gs of gradeScales) {
    await prisma.gradeScale.upsert({
      where: { label: gs.label },
      update: {},
      create: { id: `seed-grade-${gs.label.replace('+', 'plus')}`, ...gs, isActive: true },
    })
  }

  // 12. Assessments and marks
  console.log('Creating assessments and marks...')
  const assessment = await prisma.assessment.upsert({
    where: { id: 'seed-assessment-001' },
    update: {},
    create: {
      id: 'seed-assessment-001',
      classId: classes[0].id,
      subjectId: subjects[0].id,
      termId: term1.id,
      teacherId: teacher.id,
      name: 'Midterm Exam',
      type: 'MIDTERM',
      maxMarks: 100,
      weight: 1,
      date: new Date('2026-10-15'),
      isPublished: true,
    },
  })

  await prisma.mark.upsert({
    where: { assessmentId_studentId: { assessmentId: assessment.id, studentId: student.id } },
    update: {},
    create: {
      id: 'seed-mark-001',
      assessmentId: assessment.id,
      studentId: student.id,
      marksObtained: 85,
      grade: 'A',
      createdById: adminUser.id,
    },
  })

  // 13. Attendance
  console.log('Creating attendance...')
  const today = new Date()
  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)

  for (let day = 0; day < 5; day++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + day)

    const statuses: AttendanceStatus[] = ['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'ABSENT']
    await prisma.attendance.upsert({
      where: { studentId_classId_date: { studentId: student.id, classId: classes[0].id, date } },
      update: {},
      create: {
        id: `seed-att-${day}`,
        studentId: student.id,
        classId: classes[0].id,
        date,
        status: statuses[day],
        markedById: teacherUser.id,
      },
    })
  }

  // 14. Fee structure and invoice
  console.log('Creating fee records...')
  const feeStructure = await prisma.feeStructure.upsert({
    where: { id: 'seed-fee-struct-001' },
    update: {},
    create: {
      id: 'seed-fee-struct-001',
      name: 'Tuition Fee - Term 1',
      description: 'Term 1 tuition fee for Grade 6',
      amount: 15000,
      classId: classes[0].id,
      termId: term1.id,
    },
  })

  await prisma.invoice.upsert({
    where: { invoiceNo: 'INV-2026-001' },
    update: {},
    create: {
      id: 'seed-invoice-001',
      invoiceNo: 'INV-2026-001',
      studentId: student.id,
      termId: term1.id,
      issueDate: new Date('2026-09-01'),
      dueDate: new Date('2026-09-30'),
      status: 'PAID',
      totalAmount: 15000,
      createdById: adminUser.id,
      items: {
        create: { feeStructureId: feeStructure.id, description: 'Tuition Fee', amount: 15000 },
      },
    },
  })

  // 15. Announcement
  console.log('Creating announcement...')
  await prisma.announcement.create({
    data: {
      id: 'seed-announce-001',
      title: 'Welcome to 2026-2027 Academic Year',
      body: 'We welcome all students, teachers, and parents to the new academic year. Please check your schedules and fee payment deadlines.',
      audience: 'ALL',
      createdById: adminUser.id,
    },
  })

  // 16. Timetable
  console.log('Creating timetable...')
  await prisma.timetableEntry.upsert({
    where: { classId_termId_dayOfWeek_period: { classId: classes[0].id, termId: term1.id, dayOfWeek: 'MONDAY', period: 1 } },
    update: {},
    create: {
      id: 'seed-tt-001',
      classId: classes[0].id,
      subjectId: subjects[0].id,
      teacherId: teacher.id,
      termId: term1.id,
      dayOfWeek: 'MONDAY',
      period: 1,
      startTime: '08:00',
      endTime: '08:45',
      room: 'Room 101',
    },
  })

  // 17. Sample notifications
  console.log('Creating sample notifications...')
  const now = new Date()
  const notifications = [
    { userId: adminUser.id, title: 'Welcome to Educare SMS', body: 'Your admin account is ready. Start by reviewing pending admissions and setting up classes.', type: 'info', category: 'system', link: '/admin' },
    { userId: adminUser.id, title: 'New Admission Application', body: 'A new admission application has been submitted and is awaiting review.', type: 'info', category: 'admissions', entity: 'AdmissionApplication', link: '/admin/admissions' },
    { userId: teacherUser.id, title: 'Welcome Back!', body: 'Your teaching dashboard is ready. Check your timetable and today\'s classes.', type: 'info', category: 'system', link: '/teacher' },
    { userId: teacherUser.id, title: 'New Class Assignment', body: 'You have been assigned to teach Mathematics for Class 1-A.', type: 'success', category: 'staff', entity: 'Class', link: '/teacher/timetable' },
    { userId: studentUser.id, title: 'School Fees Reminder', body: 'Your tuition fee for Term 1 is due. Please check your fee status.', type: 'warning', category: 'fees', entity: 'Invoice', link: '/student/fees' },
    { userId: studentUser.id, title: 'Exam Schedule Published', body: 'The midterm exam schedule has been published. Check the exam page for details.', type: 'info', category: 'exams', entity: 'Exam', link: '/student/grades' },
    { userId: parentUser.id, title: 'Attendance Alert', body: 'Your child was marked absent today. Please review the attendance record.', type: 'warning', category: 'attendance', entity: 'Attendance', link: '/parent/attendance' },
    { userId: parentUser.id, title: 'New Announcement', body: 'A school-wide announcement about the upcoming parent-teacher meeting has been posted.', type: 'info', category: 'announcements', entity: 'Announcement', link: '/parent/announcements' },
  ]
  for (let i = 0; i < notifications.length; i++) {
    await prisma.notification.upsert({
      where: { id: `seed-notif-${String(i + 1).padStart(3, '0')}` },
      update: {},
      create: {
        id: `seed-notif-${String(i + 1).padStart(3, '0')}`,
        ...notifications[i],
        type: notifications[i].type,
        category: notifications[i].category,
        createdAt: new Date(now.getTime() - (notifications.length - i) * 3600000),
        deliveries: {
          create: [
            { channel: 'in_app', status: 'sent', sentAt: new Date(now.getTime() - (notifications.length - i) * 3600000) },
          ],
        },
      },
    })
  }

  console.log('Seed completed successfully!')
  console.log('')
  console.log('Test accounts:')
  console.log('  Admin:   ADM-0001 / Admin@12345')
  console.log('  Teacher: TCH-0001 / Teacher@12345')
  console.log('  Student: STU-2026-0001 / Student@12345')
  console.log('  Parent:  PAR-0001 / Parent@12345')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
