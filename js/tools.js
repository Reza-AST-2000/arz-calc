/* Registry of categories and tools shown in the app. */
const CATEGORIES = [
  { id:'usage',  title:'محاسبات کاربردی', icon:'🧮' },
  { id:'money',  title:'مالی و روزمره',   icon:'💰' },
  { id:'qr',     title:'QR و امنیت',      icon:'🔑' },
  { id:'misc',   title:'ابزارهای متفرقه', icon:'🛠' },
];

const TOOLS = [
  { id:'bmi', cat:'usage', name:'قد و وزن (BMI)', desc:'شاخص توده بدنی و وضعیت سلامت', icon:'⚖️' },
  { id:'age', cat:'usage', name:'محاسبه سن (شمسی)', desc:'سن دقیق، روزهای مانده تا تولد', icon:'🎂' },
  { id:'dateconv', cat:'usage', name:'تبدیل تاریخ جامع', desc:'شمسی، میلادی و قمری', icon:'📅' },
  { id:'percent', cat:'usage', name:'درصدگیری مبلغ', desc:'تخفیف، افزایش، نسبت دو عدد', icon:'٪' },
  { id:'discount', cat:'usage', name:'تخفیف و مالیات', desc:'قیمت نهایی و مقدار سود', icon:'🏷️' },

  { id:'loan', cat:'money', name:'وام و اقساط', desc:'مبلغ هر قسط و کل سود پرداختی', icon:'🏦' },
  { id:'deposit', cat:'money', name:'سود سپرده بانکی', desc:'سود ماهانه و کل سپرده', icon:'💵' },
  { id:'bill', cat:'money', name:'تقسیم صورت‌حساب (دنگی)', desc:'سهم هر نفر با احتساب انعام', icon:'🧾' },
  { id:'trade', cat:'money', name:'سود و زیان معامله', desc:'خرید و فروش ارز، طلا یا هرچیز دیگه', icon:'📈' },
  { id:'datediff', cat:'money', name:'فاصله بین دو تاریخ/ساعت', desc:'چند روز، ساعت و دقیقه فاصله‌ست', icon:'⏳' },
  { id:'inflation', cat:'money', name:'تورم و کاهش ارزش پول', desc:'ارزش امروزی یک مبلغ در گذشته', icon:'📉' },
  { id:'sqmeter', cat:'money', name:'قیمت متری و ساختمانی', desc:'قیمت هر متر، متراژ کاشی و رنگ', icon:'🏠' },

  { id:'qrgen', cat:'qr', name:'ساخت QR کد', desc:'وبسایت، وای‌فای، تلگرام و...', icon:'▪️' },
  { id:'qrscan', cat:'qr', name:'اسکن QR', desc:'با آپلود عکس، تشخیص نوع محتوا', icon:'📷' },
  { id:'password', cat:'qr', name:'رمز عبور قوی', desc:'تا ۱۵۰ کاراکتر، کاملاً تصادفی', icon:'🔑' },
  { id:'textlock', cat:'qr', name:'رمزنگاری متن', desc:'قفل کردن متن با رمز عبور', icon:'🔒' },

  { id:'signature', cat:'misc', name:'امضای دیجیتال', desc:'امضا با انگشت، خروجی PNG شفاف', icon:'✍️' },
  { id:'listclean', cat:'misc', name:'پاک‌سازی و مرتب‌سازی لیست', desc:'حذف تکراری‌ها، مرتب‌سازی الفبایی', icon:'🧹' },
  { id:'ipinfo', cat:'misc', name:'نمایش اطلاعات IP', desc:'IP، کشور، شهر و ISP فعلی', icon:'🌐' },
];

function toolById(id){ return TOOLS.find(t=>t.id===id); }
function toolsByCat(cat){ return TOOLS.filter(t=>t.cat===cat); }
