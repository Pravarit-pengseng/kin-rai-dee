from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["Public Legal Pages"])

PRIVACY_POLICY_HTML = """<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>นโยบายความเป็นส่วนตัว (Privacy Policy) - Kin-Rai-Dee</title>
    <meta name="description" content="นโยบายความเป็นส่วนตัวของแอปพลิเคชัน กินไรดี (Kin-Rai-Dee)">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #A7392A;
            --primary-light: #FFF0EB;
            --secondary: #DCA64E;
            --text-main: #332421;
            --text-muted: #6B5B57;
            --bg-page: #FFF8ED;
            --bg-card: #FFFFFF;
            --border: #F0E2D8;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Noto Sans Thai', 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg-page);
            color: var(--text-main);
            line-height: 1.7;
            padding: 24px 16px;
        }
        .container {
            max-width: 840px;
            margin: 0 auto;
            background: var(--bg-card);
            border-radius: 20px;
            padding: 40px 32px;
            box-shadow: 0 8px 30px rgba(87, 66, 62, 0.08);
            border: 1px solid var(--border);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid var(--border);
            padding-bottom: 24px;
            margin-bottom: 32px;
        }
        .brand {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 26px;
            font-weight: 800;
            color: var(--primary);
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-main);
            margin-bottom: 8px;
        }
        .date {
            font-size: 14px;
            color: var(--text-muted);
        }
        h2 {
            font-size: 18px;
            font-weight: 700;
            color: var(--primary);
            margin-top: 28px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        p, li {
            font-size: 15px;
            color: var(--text-main);
            margin-bottom: 12px;
        }
        ul {
            padding-left: 20px;
            margin-bottom: 16px;
        }
        li {
            margin-bottom: 6px;
        }
        .badge {
            display: inline-block;
            background: var(--primary-light);
            color: var(--primary);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .contact-box {
            background: var(--bg-page);
            border-left: 4px solid var(--primary);
            padding: 16px 20px;
            border-radius: 8px;
            margin-top: 24px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 13px;
            color: var(--text-muted);
            border-top: 1px solid var(--border);
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand">KIN-RAI-DEE (กินไรดี)</div>
            <h1>นโยบายความเป็นส่วนตัว (Privacy Policy)</h1>
            <div class="date">ปรับปรุงล่าสุดเมื่อ: 21 ตุลาคม 2569 | มีผลบังคับใช้ทันที</div>
        </div>

        <span class="badge">เอกสารสาธารณะ • ไม่จำกัดภูมิภาค • เข้าถึงได้ตลอดเวลา</span>

        <p>แอปพลิเคชัน <strong>"กินไรดี" (Kin-Rai-Dee)</strong> ให้ความสำคัญอย่างยิ่งต่อการคุ้มครองข้อมูลส่วนบุคคลของท่าน เพื่อให้ท่านมั่นใจในการใช้งานบริการสุ่มและแบ่งปันไอเดียเมนูอาหาร นโยบายความเป็นส่วนตัวนี้อธิบายถึงวิธีการเก็บรวบรวม ใช้ เปิดเผย และปกป้องข้อมูลส่วนบุคคลของท่านตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) และมาตรฐานสากล</p>

        <h2>1. ข้อมูลที่เราเก็บรวบรวม</h2>
        <p>เมื่อท่านสร้างบัญชีหรือใช้งานแอปพลิเคชัน เราอาจรวบรวมข้อมูลดังต่อไปนี้:</p>
        <ul>
            <li><strong>ข้อมูลบัญชีผู้ใช้:</strong> ที่อยู่อีเมล, ชื่อที่แสดง (Display Name), ชื่อผู้ใช้ (Username), คำแนะนำตัว (Bio), และรูปโปรไฟล์</li>
            <li><strong>เนื้อหาที่ผู้ใช้สร้าง (User-Generated Content):</strong> โพสต์แนะนำอาหาร, รูปภาพอาหาร, ลิงก์พิกัดร้านอาหาร, หมวดหมู่อาหาร, ความคิดเห็น และรายการเมนูที่บันทึกไว้</li>
            <li><strong>ข้อมูลความปลอดภัยและการปฏิสัมพันธ์:</strong> รายการผู้ใช้ที่ท่านบล็อก (Blocked Users), รายงานเนื้อหาและพฤติกรรมไม่เหมาะสม (Reports), ประวัติการค้นหา</li>
        </ul>

        <h2>2. วัตถุประสงค์ในการประมวลผลข้อมูล</h2>
        <ul>
            <li>เพื่อให้บริการฟังก์ชันหลักของแอป เช่น การค้นหา สุ่มเมนูอาหาร บันทึกรายการ และการแสดงฟีด</li>
            <li>เพื่อดูแลความปลอดภัยและความสงบเรียบร้อยของชุมชนผู้ใช้งาน รวมถึงการกลั่นกรองเนื้อหา (Content Moderation), การปิดกั้นผู้ใช้ที่ไม่พึงประสงค์ (User Blocking), และการดำเนินการตามรายงาน (Reporting System)</li>
            <li>เพื่อยืนยันตัวตนและป้องกันการเข้าถึงบัญชีโดยไม่ได้รับอนุญาต</li>
        </ul>

        <h2>3. สิทธิของผู้ใช้ตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล</h2>
        <p>ท่านมีสิทธิอย่างเต็มที่ในการจัดการข้อมูลส่วนบุคคลของท่าน ดังนี้:</p>
        <ul>
            <li><strong>สิทธิในการเข้าถึงและแก้ไขข้อมูล:</strong> สามารถแก้ไขข้อมูลโปรไฟล์ ชื่อ และรูปภาพได้ตลอดเวลาผ่านหน้า "แก้ไขโปรไฟล์"</li>
            <li><strong>สิทธิในการบล็อกและจัดการความเป็นส่วนตัว:</strong> สามารถบล็อกผู้ใช้ที่ไม่ต้องการมีปฏิสัมพันธ์ และปลดบล็อกได้ตลอดเวลาผ่านหน้า "ผู้ใช้ที่ถูกบล็อก"</li>
            <li><strong>สิทธิในการลบบัญชีและข้อมูลส่วนบุคคล (Account Deletion):</strong> ท่านสามารถขอลบบัญชีผู้ใช้และข้อมูลทั้งหมดได้ทันทีผ่านเมนู <em>"ตั้งค่า > ลบบัญชีผู้ใช้"</em> ในแอปพลิเคชัน โดยระบบจะดำเนินการลบข้อมูลโพสต์ ความคิดเห็น และข้อมูลระบุตัวตนทั้งหมดอย่างถาวร</li>
        </ul>

        <h2>4. การรักษาความปลอดภัยของข้อมูล</h2>
        <p>เราให้ความสำคัญกับความปลอดภัยของข้อมูลของคุณ โดยใช้มาตรการรักษาความปลอดภัยที่ได้มาตรฐาน มีการเข้ารหัสข้อมูลขณะรับส่ง และจำกัดสิทธิ์การเข้าถึงข้อมูล เพื่อป้องกันการสูญหาย การรั่วไหล หรือการเข้าถึงโดยไม่ได้รับอนุญาต</p>

        <h2>5. การเปิดเผยข้อมูลแก่บุคคลภายนอก</h2>
        <p>เราไม่มีนโยบายจำหน่ายหรือเปิดเผยข้อมูลส่วนบุคคลของท่านให้แก่บุคคลที่สามเพื่อผลประโยชน์ทางการค้า เว้นแต่ได้รับความยินยอมจากท่าน หรือเป็นการปฏิบัติตามกฎหมาย คำสั่งศาล หรือหน่วยงานที่มีอำนาจตามกฎหมาย</p>

        <div class="contact-box">
            <p><strong>ช่องทางการติดต่อเรื่องความเป็นส่วนตัว:</strong></p>
            <p>หากท่านมีข้อสงสัยหรือต้องการใช้สิทธิเกี่ยวกับข้อมูลส่วนบุคคล สามารถติดต่อเจ้าหน้าที่คุ้มครองข้อมูลได้ที่:</p>
            <p>อีเมล: privacy@kinraidee.app | ทีมพัฒนาแอปพลิเคชัน กินไรดี (Kin-Rai-Dee)</p>
        </div>

        <div class="footer">
            &copy; 2026 Kin-Rai-Dee. สงวนลิขสิทธิ์ทั้งหมดตามกฎหมาย.
        </div>
    </div>
</body>
</html>
"""

TERMS_OF_USE_HTML = """<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ข้อกำหนดการใช้งาน (Terms of Use) - Kin-Rai-Dee</title>
    <meta name="description" content="ข้อกำหนดและเงื่อนไขการใช้งานแอปพลิเคชัน กินไรดี (Kin-Rai-Dee)">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #A7392A;
            --primary-light: #FFF0EB;
            --secondary: #DCA64E;
            --text-main: #332421;
            --text-muted: #6B5B57;
            --bg-page: #FFF8ED;
            --bg-card: #FFFFFF;
            --border: #F0E2D8;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Noto Sans Thai', 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg-page);
            color: var(--text-main);
            line-height: 1.7;
            padding: 24px 16px;
        }
        .container {
            max-width: 840px;
            margin: 0 auto;
            background: var(--bg-card);
            border-radius: 20px;
            padding: 40px 32px;
            box-shadow: 0 8px 30px rgba(87, 66, 62, 0.08);
            border: 1px solid var(--border);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid var(--border);
            padding-bottom: 24px;
            margin-bottom: 32px;
        }
        .brand {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 26px;
            font-weight: 800;
            color: var(--primary);
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-main);
            margin-bottom: 8px;
        }
        .date {
            font-size: 14px;
            color: var(--text-muted);
        }
        h2 {
            font-size: 18px;
            font-weight: 700;
            color: var(--primary);
            margin-top: 28px;
            margin-bottom: 12px;
        }
        p, li {
            font-size: 15px;
            color: var(--text-main);
            margin-bottom: 12px;
        }
        ul {
            padding-left: 20px;
            margin-bottom: 16px;
        }
        li {
            margin-bottom: 6px;
        }
        .rule-card {
            background: var(--primary-light);
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 16px;
            border-left: 4px solid var(--primary);
        }
        .rule-card strong {
            color: var(--primary);
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 13px;
            color: var(--text-muted);
            border-top: 1px solid var(--border);
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand">KIN-RAI-DEE (กินไรดี)</div>
            <h1>ข้อกำหนดการใช้งาน (Terms of Use)</h1>
            <div class="date">ปรับปรุงล่าสุดเมื่อ: 21 ตุลาคม 2569</div>
        </div>

        <p>ยินดีต้อนรับสู่แอปพลิเคชัน <strong>"กินไรดี" (Kin-Rai-Dee)</strong> การสมัครบัญชีและการเข้าใช้งานแอปพลิเคชันนี้ ถือว่าท่านตกลงและยอมรับข้อกำหนดและเงื่อนไขการใช้งานดังต่อไปนี้อย่างครบถ้วน</p>

        <h2>1. แนวทางปฏิบัติและกฎเกณฑ์ของชุมชน (Community Guidelines)</h2>
        <p>Kin-Rai-Dee เป็นชุมชนที่เน้นการแบ่งปันความสุขเรื่องอาหาร เพื่อรักษาบรรยากาศที่สร้างสรรค์และปลอดภัย ผู้ใช้งานทุกคนต้องปฏิบัติตามกฎต่อไปนี้:</p>
        
        <div class="rule-card">
            <strong>ห้ามเนื้อหาที่ไม่เหมาะสมและผิดกฎหมาย:</strong> ไม่อนุญาตให้โพสต์รูปภาพลามกอนาจาร ความรุนแรง ถ้อยคำหยาบคาย หรือเนื้อหาที่ไม่เกี่ยวข้องกับอาหาร
        </div>
        <div class="rule-card">
            <strong>ห้ามการคุกคามและการกลั่นแกล้ง:</strong> ห้ามใช้ถ้อยคำดูถูก คุกคาม ข่มขู่ หรือล้อเลียนผู้อื่นในทุกรูปแบบ ไม่ว่าจะในโพสต์หรือความคิดเห็น
        </div>
        <div class="rule-card">
            <strong>ห้ามสแปมและการค้าที่ผิดวัตถุประสงค์:</strong> ห้ามโพสต์ข้อความซ้ำซ้อน โฆษณาเว็บการพนัน ขายสินค้าผิดกฎหมาย หรือปล่อยลิงก์หลอกลวง (Phishing)
        </div>
        <div class="rule-card">
            <strong>เคารพลิขสิทธิ์และทรัพย์สินทางปัญญา:</strong> ต้องเป็นเจ้าของภาพหรือได้รับอนุญาตในการเผยแพร่ ห้ามนำผลงาน ภาพถ่าย หรือข้อความของผู้อื่นมาแอบอ้างเป็นของตนเอง
        </div>
        <div class="rule-card">
            <strong>เคารพความเป็นส่วนตัว:</strong> ห้ามเผยแพร่ข้อมูลส่วนบุคคลของผู้อื่น เช่น เบอร์โทรศัพท์ ที่อยู่ หรือภาพถ่ายบุคคลโดยไม่ได้รับอนุญาต
        </div>

        <h2>2. ระบบการรายงานและการบล็อก (Safety & Moderation)</h2>
        <p>เพื่อปกป้องความปลอดภัยของผู้ใช้งาน ระบบได้จัดเตรียมเครื่องมือดังต่อไปนี้:</p>
        <ul>
            <li><strong>การรายงานเนื้อหา (Reporting):</strong> ผู้ใช้สามารถรายงานโพสต์ ความคิดเห็น หรือผู้ใช้งานที่ละเมิดข้อกำหนดได้ทันที ทีมงานผู้ดูแลระบบจะดำเนินการตรวจสอบและมีมาตรการจัดการ (ตักเตือน, ซ่อนเนื้อหา, ลบเนื้อหา, หรือระงับบัญชี)</li>
            <li><strong>การบล็อกผู้ใช้ (Blocking):</strong> ผู้ใช้สามารถบล็อกบุคคลที่ไม่พึงประสงค์ได้ทันที ระบบจะซ่อนโพสต์และคอมเมนต์ของบุคคลนั้นจากฟีดของท่าน และป้องกันการโต้ตอบระหว่างกัน</li>
        </ul>

        <h2>3. สิทธิในเนื้อหาของผู้ใช้ (User Content License)</h2>
        <p>ท่านยังคงเป็นเจ้าของลิขสิทธิ์ในเนื้อหาและรูปภาพที่ท่านโพสต์ โดยการโพสต์เนื้อหาลงใน Kin-Rai-Dee ท่านได้อนุญาตให้แอปพลิเคชันสิทธิ์แบบไม่จำกัดแต่เพียงผู้เดียว (Non-exclusive) ในการแสดงผล จัดเก็บ และเผยแพร่เนื้อหาดังกล่าวภายในแอปพลิเคชันตามวัตถุประสงค์ของการให้บริการ</p>

        <h2>4. การสิ้นสุดการให้บริการและการลบบัญชี</h2>
        <p>ท่านสามารถยกเลิกการใช้งานและลบบัญชีของท่านได้ตลอดเวลาผ่านหน้าการตั้งค่า หากพบว่าผู้ใช้กระทำการฝ่าฝืนข้อกำหนดร้ายแรง Kin-Rai-Dee ขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีผู้ใช้โดยไม่ต้องแจ้งให้ทราบล่วงหน้า</p>

        <div class="footer">
            &copy; 2026 Kin-Rai-Dee. สงวนลิขสิทธิ์ทั้งหมดตามกฎหมาย.
        </div>
    </div>
</body>
</html>
"""


@router.get("/privacy-policy", response_class=HTMLResponse)
def get_privacy_policy_page():
    """Public read-only Privacy Policy page (accessible globally, non-PDF, web viewable)."""
    return HTMLResponse(content=PRIVACY_POLICY_HTML, status_code=200)


@router.get("/terms", response_class=HTMLResponse)
@router.get("/terms-of-use", response_class=HTMLResponse)
def get_terms_of_use_page():
    """Public read-only Terms of Use page."""
    return HTMLResponse(content=TERMS_OF_USE_HTML, status_code=200)
