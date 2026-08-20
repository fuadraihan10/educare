import 'dotenv/config'
import { PrismaClient, Role, UserStatus } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

function generateEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, '')
    .replace(/\s+/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
  return `${slug}@educare.edu.bd`
}

const parentNames: string[] = [
  'Abdur Rahim', 'Fatima Begum', 'Kamal Hossain', 'Nasreen Akter',
  'Mohammad Karim', 'Roksana Parveen', 'Shahidullah Miah', 'Jesmin Ara',
  'Abul Kashem', 'Salma Khatun', 'Rafiqul Islam', 'Monira Begum',
  'Shariful Haque', 'Rina Akter', 'Mizanur Rahman', 'Hamida Banu',
  'Monir Hossain', 'Nazma Parvin', 'Akter Hossain', 'Rowshan Ara',
  'Jamal Uddin', 'Rahima Khatun', 'Faruk Ahmed', 'Syeda Sultana',
  'Abdul Majid', 'Amena Khatun', 'Habibur Rahman', 'Nargis Akter',
  'Golam Mostafa', 'Shirin Akter', 'Sohel Rana', 'Ferdousi Begum',
  'Rashedul Haq', 'Murshida Khatun', 'Anowar Hossain', 'Sumaiya Rahman',
  'Mahbubul Alam', 'Laila Khatun', 'Towhidul Islam', 'Sabina Yasmin',
  'Bashir Ahmed', 'Rehana Khatun', 'Asaduzzaman', 'Tahmina Sultana',
  'Zahirul Haque', 'Farida Begum', 'Kamruzzaman', 'Rukshana Parvin',
  'Mosharraf Hossain', 'Shahana Akter', 'Badrul Alam', 'Monowara Khatun',
  'Abul Hossain', 'Halima Khatun', 'Mojibur Rahman', 'Jahanara Begum',
  'Shamsul Haque', 'Ayesha Siddiqua', 'Aminul Islam', 'Ruma Khatun',
  'Abdus Sattar', 'Nasima Akter', 'Ziaur Rahman', 'Shahanaz Begum',
  'Kamal Uddin', 'Razia Sultana', 'Ruhul Amin', 'Afroza Khatun',
  'Azizul Haq', 'Salma Khatun', 'Md. Sazzad Hossain', 'Sharmin Sultana',
  'Rabiul Haque', 'Nafisa Iqbal', 'Tariqul Islam', 'Sumi Akter',
  'Amir Hossain', 'Farzana Rahman', 'Masud Rana', 'Jesmin Sultana',
  'Saiful Islam', 'Taslima Khatun', 'Rajib Hossain', 'Hamida Khatun',
  'Rubel Hossain', 'Rupali Khatun', 'Shahadat Hossain', 'Sabita Begum',
  'Helal Uddin', 'Rina Perveen', 'Mahfuzur Rahman', 'Khaleda Akter',
  'Fazlul Haque', 'Shirina Parvin', 'Biplob Hossain', 'Roksana Begum',
  'Liton Miah', 'Nazmin Sultana', 'Manirul Islam', 'Rahat Ara',
]

function parentPhone(index: number): string {
  const num = 300001 + index
  return `01712-${num}`
}

function parentRegNo(index: number): string {
  return `PAR-${String(index + 1).padStart(4, '0')}`
}

async function main() {
  console.log(`Seeding ${parentNames.length} parents...`)

  const school = await prisma.school.findFirst()
  if (!school) throw new Error('No school found. Run the main seed first.')

  const students = await prisma.student.findMany({ orderBy: { createdAt: 'asc' } })
  if (students.length === 0) throw new Error('No students found. Run seed-students first.')

  const password = await hash('Parent@12345', 12)

  const usedEmails = new Set<string>()
  let created = 0
  let skipped = 0

  for (let i = 0; i < parentNames.length; i++) {
    const name = parentNames[i]
    const regNo = parentRegNo(i)
    const phone = parentPhone(i)

    let email = generateEmail(name)
    let suffix = 1
    while (usedEmails.has(email)) {
      email = generateEmail(name).replace('@', `${suffix}@`)
      suffix++
    }
    usedEmails.add(email)

    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          regNo,
          email,
          passwordHash: password,
          name,
          role: Role.PARENT,
          status: UserStatus.ACTIVE,
          phone,
          schoolId: school.id,
          forcePasswordChange: true,
        },
      })

      const start = i * 3
      const end = Math.min(start + 3, students.length)
      if (start >= students.length) break

      for (let s = start; s < end; s++) {
        const student = students[s]
        const relation = s % 2 === 0 ? 'Father' : 'Mother'
        const uniqueKey = { studentId_parentUserId: { studentId: student.id, parentUserId: user.id } }

        try {
          await prisma.studentGuardian.upsert({
            where: uniqueKey,
            update: {},
            create: {
              studentId: student.id,
              parentUserId: user.id,
              relation,
            },
          })
        } catch (e) {
          console.error(`  SKIP guardian link for ${name} -> ${student.id}: ${(e as Error).message}`)
        }
      }

      created++
      console.log(`  [${created}/${parentNames.length}] ${name} (${email})`)
    } catch (e) {
      skipped++
      console.error(`  SKIP ${name}: ${(e as Error).message}`)
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`)
  console.log(`Default password for all parents: Parent@12345`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
