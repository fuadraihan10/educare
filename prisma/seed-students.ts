import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'
import { randomUUID } from 'crypto'

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

const rawStudents: string[] = [
  // CLASS 1 - SECTION A
  'STD-001|Arafat Hossain|Male|2019-02-14|Md. Rahim Hossain|01711010001|Kushtia|A+',
  'STD-002|Nusrat Jahan|Female|2019-05-21|Md. Kamal Uddin|01711010002|Dhaka|B+',
  'STD-003|Samiul Islam|Male|2019-01-09|Md. Selim Islam|01711010003|Rajshahi|O+',
  'STD-004|Jannatul Ferdous|Female|2019-07-17|Md. Azizur Rahman|01711010004|Khulna|AB+',
  'STD-005|Tahmid Hasan|Male|2019-03-12|Md. Hasan Ali|01711010005|Jessore|O+',
  'STD-006|Mahiya Akter|Female|2019-06-25|Md. Nizam Uddin|01711010006|Kushtia|A+',
  'STD-007|Fahim Rahman|Male|2019-04-08|Md. Faruk Rahman|01711010007|Bogura|B+',
  'STD-008|Sadia Islam|Female|2019-08-13|Md. Abdul Karim|01711010008|Pabna|O+',
  'STD-009|Rifat Ahmed|Male|2019-09-05|Md. Rashed Ahmed|01711010009|Dhaka|A-',
  'STD-010|Sumaiya Rahman|Female|2019-11-19|Md. Babul Rahman|01711010010|Narayanganj|B+',
  // CLASS 1 - SECTION B
  'STD-011|Shakib Hasan|Male|2019-02-03|Md. Habib Hasan|01711010011|Kushtia|O+',
  'STD-012|Tanjila Akter|Female|2019-04-15|Md. Monir Hossain|01711010012|Faridpur|A+',
  'STD-013|Mahedi Islam|Male|2019-06-11|Md. Yasin Islam|01711010013|Rajshahi|B+',
  'STD-014|Lamia Khatun|Female|2019-03-28|Md. Anwar Hossain|01711010014|Chuadanga|O+',
  'STD-015|Raihan Kabir|Male|2019-05-07|Md. Abdul Kabir|01711010015|Pabna|AB+',
  'STD-016|Afrin Sultana|Female|2019-08-22|Md. Javed Ali|01711010016|Kushtia|A+',
  'STD-017|Nayeem Hasan|Male|2019-09-18|Md. Shahid Hasan|01711010017|Natore|O+',
  'STD-018|Mim Akter|Female|2019-10-06|Md. Saiful Islam|01711010018|Jhenaidah|B+',
  'STD-019|Arman Hossain|Male|2019-01-26|Md. Harun Hossain|01711010019|Dhaka|A+',
  'STD-020|Jui Rahman|Female|2019-12-02|Md. Shah Alam|01711010020|Magura|O+',
  // CLASS 1 - SECTION C
  'STD-021|Alif Hossain|Male|2019-02-18|Md. Rashid Hossain|01711010021|Kushtia|B+',
  'STD-022|Sabiha Noor|Female|2019-05-04|Md. Mahfuzur Rahman|01711010022|Dhaka|A+',
  'STD-023|Abdullah Al Noman|Male|2019-07-09|Md. Noman Ali|01711010023|Rajbari|O+',
  'STD-024|Tasnim Jahan|Female|2019-03-16|Md. Mizanur Rahman|01711010024|Kushtia|AB+',
  'STD-025|Hasan Mahmud|Male|2019-06-20|Md. Mahmud Hasan|01711010025|Pabna|O+',
  'STD-026|Rukaiya Islam|Female|2019-08-01|Md. Abdul Jalil|01711010026|Natore|A-',
  'STD-027|Sakib Rahman|Male|2019-09-29|Md. Nazrul Rahman|01711010027|Bogura|B+',
  'STD-028|Fariha Ahmed|Female|2019-11-10|Md. Mosharraf Ahmed|01711010028|Khulna|O+',
  'STD-029|Imran Hossain|Male|2019-04-24|Md. Ibrahim Hossain|01711010029|Chuadanga|A+',
  'STD-030|Anika Sultana|Female|2019-01-13|Md. Rezaul Karim|01711010030|Jhenaidah|B+',
  // CLASS 2 - SECTION A
  'STD-031|Adnan Islam|Male|2018-02-11|Md. Nurul Islam|01711010031|Kushtia|A+',
  'STD-032|Mst. Tuba Akter|Female|2018-05-19|Md. Abdul Mannan|01711010032|Dhaka|O+',
  'STD-033|Shuvo Rahman|Male|2018-03-07|Md. Monowar Rahman|01711010033|Pabna|B+',
  'STD-034|Nabila Jahan|Female|2018-07-23|Md. Nasir Uddin|01711010034|Rajshahi|AB+',
  'STD-035|Tasin Ahmed|Male|2018-01-28|Md. Tariqul Ahmed|01711010035|Kushtia|O+',
  'STD-036|Ayesha Siddika|Female|2018-06-14|Md. Shahjahan Ali|01711010036|Jhenaidah|A+',
  'STD-037|Rakib Hossain|Male|2018-04-05|Md. Lokman Hossain|01711010037|Magura|B+',
  'STD-038|Jannat Ara|Female|2018-08-16|Md. Kamrul Hasan|01711010038|Faridpur|O+',
  'STD-039|Omar Faruk|Male|2018-09-09|Md. Faruk Hossain|01711010039|Narail|A-',
  'STD-040|Suma Akter|Female|2018-10-27|Md. Enamul Haque|01711010040|Khulna|B+',
  // CLASS 2 - SECTION B
  'STD-041|Ayat Hossain|Male|2018-02-20|Md. Azad Hossain|01711010041|Kushtia|O+',
  'STD-042|Nafisa Islam|Female|2018-04-12|Md. Nazmul Islam|01711010042|Dhaka|A+',
  'STD-043|Zihad Hasan|Male|2018-06-08|Md. Zakir Hasan|01711010043|Pabna|B+',
  'STD-044|Samia Rahman|Female|2018-03-21|Md. Mostafizur Rahman|01711010044|Rajshahi|O+',
  'STD-045|Rohan Kabir|Male|2018-05-13|Md. Habib Kabir|01711010045|Kushtia|AB+',
  'STD-046|Rima Sultana|Female|2018-07-18|Md. Rafiqul Islam|01711010046|Chuadanga|A+',
  'STD-047|Tanvir Ahmed|Male|2018-09-02|Md. Selim Ahmed|01711010047|Bogura|O+',
  'STD-048|Muntaha Jahan|Female|2018-10-14|Md. Abdur Rahman|01711010048|Narail|B+',
  'STD-049|Sifat Hossain|Male|2018-01-17|Md. Shafiqul Hossain|01711010049|Magura|A+',
  'STD-050|Priya Akter|Female|2018-11-29|Md. Badrul Alam|01711010050|Faridpur|O+',
  // CLASS 2 - SECTION C
  'STD-051|Arif Hasan|Male|2018-02-06|Md. Anis Hasan|01711010051|Kushtia|B+',
  'STD-052|Sadika Noor|Female|2018-05-08|Md. Sirajul Islam|01711010052|Dhaka|A+',
  'STD-053|Shafin Rahman|Male|2018-07-12|Md. Salim Rahman|01711010053|Pabna|O+',
  'STD-054|Mehnaz Akter|Female|2018-03-03|Md. Abul Kalam|01711010054|Kushtia|AB+',
  'STD-055|Rafi Ahmed|Male|2018-06-23|Md. Rafiq Ahmed|01711010055|Khulna|O+',
  'STD-056|Amina Khatun|Female|2018-08-19|Md. Ismail Hossain|01711010056|Rajshahi|A+',
  'STD-057|Mahir Islam|Male|2018-09-15|Md. Mainul Islam|01711010057|Natore|B+',
  'STD-058|Tania Sultana|Female|2018-10-31|Md. Shahin Uddin|01711010058|Jhenaidah|O+',
  'STD-059|Faisal Hossain|Male|2018-04-09|Md. Kawsar Hossain|01711010059|Jessore|A-',
  'STD-060|Rafia Jahan|Female|2018-12-04|Md. Abdul Hakim|01711010060|Kushtia|B+',
  // CLASS 3 - SECTION A
  'STD-061|Miraj Hossain|Male|2017-01-19|Md. Mizan Hossain|01711010061|Kushtia|O+',
  'STD-062|Tamanna Akter|Female|2017-03-22|Md. Ahsan Habib|01711010062|Dhaka|A+',
  'STD-063|Fahad Islam|Male|2017-05-17|Md. Mahbub Islam|01711010063|Pabna|B+',
  'STD-064|Sharmin Jahan|Female|2017-02-08|Md. Anwar Kabir|01711010064|Rajshahi|O+',
  'STD-065|Nabil Hasan|Male|2017-06-13|Md. Hasan Imam|01711010065|Kushtia|AB+',
  'STD-066|Oishi Rahman|Female|2017-07-27|Md. Rezaul Haque|01711010066|Khulna|A+',
  'STD-067|Sakibul Islam|Male|2017-09-05|Md. Abdul Matin|01711010067|Bogura|O+',
  'STD-068|Ritu Akter|Female|2017-10-18|Md. Moslem Uddin|01711010068|Magura|B+',
  'STD-069|Emon Ahmed|Male|2017-04-02|Md. Naim Ahmed|01711010069|Faridpur|A+',
  'STD-070|Nusaiba Islam|Female|2017-11-11|Md. Jasim Uddin|01711010070|Chuadanga|O+',
  // CLASS 3 - SECTION B
  'STD-071|Shadman Hasan|Male|2017-01-07|Md. Arif Hasan|01711010071|Kushtia|B+',
  'STD-072|Nusaira Jahan|Female|2017-04-19|Md. Masud Rana|01711010072|Dhaka|A+',
  'STD-073|Rashedul Islam|Male|2017-06-04|Md. Rashed Islam|01711010073|Pabna|O+',
  'STD-074|Farzana Yasmin|Female|2017-03-15|Md. Karim Uddin|01711010074|Rajshahi|AB+',
  'STD-075|Tarek Rahman|Male|2017-05-26|Md. Tarek Rahman|01711010075|Kushtia|O+',
  'STD-076|Jannatul Mawa|Female|2017-08-09|Md. Habibullah|01711010076|Jhenaidah|A+',
  'STD-077|Rakibul Hasan|Male|2017-09-21|Md. Rakib Hasan|01711010077|Natore|B+',
  'STD-078|Ishrat Jahan|Female|2017-10-13|Md. Shamsul Alam|01711010078|Khulna|O+',
  'STD-079|Wasi Ahmed|Male|2017-02-27|Md. Wahid Ahmed|01711010079|Faridpur|A-',
  'STD-080|Marium Akter|Female|2017-12-01|Md. Zahurul Islam|01711010080|Kushtia|B+',
  // CLASS 3 - SECTION C
  'STD-081|Anik Hossain|Male|2017-01-14|Md. Zakir Hossain|01711010081|Kushtia|O+',
  'STD-082|Safa Rahman|Female|2017-04-06|Md. Nayeem Rahman|01711010082|Dhaka|A+',
  'STD-083|Yousuf Hasan|Male|2017-07-16|Md. Yusuf Ali|01711010083|Pabna|B+',
  'STD-084|Eshita Jahan|Female|2017-03-10|Md. Shahidul Islam|01711010084|Rajshahi|O+',
  'STD-085|Arham Kabir|Male|2017-06-25|Md. Kabir Hossain|01711010085|Kushtia|AB+',
  'STD-086|Lubaba Sultana|Female|2017-08-12|Md. Jamal Uddin|01711010086|Magura|A+',
  'STD-087|Rehan Islam|Male|2017-09-30|Md. Rokon Islam|01711010087|Jhenaidah|O+',
  'STD-088|Anjum Ara|Female|2017-10-07|Md. Jalal Uddin|01711010088|Khulna|B+',
  'STD-089|Mahin Ahmed|Male|2017-05-02|Md. Shahin Ahmed|01711010089|Bogura|A+',
  'STD-090|Sanjida Islam|Female|2017-11-24|Md. Abdul Latif|01711010090|Kushtia|O+',
  // CLASS 4 - SECTION A
  'STD-091|Zubair Hossain|Male|2016-02-10|Md. Akram Hossain|01711010091|Kushtia|A+',
  'STD-092|Rafia Rahman|Female|2016-05-23|Md. Hafizur Rahman|01711010092|Dhaka|B+',
  'STD-093|Muntasir Islam|Male|2016-01-18|Md. Anwarul Islam|01711010093|Pabna|O+',
  'STD-094|Sania Akter|Female|2016-07-09|Md. Moin Uddin|01711010094|Rajshahi|AB+',
  'STD-095|Abir Hasan|Male|2016-03-14|Md. Jahangir Hasan|01711010095|Kushtia|O+',
  'STD-096|Tasmia Jahan|Female|2016-06-20|Md. Azhar Ali|01711010096|Khulna|A+',
  'STD-097|Tahsin Rahman|Male|2016-04-03|Md. Saad Rahman|01711010097|Bogura|B+',
  'STD-098|Fiza Noor|Female|2016-08-28|Md. Farid Uddin|01711010098|Magura|O+',
  'STD-099|Adib Ahmed|Male|2016-09-15|Md. Atiq Ahmed|01711010099|Faridpur|A-',
  'STD-100|Marzia Sultana|Female|2016-11-06|Md. Abdur Rouf|01711010100|Kushtia|B+',
  // CLASS 4 - SECTION B
  'STD-101|Nafi Hasan|Male|2016-02-04|Md. Nur Hasan|01711010101|Kushtia|O+',
  'STD-102|Hira Islam|Female|2016-04-19|Md. Kamal Islam|01711010102|Dhaka|A+',
  'STD-103|Shafin Ahmed|Male|2016-06-17|Md. Shakil Ahmed|01711010103|Pabna|B+',
  'STD-104|Opi Rahman|Female|2016-03-28|Md. Selim Rahman|01711010104|Rajshahi|O+',
  'STD-105|Riyad Hossain|Male|2016-05-10|Md. Riyad Hossain|01711010105|Kushtia|AB+',
  'STD-106|Mahira Akter|Female|2016-07-13|Md. Shafiqul Islam|01711010106|Chuadanga|A+',
  'STD-107|Noman Islam|Male|2016-09-07|Md. Noman Islam|01711010107|Natore|O+',
  'STD-108|Rukaiya Rahman|Female|2016-10-25|Md. Abul Kashem|01711010108|Jhenaidah|B+',
  'STD-109|Samin Hossain|Male|2016-01-30|Md. Arif Hossain|01711010109|Khulna|A+',
  'STD-110|Ema Sultana|Female|2016-12-12|Md. Asaduzzaman|01711010110|Kushtia|O+',
  // CLASS 4 - SECTION C
  'STD-111|Raiyan Islam|Male|2016-02-16|Md. Rafsan Islam|01711010111|Kushtia|B+',
  'STD-112|Afsana Jahan|Female|2016-05-08|Md. Mahmudul Hasan|01711010112|Dhaka|A+',
  'STD-113|Fahim Kabir|Male|2016-07-22|Md. Kabir Ahmed|01711010113|Pabna|O+',
  'STD-114|Nusrat Sultana|Female|2016-03-11|Md. Motaleb Hossain|01711010114|Rajshahi|AB+',
  'STD-115|Abrar Hossain|Male|2016-06-05|Md. Nasir Hossain|01711010115|Kushtia|O+',
  'STD-116|Fabiha Rahman|Female|2016-08-17|Md. Iqbal Rahman|01711010116|Magura|A+',
  'STD-117|Shihab Hasan|Male|2016-09-24|Md. Shahid Hasan|01711010117|Bogura|B+',
  'STD-118|Tania Noor|Female|2016-10-09|Md. Abdul Kader|01711010118|Khulna|O+',
  'STD-119|Rayan Ahmed|Male|2016-04-27|Md. Mostafa Ahmed|01711010119|Faridpur|A-',
  'STD-120|Sadia Jannat|Female|2016-11-19|Md. Belal Hossain|01711010120|Kushtia|B+',
  // CLASS 5 - SECTION A
  'STD-121|Sarwar Hossain|Male|2015-01-15|Md. Siraj Hossain|01711010121|Kushtia|O+',
  'STD-122|Sohana Akter|Female|2015-04-18|Md. Saiful Islam|01711010122|Dhaka|A+',
  'STD-123|Iqbal Hasan|Male|2015-06-07|Md. Iqbal Hasan|01711010123|Pabna|B+',
  'STD-124|Rida Jahan|Female|2015-02-26|Md. Sazzad Hossain|01711010124|Rajshahi|O+',
  'STD-125|Tanvir Islam|Male|2015-05-11|Md. Tanvir Islam|01711010125|Kushtia|AB+',
  'STD-126|Nusrat Nahar|Female|2015-07-19|Md. Mofizul Islam|01711010126|Khulna|A+',
  'STD-127|Shamim Rahman|Male|2015-09-03|Md. Shah Alam|01711010127|Bogura|O+',
  'STD-128|Rafia Islam|Female|2015-10-21|Md. Kamrul Islam|01711010128|Magura|B+',
  'STD-129|Adnan Ahmed|Male|2015-03-29|Md. Anwar Ahmed|01711010129|Faridpur|A+',
  'STD-130|Mim Jahan|Female|2015-11-14|Md. Hasan Ali|01711010130|Kushtia|O+',
  // CLASS 5 - SECTION B
  'STD-131|Rafiul Islam|Male|2015-01-09|Md. Rafiul Islam|01711010131|Kushtia|B+',
  'STD-132|Afsara Noor|Female|2015-04-23|Md. Sohel Rana|01711010132|Dhaka|A+',
  'STD-133|Mahmud Hasan|Male|2015-06-16|Md. Mahmud Hasan|01711010133|Pabna|O+',
  'STD-134|Jannatul Ferdousi|Female|2015-03-05|Md. Bakar Siddique|01711010134|Rajshahi|AB+',
  'STD-135|Siam Hossain|Male|2015-05-28|Md. Alamgir Hossain|01711010135|Kushtia|O+',
  'STD-136|Zara Rahman|Female|2015-07-12|Md. Faisal Rahman|01711010136|Jhenaidah|A+',
  'STD-137|Nayeem Ahmed|Male|2015-09-25|Md. Nayeem Ahmed|01711010137|Natore|B+',
  'STD-138|Sumaiya Islam|Female|2015-10-08|Md. Hossain Ali|01711010138|Khulna|O+',
  'STD-139|Rifatul Hasan|Male|2015-02-17|Md. Akbar Hasan|01711010139|Bogura|A-',
  'STD-140|Faria Sultana|Female|2015-12-03|Md. Rafiqul Alam|01711010140|Kushtia|B+',
  // CLASS 5 - SECTION C
  'STD-141|Ahnaf Hossain|Male|2015-01-27|Md. Morshed Hossain|01711010141|Kushtia|O+',
  'STD-142|Mahi Rahman|Female|2015-05-06|Md. Alam Rahman|01711010142|Dhaka|A+',
  'STD-143|Arham Islam|Male|2015-07-15|Md. Arif Islam|01711010143|Pabna|B+',
  'STD-144|Eshika Jahan|Female|2015-03-19|Md. Nazrul Islam|01711010144|Rajshahi|O+',
  'STD-145|Rezaul Karim|Male|2015-06-26|Md. Karimullah|01711010145|Kushtia|AB+',
  'STD-146|Tasmia Islam|Female|2015-08-10|Md. Haris Uddin|01711010146|Magura|A+',
  'STD-147|Fahad Ahmed|Male|2015-09-13|Md. Fahad Ahmed|01711010147|Khulna|O+',
  'STD-148|Huma Jahan|Female|2015-10-30|Md. Shafiqur Rahman|01711010148|Faridpur|B+',
  'STD-149|Rohan Hossain|Male|2015-04-02|Md. Rohan Hossain|01711010149|Kushtia|A+',
  'STD-150|Nabila Sultana|Female|2015-11-21|Md. Aminul Islam|01711010150|Jhenaidah|O+',
  // CLASS 6 - SECTION A
  'STD-151|Sakib Hossain|Male|2014-02-05|Md. Sakib Hossain|01711010151|Kushtia|B+',
  'STD-152|Anisha Rahman|Female|2014-04-17|Md. Shafayat Rahman|01711010152|Dhaka|A+',
  'STD-153|Hasan Mahmud|Male|2014-06-08|Md. Mahmudur Rahman|01711010153|Pabna|O+',
  'STD-154|Tuba Jahan|Female|2014-03-12|Md. Asif Hossain|01711010154|Rajshahi|AB+',
  'STD-155|Rakin Islam|Male|2014-05-24|Md. Rakin Islam|01711010155|Kushtia|O+',
  'STD-156|Sadiya Akter|Female|2014-07-16|Md. Delwar Hossain|01711010156|Khulna|A+',
  'STD-157|Maruf Hasan|Male|2014-09-02|Md. Maruf Hasan|01711010157|Bogura|B+',
  'STD-158|Rukaiya Noor|Female|2014-10-19|Md. Rafsan Ali|01711010158|Magura|O+',
  'STD-159|Siam Ahmed|Male|2014-01-31|Md. Sohel Ahmed|01711010159|Faridpur|A-',
  'STD-160|Muntaha Islam|Female|2014-11-13|Md. Munirul Islam|01711010160|Kushtia|B+',
  // CLASS 6 - SECTION B
  'STD-161|Zayan Hossain|Male|2014-02-15|Md. Zahir Hossain|01711010161|Kushtia|O+',
  'STD-162|Raiha Rahman|Female|2014-05-07|Md. Arman Rahman|01711010162|Dhaka|A+',
  'STD-163|Noman Hasan|Male|2014-07-23|Md. Noman Hasan|01711010163|Pabna|B+',
  'STD-164|Samira Jahan|Female|2014-03-27|Md. Saiful Hossain|01711010164|Rajshahi|O+',
  'STD-165|Ayman Kabir|Male|2014-06-14|Md. Kabir Uddin|01711010165|Kushtia|AB+',
  'STD-166|Fariha Akter|Female|2014-08-05|Md. Kamal Uddin|01711010166|Chuadanga|A+',
  'STD-167|Shanto Islam|Male|2014-09-17|Md. Shanto Islam|01711010167|Natore|O+',
  'STD-168|Rima Noor|Female|2014-10-28|Md. Aminul Haque|01711010168|Jhenaidah|B+',
  'STD-169|Araf Hossain|Male|2014-01-12|Md. Abdul Gafur|01711010169|Khulna|A+',
  'STD-170|Elma Sultana|Female|2014-12-06|Md. Nazim Uddin|01711010170|Kushtia|O+',
  // CLASS 6 - SECTION C
  'STD-171|Shafin Hossain|Male|2014-02-22|Md. Shafiq Hossain|01711010171|Kushtia|B+',
  'STD-172|Nabila Islam|Female|2014-04-11|Md. Nabil Islam|01711010172|Dhaka|A+',
  'STD-173|Arif Rahman|Male|2014-06-29|Md. Arif Rahman|01711010173|Pabna|O+',
  'STD-174|Afsana Akter|Female|2014-03-08|Md. Yousuf Ali|01711010174|Rajshahi|AB+',
  'STD-175|Tawhid Hasan|Male|2014-05-17|Md. Tawhid Hasan|01711010175|Kushtia|O+',
  'STD-176|Zarin Jahan|Female|2014-07-09|Md. Hasan Mahmud|01711010176|Magura|A+',
  'STD-177|Riad Ahmed|Male|2014-09-26|Md. Riad Ahmed|01711010177|Bogura|B+',
  'STD-178|Sohana Islam|Female|2014-10-16|Md. Selim Uddin|01711010178|Khulna|O+',
  'STD-179|Tamim Hossain|Male|2014-01-24|Md. Tamim Hossain|01711010179|Faridpur|A-',
  'STD-180|Sabila Rahman|Female|2014-11-30|Md. Rahman Ali|01711010180|Kushtia|B+',
  // CLASS 7 - SECTION A
  'STD-181|Mahin Islam|Male|2013-01-11|Md. Mahin Islam|01711010181|Kushtia|O+',
  'STD-182|Ayesha Jahan|Female|2013-04-22|Md. Anwar Hossain|01711010182|Dhaka|A+',
  'STD-183|Nabil Hossain|Male|2013-06-18|Md. Nabil Hossain|01711010183|Pabna|B+',
  'STD-184|Tanjina Akter|Female|2013-03-06|Md. Abdul Barek|01711010184|Rajshahi|O+',
  'STD-185|Imran Hasan|Male|2013-05-15|Md. Imran Hasan|01711010185|Kushtia|AB+',
  'STD-186|Mahi Noor|Female|2013-07-20|Md. Javed Hossain|01711010186|Khulna|A+',
  'STD-187|Shakil Ahmed|Male|2013-09-04|Md. Shakil Ahmed|01711010187|Bogura|O+',
  'STD-188|Safa Islam|Female|2013-10-12|Md. Rezaul Islam|01711010188|Magura|B+',
  'STD-189|Afnan Rahman|Male|2013-02-28|Md. Afnan Rahman|01711010189|Faridpur|A+',
  'STD-190|Jui Sultana|Female|2013-11-09|Md. Zillur Rahman|01711010190|Kushtia|O+',
  // CLASS 7 - SECTION B
  'STD-191|Rifat Islam|Male|2013-01-23|Md. Rifat Islam|01711010191|Kushtia|B+',
  'STD-192|Anika Rahman|Female|2013-04-09|Md. Rokon Rahman|01711010192|Dhaka|A+',
  'STD-193|Samiul Hasan|Male|2013-07-14|Md. Samiul Hasan|01711010193|Pabna|O+',
  'STD-194|Noshin Jahan|Female|2013-03-18|Md. Ruhul Amin|01711010194|Rajshahi|AB+',
  'STD-195|Adib Hossain|Male|2013-06-21|Md. Adib Hossain|01711010195|Kushtia|O+',
  'STD-196|Rukaiya Akter|Female|2013-08-06|Md. Saiful Hossain|01711010196|Jhenaidah|A+',
  'STD-197|Raihan Ahmed|Male|2013-09-19|Md. Raihan Ahmed|01711010197|Natore|B+',
  'STD-198|Mahira Islam|Female|2013-10-27|Md. Rahman Hossain|01711010198|Khulna|O+',
  'STD-199|Tasin Rahman|Male|2013-02-12|Md. Tasin Rahman|01711010199|Faridpur|A-',
  'STD-200|Sadiya Noor|Female|2013-12-05|Md. Shahidul Islam|01711010200|Kushtia|B+',
  // CLASS 7 - SECTION C
  'STD-201|Zishan Hossain|Male|2013-01-06|Md. Zishan Hossain|01711010201|Kushtia|O+',
  'STD-202|Sumaiya Rahman|Female|2013-05-16|Md. Sayed Rahman|01711010202|Dhaka|A+',
  'STD-203|Faizan Islam|Male|2013-07-08|Md. Faizan Islam|01711010203|Pabna|B+',
  'STD-204|Fariha Jahan|Female|2013-03-24|Md. Arman Hossain|01711010204|Rajshahi|O+',
  'STD-205|Hasan Ahmed|Male|2013-06-09|Md. Hasan Ahmed|01711010205|Kushtia|AB+',
  'STD-206|Sabiha Akter|Female|2013-08-17|Md. Abdul Qader|01711010206|Magura|A+',
  'STD-207|Shafin Rahman|Male|2013-09-29|Md. Shafin Rahman|01711010207|Bogura|O+',
  'STD-208|Tanjila Islam|Female|2013-10-05|Md. Habib Rahman|01711010208|Khulna|B+',
  'STD-209|Moinul Hasan|Male|2013-04-13|Md. Moinul Hasan|01711010209|Faridpur|A+',
  'STD-210|Nusaiba Sultana|Female|2013-11-22|Md. Nasir Uddin|01711010210|Kushtia|O+',
  // CLASS 8 - SECTION A
  'STD-211|Abdullah Hasan|Male|2012-02-01|Md. Abdullah Hasan|01711010211|Kushtia|B+',
  'STD-212|Jannat Rahman|Female|2012-04-20|Md. Saiful Rahman|01711010212|Dhaka|A+',
  'STD-213|Rashed Hossain|Male|2012-06-15|Md. Rashed Hossain|01711010213|Pabna|O+',
  'STD-214|Tasmia Akter|Female|2012-03-07|Md. Hafizur Rahman|01711010214|Rajshahi|AB+',
  'STD-215|Nahid Islam|Male|2012-05-22|Md. Nahid Islam|01711010215|Kushtia|O+',
  'STD-216|Mehnaz Rahman|Female|2012-07-11|Md. Mahfuz Rahman|01711010216|Khulna|A+',
  'STD-217|Arman Ahmed|Male|2012-09-18|Md. Arman Ahmed|01711010217|Bogura|B+',
  'STD-218|Fariha Islam|Female|2012-10-26|Md. Rashed Islam|01711010218|Magura|O+',
  'STD-219|Tareq Hossain|Male|2012-01-29|Md. Tareq Hossain|01711010219|Faridpur|A-',
  'STD-220|Samia Sultana|Female|2012-11-16|Md. Mostafizur Rahman|01711010220|Kushtia|B+',
  // CLASS 8 - SECTION B
  'STD-221|Foysal Hasan|Male|2012-02-13|Md. Foysal Hasan|01711010221|Kushtia|O+',
  'STD-222|Nabila Noor|Female|2012-05-04|Md. Shah Alam|01711010222|Dhaka|A+',
  'STD-223|Rakin Ahmed|Male|2012-07-19|Md. Rakin Ahmed|01711010223|Pabna|B+',
  'STD-224|Afsana Islam|Female|2012-03-16|Md. Azizul Islam|01711010224|Rajshahi|O+',
  'STD-225|Sohan Hossain|Male|2012-06-28|Md. Sohan Hossain|01711010225|Kushtia|AB+',
  'STD-226|Eshrat Jahan|Female|2012-08-09|Md. Jahangir Alam|01711010226|Chuadanga|A+',
  'STD-227|Faisal Rahman|Male|2012-09-21|Md. Faisal Rahman|01711010227|Natore|O+',
  'STD-228|Tanjim Akter|Female|2012-10-03|Md. Nizam Uddin|01711010228|Jhenaidah|B+',
  'STD-229|Sadman Islam|Male|2012-01-18|Md. Sadman Islam|01711010229|Khulna|A+',
  'STD-230|Rima Sultana|Female|2012-12-07|Md. Abdur Razzak|01711010230|Kushtia|O+',
  // CLASS 8 - SECTION C
  'STD-231|Muntasir Rahman|Male|2012-02-24|Md. Muntasir Rahman|01711010231|Kushtia|B+',
  'STD-232|Sadiya Jahan|Female|2012-04-14|Md. Abdul Mannan|01711010232|Dhaka|A+',
  'STD-233|Rafi Hossain|Male|2012-06-07|Md. Rafi Hossain|01711010233|Pabna|O+',
  'STD-234|Mahiya Islam|Female|2012-03-21|Md. Mizanur Rahman|01711010234|Rajshahi|AB+',
  'STD-235|Arham Hasan|Male|2012-05-18|Md. Arham Hasan|01711010235|Kushtia|O+',
  'STD-236|Anjum Akter|Female|2012-07-26|Md. Nur Islam|01711010236|Magura|A+',
  'STD-237|Tamim Rahman|Male|2012-09-10|Md. Tamim Rahman|01711010237|Bogura|B+',
  'STD-238|Sadia Noor|Female|2012-10-22|Md. Habib Uddin|01711010238|Khulna|O+',
  'STD-239|Naim Ahmed|Male|2012-01-05|Md. Naim Ahmed|01711010239|Faridpur|A-',
  'STD-240|Jannatul Mawa|Female|2012-11-28|Md. Abdul Aziz|01711010240|Kushtia|B+',
  // CLASS 9 - SECTION A
  'STD-241|Shadman Hossain|Male|2011-01-17|Md. Shadman Hossain|01711010241|Kushtia|O+',
  'STD-242|Sohana Rahman|Female|2011-04-09|Md. Sohana Rahman|01711010242|Dhaka|A+',
  'STD-243|Riyad Hasan|Male|2011-06-22|Md. Riyad Hasan|01711010243|Pabna|B+',
  'STD-244|Afrin Jahan|Female|2011-03-14|Md. Abdul Hamid|01711010244|Rajshahi|O+',
  'STD-245|Anas Islam|Male|2011-05-07|Md. Anas Islam|01711010245|Kushtia|AB+',
  'STD-246|Rafia Akter|Female|2011-07-18|Md. Zahirul Islam|01711010246|Khulna|A+',
  'STD-247|Taufiq Ahmed|Male|2011-09-03|Md. Taufiq Ahmed|01711010247|Bogura|O+',
  'STD-248|Nusrat Islam|Female|2011-10-12|Md. Ashraf Ali|01711010248|Magura|B+',
  'STD-249|Arafat Rahman|Male|2011-02-21|Md. Arafat Rahman|01711010249|Faridpur|A+',
  'STD-250|Tasnim Sultana|Female|2011-11-05|Md. Mostafa Kamal|01711010250|Kushtia|O+',
  // CLASS 9 - SECTION B
  'STD-251|Fardin Hossain|Male|2011-01-29|Md. Fardin Hossain|01711010251|Kushtia|B+',
  'STD-252|Mst. Tanjila Rahman|Female|2011-05-13|Md. Golam Mostafa|01711010252|Dhaka|A+',
  'STD-253|Shihab Hasan|Male|2011-07-06|Md. Shihab Hasan|01711010253|Pabna|O+',
  'STD-254|Sabiha Jahan|Female|2011-03-25|Md. Akram Ali|01711010254|Rajshahi|AB+',
  'STD-255|Abrar Ahmed|Male|2011-06-17|Md. Abrar Ahmed|01711010255|Kushtia|O+',
  'STD-256|Rida Islam|Female|2011-08-11|Md. Sohel Islam|01711010256|Jhenaidah|A+',
  'STD-257|Zubair Rahman|Male|2011-09-24|Md. Zubair Rahman|01711010257|Natore|B+',
  'STD-258|Jannat Akter|Female|2011-10-19|Md. Shahidul Islam|01711010258|Khulna|O+',
  'STD-259|Nayeem Hossain|Male|2011-02-08|Md. Nayeem Hossain|01711010259|Faridpur|A-',
  'STD-260|Faria Rahman|Female|2011-12-01|Md. Faria Rahman|01711010260|Kushtia|B+',
  // CLASS 9 - SECTION C
  'STD-261|Hridoy Islam|Male|2011-02-16|Md. Hridoy Islam|01711010261|Kushtia|O+',
  'STD-262|Mahi Jahan|Female|2011-04-27|Md. Ehsan Habib|01711010262|Dhaka|A+',
  'STD-263|Rohan Hasan|Male|2011-06-10|Md. Rohan Hasan|01711010263|Pabna|B+',
  'STD-264|Arisha Islam|Female|2011-03-05|Md. Arif Rahman|01711010264|Rajshahi|O+',
  'STD-265|Fahim Hossain|Male|2011-05-19|Md. Fahim Hossain|01711010265|Kushtia|AB+',
  'STD-266|Sanzida Akter|Female|2011-07-23|Md. Anwar Kabir|01711010266|Magura|A+',
  'STD-267|Riyaz Ahmed|Male|2011-09-07|Md. Riyaz Ahmed|01711010267|Bogura|O+',
  'STD-268|Tania Rahman|Female|2011-10-29|Md. Tania Rahman|01711010268|Khulna|B+',
  'STD-269|Sifat Islam|Male|2011-01-12|Md. Sifat Islam|01711010269|Faridpur|A+',
  'STD-270|Nusaiba Jahan|Female|2011-11-17|Md. Jashim Uddin|01711010270|Kushtia|O+',
  // CLASS 10 - SECTION A
  'STD-271|Tanvir Hossain|Male|2010-02-09|Md. Tanvir Hossain|01711010271|Kushtia|B+',
  'STD-272|Fariha Rahman|Female|2010-04-13|Md. Fariha Rahman|01711010272|Dhaka|A+',
  'STD-273|Rashed Hasan|Male|2010-06-18|Md. Rashed Hasan|01711010273|Pabna|O+',
  'STD-274|Sumaiya Jahan|Female|2010-03-27|Md. Humayun Kabir|01711010274|Rajshahi|AB+',
  'STD-275|Nabil Hossain|Male|2010-05-11|Md. Nabil Hossain|01711010275|Kushtia|O+',
  'STD-276|Sadiya Akter|Female|2010-07-20|Md. Sadiya Akter|01711010276|Khulna|A+',
  'STD-277|Arman Islam|Male|2010-09-04|Md. Arman Islam|01711010277|Bogura|B+',
  'STD-278|Jannatul Ferdous|Female|2010-10-15|Md. Jannatul Ferdous|01711010278|Magura|O+',
  'STD-279|Fahad Rahman|Male|2010-01-26|Md. Fahad Rahman|01711010279|Faridpur|A-',
  'STD-280|Nusrat Jahan|Female|2010-11-09|Md. Nusrat Jahan|01711010280|Kushtia|B+',
  // CLASS 10 - SECTION B
  'STD-281|Saif Hossain|Male|2010-02-17|Md. Saif Hossain|01711010281|Kushtia|O+',
  'STD-282|Ayesha Rahman|Female|2010-05-08|Md. Azim Rahman|01711010282|Dhaka|A+',
  'STD-283|Rafiq Islam|Male|2010-07-14|Md. Rafiq Islam|01711010283|Pabna|B+',
  'STD-284|Mehnaz Jahan|Female|2010-03-19|Md. Mehnaz Jahan|01711010284|Rajshahi|O+',
  'STD-285|Rakib Hasan|Male|2010-06-05|Md. Rakib Hasan|01711010285|Kushtia|AB+',
  'STD-286|Sohana Akter|Female|2010-08-12|Md. Selim Hossain|01711010286|Chuadanga|A+',
  'STD-287|Mahfuz Rahman|Male|2010-09-29|Md. Mahfuz Rahman|01711010287|Natore|O+',
  'STD-288|Tasmia Islam|Female|2010-10-07|Md. Tasmia Islam|01711010288|Jhenaidah|B+',
  'STD-289|Adnan Ahmed|Male|2010-01-13|Md. Adnan Ahmed|01711010289|Khulna|A+',
  'STD-290|Rafia Sultana|Female|2010-12-18|Md. Rafia Sultana|01711010290|Kushtia|O+',
  // CLASS 10 - SECTION C
  'STD-291|Shahriar Hossain|Male|2010-02-25|Md. Shahriar Hossain|01711010291|Kushtia|B+',
  'STD-292|Nabila Rahman|Female|2010-04-16|Md. Nabila Rahman|01711010292|Dhaka|A+',
  'STD-293|Samiul Hasan|Male|2010-06-09|Md. Samiul Hasan|01711010293|Pabna|O+',
  'STD-294|Tanjila Jahan|Female|2010-03-08|Md. Tanjila Jahan|01711010294|Rajshahi|AB+',
  'STD-295|Imran Hossain|Male|2010-05-21|Md. Imran Hossain|01711010295|Kushtia|O+',
  'STD-296|Fariha Akter|Female|2010-07-30|Md. Fariha Akter|01711010296|Magura|A+',
  'STD-297|Raihan Islam|Male|2010-09-16|Md. Raihan Islam|01711010297|Bogura|B+',
  'STD-298|Sadia Rahman|Female|2010-10-24|Md. Sadia Rahman|01711010298|Khulna|O+',
  'STD-299|Fahim Ahmed|Male|2010-01-07|Md. Fahim Ahmed|01711010299|Faridpur|A-',
  'STD-300|Jannat Sultana|Female|2010-11-15|Md. Jannat Sultana|01711010300|Kushtia|B+',
]

function esc(s: string): string {
  return s.replace(/'/g, "''")
}

async function main() {
  console.log(`Seeding ${rawStudents.length} students...`)

  const school = await prisma.school.findFirst()
  if (!school) throw new Error('No school found. Run the main seed first.')

  const academicYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  })
  if (!academicYear) throw new Error('No active academic year found. Run the main seed first.')

  const password = await hash('Student@12345', 12)

  // Create/ensure 30 classes exist using upserts
  const classCache = new Map<string, string>()
  for (let c = 1; c <= 10; c++) {
    for (const sec of ['A', 'B', 'C']) {
      const code = `CLS${c}-${sec}`
      const cls = await prisma.class.upsert({
        where: { code },
        update: {},
        create: {
          name: `Class ${c}`,
          section: sec,
          code,
          academicYearId: academicYear.id,
        },
      })
      classCache.set(code, cls.id)
    }
  }
  console.log('Ensured 30 classes exist.')

  // Pre-parse all students and resolve emails
  const usedEmails = new Set<string>()
  const parsed = rawStudents.map((raw, i) => {
    const parts = raw.split('|')
    const idx0 = i
    const cNum = Math.floor(idx0 / 30) + 1
    const secIdx = Math.floor((idx0 % 30) / 10)
    const sec = ['A', 'B', 'C'][secIdx]
    const rollNo = (idx0 % 10) + 1

    let email = generateEmail(parts[1])
    let suffix = 1
    while (usedEmails.has(email)) {
      const base = generateEmail(parts[1]).replace('@educare.edu.bd', '')
      email = `${base}${suffix}@educare.edu.bd`
      suffix++
    }
    usedEmails.add(email)

    const nameParts = parts[1].split(' ')
    const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0]
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
    const gender = parts[2] === 'Male' ? 'MALE' : 'FEMALE'

    const userId = randomUUID()
    const studentId = randomUUID()

    return {
      admissionNo: parts[0],
      name: parts[1],
      gender,
      dob: parts[3],
      guardianName: parts[4],
      guardianPhone: parts[5],
      district: parts[6],
      bloodGroup: parts[7],
      classId: classCache.get(`CLS${cNum}-${sec}`)!,
      rollNo,
      email,
      firstName,
      lastName,
      userId,
      studentId,
    }
  })

  // Bulk insert users with ON CONFLICT DO UPDATE
  console.log('Inserting users...')
  const userTuples = parsed.map((s) => {
    const now = new Date().toISOString()
    return `('${esc(s.userId)}','${esc(`STU-${s.admissionNo}`)}','${esc(s.email)}','${esc(password)}','${esc(s.name)}','STUDENT','ACTIVE','${esc(s.guardianPhone)}','${esc(school.id)}',true,'${esc(now)}','${esc(now)}')`
  })

  for (let i = 0; i < userTuples.length; i += 50) {
    const chunk = userTuples.slice(i, i + 50)
    await prisma.$executeRawUnsafe(`
      INSERT INTO "User" ("id", "regNo", "email", "passwordHash", "name", "role", "status", "phone", "schoolId", "forcePasswordChange", "createdAt", "updatedAt")
      VALUES ${chunk.join(',')}
      ON CONFLICT ("email") DO UPDATE SET "id" = EXCLUDED."id", "regNo" = EXCLUDED."regNo", "passwordHash" = EXCLUDED."passwordHash", "name" = EXCLUDED."name", "role" = EXCLUDED."role", "status" = EXCLUDED."status", "phone" = EXCLUDED."phone", "schoolId" = EXCLUDED."schoolId", "forcePasswordChange" = EXCLUDED."forcePasswordChange", "updatedAt" = EXCLUDED."updatedAt"
    `)
  }
  console.log(`  Inserted ${parsed.length} users.`)

  // Bulk insert students with ON CONFLICT DO UPDATE
  console.log('Inserting students...')
  const studentValues = parsed.map((s) => {
    const now = new Date().toISOString()
    return `('${esc(s.studentId)}','${esc(s.userId)}','${esc(s.admissionNo)}','${esc(s.firstName)}','${esc(s.lastName)}','${esc(s.dob)}','${esc(s.gender)}','${esc(s.bloodGroup)}','${esc(s.district)}','${esc(s.district)}','${esc(s.guardianName)}','Father','${esc(s.guardianPhone)}','${esc(s.classId)}',${s.rollNo},'ACTIVE','${esc(now)}','${esc(now)}')`
  })

  for (let i = 0; i < studentValues.length; i += 50) {
    const chunk = studentValues.slice(i, i + 50)
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Student" ("id", "userId", "admissionNo", "firstName", "lastName", "dob", "gender", "bloodGroup", "address", "city", "guardianName", "guardianRelation", "guardianPhone", "classId", "rollNo", "status", "createdAt", "updatedAt")
      VALUES ${chunk.join(',')}
      ON CONFLICT ("admissionNo") DO UPDATE SET "userId" = EXCLUDED."userId", "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "dob" = EXCLUDED."dob", "gender" = EXCLUDED."gender", "bloodGroup" = EXCLUDED."bloodGroup", "address" = EXCLUDED."address", "city" = EXCLUDED."city", "guardianName" = EXCLUDED."guardianName", "guardianRelation" = EXCLUDED."guardianRelation", "guardianPhone" = EXCLUDED."guardianPhone", "classId" = EXCLUDED."classId", "rollNo" = EXCLUDED."rollNo", "status" = EXCLUDED."status", "updatedAt" = EXCLUDED."updatedAt"
    `)
  }
  console.log(`  Inserted ${parsed.length} students.`)

  // Fetch actual student IDs (ON CONFLICT may keep original cuid IDs)
  const admissionNos = parsed.map(s => `'${esc(s.admissionNo)}'`).join(',')
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; admissionNo: string }>>(
    `SELECT "id", "admissionNo" FROM "Student" WHERE "admissionNo" IN (${admissionNos})`
  )
  const studentIdMap = new Map(rows.map(r => [r.admissionNo, r.id]))

  // Bulk insert enrollments with ON CONFLICT DO UPDATE
  console.log('Inserting enrollments...')
  const now = new Date().toISOString()
  const enrollmentTuples = parsed.map((s) => {
    const actualId = studentIdMap.get(s.admissionNo)!
    return `('${esc(randomUUID())}','${esc(actualId)}','${esc(s.classId)}','${esc(academicYear.id)}','${esc(now)}','ACTIVE','${esc(now)}')`
  })

  for (let i = 0; i < enrollmentTuples.length; i += 50) {
    const chunk = enrollmentTuples.slice(i, i + 50)
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Enrollment" ("id", "studentId", "classId", "academicYearId", "enrollmentDate", "status", "createdAt")
      VALUES ${chunk.join(',')}
      ON CONFLICT ("studentId", "academicYearId", "classId") DO UPDATE SET "status" = EXCLUDED."status"
    `)
  }
  console.log(`  Inserted ${parsed.length} enrollments.`)

  console.log(`\nDone. Created ${parsed.length} students across 30 class sections.`)
  console.log(`Default password for all students: Student@12345`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
