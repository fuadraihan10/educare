/**
 * Deterministic dev seed for the SMS.
 *
 * Generates one school, admin + ~10 teachers + ~50 students + parents, two
 * academic years, classes/sections, subject assignments, attendance for the
 * last school days, term-1 assessments with marks, invoices and confirmed
 * payments, and announcements. No real people's data.
 *
 * All synthetic data is derived from a fixed RNG seed, so re-seeding produces
 * identical output. This script DELETES existing rows first — it is intended
 * for local/dev databases only.
 *
 * Run: npm run db:seed
 */
import 'dotenv/config'

import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

// ---- deterministic RNG -----------------------------------------------------
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260816)
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length) % arr.length]
const pickInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))

// ---- constants -------------------------------------------------------------
const ADMIN_PASSWORD = 'Admin@123'
const TEACHER_PASSWORD = 'Teacher@123'
const STUDENT_PASSWORD = 'Student@123'
const PARENT_PASSWORD = 'Parent@123'

const lastNames = ['Khan', 'Rahman', 'Ahmed', 'Chowdhury', 'Islam', 'Hossain', 'Mia', 'Uddin', 'Sarker', 'Das', 'Roy', 'Karim', 'Hasan', 'Ali', 'Chandra', 'Bose']
const maleNames = ['Aarav', 'Liam', 'Noah', 'Ethan', 'Oliver', 'Lucas', 'Mason', 'Elijah', 'James', 'Leo']
const femaleNames = ['Maya', 'Zara', 'Ivy', 'Aisha', 'Diya', 'Meera', 'Nadia', 'Anya', 'Sara', 'Inaya']
const guardianRelations = ['Father', 'Mother', 'Guardian']
const guardians = ['A. Rahman', 'S. Begum', 'M. Hossain', 'F. Akter', 'K. Islam', 'T. Sultana', 'R. Ahmed', 'N. Chowdhury']

const assessmentNames = ['Chapter Quiz', 'Midterm', 'Class Test', 'Final Exam']
const assessmentTypes = ['QUIZ', 'MIDTERM', 'CLASSWORK', 'FINAL'] as const
const assessmentTypeList: (typeof assessmentTypes)[number][] = [...assessmentTypes]

const subjectDefs = [
  { name: 'Mathematics', code: 'MATH', weight: 2 },
  { name: 'English', code: 'ENG', weight: 1 },
  { name: 'Science', code: 'SCI', weight: 1 },
  { name: 'Bangla', code: 'BAN', weight: 1 },
  { name: 'Social Studies', code: 'SOC', weight: 1 },
  { name: 'ICT', code: 'ICT', weight: 1 },
  { name: 'Physical Education', code: 'PE', weight: 0.5 },
]

// ---- helpers ---------------------------------------------------------------
function toDateOnly(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(12, 0, 0, 0)
  return copy
}

async function main() {
  console.log('Seeding…')

  // ---- wipe (dev only) -----------------------------------------------------
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoiceItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.feeStructure.deleteMany(),
    prisma.timetableEntry.deleteMany(),
    prisma.mark.deleteMany(),
    prisma.assessment.deleteMany(),
    prisma.gradeScale.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.studentGuardian.deleteMany(),
    prisma.admissionApplication.deleteMany(),
    prisma.studentFile.deleteMany(),
    prisma.teacherAssignment.deleteMany(),
    prisma.student.deleteMany(),
    prisma.teacher.deleteMany(),
    prisma.class.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.term.deleteMany(),
    prisma.academicYear.deleteMany(),
    prisma.setting.deleteMany(),
    prisma.user.deleteMany(),
    prisma.school.deleteMany(),
  ])

  // ---- school & settings ---------------------------------------------------
  const school = await prisma.school.create({
    data: { name: 'Sunrise International School', shortName: 'SIS', address: '12 Lake Road, Gulshan', city: 'Dhaka', phone: '+880 2 555 1212', email: 'info@sunriseschool.example', timezone: 'Asia/Dhaka' },
  })

  const yearCurrent = await prisma.academicYear.create({
    data: { name: '2026-2027', startDate: toDateOnly(new Date(2026, 0, 1)), endDate: toDateOnly(new Date(2026, 11, 31)), isActive: true, schoolId: school.id },
  })
  await prisma.academicYear.create({
    data: { name: '2025-2026', startDate: toDateOnly(new Date(2025, 0, 1)), endDate: toDateOnly(new Date(2025, 11, 31)), isActive: false, schoolId: school.id },
  })
  await prisma.school.update({ where: { id: school.id }, data: { currentAcademicYearId: yearCurrent.id } })

  const term1 = await prisma.term.create({
    data: { academicYearId: yearCurrent.id, name: 'Term 1', startDate: toDateOnly(new Date(2026, 0, 1)), endDate: toDateOnly(new Date(2026, 3, 30)), isActive: true },
  })
  await prisma.term.create({
    data: { academicYearId: yearCurrent.id, name: 'Term 2', startDate: toDateOnly(new Date(2026, 4, 1)), endDate: toDateOnly(new Date(2026, 11, 20)), isActive: false },
  })

  const gradeScale = [
    { label: 'A+', minPercent: 90, maxPercent: 100, points: 4.0, order: 0 },
    { label: 'A', minPercent: 85, maxPercent: 89, points: 3.7, order: 1 },
    { label: 'B+', minPercent: 80, maxPercent: 84, points: 3.3, order: 2 },
    { label: 'B', minPercent: 75, maxPercent: 79, points: 3.0, order: 3 },
    { label: 'C+', minPercent: 70, maxPercent: 74, points: 2.7, order: 4 },
    { label: 'C', minPercent: 65, maxPercent: 69, points: 2.3, order: 5 },
    { label: 'D', minPercent: 60, maxPercent: 64, points: 2.0, order: 6 },
    { label: 'F', minPercent: 0, maxPercent: 59, points: 0.0, order: 7 },
  ]
  await prisma.gradeScale.createMany({ data: gradeScale.map((g) => ({ ...g, minPercent: g.minPercent, maxPercent: g.maxPercent })) })

  await prisma.setting.createMany({
    data: [
      { key: 'school.gradingScaleVersion', value: 'default-10-point', schoolId: school.id },
      { key: 'school.academicYearName', value: yearCurrent.name, schoolId: school.id },
    ],
  })

  // ---- users ---------------------------------------------------------------
  const adminUser = await prisma.user.create({
    data: { email: 'admin@school.example', passwordHash: await hash(ADMIN_PASSWORD, 10), name: 'Admin User', role: 'ADMIN', schoolId: school.id },
  })

  // ---- subjects ------------------------------------------------------------
  const subjects = []
  for (const s of subjectDefs) {
    subjects.push(await prisma.subject.create({ data: { name: s.name, code: s.code } }))
  }

  // ---- teachers ------------------------------------------------------------
  const teachers = []
  const designations = ['Senior Teacher', 'Teacher', 'Assistant Teacher', 'Coordinator']
  for (let i = 1; i <= 10; i++) {
    const gender = i % 2 === 0 ? 'FEMALE' : 'MALE'
    const user = await prisma.user.create({
      data: {
        email: `teacher${i}@school.example`,
        passwordHash: await hash(TEACHER_PASSWORD, 10),
        name: `${gender === 'FEMALE' ? 'Ms.' : 'Mr.'} Teacher ${i}`,
        role: 'TEACHER',
        schoolId: school.id,
      },
    })
    teachers.push(
      await prisma.teacher.create({
        data: {
          userId: user.id,
          employeeId: `EMP-${String(i).padStart(3, '0')}`,
          name: user.name,
          email: user.email,
          phone: `+880 17${String(10000000 + i).slice(0, 8)}`,
          gender: gender as 'MALE' | 'FEMALE',
          dob: toDateOnly(new Date(1980 + i, i % 12, (i % 27) + 1)),
          qualification: 'B.Ed / M.Sc',
          designation: pick(designations),
          specialization: subjects[i % subjects.length].name,
        },
      }),
    )
  }

  // ---- classes -------------------------------------------------------------
  const classDefs: { name: string; section: string }[] = []
  for (const grade of [6, 7, 8, 9, 10]) {
    for (const section of ['A', 'B']) {
      classDefs.push({ name: `Grade ${grade}`, section })
    }
  }

  const classes = []
  for (const [i, c] of classDefs.entries()) {
    const cls = await prisma.class.create({
      data: {
        name: c.name,
        section: c.section,
        code: `G${c.name.split(' ')[1]}-${c.section}`,
        room: `Room ${100 + i}`,
        academicYearId: yearCurrent.id,
        classTeacherId: teachers[i % teachers.length].id,
      },
    })
    classes.push(cls)
  }

  // ---- teacher assignments (each class: each subject to a teacher) ---------
  for (const cls of classes) {
    for (const [si, subject] of subjects.entries()) {
      const teacher = teachers[(classes.indexOf(cls) + si) % teachers.length]
      await prisma.teacherAssignment.create({
        data: { classId: cls.id, subjectId: subject.id, teacherId: teacher.id, academicYearId: yearCurrent.id },
      })
    }
  }

  // ---- students ------------------------------------------------------------
  const students = []
  for (let i = 1; i <= 50; i++) {
    const gender = rand() > 0.5 ? 'MALE' : 'FEMALE'
    const namePool = gender === 'MALE' ? maleNames : femaleNames
    const firstName = pick(namePool)
    const lastName = pick(lastNames)
    const cls = classes[(i - 1) % classes.length]
    const guardian = pick(guardians)
    const relation = pick(guardianRelations)
    const hasUserAccount = i <= 30
    const user = hasUserAccount
      ? await prisma.user.create({
          data: {
            email: `student${i}@school.example`,
            passwordHash: await hash(STUDENT_PASSWORD, 10),
            name: `${firstName} ${lastName}`,
            role: 'STUDENT',
            schoolId: school.id,
          },
        })
      : undefined

    const student = await prisma.student.create({
      data: {
        userId: user?.id,
        admissionNo: `ADM-${String(2026)}-${String(i).padStart(4, '0')}`,
        firstName,
        lastName,
        dob: toDateOnly(new Date(2010 + (i % 4), i % 12, (i % 27) + 1)),
        gender: gender as 'MALE' | 'FEMALE',
        bloodGroup: pick(['A+', 'B+', 'O+', 'AB+', 'A-']),
        nationality: 'Bangladeshi',
        address: `${pickInt(1, 300)} ${pick(['Lake', 'Park', 'Garden', 'Main'])}, ${pick(['Gulshan', 'Dhanmondi', 'Banani', 'Uttara'])}`,
        city: 'Dhaka',
        phone: `+880 19${String(10000000 + i).slice(0, 8)}`,
        email: user?.email,
        guardianName: guardian,
        guardianRelation: relation,
        guardianPhone: `+880 18${String(10000000 + i).slice(0, 8)}`,
        guardianEmail: `guardian${i}@example.com`,
        classId: cls.id,
        rollNo: ((i - 1) % classes.length) + 1,
        admissionDate: toDateOnly(new Date(2026, 0, 5 + (i % 20))),
      },
    })
    students.push(student)
  }

  // ---- enrollments ---------------------------------------------------------
  for (const s of students) {
    await prisma.enrollment.create({
      data: { studentId: s.id, classId: s.classId!, academicYearId: yearCurrent.id, enrollmentDate: s.admissionDate, status: 'ACTIVE' },
    })
  }

  // ---- parents -------------------------------------------------------------
  const parentStudents = students.slice(0, 20)
  for (let i = 0; i < parentStudents.length; i++) {
    const student = parentStudents[i]
    const parentUser = await prisma.user.create({
      data: {
        email: `parent${i + 1}@school.example`,
        passwordHash: await hash(PARENT_PASSWORD, 10),
        name: `Guardian of ${student.firstName} ${student.lastName}`,
        role: 'PARENT',
        schoolId: school.id,
      },
    })
    await prisma.studentGuardian.create({
      data: { studentId: student.id, parentUserId: parentUser.id, relation: student.guardianRelation },
    })
  }

  // ---- attendance (last 25 school days) ------------------------------------
  const today = new Date()
  const schoolDays = []
  {
    let d = new Date(today)
    d.setHours(12, 0, 0, 0)
    let days = 0
    while (days < 25) {
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, 12, 0, 0)
      const day = d.getDay()
      if (day !== 0 && day !== 6) {
        schoolDays.push(d)
        days += 1
      }
    }
  }
  const attendanceRows = []
  for (const student of students) {
    for (const date of schoolDays) {
      const r = rand()
      const status = r < 0.86 ? 'PRESENT' : r < 0.93 ? 'LATE' : r < 0.97 ? 'ABSENT' : 'LEAVE'
      attendanceRows.push({
        studentId: student.id,
        classId: student.classId!,
        date,
        status: status as 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE',
        markedById: adminUser.id,
      })
    }
  }
  // insert in chunks to stay under param limits
  for (let i = 0; i < attendanceRows.length; i += 2000) {
    await prisma.attendance.createMany({ data: attendanceRows.slice(i, i + 2000) })
  }

  // ---- assessments & marks (term 1) ---------------------------------------
  for (const cls of classes) {
    for (const subject of subjects.slice(0, 6)) {
      const teacherAssignment = await prisma.teacherAssignment.findUnique({
        where: { classId_subjectId_academicYearId: { classId: cls.id, subjectId: subject.id, academicYearId: yearCurrent.id } },
      })
      const assessment = await prisma.assessment.create({
        data: {
          classId: cls.id,
          subjectId: subject.id,
          termId: term1.id,
          teacherId: teacherAssignment!.teacherId,
          name: `${subject.name} — ${pick(assessmentNames)}`,
          type: pick(assessmentTypeList),
          maxMarks: 100,
          weight: subjectDefs.find((s) => s.code === subject.code)?.weight ?? 1,
          date: toDateOnly(new Date(2026, 2, 10 + (classes.indexOf(cls) % 10))),
          isPublished: rand() > 0.3,
          publishedAt: rand() > 0.3 ? new Date() : null,
        },
      })
      const classStudents = students.filter((s) => s.classId === cls.id)
      for (const student of classStudents) {
        const marks = Math.round(Math.min(100, Math.max(35, 55 + rand() * 45)) * 100) / 100
        await prisma.mark.create({
          data: { assessmentId: assessment.id, studentId: student.id, marksObtained: marks, createdById: adminUser.id },
        })
      }
    }
  }

  // ---- fees ----------------------------------------------------------------
  const feeStructures = []
  for (const [i, name] of ['Tuition Fee', 'Exam Fee', 'Library Fee', 'Lab Fee'].entries()) {
    feeStructures.push(
      await prisma.feeStructure.create({
        data: { name, amount: i === 0 ? 15000 : i === 1 ? 3000 : i === 2 ? 1500 : 2000, description: `${name} for Term 1`, termId: term1.id },
      }),
    )
  }

  for (const student of students) {
    const invoiceNo = `INV-${String(2026)}-${String(1000 + students.indexOf(student))}`
    const total = feeStructures.reduce((sum, f) => sum + Number(f.amount), 0)
    const paid = rand() > 0.45
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        studentId: student.id,
        termId: term1.id,
        issueDate: toDateOnly(new Date(2026, 0, 10)),
        dueDate: toDateOnly(new Date(2026, 2, 31)),
        status: paid ? 'PAID' : 'ISSUED',
        totalAmount: total,
        createdById: adminUser.id,
        items: { create: feeStructures.map((f) => ({ feeStructureId: f.id, description: f.name, amount: f.amount })) },
      },
    })
    if (paid) {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: total,
          method: pick(['CASH', 'BANK_TRANSFER', 'CARD']),
          status: 'CONFIRMED',
          reference: `RCP-${invoiceNo.slice(4)}`,
          submittedById: adminUser.id,
          confirmedById: adminUser.id,
          confirmedAt: new Date(),
        },
      })
    }
  }

  // ---- announcements -------------------------------------------------------
  await prisma.announcement.createMany({
    data: [
      { title: 'Welcome to the new academic year', body: 'Classes begin 5 January. Timetables are available on the portal.', audience: 'ALL', createdById: adminUser.id },
      { title: 'Term 1 exams start March 10', body: 'Please check the exam schedule and arrive 15 minutes early.', audience: 'STUDENT', createdById: adminUser.id },
      { title: 'Parent-teacher meeting', body: 'Term 1 parent-teacher meetings will be held on the last Saturday of the month.', audience: 'PARENT', createdById: adminUser.id },
      { title: 'Staff orientation', body: 'All teachers please attend the orientation on 3 January.', audience: 'TEACHER', createdById: adminUser.id },
    ],
  })

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.attendance.count(),
    prisma.mark.count(),
    prisma.invoice.count(),
    prisma.payment.count(),
    prisma.announcement.count(),
  ])

  console.log('Seed complete:')
  console.log(`  users=${counts[0]} students=${counts[1]} teachers=${counts[2]} classes=${counts[3]}`)
  console.log(`  attendance=${counts[4]} marks=${counts[5]} invoices=${counts[6]} payments=${counts[7]} announcements=${counts[8]}`)
  console.log('Login accounts (password in braces):')
  console.log(`  admin@school.example (${ADMIN_PASSWORD})`)
  console.log(`  teacher1..10@school.example (${TEACHER_PASSWORD})`)
  console.log(`  student1..30@school.example (${STUDENT_PASSWORD})`)
  console.log(`  parent1..20@school.example (${PARENT_PASSWORD})`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
