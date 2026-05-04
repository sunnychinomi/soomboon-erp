import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  th: {
    translation: {
      login: {
        eyebrow: 'ก่อตั้ง 2528 · อรัญประเทศ',
        h1: 'ระบบจัดการ',
        h2: 'อะไหล่ยานยนต์',
        sub: 'ครอบคลุมทุกการดำเนินงานตั้งแต่คลังสินค้า การจัดซื้อ การขาย ไปจนถึงการชำระเงิน',
        items: 'รายการสินค้า',
        branches: 'สาขา',
        staff: 'พนักงาน',
        welcome: 'ยินดีต้อนรับกลับ',
        desc: 'กรอกข้อมูลของคุณเพื่อเข้าสู่ระบบ',
        user: 'ชื่อผู้ใช้',
        userPh: 'ชื่อผู้ใช้หรืออีเมล',
        pass: 'รหัสผ่าน',
        passPh: 'รหัสผ่าน',
        remember: 'จดจำการเข้าสู่ระบบ',
        forgot: 'ลืมรหัสผ่าน?',
        btn: 'เข้าสู่ระบบ →',
        or: 'หรือ',
        fb: 'เข้าสู่ระบบด้วย Facebook',
      },
      nav: {
        dashboard: 'แดชบอร์ด',
        inventory: 'คลังสินค้า',
        purchase: 'จัดซื้อ',
        sales: 'การขาย',
        admin: 'ผู้ดูแลระบบ',
      },
    },
  },
  en: {
    translation: {
      login: {
        eyebrow: 'EST. 1985 · ARANYAPRATHET',
        h1: 'Auto Parts',
        h2: 'Management System',
        sub: 'Complete operations platform — from inventory to procurement, sales, and collections.',
        items: 'SKUs',
        branches: 'Branches',
        staff: 'Staff',
        welcome: 'Welcome back',
        desc: 'Enter your credentials to continue',
        user: 'Username',
        userPh: 'Username or email',
        pass: 'Password',
        passPh: 'Password',
        remember: 'Keep me signed in',
        forgot: 'Forgot password?',
        btn: 'Sign in →',
        or: 'OR',
        fb: 'Continue with Facebook',
      },
      nav: {
        dashboard: 'Dashboard',
        inventory: 'Inventory',
        purchase: 'Purchase',
        sales: 'Sales',
        admin: 'Admin',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('lang') || 'th',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
