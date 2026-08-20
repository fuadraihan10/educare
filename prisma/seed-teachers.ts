import 'dotenv/config'
import { PrismaClient, Role, UserStatus } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

type TeacherInput = {
  name: string
  designation: string
  qualification: string
  phone: string
}

const teachers: TeacherInput[] = [
  { name: 'Alfi Sharin', designation: 'Lecturer', qualification: 'MSc in F&N, IU', phone: '01776-400347' },
  { name: 'H. M. Osman Gani', designation: 'Lecturer', qualification: 'M.T.I.S, IU', phone: '01712-044340' },
  { name: 'Jakaria Rimon', designation: 'Lecturer', qualification: 'MA in Bangla, IU', phone: '01340-253974' },
  { name: 'Kamran Mridha Raaj', designation: 'Lecturer', qualification: 'BSc in EEE (WUB), MSc in CSE (IU)', phone: '01680-863965' },
  { name: 'Md. Jayedul Haque', designation: 'Lecturer', qualification: 'MBA in Mgmt., NU', phone: '01736-542961' },
  { name: 'Md. Mozammel Haque', designation: 'Lecturer', qualification: 'MSc in Fisheries, NU', phone: '01894-427379' },
  { name: 'Md. Rabiul Islam', designation: 'Lecturer', qualification: 'MBA in Accounting, NU', phone: '01720-458964' },
  { name: 'Md. Saifullah Shafi', designation: 'Lecturer', qualification: 'MA in English, JnU', phone: '01722-328318' },
  { name: 'Md. Shafiqul Islam', designation: 'Lecturer', qualification: 'MSc in Chemistry, IU', phone: '01773-154260' },
  { name: 'Md. Zelan Hossin', designation: 'Lecturer', qualification: 'MSc in Chemistry, NU', phone: '01749-336690' },
  { name: 'Mir Md. Rafique Uz-Zaman', designation: 'Lecturer', qualification: 'MSc in Math, CU', phone: '01717-248221' },
  { name: 'Modhurima Tasnim Aditi', designation: 'Lecturer', qualification: 'MA in English, NU', phone: '01894-427391' },
  { name: 'Ronju Khatun', designation: 'Lecturer', qualification: 'MSc in Mathematics, IU', phone: '01722-493781' },
  { name: 'S.M. Rokonuzzaman', designation: 'Lecturer', qualification: 'MA in English, NUB', phone: '01924-725576' },
  { name: 'Sohag Hossain', designation: 'Lecturer', qualification: 'MSS in Economics, NU', phone: '01894-427375' },
  { name: 'Sujit Kumar', designation: 'Lecturer', qualification: 'MSc in EEE, IU', phone: '01558-981136' },
  { name: 'Tahmina Khanam', designation: 'Lecturer', qualification: 'MA in Bangla, DU', phone: '01789-110167' },
  { name: 'Tamanna Monowar', designation: 'Lecturer', qualification: 'MA in English, NU', phone: '01719-027980' },
  { name: 'A F M Muhsiul Arifin', designation: 'Teacher', qualification: 'MBS in Accounting, NU', phone: '01717-744256' },
  { name: 'Abdur Rashid', designation: 'Teacher', qualification: 'MSS in Political Science, RU', phone: '01734-758512' },
  { name: 'Abu Talha', designation: 'Teacher', qualification: 'Dawrah Hadith (MA)', phone: '01650-113138' },
  { name: 'Al Amin', designation: 'Teacher', qualification: 'MTIS, IU', phone: '01754-404316' },
  { name: 'Anonna Podder', designation: 'Teacher', qualification: 'MA in English, NU', phone: '01745-463169' },
  { name: 'Arafat Hossain', designation: 'Teacher', qualification: 'BSc in Physics, NU', phone: '01518-444694' },
  { name: 'Ashif Iqbal Antor', designation: 'Teacher', qualification: 'MBA in Management, NU', phone: '01745-413269' },
  { name: 'Atokia Tabassum', designation: 'Teacher', qualification: 'DPPS, DU', phone: '01973963154' },
  { name: 'Dilara Khatun', designation: 'Teacher', qualification: 'MA, IU', phone: '01784-309903' },
  { name: 'Ershita Yasmin', designation: 'Teacher', qualification: 'MSc in CSE, JnU', phone: '01753-599883' },
  { name: 'Farhana Ferdous', designation: 'Teacher', qualification: 'MA in English, IU', phone: '01728-600222' },
  { name: 'Farhana Ikhtiar', designation: 'Teacher', qualification: 'MSc in Math, NU', phone: '01739-859535' },
  { name: 'Farjana Atique Orin', designation: 'Teacher', qualification: 'MA in English, NU', phone: '01533-457513' },
  { name: 'Farjana Rahman', designation: 'Teacher', qualification: 'MSc in Physics, JUST', phone: '01858-111528' },
  { name: 'Farzana Akhtar Chhuti', designation: 'Teacher', qualification: 'MA in Bangla, NU', phone: '01894-227390' },
  { name: 'Jamila Buharid', designation: 'Teacher', qualification: 'MSS in Poli. & Public Admin, IU', phone: '01752-632887' },
  { name: 'Jannatul Ferdaus', designation: 'Teacher', qualification: 'MA in Applied Linguistics', phone: '01311-387765' },
  { name: 'Jannatul Ferdaus', designation: 'Teacher', qualification: 'MSc in Mathematics, NU', phone: '01770-998255' },
  { name: 'Jarin Tasnim Raka', designation: 'Teacher', qualification: 'MA in Arabic LL, IU', phone: '01727-665090' },
  { name: 'Kabria Parvin', designation: 'Teacher', qualification: 'BA Pass, NU', phone: '01943-889198' },
  { name: 'Kallal Kanti Guha', designation: 'Teacher', qualification: 'MA in Philosophy, DU', phone: '01798-243023' },
  { name: 'Khairul Islam', designation: 'Teacher', qualification: 'MTIS, IU', phone: '01775676602' },
  { name: 'Khalid Saifullah', designation: 'Teacher', qualification: 'Dawrah Hadith (MA)', phone: '01710-382214' },
  { name: 'Khondoker Atikul Islam', designation: 'Teacher', qualification: 'MTIS, IU', phone: '01303-310273' },
  { name: 'Krishna Rani', designation: 'Teacher', qualification: 'BSS in Political Science, NU', phone: '01700-979642' },
  { name: 'Maryna Parvin', designation: 'Teacher', qualification: 'MSS, NU', phone: '01729-949580' },
  { name: 'Marzia Naznin', designation: 'Teacher', qualification: 'MA in Philosophy, DU', phone: '01795-084346' },
  { name: 'Md Salahuddin', designation: 'Teacher', qualification: 'MBS in Accounting, NU', phone: '01728-258035' },
  { name: 'Md. Abdullahil Oaki', designation: 'Teacher', qualification: 'MTIS, IU', phone: '01956-672419' },
  { name: 'Md. Abdus Salam', designation: 'Teacher', qualification: 'Al-Fiqh & Law (LL.M), IU', phone: '01741-998224' },
  { name: 'Md. Alvi Rahman', designation: 'Teacher', qualification: 'C&S, RU', phone: '01622856963' },
  { name: 'Md. Arifuzzaman', designation: 'Teacher', qualification: 'MA in English, IU', phone: '01917-626560' },
  { name: 'Md. Atiar Rahman', designation: 'Teacher', qualification: 'M.T.I.S, IU', phone: '01724-880955' },
  { name: 'Md. Ibrahim Hossain', designation: 'Teacher', qualification: 'MSc in Mathematics, IU', phone: '01765-676169' },
  { name: 'Md. Jannatun Nayem Khan', designation: 'Teacher', qualification: 'BSS in Political Science, IU', phone: '01779-771258' },
  { name: 'Md. Mehedi Hasan Sahed', designation: 'Teacher', qualification: 'BSc in Chemistry', phone: '01743-378840' },
  { name: 'Md. Mehedi Hassan Chanchal', designation: 'Teacher', qualification: 'MBA in THM, IU', phone: '01764-675722' },
  { name: 'Md. Mohibul Islam', designation: 'Teacher', qualification: 'BSc in ETE, Uoda Uni.', phone: '01518-978445' },
  { name: 'Md. Mostafizur Rahman', designation: 'Teacher', qualification: 'MSc in Math, NU', phone: '01745-261486' },
  { name: 'Md. Nazmus Sayadat', designation: 'Teacher', qualification: 'M.T.I.S, IU', phone: '01737-850506' },
  { name: 'Md. Omor Faruk', designation: 'Teacher', qualification: 'MTIS, IU', phone: '01942-371006' },
  { name: 'Md. Rajib Hossain', designation: 'Teacher', qualification: 'MA in English, IU', phone: '01735-307191' },
  { name: 'Md. Saddam Hossen', designation: 'Teacher', qualification: 'MSc in Math, NU', phone: '01736-542460' },
  { name: 'Md. Sirajus Salehin', designation: 'Teacher', qualification: 'MBA in Accounting, NU', phone: '01737-080273' },
  { name: 'Md. Zahid Hassan', designation: 'Teacher', qualification: 'BSAg, IUBAT', phone: '01752-137790' },
  { name: 'Mitali Soma', designation: 'Teacher', qualification: 'MA in History, NU', phone: '01777-108927' },
  { name: 'Mohiuddin Ahmed', designation: 'Teacher', qualification: 'MA in English, IU', phone: '01581-628427' },
  { name: 'Mousumi Farjana', designation: 'Teacher', qualification: 'MSc in Fisheries, NU', phone: '01756-832049' },
  { name: 'Mst. Roksana Parveen', designation: 'Teacher', qualification: 'MSc in Chemistry, IU', phone: '01926-206142' },
  { name: 'Mst. Ruhina Jannat', designation: 'Teacher', qualification: 'MA in Bangla, NU', phone: '01744-222121' },
  { name: 'Mst. Selina Akter', designation: 'Teacher', qualification: 'MA in Islamic H&C, NU', phone: '01710-381374' },
  { name: 'Mst. Tamanna Yeasmin', designation: 'Teacher', qualification: 'MSc in Geo. & Environ., NU', phone: '01533-184833' },
  { name: 'Mst. Tuliara Khatun', designation: 'Teacher', qualification: 'MA in Bangla, NU', phone: '01750-562532' },
  { name: 'Nasrin Akter Alo', designation: 'Teacher', qualification: 'BSS, NU', phone: '01748-593892' },
  { name: 'Nasrin Akter Ety', designation: 'Teacher', qualification: 'MA in Isl. Histo. & Cul, NU', phone: '01734-217750' },
  { name: 'Nasrin Akter Lima', designation: 'Teacher', qualification: 'BA, NU', phone: '01764-962525' },
  { name: 'Nazma Parvin Tuli', designation: 'Teacher', qualification: 'MA in Bangla, IU', phone: '01711-460717' },
  { name: 'Ousouatun Hasana', designation: 'Teacher', qualification: 'MSc in Bio Tech & Engg, IU', phone: '01317-640512' },
  { name: 'Pobittra Rani', designation: 'Teacher', qualification: 'Social Work, MA, NU', phone: '01794-387918' },
  { name: 'Raisul Islam Shakib', designation: 'Teacher', qualification: 'BTIS, IU', phone: '01790-086797' },
  { name: 'Ritu Khatun', designation: 'Teacher', qualification: 'MA in Bangla, IU', phone: '01951-812331' },
  { name: 'Rumana Parvin', designation: 'Teacher', qualification: 'MA in Economics, NU', phone: '01923-404154' },
  { name: 'Saleha Parvin', designation: 'Teacher', qualification: 'MSS in Political Sci, NU', phone: '01894-427354' },
  { name: 'Sanchita Rani', designation: 'Teacher', qualification: 'MSc in psychology, RU', phone: '01725-335567' },
  { name: 'Shafia Azam', designation: 'Teacher', qualification: 'MSc in Mathematics, NU', phone: '01701824878' },
  { name: 'Shagar Kumar Das', designation: 'Teacher', qualification: 'MSc in Math, NU', phone: '01721-932747' },
  { name: 'Shahana Jahan Lubna', designation: 'Teacher', qualification: 'MA in Islamic Studies, NU', phone: '01710-129459' },
  { name: 'Shahanag Parvin Eva', designation: 'Teacher', qualification: 'MSc in Chemistry, NU', phone: '01736-431289' },
  { name: 'Shaharia Parvez', designation: 'Teacher', qualification: 'MSc in Mathematics, NU', phone: '01301-251870' },
  { name: 'Shaikh Mahbubul Huq', designation: 'Teacher', qualification: 'BSc in CSE, City Uni.', phone: '01601-337085' },
  { name: 'Shajima Afrose', designation: 'Teacher', qualification: 'MSc in Zoology, NU', phone: '01747-269960' },
  { name: 'Sharmin Akter', designation: 'Teacher', qualification: 'MA in Bangla, NU', phone: '01751-977533' },
  { name: 'Sharmin Jahan Shimu', designation: 'Teacher', qualification: 'MSc in Fisheries, NU', phone: '01763-492079' },
  { name: 'Sonali Khatun', designation: 'Teacher', qualification: 'MA in Bangla, NU', phone: '01776-505016' },
  { name: 'Sondip Chakrobortty', designation: 'Teacher', qualification: 'MA in Geography, NU', phone: '01754-757114' },
  { name: 'Sonia Kabir', designation: 'Teacher', qualification: 'MA in Philosophy, NU', phone: '01717-406981' },
  { name: 'Sonima Rahman', designation: 'Teacher', qualification: 'MA in Bangla, IU', phone: '01611-759793' },
  { name: 'Sunjeda Fatema', designation: 'Teacher', qualification: 'BSc in Mathematics, NU', phone: '01729-340142' },
  { name: 'Supriya Mukharjee', designation: 'Teacher', qualification: 'MBA in Mgmt, NU', phone: '01768-782202' },
  { name: 'Tamanna Taskin', designation: 'Teacher', qualification: 'Political Science, IU', phone: '01937238625' },
  { name: 'Tania Yasmin', designation: 'Teacher', qualification: 'MSS, NU', phone: '01720-410405' },
  { name: 'Tushar Uddin', designation: 'Teacher', qualification: 'MSc in Zoology, NU', phone: '01723649254' },
  { name: 'Utpol Tarafdar', designation: 'Teacher', qualification: 'MSc in EE, NIT, Kerala', phone: '01776-505016' },
]

function generateEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, '')
    .replace(/\s+/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
  return `${slug}@educare.edu.bd`
}

function generatePhoneSlug(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

async function main() {
  console.log(`Seeding ${teachers.length} teachers...`)

  const school = await prisma.school.findFirst()
  if (!school) throw new Error('No school found. Run the main seed first.')

  const password = await hash('Teacher@12345', 12)

  const usedEmails = new Set<string>()
  const usedRegNos = new Set<string>()

  let created = 0
  let skipped = 0

  for (let i = 0; i < teachers.length; i++) {
    const t = teachers[i]
    const idx = String(i + 1).padStart(4, '0')
    const employeeId = `EMP-${idx}`

    let email = generateEmail(t.name)
    let suffix = 1
    while (usedEmails.has(email)) {
      email = generateEmail(t.name).replace('@', `${suffix}@`)
      suffix++
    }
    usedEmails.add(email)

    let regNo = employeeId
    while (usedRegNos.has(regNo)) {
      regNo = `EMP-${String(i + 1 + suffix++).padStart(4, '0')}`
    }
    usedRegNos.add(regNo)

    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          regNo,
          email,
          passwordHash: password,
          name: t.name,
          role: Role.TEACHER,
          status: UserStatus.ACTIVE,
          phone: t.phone,
          designation: t.designation,
          schoolId: school.id,
          forcePasswordChange: true,
        },
      })

      await prisma.teacher.upsert({
        where: { employeeId: regNo },
        update: {},
        create: {
          userId: user.id,
          employeeId: regNo,
          name: t.name,
          email,
          phone: t.phone,
          designation: t.designation,
          qualification: t.qualification,
          status: UserStatus.ACTIVE,
        },
      })

      created++
      console.log(`  [${created}/${teachers.length}] ${t.name} (${email})`)
    } catch (e) {
      skipped++
      console.error(`  SKIP ${t.name}: ${(e as Error).message}`)
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`)
  console.log(`Default password for all teachers: Teacher@12345`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
