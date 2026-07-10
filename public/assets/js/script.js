(function(){
  'use strict';

  // Module-by-module wheel snap (skip on pages that opt out)
  const sections = Array.from(document.querySelectorAll('body > section, body > .stack-viewport, body > footer'));
  if(sections.length && !document.body.classList.contains('no-snap')){
    const navH = document.querySelector('.nav')?.offsetHeight || 73;
    let locked = false;
    let lastWheel = 0;

    function currentIndex(){
      const y = window.scrollY + navH + 10;
      let idx = 0;
      for(let i=0; i<sections.length; i++){
        if(sections[i].offsetTop <= y) idx = i;
      }
      return idx;
    }

    function goTo(idx){
      idx = Math.max(0, Math.min(sections.length-1, idx));
      locked = true;
      sections[idx].scrollIntoView({behavior:'smooth', block:'start'});
      setTimeout(()=>{ locked = false; }, 700);
    }

    window.addEventListener('wheel', (e)=>{
      if(locked){ e.preventDefault(); return; }
      const now = Date.now();
      if(now - lastWheel < 200) { e.preventDefault(); return; }
      if(Math.abs(e.deltaY) < 8) return;
      lastWheel = now;
      e.preventDefault();
      const cur = currentIndex();
      goTo(cur + (e.deltaY > 0 ? 1 : -1));
    }, {passive:false});

    window.addEventListener('keydown', (e)=>{
      if(locked) return;
      if(['ArrowDown','PageDown',' '].includes(e.key)){ e.preventDefault(); goTo(currentIndex()+1); }
      else if(['ArrowUp','PageUp'].includes(e.key)){ e.preventDefault(); goTo(currentIndex()-1); }
      else if(e.key === 'Home'){ e.preventDefault(); goTo(0); }
      else if(e.key === 'End'){ e.preventDefault(); goTo(sections.length-1); }
    });
  }

  // Reveal on scroll
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  // Mobile nav toggle
  const toggle=document.querySelector('.nav-toggle');
  const links=document.querySelector('.nav-links');
  if(toggle&&links){
    toggle.addEventListener('click',()=>{
      links.classList.toggle('open');
      const open=links.classList.contains('open');
      if(open){
        links.style.cssText='display:flex;position:absolute;top:100%;left:0;right:0;background:#fff;flex-direction:column;padding:16px 24px;border-bottom:1px solid var(--line);gap:4px';
      } else {
        links.style.cssText='';
      }
    });
  }

  // Compare bar (bottom floating popup)
  const CMP_KEY='edunav_compare';
  let cmpList=[];
  try{cmpList=JSON.parse(localStorage.getItem(CMP_KEY)||'[]')}catch(e){}

  // Inject compare bar into body
  const bar=document.createElement('div');
  bar.className='compare-bar';
  bar.innerHTML=`
    <div class="compare-avatars"></div>
    <span class="compare-count"><b>0</b> məktəb müqayisədə</span>
    <button class="compare-clear" aria-label="Hamısını sil">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
    <a href="muqayise.html" class="compare-btn-go">
      Müqayisə et
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    </a>`;
  document.body.appendChild(bar);

  const avatarsEl=bar.querySelector('.compare-avatars');
  const countEl=bar.querySelector('.compare-count');

  function renderBar(){
    if(cmpList.length===0){
      bar.classList.remove('visible');
      return;
    }
    bar.classList.add('visible');
    avatarsEl.innerHTML=cmpList.map((s,i)=>`<span class="compare-avatar c${i%6}">${s.initial}</span>`).join('');
    countEl.innerHTML=`<b>${cmpList.length}</b> məktəb müqayisədə`;
    // Update button state on cards
    document.querySelectorAll('.school-card').forEach(card=>{
      const name=card.querySelector('.name')?.textContent?.trim();
      const btn=card.querySelector('.fav');
      if(!btn) return;
      btn.classList.toggle('in-compare', cmpList.some(s=>s.id===name));
    });
  }

  function toggleCompare(school){
    const idx=cmpList.findIndex(s=>s.id===school.id);
    if(idx>=0){
      cmpList.splice(idx,1);
    } else {
      if(cmpList.length>=4){
        cmpList.shift();
      }
      cmpList.push(school);
    }
    localStorage.setItem(CMP_KEY,JSON.stringify(cmpList));
    renderBar();
  }

  bar.querySelector('.compare-clear').addEventListener('click',()=>{
    cmpList=[];
    localStorage.setItem(CMP_KEY,'[]');
    renderBar();
  });

  // Hook into .fav buttons — now acts as compare toggle
  document.addEventListener('click',(e)=>{
    const fav=e.target.closest('.school-card .fav');
    if(!fav) return;
    e.preventDefault();
    e.stopPropagation();
    const card=fav.closest('.school-card');
    const name=card.querySelector('.name')?.textContent?.trim()||'Məktəb';
    const initial=name.charAt(0).toUpperCase();
    toggleCompare({id:name, initial, name});
  });

  // Change heart icon to compare icon on all school cards
  document.querySelectorAll('.school-card .fav').forEach(btn=>{
    btn.setAttribute('aria-label','Müqayisəyə əlavə et');
    btn.setAttribute('title','Müqayisəyə əlavə et');
    btn.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="8" height="14" rx="1.5"/><rect x="13" y="5" width="8" height="14" rx="1.5"/></svg>`;
  });

  renderBar();

  // ============================================
  // PARENT SURVEY POPUP
  // ============================================
  const SRV_KEY = 'edunav_survey';
  const SRV_SHOWN = 'edunav_survey_shown';

  const surveySteps = [
    {
      id:'age', q:'Övladınızın yaş qrupu?',
      desc:'Hansı sinif səviyyəsində məktəb axtarırsınız?',
      cols:3,
      options:[
        {v:'ibtidai', label:'İbtidai', sub:'1–4 sinif'},
        {v:'orta', label:'Orta', sub:'5–9 sinif'},
        {v:'yuxari', label:'Yuxarı', sub:'10–11 sinif'}
      ]
    },
    {
      id:'district', q:'Hansı rayonda axtarırsınız?',
      desc:'Ən yaxın rayonu seçin.',
      cols:2,
      options:[
        {v:'yasamal', label:'Yasamal'},
        {v:'nasimi', label:'Nəsimi'},
        {v:'xatai', label:'Xətai'},
        {v:'nizami', label:'Nizami'},
        {v:'narimanov', label:'Nərimanov'},
        {v:'sabail', label:'Səbail'},
        {v:'other', label:'Digər rayon'},
        {v:'any', label:'Fərqi yoxdur'}
      ]
    },
    {
      id:'budget', q:'İllik təhsil büdcəniz?',
      desc:'Təxmini illik məktəb haqqı.',
      cols:2,
      options:[
        {v:'low', label:'5,000 AZN-ə qədər', sub:'ekonom'},
        {v:'mid', label:'5,000–8,000 AZN', sub:'orta'},
        {v:'high', label:'8,000–12,000 AZN', sub:'premium'},
        {v:'top', label:'12,000+ AZN', sub:'elite'}
      ]
    },
    {
      id:'curriculum', q:'Hansı kurrikulumu üstün tutursunuz?',
      desc:'Tədris proqramı seçimi.',
      cols:2,
      options:[
        {v:'milli', label:'Milli'},
        {v:'ib', label:'IB'},
        {v:'cambridge', label:'Cambridge'},
        {v:'turk', label:'Türk'},
        {v:'rus', label:'Rus'},
        {v:'any', label:'Fərqi yoxdur'}
      ]
    },
    {
      id:'contact', q:'Tövsiyələri haraya göndərək?',
      desc:'Seçiminizə uyğun məktəblər siyahısı ilə əlaqə saxlayaq.',
      type:'contact'
    }
  ];

  let srvAnswers = {};
  let srvStep = 0;

  function buildSurveyModal(){
    const modal = document.createElement('div');
    modal.className = 'survey-modal';
    modal.id = 'surveyModal';
    modal.innerHTML = `
      <div class="survey-overlay"></div>
      <div class="survey-card">
        <button class="survey-close" aria-label="Bağla">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <div class="survey-progress">
          <div class="track"><div class="fill"></div></div>
          <div class="label"><span class="step-num">Addım 1 / ${surveySteps.length}</span><span>30 saniyə</span></div>
        </div>
        <div class="survey-body"></div>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector('.survey-close').addEventListener('click', closeSurvey);
    modal.querySelector('.survey-overlay').addEventListener('click', closeSurvey);
    document.addEventListener('keydown', (e)=>{
      if(e.key==='Escape' && modal.classList.contains('active')) closeSurvey();
    });

    return modal;
  }

  function renderStep(){
    const modal = document.getElementById('surveyModal');
    const body = modal.querySelector('.survey-body');
    const fill = modal.querySelector('.survey-progress .fill');
    const stepNum = modal.querySelector('.step-num');

    if(srvStep >= surveySteps.length){
      fill.style.width = '100%';
      stepNum.textContent = 'Tamamlandı';
      body.innerHTML = `
        <div class="survey-thanks">
          <div class="tick-big"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
          <h3>Təşəkkürlər!</h3>
          <p>Sorğunuz qəbul olundu. Seçimlərinizə uyğun 5 məktəb tapdıq — nəticələri sizə göndərəcəyik.</p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
            <a href="mekteblar.html" class="btn btn-primary">Məktəbləri gör</a>
            <button class="btn btn-ghost" data-close>Bağla</button>
          </div>
        </div>`;
      body.querySelector('[data-close]').addEventListener('click', closeSurvey);
      localStorage.setItem(SRV_KEY, JSON.stringify(srvAnswers));
      return;
    }

    const step = surveySteps[srvStep];
    fill.style.width = ((srvStep+1)/(surveySteps.length+1)*100) + '%';
    stepNum.textContent = `Addım ${srvStep+1} / ${surveySteps.length}`;

    if(step.type === 'contact'){
      body.innerHTML = `
        <div class="survey-step active">
          <span class="eyebrow">Son addım</span>
          <h3>${step.q}</h3>
          <p class="desc">${step.desc}</p>
          <input class="survey-input" type="text" id="srvName" placeholder="Adınız, soyadınız" value="${srvAnswers.name||''}">
          <input class="survey-input" type="tel" id="srvPhone" placeholder="Telefon nömrəsi" value="${srvAnswers.phone||''}">
          <input class="survey-input" type="email" id="srvEmail" placeholder="Email (könüllü)" value="${srvAnswers.email||''}">
          <div class="survey-nav">
            <button class="btn btn-ghost btn-back" data-back>← Geri</button>
            <button class="btn btn-primary" data-submit>
              Nəticələri al
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>`;
      body.querySelector('[data-submit]').addEventListener('click', ()=>{
        const name = document.getElementById('srvName').value.trim();
        const phone = document.getElementById('srvPhone').value.trim();
        const email = document.getElementById('srvEmail').value.trim();
        if(!name || !phone){
          alert('Ad və telefon nömrəsi mütləqdir');
          return;
        }
        srvAnswers.name = name;
        srvAnswers.phone = phone;
        srvAnswers.email = email;
        srvStep++;
        renderStep();
      });
      body.querySelector('[data-back]').addEventListener('click', ()=>{srvStep--; renderStep()});
      return;
    }

    const colsClass = `cols-${step.cols||2}`;
    body.innerHTML = `
      <div class="survey-step active">
        <span class="eyebrow">Sual ${srvStep+1}</span>
        <h3>${step.q}</h3>
        <p class="desc">${step.desc}</p>
        <div class="survey-options ${colsClass}">
          ${step.options.map(o=>`
            <button class="opt ${srvAnswers[step.id]===o.v?'selected':''}" data-v="${o.v}">
              <span class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>
              <span class="txt">${o.label}${o.sub?`<span class="sub">${o.sub}</span>`:''}</span>
            </button>
          `).join('')}
        </div>
        <div class="survey-nav">
          ${srvStep>0?'<button class="btn btn-ghost btn-back" data-back>← Geri</button>':''}
          <button class="btn btn-primary" data-next ${!srvAnswers[step.id]?'disabled':''}>
            Davam et
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>`;

    body.querySelectorAll('.opt').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        srvAnswers[step.id] = btn.dataset.v;
        body.querySelectorAll('.opt').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        body.querySelector('[data-next]').removeAttribute('disabled');
      });
    });
    const backBtn = body.querySelector('[data-back]');
    if(backBtn) backBtn.addEventListener('click', ()=>{srvStep--; renderStep()});
    body.querySelector('[data-next]').addEventListener('click', ()=>{
      if(!srvAnswers[step.id]) return;
      srvStep++;
      renderStep();
    });
  }

  function openSurvey(){
    let modal = document.getElementById('surveyModal');
    if(!modal) modal = buildSurveyModal();
    srvStep = 0;
    srvAnswers = {};
    try { srvAnswers = JSON.parse(localStorage.getItem(SRV_KEY) || '{}') } catch(e) {}
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    renderStep();
  }

  function closeSurvey(){
    const modal = document.getElementById('surveyModal');
    if(modal) modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Floating trigger button
  const trigger = document.createElement('button');
  trigger.className = 'survey-trigger';
  trigger.innerHTML = `<span class="ping"></span>Sizə uyğun məktəbi tapaq<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
  trigger.addEventListener('click', openSurvey);
  document.body.appendChild(trigger);

  // ============================================
  // CONTACT POPUP MODAL
  // ============================================
  function buildContactModal(){
    const modal = document.createElement('div');
    modal.className = 'contact-modal';
    modal.id = 'contactModal';
    modal.innerHTML = `
      <div class="overlay"></div>
      <div class="contact-card">
        <button class="close" aria-label="Bağla">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>

        <div class="contact-left">
          <div class="eyebrow">— Bizimlə əlaqə</div>
          <h3>Sualınız var? Dinləyirik.</h3>
          <p>Müraciətiniz iş günlərində 24 saat ərzində cavablandırılacaq.</p>

          <div class="contact-methods">
            <a href="tel:+994125550000" class="contact-method">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>
              <div class="info"><span class="l">Telefon</span><span class="v">+994 12 555 00 00</span></div>
            </a>
            <a href="mailto:info@edunav.az" class="contact-method">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z"/><polyline points="22,6 12,13 2,6"/></svg></span>
              <div class="info"><span class="l">Email</span><span class="v">info@edunav.az</span></div>
            </a>
            <a href="https://wa.me/994501234567" target="_blank" class="contact-method">
              <span class="icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.6a12 12 0 0 0 5.7 1.4c6.6 0 12-5.4 12-12 0-3.2-1.3-6.2-3.5-8.3z"/></svg></span>
              <div class="info"><span class="l">WhatsApp</span><span class="v">Yazmaq üçün klik</span></div>
            </a>
          </div>

          <div class="contact-socials">
            <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg></a>
            <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
            <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 0 0-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1.1 1.9 2.1 2.1 1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6c1-.3 1.9-1.1 2.1-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg></a>
            <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 1 1 8.3 6.5a1.78 1.78 0 0 1-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0 0 13 14.19a.66.66 0 0 0 0 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 0 1 2.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg></a>
          </div>
        </div>

        <div class="contact-right">
          <h4>Mesaj yazın</h4>
          <form class="contact-form" id="contactForm">
            <div class="row">
              <div class="field">
                <label>Ad</label>
                <input type="text" name="name" required placeholder="Adınız">
              </div>
              <div class="field">
                <label>Telefon</label>
                <input type="tel" name="phone" required placeholder="+994...">
              </div>
            </div>
            <div class="field">
              <label>Email</label>
              <input type="email" name="email" placeholder="email@domain.com">
            </div>
            <div class="field">
              <label>Mövzu</label>
              <select name="topic">
                <option>Ümumi sual</option>
                <option>Məktəb əlavə etmək</option>
                <option>Partnyorluq</option>
                <option>Texniki problem</option>
                <option>Digər</option>
              </select>
            </div>
            <div class="field">
              <label>Mesaj</label>
              <textarea name="message" required placeholder="Suallarınız və ya təklifləriniz..."></textarea>
            </div>
            <div class="actions">
              <button type="submit" class="btn btn-primary">
                Göndər
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.appendChild(modal);

    function close(){
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
    modal.querySelector('.close').addEventListener('click', close);
    modal.querySelector('.overlay').addEventListener('click', close);
    document.addEventListener('keydown', (e)=>{
      if(e.key==='Escape' && modal.classList.contains('active')) close();
    });

    modal.querySelector('#contactForm').addEventListener('submit', (e)=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      // Store in localStorage (in production: send to server)
      const msgs = JSON.parse(localStorage.getItem('edunav_contact')||'[]');
      msgs.push({...data, at: new Date().toISOString()});
      localStorage.setItem('edunav_contact', JSON.stringify(msgs));

      // Show success state
      const card = modal.querySelector('.contact-card');
      card.style.gridTemplateColumns = '1fr';
      card.innerHTML = `
        <button class="close" aria-label="Bağla">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <div class="contact-success">
          <div class="tick-big"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
          <h3>Mesajınız göndərildi</h3>
          <p>Təşəkkürlər, ${data.name || ''}! 24 saat ərzində sizinlə əlaqə saxlayacağıq.</p>
          <button class="btn btn-primary" data-close-success>Bağla</button>
        </div>`;
      card.style.background = '#fff';
      card.querySelector('.close').addEventListener('click', ()=>{location.reload()});
      card.querySelector('[data-close-success]').addEventListener('click', ()=>{location.reload()});
      // Make close button dark on light bg
      card.querySelector('.close').style.cssText='background:var(--surface);color:var(--ink);top:14px;right:14px';
    });

    return modal;
  }

  function openContact(){
    let modal = document.getElementById('contactModal');
    if(!modal) modal = buildContactModal();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Intercept all Əlaqə menu links
  document.querySelectorAll('a[href="elaqe.html"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      openContact();
    });
  });

  // Auto-open after 12s on homepage first visit
  const isHome = /\/(index\.html)?$/.test(location.pathname);
  if(isHome && !sessionStorage.getItem(SRV_SHOWN)){
    setTimeout(()=>{
      const m = document.getElementById('surveyModal');
      if(!m || !m.classList.contains('active')){
        openSurvey();
        sessionStorage.setItem(SRV_SHOWN, '1');
      }
    }, 12000);
  }

  // Tab switching (profile page)
  document.querySelectorAll('.tabs').forEach(tabs=>{
    tabs.querySelectorAll('a').forEach(a=>{
      a.addEventListener('click',(e)=>{
        e.preventDefault();
        tabs.querySelectorAll('a').forEach(x=>x.classList.remove('active'));
        a.classList.add('active');
        const id=a.getAttribute('href');
        if(id&&id.startsWith('#')){
          const target=document.querySelector(id);
          if(target) target.scrollIntoView({behavior:'smooth',block:'start'});
        }
      });
    });
  });

  // View toggle (list/grid)
  document.querySelectorAll('.view-toggle').forEach(vt=>{
    vt.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click',()=>{
        vt.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
      });
    });
  });

  // Premium showcase — interactive selector
  const schools = [
    {
      img:'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1000&q=85',
      name:'Atatürk Modern Lisey',location:'Yasamal',year:'2010-dan',
      tags:['IB','İngilis','Türk','Hovuz'],price:'8,500 AZN',
      rating:'4.9 ★',reviews:'128 rəy',students:'640',
      curriculum:'IB',classMax:'18'
    },
    {
      img:'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1000&q=85',
      name:'Cambridge Private School',location:'Nəsimi',year:'2008-dən',
      tags:['Cambridge','İngilis','Rus','Robotexnika'],price:'12,000 AZN',
      rating:'4.8 ★',reviews:'96 rəy',students:'520',
      curriculum:'Cambridge',classMax:'16'
    },
    {
      img:'https://images.unsplash.com/photo-1562774053-701939374585?w=1000&q=85',
      name:'STEAM Academy Baku',location:'Nizami',year:'2015-dən',
      tags:['Milli','STEAM','İngilis','IT Lab'],price:'6,900 AZN',
      rating:'4.7 ★',reviews:'74 rəy',students:'380',
      curriculum:'Milli + STEAM',classMax:'22'
    },
    {
      img:'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&q=85',
      name:'Zəfər Özəl Liseyi',location:'Xətai',year:'2012-dən',
      tags:['Milli','Azərbaycan','İdman zalı','Nəqliyyat'],price:'5,500 AZN',
      rating:'4.6 ★',reviews:'58 rəy',students:'280',
      curriculum:'Milli',classMax:'24'
    }
  ];

  const visual = document.getElementById('pv-visual');
  const items = document.querySelectorAll('.premium-item');

  function showSchool(idx){
    const s = schools[idx];
    if(!s) return;
    if(visual) visual.classList.add('changing');
    setTimeout(()=>{
      const img=document.getElementById('pv-img');
      if(img) img.src=s.img;
      const setText=(id,v)=>{const el=document.getElementById(id);if(el) el.textContent=v};
      setText('pv-name',s.name);
      setText('pv-location',s.location);
      setText('pv-year',s.year);
      setText('pv-price',s.price);
      setText('pv-rating',s.rating);
      setText('pv-reviews',s.reviews);
      setText('pv-students',s.students);
      setText('pa-curriculum',s.curriculum);
      setText('pa-class',s.classMax);
      setText('pa-students',s.students);
      setText('pc-current',String(idx+1).padStart(2,'0'));
      const tagHTML=s.tags.map(t=>`<span>${t}</span>`).join('');
      const pvTags=document.getElementById('pv-tags');
      if(pvTags) pvTags.innerHTML=tagHTML;
      const paTags=document.getElementById('pa-tags');
      if(paTags) paTags.innerHTML=s.tags.map(t=>`<span class="tag">${t}</span>`).join('');
      items.forEach((el,i)=>el.classList.toggle('active',i===idx));
      if(visual) visual.classList.remove('changing');
    },180);
  }

  items.forEach((item,i)=>{
    item.addEventListener('click',()=>showSchool(i));
  });

  const prevBtn=document.getElementById('pv-prev');
  const nextBtn=document.getElementById('pv-next');
  let current=0;
  if(prevBtn) prevBtn.addEventListener('click',()=>{current=(current-1+schools.length)%schools.length;showSchool(current)});
  if(nextBtn) nextBtn.addEventListener('click',()=>{current=(current+1)%schools.length;showSchool(current)});
  items.forEach((item,i)=>item.addEventListener('click',()=>{current=i}));
  const total=document.getElementById('pc-total');
  if(total) total.textContent=String(schools.length).padStart(2,'0');

})();
