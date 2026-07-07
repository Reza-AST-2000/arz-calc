/* ===================== helpers ===================== */
const faDigits = s => String(s).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const enDigits = s => String(s).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
function toNum(v){ const n = parseFloat(enDigits(String(v)).replace(/,/g,'')); return isNaN(n)?0:n; }
function fmt(n, digits=0){
  if (isNaN(n)) return '۰';
  const parts = n.toFixed(digits).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return faDigits(parts.join('.'));
}
function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstElementChild; }
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return [...root.querySelectorAll(sel)]; }

/* live-format a number input with thousand separators while typing */
function attachThousands(input){
  input.addEventListener('input', ()=>{
    const raw = enDigits(input.value).replace(/[^0-9.]/g,'');
    const pos = input.selectionStart;
    const before = input.value.length;
    input.value = raw === '' ? '' : fmt(parseFloat(raw)||0, raw.includes('.') && raw.endsWith('.') ? 0 : (raw.split('.')[1]?.length||0));
    if(raw.endsWith('.')) input.value += '.';
  });
}

/* ===================== favorites ===================== */
const FAV_KEY = 'toolbox_favs_v1';
function getFavs(){ try{ return JSON.parse(localStorage.getItem(FAV_KEY))||['bmi','qrgen','password','ipinfo']; }catch(e){ return ['bmi','qrgen','password','ipinfo']; } }
function setFavs(arr){ localStorage.setItem(FAV_KEY, JSON.stringify(arr)); }
function toggleFav(id){
  let f = getFavs();
  if (f.includes(id)) f = f.filter(x=>x!==id); else f.push(id);
  setFavs(f);
  return f.includes(id);
}

/* ===================== theme ===================== */
function applyTheme(){
  const light = localStorage.getItem('toolbox_theme') === 'light';
  document.body.classList.toggle('light', light);
}
$('#theme-toggle').addEventListener('click', ()=>{
  const light = document.body.classList.toggle('light');
  localStorage.setItem('toolbox_theme', light ? 'light' : 'dark');
});
applyTheme();

/* ===================== router ===================== */
const views = { home: $('#view-home'), list: $('#view-list'), tool: $('#view-tool') };
const headerHome = $('#home-header');
function showView(name){
  Object.values(views).forEach(v=>v.classList.remove('active'));
  views[name].classList.add('active');
  headerHome.style.display = name==='home' ? 'flex' : 'none';
  window.scrollTo(0,0);
}
$all('[data-back]').forEach(b=>b.addEventListener('click', ()=>{
  if (history.length>1) history.back(); else goHome();
}));

function goHome(){ location.hash = ''; }
function openCategory(catId){ location.hash = '#cat/'+catId; }
function openTool(toolId){ location.hash = '#tool/'+toolId; }

window.addEventListener('hashchange', route);
function route(){
  const h = location.hash.slice(1);
  if (!h){ renderHome(); showView('home'); return; }
  const [kind, id] = h.split('/');
  if (kind==='cat'){ renderList(id); showView('list'); }
  else if (kind==='tool'){ renderTool(id); showView('tool'); }
  else { renderHome(); showView('home'); }
}

/* ===================== home ===================== */
function renderHome(){
  const fav = $('#fav-grid'); fav.innerHTML='';
  getFavs().slice(0,8).forEach(id=>{
    const t = toolById(id); if(!t) return;
    fav.appendChild(el(`<div class="fav-item"><div class="ic">${t.icon}</div><span>${t.name}</span></div>`));
    fav.lastChild.addEventListener('click', ()=>openTool(t.id));
  });
  const cat = $('#cat-list'); cat.innerHTML='';
  CATEGORIES.forEach(c=>{
    cat.appendChild(el(`<div class="cat-row"><span class="chev">‹</span><span class="label">${c.title} ${c.icon}</span></div>`));
    cat.lastChild.addEventListener('click', ()=>openCategory(c.id));
  });
}

/* ===================== list ===================== */
function renderList(catId){
  const cat = CATEGORIES.find(c=>c.id===catId);
  $('#list-title').textContent = cat ? cat.title+' '+cat.icon : '';
  const wrap = $('#list-content'); wrap.innerHTML='';
  const favs = getFavs();
  toolsByCat(catId).forEach(t=>{
    const isFav = favs.includes(t.id);
    wrap.appendChild(el(`
      <div class="tool-row">
        <span class="chev">‹</span>
        <span class="star ${isFav?'active':''}">${isFav?'★':'☆'}</span>
        <div class="info"><h3>${t.name}</h3><p>${t.desc}</p></div>
        <div class="ic">${t.icon}</div>
      </div>`));
    const row = wrap.lastChild;
    $('.star', row).addEventListener('click', (e)=>{
      e.stopPropagation();
      const active = toggleFav(t.id);
      e.target.textContent = active?'★':'☆';
      e.target.classList.toggle('active', active);
    });
    row.addEventListener('click', ()=>openTool(t.id));
  });
}

/* ===================== tool detail ===================== */
function renderTool(id){
  const t = toolById(id);
  $('#tool-title').textContent = t ? t.name : '';
  const favBtn = $('#tool-fav');
  const syncFav = ()=>{ const active = getFavs().includes(id); favBtn.textContent = active?'★':'☆'; favBtn.style.color = active?'var(--gold)':'var(--text-faint)'; };
  syncFav();
  favBtn.onclick = ()=>{ toggleFav(id); syncFav(); };
  const root = $('#tool-content'); root.innerHTML='';
  const renderer = RENDERERS[id];
  if (renderer) renderer(root);
  else root.appendChild(el(`<p class="note">این ابزار به‌زودی اضافه می‌شود.</p>`));
}

/* ===================== TOOL RENDERERS ===================== */
const RENDERERS = {};

/* ---- BMI ---- */
RENDERERS.bmi = (root)=>{
  root.appendChild(el(`
    <div class="field"><label>قد (سانتی‌متر)</label><input type="text" inputmode="decimal" id="bmi-h" placeholder="مثلاً ۱۷۵"></div>
    <div class="field"><label>وزن (کیلوگرم)</label><input type="text" inputmode="decimal" id="bmi-w" placeholder="مثلاً ۷۰"></div>
    <button class="btn" id="bmi-calc">محاسبه</button>
    <div class="result-card" id="bmi-result" style="display:none"></div>
  `));
  $('#bmi-calc', root).addEventListener('click', ()=>{
    const h = toNum($('#bmi-h', root).value)/100, w = toNum($('#bmi-w', root).value);
    if (!h || !w) return;
    const bmi = w/(h*h);
    let status='', color='var(--gold)';
    if (bmi<18.5){status='کمبود وزن'; color='var(--teal)';}
    else if (bmi<25){status='وزن نرمال'; color='var(--good)';}
    else if (bmi<30){status='اضافه وزن'; color='var(--gold)';}
    else {status='چاقی'; color='var(--danger)';}
    const box = $('#bmi-result', root);
    box.style.display='flex';
    box.innerHTML = `<div class="result-big" style="color:${color}">${fmt(bmi,1)}</div>
      <div class="result-line"><span class="k">وضعیت</span><span class="v" style="color:${color}">${status}</span></div>
      <div class="result-line"><span class="k">وزن ایده‌آل (تقریبی)</span><span class="v">${fmt(18.5*h*h,1)} تا ${fmt(24.9*h*h,1)} کیلوگرم</span></div>`;
  });
};

/* ---- Age calculator (Jalali) ---- */
RENDERERS.age = (root)=>{
  root.appendChild(el(`
    <div class="field"><label>تاریخ تولد (میلادی)</label><input type="date" id="age-date"></div>
    <button class="btn" id="age-calc">محاسبه سن</button>
    <div class="result-card" id="age-result" style="display:none"></div>
  `));
  $('#age-calc', root).addEventListener('click', ()=>{
    const v = $('#age-date', root).value; if(!v) return;
    const bd = new Date(v+'T00:00:00'), now = new Date();
    let y=now.getFullYear()-bd.getFullYear(), m=now.getMonth()-bd.getMonth(), d=now.getDate()-bd.getDate();
    if (d<0){ m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (m<0){ y--; m+=12; }
    const diffMs = now-bd;
    const totalDays = Math.floor(diffMs/86400000);
    let nextBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
    if (nextBd < now) nextBd.setFullYear(now.getFullYear()+1);
    const daysLeft = Math.ceil((nextBd-now)/86400000);
    const [jy,jm,jd] = Jalali.toJalali(bd.getFullYear(), bd.getMonth()+1, bd.getDate());
    const box = $('#age-result', root); box.style.display='flex';
    box.innerHTML = `<div class="result-big">${fmt(y)} سال و ${fmt(m)} ماه و ${fmt(d)} روز</div>
      <div class="result-line"><span class="k">تاریخ تولد شمسی</span><span class="v">${Jalali.jalaliDateString(jy,jm,jd)}</span></div>
      <div class="result-line"><span class="k">مجموع روزهای زندگی</span><span class="v">${fmt(totalDays)} روز</span></div>
      <div class="result-line"><span class="k">روزهای مانده تا تولد بعدی</span><span class="v">${fmt(daysLeft)} روز</span></div>`;
  });
};

/* ---- Date converter ---- */
RENDERERS.dateconv = (root)=>{
  const today = Jalali.todayJalali();
  root.appendChild(el(`
    <div class="chips" id="dc-mode">
      <span class="chip active" data-m="g2j">میلادی ← شمسی</span>
      <span class="chip" data-m="j2g">شمسی ← میلادی</span>
    </div>
    <div id="dc-g" class="field"><label>تاریخ میلادی</label><input type="date" id="dc-gdate"></div>
    <div id="dc-j" class="row3" style="display:none">
      <div class="field"><label>سال</label><input type="text" id="dc-jy" value="${faDigits(today[0])}"></div>
      <div class="field"><label>ماه</label><input type="text" id="dc-jm" value="${faDigits(today[1])}"></div>
      <div class="field"><label>روز</label><input type="text" id="dc-jd" value="${faDigits(today[2])}"></div>
    </div>
    <button class="btn" id="dc-calc">تبدیل کن</button>
    <div class="result-card" id="dc-result" style="display:none"></div>
  `));
  let mode='g2j';
  $all('#dc-mode .chip', root).forEach(c=>c.addEventListener('click', ()=>{
    $all('#dc-mode .chip', root).forEach(x=>x.classList.remove('active'));
    c.classList.add('active'); mode=c.dataset.m;
    $('#dc-g', root).style.display = mode==='g2j' ? 'flex':'none';
    $('#dc-j', root).style.display = mode==='j2g' ? 'grid':'none';
  }));
  $('#dc-calc', root).addEventListener('click', ()=>{
    const box = $('#dc-result', root); box.style.display='flex';
    if (mode==='g2j'){
      const v = $('#dc-gdate', root).value; if(!v) return;
      const [Y,M,D] = v.split('-').map(Number);
      const [jy,jm,jd] = Jalali.toJalali(Y,M,D);
      const wd = Jalali.weekDaysFa[new Date(v+'T00:00:00').getDay()];
      box.innerHTML = `<div class="result-big">${Jalali.jalaliDateString(jy,jm,jd)}</div>
        <div class="result-line"><span class="k">روز هفته</span><span class="v">${wd}</span></div>
        <div class="result-line"><span class="k">ماه شمسی</span><span class="v">${Jalali.monthNamesFa[jm-1]}</span></div>`;
    } else {
      const jy=toNum($('#dc-jy',root).value), jm=toNum($('#dc-jm',root).value), jd=toNum($('#dc-jd',root).value);
      if(!jy||!jm||!jd) return;
      const [gy,gm,gd] = Jalali.toGregorian(jy,jm,jd);
      const gdate = new Date(gy,gm-1,gd);
      const wd = Jalali.weekDaysFa[gdate.getDay()];
      box.innerHTML = `<div class="result-big">${fmt(gy)}/${fmt(gm)}/${fmt(gd)}</div>
        <div class="result-line"><span class="k">روز هفته</span><span class="v">${wd}</span></div>`;
    }
  });
};

/* ---- Percentage ---- */
RENDERERS.percent = (root)=>{
  root.appendChild(el(`
    <div class="chips" id="pc-mode">
      <span class="chip active" data-m="p_of_x">چند درصد از یک عدد</span>
      <span class="chip" data-m="x_is_p">نسبت دو عدد (درصد)</span>
      <span class="chip" data-m="change">درصد تغییر بین دو عدد</span>
    </div>
    <div id="pc-fields"></div>
    <button class="btn" id="pc-calc">محاسبه</button>
    <div class="result-card" id="pc-result" style="display:none"></div>
  `));
  const fields = {
    p_of_x: `<div class="row2"><div class="field"><label>درصد</label><input type="text" id="pc-a" placeholder="مثلاً ۲۰"></div><div class="field"><label>از عدد</label><input type="text" id="pc-b" placeholder="مثلاً ۵۰۰۰۰۰"></div></div>`,
    x_is_p: `<div class="row2"><div class="field"><label>عدد اول</label><input type="text" id="pc-a" placeholder="مثلاً ۱۵۰"></div><div class="field"><label>عدد دوم</label><input type="text" id="pc-b" placeholder="مثلاً ۶۰۰"></div></div>`,
    change: `<div class="row2"><div class="field"><label>مقدار اولیه</label><input type="text" id="pc-a" placeholder="مثلاً ۱۰۰۰"></div><div class="field"><label>مقدار جدید</label><input type="text" id="pc-b" placeholder="مثلاً ۱۲۵۰"></div></div>`,
  };
  let mode='p_of_x';
  const fbox = $('#pc-fields', root); fbox.innerHTML = fields[mode];
  $all('#pc-mode .chip', root).forEach(c=>c.addEventListener('click', ()=>{
    $all('#pc-mode .chip', root).forEach(x=>x.classList.remove('active'));
    c.classList.add('active'); mode=c.dataset.m; fbox.innerHTML = fields[mode];
    $('#pc-result', root).style.display='none';
  }));
  $('#pc-calc', root).addEventListener('click', ()=>{
    const a=toNum($('#pc-a',root).value), b=toNum($('#pc-b',root).value);
    const box = $('#pc-result', root); box.style.display='flex';
    if (mode==='p_of_x'){
      box.innerHTML = `<div class="result-big">${fmt(a*b/100,2)}</div><div class="result-line"><span class="k">یعنی</span><span class="v">${fmt(a)}٪ از ${fmt(b)}</span></div>`;
    } else if (mode==='x_is_p'){
      box.innerHTML = `<div class="result-big">${fmt(b?100*a/b:0,2)}٪</div><div class="result-line"><span class="k">یعنی</span><span class="v">${fmt(a)} از ${fmt(b)}</span></div>`;
    } else {
      const diff = b-a; const pct = a? 100*diff/a : 0;
      box.innerHTML = `<div class="result-big" style="color:${pct>=0?'var(--good)':'var(--danger)'}">${pct>=0?'+':''}${fmt(pct,2)}٪</div>
        <div class="result-line"><span class="k">تغییر مقدار</span><span class="v">${fmt(diff)}</span></div>`;
    }
  });
};

/* ---- Discount & tax ---- */
RENDERERS.discount = (root)=>{
  root.appendChild(el(`
    <div class="field"><label>قیمت اصلی</label><input type="text" id="ds-price" placeholder="مثلاً ۲,۰۰۰,۰۰۰"></div>
    <div class="row2">
      <div class="field"><label>درصد تخفیف</label><input type="text" id="ds-off" placeholder="مثلاً ۱۵"></div>
      <div class="field"><label>درصد مالیات/عوارض</label><input type="text" id="ds-tax" placeholder="مثلاً ۹"></div>
    </div>
    <button class="btn" id="ds-calc">محاسبه</button>
    <div class="result-card" id="ds-result" style="display:none"></div>
  `));
  $('#ds-calc', root).addEventListener('click', ()=>{
    const p=toNum($('#ds-price',root).value), off=toNum($('#ds-off',root).value), tax=toNum($('#ds-tax',root).value);
    const afterOff = p*(1-off/100);
    const taxAmt = afterOff*tax/100;
    const final = afterOff+taxAmt;
    const box=$('#ds-result',root); box.style.display='flex';
    box.innerHTML = `<div class="result-big">${fmt(final)}</div>
      <div class="result-line"><span class="k">مبلغ تخفیف</span><span class="v">${fmt(p-afterOff)}</span></div>
      <div class="result-line"><span class="k">قیمت پس از تخفیف</span><span class="v">${fmt(afterOff)}</span></div>
      <div class="result-line"><span class="k">مبلغ مالیات/عوارض</span><span class="v">${fmt(taxAmt)}</span></div>
      <div class="result-line"><span class="k">قیمت نهایی</span><span class="v">${fmt(final)}</span></div>`;
  });
};

/* ---- Loan / installments ---- */
RENDERERS.loan = (root)=>{
  root.appendChild(el(`
    <div class="field"><label>مبلغ وام</label><input type="text" id="ln-amt" placeholder="مثلاً ۱۰۰,۰۰۰,۰۰۰"></div>
    <div class="row2">
      <div class="field"><label>نرخ سود سالانه (٪)</label><input type="text" id="ln-rate" placeholder="مثلاً ۲۳"></div>
      <div class="field"><label>تعداد اقساط (ماه)</label><input type="text" id="ln-n" placeholder="مثلاً ۳۶"></div>
    </div>
    <button class="btn" id="ln-calc">محاسبه اقساط</button>
    <div class="result-card" id="ln-result" style="display:none"></div>
  `));
  $('#ln-calc', root).addEventListener('click', ()=>{
    const P=toNum($('#ln-amt',root).value), rateY=toNum($('#ln-rate',root).value), n=toNum($('#ln-n',root).value);
    if(!P||!n) return;
    const r = rateY/100/12;
    const installment = r===0 ? P/n : P * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1);
    const total = installment*n;
    const box=$('#ln-result',root); box.style.display='flex';
    box.innerHTML = `<div class="result-big">${fmt(installment)}<span style="font-size:.9rem;color:var(--text-dim)"> / ماه</span></div>
      <div class="result-line"><span class="k">کل مبلغ بازپرداختی</span><span class="v">${fmt(total)}</span></div>
      <div class="result-line"><span class="k">کل سود پرداختی</span><span class="v">${fmt(total-P)}</span></div>`;
  });
};

/* ---- Bank deposit ---- */
RENDERERS.deposit = (root)=>{
  root.appendChild(el(`
    <div class="field"><label>مبلغ سپرده</label><input type="text" id="dp-amt" placeholder="مثلاً ۵۰,۰۰۰,۰۰۰"></div>
    <div class="row2">
      <div class="field"><label>نرخ سود سالانه (٪)</label><input type="text" id="dp-rate" placeholder="مثلاً ۲۳"></div>
      <div class="field"><label>مدت (ماه)</label><input type="text" id="dp-n" placeholder="مثلاً ۱۲"></div>
    </div>
    <div class="chips" id="dp-mode"><span class="chip active" data-m="simple">سود ساده (ماهانه ثابت)</span><span class="chip" data-m="compound">سود مرکب</span></div>
    <button class="btn" id="dp-calc">محاسبه</button>
    <div class="result-card" id="dp-result" style="display:none"></div>
  `));
  let mode='simple';
  $all('#dp-mode .chip', root).forEach(c=>c.addEventListener('click', ()=>{
    $all('#dp-mode .chip', root).forEach(x=>x.classList.remove('active')); c.classList.add('active'); mode=c.dataset.m;
  }));
  $('#dp-calc', root).addEventListener('click', ()=>{
    const P=toNum($('#dp-amt',root).value), rateY=toNum($('#dp-rate',root).value), n=toNum($('#dp-n',root).value);
    if(!P||!n) return;
    const monthlyRate = rateY/100/12;
    let monthlyProfit, total;
    if (mode==='simple'){
      monthlyProfit = P*monthlyRate;
      total = P + monthlyProfit*n;
    } else {
      total = P*Math.pow(1+monthlyRate, n);
      monthlyProfit = (total-P)/n;
    }
    const box=$('#dp-result',root); box.style.display='flex';
    box.innerHTML = `<div class="result-big">${fmt(monthlyProfit)}<span style="font-size:.9rem;color:var(--text-dim)"> / ماه</span></div>
      <div class="result-line"><span class="k">کل سود دوره</span><span class="v">${fmt(total-P)}</span></div>
      <div class="result-line"><span class="k">مبلغ نهایی (اصل + سود)</span><span class="v">${fmt(total)}</span></div>`;
  });
};

/* ---- Bill splitter ---- */
RENDERERS.bill = (root)=>{
  root.appendChild(el(`
    <div class="field"><label>مبلغ کل صورت‌حساب</label><input type="text" id="bl-total" placeholder="مثلاً ۱,۸۰۰,۰۰۰"></div>
    <div class="row2">
      <div class="field"><label>درصد انعام (اختیاری)</label><input type="text" id="bl-tip" placeholder="مثلاً ۱۰"></div>
      <div class="field"><label>تعداد نفرات</label><input type="text" id="bl-people" placeholder="مثلاً ۴"></div>
    </div>
    <button class="btn" id="bl-calc">تقسیم کن</button>
    <div class="result-card" id="bl-result" style="display:none"></div>
  `));
  $('#bl-calc', root).addEventListener('click', ()=>{
    const total=toNum($('#bl-total',root).value), tip=toNum($('#bl-tip',root).value), people=toNum($('#bl-people',root).value);
    if(!total||!people) return;
    const tipAmt = total*tip/100;
    const grand = total+tipAmt;
    const box=$('#bl-result',root); box.style.display='flex';
    box.innerHTML = `<div class="result-big">${fmt(grand/people)}<span style="font-size:.9rem;color:var(--text-dim)"> / هر نفر</span></div>
      <div class="result-line"><span class="k">مبلغ انعام</span><span class="v">${fmt(tipAmt)}</span></div>
      <div class="result-line"><span class="k">مبلغ کل با انعام</span><span class="v">${fmt(grand)}</span></div>`;
  });
};

/* ---- Trade profit/loss ---- */
RENDERERS.trade = (root)=>{
  root.appendChild(el(`
    <div class="row2">
      <div class="field"><label>قیمت خرید (واحد)</label><input type="text" id="tr-buy" placeholder="مثلاً ۵۸,۰۰۰,۰۰۰"></div>
      <div class="field"><label>قیمت فروش (واحد)</label><input type="text" id="tr-sell" placeholder="مثلاً ۶۲,۵۰۰,۰۰۰"></div>
    </div>
    <div class="row2">
      <div class="field"><label>مقدار / تعداد</label><input type="text" id="tr-qty" placeholder="مثلاً ۱" value="۱"></div>
      <div class="field"><label>کارمزد کل (اختیاری)</label><input type="text" id="tr-fee" placeholder="مثلاً ۰"></div>
    </div>
    <button class="btn" id="tr-calc">محاسبه سود/زیان</button>
    <div class="result-card" id="tr-result" style="display:none"></div>
  `));
  $('#tr-calc', root).addEventListener('click', ()=>{
    const buy=toNum($('#tr-buy',root).value), sell=toNum($('#tr-sell',root).value), qty=toNum($('#tr-qty',root).value)||1, fee=toNum($('#tr-fee',root).value);
    const cost = buy*qty+fee, revenue = sell*qty;
    const profit = revenue-cost;
    const pct = cost? 100*profit/cost : 0;
    const box=$('#tr-result',root); box.style.display='flex';
    box.innerHTML = `<div class="result-big" style="color:${profit>=0?'var(--good)':'var(--danger)'}">${profit>=0?'+':''}${fmt(profit)}</div>
      <div class="result-line"><span class="k">درصد سود/زیان</span><span class="v" style="color:${profit>=0?'var(--good)':'var(--danger)'}">${profit>=0?'+':''}${fmt(pct,2)}٪</span></div>
      <div class="result-line"><span class="k">هزینه کل خرید</span><span class="v">${fmt(cost)}</span></div>
      <div class="result-line"><span class="k">درآمد کل فروش</span><span class="v">${fmt(revenue)}</span></div>`;
  });
};

/* ---- Date/time difference ---- */
RENDERERS.datediff = (root)=>{
  root.appendChild(el(`
    <div class="row2">
      <div class="field"><label>تاریخ اول</label><input type="date" id="dd-a"></div>
      <div class="field"><label>ساعت (اختیاری)</label><input type="time" id="dd-at" value="00:00"></div>
    </div>
    <div class="row2">
      <div class="field"><label>تاریخ دوم</label><input type="date" id="dd-b"></div>
      <div class="field"><label>ساعت (اختیاری)</label><input type="time" id="dd-bt" value="00:00"></div>
    </div>
    <button class="btn" id="dd-calc">محاسبه فاصله</button>
    <div class="result-card" id="dd-result" style="display:none"></div>
  `));
  $('#dd-calc', root).addEventListener('click', ()=>{
    const a=$('#dd-a',root).value, b=$('#dd-b',root).value; if(!a||!b) return;
    const dA = new Date(a+'T'+($('#dd-at',root).value||'00:00'));
    const dB = new Date(b+'T'+($('#dd-bt',root).value||'00:00'));
    let diff = Math.abs(dB-dA);
    const days = Math.floor(diff/86400000); diff-=days*86400000;
    const hours = Math.floor(diff/3600000); diff-=hours*3600000;
    const mins = Math.floor(diff/60000);
    const box=$('#dd-result',root); box.style.display='flex';
    box.innerHTML = `<div class="result-big">${fmt(days)} روز</div>
      <div class="result-line"><span class="k">دقیق</span><span class="v">${fmt(days)} روز، ${fmt(hours)} ساعت و ${fmt(mins)} دقیقه</span></div>
      <div class="result-line"><span class="k">مجموع ساعت</span><span class="v">${fmt(Math.floor(Math.abs(dB-dA)/3600000))} ساعت</span></div>
      <div class="result-line"><span class="k">مجموع هفته</span><span class="v">${fmt(Math.floor(days/7))} هفته</span></div>`;
  });
};

/* ---- Inflation ---- */
RENDERERS.inflation = (root)=>{
  root.appendChild(el(`
    <div class="field"><label>مبلغ در گذشته</label><input type="text" id="in-amt" placeholder="مثلاً ۱,۰۰۰,۰۰۰"></div>
    <div class="row2">
      <div class="field"><label>نرخ تورم سالانه (٪)</label><input type="text" id="in-rate" placeholder="مثلاً ۴۰"></div>
      <div class="field"><label>تعداد سال</label><input type="text" id="in-years" placeholder="مثلاً ۵"></div>
    </div>
    <button class="btn" id="in-calc">محاسبه</button>
    <div class="result-card" id="in-result" style="display:none"></div>
    <p class="note">این ابزار بر اساس نرخ تورمی که خودتان وارد می‌کنید محاسبه انجام می‌دهد و به اینترنت وصل نمی‌شود؛ نرخ واقعی تورم را باید از منابع رسمی (مثل مرکز آمار) بررسی کنید.</p>
  `));
  $('#in-calc', root).addEventListener('click', ()=>{
    const amt=toNum($('#in-amt',root).value), rate=toNum($('#in-rate',root).value), years=toNum($('#in-years',root).value);
    if(!amt||!years) return;
    const future = amt*Math.pow(1+rate/100, years);
    const purchasing = amt/Math.pow(1+rate/100, years);
    const box=$('#in-result',root); box.style.display='flex';
    box.innerHTML = `<div class="result-big">${fmt(future)}</div>
      <div class="result-line"><span class="k">معادل امروزی این مبلغ (آینده)</span><span class="v">${fmt(future)}</span></div>
      <div class="result-line"><span class="k">قدرت خرید امروزیِ همین مبلغ در گذشته</span><span class="v">${fmt(purchasing)}</span></div>`;
  });
};

/* ---- Price per square meter ---- */
RENDERERS.sqmeter = (root)=>{
  root.appendChild(el(`
    <div class="row2">
      <div class="field"><label>متراژ (متر مربع)</label><input type="text" id="sq-area" placeholder="مثلاً ۱۲۰"></div>
      <div class="field"><label>قیمت هر متر</label><input type="text" id="sq-price" placeholder="مثلاً ۴۵,۰۰۰,۰۰۰"></div>
    </div>
    <button class="btn" id="sq-calc">محاسبه قیمت کل</button>
    <div class="result-card" id="sq-result" style="display:none"></div>
    <div class="field"><label>یا: قیمت کل و متراژ را وارد کن تا قیمت هر متر را بدهد</label></div>
    <div class="row2">
      <div class="field"><input type="text" id="sq-total" placeholder="قیمت کل"></div>
      <div class="field"><input type="text" id="sq-area2" placeholder="متراژ"></div>
    </div>
    <button class="btn secondary" id="sq-calc2">محاسبه قیمت هر متر</button>
    <div class="result-card" id="sq-result2" style="display:none"></div>
  `));
  $('#sq-calc', root).addEventListener('click', ()=>{
    const a=toNum($('#sq-area',root).value), p=toNum($('#sq-price',root).value);
    const box=$('#sq-result',root); box.style.display='flex';
    box.innerHTML = `<div class="result-big">${fmt(a*p)}</div><div class="result-line"><span class="k">قیمت کل</span><span class="v">${fmt(a*p)} تومان</span></div>`;
  });
  $('#sq-calc2', root).addEventListener('click', ()=>{
    const t=toNum($('#sq-total',root).value), a=toNum($('#sq-area2',root).value);
    const box=$('#sq-result2',root); box.style.display='flex';
    box.innerHTML = `<div class="result-big">${fmt(a?t/a:0)}</div><div class="result-line"><span class="k">قیمت هر متر</span><span class="v">${fmt(a?t/a:0)} تومان</span></div>`;
  });
};

/* ---- QR generator ---- */
RENDERERS.qrgen = (root)=>{
  root.appendChild(el(`
    <div class="chips" id="qg-mode">
      <span class="chip active" data-m="text">متن / لینک</span>
      <span class="chip" data-m="wifi">وای‌فای</span>
    </div>
    <div id="qg-fields"></div>
    <button class="btn" id="qg-calc">ساخت QR</button>
    <div id="qr-box" style="display:none"></div>
    <button class="btn secondary" id="qg-dl" style="display:none">دانلود عکس QR</button>
  `));
  const fields = {
    text: `<div class="field"><label>متن یا لینک</label><textarea id="qg-text" placeholder="https://example.com"></textarea></div>`,
    wifi: `<div class="row2"><div class="field"><label>نام وای‌فای (SSID)</label><input type="text" id="qg-ssid"></div><div class="field"><label>رمز عبور</label><input type="text" id="qg-pass"></div></div>`,
  };
  let mode='text';
  const fbox = $('#qg-fields', root); fbox.innerHTML = fields[mode];
  $all('#qg-mode .chip', root).forEach(c=>c.addEventListener('click', ()=>{
    $all('#qg-mode .chip', root).forEach(x=>x.classList.remove('active')); c.classList.add('active'); mode=c.dataset.m; fbox.innerHTML = fields[mode];
  }));
  $('#qg-calc', root).addEventListener('click', ()=>{
    let content = '';
    if (mode==='text') content = $('#qg-text', root).value.trim();
    else content = `WIFI:T:WPA;S:${$('#qg-ssid',root).value};P:${$('#qg-pass',root).value};;`;
    if (!content) return;
    const box = $('#qr-box', root); box.style.display='flex'; box.innerHTML='';
    if (window.QRCode){
      new QRCode(box, { text: content, width:220, height:220, colorDark:'#12201a', colorLight:'#ffffff' });
      $('#qg-dl', root).style.display='block';
      $('#qg-dl', root).onclick = ()=>{
        const img = box.querySelector('img') || box.querySelector('canvas');
        const url = img.tagName==='CANVAS' ? img.toDataURL('image/png') : img.src;
        const a = document.createElement('a'); a.href=url; a.download='qrcode.png'; a.click();
      };
    } else {
      box.innerHTML = '<p class="note">برای ساخت QR به اتصال اینترنت نیاز است.</p>';
    }
  });
};

/* ---- QR scan (from uploaded image) ---- */
RENDERERS.qrscan = (root)=>{
  root.appendChild(el(`
    <div class="field"><label>عکس حاوی QR کد را انتخاب کن</label><input type="file" accept="image/*" id="qs-file"></div>
    <div class="result-card" id="qs-result" style="display:none"></div>
    <p class="note">پردازش کاملاً روی گوشی شما انجام می‌شود و عکس به هیچ سروری ارسال نمی‌شود.</p>
  `));
  $('#qs-file', root).addEventListener('change', (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const img = new Image();
    img.onload = ()=>{
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img,0,0);
      const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
      const box = $('#qs-result', root); box.style.display='flex';
      if (window.jsQR){
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code){
          box.innerHTML = `<div class="result-line"><span class="k">محتوا</span></div><div class="note" style="word-break:break-all;color:var(--text)">${code.data}</div>`;
        } else {
          box.innerHTML = `<div class="note">هیچ QR کدی در عکس پیدا نشد.</div>`;
        }
      } else {
        box.innerHTML = `<div class="note">کتابخانه اسکن بارگذاری نشد. اتصال اینترنت را بررسی کنید.</div>`;
      }
    };
    img.src = URL.createObjectURL(file);
  });
};

/* ---- Password generator ---- */
RENDERERS.password = (root)=>{
  root.appendChild(el(`
    <div class="field"><label>طول رمز عبور: <span id="pw-len-val">۱۶</span></label>
      <input type="range" id="pw-len" min="6" max="64" value="16" style="width:100%">
    </div>
    <div class="chips">
      <span class="chip active" data-k="lower">حروف کوچک</span>
      <span class="chip active" data-k="upper">حروف بزرگ</span>
      <span class="chip active" data-k="digit">اعداد</span>
      <span class="chip active" data-k="symbol">نمادها</span>
    </div>
    <button class="btn" id="pw-gen">ساخت رمز جدید</button>
    <div class="pass-display" id="pw-out">—</div>
    <div class="strength-bar"><div class="strength-fill" id="pw-strength" style="width:0%;background:var(--danger)"></div></div>
    <button class="btn secondary" id="pw-copy">کپی رمز</button>
  `));
  const sets = { lower:'abcdefghijklmnopqrstuvwxyz', upper:'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digit:'0123456789', symbol:'!@#$%^&*()_-+=?<>[]{}' };
  const lenInput = $('#pw-len', root), lenVal = $('#pw-len-val', root);
  lenInput.addEventListener('input', ()=> lenVal.textContent = faDigits(lenInput.value));
  $all('.chip', root).forEach(c=>c.addEventListener('click', ()=>c.classList.toggle('active')));
  function genPassword(){
    const active = $all('.chip.active', root).map(c=>c.dataset.k);
    if (!active.length) return '';
    const pool = active.map(k=>sets[k]).join('');
    const len = parseInt(lenInput.value,10);
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    let out = Array.from(arr, n=>pool[n % pool.length]).join('');
    return out;
  }
  $('#pw-gen', root).addEventListener('click', ()=>{
    const pass = genPassword();
    $('#pw-out', root).textContent = pass || 'حداقل یک گزینه را انتخاب کنید';
    const len = pass.length, kinds = $all('.chip.active', root).length;
    const score = Math.min(100, len*2 + kinds*10);
    const bar = $('#pw-strength', root);
    bar.style.width = score+'%';
    bar.style.background = score<40?'var(--danger)':score<70?'var(--gold)':'var(--good)';
  });
  $('#pw-copy', root).addEventListener('click', ()=>{
    const txt = $('#pw-out', root).textContent;
    if (txt && txt!=='—') navigator.clipboard.writeText(txt);
  });
  $('#pw-gen', root).click();
};

/* ---- Text lock (simple reversible cipher with passphrase) ---- */
RENDERERS.textlock = (root)=>{
  root.appendChild(el(`
    <div class="chips" id="tl-mode"><span class="chip active" data-m="lock">قفل کردن</span><span class="chip" data-m="unlock">باز کردن</span></div>
    <div class="field"><label>متن</label><textarea id="tl-text"></textarea></div>
    <div class="field"><label>رمز عبور</label><input type="text" id="tl-pass"></div>
    <button class="btn" id="tl-go">اجرا</button>
    <div class="field"><label>نتیجه</label><textarea id="tl-out" readonly></textarea></div>
    <button class="btn secondary" id="tl-copy">کپی نتیجه</button>
    <p class="note">این روش رمزنگاری ساده (XOR مبتنی بر رمز عبور + Base64) برای محافظت سبک از متن است، نه استانداردهای رمزنگاری نظامی.</p>
  `));
  let mode='lock';
  $all('#tl-mode .chip', root).forEach(c=>c.addEventListener('click', ()=>{
    $all('#tl-mode .chip', root).forEach(x=>x.classList.remove('active')); c.classList.add('active'); mode=c.dataset.m;
  }));
  function xorCipher(str, pass){
    let out='';
    for (let i=0;i<str.length;i++) out += String.fromCharCode(str.charCodeAt(i) ^ pass.charCodeAt(i % pass.length));
    return out;
  }
  $('#tl-go', root).addEventListener('click', ()=>{
    const text = $('#tl-text', root).value, pass = $('#tl-pass', root).value;
    if (!text || !pass) return;
    let result;
    try{
      if (mode==='lock'){
        result = btoa(unescape(encodeURIComponent(xorCipher(text, pass))));
      } else {
        result = decodeURIComponent(escape(xorCipher(atob(text), pass)));
      }
    } catch(e){ result = 'خطا: متن یا رمز عبور نامعتبر است.'; }
    $('#tl-out', root).value = result;
  });
  $('#tl-copy', root).addEventListener('click', ()=>{
    const v = $('#tl-out', root).value; if (v) navigator.clipboard.writeText(v);
  });
};

/* ---- Digital signature (canvas) ---- */
RENDERERS.signature = (root)=>{
  root.appendChild(el(`
    <div class="field"><label>با انگشت یا ماوس امضا کنید</label></div>
    <canvas id="sig-canvas" width="480" height="220" style="width:100%;background:#fff;border-radius:14px;touch-action:none"></canvas>
    <div class="row2">
      <button class="btn secondary" id="sig-clear">پاک کردن</button>
      <button class="btn" id="sig-dl">دانلود PNG شفاف</button>
    </div>
  `));
  const canvas = $('#sig-canvas', root);
  const ctx = canvas.getContext('2d');
  ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.strokeStyle='#12201a';
  let drawing=false, last=null;
  function pos(e){
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x:(t.clientX-r.left)*(canvas.width/r.width), y:(t.clientY-r.top)*(canvas.height/r.height) };
  }
  function start(e){ drawing=true; last=pos(e); e.preventDefault(); }
  function move(e){ if(!drawing) return; const p=pos(e); ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke(); last=p; e.preventDefault(); }
  function end(){ drawing=false; }
  ['mousedown','touchstart'].forEach(ev=>canvas.addEventListener(ev,start));
  ['mousemove','touchmove'].forEach(ev=>canvas.addEventListener(ev,move));
  ['mouseup','mouseleave','touchend'].forEach(ev=>canvas.addEventListener(ev,end));
  $('#sig-clear', root).addEventListener('click', ()=> ctx.clearRect(0,0,canvas.width,canvas.height));
  $('#sig-dl', root).addEventListener('click', ()=>{
    // create a transparent version: white pixels -> transparent
    const out = document.createElement('canvas'); out.width=canvas.width; out.height=canvas.height;
    const octx = out.getContext('2d');
    octx.drawImage(canvas,0,0);
    const data = octx.getImageData(0,0,out.width,out.height);
    for (let i=0;i<data.data.length;i+=4){
      if (data.data[i]>240 && data.data[i+1]>240 && data.data[i+2]>240) data.data[i+3]=0;
    }
    octx.putImageData(data,0,0);
    const a = document.createElement('a'); a.href = out.toDataURL('image/png'); a.download='signature.png'; a.click();
  });
};

/* ---- List cleaner ---- */
RENDERERS.listclean = (root)=>{
  root.appendChild(el(`
    <div class="field"><label>لیست خود را وارد کنید (هر خط یک مورد)</label><textarea id="lc-in" style="min-height:160px"></textarea></div>
    <div class="chips">
      <span class="chip active" data-k="dedupe">حذف موارد تکراری</span>
      <span class="chip active" data-k="sort">مرتب‌سازی الفبایی</span>
      <span class="chip" data-k="trim">حذف فاصله‌های اضافی</span>
      <span class="chip" data-k="removeEmpty">حذف خطوط خالی</span>
    </div>
    <button class="btn" id="lc-run">اجرا</button>
    <div class="field"><label>نتیجه</label><textarea id="lc-out" style="min-height:160px" readonly></textarea></div>
    <button class="btn secondary" id="lc-copy">کپی نتیجه</button>
  `));
  $all('.chip', root).forEach(c=>c.addEventListener('click', ()=>c.classList.toggle('active')));
  $('#lc-run', root).addEventListener('click', ()=>{
    const opts = $all('.chip.active', root).map(c=>c.dataset.k);
    let lines = $('#lc-in', root).value.split('\n');
    if (opts.includes('trim')) lines = lines.map(l=>l.trim());
    if (opts.includes('removeEmpty')) lines = lines.filter(l=>l.trim()!=='');
    if (opts.includes('dedupe')) lines = [...new Set(lines)];
    if (opts.includes('sort')) lines = lines.sort((a,b)=>a.localeCompare(b,'fa'));
    $('#lc-out', root).value = lines.join('\n');
  });
  $('#lc-copy', root).addEventListener('click', ()=>{
    const v = $('#lc-out', root).value; if (v) navigator.clipboard.writeText(v);
  });
};

/* ---- IP info ---- */
RENDERERS.ipinfo = (root)=>{
  root.appendChild(el(`
    <div class="result-card" id="ip-result">در حال دریافت اطلاعات...</div>
    <button class="btn secondary" id="ip-refresh">بروزرسانی</button>
    <p class="note">این اطلاعات از سرویس عمومی ipapi.co دریافت می‌شود و فقط با اتصال اینترنت کار می‌کند.</p>
  `));
  async function load(){
    const box = $('#ip-result', root); box.textContent='در حال دریافت اطلاعات...';
    try{
      const res = await fetch('https://ipapi.co/json/');
      const d = await res.json();
      box.innerHTML = `
        <div class="result-line"><span class="k">آدرس IP</span><span class="v">${d.ip||'—'}</span></div>
        <div class="result-line"><span class="k">کشور</span><span class="v">${d.country_name||'—'}</span></div>
        <div class="result-line"><span class="k">شهر</span><span class="v">${d.city||'—'}</span></div>
        <div class="result-line"><span class="k">منطقه</span><span class="v">${d.region||'—'}</span></div>
        <div class="result-line"><span class="k">ISP</span><span class="v">${d.org||'—'}</span></div>
        <div class="result-line"><span class="k">منطقه زمانی</span><span class="v">${d.timezone||'—'}</span></div>`;
    } catch(e){
      box.innerHTML = `<div class="note">دریافت اطلاعات ناموفق بود. اتصال اینترنت را بررسی کنید.</div>`;
    }
  }
  $('#ip-refresh', root).addEventListener('click', load);
  load();
};

/* ===================== init ===================== */
route();
