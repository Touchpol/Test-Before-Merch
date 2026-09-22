
// Seed database with initial dataset (upsert)
const connectDB = require('./db');
const User = require('./models/User');
const Artist = require('./models/Artist');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const Payment = require('./models/Payment');
const Review = require('./models/Review');
const mongoose = require('mongoose');

// Upsert documents using _id filter
async function upsertDocs(model, docs) {
    const ops = (Array.isArray(docs) ? docs : [docs]).map((doc) => ({
        updateOne: {
            filter: { _id: doc._id },
            update: { $set: doc },
            upsert: true
        }
    }));
    if (ops.length) await model.bulkWrite(ops);
}

async function runSeed() {
    await connectDB();

    try {
        // Users (Admin & Customer)
        await upsertDocs(User, [
            {
                _id: "681a0f1e2d3c4b5a6970f001",
                email: "non@merchroom.com",
                firstName: "นนท์",
                lastName: "ใจงาม",
                phone: "0812345678",
                interests: ["streetwear", "art"],
                address: "123 สุขุมวิท กรุงเทพฯ 10110",
                paymentMethods: ["PromptPay", "บัตรเครดิต"],
                profilePicture: "/uploads/non.png",
                socialAccounts: ["google"],
                password: "$2a$10$placeholderBcryptHashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                role: "customer"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f003",
                email: "admin@merchroom.com",
                firstName: "ทีม",
                lastName: "แอดมิน",
                phone: "0898765432",
                interests: [],
                address: "",
                paymentMethods: [],
                profilePicture: "",
                socialAccounts: [],
                password: "$2a$10$placeholderBcryptHashYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
                role: "admin",
                employeeId: "EMP-0001"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f002",
                email: "focusjustdoit@gmail.com",
                firstName: "Focus",
                lastName: "Niti",
                phone: "0809203752",
                interests: [],
                address: "bangkok",
                paymentMethods: ["Promtpunk"],
                profilePicture: "",
                socialAccounts: [],
                password: "000000000000",
                role: "admin",
                employeeId: "EMP-0002"
            },
            {
                _id: "6900f1e2d3c4b5a6970f0023",
                email: "touchy2003@gmail.com",
                firstName: "Touch",
                lastName: "Chy",
                phone: "0809203752",
                interests: [],
                address: "bangkok",
                paymentMethods: ["Promtpunk"],
                profilePicture: "",
                socialAccounts: [],
                password: "000000000000",
                role: "customer"
            }
        ]);

        // Categories
        await upsertDocs(Category, [
            { _id: "681a0f1e2d3c4b5a6970f010", name: "เสื้อผ้า", slug: "apparel" },
            { _id: "681a0f1e2d3c4b5a6970f011", name: "หมวก", slug: "hat" },
            { _id: "681a0f1e2d3c4b5a6970f013", name: "แฟนไอเทม", slug: "fanmerch" },
            { _id: "681a0f1e2d3c4b5a6970f014", name: "อัลบั้มเพลง", slug: "album" }
        ]);

        // Artists
        await upsertDocs(Artist, [
            {
                _id: "681a0f1e2d3c4b5a6970f070",
                name: "Nont Tanont (นนท์ ธนนท์)",
                realName: "ธนนท์ จำเริญ",
                type: "solo",
                bio: "แชมป์ The Voice Thailand ซีซัน 1 และ The Mask Singer หน้ากากเป็ดน้อย นักร้องเสียงนุ่มละมุน เจ้าของเพลงฮิต โต๊ะริม, วันครบเลิก และ ฝืนตัวเองไม่เป็น สังกัดเลิฟอีส",
                style: "pop, R&B",
                socialLinks: ["https://www.instagram.com/tanont916/"],
                profilePic: "/artists/nont-tanont.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f071",
                name: "Jeff Satur (เจฟ ซาเตอร์)",
                realName: "วรกมล ซาเตอร์",
                type: "solo",
                bio: "นักร้อง-นักแต่งเพลง-นักแสดง เชื้อสายไทย-จีน-อังกฤษ เจ้าของบท 'คิมหันต์' ใน KinnPorsche The Series และเพลง 'แค่เธอ (why don't you stay)' สังกัด Wayfer Records",
                style: "R&B, pop",
                socialLinks: ["https://www.instagram.com/jeffsatur/"],
                profilePic: "/artists/jeff-satur.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f072",
                name: "Joey Phuwasit (โจอี้ ภูวศิษฐ์)",
                realName: "ภูวศิษฐ์ อนันต์พรสิริ",
                type: "solo",
                bio: "นักร้องหนุ่มเลือดอีสาน รองแชมป์ The Voice Thailand 2018 เจ้าของเพลงไวรัล 'ดวงเดือน' และ 'นะหน้าทอง' ยอดวิวทะลุ 100 ล้าน สังกัดเจนี่ เรคคอร์ด ในเครือ GMM Grammy",
                style: "pop-rock, หมอลำ",
                socialLinks: ["https://www.instagram.com/joeypws/"],
                profilePic: "/artists/joey-phuwasit.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f073",
                name: "Bird Thongchai (เบิร์ด ธงไชย)",
                realName: "ธงไชย แมคอินไตย์",
                type: "solo",
                bio: "ซูเปอร์สตาร์เมืองไทย ศิลปินแห่งชาติ สาขาศิลปะการแสดง พ.ศ. 2565 ยอดจำหน่ายผลงานรวมกว่า 25 ล้านชุด เจ้าของเพลงดัง สบาย สบาย, บูมเมอแรง และ คู่กรรม",
                style: "pop, dance-pop",
                socialLinks: ["https://www.instagram.com/birdthongchai/", "https://www.facebook.com/birdthongchai"],
                profilePic: "/artists/bird-thongchai.jpg"
            },
            //Band
            {
                _id: "681a0f1e2d3c4b5a6970f080",
                name: "Three Man Down (ทรีแมนดาวน์)",
                realName: "",
                type: "band",
                bio: "วงป็อปร็อกแห่งยุค สังกัดค่าย GeneLab ในเครือ GMM Grammy ผ่านเวที Band Lab เจ้าของเพลงฮิต 'ฝนตกไหม', 'ฝันถึงแฟนเก่า', 'ถ้าเธอรักฉันจริง', 'เดาไม่เก่ง', 'ข้างกัน' และอัลบั้ม '28' ถูกจัดอันดับเป็นศิลปินไทยที่ถูกสตรีมมากที่สุดปี 2023 บน Spotify",
                style: "pop-rock",
                socialLinks: ["https://www.instagram.com/threemandownofficial/"],
                profilePic: "/artists/three-man-down.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f081",
                name: "Paradox (พาราด็อกซ์)",
                realName: "",
                type: "band",
                bio: "วงร็อก-ป็อปขวัญใจวัยรุ่น สังกัดค่าย Genie Records ในเครือ GMM Grammy เจ้าของเพลงฮิต 'อาบน้ำ', 'Summer', 'อยู่ในใจ', 'จำได้ไหม', 'คิดถึง' และ 'ฟ้า' พร้อมคอนเสิร์ต Unplugged สุดประทับใจ",
                style: "pop-rock",
                socialLinks: ["https://www.instagram.com/paradoxthailand/"],
                profilePic: "/artists/paradox.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f082",
                name: "Clash (แคลช)",
                realName: "",
                type: "band",
                bio: "วงร็อกระดับตำนานของเมืองไทย สังกัด GMM Grammy ผ่านเวที Hot Wave เจ้าของเพลงฮิต 'เธอจะอยู่กับฉันตลอดไป', 'ขอเช็ดน้ำตา', 'เพลงสุดท้าย', 'เกินคำว่ารัก', 'อยู่ตรงนี้เสมอ' กลับมาอีกครั้งพร้อมอัลบั้ม 'ONE' ฉลองครบ 20 ปีวง",
                style: "rock, pop",
                socialLinks: ["https://www.instagram.com/clashrockband/"],
                profilePic: "/artists/clash.jpg"
            },
            //Group/Idol
            {
                _id: "681a0f1e2d3c4b5a6970f083",
                name: "Perses (เพอร์เซส)",
                realName: "",
                type: "group",
                bio: "บอยกรุ๊ป 5 หนุ่มจากค่าย G'NEST สังกัด GMM Music แฟนคลับชื่อ 'PIECES' เจ้าของรางวัล JOOX Spotlight Group of the Year เตรียมเปิดตัวแท่งไฟทางการ (Official Light Stick) ปี 2025",
                style: "T-pop, idol",
                socialLinks: ["https://www.instagram.com/persesofficial/"],
                profilePic: "/artists/perses.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f084",
                name: "BUS because of you i shine (บัส)",
                realName: "",
                type: "group",
                bio: "บอยกรุ๊ป 12 หนุ่มจากค่าย Sonray Music ภายใต้ TADA Entertainment แฟนคลับชื่อ 'BEUS' ศิลปินกลุ่มแรกของวงการ T-POP ที่ได้ขึ้นเวที K-POP M COUNTDOWN ที่เกาหลีใต้ เจ้าของเพลง 'เพราะคุณ I Shine', 'TRANSFORMER', 'แค่ไหนแค่นั้น'",
                style: "T-pop, idol",
                socialLinks: ["https://www.instagram.com/busbecauseofyouishine/"],
                profilePic: "/artists/bus.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f085",
                name: "4EVE (โฟร์อีฟ)",
                realName: "",
                type: "group",
                bio: "เกิร์ลกรุ๊ป 7 สาวจากค่าย XOXO Entertainment แฟนคลับชื่อ 'EVE's' เจ้าของเพลงฮิต 'วาดไว้', 'ขยับ', 'TEST ME', 'วัดปะหล่ะ? TELL ME' และ 'Life Goes On' หนึ่งใน T-POP เกิร์ลกรุ๊ปที่มาแรงที่สุดในไทย",
                style: "T-pop, girl group",
                socialLinks: ["https://www.instagram.com/4eve_official/"],
                profilePic: "/artists/4eve.jpg"
            }
        ]);

        // Products
        await upsertDocs(Product, [
        //Solo artist
            {
                _id: "681a0f1e2d3c4b5a6970f020",
                name: "NONT TANONT Official Light Stick",
                description: "ไลต์สติกของทางการ CO-DESIGNED BY NONT TANONT จำหน่ายจริง 1,690 บาทที่ LOVEiS Shop โหมด ON > SLOW > QUICK > FLASH > OFF ใช้ถ่าน AAA 3 ก้อน",
                price: 1690,
                quantity: 60,
                date: "2026-08-01T00:00:00.000+00:00",
                tags: ["official", "lightstick", "fanmerch"],
                category: "681a0f1e2d3c4b5a6970f013",
                artist: "681a0f1e2d3c4b5a6970f070",
                imageUrl: "https://static.wixstatic.com/media/3e5f79_b335950dc9804fb48dd2ded4f983e9a1~mv2.jpg/v1/fit/w_500,h_500,q_90/file.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f025",
                name: "อัลบั้ม Cigarette Candy & Vanilla Sky (Vinyl Limited Edition Triple LP) - Nont Tanont",
                description: "ไวนิลลิมิเต็ด Triple LP จำหน่ายจริง 3,500 บาท (+ค่าจัดส่ง 150 บาท) ที่ LOVEiS Shop/LINE Shopping รวบรวมเรื่องราว 10 ปีของ นนท์ ธนนท์",
                price: 3500,
                quantity: 20,
                date: "2026-08-01T00:00:00.000+00:00",
                tags: ["limited", "vinyl", "collectible"],
                category: "681a0f1e2d3c4b5a6970f014",
                artist: "681a0f1e2d3c4b5a6970f070",
                imageUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/5e/2b/94/5e2b94f0-77f5-62e3-8f3c-d5e76405b8bc/cover.jpg/600x600bb.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f021",
                name: "Jeff Satur Official Light Stick V.2 (Air Traffic Control Tower)",
                description: "ไลต์สติกของทางการ Jeff Satur โมเดล Air Traffic Control Tower ราคาอ้างอิง $135 จากอัลบั้มแรก Space Shuttle No.8",
                price: 4600,
                quantity: 30,
                date: "2026-07-10T00:00:00.000+00:00",
                tags: ["official", "lightstick", "new-arrival"],
                category: "681a0f1e2d3c4b5a6970f013",
                artist: "681a0f1e2d3c4b5a6970f071",
                imageUrl: "https://www.funiki.nl/cdn/shop/files/7d6715e7-79df-2601-c536-661c0f283b64_1_ca6ed650-5c3c-4893-9e9e-b48c15298969.webp?v=1744374338"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f022",
                name: "Jeff Satur Asia Tour Bucket Hat (Space Shuttle No.8)",
                description: "หมวกบัคเก็ตของทางการ Jeff Satur Asia Tour คอลเลกชัน Space Shuttle No.8 ราคาอ้างอิง €50",
                price: 2000,
                quantity: 25,
                date: "2026-07-15T00:00:00.000+00:00",
                tags: ["official", "tour", "hat"],
                category: "681a0f1e2d3c4b5a6970f011",
                artist: "681a0f1e2d3c4b5a6970f071",
                imageUrl: "https://www.funiki.nl/cdn/shop/files/30ece5cd-0c94-d34a-9352-6687727cbec2.webp?v=1725817232"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f026",
                name: "Jeff Satur Asia Tour T-Shirt (Space Shuttle No.8)",
                description: "เสื้อยืดทัวร์เอเชียของทางการ Jeff Satur คอลเลกชัน Space Shuttle No.8 Asia Tour ไซซ์ฟรี ราคาอ้างอิง €55",
                price: 2200,
                quantity: 40,
                date: "2026-08-05T00:00:00.000+00:00",
                tags: ["official", "tour", "tshirt"],
                category: "681a0f1e2d3c4b5a6970f010",
                artist: "681a0f1e2d3c4b5a6970f071",
                imageUrl: "https://www.funiki.nl/cdn/shop/files/7b8ed8f4-b4a4-6878-148a-668772e12bfc.webp?v=1725816523"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f023",
                name: "Bird Twenty Two (Color Vinyl) - เบิร์ด ธงไชย",
                description: "แผ่นเสียงไวนิลสีของจริง อัลบั้ม Bird Twenty Two จำหน่าย 2,200 บาท ที่ Chiva Record หมวดเพลงไทยไทยของ GMM Grammy",
                price: 2200,
                quantity: 15,
                date: "2026-07-25T00:00:00.000+00:00",
                tags: ["vinyl", "collectible", "premium"],
                category: "681a0f1e2d3c4b5a6970f014",
                artist: "681a0f1e2d3c4b5a6970f073",
                imageUrl: "https://chivarecord.com/wp-content/uploads/2022/12/LINE_ALBUM_2023.7.6_%E0%B9%92%E0%B9%93%E0%B9%90%E0%B9%97%E0%B9%90%E0%B9%96_9.webp"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f027",
                name: "Dream For Love (Yellow Vinyl) - เบิร์ด ธงไชย",
                description: "แผ่นเสียงไวนิลสีเหลือง ของจริง จำหน่าย 2,000 บาท ที่ Chiva Record เพลง รักเธอเท่าไหร่, เราคงจะได้พบกัน, เล่าสู่กันฟัง ร่วมกับคริสติน่า ใหม่ ลีเดีย อัญชลี",
                price: 2000,
                quantity: 15,
                date: "2026-08-10T00:00:00.000+00:00",
                tags: ["vinyl", "collectible"],
                category: "681a0f1e2d3c4b5a6970f014",
                artist: "681a0f1e2d3c4b5a6970f073",
                imageUrl: "https://chivarecord.com/wp-content/uploads/2025/11/dream.webp"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f024",
                name: "ยาดมภูวสูด - ของที่ระลึกงานสาธารณะสุข STATION",
                description: "ยาดมของที่ระลึกสุดเอ็กซ์คลูซีฟ ออกแบบพิเศษสำหรับงาน Fan Meeting เปิดอัลบั้ม 'สาธารณะสุข' ของโจอี้ ภูวศิษฐ์ (สถานีกลางกรุงเทพอภิวัฒน์ 30 ก.ค. 2569)",
                price: 99,
                quantity: 100,
                date: "2026-07-30T00:00:00.000+00:00",
                tags: ["official", "souvenir", "new-arrival"],
                category: "681a0f1e2d3c4b5a6970f013",
                artist: "681a0f1e2d3c4b5a6970f072",
                imageUrl: "https://storage-wp.thaipost.net/2026/08/JOEYSTATION_001-1.jpg"
            },
        //Band
            {
                _id: "681a0f1e2d3c4b5a6970f090",
                name: "Three Man Down – อัลบั้ม '28' (Box Set CD)",
                description: "Box Set CD อัลบั้มเต็มชุดที่สองของวง Three Man Down จำหน่ายจริง 790 บาท ที่ GMM Music Store / We Love Turntable ประกอบด้วย Growth Diary 54 หน้า, โปสเตอร์ขนาดใหญ่, โปสการ์ด 8 ใบ, Floppy Disc กระดาษ, MD Replica, กล่อง VHS กระดาษ และ CD 11 แทร็ค + CD Demo พิเศษ",
                price: 790,
                quantity: 30,
                date: "2024-07-28T00:00:00.000+00:00",
                tags: ["official", "cd", "boxset", "collectible"],
                category: "681a0f1e2d3c4b5a6970f014",
                artist: "681a0f1e2d3c4b5a6970f080",
                imageUrl: "https://weloveturntable.com/wp-content/uploads/2024/10/DSCF4031.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f091",
                name: "PARADOX UNPLUGGED T-Shirt",
                description: "เสื้อยืดของทางการจากคอนเสิร์ต PARADOX UNPLUGGED จำหน่ายจริง 590 บาท ที่ GMM Music Store ผ้าฝ้าย Cotton 100% ใส่ได้ทุกฤดู",
                price: 590,
                quantity: 50,
                date: "2024-09-27T00:00:00.000+00:00",
                tags: ["official", "tshirt", "tour"],
                category: "681a0f1e2d3c4b5a6970f010",
                artist: "681a0f1e2d3c4b5a6970f081",
                imageUrl: "/products/paradox-unplugged-tshirt.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f092",
                name: "PARADOX UNPLUGGED Sweater",
                description: "เสื้อสเวตเตอร์ของทางการจากคอนเสิร์ต PARADOX UNPLUGGED จำหน่ายจริง 950 บาท ที่ GMM Music Store เนื้อผ้าหนาอุ่นใส่สบาย",
                price: 950,
                quantity: 40,
                date: "2024-09-27T00:00:00.000+00:00",
                tags: ["official", "sweater", "tour"],
                category: "681a0f1e2d3c4b5a6970f010",
                artist: "681a0f1e2d3c4b5a6970f081",
                imageUrl: "/products/paradox-unplugged-sweater.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f093",
                name: "CLASH อัลบั้ม ONE T-Shirt",
                description: "เสื้อยืดของทางการ CLASH (แคลช) ธีมอัลบั้ม 'ONE' ราคา 690 บาท มี 3 แบบให้เลือก พรีออเดอร์ที่ GMM Music Store ระยะเวลาการจองตามประกาศของร้าน",
                price: 690,
                quantity: 50,
                date: "2026-08-10T00:00:00.000+00:00",
                tags: ["official", "tshirt", "new-arrival"],
                category: "681a0f1e2d3c4b5a6970f010",
                artist: "681a0f1e2d3c4b5a6970f082",
                imageUrl: "https://scontent.fbkk28-1.fna.fbcdn.net/v/t39.30808-6/654291590_1573408487941850_167124190072589168_n.jpg?stp=dst-jpg_tt6&cstp=mx1080x1080&ctp=p526x296&_nc_cat=110&ccb=1-7&_nc_sid=127cfc&_nc_ohc=ypNZT7dxViwQ7kNvwH3wjf9&_nc_oc=AdrjiPJZMno3f3TR8oxMngzZ_pW6gb-1yKwJOfw3pv6LtslQoqQapKMD56IaKTj3oC8&_nc_zt=23&_nc_ht=scontent.fbkk28-1.fna&_nc_gid=ASuxdh3S08ijCYDuzt_eVQ&_nc_ss=7b289&oh=00_AQG71YuOMhtOwpiRBQWFONXUjrWn_0OUCq_pDyhwJsvnWQ&oe=6A8752BC"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f094",
                name: "Clash อัลบั้ม SoundShake T-SHIRT",
                description: "เสื้อยืดของทางการ CLASH (แคลช) ธีมอัลบั้ม 'SoundShake' ราคา 690 บาท มี 3 แบบให้เลือก พรีออเดอร์ที่ GMM Music Store ระยะเวลาการจองตามประกาศของร้าน",
                price: 690,
                quantity: 100,
                date: "2026-08-10T00:00:00.000+00:00",
                tags: ["official", "tshirt", "new-arrival"],
                category: "681a0f1e2d3c4b5a6970f010",
                artist: "681a0f1e2d3c4b5a6970f082",
                imageUrl: "https://scontent.fbkk28-1.fna.fbcdn.net/v/t39.30808-6/654291590_1573408487941850_167124190072589168_n.jpg?stp=dst-jpg_tt6&cstp=mx1080x1080&ctp=p526x296&_nc_cat=110&ccb=1-7&_nc_sid=127cfc&_nc_ohc=ypNZT7dxViwQ7kNvwH3wjf9&_nc_oc=AdrjiPJZMno3f3TR8oxMngzZ_pW6gb-1yKwJOfw3pv6LtslQoqQapKMD56IaKTj3oC8&_nc_zt=23&_nc_ht=scontent.fbkk28-1.fna&_nc_gid=5drCKWwYOVRkfs_S2WbX2g&_nc_ss=7b289&oh=00_AQHynvwnao9__9yVsCkvDd1nR4VclIdzmrhXm15Cg8ydiA&oe=6A8752BC"
            },
        //Group/Idol
            {
                _id: "681a0f1e2d3c4b5a6970f095",
                name: "PERSES Official Light Stick",
                description: "แท่งไฟของทางการ PERSES Version 1 ราคา 1,890 บาท เปิดพรีออเดอร์ 27 ส.ค. - 9 ก.ย. 2568 ผ่าน LINE SHOPPING @GMMSHOPS ชุดประกอบด้วยแท่งไฟ พร้อมอุปกรณ์ประกอบ",
                price: 1890,
                quantity: 40,
                date: "2025-08-27T00:00:00.000+00:00",
                tags: ["official", "lightstick", "new-arrival"],
                category: "681a0f1e2d3c4b5a6970f013",
                artist: "681a0f1e2d3c4b5a6970f083",
                imageUrl: "/products/perses-lightstick.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f096",
                name: "URTHE x PERSES เสื้อฮู้ด Oversize 'PIECES HOODIE'(พิมพ์ว่า URTHE x PERSES เสื้อฮู้ด Oversize)",
                description: "เสื้อฮู้ดแขนยาวทรง Oversize จากคอลเลกชันพิเศษ URTHE x PERSES ในคอนเซ็ปต์ 'YOU ARE THE PIECES OF PERSES' ด้านหลังเด่นด้วยงานกราฟิกตัวอักษรขนาดใหญ่สไตล์สตรีทแฟชั่น",
                price: 1290,
                quantity: 30,
                date: "2025-10-01T00:00:00.000+00:00",
                tags: ["collab", "hoodie", "streetwear"],
                category: "681a0f1e2d3c4b5a6970f010",
                artist: "681a0f1e2d3c4b5a6970f083",
                imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQb5WGnEPQNqpWy3HA-akMuU-BxZVM235y4COeAp7xlUOIdB7UHmXSpvw&s=10"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f097",
                name: "BUS Official Light Stick 'BOB'",
                description: "แท่งไฟของทางการ BUS because of you i shine ชื่อ 'BOB' (ตั้งโดย BUS เอง) ราคา 1,890 บาท เปิดจำหน่าย 24 พ.ย. 2568 ที่ ketchup SHOP มาพร้อมแอปพลิเคชันปรับสีไฟ",
                price: 1890,
                quantity: 50,
                date: "2025-11-24T00:00:00.000+00:00",
                tags: ["official", "lightstick", "new-arrival"],
                category: "681a0f1e2d3c4b5a6970f013",
                artist: "681a0f1e2d3c4b5a6970f084",
                imageUrl: "https://scontent.fbkk28-1.fna.fbcdn.net/v/t39.30808-6/587961318_709362475547753_1488274372556956257_n.jpg?stp=dst-jpg_tt6&cstp=mx1200x1500&ctp=s640x640&_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_ohc=2J0vyvsEx9IQ7kNvwFibNX-&_nc_oc=AdplJmngOpWFwLlXadAENMCcjt8AuRRfQhBRTt58TIF0fvLGu7t1qdefxSgmZ0jULos&_nc_zt=23&_nc_ht=scontent.fbkk28-1.fna&_nc_gid=QQDsyAMAf5TMBvtMeMbx7w&_nc_ss=7b289&oh=00_AQF87xgwJLw_vX0VfCKXimSVmdcK29a0SbwVzY3aVxiylw&oe=6A8753B2"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f098",
                name: "BUS The 1st Concert LIGHT THE WORLD T-Shirt",
                description: "เสื้อยืดของทางการจากคอนเสิร์ตใหญ่ครั้งแรก 'BUS because of you i shine The 1st Concert LIGHT THE WORLD' จำหน่ายที่บูท TADA Merch",
                price: 590,
                quantity: 40,
                date: "2025-03-14T00:00:00.000+00:00",
                tags: ["official", "concert", "tshirt"],
                category: "681a0f1e2d3c4b5a6970f010",
                artist: "681a0f1e2d3c4b5a6970f084",
                imageUrl: "/products/bus-concert-tshirt.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f099",
                name: "4EVE ART TOY : Limited Blind Box Figure (แยกกล่อง)",
                description: "ฟิกเกอร์กล่องสุ่มลิมิเต็ดของทางการ 4EVE จากค่าย XOXO Entertainment คาแรกเตอร์ 7 สาว มายด์, โจริญ, ตาออม, แฮนน่า, ฝ้าย, พั้นช์ และอ๊ะอาย มีตัว Rare และ Super Rare ให้ลุ้น ราคากล่องละ 750 บาท",
                price: 750,
                quantity: 100,
                date: "2024-10-26T00:00:00.000+00:00",
                tags: ["official", "art-toy", "blindbox", "collectible"],
                category: "681a0f1e2d3c4b5a6970f013",
                artist: "681a0f1e2d3c4b5a6970f085",
                imageUrl: "/products/4eve-art-toy.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f09a",
                name: "4EVE ART TOY : Limited Blind Box Figure (ยกกล่อง)",
                description: "ชุดยกกล่อง 4EVE ART TOY Limited Blind Box Figure ครบชุดสะสม ลุ้นตัว Rare ได้แน่นอน ราคา 6,000 บาท",
                price: 6000,
                quantity: 10,
                date: "2024-10-26T00:00:00.000+00:00",
                tags: ["official", "art-toy", "blindbox", "collectible", "limited"],
                category: "681a0f1e2d3c4b5a6970f013",
                artist: "681a0f1e2d3c4b5a6970f085",
                imageUrl: "/products/4eve-art-toy-case.jpg"
            },
            {
                _id: "681a0f1e2d3c4b5a6970f09b",
                name: "แท่งไฟ 4EVE รุ่นใหม่ (4EVE Light Stick New Version)",
                description: "แท่งไฟของทางการ 4EVE รุ่นใหม่ ราคา 1,200 บาท วัสดุใหม่แข็งแรงทนทาน พร้อมแอปพลิเคชันปรับสีไฟ จำหน่ายทางออนไลน์และบูทในคอนเสิร์ต",
                price: 1200,
                quantity: 80,
                date: "2024-10-26T00:00:00.000+00:00",
                tags: ["official", "lightstick", "new-arrival"],
                category: "681a0f1e2d3c4b5a6970f013",
                artist: "681a0f1e2d3c4b5a6970f085",
                imageUrl: "/products/4eve-lightstick.jpg"
            }
        ]);

        // Carts
        await upsertDocs(Cart, [
            {
                _id: "681a0f1e2d3c4b5a6970f030",
                userId: "681a0f1e2d3c4b5a6970f001",
                items: [{ productId: "681a0f1e2d3c4b5a6970f021", quantity: 1 }]
            }
        ]);

        // Orders
        await upsertDocs(Order, [
            {
                _id: "681a0f1e2d3c4b5a6970f040",
                userId: "681a0f1e2d3c4b5a6970f001",
                totalAmount: 5690,
                status: "success",
                shippingProvider: "Kerry",
                shippingAddress: "123 สุขุมวิท กรุงเทพฯ 10110",
                purchaseDate: "2026-07-13T10:00:00.000+00:00",
                items: [
                    {
                        _id: "681a0f1e2d3c4b5a6970f041",
                        productId: "681a0f1e2d3c4b5a6970f020",
                        name: "NONT TANONT Official Light Stick",
                        price: 1690,
                        quantity: 1
                    },
                    {
                        _id: "681a0f1e2d3c4b5a6970f042",
                        productId: "681a0f1e2d3c4b5a6970f022",
                        name: "Jeff Satur Asia Tour Bucket Hat (Space Shuttle No.8)",
                        price: 2000,
                        quantity: 2
                    }
                ]
            }
        ]);

        // Payments
        await upsertDocs(Payment, [
            {
                _id: "681a0f1e2d3c4b5a6970f050",
                orderId: "681a0f1e2d3c4b5a6970f040",
                amount: 5690,
                method: "PromptPay",
                status: "paid"
            }
        ]);

        // Reviews
        await upsertDocs(Review, [
            {
                _id: "681a0f1e2d3c4b5a6970f060",
                userId: "681a0f1e2d3c4b5a6970f001",
                productId: "681a0f1e2d3c4b5a6970f020",
                rating: 5,
                comment: "ไฟสว่างมาก ลายสวย ใช้งานง่าย คุ้มกับราคา"
            }
        ]);

        console.log('[SUCCESS 🎉] Database seeded successfully🍃');

    } catch (err) {
        console.error('[ERROR ❌] Seeding failed:', err);
    } finally {
        mongoose.connection.close();
    }
}

runSeed();