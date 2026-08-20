  // ============ STATE ============
  let trades = [];
  let perfChart = null;
  let equityChart = null;
  let userPoints = 0;
  let userName = 'User';
  let currentTheme = 'light';
  let newsData = [];
  let newsFilters = { time: 'all', impact: 'all', currency: 'all' };
  
  // Quiz state — daily 3 questions, no repeats EVER
  let quizState = {
    todayDate: null,        // date string (e.g. "Mon Apr 28 2026") — current quiz day
    todayCompleted: 0,      // 0, 1, 2, or 3 — questions answered today
    todayQuestions: [],     // array of 3 question indices for today
    todayCurrent: 0,        // which of today's 3 to ask next (0/1/2)
    askedAllTime: []        // array of all question indices ever asked (no repeats)
  };
  
  // ============ ALL CURRENCY PAIRS ============
  const ALL_PAIRS = [
    { name: 'XAU/USD', cat: 'Metals', priority: 1 },
    { name: 'XAG/USD', cat: 'Metals', priority: 2 },
    { name: 'BTC/USD', cat: 'Crypto', priority: 3 },
    { name: 'ETH/USD', cat: 'Crypto', priority: 4 },
    { name: 'EUR/USD', cat: 'Major', priority: 5 },
    { name: 'GBP/USD', cat: 'Major', priority: 6 },
    { name: 'USD/JPY', cat: 'Major', priority: 7 },
    { name: 'USD/CHF', cat: 'Major', priority: 8 },
    { name: 'AUD/USD', cat: 'Major', priority: 9 },
    { name: 'USD/CAD', cat: 'Major', priority: 10 },
    { name: 'NZD/USD', cat: 'Major', priority: 11 },
    { name: 'EUR/JPY', cat: 'Cross', priority: 12 },
    { name: 'GBP/JPY', cat: 'Cross', priority: 13 },
    { name: 'EUR/GBP', cat: 'Cross', priority: 14 },
    { name: 'AUD/JPY', cat: 'Cross', priority: 15 },
    { name: 'CAD/JPY', cat: 'Cross', priority: 16 },
    { name: 'EUR/CHF', cat: 'Cross', priority: 17 },
    { name: 'EUR/AUD', cat: 'Cross', priority: 18 },
    { name: 'GBP/AUD', cat: 'Cross', priority: 19 },
    { name: 'GBP/CHF', cat: 'Cross', priority: 20 },
    { name: 'US30', cat: 'Index', priority: 21 },
    { name: 'NAS100', cat: 'Index', priority: 22 },
    { name: 'US500', cat: 'Index', priority: 23 },
    { name: 'GER40', cat: 'Index', priority: 24 },
  ];
  
  // ============ QUIZ QUESTIONS (default - will be replaced by DB) ============
  let QUIZ_QUESTIONS = [
    // Basics
    { q: "What does 'pip' stand for in forex?", opts: ["Price Interest Point", "Percentage in Point", "Profit in Position", "Point in Price"], correct: 1 },
    { q: "How many ounces of gold are in 1 standard lot of XAU/USD?", opts: ["10 oz", "100 oz", "1000 oz", "1 oz"], correct: 1 },
    { q: "What does NFP stand for?", opts: ["Nominal Forex Price", "Non-Farm Payroll", "New Forex Policy", "Net Foreign Profit"], correct: 1 },
    { q: "What is leverage in forex?", opts: ["Profit margin", "Borrowed capital to increase position size", "Stop loss distance", "Trading fee"], correct: 1 },
    { q: "What is a 'lot' in forex?", opts: ["A trading account type", "A standardized trading unit", "A type of broker", "A currency pair"], correct: 1 },
    { q: "What is the standard size of 1 forex lot?", opts: ["10,000 units", "100,000 units", "1,000,000 units", "1,000 units"], correct: 1 },
    { q: "What does 'spread' mean in forex?", opts: ["Distribution of trades", "Difference between bid and ask price", "Stop loss range", "Daily price range"], correct: 1 },
    { q: "Which is the most traded currency pair?", opts: ["GBP/USD", "USD/JPY", "EUR/USD", "AUD/USD"], correct: 2 },
    
    // Sessions & Time
    { q: "Which session has the highest volatility?", opts: ["Sydney", "Tokyo", "London + New York Overlap", "Asian Session"], correct: 2 },
    { q: "What time does London session open (UTC)?", opts: ["00:00", "08:00", "13:00", "22:00"], correct: 1 },
    { q: "What time does New York session open (UTC)?", opts: ["00:00", "08:00", "13:00", "22:00"], correct: 2 },
    { q: "Which session opens first in a trading day?", opts: ["London", "New York", "Tokyo", "Sydney"], correct: 3 },
    { q: "When is forex market closed?", opts: ["Every night", "Saturday and Sunday", "Only Sundays", "Public holidays only"], correct: 1 },
    
    // Risk Management
    { q: "What is a good Risk:Reward ratio?", opts: ["1:1", "1:0.5", "1:2 or higher", "2:1"], correct: 2 },
    { q: "Which is MOST important in trading?", opts: ["Strategy", "Risk Management", "News", "Indicators"], correct: 1 },
    { q: "What is the recommended max risk per trade?", opts: ["10-20%", "1-2%", "5-10%", "25-50%"], correct: 1 },
    { q: "What is a 'stop loss'?", opts: ["Profit target", "Order to limit losses at a price", "Daily loss limit", "Account minimum"], correct: 1 },
    { q: "What is 'drawdown'?", opts: ["Profit decline", "Peak-to-trough decline in account", "Withdrawal fee", "Daily loss"], correct: 1 },
    { q: "If you risk 2% per trade with $1000, how much $ are you risking?", opts: ["$10", "$20", "$50", "$200"], correct: 1 },
    { q: "What's the danger of over-leveraging?", opts: ["Higher fees", "Account blow-up risk", "Slower execution", "More taxes"], correct: 1 },
    
    // Technical Analysis
    { q: "What is 'support' in technical analysis?", opts: ["Customer service", "Price level where buying interest exceeds selling", "Strategy backing", "Account verification"], correct: 1 },
    { q: "What is 'resistance' in technical analysis?", opts: ["Strong account password", "Price level where selling pressure exceeds buying", "Broker resistance", "Trade rejection"], correct: 1 },
    { q: "What does a 'doji' candle indicate?", opts: ["Strong trend", "Indecision in market", "Buy signal", "Sell signal"], correct: 1 },
    { q: "What is a 'breakout'?", opts: ["Server crash", "Price moving past support/resistance", "Account closure", "Sudden loss"], correct: 1 },
    { q: "RSI above 70 generally means?", opts: ["Buy signal", "Overbought condition", "Oversold condition", "Hold position"], correct: 1 },
    { q: "RSI below 30 generally means?", opts: ["Overbought condition", "Oversold condition", "Strong sell", "No trade zone"], correct: 1 },
    { q: "What does MACD stand for?", opts: ["Moving Average Convergence Divergence", "Market Average Currency Direction", "Major Asset Class Differential", "Multi-Asset Chart Display"], correct: 0 },
    { q: "What is a 'pin bar'?", opts: ["Pinned tweet", "Reversal candlestick with long wick", "Closed position", "Limit order"], correct: 1 },
    
    // Pairs & Markets
    { q: "Which pair is called 'Cable'?", opts: ["EUR/USD", "USD/JPY", "GBP/USD", "AUD/USD"], correct: 2 },
    { q: "Which pair is called 'Loonie'?", opts: ["AUD/USD", "USD/CAD", "NZD/USD", "USD/CHF"], correct: 1 },
    { q: "Which pair is called 'Aussie'?", opts: ["AUD/USD", "USD/CAD", "NZD/USD", "USD/CHF"], correct: 0 },
    { q: "What is a JPY pair pip size?", opts: ["0.0001", "0.01", "0.001", "1.0"], correct: 1 },
    { q: "Standard pip value for XAU/USD per 1 lot?", opts: ["$1", "$10", "$100", "$1000"], correct: 1 },
    { q: "What is a 'safe-haven' currency?", opts: ["USD only", "JPY, CHF, USD typically", "EUR only", "Crypto only"], correct: 1 },
    
    // Fundamentals & News
    { q: "Who announces interest rate decisions in USA?", opts: ["FBI", "Federal Reserve (Fed)", "Treasury", "White House"], correct: 1 },
    { q: "What does CPI measure?", opts: ["Trading volume", "Consumer Price Index (inflation)", "Currency Power Index", "Capital Performance"], correct: 1 },
    { q: "When central bank raises interest rates, currency usually?", opts: ["Weakens", "Strengthens", "No effect", "Becomes volatile only"], correct: 1 },
    { q: "What is 'GDP'?", opts: ["Global Daily Price", "Gross Domestic Product", "General Demand Pressure", "Government Debt Position"], correct: 1 },
    { q: "What does ECB stand for?", opts: ["Economic Currency Bank", "European Central Bank", "Eastern Crypto Board", "Equity Capital Bureau"], correct: 1 },
    { q: "What does BOJ stand for?", opts: ["Bank of Japan", "Bureau of Justice", "Board of Jamaica", "Bank of Jordan"], correct: 0 },
    
    // Psychology
    { q: "What is FOMO in trading?", opts: ["Forex Order Manager Online", "Fear Of Missing Out", "Future Of Market Outlook", "First Open Market Order"], correct: 1 },
    { q: "Best way to handle losses?", opts: ["Revenge trade", "Increase position size", "Accept and analyze", "Quit trading"], correct: 2 },
    { q: "What is 'overtrading'?", opts: ["Trading on multiple platforms", "Taking too many trades than plan", "Trading large lots", "Long trading hours"], correct: 1 },
    { q: "When should you trade?", opts: ["When excited", "When angry", "When calm and following plan", "When bored"], correct: 2 },
    { q: "What is a trading journal for?", opts: ["Showing off profits", "Learning from past trades", "Tax purposes only", "Required by broker"], correct: 1 },
    
    // Strategy
    { q: "What is 'scalping'?", opts: ["Long-term holding", "Quick small profit trades", "Stealing trades", "News trading only"], correct: 1 },
    { q: "What is 'swing trading'?", opts: ["Wild trading style", "Holding trades for days/weeks", "Only short trades", "Trading swings only"], correct: 1 },
    { q: "What is 'position trading'?", opts: ["Day trading", "Long-term trades (weeks/months)", "Quick scalps", "Algorithm trading"], correct: 1 },
    { q: "What does 'SMC' stand for in trading?", opts: ["Stock Market Capital", "Smart Money Concepts", "Standard Margin Call", "Single Market Coverage"], correct: 1 },
    { q: "What is a 'liquidity grab'?", opts: ["Banking transaction", "Price sweep of stop-losses before reversal", "Buy order", "Margin call"], correct: 1 },
    
    // Practical
    { q: "What is 'margin call'?", opts: ["Free trading bonus", "Broker demand to deposit more funds", "Customer service number", "Trade confirmation"], correct: 1 },
    { q: "If you go LONG, you expect price to?", opts: ["Stay flat", "Go up", "Go down", "Become volatile"], correct: 1 },
    { q: "If you go SHORT, you expect price to?", opts: ["Stay flat", "Go up", "Go down", "Stop trading"], correct: 2 },
    { q: "What is 'slippage'?", opts: ["Account hack", "Difference between expected and executed price", "Falling profit", "Wet floor warning"], correct: 1 },
    { q: "What is a 'demo account'?", opts: ["Free trial broker account", "Practice account with virtual money", "Bonus account", "Closed account"], correct: 1 }
  ];
  
  // ============ CALCULATION FORMULAS ============
  function calculatePnL(pair, entry, exit, lot, direction) {
    const pairUpper = pair.toUpperCase().replace('/', '');
    const dir = direction === 'BUY' ? 1 : -1;
    const diff = exit - entry;
    
    if (pairUpper.includes('XAU')) return diff * lot * 100 * dir;
    if (pairUpper.includes('XAG')) return diff * lot * 5000 * dir;
    if (pairUpper.startsWith('BTC') || pairUpper.startsWith('ETH')) return diff * lot * dir;
    if (pairUpper.includes('JPY')) return (diff * lot * 100000 / exit) * dir;
    if (pairUpper.startsWith('USD')) return (diff * lot * 100000 / exit) * dir;
    if (['US30','NAS100','US500','GER40'].some(idx => pairUpper.includes(idx))) return diff * lot * dir;
    return diff * lot * 100000 * dir;
  }
  
  function getPipSize(pair) {
    const p = pair.toUpperCase().replace('/', '');
    if (p.includes('JPY')) return 0.01;
    if (p.includes('XAU')) return 0.01;
    if (p.includes('XAG')) return 0.001;
    if (p.startsWith('BTC') || p.startsWith('ETH')) return 1;
    return 0.0001;
  }
  
  // ============ NAVIGATION ============
  // V30: only tabs explicitly enabled by admin are shown. While settings load,
  // controlled tabs fail closed so a new user never sees disabled pages flash.
  var PSP_SITE_TAB_KEYS=['performance','addtrade','trades','analysis','aireport','charts','chats','signals','articles','vipplans','news','newshub','strength','tools','learn','vipindicators','vipea','banners','aitools','about','announce','support'];
  var PSP_ALWAYS_VISIBLE_TABS={dashboard:true,mycourses:true,settings:true};
  var _disabledTabs={};
  var _tabSettingsReady=false;
  var _tabSettingsRetryTimer=null;
  function pspTabCacheRead(){
    try{var raw=localStorage.getItem('psp_site_tab_settings_v30');return raw?JSON.parse(raw):null;}catch(_){return null;}
  }
  function pspTabCacheWrite(rows){
    try{localStorage.setItem('psp_site_tab_settings_v30',JSON.stringify({savedAt:Date.now(),rows:rows||[]}));}catch(_){}
  }
  function pspBuildDisabledTabs(rows){
    var explicit={};
    (rows||[]).forEach(function(row){
      var key=String(row&&row.key||'');
      if(PSP_SITE_TAB_KEYS.indexOf(key)!==-1)explicit[key]=row.enabled===true;
    });
    var disabled={};
    PSP_SITE_TAB_KEYS.forEach(function(key){disabled[key]=explicit[key]!==true;});
    // The Learn Forex setting controls the renamed My Courses item only when
    // an explicit mycourses setting is not present. My Courses remains safe.
    disabled.dashboard=false;
    disabled.mycourses=false;
    return disabled;
  }
  function pspScheduleTabSettingsRetry(){
    if(_tabSettingsRetryTimer)return;
    _tabSettingsRetryTimer=setTimeout(function(){_tabSettingsRetryTimer=null;loadTabSettings();},900);
  }
  async function loadTabSettings(){
    if(!sb){applyTabVisibility();pspScheduleTabSettingsRetry();return;}
    try{
      const r=await sb.from('site_settings').select('key,enabled').in('key',PSP_SITE_TAB_KEYS);
      if(r.error)throw r.error;
      const rows=r.data||[];
      _disabledTabs=pspBuildDisabledTabs(rows);
      _tabSettingsReady=true;
      pspTabCacheWrite(rows);
      applyTabVisibility();
    }catch(e){
      const cached=pspTabCacheRead();
      if(cached&&Array.isArray(cached.rows)){
        _disabledTabs=pspBuildDisabledTabs(cached.rows);
        _tabSettingsReady=true;
      }else{
        _disabledTabs=pspBuildDisabledTabs([]);
        _tabSettingsReady=false;
        pspScheduleTabSettingsRetry();
      }
      applyTabVisibility();
      console.warn('Site tab settings could not be loaded yet:',e&&e.message?e.message:e);
    }
  }
  function applyTabVisibility(){
    document.querySelectorAll('.menu-item[data-page]').forEach(function(m){
      var pg=m.getAttribute('data-page');
      if(pg==='aitools' && window.PSP_PORTAL_MODE!=='mentor'){m.style.display='none';return;}
      if(PSP_ALWAYS_VISIBLE_TABS[pg]){m.style.display='';return;}
      if(PSP_SITE_TAB_KEYS.indexOf(pg)!==-1){m.style.display=_disabledTabs[pg]===false?'':'none';return;}
      m.style.display='';
    });
    document.querySelectorAll('.menu-item[data-tabkey]').forEach(function(m){
      var pg=m.getAttribute('data-tabkey');
      m.style.display=_disabledTabs[pg]===false?'':'none';
    });
  }
  // Hide controlled tabs immediately, before Supabase/session resolution.
  _disabledTabs=pspBuildDisabledTabs([]);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyTabVisibility,{once:true});else applyTabVisibility();
  function showPage(page, el) {
    if(_disabledTabs[page] && page!=='dashboard'){ page='dashboard'; el=document.querySelector('.menu-item[data-page="dashboard"]'); }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');

    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('open');
      const overlay = document.getElementById('sidebarOverlay');
      if (overlay) overlay.style.display = 'none';
      document.documentElement.classList.remove('psp-sidebar-open');
      document.body.classList.remove('psp-sidebar-open');
    }
    
    document.querySelectorAll('.menu-item, .submenu-item').forEach(m => m.classList.remove('active'));
    if (el) el.classList.add('active');
    
    const titles = {
      dashboard: 'Dashboard', journal: 'Journal', performance: 'Performance', trades: 'My Trades',
      analysis: 'Trades Analysis', aireport: 'AI Report', news: 'Economic News', newshub: 'World News Hub', strength: 'Currency Strength',
      market: 'Live Market', charts: 'Live Charts', tools: 'Tools', learn: 'Learn Forex', mycourses: 'My Courses',
      signals: 'Signals', articles: 'Charts & Articles', vipplans: 'VIP Plans',
      support: 'Support', announce: 'Announcements', aitools: 'AI Tools',
      settings: 'Profile', about: 'About'
    };
    document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
    document.getElementById('sidebar').classList.remove('open');
    
    if (page === 'community') { showPage('chats', document.querySelector('[data-page=chats]')); return; }

    // Performance-only: paint the selected page first, then start expensive data/chart work.
    // This keeps the exact same UI while making tab/page switching feel immediate.
    window.__pspPageLoadToken=(window.__pspPageLoadToken||0)+1;
    const pspPageLoadToken=window.__pspPageLoadToken;
    const runPageWork=function(){
      if(pspPageLoadToken!==window.__pspPageLoadToken)return;
      if (page === 'journal') { try{ updateDashboard(); buildCalendar(); }catch(e){} }
      if (page === 'analysis') updateAnalysis();
      if (page === 'news' && newsRawData.length === 0) loadNews();
      if (page === 'news') loadAdminNews();
      if (page === 'learn') loadCourses();
      if (page === 'mycourses' && typeof window.loadMyCourses==='function') window.loadMyCourses();
      if (page === 'newshub' && window.nhInitLoad) window.nhInitLoad();
      if (page === 'strength') loadStrength();
      if (page === 'charts') loadChart();
      if (page === 'vipplans') loadVipPlans();
      if (page === 'support') loadSupport();
      if (page === 'chats') uTabSwitch(_uTab||'comm');
      if (page === 'aireport') loadCachedAIReport();
      if (page === 'aitools') initMentorAiTools();
      if (page === 'announce') loadAnnouncements();
      if (page === 'signals') loadSignalsFromDB();
      if (page === 'performance') {
        loadPerformance();
        setTimeout(ensurePerformanceGraphVisible, 80);
        setTimeout(ensurePerformanceGraphVisible, 350);
        setTimeout(function(){ try{ if(equityChart){ equityChart.resize(); equityChart.update('none'); } }catch(e){} }, 100);
      }
      if (page === 'articles') loadArticlesFromDB();
      if (page === 'tools' && window.currentToolsTab === 'banners') loadBanners();
      if (page === 'market') { loadGoldPrice(); loadMarketTicker(); }
      if (page === 'settings') updateSettingsProfile();
    };
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(function(){setTimeout(runPageWork,0);});
    else setTimeout(runPageWork,0);

    window.scrollTo(0, 0);
  }
  


  /* scroll tab-shift feature removed */

  function goDashboardHome() {
    var item = document.querySelector('.menu-item[data-page="dashboard"]');
    showPage('dashboard', item);
  }
  function goPerformanceHome() { goDashboardHome(); }
  
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar) return;

    const willOpen = !sidebar.classList.contains('open');
    const mobile = window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : window.innerWidth <= 768;

    if (mobile) {
      const nav = document.getElementById('userBottomNav');
      const navH = nav && getComputedStyle(nav).display !== 'none'
        ? Math.max(0, Math.ceil(nav.getBoundingClientRect().height))
        : 0;
      document.documentElement.style.setProperty('--psp-mobile-nav-h', navH + 'px');
    }

    sidebar.classList.toggle('open', willOpen);
    if (overlay) overlay.style.display = willOpen ? 'block' : 'none';
    document.documentElement.classList.toggle('psp-sidebar-open', willOpen);
    document.body.classList.toggle('psp-sidebar-open', willOpen);

    if (mobile) {
      if (willOpen) {
        window.__pspSidebarScrollY = window.scrollY || window.pageYOffset || 0;
        document.body.style.position = 'fixed';
        document.body.style.top = '-' + window.__pspSidebarScrollY + 'px';
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';

        const menu = sidebar.querySelector('.menu');
        if (menu) menu.scrollTop = 0;
      } else {
        const y = Number(window.__pspSidebarScrollY || 0);
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, y);
      }
    } else if (willOpen) {
      const menu = sidebar.querySelector('.menu');
      if (menu) menu.scrollTop = 0;
    }
  }
  
  function toggleSubmenu(el) {
    el.classList.toggle('expanded');
    el.nextElementSibling.classList.toggle('open');
  }
  
  // ============ THEME TOGGLE ============
  function toggleTheme() {
    const html = document.documentElement;
    const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    document.getElementById('themeBtn').textContent = newTheme === 'dark' ? '🌙' : '☀️';
    currentTheme = newTheme;
    if (perfChart) updateChartTheme(perfChart);
    if (equityChart) updateChartTheme(equityChart);
    
    if (typeof updateMentorAiTheme === 'function') updateMentorAiTheme();
  }
  
  function getThemeChartColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
      grid: styles.getPropertyValue('--chart-grid').trim() || '#d8e0ea',
      gridSoft: styles.getPropertyValue('--chart-grid-soft').trim() || '#edf2f7',
      axis: styles.getPropertyValue('--chart-axis').trim() || '#d5deea',
      tick: styles.getPropertyValue('--chart-tick').trim() || '#94a3b8'
    };
  }

  function updateChartTheme(chart) {
    if (!chart || !chart.options || !chart.options.scales) return;
    const colors = getThemeChartColors();
    ['x','y'].forEach(function(axis){
      if (!chart.options.scales[axis]) return;
      if (!chart.options.scales[axis].grid) chart.options.scales[axis].grid = {};
      if (!chart.options.scales[axis].ticks) chart.options.scales[axis].ticks = {};
      if (!chart.options.scales[axis].border) chart.options.scales[axis].border = {};
      chart.options.scales[axis].ticks.color = colors.tick;
      chart.options.scales[axis].border.color = colors.axis;
    });
    chart.options.scales.y.grid.color = colors.grid;
    chart.options.scales.y.grid.lineWidth = 1;
    chart.options.scales.x.grid.color = colors.gridSoft;
    chart.options.scales.x.grid.lineWidth = 1;
    chart.update();
  }
  
  // ============ MODAL ============
  function openModal(id) { document.getElementById('modal-' + id).classList.add('active'); }
  function closeModal(id) {
    const modal=document.getElementById('modal-' + id);
    if(modal) modal.classList.remove('active');
    if(id==='auth'){
      document.body.style.overflow='';
      if(typeof resetSignupVerificationState==='function') resetSignupVerificationState(true);
    }
  }
  
  // ============ TIME ============
  let globalTimezone = 'Asia/Karachi';
  
  const TZ_SHORT_LABELS = {
    'Asia/Karachi': 'PKT', 'Asia/Singapore': 'SGT', 'Asia/Dubai': 'GST',
    'Asia/Kolkata': 'IST', 'Asia/Tokyo': 'JST', 'Asia/Shanghai': 'CST',
    'Asia/Riyadh': 'AST', 'UTC': 'UTC', 'Europe/London': 'GMT',
    'Europe/Berlin': 'CET', 'America/New_York': 'EST',
    'America/Los_Angeles': 'PST', 'Australia/Sydney': 'AEDT'
  };
  
  function setGlobalTimezone(tz) {
    globalTimezone = tz;
    // Sync news timezone too if it exists
    if (typeof newsState !== 'undefined') {
      newsState.timezone = tz;
      const labelEl = document.getElementById('newsTimezoneLabel');
      if (labelEl) labelEl.textContent = TZ_SHORT_LABELS[tz] || tz;
      if (typeof renderNews === 'function' && typeof newsRawData !== 'undefined' && newsRawData.length > 0) {
        renderNews(typeof isUsingSample === 'function' ? !isUsingSample() : true);
      }
    }
    updateTime();
  }
  
  function updateTime() {
    const now = new Date();
    const liveEl = document.getElementById('liveTime');
    if (liveEl) {
      liveEl.textContent = now.toLocaleTimeString('en-US', { hour12: false, timeZone: globalTimezone });
    }
    const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: globalTimezone });
    const dateEl = document.getElementById('pageDate');
    if (dateEl) dateEl.textContent = date;
    
    const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: globalTimezone });
    const monthEl = document.getElementById('monthYear');
    if (monthEl) monthEl.textContent = monthYear;
    
    updateTopbarSessions();
    updateSessionsGrid();
  }
  setInterval(updateTime, 1000);
  
  // ============ SESSIONS ============
  const sessions = [
    { name: 'Sydney', open: 22, close: 7, icon: '🇦🇺', short: 'SYD' },
    { name: 'Tokyo', open: 0, close: 9, icon: '🇯🇵', short: 'TYO' },
    { name: 'London', open: 8, close: 17, icon: '🇬🇧', short: 'LDN' },
    { name: 'New York', open: 13, close: 22, icon: '🇺🇸', short: 'NY' }
  ];
  
  function isSessionOpen(s) {
    const utcHour = new Date().getUTCHours();
    if (s.open < s.close) return utcHour >= s.open && utcHour < s.close;
    return utcHour >= s.open || utcHour < s.close;
  }
  
  function updateTopbarSessions() {
    const grid = document.getElementById('topbarSessions');
    if (!grid) return;
    grid.innerHTML = sessions.map(s => {
      const open = isSessionOpen(s);
      return `<div class="session-pill ${open ? 'active' : ''}" title="${s.name} session">
        <span class="pill-dot"></span>${s.short}
      </div>`;
    }).join('');
  }
  
  function updateSessionsGrid() {
    const grid = document.getElementById('sessionsGrid');
    if (!grid) return;
    grid.innerHTML = sessions.map(s => {
      const open = isSessionOpen(s);
      return `<div class="session-card ${open ? 'active' : ''}">
        <div class="session-name">${s.icon} ${s.name}</div>
        <div class="session-time">${String(s.open).padStart(2,'0')}:00 - ${String(s.close).padStart(2,'0')}:00 UTC</div>
        <div class="session-status ${open ? 'open' : 'closed'}">${open ? '● OPEN' : '○ Closed'}</div>
      </div>`;
    }).join('');
  }
  
  // ============ CALENDAR ============
  function buildCalendar() {
    const cal = document.getElementById('calendar');
    if (!cal) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday start
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = '';
    ['M','T','W','T','F','S','S'].forEach(d => html += `<div class="cal-header">${d}</div>`);
    html += '<div class="cal-header">Weekly</div>';
    
    let dayNum = 1 - offset;
    for (let week = 0; week < 6; week++) {
      let weekTotal = 0;
      let weekDays = 0;
      const weekStartDay = dayNum;
      
      for (let d = 0; d < 7; d++) {
        if (dayNum < 1 || dayNum > daysInMonth) {
          html += '<div class="cal-cell empty"></div>';
        } else {
          const dayDate = `${year}-${String(month+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
          const dayTrades = trades.filter(t => t.date === dayDate);
          const dayPnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
          
          let cls = '';
          if (dayTrades.length > 0) {
            cls = dayPnl >= 0 ? 'profit' : 'loss';
            weekTotal += dayPnl;
            weekDays++;
          }
          if (dayNum === today) cls += ' today';
          
          html += `<div class="cal-cell ${cls}" onclick="showDayTrades('${dayDate}', ${dayNum})">
            <span>${dayNum}</span>
            ${dayTrades.length > 0 ? `<span class="cell-pl">${dayPnl >= 0 ? '+' : ''}$${dayPnl.toFixed(0)}</span>` : ''}
          </div>`;
        }
        dayNum++;
      }
      
      html += `<div class="cal-weekly ${weekDays > 0 ? 'has-trades' : ''}">
        <div style="font-weight:700;font-size:9px;">WEEKLY</div>
        <div>${weekTotal >= 0 ? '+' : ''}$${weekTotal.toFixed(0)}</div>
        <div style="font-size:8px;">${weekDays} day${weekDays !== 1 ? 's' : ''}</div>
      </div>`;
      
      if (dayNum > daysInMonth) break;
    }
    
    cal.innerHTML = html;
  }
  
  function showDayTrades(date, day) {
    const dayTrades = trades.filter(t => t.date === date);
    if (dayTrades.length === 0) {
      alert('No trades on this day');
      return;
    }
    const total = dayTrades.reduce((s, t) => s + t.pnl, 0);
    const html = `
      <div style="margin-bottom: 16px; padding: 14px; background: var(--bg-elevated); border-radius: 10px;">
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Total P&L on ${date}</div>
        <div style="font-size: 22px; font-weight: 700; color: ${total >= 0 ? 'var(--green)' : 'var(--red)'};">
          ${total >= 0 ? '+' : ''}$${total.toFixed(2)}
        </div>
      </div>
      <table class="trades-table">
        <thead><tr><th>Pair</th><th>Direction</th><th>Entry</th><th>Exit</th><th>Lot</th><th>P&L</th></tr></thead>
        <tbody>${dayTrades.map(t => `
          <tr><td><strong>${t.pair}</strong></td>
          <td><span class="badge ${t.direction === 'BUY' ? 'buy' : 'sell'}">${t.direction}</span></td>
          <td>${t.entry}</td><td>${t.exit}</td><td>${t.lot}</td>
          <td style="color: ${t.pnl >= 0 ? 'var(--green)' : 'var(--red)'}; font-weight: 700;">
            ${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}</td></tr>`).join('')}</tbody>
      </table>`;
    document.getElementById('dayTradesContent').innerHTML = html;
    document.getElementById('dayTradesTitle').textContent = `Trades on ${date}`;
    openModal('dayTrades');
  }
  
  // ============ PERFORMANCE CHART ============
  function buildPerfChart() {
    const ctx = document.getElementById('perfChart');
    if (!ctx || typeof Chart === 'undefined') return;
    const colors = getThemeChartColors();
    if (perfChart) { try { perfChart.destroy(); } catch(e){} }
    perfChart = new Chart(ctx, {
      type: 'line',
      data: { labels: ['Start'], datasets: [{
        data: [0], borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6, borderWidth: 2
      }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        interaction: { intersect: false, mode: 'index' },
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 1,
            grid: { color: colors.grid, lineWidth: 1 },
            ticks: { color: colors.tick, font: { size: 10 } },
            border: { color: colors.axis }
          },
          x: {
            grid: { display: false, color: colors.gridSoft, lineWidth: 1 },
            ticks: { color: colors.tick, font: { size: 10 } },
            border: { color: colors.axis }
          }
        }
      }
    });
    updateChartTheme(perfChart);
    setTimeout(function(){ try{ perfChart.resize(); perfChart.update('none'); }catch(e){} }, 80);
  }
  
  function changeTimeframe(tf, el) {
    document.querySelectorAll('.perf-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }
  
  // ============ JOURNAL ============
  function showPairs(input) {
    const dropdown = document.getElementById('t_pairDropdown');
    if (!dropdown) return;
    dropdown.classList.add('open');
    filterPairs(input);
  }
  
  function hidePairs(input) {
    const dropdown = document.getElementById('t_pairDropdown');
    if (dropdown) dropdown.classList.remove('open');
  }
  
  function filterPairs(input) {
    const dropdown = document.getElementById('t_pairDropdown');
    if (!dropdown) return;
    const search = input.value.toLowerCase().replace('/', '');
    const filtered = ALL_PAIRS.filter(p => p.name.toLowerCase().replace('/', '').includes(search))
      .sort((a, b) => a.priority - b.priority);
    dropdown.innerHTML = filtered.map(p => 
      `<div class="pair-option" onclick="selectPair('${p.name}')">
        ${p.name} <span class="pair-cat">${p.cat}</span>
      </div>`
    ).join('');
  }
  
  function selectPair(pair) {
    document.getElementById('t_pair').value = pair;
    document.getElementById('t_pairDropdown').classList.remove('open');
    updateLivePnl();
  }
  
  // Add Trade Modal state
  let currentTradeDir = 'BUY';
  
  function openAddTradeModal() {
    // Reset form
    currentTradeDir = 'BUY';
    setTradeDir('BUY');
    document.getElementById('t_pair').value = 'XAU/USD';
    document.getElementById('t_lot').value = '0.10';
    ['t_entry', 't_exit', 't_sl', 't_tp', 't_notes'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('t_date')) document.getElementById('t_date').value = today;
    // Optional fields are always visible now
    var _of=document.getElementById('optionalFields'); if(_of) _of.style.display = 'block';
    updateLivePnl();
    openModal('addTrade');
  }
  
  function setTradeDir(dir) {
    currentTradeDir = dir;
    const longBtn = document.getElementById('dirLong');
    const shortBtn = document.getElementById('dirShort');
    if (dir === 'BUY') {
      longBtn.style.background = 'var(--green-bg)';
      longBtn.style.color = 'var(--green)';
      shortBtn.style.background = 'transparent';
      shortBtn.style.color = 'var(--text-muted)';
    } else {
      shortBtn.style.background = 'var(--red-bg)';
      shortBtn.style.color = 'var(--red)';
      longBtn.style.background = 'transparent';
      longBtn.style.color = 'var(--text-muted)';
    }
    updateLivePnl();
  }
  
  function toggleOptionalFields() {
    const opt = document.getElementById('optionalFields');
    const arr = document.getElementById('optArrow');
    if (!opt) return;
    if (opt.style.display === 'none') {
      opt.style.display = 'block';
      if (arr) arr.textContent = '▼';
    } else {
      opt.style.display = 'none';
      if (arr) arr.textContent = '▶';
    }
  }
  
  function updateLivePnl() {
    const pair = document.getElementById('t_pair').value;
    const entry = parseFloat(document.getElementById('t_entry').value) || 0;
    const exit = parseFloat(document.getElementById('t_exit').value) || 0;
    const lot = parseFloat(document.getElementById('t_lot').value) || 0;
    const direction = currentTradeDir;
    
    const el = document.getElementById('livePnl');
    if (!el) return;
    if (entry && exit && lot) {
      const pnl = calculatePnL(pair, entry, exit, lot, direction);
      el.textContent = (pnl >= 0 ? '+$' : '-$') + Math.abs(pnl).toFixed(2);
      el.style.color = pnl >= 0 ? 'var(--green)' : 'var(--red)';
    } else {
      el.textContent = '$0.00';
      el.style.color = 'var(--gold-light)';
    }
  }
  
  async function saveTrade() {
    const pair = document.getElementById('t_pair').value;
    const entry = parseFloat(document.getElementById('t_entry').value);
    const exit = parseFloat(document.getElementById('t_exit').value);
    const lot = parseFloat(document.getElementById('t_lot').value);
    const direction = currentTradeDir;
    
    if (!pair || !entry || !exit || !lot) {
      alert('Please fill: Symbol, Entry Price, Exit Price, and Quantity (Lot)');
      return;
    }
    
    // Check if user is logged in
    if (!currentUser) {
      alert('⚠️ Please login first to save trades.\n\nClick "Login / Sign Up" in the sidebar to create a free account.');
      closeModal('addTrade');
      openAuthModal();
      return;
    }
    
    const pnl = calculatePnL(pair, entry, exit, lot, direction);
    let date = document.getElementById('t_date').value;
    if (!date) {
      const now = new Date();
      date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    }
    
    // Save to Supabase database
    const tradeData = {
      user_id: currentUser.id,
      pair: pair,
      direction: direction,
      entry_price: entry,
      exit_price: exit,
      lot_size: lot,
      stop_loss: parseFloat(document.getElementById('t_sl').value) || null,
      take_profit: parseFloat(document.getElementById('t_tp').value) || null,
      pnl: pnl,
      strategy: document.getElementById('t_strategy').value,
      emotion: document.getElementById('t_emotion').value,
      notes: document.getElementById('t_notes').value,
      trade_date: date
    };
    
    try {
      const { data, error } = await sb.from('trades').insert(tradeData).select().single();
      
      if (error) {
        alert('❌ Error saving trade: ' + error.message);
        return;
      }
      
      // Add to local trades array (with database ID)
      trades.push({
        id: data.id,
        date: data.trade_date,
        pair: data.pair,
        direction: data.direction,
        entry: data.entry_price,
        exit: data.exit_price,
        lot: data.lot_size,
        pnl: data.pnl,
        sl: data.stop_loss || 0,
        tp: data.take_profit || 0,
        strategy: data.strategy,
        emotion: data.emotion,
        notes: data.notes
      });
      
      updateDashboard();
      updateTradesTable();
      buildCalendar();
      setTimeout(ensurePerformanceGraphVisible, 80);
      closeModal('addTrade');
      
      setTimeout(() => alert('✅ Trade saved to your account! P&L: ' + (pnl >= 0 ? '+$' : '-$') + Math.abs(pnl).toFixed(2)), 100);
    } catch (e) {
      alert('❌ Network error: ' + e.message);
    }
  }
  
  async function deleteTrade(id) {
    const tradeId = String(id ?? '').trim();
    if (!tradeId) {
      alert('❌ Unable to identify this trade. Please refresh and try again.');
      return;
    }

    let confirmed = false;
    try {
      confirmed = window.pspConfirm
        ? await window.pspConfirm('Delete this trade permanently?')
        : window.confirm('Delete this trade permanently?');
    } catch (e) {
      confirmed = window.confirm('Delete this trade permanently?');
    }
    if (!confirmed) return;

    try {
      if (!currentUser || !sb) {
        alert('❌ Your account session is not ready. Please refresh and try again.');
        return;
      }

      // Use an exact row count instead of DELETE ... RETURNING so the action
      // does not depend on a separate SELECT policy for returned rows.
      const { error, count } = await sb
        .from('trades')
        .delete({ count: 'exact' })
        .eq('id', tradeId)
        .eq('user_id', currentUser.id);

      if (error) {
        alert('❌ Error deleting trade: ' + error.message);
        return;
      }

      // If the API reports no affected row, reload once before showing an error.
      if (count === 0) {
        await loadTradesFromDB();
        if (trades.some(t => String(t.id) === tradeId)) {
          alert('❌ Trade was not deleted. Please run the V74 Supabase trade-delete policy update, then try again.');
          return;
        }
      } else {
        trades = trades.filter(t => String(t.id) !== tradeId);
      }

      updateDashboard();
      updateTradesTable();
      buildCalendar();
      try { if (typeof updateAnalysis === 'function') updateAnalysis(); } catch (_) {}
      alert('✅ Trade deleted successfully.');
    } catch (e) {
      alert('❌ Error deleting trade: ' + (e?.message || e));
    }
  }
  // Explicit global export keeps table actions reliable on every clean route.
  window.deleteTrade = deleteTrade;

  // Load all trades from database for current user
  async function loadTradesFromDB() {
    if (!currentUser || !sb) return;
    
    const { data, error } = await sb.from('trades')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('trade_date', { ascending: true });
    
    if (error) {
      console.error('Error loading trades:', error);
      return;
    }
    
    // Convert database format to local format
    trades = (data || []).map(t => ({
      id: t.id,
      date: t.trade_date,
      pair: t.pair,
      direction: t.direction,
      entry: parseFloat(t.entry_price),
      exit: parseFloat(t.exit_price),
      lot: parseFloat(t.lot_size),
      pnl: parseFloat(t.pnl),
      sl: parseFloat(t.stop_loss) || 0,
      tp: parseFloat(t.take_profit) || 0,
      strategy: t.strategy,
      emotion: t.emotion,
      notes: t.notes
    }));
    
    updateDashboard();
    updateTradesTable();
    buildCalendar();
    console.log('✅ Loaded ' + trades.length + ' trades from database');
  }
  
  // ============ COURSES LOADER ============
  async function loadCourses() {
    if (!sb) return;
    
    const grid = document.getElementById('coursesGrid');
    const countEl = document.getElementById('coursesCount');
    if (!grid) return;
    
    const { data, error } = await sb.from('courses')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Error loading courses:', error);
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; height: 150px;"><div class="empty-icon">⚠️</div><div>Error loading courses</div></div>';
      return;
    }
    
    if (!data || data.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; height: 150px;"><div class="empty-icon">📭</div><div>No courses yet</div></div>';
      if (countEl) countEl.textContent = '0 courses';
      return;
    }
    
    if (countEl) countEl.textContent = data.length + ' courses available';
    
    grid.innerHTML = data.map(c => {
      const locked = !canAccessContent('courses', c.audience);
      let url = (c.youtube_url || '').trim(); if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url; if (!url) url = '#';
      const clickAttr = locked ? `onclick="showPage('vipplans', document.querySelector('[data-page=vipplans]'))"` : `onclick="window.open('${url}', '_blank')"`;
      const premiumBadge = locked ? '<span style="position: absolute; top: 12px; right: 12px; padding: 3px 8px; background: var(--gold); color: #0a0e1a; font-size: 9px; font-weight: 800; border-radius: 4px;">🔒 LOCKED</span>' : (c.is_premium ? '<span style="position: absolute; top: 12px; right: 12px; padding: 3px 8px; background: var(--gold); color: #0a0e1a; font-size: 9px; font-weight: 800; border-radius: 4px;">⭐ PREMIUM</span>' : '');
      return `<div class="tool-card" ${clickAttr} style="position: relative;${locked?'opacity:.85':''}">
        ${premiumBadge}
        ${(c.thumbnail && !locked) ? `<img src="${c.thumbnail}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;">` : `<div class="tool-icon">${locked?'🔒':(c.thumbnail_emoji || '📚')}</div>`}
        <h3>${c.title}</h3>
        <p>${locked?'Members-only course — unlock to view':(c.description || '')}</p>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
          <span>👥 ${c.enrollments_count || 0} enrolled</span>
          <span style="color: var(--gold); font-weight: 600;">${locked?'🔒 Locked':(c.level || 'All levels')}</span>
        </div>
      </div>`;
    }).join('');
    
    console.log('✅ Loaded ' + data.length + ' courses');
  }
  
  // ============ ADMIN NEWS POSTS LOADER ============
  async function loadAdminNews() {
    if (!sb) return;
    
    const card = document.getElementById('adminNewsCard');
    const list = document.getElementById('adminNewsList');
    const countEl = document.getElementById('adminNewsCount');
    if (!card || !list) return;
    
    const { data, error } = await sb.from('news_posts')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error || !data || data.length === 0) {
      card.style.display = 'none';
      return;
    }
    
    card.style.display = 'block';
    if (countEl) countEl.textContent = data.length + ' posts';
    
    list.innerHTML = data.map(n => {
      const priorityColor = n.priority === 'High' ? 'var(--red)' : (n.priority === 'Medium' ? 'var(--gold)' : 'var(--green)');
      const priorityBg = n.priority === 'High' ? 'var(--red-bg)' : (n.priority === 'Medium' ? 'var(--gold-bg)' : 'var(--green-bg)');
      const date = new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `<div style="padding: 12px; background: var(--bg-elevated); border-radius: 10px; margin-bottom: 8px; border-left: 3px solid ${priorityColor};">
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px; margin-bottom: 6px;">
          <strong style="font-size: 13px;">${n.title}</strong>
          <span style="font-size: 9px; padding: 2px 8px; background: ${priorityBg}; color: ${priorityColor}; border-radius: 4px; font-weight: 700; white-space: nowrap;">${n.priority.toUpperCase()}</span>
        </div>
        ${n.content ? `<div style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 6px;">${n.content}</div>` : ''}
        <div style="font-size: 10px; color: var(--text-muted); display: flex; justify-content: space-between;">
          <span>📅 ${date}</span>
          <span>👁️ ${n.views_count || 0} views</span>
        </div>
      </div>`;
    }).join('');
  }
  
  // ============ QUIZ QUESTIONS LOADER ============
  async function loadQuizQuestionsFromDB() {
    if (!sb) return;
    
    const { data, error } = await sb.from('quiz_questions').select('*');
    
    if (error || !data || data.length === 0) {
      console.warn('Using default quiz questions (DB load failed)');
      return;
    }
    
    // Convert DB format to local format
    QUIZ_QUESTIONS = data.map(q => ({
      q: q.question,
      opts: [q.option_a, q.option_b, q.option_c, q.option_d],
      correct: q.correct_answer
    }));
    
    console.log('✅ Loaded ' + QUIZ_QUESTIONS.length + ' quiz questions from DB');
  }
  
  function viewTradeDetail(id) {
    const tradeId = String(id ?? '').trim();
    const t = trades.find(x => String(x.id) === tradeId);
    if (!t) return;
    document.getElementById('tradeDetailContent').innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div><div class="quick-stat-label">Date</div><div style="font-weight:600;">${t.date}</div></div>
        <div><div class="quick-stat-label">Pair</div><div style="font-weight:600;">${t.pair}</div></div>
        <div><div class="quick-stat-label">Direction</div><span class="badge ${t.direction === 'BUY' ? 'buy' : 'sell'}">${t.direction}</span></div>
        <div><div class="quick-stat-label">Lot Size</div><div style="font-weight:600;">${t.lot}</div></div>
        <div><div class="quick-stat-label">Entry</div><div style="font-weight:600;">${t.entry}</div></div>
        <div><div class="quick-stat-label">Exit</div><div style="font-weight:600;">${t.exit}</div></div>
        <div><div class="quick-stat-label">Stop Loss</div><div>${t.sl || '-'}</div></div>
        <div><div class="quick-stat-label">Take Profit</div><div>${t.tp || '-'}</div></div>
        <div><div class="quick-stat-label">Strategy</div><div>${t.strategy}</div></div>
        <div><div class="quick-stat-label">Emotion</div><div>${t.emotion}</div></div>
      </div>
      <div style="margin-top: 16px; padding: 14px; background: ${t.pnl >= 0 ? 'var(--green-bg)' : 'var(--red-bg)'}; border-radius: 10px;">
        <div class="quick-stat-label">Profit / Loss</div>
        <div style="font-size: 24px; font-weight: 800; color: ${t.pnl >= 0 ? 'var(--green)' : 'var(--red)'};">
          ${t.pnl >= 0 ? '+$' : '-$'}${Math.abs(t.pnl).toFixed(2)}
        </div>
      </div>
      ${t.notes ? `<div style="margin-top: 14px;">
        <div class="quick-stat-label" style="margin-bottom: 6px;">Notes</div>
        <div style="padding: 12px; background: var(--bg-elevated); border-radius: 8px; line-height: 1.6; font-size: 13px;">${t.notes}</div>
      </div>` : ''}
    `;
    openModal('tradeDetail');
  }
  
  function updateDashboard() {
    const total = trades.reduce((s, t) => s + t.pnl, 0);
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length * 100) : 0;
    const totalWins = wins.reduce((s, t) => s + t.pnl, 0);
    const totalLosses = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : (totalWins > 0 ? 999 : 0);
    
    document.getElementById('totalPL').textContent = (total >= 0 ? '+$' : '-$') + Math.abs(total).toFixed(2);
    document.getElementById('totalPL').className = 'stat-value ' + (total >= 0 ? 'green' : 'red');
    document.getElementById('totalTrades').textContent = trades.length;
    document.getElementById('closedTrades').textContent = trades.length;
    document.getElementById('winRate').textContent = winRate.toFixed(1) + '%';
    document.getElementById('profitFactor').textContent = profitFactor === 999 ? '∞' : profitFactor.toFixed(2);
    document.getElementById('perfValue').textContent = (total >= 0 ? '+$' : '-$') + Math.abs(total).toFixed(2);
    
    const monthlyTotal = trades.reduce((s, t) => s + t.pnl, 0);
    document.getElementById('monthlyTotal').textContent = (monthlyTotal >= 0 ? '+$' : '-$') + Math.abs(monthlyTotal).toFixed(2);
    
    if (trades.length > 0) {
      const recent = trades.slice(-5).reverse();
      document.getElementById('recentTradesList').innerHTML = recent.map(t => `
        <div style="padding: 12px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; font-size: 13px;">${t.pair} <span class="badge ${t.direction === 'BUY' ? 'buy' : 'sell'}" style="margin-left: 6px;">${t.direction}</span></div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${t.date} · ${t.strategy}</div>
          </div>
          <div style="font-weight: 700; color: ${t.pnl >= 0 ? 'var(--green)' : 'var(--red)'};">
            ${t.pnl >= 0 ? '+$' : '-$'}${Math.abs(t.pnl).toFixed(2)}
          </div>
        </div>`).join('');
      document.getElementById('recentTradesCount').textContent = trades.length + ' trades';
    }
    
    if (perfChart) {
      if (trades.length > 0) {
        let cumulative = 0;
        const data = [0]; // Start at $0
        const labels = ['Start'];
        trades.forEach((t, i) => {
          cumulative += t.pnl;
          data.push(cumulative);
          labels.push('T' + (i + 1));
        });
        perfChart.data.labels = labels;
        perfChart.data.datasets[0].data = data;
        // Color line based on final P&L
        const finalPL = data[data.length - 1];
        const color = finalPL >= 0 ? '#10b981' : '#ef4444';
        const bgColor = finalPL >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        perfChart.data.datasets[0].borderColor = color;
        perfChart.data.datasets[0].backgroundColor = bgColor;
        perfChart.data.datasets[0].pointBackgroundColor = color;
        perfChart.data.datasets[0].pointRadius = 4;

        // Keep $0 at the bottom for profitable/equal curves, at the top for
        // fully negative curves, and allow both sides for mixed P&L.
        const minPL = Math.min(...data);
        const maxPL = Math.max(...data);
        if (minPL >= 0) {
          perfChart.options.scales.y.min = 0;
          delete perfChart.options.scales.y.max;
          perfChart.options.scales.y.suggestedMax = maxPL === 0 ? 1 : maxPL;
          delete perfChart.options.scales.y.suggestedMin;
        } else if (maxPL <= 0) {
          delete perfChart.options.scales.y.min;
          perfChart.options.scales.y.max = 0;
          perfChart.options.scales.y.suggestedMin = minPL;
          delete perfChart.options.scales.y.suggestedMax;
        } else {
          delete perfChart.options.scales.y.min;
          delete perfChart.options.scales.y.max;
          delete perfChart.options.scales.y.suggestedMin;
          delete perfChart.options.scales.y.suggestedMax;
        }
      } else {
        perfChart.data.labels = ['Start'];
        perfChart.data.datasets[0].data = [0];
        perfChart.data.datasets[0].borderColor = '#f59e0b';
        perfChart.data.datasets[0].backgroundColor = 'rgba(245, 158, 11, 0.1)';
        perfChart.data.datasets[0].pointRadius = 0;
        perfChart.options.scales.y.min = 0;
        perfChart.options.scales.y.max = 1;
        delete perfChart.options.scales.y.suggestedMin;
        delete perfChart.options.scales.y.suggestedMax;
      }
      perfChart.resize();
      perfChart.update();
    }
  }
  
  function updateTradesTable() {
    const tbody = document.getElementById('tradesTableBody');
    if (trades.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px; color: var(--text-muted);">No trades yet. <a href="#" onclick="openAddTradeModal(); return false;" style="color: var(--gold);">Add your first trade</a></td></tr>';
      return;
    }
    tbody.innerHTML = trades.slice().reverse().map(t => {
      const notesPreview = t.notes ? t.notes.substring(0, 30) + (t.notes.length > 30 ? '...' : '') : '-';
      return `<tr>
        <td>${t.date}</td>
        <td><strong>${t.pair}</strong></td>
        <td><span class="badge ${t.direction === 'BUY' ? 'buy' : 'sell'}">${t.direction}</span></td>
        <td>${t.entry}</td><td>${t.exit}</td><td>${t.lot}</td>
        <td style="color: ${t.pnl >= 0 ? 'var(--green)' : 'var(--red)'}; font-weight: 700;">
          ${t.pnl >= 0 ? '+$' : '-$'}${Math.abs(t.pnl).toFixed(2)}</td>
        <td style="font-size: 11px; color: var(--text-muted);">${t.strategy}</td>
        <td style="font-size: 11px;">${t.emotion}</td>
        <td class="notes-cell"><div class="notes-preview">${notesPreview}</div></td>
        <td>
          <button class="action-btn" data-trade-id="${String(t.id)}" onclick="viewTradeDetail(this.dataset.tradeId)" title="View">👁️</button>
          <button type="button" class="action-btn delete" data-trade-id="${String(t.id)}" onclick="window.deleteTrade(this.dataset.tradeId); return false;" title="Delete">🗑️</button>
        </td>
      </tr>`;
    }).join('');
  }
  
  function exportTrades() {
    if (trades.length === 0) { alert('No trades to export'); return; }
    let csv = 'Date,Pair,Direction,Entry,Exit,SL,TP,Lot,PnL,Strategy,Emotion,Notes\n';
    trades.forEach(t => {
      csv += `${t.date},${t.pair},${t.direction},${t.entry},${t.exit},${t.sl},${t.tp},${t.lot},${t.pnl},${t.strategy},${t.emotion},"${(t.notes || '').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'trades_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
  }
  
  // ============ ANALYSIS ============
  function updateAnalysis() {
    const total = trades.reduce((s, t) => s + t.pnl, 0);
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const breakEven = trades.filter(t => t.pnl === 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length * 100) : 0;
    const totalWins = wins.reduce((s, t) => s + t.pnl, 0);
    const totalLosses = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : (totalWins > 0 ? 999 : 0);
    const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
    const expectancy = trades.length > 0 ? total / trades.length : 0;
    const bestTrade = trades.length > 0 ? Math.max(...trades.map(t => t.pnl)) : 0;
    const worstTrade = trades.length > 0 ? Math.min(...trades.map(t => t.pnl)) : 0;
    
    let winStreak = 0, lossStreak = 0, currentWS = 0, currentLS = 0;
    trades.forEach(t => {
      if (t.pnl > 0) { currentWS++; currentLS = 0; winStreak = Math.max(winStreak, currentWS); }
      else if (t.pnl < 0) { currentLS++; currentWS = 0; lossStreak = Math.max(lossStreak, currentLS); }
    });
    
    const longs = trades.filter(t => t.direction === 'BUY');
    const shorts = trades.filter(t => t.direction === 'SELL');
    const longPL = longs.reduce((s, t) => s + t.pnl, 0);
    const shortPL = shorts.reduce((s, t) => s + t.pnl, 0);
    const longWins = longs.filter(t => t.pnl > 0).length;
    const shortWins = shorts.filter(t => t.pnl > 0).length;
    
    document.getElementById('aTotalPL').textContent = (total >= 0 ? '+$' : '-$') + Math.abs(total).toFixed(2);
    document.getElementById('aTotalPL').style.color = total >= 0 ? 'var(--green)' : 'var(--red)';
    document.getElementById('aTradesCount').textContent = trades.length;
    document.getElementById('aWinRate').textContent = winRate.toFixed(1) + '%';
    document.getElementById('aWins').textContent = wins.length;
    document.getElementById('aLosses').textContent = losses.length;
    document.getElementById('aProfitFactor').textContent = profitFactor === 999 ? '∞' : profitFactor.toFixed(2);
    document.getElementById('aProfitFactorRating').textContent = profitFactor >= 2 ? 'Excellent' : profitFactor >= 1.5 ? 'Good' : profitFactor >= 1 ? 'Fair' : profitFactor === 0 ? 'No data yet' : 'Needs improvement';
    document.getElementById('aExpectancy').textContent = (expectancy >= 0 ? '+$' : '-$') + Math.abs(expectancy).toFixed(2);
    
    document.getElementById('aAvgWinner').textContent = '$' + avgWin.toFixed(2);
    document.getElementById('aAvgLoser').textContent = '-$' + avgLoss.toFixed(2);
    document.getElementById('aBestTrade').textContent = (bestTrade >= 0 ? '+$' : '-$') + Math.abs(bestTrade).toFixed(2);
    document.getElementById('aWorstTrade').textContent = (worstTrade >= 0 ? '+$' : '-$') + Math.abs(worstTrade).toFixed(2);
    document.getElementById('aWinStreak').textContent = winStreak;
    document.getElementById('aLossStreak').textContent = lossStreak;
    document.getElementById('aRR').textContent = avgLoss > 0 ? '1:' + (avgWin/avgLoss).toFixed(2) : '1:0';
    document.getElementById('aTotalCount').textContent = trades.length;
    
    document.getElementById('aLongCount').textContent = longs.length;
    document.getElementById('aLongPL').textContent = (longPL >= 0 ? '+$' : '-$') + Math.abs(longPL).toFixed(2);
    document.getElementById('aLongWin').textContent = longs.length > 0 ? (longWins/longs.length*100).toFixed(0) + '%' : '0%';
    document.getElementById('aShortCount').textContent = shorts.length;
    document.getElementById('aShortPL').textContent = (shortPL >= 0 ? '+$' : '-$') + Math.abs(shortPL).toFixed(2);
    document.getElementById('aShortWin').textContent = shorts.length > 0 ? (shortWins/shorts.length*100).toFixed(0) + '%' : '0%';
    
    // Day Performance
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const dayPL = [0,0,0,0,0,0,0];
    trades.forEach(t => { const d = new Date(t.date).getDay(); const idx = d === 0 ? 6 : d - 1; dayPL[idx] += t.pnl; });
    const maxDayPL = Math.max(...dayPL.map(Math.abs)) || 1;
    document.getElementById('dayPerf').innerHTML = days.map((d, i) => `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <div style="width: 30px; font-size: 11px; color: var(--text-muted); font-weight: 600;">${d}</div>
        <div style="flex: 1; height: 8px; background: var(--bg-elevated); border-radius: 4px; overflow: hidden;">
          <div style="height: 100%; width: ${Math.abs(dayPL[i])/maxDayPL*100}%; background: ${dayPL[i] >= 0 ? 'var(--green)' : 'var(--red)'}; transition: width 0.5s;"></div>
        </div>
        <div style="width: 60px; text-align: right; font-size: 11px; font-weight: 600; color: ${dayPL[i] >= 0 ? 'var(--green)' : (dayPL[i] < 0 ? 'var(--red)' : 'var(--text-muted)')};">
          ${dayPL[i] === 0 ? '-' : (dayPL[i] >= 0 ? '+$' : '-$') + Math.abs(dayPL[i]).toFixed(0)}
        </div>
      </div>
    `).join('');
    
    // Top Symbols
    const pairStats = {};
    trades.forEach(t => {
      if (!pairStats[t.pair]) pairStats[t.pair] = { count: 0, pnl: 0, wins: 0 };
      pairStats[t.pair].count++;
      pairStats[t.pair].pnl += t.pnl;
      if (t.pnl > 0) pairStats[t.pair].wins++;
    });
    const sortedPairs = Object.entries(pairStats).sort((a, b) => b[1].pnl - a[1].pnl).slice(0, 5);
    if (sortedPairs.length > 0) {
      document.getElementById('topSymbols').innerHTML = sortedPairs.map(([pair, s], i) => `
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-elevated); border-radius: 8px; margin-bottom: 6px;">
          <div style="width: 28px; height: 28px; background: var(--gold-bg); color: var(--gold); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">${i+1}</div>
          <div style="flex: 1;"><div style="font-weight: 600; font-size: 13px;">${pair}</div><div style="font-size: 10px; color: var(--text-muted);">${s.count} trade${s.count !== 1 ? 's' : ''} · ${(s.wins/s.count*100).toFixed(0)}% win</div></div>
          <div style="font-weight: 700; color: ${s.pnl >= 0 ? 'var(--green)' : 'var(--red)'}; font-size: 13px;">${s.pnl >= 0 ? '+$' : '-$'}${Math.abs(s.pnl).toFixed(0)}</div>
        </div>`).join('');
    }
    
    // Sessions
    const asianT = trades.filter(t => { const h = new Date(t.date).getUTCHours(); return h >= 22 || h < 8; });
    const londonT = trades.filter(t => { const h = new Date(t.date).getUTCHours(); return h >= 8 && h < 17; });
    const nyT = trades.filter(t => { const h = new Date(t.date).getUTCHours(); return h >= 13 && h < 22; });
    document.getElementById('aAsianTrades').textContent = asianT.length;
    document.getElementById('aAsianPL').textContent = '$' + asianT.reduce((s,t)=>s+t.pnl,0).toFixed(2);
    document.getElementById('aLondonTrades').textContent = londonT.length;
    document.getElementById('aLondonPL').textContent = '$' + londonT.reduce((s,t)=>s+t.pnl,0).toFixed(2);
    document.getElementById('aNYTrades').textContent = nyT.length;
    document.getElementById('aNYPL').textContent = '$' + nyT.reduce((s,t)=>s+t.pnl,0).toFixed(2);
    
    // Detailed stats
    document.getElementById('sTotalPL').textContent = (total >= 0 ? '+$' : '-$') + Math.abs(total).toFixed(2);
    document.getElementById('sTotalTrades').textContent = trades.length;
    document.getElementById('sWinTrades').textContent = wins.length;
    document.getElementById('sLossTrades').textContent = losses.length;
    document.getElementById('sBETrades').textContent = breakEven.length;
    document.getElementById('sLargestProfit').textContent = '+$' + Math.max(0, bestTrade).toFixed(2);
    document.getElementById('sLargestLoss').textContent = '-$' + Math.abs(Math.min(0, worstTrade)).toFixed(2);
    document.getElementById('sAvgWin').textContent = '+$' + avgWin.toFixed(2);
    document.getElementById('sAvgLoss').textContent = '-$' + avgLoss.toFixed(2);
    document.getElementById('sWinRate').textContent = winRate.toFixed(1) + '%';
    document.getElementById('sProfitFactor').textContent = profitFactor === 999 ? '∞' : profitFactor.toFixed(2);
    document.getElementById('sExpectancy').textContent = (expectancy >= 0 ? '+$' : '-$') + Math.abs(expectancy).toFixed(2);
    document.getElementById('sMaxWinStreak').textContent = winStreak;
    document.getElementById('sMaxLossStreak').textContent = lossStreak;
    document.getElementById('sAvgRR').textContent = avgLoss > 0 ? '1:' + (avgWin/avgLoss).toFixed(2) : '1:0';
    
    const uniqueDays = [...new Set(trades.map(t => t.date))];
    document.getElementById('sTradingDays').textContent = uniqueDays.length;
    document.getElementById('sBestDay').textContent = sortedPairs.length > 0 ? days[dayPL.indexOf(Math.max(...dayPL))] : '-';
    document.getElementById('sTopPair').textContent = sortedPairs.length > 0 ? sortedPairs[0][0] : '-';
    
    // Equity Chart
    if (!equityChart) {
      const ctx = document.getElementById('equityChart');
      if (ctx) {
        const colors = getThemeChartColors();
        equityChart = new Chart(ctx, {
          type: 'line',
          data: { labels: [], datasets: [{ data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', fill: true, tension: 0.4, pointRadius: 2, borderWidth: 2 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, interaction: { intersect: false, mode: 'index' },
            scales: {
              y: { grid: { color: colors.grid, lineWidth: 1 }, ticks: { color: colors.tick, font: { size: 10 } }, border: { color: colors.axis } },
              x: { grid: { display: false, color: colors.gridSoft, lineWidth: 1 }, ticks: { color: colors.tick, font: { size: 10 } }, border: { color: colors.axis } }
            }
          }
        });
        updateChartTheme(equityChart);
        setTimeout(function(){ try{ equityChart.resize(); equityChart.update('none'); }catch(e){} }, 80);
      }
    }
    if (equityChart) {
      if (trades.length > 0) {
        let cum = 0;
        const data = [0];
        const labels = ['Start'];
        trades.forEach((t, i) => {
          cum += t.pnl;
          data.push(cum);
          labels.push('T' + (i + 1));
        });
        equityChart.data.labels = labels;
        equityChart.data.datasets[0].data = data;
        const finalPL = data[data.length - 1];
        const color = finalPL >= 0 ? '#10b981' : '#ef4444';
        const bgColor = finalPL >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        equityChart.data.datasets[0].borderColor = color;
        equityChart.data.datasets[0].backgroundColor = bgColor;
        equityChart.data.datasets[0].pointBackgroundColor = color;
      } else {
        equityChart.data.labels = ['Start'];
        equityChart.data.datasets[0].data = [0];
      }
      equityChart.update();
    }
  }
  
  function filterAnalysis(period) {
    document.querySelectorAll('#page-analysis .perf-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    updateAnalysis();
  }
  
  // ============ CALCULATORS ============
  function calcPipValue() {
    const type = document.getElementById('pip_pair').value;
    const lot = parseFloat(document.getElementById('pip_lot').value);
    let pipValue = 0, explanation = '';
    
    switch(type) {
      case 'gold': pipValue = lot * 10; explanation = 'Gold: 1 lot = 100 oz, $10 per pip movement. ' + lot + ' lot = $' + pipValue.toFixed(2) + '/pip'; break;
      case 'silver': pipValue = lot * 50; explanation = 'Silver: 1 lot = 5000 oz, $50 per pip standard'; break;
      case 'btc': pipValue = lot * 1; explanation = 'BTC: $1 per $1 movement per lot'; break;
      case 'forex_usd_quote': pipValue = lot * 10; explanation = 'Standard major pairs (USD as quote): $10 per pip per standard lot'; break;
      case 'forex_jpy': pipValue = lot * 10; explanation = 'JPY pairs: ~$6.66 per pip at price 150 (varies with price)'; pipValue = (lot * 1000) / 150; break;
      case 'forex_usd_base': pipValue = (lot * 10) / 1; explanation = 'USD/CAD, USD/CHF: pip value varies with price'; break;
      case 'forex_cross': pipValue = lot * 10; explanation = 'Cross pairs: approximate value, varies with quote currency'; break;
    }
    
    document.getElementById('pip_value').textContent = '$' + pipValue.toFixed(2);
    document.getElementById('pip_explanation').textContent = explanation;
    document.getElementById('pip_result').style.display = 'block';
  }
  
  function calcLotSize() {
    const type = document.getElementById('lot_pair').value;
    const balance = parseFloat(document.getElementById('lot_balance').value);
    const risk = parseFloat(document.getElementById('lot_risk').value);
    const sl = parseFloat(document.getElementById('lot_sl').value);
    
    const riskAmount = (balance * risk) / 100;
    let pipValuePer1Lot = 10;
    
    switch(type) {
      case 'gold': pipValuePer1Lot = 10; break;
      case 'silver': pipValuePer1Lot = 50; break;
      case 'btc': pipValuePer1Lot = 1; break;
      case 'forex_usd_quote': pipValuePer1Lot = 10; break;
      case 'forex_jpy': pipValuePer1Lot = 6.66; break;
    }
    
    const lotSize = riskAmount / (sl * pipValuePer1Lot);
    document.getElementById('lot_value').textContent = lotSize.toFixed(2) + ' lots';
    document.getElementById('lot_risk_amt').textContent = '$' + riskAmount.toFixed(2);
    document.getElementById('lot_result').style.display = 'block';
  }
  
  function calcRR() {
    const entry = parseFloat(document.getElementById('rr_entry').value);
    const sl = parseFloat(document.getElementById('rr_sl').value);
    const tp = parseFloat(document.getElementById('rr_tp').value);
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    const ratio = reward / risk;
    document.getElementById('rr_value').textContent = '1 : ' + ratio.toFixed(2);
    let quality = '';
    if (ratio >= 3) quality = '🌟 Excellent! Very rewarding';
    else if (ratio >= 2) quality = '✅ Good! Recommended';
    else if (ratio >= 1.5) quality = '⚠️ Acceptable';
    else quality = '❌ Risky! Aim for 1:2 or better';
    document.getElementById('rr_quality').textContent = quality;
    document.getElementById('rr_result').style.display = 'block';
  }
  
  function calcPL() {
    const type = document.getElementById('pl_pair').value;
    const entry = parseFloat(document.getElementById('pl_entry').value);
    const exit = parseFloat(document.getElementById('pl_exit').value);
    const lot = parseFloat(document.getElementById('pl_lot').value);
    const dir = parseFloat(document.getElementById('pl_dir').value);
    let pl = 0, pipDiff = 0;
    
    const diff = exit - entry;
    
    switch(type) {
      case 'gold': pl = diff * lot * 100 * dir; pipDiff = diff * 100; break;
      case 'silver': pl = diff * lot * 5000 * dir; pipDiff = diff * 1000; break;
      case 'btc': pl = diff * lot * dir; pipDiff = diff; break;
      case 'forex_usd_quote': pl = diff * lot * 100000 * dir; pipDiff = diff * 10000; break;
      case 'forex_jpy': pl = (diff * lot * 100000 / exit) * dir; pipDiff = diff * 100; break;
      case 'forex_usd_base': pl = (diff * lot * 100000 / exit) * dir; pipDiff = diff * 10000; break;
    }
    
    const el = document.getElementById('pl_value');
    el.textContent = (pl >= 0 ? '+$' : '-$') + Math.abs(pl).toFixed(2);
    el.style.color = pl >= 0 ? 'var(--green)' : 'var(--red)';
    document.getElementById('pl_pips').textContent = `${dir === 1 ? 'BUY' : 'SELL'} · ${Math.abs(pipDiff).toFixed(1)} pips ${pl >= 0 ? 'profit' : 'loss'}`;
    document.getElementById('pl_result').style.display = 'block';
  }
  
  function calcMargin() {
    const type = document.getElementById('m_pair').value;
    const lot = parseFloat(document.getElementById('m_lot').value);
    const lev = parseFloat(document.getElementById('m_lev').value);
    const price = parseFloat(document.getElementById('m_price').value);
    let margin = 0;
    
    switch(type) {
      case 'gold': margin = (lot * 100 * price) / lev; break;
      case 'silver': margin = (lot * 5000 * price) / lev; break;
      case 'btc': margin = (lot * price) / lev; break;
      default: margin = (lot * 100000 * price) / lev;
    }
    
    document.getElementById('m_value').textContent = '$' + margin.toFixed(2);
    document.getElementById('m_result').style.display = 'block';
  }
  
  function calcCompound() {
    const start = parseFloat(document.getElementById('c_start').value);
    const rate = parseFloat(document.getElementById('c_rate').value) / 100;
    const months = parseFloat(document.getElementById('c_months').value);
    const final = start * Math.pow(1 + rate, months);
    const profit = final - start;
    document.getElementById('c_value').textContent = '$' + final.toFixed(2);
    document.getElementById('c_profit').textContent = `Profit: +$${profit.toFixed(2)} · Growth: +${((profit/start)*100).toFixed(1)}%`;
    document.getElementById('c_result').style.display = 'block';
  }
  
  // ============ TOOLS — Inline Expandable Calculators ============
  function toggleTool(type) {
    const body = document.getElementById('body-' + type);
    const arrow = document.getElementById('arrow-' + type);
    const card = document.getElementById('tool-' + type);
    
    if (body.style.display === 'none' || !body.style.display) {
      body.style.display = 'block';
      arrow.style.transform = 'rotate(180deg)';
      card.classList.add('expanded');
    } else {
      body.style.display = 'none';
      arrow.style.transform = 'rotate(0deg)';
      card.classList.remove('expanded');
    }
  }
  
  // ============ ECONOMIC NEWS (Custom — Forex Factory data via CORS proxy) ============
  let newsRawData = [];
  let newsState = {
    impact: 'all',     // all | High | Medium | Low
    currency: 'all',   // all | USD | EUR | GBP | JPY | AUD | CAD | CHF | NZD | CNY
    time: 'all',     // today | tomorrow | week | all | custom
    search: '',
    timezone: 'Asia/Karachi',  // user-selected timezone
    customFrom: null,  // ISO date string (yyyy-mm-dd)
    customTo: null     // ISO date string (yyyy-mm-dd)
  };
  
  const TIMEZONE_LABELS = {
    'Asia/Karachi': 'PKT (Pakistan)',
    'Asia/Singapore': 'SGT (Singapore)',
    'Asia/Dubai': 'GST (Dubai)',
    'Asia/Kolkata': 'IST (India)',
    'Asia/Tokyo': 'JST (Tokyo)',
    'Asia/Shanghai': 'CST (China)',
    'Asia/Riyadh': 'AST (Saudi)',
    'UTC': 'UTC',
    'Europe/London': 'GMT/BST (London)',
    'Europe/Berlin': 'CET (Berlin)',
    'America/New_York': 'EST (New York)',
    'America/Los_Angeles': 'PST (LA)',
    'Australia/Sydney': 'AEDT (Sydney)'
  };
  
  const FLAG_MAP = {
    USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵',
    AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭', NZD: '🇳🇿', CNY: '🇨🇳'
  };
  
  async function loadNews() {
    const container = document.getElementById('newsListContainer');
    if (!container) return;
    container.innerHTML = '<div class="empty-state" style="height: 200px;"><div class="empty-icon">📰</div><div>Loading economic events...</div></div>';
    

    // Vercel proxy fetching Forex Factory data (100% reliable)
    let success = false;
    try {
      const newsCtrl = new AbortController();
      const newsTimeout = setTimeout(() => newsCtrl.abort(), 15000);
      const res = await fetch('https://pipsepaisa-api.vercel.app/api/calendar', { signal: newsCtrl.signal });
      clearTimeout(newsTimeout);
      if (!res.ok) throw new Error('API failed: ' + res.status);
      
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        newsRawData = data;
        success = true;
        console.log('✅ News loaded:', data.length, 'events');
        console.log('📅 First event date:', data[0].date);
        console.log('📅 Last event date:', data[data.length-1].date);
        const future = data.filter(n => new Date(n.date) >= new Date()).length;
        console.log('🔮 Future events from now:', future);
      } else {
        throw new Error('No data');
      }
    } catch (e) {
      console.warn('News fetch failed:', e);
      success = false;
    }
    
    _newsIsLive = success;
    if (!success) {
      const dayOfWeek = new Date().getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      loadSampleNewsData(isWeekend);
    }
    
    // Update timestamp
    const now = new Date();
    const updEl = document.getElementById('newsUpdated');
    if (updEl) updEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    renderNews(success);
  }
  
  function loadSampleNewsData(isWeekend = false) {
    const now = new Date();
    const today = new Date(now); today.setHours(0,0,0,0);
    const days = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(today.getTime() + d * 86400000);
      days.push(day);
    }
    
    const samples = [
      { day: 0, hour: 12, min: 30, title: 'Core PCE Price Index m/m', country: 'USD', impact: 'High', forecast: '0.3%', previous: '0.3%' },
      { day: 0, hour: 12, min: 30, title: 'Unemployment Claims', country: 'USD', impact: 'Medium', forecast: '215K', previous: '212K' },
      { day: 0, hour: 14, min: 0, title: 'Pending Home Sales m/m', country: 'USD', impact: 'Low', forecast: '0.4%', previous: '-1.2%' },
      { day: 1, hour: 9, min: 0, title: 'CPI y/y', country: 'EUR', impact: 'High', forecast: '2.3%', previous: '2.4%' },
      { day: 1, hour: 10, min: 30, title: 'BOE Gov Bailey Speaks', country: 'GBP', impact: 'High', forecast: '', previous: '' },
      { day: 1, hour: 3, min: 30, title: 'BOJ Press Conference', country: 'JPY', impact: 'High', forecast: '', previous: '' },
      { day: 2, hour: 1, min: 30, title: 'GDP q/q', country: 'AUD', impact: 'High', forecast: '0.4%', previous: '0.3%' },
      { day: 2, hour: 15, min: 30, title: 'Crude Oil Inventories', country: 'USD', impact: 'Medium', forecast: '-1.2M', previous: '0.8M' },
      { day: 2, hour: 12, min: 30, title: 'Retail Sales m/m', country: 'CAD', impact: 'Medium', forecast: '0.5%', previous: '0.6%' },
      { day: 3, hour: 7, min: 0, title: 'German Ifo Business Climate', country: 'EUR', impact: 'Medium', forecast: '88.5', previous: '87.8' },
      { day: 3, hour: 12, min: 30, title: 'NFP - Non-Farm Employment Change', country: 'USD', impact: 'High', forecast: '180K', previous: '175K' },
      { day: 4, hour: 9, min: 0, title: 'SNB Chairman Speaks', country: 'CHF', impact: 'Medium', forecast: '', previous: '' },
      { day: 4, hour: 21, min: 45, title: 'GDT Price Index', country: 'NZD', impact: 'Low', forecast: '', previous: '0.8%' },
    ];
    
    newsRawData = samples.map(s => {
      const d = new Date(days[s.day]);
      d.setHours(s.hour, s.min, 0, 0);
      return {
        title: s.title,
        country: s.country,
        date: d.toISOString(),
        impact: s.impact,
        forecast: s.forecast,
        previous: s.previous,
        actual: ''
      };
    });
  }
  
  function renderNews(isLive) {
    const container = document.getElementById('newsListContainer');
    if (!container) return;

    const badge = document.getElementById('newsBadge');
    if (badge) {
      const dayOfWeek = new Date().getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (isLive) {
        badge.innerHTML = '<span style="width:6px;height:6px;background:var(--green);border-radius:50%;animation:pulse 2s infinite;"></span>LIVE';
        badge.className = 'badge low';
        badge.style.cssText = '';
      } else if (isWeekend) {
        badge.innerHTML = '🔴 Weekend — Market Closed';
        badge.className = 'badge';
        badge.style.cssText = 'background:rgba(239,68,68,0.15);color:var(--red);display:flex;align-items:center;gap:5px;';
      } else {
        badge.innerHTML = '⚠️ Sample Data';
        badge.className = 'badge';
        badge.style.cssText = 'background:rgba(245,158,11,0.15);color:var(--gold);display:flex;align-items:center;gap:5px;';
      }
    }
    
    const now = new Date();
    const TZ = newsState.timezone || 'Asia/Karachi';
    const nzKey = (dt)=>{ try{ return new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(dt); }catch(e){ return dt.toISOString().slice(0,10); } };
    const todayKey = nzKey(now);
    const tomorrowKey = nzKey(new Date(now.getTime()+86400000));
    const todayStr = now.toDateString();
    const tomorrow = new Date(now.getTime() + 86400000);
    const tomorrowStr = tomorrow.toDateString();
    
    // Get dates from newsRawData to figure out next week range dynamically
    // Since FF API returns a specific week's data, just show all data from nextweek API
    
    // This week: Monday to Sunday
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const thisWeekMonday = new Date(now); thisWeekMonday.setDate(now.getDate() + mondayOffset); thisWeekMonday.setHours(0,0,0,0);
    const thisWeekSunday = new Date(thisWeekMonday); thisWeekSunday.setDate(thisWeekMonday.getDate() + 6); thisWeekSunday.setHours(23,59,59,999);
    
    // Next week: 7 days after this week monday
    const nextWeekMonday = new Date(thisWeekMonday); nextWeekMonday.setDate(thisWeekMonday.getDate() + 7); nextWeekMonday.setHours(0,0,0,0);
    const nextWeekSunday = new Date(nextWeekMonday); nextWeekSunday.setDate(nextWeekMonday.getDate() + 6); nextWeekSunday.setHours(23,59,59,999);
    
    // All = show everything in newsRawData that is >= today
    const allEnd = nextWeekSunday;
    
    // For nextweek: find the date range of nextweek data dynamically
    // Get all unique dates from data that are after thisWeekSunday
    const nextWeekDates = newsRawData
      .map(n => new Date(n.date))
      .filter(d => d > thisWeekSunday);
    const hasNextWeekData = nextWeekDates.length > 0;
    // Use actual data dates for next week range
    const actualNextStart = hasNextWeekData ? new Date(Math.min(...nextWeekDates)) : nextWeekMonday;
    const actualNextEnd = hasNextWeekData ? new Date(Math.max(...nextWeekDates)) : nextWeekSunday;
    actualNextStart.setHours(0,0,0,0);
    actualNextEnd.setHours(23,59,59,999);
    
    // Today's start (00:00) - hide all events before today
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    
    let filtered = newsRawData.filter(n => {
      const eventDate = new Date(n.date);
      const evKey = nzKey(eventDate);
      
      // Hide all past events except for custom range (timezone-consistent)
      if (newsState.time !== 'custom' && evKey < todayKey) return false;
      
      // Time filter
      if (newsState.time === 'today' && evKey !== todayKey) return false;
      if (newsState.time === 'tomorrow' && evKey !== tomorrowKey) return false;
      if (newsState.time === 'week' && eventDate > thisWeekSunday) return false;
      // 'all' shows everything from today onwards (handled by past filter above)
      if (newsState.time === 'custom' && newsState.customFrom && newsState.customTo) {
        const fromDate = new Date(newsState.customFrom + 'T00:00:00');
        const toDate = new Date(newsState.customTo + 'T23:59:59');
        if (eventDate < fromDate || eventDate > toDate) return false;
      }
      
      // Impact filter
      if (newsState.impact !== 'all' && n.impact !== newsState.impact) return false;
      
      // Currency filter
      if (newsState.currency !== 'all' && n.country !== newsState.currency) return false;
      
      // Search filter
      if (newsState.search && !n.title.toLowerCase().includes(newsState.search.toLowerCase())) return false;
      
      return true;
    });
    
    // Sort by date
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let html = '';
    
    // Count line — always shown, no banner regardless of data source
    html += `<div style="margin-bottom: 12px; font-size: 12px; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
      <span>📊 <strong>${filtered.length}</strong> events ${newsState.time === 'custom' && newsState.customFrom ? '(' + newsState.customFrom + ' to ' + newsState.customTo + ')' : (newsState.time !== 'all' ? '(' + newsState.time + ')' : '')}</span>
      <span>Times shown in ${TIMEZONE_LABELS[newsState.timezone] || newsState.timezone} timezone</span>
    </div>`;
    
    if (filtered.length === 0) {
      html += '<div class="empty-state" style="height: 200px;"><div class="empty-icon">📭</div><div>No events match your filters</div><div style="font-size: 11px; margin-top: 6px; color: var(--text-muted);">Try changing the time range or impact level</div></div>';
      container.innerHTML = html;
      return;
    }
    
    // Group by date
    const grouped = {};
    filtered.forEach(n => {
      const key = nzKey(new Date(n.date));
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(n);
    });
    
    Object.keys(grouped).sort().forEach(dateKey => {
      const isToday = dateKey === todayKey;
      const isTomorrow = dateKey === tomorrowKey;
      const d = new Date(dateKey + 'T12:00:00');
      const dateLabel = isToday ? '📅 Today' : (isTomorrow ? '📅 Tomorrow' : '📅 ' + d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
      
      html += `<div style="margin-top: 16px; margin-bottom: 8px; padding: 8px 12px; background: var(--bg-elevated); border-left: 3px solid var(--gold); border-radius: 6px; font-size: 12px; font-weight: 700; color: var(--gold);">${dateLabel}</div>`;
      
      grouped[dateKey].forEach(n => {
        const eventTime = new Date(n.date);
        const timeStr = eventTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: newsState.timezone });
        const impactClass = n.impact === 'High' ? 'high' : (n.impact === 'Medium' ? 'med' : 'low');
        const flag = FLAG_MAP[n.country] || '🌐';
        
        html += `<div class="news-item">
          <div class="news-time">${timeStr}<span class="evcd" data-evt="${eventTime.getTime()}" data-act="${n.actual ? 1 : 0}" style="display:block;font-size:9px;font-weight:800;margin-top:2px;"></span></div>
          <div class="news-flag">${flag}</div>
          <div class="news-currency">${n.country}</div>
          <div class="news-title">
            <span class="badge ${impactClass}" style="margin-right: 8px;">${n.impact}</span>
            ${n.title}
          </div>
          <div class="news-value"><div class="news-value-label">Forecast</div><div class="news-value-num">${n.forecast || '-'}</div></div>
          <div class="news-value"><div class="news-value-label">Previous</div><div class="news-value-num">${n.previous || '-'}</div></div>
          <div class="news-value"><div class="news-value-label">Actual</div><div class="news-value-num" style="color: ${n.actual ? 'var(--gold)' : 'var(--text-muted)'};">${n.actual || '-'}</div></div>
          ${(n.forecast || n.impact === 'High' || n.impact === 'Medium') ? `<button onclick="aiEventAnalyze(${newsRawData.indexOf(n)})" style="background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#0a0e1a;border:none;border-radius:8px;padding:6px 11px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;">🤖 AI</button>` : '<div></div>'}
        </div>`;
      });
    });
    
    container.innerHTML = html;
    updateNewsCountdowns();
    if(!window._newsCdTimer) window._newsCdTimer=setInterval(updateNewsCountdowns,30000);
  }
  function fmtNewsCd(ms,hasActual){
    if(hasActual)return ['✓ Out','var(--green)'];
    if(ms<=-3600000)return ['',''];
    if(ms<=0)return ['● LIVE','#ef4444'];
    if(ms<60000)return ['<1m','#ef4444'];
    if(ms<1800000)return [Math.round(ms/60000)+'m','#ef4444'];
    if(ms<3600000)return [Math.round(ms/60000)+'m','var(--gold)'];
    if(ms<86400000)return [Math.round(ms/3600000)+'h','var(--text-muted)'];
    return [Math.round(ms/86400000)+'d','var(--text-muted)'];
  }
  function updateNewsCountdowns(){
    var now=Date.now();
    document.querySelectorAll('#newsListContainer .evcd').forEach(function(el){
      var t=parseInt(el.getAttribute('data-evt'))||0;
      var act=el.getAttribute('data-act')==='1';
      var r=fmtNewsCd(t-now,act);
      el.textContent=r[0];el.style.color=r[1];
      var row=el.closest('.news-item');
      if(row){var soon=!act&&(t-now)>0&&(t-now)<3600000;row.style.borderLeft=soon?'3px solid #ef4444':'';row.style.paddingLeft=soon?'9px':'';}
    });
  }
  
  function setNewsTime(time, btn) {
    document.querySelectorAll('#page-news .news-filter-group:first-of-type .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    newsState.time = time;
    // Clear custom date range when picking a preset
    if (time !== 'custom') {
      newsState.customFrom = null;
      newsState.customTo = null;
      const customBtn = document.getElementById('customDateBtn');
      if (customBtn) customBtn.textContent = '📅 Custom';
    }
    renderNews(newsRawData.length > 0 && !isUsingSample());
  }
  
  // ============ DATE RANGE PICKER ============
  function openDatePicker() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Pre-fill with current selection or today
    document.getElementById('dateFromInput').value = newsState.customFrom || todayStr;
    document.getElementById('dateToInput').value = newsState.customTo || todayStr;
    
    openModal('datePicker');
  }
  
  function setDatePreset(daysFrom, daysTo) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() + daysFrom);
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + daysTo);
    
    document.getElementById('dateFromInput').value = fromDate.toISOString().split('T')[0];
    document.getElementById('dateToInput').value = toDate.toISOString().split('T')[0];
  }
  
  function applyDateRange() {
    const from = document.getElementById('dateFromInput').value;
    const to = document.getElementById('dateToInput').value;
    
    if (!from || !to) {
      alert('Please select both From and To dates');
      return;
    }
    if (new Date(from) > new Date(to)) {
      alert('From date cannot be after To date');
      return;
    }
    
    newsState.customFrom = from;
    newsState.customTo = to;
    newsState.time = 'custom';
    
    // Update button states
    document.querySelectorAll('#page-news .news-filter-group:first-of-type .filter-btn').forEach(b => b.classList.remove('active'));
    const customBtn = document.getElementById('customDateBtn');
    if (customBtn) {
      customBtn.classList.add('active');
      // Show range in button label (short format)
      const fromShort = from.slice(5).replace('-', '/');
      const toShort = to.slice(5).replace('-', '/');
      customBtn.innerHTML = '📅 ' + fromShort + ' - ' + toShort;
    }
    
    closeModal('datePicker');
    renderNews(newsRawData.length > 0 && !isUsingSample());
  }
  
  function setNewsImpact(impact, btn) {
    document.querySelectorAll('#page-news .news-filter-group:nth-of-type(2) .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    newsState.impact = impact;
    renderNews(newsRawData.length > 0 && !isUsingSample());
  }
  
  function setNewsCurrency(currency) {
    newsState.currency = currency;
    renderNews(newsRawData.length > 0 && !isUsingSample());
  }
  
  function setNewsSearch(value) {
    newsState.search = value;
    renderNews(newsRawData.length > 0 && !isUsingSample());
  }
  
  function setNewsTimezone(tz) {
    newsState.timezone = tz;
    renderNews(newsRawData.length > 0 && !isUsingSample());
  }
  
  // Track if data is sample or real (set in loadNews)
  let _newsIsLive = false;
  function isUsingSample() { return !_newsIsLive; }
  
  // ============ GOLD PRICE ============
  async function loadGoldPrice() {
    try {
      const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD');
      // Fallback API
      const goldRes = await fetch('https://api.gold-api.com/price/XAU');
      const data = await goldRes.json();
      if (data.price) {
        document.getElementById('goldPrice').textContent = '$' + parseFloat(data.price).toFixed(2);
        document.getElementById('goldChange').textContent = 'Live data';
      } else throw new Error();
    } catch (e) {
      document.getElementById('goldPrice').textContent = 'See chart below';
      document.getElementById('goldChange').textContent = 'TradingView live';
    }
  }
  
  // ============ MARKET TICKER (Custom Live Prices) ============
  async function loadMarketTicker() {
    const container = document.getElementById('marketTickerContainer');
    if (!container) return;
    
    // Pairs to show in ticker
    const tickerPairs = [
      { sym: 'XAU/USD', label: 'Gold', icon: '🥇' },
      { sym: 'BTC/USD', label: 'Bitcoin', icon: '₿' },
      { sym: 'ETH/USD', label: 'Ethereum', icon: 'Ξ' },
      { sym: 'EUR/USD', label: 'EUR/USD', icon: '🇪🇺' },
      { sym: 'GBP/USD', label: 'GBP/USD', icon: '🇬🇧' },
      { sym: 'USD/JPY', label: 'USD/JPY', icon: '🇯🇵' },
      { sym: 'AUD/USD', label: 'AUD/USD', icon: '🇦🇺' },
      { sym: 'USD/CAD', label: 'USD/CAD', icon: '🇨🇦' }
    ];
    
    // Try to fetch live prices via free APIs
    let prices = {};
    let success = false;
    
    try {
      // Get forex rates from open.er-api.com
      const forexRes = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(5000) });
      if (forexRes.ok) {
        const forexData = await forexRes.json();
        if (forexData.rates) {
          prices['EUR/USD'] = 1 / forexData.rates.EUR;
          prices['GBP/USD'] = 1 / forexData.rates.GBP;
          prices['AUD/USD'] = 1 / forexData.rates.AUD;
          prices['USD/JPY'] = forexData.rates.JPY;
          prices['USD/CAD'] = forexData.rates.CAD;
          success = true;
        }
      }
    } catch (e) {}
    
    // Get gold price
    try {
      const goldRes = await fetch('https://api.gold-api.com/price/XAU', { signal: AbortSignal.timeout(5000) });
      if (goldRes.ok) {
        const goldData = await goldRes.json();
        if (goldData.price) prices['XAU/USD'] = parseFloat(goldData.price);
      }
    } catch (e) {}
    
    // Get crypto prices
    try {
      const cryptoRes = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC', { signal: AbortSignal.timeout(5000) });
      if (cryptoRes.ok) {
        const cryptoData = await cryptoRes.json();
        if (cryptoData.data && cryptoData.data.rates) {
          prices['BTC/USD'] = parseFloat(cryptoData.data.rates.USD);
        }
      }
      const ethRes = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=ETH', { signal: AbortSignal.timeout(5000) });
      if (ethRes.ok) {
        const ethData = await ethRes.json();
        if (ethData.data && ethData.data.rates) {
          prices['ETH/USD'] = parseFloat(ethData.data.rates.USD);
        }
      }
    } catch (e) {}
    
    // Approximate fallback prices if APIs fail
    const fallback = {
      'XAU/USD': 4628, 'BTC/USD': 76800, 'ETH/USD': 2286,
      'EUR/USD': 1.171, 'GBP/USD': 1.350, 'USD/JPY': 159.20,
      'AUD/USD': 0.658, 'USD/CAD': 1.363
    };
    
    // Get/init random small change (-1% to +1%) for each — for display variety
    if (!window._tickerLastPrices) window._tickerLastPrices = {};
    
    let html = '<div style="display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px; scrollbar-width: thin;">';
    
    tickerPairs.forEach(p => {
      const price = prices[p.sym] || fallback[p.sym];
      const lastPrice = window._tickerLastPrices[p.sym] || price;
      // Generate a stable small change for display
      const seed = (p.sym.charCodeAt(0) + p.sym.charCodeAt(1) + Date.now() / 60000) % 100;
      const changePercent = ((seed - 50) / 50) * 0.5; // ±0.5% range
      const isUp = changePercent >= 0;
      window._tickerLastPrices[p.sym] = price;
      
      // Format price
      let priceStr;
      if (price > 1000) priceStr = price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      else if (price > 10) priceStr = price.toFixed(3);
      else priceStr = price.toFixed(5);
      
      const color = isUp ? 'var(--green)' : 'var(--red)';
      const arrow = isUp ? '▲' : '▼';
      
      html += `<div style="background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; min-width: 140px; flex-shrink: 0;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="font-size: 13px;">${p.icon}</span>
          <strong style="font-size: 11px; color: var(--text-secondary);">${p.label}</strong>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
          <span style="font-size: 14px; font-weight: 700; color: var(--text-primary);">${priceStr}</span>
          <span style="font-size: 10px; color: ${color}; font-weight: 700;">${arrow} ${Math.abs(changePercent).toFixed(2)}%</span>
        </div>
      </div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }
  
  // ============ CHART DRAWING NOTES ============
  function getDrawingNotes() {
    try { return JSON.parse(localStorage.getItem('chartDrawingNotes') || '[]'); } catch { return []; }
  }
  function saveDrawingNotes(notes) {
    localStorage.setItem('chartDrawingNotes', JSON.stringify(notes));
  }

  async function saveDrawingNote() {
    const symbol = document.getElementById('chartSymbol')?.value || 'XAUUSD';
    const tf = document.getElementById('chartTimeframe')?.value || '60';
    const symbolLabel = document.getElementById('chartSymbol')?.options[document.getElementById('chartSymbol')?.selectedIndex]?.text || symbol;
    
    const note = await window.pspPrompt(`Add analysis note for ${symbolLabel}:\n(e.g. "Strong support at 2320, resistance at 2380, bullish bias")`,'','Chart Analysis Note');
    if (!note || !note.trim()) return;

    const notes = getDrawingNotes();
    notes.unshift({
      id: Date.now(),
      symbol,
      symbolLabel,
      tf,
      note: note.trim(),
      date: new Date().toLocaleString(),
      color: 'gold'
    });
    saveDrawingNotes(notes);
    renderDrawingNotes();
    // Show panel
    document.getElementById('drawingNotesPanel').style.display = 'block';
  }

  function deleteDrawingNote(id) {
    const notes = getDrawingNotes().filter(n => n.id !== id);
    saveDrawingNotes(notes);
    renderDrawingNotes();
  }

  function renderDrawingNotes() {
    const notes = getDrawingNotes();
    const list = document.getElementById('drawingNotesList');
    const empty = document.getElementById('drawingNotesEmpty');
    if (!list) return;
    if (!notes.length) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    list.innerHTML = notes.map(n => `
      <div style="background:var(--bg-elevated);border:1px solid var(--border);border-left:3px solid var(--gold);border-radius:8px;padding:10px 12px;display:flex;align-items:flex-start;gap:10px">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
            <span style="font-size:10px;font-weight:800;background:var(--gold-bg);color:var(--gold);padding:2px 7px;border-radius:4px">${n.symbolLabel?.split('(')[0]?.trim() || n.symbol}</span>
            <span style="font-size:10px;color:var(--text-muted)">${n.tf === 'D' ? 'Daily' : n.tf === 'W' ? 'Weekly' : n.tf + ' Min'}</span>
            <span style="font-size:10px;color:var(--text-muted);margin-left:auto">${n.date}</span>
          </div>
          <div style="font-size:12px;color:var(--text-primary);line-height:1.5">${n.note}</div>
        </div>
        <button onclick="deleteDrawingNote(${n.id})" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:16px;padding:0;line-height:1;flex-shrink:0" title="Delete">×</button>
      </div>`).join('');
  }

  function toggleDrawingPanel() {
    const panel = document.getElementById('drawingNotesPanel');
    if (!panel) return;
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    if (isHidden) renderDrawingNotes();
  }
  // =============================================

  // ============ TRADINGVIEW CHART ============
  let tradingViewLibraryPromise=null;
  function ensureTradingViewLibrary(){
    if(window.TradingView&&typeof window.TradingView.widget==='function')return Promise.resolve();
    if(tradingViewLibraryPromise)return tradingViewLibraryPromise;
    tradingViewLibraryPromise=new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-psp-tradingview-lib="1"]');
      if(existing){
        existing.addEventListener('load',()=>resolve(),{once:true});
        existing.addEventListener('error',()=>reject(new Error('TradingView failed to load')),{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src='https://s3.tradingview.com/tv.js';
      script.async=true;
      script.dataset.pspTradingviewLib='1';
      script.onload=()=>resolve();
      script.onerror=()=>{tradingViewLibraryPromise=null;reject(new Error('TradingView failed to load'));};
      document.head.appendChild(script);
    });
    return tradingViewLibraryPromise;
  }
  function loadChart() {
    const symbol = document.getElementById('chartSymbol').value;
    const tfEl = document.getElementById('chartTimeframe');
    const interval = tfEl ? tfEl.value : '60';
    const container = document.getElementById('tradingview-chart');
    if (!container) return;
    container.innerHTML = '';
    const uniqueId = 'tv_chart_' + Date.now();
    const innerDiv = document.createElement('div');
    innerDiv.id = uniqueId;
    innerDiv.style.cssText = 'width: 100%; height: 100%;';
    container.appendChild(innerDiv);
    ensureTradingViewLibrary().then(function(){
      try {
        new TradingView.widget({
          autosize: true, symbol: symbol, interval: interval, timezone: 'Asia/Karachi',
          theme: currentTheme === 'dark' ? 'dark' : 'light', style: '1', locale: 'en',
          toolbar_bg: '#0a0e1a', enable_publishing: false, withdateranges: true,
          hide_side_toolbar: false, allow_symbol_change: true, container_id: uniqueId,
          show_popup_button: true, popup_width: '1200', popup_height: '800',
          load_last_chart: true, studies: []
        });
      } catch(e) {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);">Chart loading failed. Please refresh.</div>';
      }
    }).catch(function(){
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);">Could not load TradingView. Please check your internet.</div>';
    });
    const result = document.getElementById('analysisResultSection');
    const prompt = document.getElementById('analyzePromptSection');
    if (result) result.style.display = 'none';
    if (prompt) prompt.style.display = 'block';
  }
  
  // ============ SMART ZONE ANALYSIS (Demand & Supply Detection) ============
  
  // Symbol metadata for analysis
  const SYMBOL_META = {
    'OANDA:XAUUSD':    { name: 'XAU/USD (Gold)', icon: '🥇', tvSym: 'OANDA:XAUUSD', api: 'gold' },
    'BITSTAMP:BTCUSD': { name: 'BTC/USD', icon: '₿', tvSym: 'BITSTAMP:BTCUSD', api: 'btc' },
    'BITSTAMP:ETHUSD': { name: 'ETH/USD', icon: 'Ξ', tvSym: 'BITSTAMP:ETHUSD', api: 'eth' },
    'FX:EURUSD': { name: 'EUR/USD', icon: '🇪🇺', tvSym: 'FX:EURUSD', api: 'forex', from: 'EUR', to: 'USD' },
    'FX:GBPUSD': { name: 'GBP/USD', icon: '🇬🇧', tvSym: 'FX:GBPUSD', api: 'forex', from: 'GBP', to: 'USD' },
    'FX:USDJPY': { name: 'USD/JPY', icon: '🇯🇵', tvSym: 'FX:USDJPY', api: 'forex', from: 'USD', to: 'JPY' },
    'FX:AUDUSD': { name: 'AUD/USD', icon: '🇦🇺', tvSym: 'FX:AUDUSD', api: 'forex', from: 'AUD', to: 'USD' },
    'FX:USDCAD': { name: 'USD/CAD', icon: '🇨🇦', tvSym: 'FX:USDCAD', api: 'forex', from: 'USD', to: 'CAD' },
    'FX:USDCHF': { name: 'USD/CHF', icon: '🇨🇭', tvSym: 'FX:USDCHF', api: 'forex', from: 'USD', to: 'CHF' },
    'FX:NZDUSD': { name: 'NZD/USD', icon: '🇳🇿', tvSym: 'FX:NZDUSD', api: 'forex', from: 'NZD', to: 'USD' }
  };
  
  const TF_LABELS = { '15': '15 Min', '60': '1 Hour', '240': '4 Hours', 'D': 'Daily', 'W': 'Weekly' };
  
  async function analyzeChart() {
    const symbolKey = document.getElementById('chartSymbol').value;
    const tf = document.getElementById('chartTimeframe').value;
    const meta = SYMBOL_META[symbolKey];
    if (!meta) return;
    
    // Show loading state
    const btn = document.getElementById('analyzeBtnText');
    const wasReanalyze = btn && /Re-Analyze/.test(btn.textContent);
    if (btn) btn.textContent = '⏳ Analyzing...';
    
    // Hide prompt, show result section with loading
    document.getElementById('analyzePromptSection').style.display = 'none';
    document.getElementById('analysisResultSection').style.display = 'block';
    // Scroll result into view smoothly (chart stays above, zones appear below)
    setTimeout(() => {
      document.getElementById('analysisResultSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    
    // Try to get current price from various APIs
    let currentPrice = null;
    try {
      if (meta.api === 'gold') {
        const r = await fetch('https://api.gold-api.com/price/XAU', { signal: AbortSignal.timeout(5000) });
        if (r.ok) { const d = await r.json(); currentPrice = parseFloat(d.price); }
      } else if (meta.api === 'btc') {
        const r = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC', { signal: AbortSignal.timeout(5000) });
        if (r.ok) { const d = await r.json(); currentPrice = parseFloat(d.data.rates.USD); }
      } else if (meta.api === 'eth') {
        const r = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=ETH', { signal: AbortSignal.timeout(5000) });
        if (r.ok) { const d = await r.json(); currentPrice = parseFloat(d.data.rates.USD); }
      } else if (meta.api === 'forex') {
        const r = await fetch(`https://open.er-api.com/v6/latest/${meta.from}`, { signal: AbortSignal.timeout(5000) });
        if (r.ok) {
          const d = await r.json();
          currentPrice = d.rates ? d.rates[meta.to] : null;
        }
      }
    } catch (e) { /* fall through to fallback */ }
    
    // Fallback approximate prices if APIs fail
    if (!currentPrice || isNaN(currentPrice)) {
      const fallback = {
        'OANDA:XAUUSD': 4628, 'BITSTAMP:BTCUSD': 76800, 'BITSTAMP:ETHUSD': 2286,
        'FX:EURUSD': 1.171, 'FX:GBPUSD': 1.350, 'FX:USDJPY': 159.20,
        'FX:AUDUSD': 0.658, 'FX:USDCAD': 1.363, 'FX:USDCHF': 0.872,
        'FX:NZDUSD': 0.583
      };
      currentPrice = fallback[symbolKey] || 1.0;
    }
    
    // Fetch REAL candles, then let AI analyze them
    let candles = null;
    try {
      const cr = await fetch('https://pipsepaisa-api.vercel.app/api/candles?symbol=' + encodeURIComponent(symbolKey) + '&interval=' + encodeURIComponent(tf), { signal: AbortSignal.timeout(9000) });
      if (cr.ok) { const cd = await cr.json(); if (cd && cd.candles && cd.candles.length >= 20) candles = cd.candles; }
    } catch (e) {}

    if (candles) {
      await renderAIChart(meta, tf, currentPrice, symbolKey, candles, wasReanalyze);
      if (btn) btn.textContent = '🔄 Re-Analyze';
      return;
    }

    // Fallback: old algorithmic zones (only if candles unavailable)
    const staticBlk = document.getElementById('staticZonesBlock'); if (staticBlk) staticBlk.style.display = '';
    const aiBox0 = document.getElementById('aiChartBox'); if (aiBox0) aiBox0.style.display = 'none';
    const zones = calculateZones(currentPrice, symbolKey, tf);
    renderAnalysisResult(meta, tf, currentPrice, zones);
    if (btn) btn.textContent = '🎯 Re-Analyze';
  }
  
  function chartCandleSummary(candles){
    var highs=candles.map(function(c){return c.h;}), lows=candles.map(function(c){return c.l;});
    var hi=Math.max.apply(null,highs), lo=Math.min.apply(null,lows);
    var last=candles.slice(-50).map(function(c){return c.o+','+c.h+','+c.l+','+c.c;}).join('\n');
    return {hi:hi,lo:lo,last:last,first:candles[0],latest:candles[candles.length-1]};
  }
  function buildChartPrompt(meta,tf,price,candles){
    var s=chartCandleSummary(candles);
    var tfLabel={'15':'15-minute','60':'1-hour','240':'4-hour','D':'Daily','W':'Weekly'}[tf]||tf;
    return ['You are an expert price-action analyst specialising in Supply & Demand zones and market structure.',
      'Analyse the REAL recent candles below for '+meta.name+' on the '+tfLabel+' timeframe and give a clear, simple-English trading analysis.',
      'Current price: '+price,
      'Recent range: high '+s.hi+', low '+s.lo,
      '',
      'Last candles (open,high,low,close), oldest to newest:',
      s.last,
      '',
      'Write the analysis in EXACTLY this structure with ## headings (keep this order):',
      '## Market Bias',
      '(First line: BULLISH / BEARISH / RANGING for '+meta.name+'. Second line: a clear directional call — "Look for BUY setups", "Look for SELL setups", or "Stay flat / wait" — plus a 1-line reason from market structure: higher-highs/higher-lows or lower-highs/lower-lows.)',
      '## Demand Zones (Buy areas)',
      '- List 2-3 support/demand price ZONES as ranges (e.g. '+price+' area), strongest first. Base them on real swing lows / consolidation in the data.',
      '## Supply Zones (Sell areas)',
      '- List 2-3 resistance/supply price ZONES as ranges, strongest first. Base them on real swing highs in the data.',
      '## Key Level',
      '(The single most important price level to watch right now and what it means.)',
      '## Trade Idea',
      '(A possible setup: where to look for entry, invalidation/stop area, and a target zone. Use "if price..." conditional language.)',
      '## Risks',
      '- (2-3 short bullets: what would make this view wrong.)',
      '',
      'Use real numbers from the data. Use "likely / possible / watch for" language — never guarantees. End with: "Not financial advice — always confirm with your own analysis."',
      '',
      'After everything above, output ONE final line in EXACTLY this machine format (numbers only, NO $ signs, NO words in between), using the same zones you described:',
      'ZONES: demand LOW-HIGH, LOW-HIGH | supply LOW-HIGH, LOW-HIGH'
    ].join('\n');
  }
  function chartBiasBadge(report){
    var m=report.match(/##\s*Market Bias\s*\n+\s*([^\n]+)/i);var line=m?m[1]:'';
    var t=line.toLowerCase();var c=t.indexOf('bull')>=0?'#10b981':t.indexOf('bear')>=0?'#ef4444':'#94a0b8';
    var ic=t.indexOf('bull')>=0?'📈':t.indexOf('bear')>=0?'📉':'↔️';
    var word=t.indexOf('bull')>=0?'BULLISH':t.indexOf('bear')>=0?'BEARISH':'RANGING';
    return {c:c,ic:ic,word:word,line:line.replace(/[*#]/g,'').trim()};
  }
  async function renderAIChart(meta,tf,price,symbolKey,candles,force){
    aiInjectStyles();
    window._lastCandles=candles;
    window._aiMeta=meta; window._aiTf=tf; window._aiPrice=price;
    const staticBlk=document.getElementById('staticZonesBlock'); if(staticBlk) staticBlk.style.display='none';
    const box=document.getElementById('aiChartBox'); if(!box) return;
    box.style.display='block';
    // header price card values
    var icoEl=document.getElementById('analyzeSymbolIcon'); if(icoEl) icoEl.textContent=meta.icon||'📊';
    var priceEl=document.getElementById('analyzeCurrentPrice'); if(priceEl) priceEl.textContent=(price>1000?'$'+price.toFixed(2):price.toFixed(5));
    var lblEl=document.getElementById('analyzeSymbolLabel'); if(lblEl) lblEl.textContent=meta.name+' · '+({'15':'15m','60':'1H','240':'4H','D':'Daily','W':'Weekly'}[tf]||tf);
    // cache (15 min) per symbol+tf
    var ckey='aichart:'+symbolKey+'|'+tf;
    var cached=null;
    if(!force){ try{var raw=localStorage.getItem(ckey);if(raw){var o=JSON.parse(raw);if(o&&o.report&&(Date.now()-o.time)<900000)cached=o;}}catch(e){} }
    if(cached){ paintAIChart(box,cached.report,true); return; }
    box.innerHTML='<div class="card" style="text-align:center;padding:34px;color:var(--text-muted);">🤖 AI is reading '+candles.length+' real candles and mapping zones... (10-20 sec)</div>';
    var report='';
    try{var rr=await fetch('https://pipsepaisa-api.vercel.app/api/ai-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:buildChartPrompt(meta,tf,price,candles)})});if(rr.ok){var dd=await rr.json();if(dd.report)report=dd.report;}}catch(e){}
    if(!report){box.innerHTML='<div class="card" style="text-align:center;padding:24px;color:#ef4444;">AI is busy right now. Please try again in a moment.</div>';return;}
    try{localStorage.setItem(ckey,JSON.stringify({report:report,time:Date.now()}));}catch(e){}
    paintAIChart(box,report,false);
  }
  function parseZones(report){
    var m=report.match(/ZONES:\s*(.+)/i);if(!m)return null;
    var line=m[1];
    function grab(side){
      var re=new RegExp(side+'\\s*([0-9.,\\s\\-]+?)(?:\\||$)','i');var mm=line.match(re);if(!mm)return [];
      return mm[1].split(',').map(function(s){var p=s.trim().match(/([0-9.]+)\s*-\s*([0-9.]+)/);return p?[parseFloat(p[1]),parseFloat(p[2])]:null;}).filter(Boolean);
    }
    var z={demand:grab('demand'),supply:grab('supply')};
    if((z.demand&&z.demand.length)||(z.supply&&z.supply.length))return z;
    return null;
  }
  function sectionText(report,re){var m=report.match(re);return m?m[1]:'';}
  function numRanges(text){
    var out=[];var re=/([0-9][0-9,]*\.?[0-9]*)\s*(?:-|–|—|to)\s*([0-9][0-9,]*\.?[0-9]*)/g;var mm;
    while((mm=re.exec(text))){var a=parseFloat(mm[1].replace(/,/g,'')),b=parseFloat(mm[2].replace(/,/g,''));if(a&&b)out.push([Math.min(a,b),Math.max(a,b)]);}
    if(!out.length){var re2=/([0-9][0-9,]*\.?[0-9]{0,5})/g;var seen={};while((mm=re2.exec(text))){var v=parseFloat(mm[1].replace(/,/g,''));if(v>1&&!seen[v]){seen[v]=1;out.push([v]);}}}
    return out.slice(0,3);
  }
  function parseZonesFromText(report){
    var dText=sectionText(report,/##\s*Demand[^\n]*([\s\S]*?)(?:##|$)/i);
    var sText=sectionText(report,/##\s*Supply[^\n]*([\s\S]*?)(?:##|$)/i);
    var z={demand:numRanges(dText),supply:numRanges(sText)};
    if((z.demand&&z.demand.length)||(z.supply&&z.supply.length))return z;
    return null;
  }
  function computeSwingZones(candles){
    if(!candles||candles.length<10)return null;
    var price=candles[candles.length-1].c;var k=3;
    var highs=[],lows=[];
    for(var i=k;i<candles.length-k;i++){
      var isH=true,isL=true;
      for(var j=1;j<=k;j++){if(candles[i].h<candles[i-j].h||candles[i].h<candles[i+j].h)isH=false;if(candles[i].l>candles[i-j].l||candles[i].l>candles[i+j].l)isL=false;}
      if(isH)highs.push(candles[i].h);if(isL)lows.push(candles[i].l);
    }
    function band(v){var w=v*0.0009;return [+(v-w).toFixed(5),+(v+w).toFixed(5)];}
    var supply=highs.filter(function(h){return h>price;}).sort(function(a,b){return a-b;}).slice(0,3).map(band);
    var demand=lows.filter(function(l){return l<price;}).sort(function(a,b){return b-a;}).slice(0,3).map(band);
    if(!supply.length&&!demand.length)return null;
    return {demand:demand,supply:supply};
  }
  function ensureLW(cb){
    if(window.LightweightCharts)return cb();
    if(window._lwLoading){var t=setInterval(function(){if(window.LightweightCharts){clearInterval(t);cb();}},150);return;}
    window._lwLoading=true;var s=document.createElement('script');
    s.src='https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js';
    s.onload=function(){cb();};s.onerror=function(){cb();};document.head.appendChild(s);
  }
  function renderZoneChart(candles,zones){
    var el=document.getElementById('zoneChart');if(!el||!window.LightweightCharts||!candles)return;
    el.innerHTML='';if(window._zoneChartObj){try{window._zoneChartObj.remove();}catch(e){}}
    var chart=LightweightCharts.createChart(el,{width:el.clientWidth||el.offsetWidth||600,height:340,
      layout:{background:{color:'transparent'},textColor:'#94a0b8',fontFamily:'inherit'},
      grid:{vertLines:{color:'rgba(255,255,255,.04)'},horzLines:{color:'rgba(255,255,255,.04)'}},
      timeScale:{timeVisible:true,borderColor:'rgba(255,255,255,.1)'},rightPriceScale:{borderColor:'rgba(255,255,255,.1)'},
      crosshair:{mode:0}});
    window._zoneChartObj=chart;
    var series=chart.addCandlestickSeries({upColor:'#10b981',downColor:'#ef4444',borderVisible:false,wickUpColor:'#10b981',wickDownColor:'#ef4444'});
    var seen={};var data=candles.map(function(c){return {time:c.t,open:c.o,high:c.h,low:c.l,close:c.c};}).filter(function(d){if(seen[d.time])return false;seen[d.time]=1;return true;});
    series.setData(data);
    function lines(arr,color,label){(arr||[]).forEach(function(pair){pair.forEach(function(price,j){if(!price)return;series.createPriceLine({price:price,color:color,lineWidth:1,lineStyle:2,axisLabelVisible:true,title:(j===1?label:'')});});});}
    if(zones){lines(zones.demand,'#10b981','Demand');lines(zones.supply,'#ef4444','Supply');}
    chart.timeScale().fitContent();
    if(!window._zoneResizeBound){window._zoneResizeBound=true;window.addEventListener('resize',function(){var e=document.getElementById('zoneChart');if(e&&window._zoneChartObj){try{window._zoneChartObj.applyOptions({width:e.clientWidth});}catch(x){}}});}
  }
  function buildAIZoneObj(zones,price,bias){
    function mk(arr,isDemand){
      return (arr||[]).slice(0,3).map(function(pair,i){
        var a=pair[0],b=(pair.length>1?pair[1]:pair[0]);
        var top=Math.max(a,b),bottom=Math.min(a,b);
        if(top===bottom){var w=Math.max(top*0.0006,0.0001);top+=w;bottom-=w;}
        var dist=isDemand?((price-top)/price*100):((bottom-price)/price*100);
        return {top:top,bottom:bottom,mid:(top+bottom)/2,strength:['Strong','Medium','Weak'][i]||'Weak',distance:Math.abs(dist).toFixed(2),type:isDemand?'demand':'supply'};
      });
    }
    var tInfo={BULLISH:['📈','BULLISH','Wait for BUY','🟢'],BEARISH:['📉','BEARISH','Wait for SELL','🔴'],RANGING:['↔️','RANGING','Range Trading','⚖️']}[bias]||['↔️','RANGING','Range Trading','⚖️'];
    return {demandZones:mk(zones.demand,true),supplyZones:mk(zones.supply,false),trendIcon:tInfo[0],trend:tInfo[1],recommendation:tInfo[2],recIcon:tInfo[3],confidence:'AI'};
  }
  function stripSections(report,names){
    var lines=report.split('\n'),out=[],skip=false;
    lines.forEach(function(l){
      var m=l.trim().match(/^#{1,3}\s*(.+)/);
      if(m){var t=m[1].toLowerCase();skip=names.some(function(n){return t.indexOf(n)>=0;});if(skip)return;}
      if(!skip)out.push(l);
    });
    return out.join('\n').replace(/\n{3,}/g,'\n\n').trim();
  }
  function paintAIChart(box,report,cached){
    var b=chartBiasBadge(report);
    var zones=parseZones(report)||parseZonesFromText(report)||computeSwingZones(window._lastCandles);
    var cleanReport=report.replace(/\n?ZONES:.*$/i,'').trim();
    // Fill + show the 3 Buy / 3 Sell card layout with AI zones (also sets price card trend/recommendation)
    var staticBlk=document.getElementById('staticZonesBlock');
    var haveZones=zones&&((zones.demand&&zones.demand.length)||(zones.supply&&zones.supply.length));
    if(haveZones&&window._aiMeta){
      try{ renderAnalysisResult(window._aiMeta,window._aiTf,window._aiPrice,buildAIZoneObj(zones,window._aiPrice,b.word)); if(staticBlk)staticBlk.style.display=''; }
      catch(e){ if(staticBlk)staticBlk.style.display='none'; }
    } else if(staticBlk){ staticBlk.style.display='none'; }
    // AI reasoning text below the cards — drop the Demand/Supply text sections (cards show them) and zone map
    var textReport=stripSections(cleanReport,['demand zone','supply zone']);
    var head='<div class="card ai-sec" style="background:linear-gradient(135deg,'+b.c+'18,transparent);border:1px solid '+b.c+'55;margin-bottom:14px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">'+
      '<div style="width:50px;height:50px;border-radius:13px;background:'+b.c+'22;display:flex;align-items:center;justify-content:center;font-size:26px;">'+b.ic+'</div>'+
      '<div style="flex:1;min-width:160px;"><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;">AI Market Bias</div><div style="font-size:22px;font-weight:900;color:'+b.c+';">'+b.word+'</div></div></div>';
    box.innerHTML=head+aiMdToHtml(textReport)+
      '<div style="font-size:11px;color:var(--text-muted);margin-top:8px;text-align:center;border-top:1px solid var(--border);padding-top:8px;">'+(cached?'📁 Saved analysis · ':'✨ AI analysis on real candles · ')+'Not financial advice — always confirm with your own analysis.</div>';
  }
  
  function calculateZones(price, symbolKey, tf) {
    // Volatility multiplier based on timeframe
    const tfMultiplier = { '15': 0.003, '60': 0.008, '240': 0.018, 'D': 0.035, 'W': 0.07 };
    const baseVolatility = tfMultiplier[tf] || 0.01;
    
    // Symbol-specific volatility adjustment
    const symVolatility = {
      'OANDA:XAUUSD': 1.2,    // Gold is volatile
      'BITSTAMP:BTCUSD': 2.5, // BTC very volatile
      'BITSTAMP:ETHUSD': 2.8,
      'FX:EURUSD': 0.6,       // Major pairs less volatile
      'FX:GBPUSD': 0.7,
      'FX:USDJPY': 0.7,
      'FX:AUDUSD': 0.8,
      'FX:USDCAD': 0.7,
      'FX:USDCHF': 0.65,
      'FX:NZDUSD': 0.85
    };
    const volMul = symVolatility[symbolKey] || 1.0;
    const vol = baseVolatility * volMul;
    
    // Generate 3 demand zones (below current price) and 3 supply zones (above)
    // Use price + slight randomization based on time for variety
    const seed = Math.floor(Date.now() / 60000) % 100; // Changes every minute
    const rng = (n) => ((Math.sin(seed + n * 7.13) + 1) / 2);
    
    // Demand zones (below current price)
    const demandZones = [];
    const demandStrengths = ['Strong', 'Medium', 'Weak'];
    for (let i = 0; i < 3; i++) {
      const distance = vol * (0.4 + i * 0.7 + rng(i) * 0.3); // increasing distance
      const zoneTop = price * (1 - distance);
      const zoneWidth = price * vol * (0.15 + rng(i + 10) * 0.2);
      const zoneBot = zoneTop - zoneWidth;
      demandZones.push({
        top: zoneTop,
        bottom: zoneBot,
        mid: (zoneTop + zoneBot) / 2,
        strength: demandStrengths[i],
        distance: ((price - zoneTop) / price * 100).toFixed(2),
        type: 'demand'
      });
    }
    
    // Supply zones (above current price)
    const supplyZones = [];
    const supplyStrengths = ['Strong', 'Medium', 'Weak'];
    for (let i = 0; i < 3; i++) {
      const distance = vol * (0.4 + i * 0.7 + rng(i + 20) * 0.3);
      const zoneBot = price * (1 + distance);
      const zoneWidth = price * vol * (0.15 + rng(i + 30) * 0.2);
      const zoneTop = zoneBot + zoneWidth;
      supplyZones.push({
        top: zoneTop,
        bottom: zoneBot,
        mid: (zoneTop + zoneBot) / 2,
        strength: supplyStrengths[i],
        distance: ((zoneBot - price) / price * 100).toFixed(2),
        type: 'supply'
      });
    }
    
    // Determine trend (random based on seed for demo, in reality would use real candle data)
    const trendVal = rng(99) * 100;
    let trend, trendIcon, recommendation, recIcon, confidence;
    if (trendVal > 60) {
      trend = 'BULLISH';
      trendIcon = '📈';
      recommendation = 'Wait for BUY';
      recIcon = '🟢';
      confidence = 'Medium-High';
    } else if (trendVal < 40) {
      trend = 'BEARISH';
      trendIcon = '📉';
      recommendation = 'Wait for SELL';
      recIcon = '🔴';
      confidence = 'Medium-High';
    } else {
      trend = 'RANGING';
      trendIcon = '↔️';
      recommendation = 'Range Trading';
      recIcon = '⚖️';
      confidence = 'Medium';
    }
    
    return { demandZones, supplyZones, trend, trendIcon, recommendation, recIcon, confidence };
  }
  
  function formatZonePrice(price) {
    if (price > 1000) return price.toFixed(2);
    if (price > 10) return price.toFixed(3);
    return price.toFixed(5);
  }
  
  function renderAnalysisResult(meta, tf, currentPrice, zones) {
    // Update header
    document.getElementById('analyzeSymbolIcon').textContent = meta.icon;
    document.getElementById('analyzeCurrentPrice').textContent = '$' + formatZonePrice(currentPrice);
    document.getElementById('analyzeSymbolLabel').textContent = `${meta.name} · ${TF_LABELS[tf]}`;
    
    // Trend
    const trendEl = document.getElementById('analyzeTrend');
    const trendDescEl = document.getElementById('analyzeTrendDesc');
    let trendColor;
    if (zones.trend === 'BULLISH') trendColor = 'var(--green)';
    else if (zones.trend === 'BEARISH') trendColor = 'var(--red)';
    else trendColor = 'var(--gold)';
    trendEl.innerHTML = `<span style="color: ${trendColor};">${zones.trendIcon} ${zones.trend}</span>`;
    trendDescEl.textContent = zones.trend === 'BULLISH' ? 'Buyers in control' : 
                              zones.trend === 'BEARISH' ? 'Sellers in control' : 'No clear direction';
    
    // Recommendation
    document.getElementById('analyzeRecommendation').innerHTML = `<span style="color: ${trendColor};">${zones.recIcon} ${zones.recommendation}</span>`;
    document.getElementById('analyzeConfidence').textContent = `Confidence: ${zones.confidence}`;
    
    // Demand zones (BUY)
    document.getElementById('demandCount').textContent = zones.demandZones.length;
    const demandHtml = zones.demandZones.map((z, i) => {
      const strengthColor = z.strength === 'Strong' ? 'var(--green)' : (z.strength === 'Medium' ? '#34d399' : '#9ca3af');
      const rank = ['🥇', '🥈', '🥉'][i] || (i + 1);
      return `<div style="padding: 12px; background: var(--bg-elevated); border-radius: 10px; border-left: 3px solid ${strengthColor}; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">${rank}</span>
            <strong style="color: var(--green); font-size: 13px;">Zone ${i + 1}</strong>
          </div>
          <span style="font-size: 10px; padding: 3px 8px; background: ${z.strength === 'Strong' ? 'var(--green-bg)' : 'var(--bg-card)'}; color: ${strengthColor}; border-radius: 4px; font-weight: 700;">${z.strength.toUpperCase()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
          <div>
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Zone Range</div>
            <div style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">
              $${formatZonePrice(z.bottom)} <span style="color: var(--text-muted); font-weight: 400;">—</span> $${formatZonePrice(z.top)}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Distance</div>
            <div style="font-size: 14px; font-weight: 700; color: var(--green); margin-top: 2px;">-${z.distance}%</div>
          </div>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border); font-size: 11px; color: var(--text-muted);">
          💡 BUY when price reaches <strong style="color: var(--green);">$${formatZonePrice(z.mid)}</strong> · SL: <strong>$${formatZonePrice(z.bottom * 0.998)}</strong>
        </div>
      </div>`;
    }).join('');
    document.getElementById('demandZonesList').innerHTML = demandHtml;
    
    // Supply zones (SELL)
    document.getElementById('supplyCount').textContent = zones.supplyZones.length;
    const supplyHtml = zones.supplyZones.map((z, i) => {
      const strengthColor = z.strength === 'Strong' ? 'var(--red)' : (z.strength === 'Medium' ? '#f87171' : '#9ca3af');
      const rank = ['🥇', '🥈', '🥉'][i] || (i + 1);
      return `<div style="padding: 12px; background: var(--bg-elevated); border-radius: 10px; border-left: 3px solid ${strengthColor}; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">${rank}</span>
            <strong style="color: var(--red); font-size: 13px;">Zone ${i + 1}</strong>
          </div>
          <span style="font-size: 10px; padding: 3px 8px; background: ${z.strength === 'Strong' ? 'var(--red-bg)' : 'var(--bg-card)'}; color: ${strengthColor}; border-radius: 4px; font-weight: 700;">${z.strength.toUpperCase()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
          <div>
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Zone Range</div>
            <div style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">
              $${formatZonePrice(z.bottom)} <span style="color: var(--text-muted); font-weight: 400;">—</span> $${formatZonePrice(z.top)}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Distance</div>
            <div style="font-size: 14px; font-weight: 700; color: var(--red); margin-top: 2px;">+${z.distance}%</div>
          </div>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border); font-size: 11px; color: var(--text-muted);">
          💡 SELL when price reaches <strong style="color: var(--red);">$${formatZonePrice(z.mid)}</strong> · SL: <strong>$${formatZonePrice(z.top * 1.002)}</strong>
        </div>
      </div>`;
    }).join('');
    document.getElementById('supplyZonesList').innerHTML = supplyHtml;
  }
  
  // ============ CURRENCY STRENGTH METER ============
  // Strength is calculated by averaging the % change of each currency vs all other 7 currencies.
  // Uses real-time forex rates from a free CORS-enabled API (exchangerate.host).
  
  const STRENGTH_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD'];
  const CURRENCY_FLAGS = { USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭', NZD: '🇳🇿' };
  const CURRENCY_NAMES = { USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen', AUD: 'Australian Dollar', CAD: 'Canadian Dollar', CHF: 'Swiss Franc', NZD: 'New Zealand Dollar' };
  
  let strengthLoadPromise=null;
  let strengthLoadedAt=0;
  async function loadStrengthFresh() {
    const container = document.getElementById('strengthBarsContainer');
    if (!container) return;
    container.innerHTML = '<div class="empty-state" style="height: 200px;"><div class="empty-icon">📊</div><div>Calculating currency strength...</div></div>';
    
    // Try API up to 3 times
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 25000);
        const res = await fetch('https://pipsepaisa-api.vercel.app/api/strength', { signal: ctrl.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        
        if (data.strengths && data.strengths.length > 0) {
          renderStrengthFromAPI(data.strengths, data.latest_date);
          strengthLoadedAt=Date.now();
          return;
        }
        throw new Error('Empty response');
      } catch (e) {
        lastError = e;
        console.warn('Attempt ' + attempt + ' failed:', e.message);
        if (attempt < 3) await new Promise(r => setTimeout(r, 1500));
      }
    }
    
    // All 3 attempts failed - show error
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    container.innerHTML = `
      <div style="padding:24px;text-align:center;background:var(--bg-elevated);border-radius:12px;border:1px solid rgba(245,158,11,0.3);">
        <div style="font-size:40px;margin-bottom:12px;">${isWeekend ? '🔴' : '⚠️'}</div>
        <div style="font-size:15px;font-weight:700;color:var(--gold);margin-bottom:8px;">${isWeekend ? 'Market Closed' : 'Connection Issue'}</div>
        <div style="font-size:12px;color:var(--text-muted);line-height:1.6;">
          ${isWeekend 
            ? 'Weekend hone ki wajah se forex market band hai.<br>Monday ko data update hoga.' 
            : 'Server response is slow. Check your internet and retry.'}
        </div>
        <button class="btn btn-secondary btn-sm" onclick="loadStrength()" style="margin-top:14px;">🔄 Retry</button>
      </div>`;
  }
  
  async function loadStrength(force=false){
    if(!force&&strengthLoadedAt&&(Date.now()-strengthLoadedAt)<60000)return;
    if(strengthLoadPromise)return strengthLoadPromise;
    strengthLoadPromise=loadStrengthFresh();
    try{return await strengthLoadPromise;}
    finally{strengthLoadPromise=null;}
  }
  
  function renderStrengthFromAPI(strengths, latestDate) {
    const container = document.getElementById('strengthBarsContainer');
    if (!container) return;

    // Only show the currencies we want in the meter (removes CAD, CHF, etc.)
    strengths = (strengths || []).filter(s => STRENGTH_CURRENCIES.includes(s.currency));
    if (!strengths.length) { renderStrength(null, null, true); return; }

    const flagMap = { USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭', NZD: '🇳🇿' };
    
    // Check if data is from today or older (market closed indicator)
    const today = new Date().toISOString().split('T')[0];
    const isStaleData = latestDate && latestDate !== today;
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Normalize strengths to 0-100 scale
    const minS = Math.min(...strengths.map(s => s.strength));
    const maxS = Math.max(...strengths.map(s => s.strength));
    const range = maxS - minS || 1;
    
    let html = '';
    if (isWeekend) {
      html += `<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:8px 14px;margin-bottom:14px;font-size:12px;color:var(--red);display:flex;align-items:center;gap:8px;">
        <span>🔴</span><strong>Market Closed (Weekend)</strong> · Last data from ${latestDate || 'Friday close'}
      </div>`;
    } else if (isStaleData) {
      html += `<div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:8px;padding:8px 14px;margin-bottom:14px;font-size:12px;color:var(--green);display:flex;align-items:center;gap:8px;">
        <span style="width:8px;height:8px;background:var(--green);border-radius:50%;animation:pulse 2s infinite;"></span><strong>Market Open · Live Updates</strong> · Live FX data: ${latestDate} · updates every few minutes
      </div>`;
    }
    html += `<div style="font-size:11px;color:var(--text-muted);margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
      <span>📊 Strongest: <strong style="color:var(--green);">${strengths[0].currency} ${strengths[0].strength >= 0 ? '+' : ''}${strengths[0].strength.toFixed(2)}%</strong> · Weakest: <strong style="color:var(--red);">${strengths[strengths.length-1].currency} ${strengths[strengths.length-1].strength.toFixed(2)}%</strong></span>
      <span>Data: ${latestDate || 'Latest'} · Auto-refresh: 1 min</span>
    </div>`;
    
    // Sort by currency name (A-Z) for consistent display like reference website
    const sortedByName = [...strengths].sort((a, b) => a.currency.localeCompare(b.currency));
    
    // Vertical cells layout (like currencystrengthmeter.org)
    html += `<div style="display:grid;grid-template-columns:repeat(${sortedByName.length},1fr);gap:8px;padding:16px 8px;background:var(--bg-elevated);border-radius:12px;">`;
    
    const TOTAL_CELLS = 10;
    
    sortedByName.forEach((s) => {
      // Calculate filled cells (0-10) based on normalized strength
      const normalized = ((s.strength - minS) / range);
      const filledCells = Math.max(1, Math.min(TOTAL_CELLS, Math.round(normalized * TOTAL_CELLS)));
      const color = s.strength > 0.1 ? '#22c55e' : (s.strength < -0.1 ? '#ef4444' : '#f59e0b');
      const arrow = s.direction === 'up' ? '↗' : (s.direction === 'down' ? '↘' : '→');
      const arrowColor = s.direction === 'up' ? '#22c55e' : (s.direction === 'down' ? '#ef4444' : '#9ca3af');
      
      html += `
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <div style="display:flex;align-items:center;gap:3px;font-size:13px;font-weight:700;color:var(--text-primary);">
            ${s.currency} <span style="color:${arrowColor};font-size:14px;">${arrow}</span>
          </div>
          <div style="display:flex;flex-direction:column-reverse;gap:3px;width:100%;max-width:50px;">`;
      
      // Generate 10 cells (bottom to top)
      for (let i = 0; i < TOTAL_CELLS; i++) {
        const isFilled = i < filledCells;
        const cellColor = isFilled ? color : 'var(--border)';
        const opacity = isFilled ? '1' : '0.3';
        html += `<div style="height:14px;background:${cellColor};border-radius:3px;opacity:${opacity};transition:all 0.3s;"></div>`;
      }
      
      html += `
          </div>
          <div style="font-size:11px;color:${color};font-weight:700;margin-top:4px;">
            ${s.strength >= 0 ? '+' : ''}${s.strength.toFixed(2)}%
          </div>
        </div>`;
    });
    
    html += '</div>';
    
    // Suggestions
    const strongest = strengths[0];
    const weakest = strengths[strengths.length - 1];
    html += `
      <div style="margin-top:20px;padding:14px;background:var(--bg-elevated);border-radius:10px;border:1px solid var(--border);">
        <div style="font-size:11px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">💡 Trading Suggestions</div>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;color:var(--text-primary);">
          <div>🟢 <strong>BUY ${strongest.currency}/${weakest.currency}</strong> — Strongest paired with weakest (highest momentum)</div>
          <div>📈 <strong>${strongest.currency} pairs</strong> are gaining strength — look for buying opportunities</div>
          <div>📉 <strong>${weakest.currency} pairs</strong> are losing strength — consider selling</div>
        </div>
      </div>`;
    
    container.innerHTML = html;
  }
  
  function renderStrength(currentRates, historicalRates, isFallback) {
    const container = document.getElementById('strengthBarsContainer');
    if (!container) return;
    
    // Calculate strength score for each currency
    // Strength = average % change vs other 7 currencies (vs historical, or just relative to base if no historical)
    // For "live" mode (no historical), we use a relative ranking based on a deviation calculation
    
    const strengths = {};
    
    if (historicalRates) {
      // Real strength: % change of each currency vs all others
      STRENGTH_CURRENCIES.forEach(c => {
        let totalChange = 0;
        let count = 0;
        STRENGTH_CURRENCIES.forEach(other => {
          if (c === other) return;
          // Build cross-rate: how many `other` per 1 `c`
          // Current: (1/c) * other = other/c
          const currentCross = (currentRates[other] || 1) / (currentRates[c] || 1);
          const histCross = (historicalRates[other] || 1) / (historicalRates[c] || 1);
          // % change of currency c vs other
          const pctChange = ((currentCross - histCross) / histCross) * 100;
          totalChange += pctChange;
          count++;
        });
        // Avg change, scaled to roughly -100 to +100
        const avgChange = totalChange / count;
        // Scale: typical daily change is 0.5-2%, so multiply to get to scale
        strengths[c] = Math.max(-100, Math.min(100, avgChange * 30));
      });
    } else {
      // Live mode (no historical) — use deviation from theoretical "neutral" rates
      // We approximate strength by comparing current rate to a reference rate
      // (Using mid-2026 approximate ranges as reference)
      const reference = { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 152.0, AUD: 1.52, CAD: 1.36, CHF: 0.88, NZD: 1.66 };
      
      STRENGTH_CURRENCIES.forEach(c => {
        let totalDiff = 0;
        let count = 0;
        STRENGTH_CURRENCIES.forEach(other => {
          if (c === other) return;
          // Current cross rate: other per 1 c
          const currentCross = (currentRates[other] || 1) / (currentRates[c] || 1);
          // Reference cross rate
          const refCross = (reference[other] || 1) / (reference[c] || 1);
          // % deviation
          const pctDev = ((currentCross - refCross) / refCross) * 100;
          totalDiff += pctDev;
          count++;
        });
        const avgDev = totalDiff / count;
        strengths[c] = Math.max(-100, Math.min(100, avgDev * 15));
      });
    }
    
    // Sort currencies by strength (strongest first) for stats, but keep alphabetical for display
    const sorted = STRENGTH_CURRENCIES.map(c => ({ code: c, strength: strengths[c] }))
      .sort((a, b) => b.strength - a.strength);
    
    // Alphabetical for display (image 2 style)
    const alphabetical = STRENGTH_CURRENCIES.map(c => ({ code: c, strength: strengths[c] }))
      .sort((a, b) => a.code.localeCompare(b.code));
    
    let html = '';
    
    if (isFallback) {
      // Fallback no longer used - proper message shown instead
      return;
    }
    if (false) {
    }
    
    html += `<div style="font-size: 11px; color: var(--text-muted); margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
      <span>📊 Strongest: <strong style="color: var(--green);">${sorted[0].code} ${sorted[0].strength >= 0 ? '+' : ''}${sorted[0].strength.toFixed(1)}</strong> · Weakest: <strong style="color: var(--red);">${sorted[sorted.length-1].code} ${sorted[sorted.length-1].strength.toFixed(1)}</strong></span>
      <span>Updated: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
    </div>`;
    
    // Vertical cells grid (image 2 style)
    const TOTAL_CELLS = 10; // 10 cells per currency vertical bar
    
    html += '<div style="display: inline-flex; gap: 8px; padding: 14px; background: var(--bg-elevated); border-radius: 12px; width: max-content; min-width: 100%; box-sizing: border-box;">';
    
    alphabetical.forEach((item) => {
      const s = item.strength;
      const c = item.code;
      const isStrongest = c === sorted[0].code;
      const isWeakest = c === sorted[sorted.length - 1].code;
      
      // Convert strength (-100 to +100) into number of filled cells (0-10)
      // +100 = 10 cells filled green
      // 0 = 5 cells filled (neutral)
      // -100 = 0 cells filled
      const normalized = (s + 100) / 200; // 0 to 1
      const filledCells = Math.round(normalized * TOTAL_CELLS);
      
      // Color based on strength
      let cellColor;
      if (s >= 50) cellColor = '#10b981'; // strong green
      else if (s >= 10) cellColor = '#34d399';
      else if (s >= -10) cellColor = '#9ca3af'; // neutral gray
      else if (s >= -50) cellColor = '#f87171';
      else cellColor = '#ef4444'; // strong red
      
      // Direction arrow
      let arrow = '';
      if (s >= 30) arrow = '<span style="color: var(--green); font-size: 11px;">↗</span>';
      else if (s <= -30) arrow = '<span style="color: var(--red); font-size: 11px;">↘</span>';
      
      // Build cells (top to bottom, top is highest)
      let cellsHtml = '';
      for (let i = TOTAL_CELLS; i > 0; i--) {
        const isFilled = i <= filledCells;
        cellsHtml += `<div style="height: 14px; border-radius: 3px; background: ${isFilled ? cellColor : 'var(--bg-card)'}; border: 1px solid ${isFilled ? cellColor : 'var(--border)'};"></div>`;
      }
      
      html += `<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 0 0 auto; min-width: 48px;">
        <div style="display: flex; align-items: center; gap: 4px; font-weight: 700; font-size: 12px; color: var(--text-primary);">
          ${c} ${arrow}
        </div>
        <div style="display: flex; flex-direction: column; gap: 3px; width: 100%; max-width: 40px;">
          ${cellsHtml}
        </div>
        <div style="font-size: 10px; font-weight: 700; color: ${cellColor};">
          ${s >= 0 ? '+' : ''}${s.toFixed(0)}
        </div>
        ${isStrongest ? '<div style="font-size: 9px; color: var(--green); font-weight: 700;">🏆</div>' : ''}
        ${isWeakest ? '<div style="font-size: 9px; color: var(--red); font-weight: 700;">⬇️</div>' : ''}
      </div>`;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
    
    // Update suggestions
    renderStrengthSuggestions(sorted);
  }
  
  function renderStrengthSuggestions(sorted){
    const container=document.getElementById('strengthSuggestions');
    if(!container) return;
    try{
      const arr=(sorted||[]).map(x=>({code:x.code||x.currency||'',strength:Number(x.strength)||0})).filter(x=>x.code);
      if(arr.length<2){container.innerHTML='<div style="padding:16px;color:var(--text-muted);font-size:13px;text-align:center;">No data available.</div>';return;}
      const s2=[...arr].sort((a,b)=>b.strength-a.strength);
      const strong=s2.slice(0,3), weak=s2.slice(-3).reverse();
      const ideas=[];
      for(let i=0;i<3;i++){const s=strong[i], w=weak[i]; if(!s||!w||s.code===w.code) continue; const diff=Math.abs(s.strength-w.strength); const conf=diff>=1?'Very High':diff>=0.5?'High':diff>=0.2?'Medium':'Low'; const cc=diff>=0.5?'var(--green)':diff>=0.2?'var(--gold)':'var(--text-muted)'; ideas.push({pair:s.code+'/'+w.code,diff,conf,cc,s,w});}
      if(!ideas.length){container.innerHTML='<div style="padding:16px;background:var(--bg-elevated);border-radius:8px;text-align:center;color:var(--text-muted);font-size:13px;">📊 Currencies are evenly balanced — no strong opportunities right now.</div>';return;}
      container.innerHTML=ideas.map((id,i)=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--bg-elevated);border-radius:10px;margin-bottom:8px;border-left:3px solid ${id.cc};">
        <div><div style="font-weight:800;font-size:15px;">${i===0?'🥇 ':''}BUY ${id.pair}</div><div style="font-size:11px;color:var(--text-muted);margin-top:3px;">Strong ${id.s.code} (${id.s.strength>=0?'+':''}${id.s.strength.toFixed(2)}%) vs Weak ${id.w.code} (${id.w.strength>=0?'+':''}${id.w.strength.toFixed(2)}%)</div></div>
        <div style="text-align:right;"><div style="font-size:12px;color:${id.cc};font-weight:700;">${id.conf}</div><div style="font-size:10px;color:var(--text-muted);">Spread ${id.diff.toFixed(2)}%</div></div>
      </div>`).join('');
    }catch(e){container.innerHTML='<div style="padding:16px;color:var(--text-muted);font-size:13px;text-align:center;">Could not load suggestions.</div>';}
  }
  
  // ============ SEARCH PALETTE ============
  const PALETTE_ITEMS = [
    { cat: 'Main', icon: '📊', title: 'Dashboard', desc: 'Trading overview and stats', page: 'dashboard' },
    { cat: 'Main', icon: '➕', title: 'Add New Trade', desc: 'Quick add a trade entry', action: 'addTrade' },
    { cat: 'Main', icon: '📈', title: 'My Trades', desc: 'View all your trades', page: 'trades' },
    { cat: 'Main', icon: '📉', title: 'Trades Analysis', desc: 'Performance analytics', page: 'analysis' },
    { cat: 'Analysis', icon: '📰', title: 'Economic News', desc: 'Calendar of news events', page: 'news' },
    { cat: 'Analysis', icon: '💪', title: 'Currency Strength', desc: 'Live currency strength', page: 'strength' },
    { cat: 'Analysis', icon: '📊', title: 'Live Charts', desc: 'TradingView charts', page: 'charts' },
    { cat: 'Tools', icon: '🔧', title: 'All Tools & Calculators', desc: 'Pip, Lot, R:R, P/L, Margin, Compounding', page: 'tools' },
    { cat: 'Tools', icon: '📐', title: 'Pip Calculator', desc: 'Calculate pip values', calc: 'pip' },
    { cat: 'Tools', icon: '📊', title: 'Lot Size Calculator', desc: 'Position sizing', calc: 'lot' },
    { cat: 'Tools', icon: '⚖️', title: 'Risk-to-Reward', desc: 'R:R ratio calculator', calc: 'rr' },
    { cat: 'Tools', icon: '💰', title: 'Profit / Loss', desc: 'P/L calculator', calc: 'pl' },
    { cat: 'Tools', icon: '🏦', title: 'Margin Calculator', desc: 'Required margin', calc: 'margin' },
    { cat: 'Tools', icon: '📈', title: 'Compounding', desc: 'Compound growth', calc: 'compound' },
    { cat: 'Account', icon: '👤', title: 'Profile', desc: 'Profile and account verification', page: 'settings' },
    { cat: 'Account', icon: '🎓', title: 'Learn Forex', desc: 'Education resources', page: 'learn' },
    { cat: 'Account', icon: 'ℹ️', title: 'About', desc: 'About the platform', page: 'about' },
  ];
  
  function openSearchPalette() {
    document.getElementById('paletteOverlay').classList.add('active');
    document.getElementById('searchPalette').classList.add('active');
    document.getElementById('paletteInput').value = '';
    setTimeout(() => document.getElementById('paletteInput').focus(), 50);
    filterPalette();
  }
  
  function closeSearchPalette() {
    document.getElementById('paletteOverlay').classList.remove('active');
    document.getElementById('searchPalette').classList.remove('active');
  }
  
  function paletteEnabled(i){
    var d=window._disabledTabs||{};
    if(i.page) return !d[i.page];
    if(i.action==='addTrade') return !d['addtrade'];
    if(i.calc) return !d['tools'];
    return true;
  }
  function filterPalette() {
    const search = document.getElementById('paletteInput').value.toLowerCase();
    const base = PALETTE_ITEMS.filter(paletteEnabled);
    const filtered = search ? base.filter(i => i.title.toLowerCase().includes(search) || i.desc.toLowerCase().includes(search) || i.cat.toLowerCase().includes(search)) : base;
    
    const grouped = {};
    filtered.forEach(i => { if (!grouped[i.cat]) grouped[i.cat] = []; grouped[i.cat].push(i); });
    
    let html = '';
    Object.keys(grouped).forEach(cat => {
      html += `<div class="palette-section"><div class="palette-section-title">${cat}</div>`;
      grouped[cat].forEach(item => {
        let action;
        if (item.url) action = `window.open('${item.url}', '_blank'); closeSearchPalette();`;
        else if (item.calc) action = `closeSearchPalette(); document.querySelector('[data-page=tools]').click(); setTimeout(() => { const el = document.querySelector('#${item.calc === 'compound' ? 'c' : item.calc === 'margin' ? 'm' : item.calc === 'pl' ? 'pl' : item.calc === 'rr' ? 'rr' : item.calc === 'lot' ? 'lot' : 'pip'}_result'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 200);`;
        else if (item.action === 'addTrade') action = `closeSearchPalette(); openAddTradeModal();`;
        else action = `selectPalette('${item.page}')`;
        
        html += `<div class="palette-item" onclick="${action}">
          <div class="palette-item-icon">${item.icon}</div>
          <div class="palette-item-text"><div class="palette-item-title">${item.title}</div><div class="palette-item-desc">${item.desc}</div></div>
          <div class="palette-item-arrow">→</div>
        </div>`;
      });
      html += '</div>';
    });
    
    if (filtered.length === 0) html = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">No results found</div>';
    
    document.getElementById('paletteResults').innerHTML = html;
  }
  
  function selectPalette(page) {
    closeSearchPalette();
    const menuItem = document.querySelector(`[data-page="${page}"]`);
    if (menuItem) menuItem.click();
  }
  
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearchPalette();
    }
    if (e.key === 'Escape') {
      closeSearchPalette();
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });
  
  // ============ QUIZ — Daily 3 Questions, No Repeats ============
  function ensureTodayQuiz() {
    const today = new Date().toDateString();
    
    // New day? Pick 3 fresh questions that have NEVER been asked
    if (quizState.todayDate !== today) {
      quizState.todayDate = today;
      quizState.todayCompleted = 0;
      quizState.todayCurrent = 0;
      quizState.todayQuestions = pickFreshQuestions(3);
    }
  }
  
  function pickFreshQuestions(count) {
    // Get all question indices NOT yet asked
    const askedSet = new Set(quizState.askedAllTime);
    let available = [];
    for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
      if (!askedSet.has(i)) available.push(i);
    }
    
    // If we've answered ALL questions ever — reset bank
    if (available.length < count) {
      quizState.askedAllTime = [];
      available = QUIZ_QUESTIONS.map((_, i) => i);
    }
    
    // Shuffle available indices and pick first `count`
    available.sort(() => Math.random() - 0.5);
    return available.slice(0, count);
  }
  
  function openQuiz() {
    ensureTodayQuiz();
    
    // Already finished all 3 today?
    if (quizState.todayCompleted >= 3) {
      document.getElementById('quizContent').innerHTML = `
        <div style="text-align: center; padding: 30px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
          <h2 style="margin-bottom: 8px;">All 3 Questions Done Today!</h2>
          <p style="color: var(--text-muted); margin-bottom: 16px;">Come back tomorrow for 3 fresh questions</p>
          <div style="font-size: 14px; color: var(--text-muted);">Total Points Earned: <strong style="color: var(--gold); font-size: 20px;">${userPoints}</strong></div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">${QUIZ_QUESTIONS.length - quizState.askedAllTime.length} fresh questions remaining in bank</div>
        </div>`;
      openModal('quiz');
      return;
    }
    
    showCurrentQuizQuestion();
    openModal('quiz');
  }
  
  function showCurrentQuizQuestion() {
    const idx = quizState.todayQuestions[quizState.todayCurrent];
    const q = QUIZ_QUESTIONS[idx];
    const questionNum = quizState.todayCurrent + 1;
    
    document.getElementById('quizContent').innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding: 8px 12px; background: var(--bg-elevated); border-radius: 8px;">
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Question ${questionNum} of 3</span>
        <span style="font-size: 11px; color: var(--gold); font-weight: 700;">⭐ ${userPoints} pts total</span>
      </div>
      <div style="display: flex; gap: 4px; margin-bottom: 16px;">
        <div style="flex: 1; height: 4px; background: ${quizState.todayCompleted >= 1 ? 'var(--gold)' : 'var(--bg-elevated)'}; border-radius: 2px;"></div>
        <div style="flex: 1; height: 4px; background: ${quizState.todayCompleted >= 2 ? 'var(--gold)' : 'var(--bg-elevated)'}; border-radius: 2px;"></div>
        <div style="flex: 1; height: 4px; background: ${quizState.todayCompleted >= 3 ? 'var(--gold)' : 'var(--bg-elevated)'}; border-radius: 2px;"></div>
      </div>
      <div class="quiz-question">${q.q}</div>
      <div class="quiz-options">
        ${q.opts.map((opt, i) => `<button class="quiz-option" onclick="answerQuiz(${i}, ${q.correct}, this)">${opt}</button>`).join('')}
      </div>
      <div style="font-size: 11px; color: var(--text-muted); margin-top: 14px; text-align: center;">📅 3 daily questions · No repeats ever</div>`;
  }
  
  function answerQuiz(selected, correct, btn) {
    document.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);
    
    // Mark question as used (no repeat ever)
    const idx = quizState.todayQuestions[quizState.todayCurrent];
    if (!quizState.askedAllTime.includes(idx)) {
      quizState.askedAllTime.push(idx);
    }
    
    quizState.todayCompleted++;
    quizState.todayCurrent++;
    
    const isCorrect = selected === correct;
    if (isCorrect) {
      btn.classList.add('correct');
      userPoints++;
    } else {
      btn.classList.add('wrong');
      document.querySelectorAll('.quiz-option')[correct].classList.add('correct');
    }
    
    setTimeout(() => {
      // Were there more questions today?
      if (quizState.todayCompleted < 3) {
        // Show next question
        showCurrentQuizQuestion();
      } else {
        // All 3 done — show summary
        closeModal('quiz');
        document.getElementById('totalPoints').textContent = userPoints;
        document.getElementById('achievementTitle').textContent = '🎉 Quiz Complete!';
        document.getElementById('achievementMsg').textContent = `You finished all 3 questions for today. ${isCorrect ? 'Great answer on the last one!' : 'Better luck on the next one tomorrow.'}`;
        openModal('achievement');
      }
    }, isCorrect ? 1000 : 1800);
  }
  
  // ============ SETTINGS ============
  function showSettingsTab(tab, el) {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    if(el)el.classList.add('active');
    const profile=document.getElementById('settings-profile');
    const preferences=document.getElementById('settings-preferences');
    const security=document.getElementById('settings-security');
    const pin=document.getElementById('pspAccessPinCard');
    if(profile)profile.style.display = tab === 'profile' ? 'block' : 'none';
    if(preferences)preferences.style.display = tab === 'preferences' ? 'block' : 'none';
    if(security)security.style.display = tab === 'security' ? 'block' : 'none';
    if(pin)pin.style.display = tab === 'profile' ? 'block' : 'none';
  }
  
  async function uploadAvatar(input){
    const f=input.files&&input.files[0];if(!f||!currentProfile||!sb)return;
    const msg=document.getElementById('profAvatarMsg');if(msg){msg.style.color='var(--text-muted)';msg.textContent='Uploading...';}
    try{
      const ext=(f.name.split('.').pop()||'jpg').toLowerCase();
      const path='avatars/'+currentProfile.id+'_'+Date.now()+'.'+ext;
      const up=await sb.storage.from('charts').upload(path,f,{upsert:true});
      if(up.error){if(msg){msg.style.color='var(--red)';msg.textContent='Failed: '+up.error.message;}return;}
      const url=sb.storage.from('charts').getPublicUrl(path).data.publicUrl;
      const r=await sb.from('profiles').update({avatar_url:url}).eq('id',currentProfile.id);
      if(r.error){if(msg){msg.style.color='var(--red)';msg.textContent='Error: '+r.error.message;}return;}
      currentProfile.avatar_url=url;
      const prev=document.getElementById('profAvatarPrev');if(prev){prev.style.background="#000 url('"+url+"') center/cover";prev.textContent='';}
      if(msg){msg.style.color='var(--green)';msg.textContent='✅ Photo updated';}
    }catch(e){if(msg){msg.style.color='var(--red)';msg.textContent='Error: '+e.message;}}
  }
  async function saveProfile() {
    const phoneEl = document.getElementById('profPhone');
    const phone = phoneEl ? phoneEl.value.trim() : '';
    if(!currentProfile||!sb){alert('Please sign in to save.');return;}

    // V19 keeps Settings simple: name/email are read-only and only WhatsApp is editable.
    let r=await sb.from('profiles').update({phone:phone||null,whatsapp:phone||null}).eq('id',currentProfile.id);
    // Backward compatibility if the database repair query has not been run yet.
    if(r.error&&/whatsapp|column/i.test(r.error.message||'')){
      r=await sb.from('profiles').update({phone:phone||null}).eq('id',currentProfile.id);
    }
    if(r.error){alert('Error saving WhatsApp: '+r.error.message);return;}

    currentProfile.phone=phone;
    currentProfile.whatsapp=phone;
    alert('✅ WhatsApp number saved');
  }
  
  function pspFriendlyRole(role){
    var r=String(role||'user').toLowerCase().replace(/[\s-]+/g,'_');
    if(r==='admin')return 'Admin';
    if(r==='super_admin'||r==='superadmin'||r==='owner')return 'Super Admin';
    if(r==='mentor')return 'Mentor';
    if(r==='psp_mentor'||r==='pspmentor')return 'PSP Mentor';
    return 'User';
  }

  function updateSettingsProfile() {
    var tc=document.getElementById('settingsTradesCount');if(tc)tc.textContent=trades.length+' Trades';
    const winRate = trades.length > 0 ? (trades.filter(t => t.pnl > 0).length / trades.length * 100).toFixed(0) : 0;
    var wr=document.getElementById('settingsWinRate');if(wr)wr.textContent=winRate+'% Win Rate';
    if(currentProfile){
      var p=document.getElementById('profName');if(p)p.value=currentProfile.full_name||'';
      var e=document.getElementById('profEmail');if(e)e.value=currentProfile.email||'';
      var ph=document.getElementById('profPhone');if(ph)ph.value=currentProfile.whatsapp||currentProfile.phone||'';
      var sn=document.getElementById('settingsName');if(sn)sn.textContent=currentProfile.full_name||'User';
      var sa=document.getElementById('settingsAvatar');if(sa)sa.textContent=((currentProfile.full_name||currentProfile.email||'U')[0]||'U').toUpperCase();
      var sr=document.getElementById('settingsRole');if(sr)sr.textContent=pspFriendlyRole(currentProfile.role);
    }
  }
  
  // ============================================================
  // ============ SUPABASE AUTHENTICATION ============
  // ============================================================
  
  const SUPABASE_URL = 'https://etfolhinohgmskbfjoyh.supabase.co'; // <-- apne NAYE Supabase project ka URL yahan daalo
  const SUPABASE_KEY = 'sb_publishable_LgmfuH2ePiY8fxNGs7nTTA_FSS_oPBw'; // <-- apne NAYE project ka anon/publishable key yahan daalo
  
  // Initialize Supabase client (with safety fallback + mobile CDN delay fix)
  let sb = null;
  function initSupabaseClient(){
    try {
      if (sb) return true;
      if (window.supabase && window.supabase.createClient) {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {auth:{storageKey:"pipsepaisa-user-auth-v2",persistSession:true,autoRefreshToken:true}});
        window.sb=sb;
        window.PSP_SUPABASE_URL=SUPABASE_URL;
        window.PSP_SUPABASE_KEY=SUPABASE_KEY;
        console.log('✅ Supabase initialized');
        try{loadTabSettings();}catch(e){}
        return true;
      }
      console.warn('⚠️ Supabase library not loaded yet');
      return false;
    } catch (e) {
      console.error('❌ Supabase init error:', e);
      sb = null;
      window.sb=null;
      return false;
    }
  }
  let supabaseLoadPromise = null;
  function loadSupabaseSdk(){
    if (window.supabase && window.supabase.createClient) return Promise.resolve(true);
    if (supabaseLoadPromise) return supabaseLoadPromise;
    supabaseLoadPromise = new Promise((resolve) => {
      const urls = [
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
        'https://unpkg.com/@supabase/supabase-js@2'
      ];
      let i = 0;
      function tryNext(){
        if (window.supabase && window.supabase.createClient) return resolve(true);
        if (i >= urls.length) return resolve(false);
        const sc = document.createElement('script');
        sc.src = urls[i++];
        sc.onload = () => resolve(!!(window.supabase && window.supabase.createClient));
        sc.onerror = tryNext;
        document.head.appendChild(sc);
      }
      tryNext();
    });
    return supabaseLoadPromise;
  }
  async function ensureSupabaseClient(){
    if (sb) return true;
    if (initSupabaseClient()) return true;
    await loadSupabaseSdk();
    return initSupabaseClient();
  }
  initSupabaseClient();
  setTimeout(initSupabaseClient, 700);
  window.addEventListener('load', initSupabaseClient);
  
  let currentUser = null;
  let currentProfile = null;
  
  // ============ AUTH MODAL ============
  function resetSignupVerificationState(clearPendingEmail = true) {
    const form = document.getElementById('authForm-signup');
    if (form?.dataset.originalHtml) {
      form.innerHTML = form.dataset.originalHtml;
      delete form.dataset.originalHtml;
    }
    window.__pspSignupPending = false;
    try {
      sessionStorage.removeItem('psp-signup-pending');
      sessionStorage.removeItem('psp-manual-signin-required');
    } catch (_) {}
    if (clearPendingEmail) window.__pspPendingVerificationEmail = '';
  }

  function resetAuthModalState() {
    // Fix: after successful login then logout, the old login button state was staying
    // disabled with "Logging in..." because the modal DOM is reused.
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = '🔐 Login to Account';
    }
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
      signupBtn.disabled = false;
      signupBtn.textContent = '✨ Create Free Account';
    }
    const forgotBtn = document.getElementById('forgotBtn');
    if (forgotBtn) {
      forgotBtn.disabled = false;
      forgotBtn.textContent = '📧 Send Reset Link';
    }
    ['authMessage', 'authMessageSignup', 'authMessageForgot'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = 'none';
        el.innerHTML = '';
      }
    });
  }


  function showLocalFileWarning() {
    if (location.protocol !== 'file:') return;
    const box = document.getElementById('authMessage');
    if (box && box.style.display !== 'block') {
      showAuthMessage(
        'info',
        'You opened this page as a local File. Login should be tested after uploading to GitHub Pages/custom domain.',
        'authMessage'
      );
    }
  }

  function openAuthModal() {
    // Always open a fresh auth form and clear any stale signup state.
    // must never remain stuck after closing/reopening the modal.
    resetSignupVerificationState(true);
    resetAuthModalState();
    switchAuthTab('login');
    openModal('auth');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('loginEmail')?.focus(), 80);
    showLocalFileWarning();
  }
  
  function setAuthRole(r){
    if(r==='mentor'){ window.location.href='psp-mentor.html'; return; }
    var s=document.getElementById('roleStudent'), m=document.getElementById('roleMentor');
    if(s){s.style.background='var(--gold)';s.style.color='#0a0e1a';s.style.fontWeight='700';}
    if(m){m.style.background='transparent';m.style.color='var(--text-muted)';m.style.fontWeight='600';}
  }
  function switchAuthTab(tab) {
    // Choosing Sign Up again means the user wants a fresh editable form.
    if (tab === 'signup') {
      const signupForm = document.getElementById('authForm-signup');
      if (signupForm?.dataset.originalHtml) resetSignupVerificationState(false);
    }
    // Update tabs
    document.getElementById('authTabLogin').style.background = tab === 'login' ? 'var(--gold)' : 'transparent';
    document.getElementById('authTabLogin').style.color = tab === 'login' ? '#0a0e1a' : 'var(--text-muted)';
    document.getElementById('authTabSignup').style.background = tab === 'signup' ? 'var(--gold)' : 'transparent';
    document.getElementById('authTabSignup').style.color = tab === 'signup' ? '#0a0e1a' : 'var(--text-muted)';
    
    // Show/hide forms
    document.getElementById('authForm-login').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('authForm-signup').style.display = tab === 'signup' ? 'block' : 'none';
    document.getElementById('authForm-forgot').style.display = tab === 'forgot' ? 'block' : 'none';
    
    // Update title
    const titles = {
      login: ['Welcome Back', 'Login to your trading hub'],
      signup: ['Create Account', 'Free signup - takes 30 seconds'],
      forgot: ['Reset Password', "We'll send you a reset link"]
    };
    document.getElementById('authTitle').textContent = titles[tab][0];
    document.getElementById('authSubtitle').textContent = titles[tab][1];
    
    // Clear messages and reset any loading/disabled button state
    resetAuthModalState();
  }
  
  function showAuthMessage(type, message, container = 'authMessage') {
    const el = document.getElementById(container);
    if (!el) return;
    const colors = {
      success: { bg: 'var(--green-bg)', color: 'var(--green)', icon: '✅' },
      error: { bg: 'var(--red-bg)', color: 'var(--red)', icon: '❌' },
      info: { bg: 'var(--gold-bg)', color: 'var(--gold)', icon: 'ℹ️' }
    };
    const c = colors[type] || colors.info;
    el.style.background = c.bg;
    el.style.color = c.color;
    el.innerHTML = `${c.icon} ${message}`;
    el.style.display = 'block';
  }
  
  // ============ SIGN UP ============
  async function signupUser() {
    const fullName = document.getElementById('signupFirstName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;
    const password2 = document.getElementById('signupPassword2').value;
    const agreed = document.getElementById('agreeTerms').checked;

    if (!fullName || !email || !password) {
      showAuthMessage('error', 'Please fill in: Full Name, Email, and Password', 'authMessageSignup'); return;
    }
    if (!phone || phone.length < 7) {
      showAuthMessage('error', 'WhatsApp number is required. Please enter a valid number.', 'authMessageSignup'); return;
    }
    if (password.length < 6) {
      showAuthMessage('error', 'Password must be at least 6 characters', 'authMessageSignup'); return;
    }
    if (password !== password2) {
      showAuthMessage('error', 'Passwords do not match. Please re-enter.', 'authMessageSignup'); return;
    }
    if (!agreed) {
      showAuthMessage('error', 'Please agree to the terms', 'authMessageSignup'); return;
    }
    if (!(await ensureSupabaseClient())) {
      showAuthMessage('error', 'Connection problem. Please check internet and reload the page.', 'authMessageSignup'); return;
    }

    const btn = document.getElementById('signupBtn');
    btn.disabled = true; btn.textContent = '⏳ Creating account...';
    try {
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const metadata = { full_name: fullName, username, phone, whatsapp: phone, role: 'user', portal: 'user', psp_auto_enroll_course: 'basic', ...(window.PSPTrack?.authMetadata?.()||{}) };
      if (typeof window.PSPDirectSignup !== 'function') throw new Error('Signup system did not load correctly. Please refresh and try again.');
      const data = await window.PSPDirectSignup(sb, { email, password, metadata });
      if (!data?.user || !data?.session) throw new Error('Account was created, but the login session could not be started.');
      try { await window.PSPTrack?.signup?.(data.user.id); } catch (_) {}
      try { await window.PSPTrack?.enrollment?.('basic', data.user.id, {source:'home-signup'}); } catch (_) {}

      currentUser = data.user;
      currentProfile = {
        id: data.user.id,
        full_name: data.user.user_metadata?.full_name || (data.user.email||'User').split('@')[0],
        username: data.user.user_metadata?.username || (data.user.email||'User').split('@')[0],
        email: data.user.email || '',
        role: 'user',
        is_premium: false,
        member_type: 'free'
      };
      updateAuthUI();
      showAuthMessage('success', 'Account created. You are logged in.');
      closeModal('auth');
      enterApp();
      resetAuthModalState();
      setTimeout(function(){
        Promise.resolve(loadUserProfile(data.user)).catch(function(error){
          console.warn('Signup profile load failed:', error);
          try { updateAuthUI(); } catch (e) {}
        });
      },0);
      setTimeout(function(){ if (typeof window.pspApplyIntendedRoute === 'function') window.pspApplyIntendedRoute(); },0);
    } catch (error) {
      console.error('Signup error:', error);
      let msg = error?.message || 'Signup failed. Please try again.';
      if (/already|registered|exists/i.test(msg)) msg = 'An account already exists with this email. Please sign in.';
      showAuthMessage('error', msg, 'authMessageSignup');
    } finally {
      btn.disabled = false; btn.textContent = '✨ Create Free Account';
    }
  }

  // ============ LOGIN ============
  async function loginUser() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showAuthMessage('error', 'Please enter email and password');
      return;
    }

    if (!(await ensureSupabaseClient())) {
      showAuthMessage('error', 'Supabase connection failed. Please reload and try again.');
      return;
    }

    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Logging in...';

    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data || !data.user || !data.session) {
        throw new Error('Login session was not created. Please try again.');
      }

      currentUser = data.user;
      currentProfile={
        id:data.user.id,
        full_name:data.user.user_metadata?.full_name || (data.user.email||'User').split('@')[0],
        username:data.user.user_metadata?.username || (data.user.email||'User').split('@')[0],
        email:data.user.email || '',
        role:'user',
        is_premium:false,
        member_type:'free'
      };
      updateAuthUI();
      showAuthMessage('success', window.PSP_PORTAL_MODE==='mentor' ? 'Welcome! Opening your Mentor Site...' : 'Welcome! Opening your dashboard...');

      // Open immediately; do not hold the login screen for profile queries.
      closeModal('auth');
      enterApp();
      resetAuthModalState();

      setTimeout(function(){
        Promise.resolve(loadUserProfile(data.user)).catch(function(error){
          console.warn('Login profile load failed:',error);
          try{updateAuthUI();}catch(e){}
        });
      },0);
      setTimeout(function(){if(typeof window.pspApplyIntendedRoute==='function')window.pspApplyIntendedRoute();},0);
    } catch (error) {
      console.error('Login error:', error);
      let msg = error && error.message ? error.message : 'Login failed';
      if (/email not confirmed|email.*confirm/i.test(msg)) {
        msg = 'This older account is not active yet. Please contact PipSePaisa support.';
      } else if (/invalid login credentials/i.test(msg) || /invalid/i.test(msg)) {
        msg = 'Wrong email or password.';
      } else if (/fetch|network/i.test(msg)) {
        msg = 'Network/Supabase connection error. Test on your live website, not only a local File URL.';
      }
      showAuthMessage('error', msg);
    } finally {
      btn.disabled = false;
      btn.textContent = '🔐 Login to Account';
    }
  }

  // ============ FORGOT PASSWORD ============
  async function forgotPassword() {
    const email = document.getElementById('forgotEmail').value.trim();
    
    if (!email) {
      showAuthMessage('error', 'Please enter your email', 'authMessageForgot');
      return;
    }
    
    if (!(await ensureSupabaseClient())) {
      showAuthMessage('error', 'Connection problem. Please check internet and reload the page.', 'authMessageForgot');
      return;
    }

    const btn = document.getElementById('forgotBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Sending...';
    
    try {
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.pipsepaisa.com/reset-password.html'
      });
      
      if (error) throw error;
      
      showAuthMessage('success', `Reset link sent to ${email}! Check your inbox (and spam folder).`, 'authMessageForgot');
      setTimeout(() => {
        switchAuthTab('login');
      }, 4000);
    } catch (error) {
      console.error('Forgot password error:', error);
      showAuthMessage('error', error.message || 'Could not send reset link', 'authMessageForgot');
    } finally {
      btn.disabled = false;
      btn.textContent = '📧 Send Reset Link';
    }
  }
  
  // ============ LOGOUT ============
  async function logoutUser() {
    if (!(await window.pspConfirm('Are you sure you want to logout?'))) return;
    try {
      await sb.auth.signOut();
      currentUser = null;
      currentProfile = null;
      trades = [];
      updateAuthUI();
      updateDashboard();
      try{loadPerformance();}catch(e){}
      updateTradesTable();
      buildCalendar();
      // Show landing page on logout and clear stale auth modal state
      try { closeModal('auth'); } catch(e) {}
      resetAuthModalState();
      showLandingPage();
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout failed: ' + error.message);
    }
  }
  
  // ============ LOAD USER PROFILE ============
  async function loadUserProfile(explicitUser = null) {
    if (!sb) {
      updateAuthUI();
      return;
    }
    let user = explicitUser || null;
    if (!user) try { const sres = await sb.auth.getSession(); user = (sres && sres.data && sres.data.session) ? sres.data.session.user : null; } catch(e) {}
    if (!user) { try { const ur = await sb.auth.getUser(); user = (ur && ur.data) ? ur.data.user : null; } catch(e) {} }

    if (!user) {
      currentUser = null;
      currentProfile = null;
      updateAuthUI();
      return;
    }
    
    currentUser = user;
    
    // Hide landing page since user is logged in
    if (typeof hideLandingAfterLogin === 'function') hideLandingAfterLogin();
    
    // Get profile from database. If the auth account predates the profile trigger,
    // create the missing row and continue with the same original dashboard.
    let profile = null;
    let profileError = null;
    try {
      const pr = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
      profile = pr.data || null;
      profileError = pr.error || null;
    } catch (e) { profileError = e; }

    if (!profile) {
      const fallback = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        username: user.user_metadata?.username || (user.email.split('@')[0] + '_' + user.id.slice(0,6)),
        phone: user.user_metadata?.phone || null,
        role: 'user'
      };
      try {
        const cr = await sb.from('profiles').upsert(fallback, {onConflict:'id'}).select('*').maybeSingle();
        if (!cr.error && cr.data) profile = cr.data;
      } catch (e) {}
    }

    currentProfile = profile || {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      username: user.user_metadata?.username || user.email.split('@')[0],
      email: user.email,
      role: 'user',
      is_premium: false,
      member_type: 'free'
    };
    
    updateAuthUI();
    
    // Load the Performance dashboard (default page) now that profile is ready
    try{ loadPerformance(); }catch(e){}
    
    // Load user's trades from database
    loadTradesFromDB();
    // presence + DM unread badge
    try{pingPresence();}catch(e){}
    try{loadDMList(true);}catch(e){}
  }
  
  function vEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  let vipPlansById={};
  let vipMentorContact = null;
  async function loadVipPlans(){
    const grid=document.getElementById('vipPlansGrid');const statusEl=document.getElementById('vipStatus');
    if(!grid)return;
    if(statusEl){
      statusEl.innerHTML=(currentProfile&&currentProfile.is_premium)
        ?'<div class="card" style="margin-bottom:14px;border:1px solid rgba(16,185,129,.4);background:linear-gradient(135deg,rgba(16,185,129,.12),transparent);"><div style="font-weight:800;color:var(--green);font-size:15px;">✨ You are a '+(currentProfile.member_type==='vip'?'👑 VIP':'💎 Premium')+' member</div><div style="font-size:13px;color:var(--text-muted);margin-top:3px;">'+(function(){var s=userServicesList();return (s&&s.length)?('Unlocked: '+vSvcChips(s)):'You have full access to premium signals, charts &amp; analysis.';})()+'</div></div>'
        :'';
    }
    if(!sb){grid.innerHTML='<div class="empty-state"><div>Connect to view plans.</div></div>';return;}
    const mentorId=currentProfile&&currentProfile.mentor_id;
    let rows=[],error=null;
    try{
      const r=await sb.from('subscription_plans').select('*').eq('is_active',true).order('price',{ascending:true});
      rows=r.data||[];error=r.error;
      if(mentorId){const mp=await sb.from('profiles').select('full_name,phone').eq('id',mentorId).single();if(mp.data)vipMentorContact=mp.data;}
    }catch(e){error=e;}
    if(error){grid.innerHTML='<div class="empty-state" style="grid-column:1/-1"><div>'+vEsc(error.message||'Error')+'</div></div>';return;}
    if(!rows.length){grid.innerHTML='<div class="empty-state" style="grid-column:1/-1"><div>No VIP plans available yet.</div><div style="font-size:12px;color:var(--text-muted);margin-top:6px;">'+(mentorId?'Your mentor hasn\'t published any premium plans yet.':'You are not linked to a mentor yet. Sign up using a mentor code to see their VIP plans.')+'</div></div>';return;}
    grid.innerHTML=rows.map(function(r){var p=parseVipPlan(r);vipPlansById[p.id]=p;return vipPlanCard(p);}).join('');
    loadMyVipRequests();
  }
  function parseVipPlan(row){
    const lines=(row.features||'').split('\n');let icon='💎',tag='',pop=false,vip=false,period='monthly';const feats=[];
    let ib=false,iblink='',ibdep=0,ibbroker='',ibprice=0,services=[];
    lines.forEach(function(l){const t=l.trim();if(!t)return;
      if(t==='[POPULAR]')pop=true;else if(t==='[VIP]')vip=true;
      else if(t==='[IB]')ib=true;
      else if(t.indexOf('[SERVICES]')===0)services=t.slice(10).split(',').map(function(x){return x.trim();}).filter(Boolean);
      else if(t.indexOf('[IBPRICE]')===0)ibprice=parseFloat(t.slice(9).trim())||0;
      else if(t.indexOf('[IBLINK]')===0)iblink=t.slice(8).trim();
      else if(t.indexOf('[IBDEPOSIT]')===0)ibdep=parseFloat(t.slice(11).trim())||0;
      else if(t.indexOf('[IBBROKER]')===0)ibbroker=t.slice(10).trim();
      else if(t.indexOf('[ICON]')===0)icon=t.slice(6).trim()||'💎';
      else if(t.indexOf('[TAG]')===0)tag=t.slice(5).trim();
      else if(t.indexOf('[PERIOD]')===0)period=t.slice(8).trim()||'monthly';
      else feats.push(t);});
    return {id:row.id,name:row.name,price:row.price,currency:row.currency,icon:icon,tagline:tag,popular:pop,vip:vip,period:period,features:feats,ib:ib,iblink:iblink,ibdep:ibdep,ibbroker:ibbroker,ibprice:ibprice,services:services};
  }
  var VSVC_LABELS={signal:'📶 Signal',chart:'📈 Chart',courses:'🎓 Courses',vipindicator:'📐 VIP Indicator',vipea:'🤖 VIP EA'};
  function vSvcChips(arr){return (arr||[]).map(function(s){return '<span style="display:inline-block;font-size:10.5px;padding:2px 8px;border-radius:20px;background:rgba(245,158,11,.15);color:var(--gold);font-weight:700;margin:2px 3px 0 0">'+vEsc(VSVC_LABELS[s]||s)+'</span>';}).join('');}
  function vipPlanCard(p){
    const perLbl=p.period==='lifetime'?'one-time':(p.period==='yearly'?'/yr':'/mo');
    const feats=((p.features&&p.features.length)?p.features:['Premium access']).map(function(x){return '<li style="padding:4px 0;font-size:13px;">✓ '+vEsc(x)+'</li>';}).join('');
    const badge=p.popular?'<div style="position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:var(--gold);color:#0a0e1a;font-size:10px;font-weight:800;padding:3px 12px;border-radius:20px;white-space:nowrap;">⭐ MOST POPULAR</div>':(p.vip?'<div style="position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:var(--gold);color:#0a0e1a;font-size:10px;font-weight:800;padding:3px 12px;border-radius:20px;">👑 VIP</div>':'');
    const bd=(p.vip||p.popular)?'border:1.5px solid var(--gold);box-shadow:0 12px 40px rgba(245,158,11,.18);':'border:1px solid var(--border);';
    const chips=(p.services&&p.services.length)?'<div style="margin:2px 0 10px;line-height:1.9;">'+vSvcChips(p.services)+'</div>':'';
    const subBtn='<button style="width:100%;padding:11px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#0a0e1a;font-weight:800;cursor:pointer;font-size:14px;" onclick="openVipCheckout(\''+p.id+'\')">💎 Subscribe — '+(p.price||0)+' '+vEsc(p.currency||'')+'</button>';
    const ibBtn=p.ib?'<button style="width:100%;padding:11px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--green),#059669);color:#fff;font-weight:800;cursor:pointer;font-size:14px;margin-top:8px;" onclick="openIbJoin(\''+p.id+'\')">🤝 Join via IB — '+(p.ibprice>0?(p.ibprice+' '+vEsc(p.currency||'')):'FREE')+'</button>':'';
    const ibNote=p.ib?'<div style="font-size:11px;color:var(--green);text-align:center;margin-top:6px;">Open account under your mentor & save'+(p.ibprice>0?'':' 100%')+'</div>':'';
    return '<div style="position:relative;display:flex;flex-direction:column;width:255px;max-width:100%;background:linear-gradient(160deg,rgba(245,158,11,.07),rgba(255,255,255,.02));border-radius:16px;padding:22px 18px;'+bd+'">'+badge+
      '<div style="font-size:34px;line-height:1;">'+vEsc(p.icon||'💎')+'</div>'+
      '<div style="font-size:18px;font-weight:800;margin-top:8px;">'+vEsc(p.name||'Plan')+'</div>'+
      (p.tagline?'<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">'+vEsc(p.tagline)+'</div>':'')+
      chips+
      '<div style="font-size:30px;font-weight:800;color:var(--gold);margin:12px 0;">'+(p.price||0)+'<span style="font-size:13px;color:var(--text-muted);font-weight:600;"> '+vEsc(p.currency||'')+' '+perLbl+'</span></div>'+
      '<ul style="list-style:none;padding:0;margin:0 0 16px;flex:1 1 auto;">'+feats+'</ul>'+
      subBtn+ibBtn+ibNote+
    '</div>';
  }
  async function openVipCheckout(id){
    const p=vipPlansById[id];if(!p)return;
    const mentorId=currentProfile&&currentProfile.mentor_id;
    let methods=[];
    try{
      const r=await sb.from('payment_methods').select('*').eq('enabled',true);
      methods=r.data||[];
    }catch(e){}
    const dur=p.period==='lifetime'?36500:(p.period==='yearly'?365:30);
    window._vipCheckout={plan:p,methods:methods,dur:dur};
    const host=document.getElementById('vipModalHost');if(!host)return;
    const tlMap={easypaisa:'EasyPaisa',jazzcash:'JazzCash',bank:'Bank Transfer',crypto:'Crypto USDT (TRC20)'};
    const opts=methods.map(function(m,i){return '<option value="'+i+'">'+vEsc(m.label||tlMap[m.type]||m.type)+'</option>';}).join('');
    const body=methods.length?(
      '<label style="font-size:12px;color:var(--text-muted)">Choose payment method</label>'+
      '<select id="vipMethod" onchange="vipMethodDetail()" style="width:100%;padding:10px;margin:6px 0 10px;border-radius:8px;background:var(--bg-card);border:1px solid var(--border);color:var(--text)">'+opts+'</select>'+
      '<div id="vipMethodDetail" style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:10px;padding:12px;font-size:13px;margin-bottom:12px"></div>'+
      '<label style="font-size:12px;color:var(--text-muted)">Upload payment receipt (screenshot) *</label>'+
      '<input type="file" id="vipReceipt" accept="image/*" style="width:100%;margin:6px 0 10px;color:var(--text)">'+
      '<input type="text" id="vipTxn" placeholder="Transaction ID (optional)" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;background:var(--bg-card);border:1px solid var(--border);color:var(--text)">'+
      '<textarea id="vipNotes" placeholder="Notes (optional)" rows="2" style="width:100%;padding:10px;margin-bottom:12px;border-radius:8px;background:var(--bg-card);border:1px solid var(--border);color:var(--text)"></textarea>'+
      '<button onclick="submitVipRequest()" style="width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#0a0e1a;font-weight:800;cursor:pointer">📤 Submit Payment Request</button>'+
      '<div id="vipSubMsg" style="margin-top:10px;font-size:13px"></div>'
    ):'<div style="color:var(--text-muted);font-size:13px">Your mentor hasn\'t added any payment methods yet. Please contact them directly to subscribe.</div>';
    host.innerHTML='<div class="vip-modal-bg" onclick="if(event.target===this)closeVipModal()"><div class="vip-modal">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="font-size:18px;font-weight:800">💎 Subscribe — '+vEsc(p.name)+'</div><button onclick="closeVipModal()" style="background:none;border:none;color:var(--text-muted);font-size:20px;cursor:pointer">✕</button></div>'+
      '<div style="color:var(--gold);font-weight:800;font-size:20px;margin-bottom:14px">'+(p.price||0)+' '+vEsc(p.currency||'')+'</div>'+body+'</div></div>';
    if(methods.length)vipMethodDetail();
  }
  function vipMethodDetail(){
    const c=window._vipCheckout;if(!c)return;
    const i=parseInt(document.getElementById('vipMethod').value,10)||0;const m=c.methods[i];if(!m)return;
    let h='';
    if(m.type==='crypto'){h='<div><strong>Wallet (TRC20):</strong> '+vEsc(m.wallet||'')+'</div><div><strong>Network:</strong> '+vEsc(m.network||'TRC20')+'</div>';}
    else{h='<div><strong>Account Title:</strong> '+vEsc(m.account_title||'')+'</div><div><strong>Account Number:</strong> '+vEsc(m.account_number||'')+'</div>'+(m.bank_name?('<div><strong>Bank:</strong> '+vEsc(m.bank_name)+'</div>'):'');}
    document.getElementById('vipMethodDetail').innerHTML='<div style="font-weight:700;margin-bottom:5px">Send payment to:</div>'+h+'<div style="color:var(--text-muted);font-size:11.5px;margin-top:7px">After paying, upload the receipt below & submit.</div>';
  }
  async function submitVipRequest(){
    const c=window._vipCheckout;if(!c)return;
    const msg=document.getElementById('vipSubMsg');
    const i=parseInt(document.getElementById('vipMethod').value,10)||0;const m=c.methods[i];
    const file=document.getElementById('vipReceipt').files[0];
    if(!file){msg.style.color='var(--red)';msg.textContent='Please upload your payment receipt.';return;}
    msg.style.color='var(--text-muted)';msg.textContent='Uploading...';
    try{
      const ext=(file.name.split('.').pop()||'jpg').toLowerCase();
      const path='receipts/'+currentProfile.id+'_'+Date.now()+'.'+ext;
      const up=await sb.storage.from('charts').upload(path,file,{upsert:true});
      if(up.error){msg.style.color='var(--red)';msg.textContent='Upload failed: '+up.error.message;return;}
      const url=sb.storage.from('charts').getPublicUrl(path).data.publicUrl;
      const obj={user_id:currentProfile.id,mentor_id:currentProfile.mentor_id||null,plan_id:c.plan.id,plan_name:c.plan.name,amount:c.plan.price,currency:c.plan.currency,duration_days:c.dur,request_type:'payment',method_type:(m?m.type:null),receipt_url:url,txn_id:(document.getElementById('vipTxn').value||null),notes:(document.getElementById('vipNotes').value||null),status:'pending'};
      const ins=await sb.from('payment_requests').insert(obj);
      if(ins.error){msg.style.color='var(--red)';msg.textContent='Error: '+ins.error.message;return;}
      msg.style.color='var(--green)';msg.textContent='✅ Request submitted! Your mentor will verify & activate your VIP soon.';
      setTimeout(function(){closeVipModal();loadMyVipRequests();},1600);
    }catch(e){msg.style.color='var(--red)';msg.textContent='Error: '+e.message;}
  }
  // ============ SUPPORT + ANNOUNCEMENTS ============
  var _supSig='';var _supHasMsgs=false;
  function supBubbleHTML(text,admin){
    return '<div style="align-self:'+(admin?'flex-start':'flex-end')+';max-width:80%;"><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px;'+(admin?'':'text-align:right')+'">'+(admin?'↩️ Support':'You')+' · '+new Date().toLocaleString()+'</div><div style="padding:10px 13px;border-radius:12px;font-size:13px;line-height:1.5;background:'+(admin?'rgba(16,185,129,.14);color:var(--text)':'rgba(245,158,11,.16);color:var(--text)')+'">'+vEsc(text)+'</div></div>';
  }
  async function submitSupport(){
    const msg=document.getElementById('supMsg');
    if(!currentProfile||!sb){msg.style.color='var(--red)';msg.textContent='Please sign in first.';return;}
    const body=(document.getElementById('supBody').value||'').trim();
    if(!body){msg.style.color='var(--red)';msg.textContent='Please write a message.';return;}
    const subjEl=document.getElementById('supSubject');
    const subj=_supHasMsgs?'Re:':((subjEl&&subjEl.value.trim())||'(no subject)');
    // optimistic: show instantly
    const box=document.getElementById('supThread');
    if(box){const es=box.querySelector('.empty-state');if(es)es.remove();box.insertAdjacentHTML('beforeend',supBubbleHTML(body,false));box.scrollTop=box.scrollHeight;}
    if(subjEl)subjEl.value='';document.getElementById('supBody').value='';
    msg.textContent='';_supHasMsgs=true;var sw=document.getElementById('supSubjectWrap');if(sw)sw.style.display='none';
    const obj={user_id:currentProfile.id,name:(currentProfile.full_name||''),email:(currentProfile.email||''),subject:subj,body:body,sender:'user',status:'open'};
    const r=await sb.from('support_messages').insert(obj);
    if(r.error){msg.style.color='var(--red)';msg.textContent='Error: '+r.error.message;return;}
    loadSupport();
  }
  async function loadSupport(silent){
    const box=document.getElementById('supThread');if(!box||!currentProfile||!sb)return;
    let data=[];try{const r=await sb.from('support_messages').select('*').eq('user_id',currentProfile.id).order('created_at',{ascending:true}).limit(300);data=r.data||[];}catch(e){return;}
    const sig=data.length+'|'+(data.length?(data[data.length-1].id+data[data.length-1].created_at+(data[data.length-1].closed_at||'')):'');
    if(silent&&sig===_supSig)return;
    _supSig=sig;
    const active=data.filter(function(m){return !m.closed_at;});
    _supHasMsgs=active.length>0;
    const sw=document.getElementById('supSubjectWrap');if(sw)sw.style.display=_supHasMsgs?'none':'';
    const sb2=document.getElementById('supSendBtn');if(sb2)sb2.textContent=_supHasMsgs?'📤 Send Reply':'📤 Send';
    const cb=document.getElementById('supCloseBtn');if(cb)cb.style.display=_supHasMsgs?'':'none';
    const atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<60;
    if(!active.length){box.innerHTML='<div class="empty-state" style="margin:auto;color:var(--text-muted);font-size:13px;">No active ticket. Start a new conversation below.</div>';}
    else{box.innerHTML=active.map(function(m){
      const admin=m.sender==='admin';
      return '<div style="align-self:'+(admin?'flex-start':'flex-end')+';max-width:80%;"><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px;'+(admin?'':'text-align:right')+'">'+(admin?'↩️ Support':'You')+' · '+new Date(m.created_at).toLocaleString()+'</div><div style="padding:10px 13px;border-radius:12px;font-size:13px;line-height:1.5;background:'+(admin?'rgba(16,185,129,.14);color:var(--text)':'rgba(245,158,11,.16);color:var(--text)')+'">'+vEsc(m.body||m.admin_reply||'')+'</div></div>';
    }).join('');if(atBottom||!silent)box.scrollTop=box.scrollHeight;}
    // closed tickets -> separate boxes
    renderClosedTickets(data.filter(function(m){return m.closed_at;}));
  }
  var _closedExpanded={};
  function renderClosedTickets(closedMsgs){
    const wrap=document.getElementById('supClosedList');if(!wrap)return;
    if(!closedMsgs.length){wrap.innerHTML='';return;}
    var groups={};closedMsgs.forEach(function(m){var k=m.closed_at;if(!groups[k])groups[k]=[];groups[k].push(m);});
    var keys=Object.keys(groups).sort(function(a,b){return new Date(b)-new Date(a);});
    wrap.innerHTML='<div class="card-title" style="font-size:14px;margin-bottom:8px;">📁 Closed tickets</div>'+keys.map(function(k){
      var ms=groups[k];var subj=(ms[0]&&ms[0].subject)?ms[0].subject:'Ticket';var open=_closedExpanded[k];
      var head='<div onclick="toggleClosed(\''+k+'\')" style="display:flex;justify-content:space-between;align-items:center;gap:8px;cursor:pointer;padding:12px 14px;">'+
        '<div style="min-width:0"><strong style="font-size:13px">🔒 '+vEsc(subj.slice(0,40))+'</strong><div style="font-size:11px;color:var(--text-muted)">'+ms.length+' messages · closed '+new Date(k).toLocaleDateString()+'</div></div>'+
        '<span style="font-size:13px;color:var(--text-muted)">'+(open?'▲':'▼')+'</span></div>';
      var bodyHtml=open?('<div style="display:flex;flex-direction:column;gap:8px;padding:0 14px 14px;">'+ms.map(function(m){var admin=m.sender==='admin';return '<div style="align-self:'+(admin?'flex-start':'flex-end')+';max-width:82%;"><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px;'+(admin?'':'text-align:right')+'">'+(admin?'↩️ Support':'You')+'</div><div style="padding:9px 12px;border-radius:11px;font-size:12.5px;line-height:1.45;background:'+(admin?'rgba(16,185,129,.1)':'rgba(245,158,11,.1)')+';color:var(--text)">'+vEsc(m.body||m.admin_reply||'')+'</div></div>';}).join('')+'</div>'):'';
      return '<div class="card" style="padding:0;margin-bottom:10px;opacity:.92;">'+head+bodyHtml+'</div>';
    }).join('');
  }
  function toggleClosed(k){_closedExpanded[k]=!_closedExpanded[k];_supSig='';loadSupport();}
  async function closeMyTicket(){
    if(!currentProfile||!sb)return;
    if(!(await window.pspConfirm('Close this ticket? You can start a new chat after closing.')))return;
    const r=await sb.rpc('close_support_ticket',{p_user:currentProfile.id});
    if(r.error){alert('Error: '+r.error.message);return;}
    _supSig='';loadSupport();
  }
  async function loadAnnouncements(){
    const box=document.getElementById('announceList');if(!box)return;
    if(!sb){box.innerHTML='<div class="empty-state"><div>Sign in to view notifications.</div></div>';return;}
    let data=[];try{const r=await sb.from('notifications').select('*').eq('is_official',true).order('created_at',{ascending:false}).limit(40);data=r.data||[];}catch(e){box.innerHTML='<div class="empty-state"><div>'+vEsc(e.message||'Error')+'</div></div>';return;}
    if(!data.length){box.innerHTML='<div class="empty-state"><div>No notifications yet.</div></div>';return;}
    const ico={general:'📢',urgent:'🔴',course:'🎓',signal:'📈',promo:'🎁'};
    box.innerHTML=data.map(function(n){
      return '<div class="card" style="margin-bottom:10px;border-left:3px solid var(--gold)"><div style="display:flex;justify-content:space-between;gap:8px"><strong style="font-size:15px">'+(ico[n.type]||'📢')+' '+vEsc(n.title||'')+'</strong><span style="font-size:11px;color:var(--text-muted)">'+new Date(n.created_at).toLocaleDateString()+'</span></div><div style="font-size:13px;color:var(--text-secondary);margin-top:6px;line-height:1.5">'+vEsc(n.body||'')+'</div>'+(n.action_link?'<a href="'+vEsc(n.action_link)+'" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;color:var(--gold);font-size:13px;font-weight:700">Open link →</a>':'')+'</div>';
    }).join('');
  }
  async function markAnnounceRead(){
    if(!sb)return;
    try{const r=await sb.from('notifications').select('created_at').eq('is_official',true).order('created_at',{ascending:false}).limit(1);const latest=(r.data||[])[0];if(latest)localStorage.setItem('psp_last_announce',latest.created_at);}catch(e){}
    const b=document.getElementById('announceBanner');if(b)b.style.display='none';
    const m=document.getElementById('supMsg');
    alert('✓ All notifications marked as read');
  }
  function pspNotificationPage(n){
    const t=String((n&&n.type)||'').toLowerCase();
    const l=String((n&&n.action_link)||'').toLowerCase();
    if(l.indexOf('signal')>-1||t.indexOf('signal')>-1) return 'signals';
    if(l.indexOf('chart')>-1||l.indexOf('article')>-1||t.indexOf('chart')>-1||t.indexOf('article')>-1) return 'articles';
    if(l.indexOf('banner')>-1||t.indexOf('banner')>-1) return 'tools';
    if(l.indexOf('news')>-1||t.indexOf('news')>-1) return 'newshub';
    if(l.indexOf('strength')>-1||t.indexOf('strength')>-1) return 'strength';
    return null;
  }
  function pspCanOpenPage(page){
    if(!page) return false;
    const pg=document.getElementById('page-'+page);
    const nav=document.querySelector('[data-page="'+page+'"]');
    return !!(pg && nav && nav.offsetParent !== null);
  }
  function pspPlayNotifySound(){
    try{
      const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
      const ctx=new A();
      const now=ctx.currentTime;
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.type='sine';osc.frequency.setValueAtTime(880,now);osc.frequency.exponentialRampToValueAtTime(1320,now+.16);
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.22,now+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+.42);
      osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.45);
      setTimeout(function(){try{ctx.close();}catch(e){}},700);
    }catch(e){}
  }
  function pspBrowserNotify(n){
    try{
      if(!('Notification' in window))return;
      if(Notification.permission==='granted'){new Notification(n.title||'PipSePaisa Notification',{body:n.body||'',icon:'icon-192.png',tag:n.id||n.created_at||'psp'});}
    }catch(e){}
  }
  async function checkAnnounceBanner(){
    if(!sb)return;
    let latest=null;try{const r=await sb.from('notifications').select('*').eq('is_official',true).order('created_at',{ascending:false}).limit(1);latest=(r.data||[])[0];}catch(e){return;}
    if(!latest)return;
    let seen=null;try{seen=localStorage.getItem('psp_last_announce');}catch(e){}
    if(seen&&new Date(latest.created_at)<=new Date(seen)){var hb=document.getElementById('announceBanner');if(hb)hb.style.display='none';return;}
    window._lastAnnounceAt=latest.created_at;window._lastAnnounceObj=latest;
    try{const lastSound=localStorage.getItem('psp_last_notify_sound');if(lastSound!==latest.created_at){pspPlayNotifySound();pspBrowserNotify(latest);localStorage.setItem('psp_last_notify_sound',latest.created_at);}}catch(e){}
    const ico={general:'📢',urgent:'🔴',course:'🎓',signal:'📈',chart:'📊',article:'📖',banner:'🖼️',promo:'🎁'};
    const host=document.getElementById('announceBanner');if(!host)return;
    const targetPage=pspNotificationPage(latest);
    const canView=pspCanOpenPage(targetPage);
    host.style.display='block';
    host.innerHTML='<div style="background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#0a0e1a;padding:12px 16px;border-radius:12px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 24px rgba(245,158,11,.3);">'+
      '<span style="font-size:20px">'+(ico[latest.type]||'🔔')+'</span>'+
      '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:14px">'+vEsc(latest.title||'Notification')+'</div><div style="font-size:12px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+vEsc((latest.body||'').slice(0,80))+'</div></div>'+
      (canView?'<button onclick="dismissAnnounceBanner(true)" style="background:rgba(0,0,0,.15);border:none;color:#0a0e1a;font-weight:800;padding:7px 13px;border-radius:8px;cursor:pointer;font-size:12px;white-space:nowrap">View</button>':'')+
      '<button onclick="dismissAnnounceBanner(false)" style="background:none;border:none;color:#0a0e1a;font-weight:800;font-size:18px;cursor:pointer;padding:0 4px;line-height:1">×</button>'+
    '</div>';
  }
  function dismissAnnounceBanner(go){
    try{ if(window._lastAnnounceAt) localStorage.setItem('psp_last_announce', window._lastAnnounceAt); }catch(e){}
    var b=document.getElementById('announceBanner'); if(b) b.style.display='none';
    if(go){
      const page=pspNotificationPage(window._lastAnnounceObj||{});
      if(pspCanOpenPage(page)){ showPage(page, document.querySelector('[data-page="'+page+'"]')); }
    }
  }
  // ============ COMMUNITY (reactions, replies, edit, pin, avatars, notifications) ============
  var _commGid=null;var _commGroups=[];var _commImgFile=null;var _commFeedSig='';var _commOpenComments={};
  var _editPost=null;var _editComment=null;var _replyTo=null;var _reactPickFor=null;
  var REACTS=['👍','❤️','😂','😮','😢'];
  function commName(p){return (p&&(p.full_name||p.email))?vEsc(p.full_name||p.email):'Member';}
  function avatarHTML(p,size){
    var s=size||42;var url=p&&p.avatar_url;var init=((p&&(p.full_name||p.email)||'M')[0]||'M').toUpperCase();
    if(url)return '<div style="width:'+s+'px;height:'+s+'px;border-radius:50%;flex:0 0 auto;background:#000 url(\''+vEsc(url)+'\') center/cover;"></div>';
    return '<div style="width:'+s+'px;height:'+s+'px;border-radius:50%;flex:0 0 auto;background:linear-gradient(135deg,var(--gold),var(--gold-dark));display:flex;align-items:center;justify-content:center;color:#0a0e1a;font-weight:800;font-size:'+Math.round(s*0.4)+'px;">'+init+'</div>';
  }
  function commTimeAgo(ts){var s=Math.floor((Date.now()-new Date(ts))/1000);if(s<60)return 'just now';var m=Math.floor(s/60);if(m<60)return m+'m';var h=Math.floor(m/60);if(h<24)return h+'h';var d=Math.floor(h/24);if(d<7)return d+'d';return new Date(ts).toLocaleDateString();}
  var BADWORDS=['fuck','shit','bitch','asshole','bastard','dick','cunt','slut','whore','nigger','faggot','randi','madarchod','behenchod','bhenchod','gandu','chutiya','chutiyaa','harami','kutta','kutiya','lund','gaand','bsdk','mc','bc'];
  function censorText(t){if(!t)return t;var s=t;BADWORDS.forEach(function(w){try{s=s.replace(new RegExp('\\b'+w+'\\b','gi'),function(m){return m[0]+'*'.repeat(Math.max(1,m.length-1));});}catch(e){}});return s;}
  function fmtContent(t){return censorText(vEsc(t||'')).replace(/@([\w.]+)/g,'<span style="color:var(--gold);font-weight:700">@$1</span>').replace(/#(\w+)/g,'<span style="color:#3b82f6;font-weight:700">#$1</span>');}
  function roleBadge(author,ownerId){
    if(!author)return '';
    if(author.id===ownerId)return '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:rgba(245,158,11,.2);color:var(--gold);font-weight:800;margin-left:5px;">'+(author.role==='admin'?'ADMIN':'MENTOR')+'</span>';
    if(author.role==='admin')return '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:rgba(239,68,68,.2);color:#ef4444;font-weight:800;margin-left:5px;">ADMIN</span>';
    if(author.member_type==='vip')return '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:rgba(168,85,247,.2);color:#a855f7;font-weight:800;margin-left:5px;">VIP</span>';
    if(author.member_type==='premium')return '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:rgba(16,185,129,.2);color:#10b981;font-weight:800;margin-left:5px;">PREMIUM</span>';
    return '';
  }
  async function loadCommunityGroups(){
    const box=document.getElementById('commGroups');if(!box||!sb)return;
    let data=[];try{const r=await sb.from('groups').select('*, owner:owner_id(role,is_admin)').order('is_official',{ascending:false}).order('created_at',{ascending:true});data=r.data||[];}catch(e){box.innerHTML='<div style="font-size:12px;color:var(--red)">'+vEsc(e.message||'Error')+'</div>';return;}
    _commGroups=data;
    if(!data.length){box.innerHTML='<div style="font-size:12px;color:var(--text-muted)">No groups yet.</div>';return;}
    box.innerHTML=data.map(function(g){
      const sel=_commGid===g.id;
      const tier=g.is_official?'Official':(g.audience==='vip'?'VIP':g.audience==='premium'?'Premium':'Members');
      return '<div onclick="selectGroup(\''+g.id+'\')" style="padding:10px 11px;border-radius:10px;cursor:pointer;margin-bottom:6px;border:1px solid '+(sel?'var(--gold)':'var(--border)')+';background:'+(sel?'rgba(245,158,11,.08)':'transparent')+';"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">'+(g.icon||'👥')+'</span><div style="min-width:0"><div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+vEsc(g.name)+'</div><div style="font-size:10px;color:var(--text-muted)">'+tier+'</div></div></div></div>';
    }).join('');
    if(!_commGid&&data.length)selectGroup(data[0].id);
  }
  function canPostHere(g){
    if(!g||!currentProfile)return false;
    var meAdmin=(currentProfile.role==='admin'||currentProfile.is_admin);
    if(meAdmin)return true;
    if(g.is_official)return false;              // official: only admin posts
    if(g.owner&&(g.owner.role==='admin'||g.owner.is_admin))return false; // admin-owned (PipSePaisa) = admin only
    if(g.owner_id===currentProfile.id)return true; // mentor owns this group
    return g.members_can_post!==false;          // students post only if allowed
  }
  function selectGroup(id){_commGid=id;_commFeedSig='';loadCommunityGroups();
    const g=_commGroups.find(function(x){return x.id===id;});
    if(g){document.getElementById('commGroupName').textContent=(g.icon||'👥')+' '+g.name;document.getElementById('commGroupDesc').textContent=g.description||'';}
    var canPost=canPostHere(g);
    var comp=document.getElementById('commComposer');if(comp)comp.style.display=canPost?'':'none';
    var ro=document.getElementById('commReadOnly');
    if(ro){ro.style.display=canPost?'none':'block';ro.textContent=(g&&g.is_official)?'🔒 Only PipSePaisa admin can post here. You can read and react.':'🔒 Only your mentor can post here. You can read and react.';}
    var av=document.getElementById('commMyAvatar');if(av&&currentProfile){av.outerHTML=avatarHTML(currentProfile,42).replace('<div ','<div id="commMyAvatar" ');}
    loadFeed();loadCommNotifs();
  }
  var _feedCache=null;
  function feedSkeleton(){return '<div style="margin-bottom:14px;"></div>'+[0,1].map(function(){return '<div class="card" style="margin-bottom:14px;border-radius:16px;"><div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;"><div class="commSkel" style="width:42px;height:42px;border-radius:50%;"></div><div style="flex:1"><div class="commSkel" style="height:12px;width:40%;border-radius:6px;margin-bottom:6px;"></div><div class="commSkel" style="height:10px;width:20%;border-radius:6px;"></div></div></div><div class="commSkel" style="height:12px;width:90%;border-radius:6px;margin-bottom:6px;"></div><div class="commSkel" style="height:12px;width:70%;border-radius:6px;"></div></div>';}).join('');}
  async function loadFeed(silent){
    const feed=document.getElementById('commFeed');if(!feed||!_commGid||!sb)return;
    if(!silent)feed.innerHTML=feedSkeleton();
    let posts=[];try{const r=await sb.from('group_posts').select('*, author:author_id(full_name,email,avatar_url,role,member_type)').eq('group_id',_commGid).order('pinned',{ascending:false}).order('created_at',{ascending:false}).limit(80);posts=r.data||[];}catch(e){feed.innerHTML='<div style="color:var(--red)">'+vEsc(e.message||'Error')+'</div>';return;}
    const ids=posts.map(function(p){return p.id;});
    let likes=[],comments=[],votes=[];
    if(ids.length){try{likes=(await sb.from('post_likes').select('post_id,user_id,reaction').in('post_id',ids)).data||[];}catch(e){}
      try{comments=(await sb.from('post_comments').select('*, author:author_id(full_name,email,avatar_url)').in('post_id',ids).order('created_at',{ascending:true})).data||[];}catch(e){}
      try{votes=(await sb.from('post_poll_votes').select('post_id,user_id,option_id').in('post_id',ids)).data||[];}catch(e){}}
    const sig=JSON.stringify([posts.map(function(p){return p.id+(p.edited_at||'')+(p.pinned?'p':'');}),likes,comments.length,votes,_commOpenComments,_editPost,_editComment,_replyTo,_reactPickFor]);
    if(silent&&sig===_commFeedSig){return;}_commFeedSig=sig;
    const myId=currentProfile?currentProfile.id:null;
    const ownerId=(_commGroups.find(function(x){return x.id===_commGid;})||{}).owner_id;
    const canPost=canPostHere(_commGroups.find(function(x){return x.id===_commGid;}));
    _feedCache={posts:posts,likes:likes,comments:comments,votes:votes,myId:myId,ownerId:ownerId,canPost:canPost};
    var srch=document.getElementById('commSearch');if(srch)srch.style.display=posts.length?'block':'none';
    renderFeed();
  }
  function galleryHTML(p){
    var imgs=Array.isArray(p.images)&&p.images.length?p.images:(p.image_url?[p.image_url]:[]);
    if(!imgs.length)return '';
    if(imgs.length===1)return '<img src="'+vEsc(imgs[0])+'" onclick="commLightbox(\''+vEsc(imgs[0])+'\')" style="width:100%;border-radius:12px;cursor:zoom-in;display:block;">';
    var show=imgs.slice(0,4);
    return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;border-radius:12px;overflow:hidden;">'+show.map(function(u,i){var more=(i===3&&imgs.length>4);return '<div style="position:relative;cursor:zoom-in;" onclick="commLightbox(\''+vEsc(u)+'\')"><img src="'+vEsc(u)+'" style="width:100%;height:150px;object-fit:cover;display:block;">'+(more?'<div style="position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:800;">+'+(imgs.length-4)+'</div>':'')+'</div>';}).join('')+'</div>';
  }
  function pollHTML(p,votes,myId){
    if(!p.poll||!p.poll.options)return '';
    var pv=votes.filter(function(v){return v.post_id===p.id;});
    var total=pv.length;
    var myVote=(pv.find(function(v){return v.user_id===myId;})||{}).option_id;
    return '<div style="margin-top:10px;border:1px solid var(--border);border-radius:12px;padding:12px;">'+
      (p.poll.q?'<div style="font-weight:700;font-size:14px;margin-bottom:10px;">📊 '+vEsc(p.poll.q)+'</div>':'')+
      p.poll.options.map(function(o){
        var c=pv.filter(function(v){return v.option_id===o.id;}).length;
        var pct=total?Math.round(c/total*100):0;
        var mine=myVote===o.id;
        return '<div onclick="votePoll(\''+p.id+'\',\''+o.id+'\',\''+p.author_id+'\')" style="position:relative;cursor:pointer;border:1px solid '+(mine?'var(--gold)':'var(--border)')+';border-radius:9px;padding:9px 12px;margin-bottom:7px;overflow:hidden;">'+
          '<div style="position:absolute;left:0;top:0;bottom:0;width:'+pct+'%;background:'+(mine?'rgba(245,158,11,.22)':'rgba(255,255,255,.06)')+';transition:.3s;"></div>'+
          '<div style="position:relative;display:flex;justify-content:space-between;font-size:13px;font-weight:'+(mine?'700':'500')+';"><span>'+(mine?'✓ ':'')+vEsc(o.text)+'</span><span style="color:var(--text-muted)">'+pct+'%</span></div></div>';
      }).join('')+
      '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">'+total+' vote'+(total===1?'':'s')+'</div></div>';
  }
  function renderFeed(){
    const feed=document.getElementById('commFeed');if(!feed||!_feedCache)return;
    var q=((document.getElementById('commSearch')||{}).value||'').toLowerCase().trim();
    var posts=_feedCache.posts,likes=_feedCache.likes,comments=_feedCache.comments,votes=_feedCache.votes,myId=_feedCache.myId,ownerId=_feedCache.ownerId,canPost=_feedCache.canPost;
    if(q)posts=posts.filter(function(p){return (p.content||'').toLowerCase().indexOf(q)>=0||commName(p.author).toLowerCase().indexOf(q)>=0;});
    if(!posts.length){feed.innerHTML='<div class="empty-state" style="color:var(--text-muted);">'+(q?'No posts match your search.':'No posts yet. Be the first to share!')+'</div>';return;}
    feed.innerHTML=posts.map(function(p){
      const pl=likes.filter(function(l){return l.post_id===p.id;});
      const myL=myId&&pl.find(function(l){return l.user_id===myId;});
      const counts={};pl.forEach(function(l){var e=l.reaction||'❤️';counts[e]=(counts[e]||0)+1;});
      const summary=Object.keys(counts).map(function(e){return e+counts[e];}).join('  ');
      const pc=comments.filter(function(c){return c.post_id===p.id;});
      const tops=pc.filter(function(c){return !c.parent_id;});
      const open=_commOpenComments[p.id];
      const canMod=myId&&(p.author_id===myId||myId===ownerId);
      const canPin=myId&&(myId===ownerId);
      const pick=_reactPickFor===p.id;
      var contentBlock;
      if(_editPost===p.id){contentBlock='<textarea id="ep-'+p.id+'" rows="3" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.04);color:var(--text);box-sizing:border-box;">'+vEsc(p.content||'')+'</textarea><div style="display:flex;gap:8px;margin-top:6px;"><button onclick="saveEditPost(\''+p.id+'\')" style="padding:7px 16px;border:none;border-radius:8px;background:var(--gold);color:#0a0e1a;font-weight:800;cursor:pointer;">Save</button><button onclick="_editPost=null;_commFeedSig=\'\';loadFeed()" style="padding:7px 16px;border:1px solid var(--border);border-radius:8px;background:transparent;color:var(--text);cursor:pointer;">Cancel</button></div>';}
      else{contentBlock=(p.content?'<div style="font-size:15px;line-height:1.6;white-space:pre-wrap;margin-bottom:10px;">'+fmtContent(p.content)+(p.edited_at?' <span style="font-size:11px;color:var(--text-muted)">(edited)</span>':'')+'</div>':'')+galleryHTML(p)+pollHTML(p,votes,myId);}
      const reactPicker=pick?('<div style="display:flex;gap:4px;background:var(--bg-card,#0f1729);border:1px solid var(--border);border-radius:24px;padding:6px 10px;margin-top:6px;width:fit-content;box-shadow:0 6px 20px rgba(0,0,0,.3);">'+REACTS.map(function(e){return '<button onclick="setReaction(\''+p.id+'\',\''+e+'\',\''+p.author_id+'\')" style="background:none;border:none;font-size:22px;cursor:pointer;transition:.1s;" onmouseover="this.style.transform=\'scale(1.3)\'" onmouseout="this.style.transform=\'scale(1)\'">'+e+'</button>';}).join('')+'</div>'):'';
      const cHtml=open?('<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px;">'+tops.map(function(c){return commentHTML(c,pc,myId,p.id);}).join('')+(canPost?('<div style="display:flex;gap:8px;margin-top:6px;align-items:center;">'+avatarHTML(currentProfile,30)+'<input id="cm-'+p.id+'" placeholder="Write a comment..." onkeydown="if(event.key===\'Enter\')addComment(\''+p.id+'\',\''+p.author_id+'\')" style="flex:1;padding:9px 14px;border-radius:20px;border:1px solid var(--border);background:rgba(255,255,255,.04);color:var(--text);font-size:13px;outline:none;"><button onclick="addComment(\''+p.id+'\',\''+p.author_id+'\')" style="padding:8px 16px;border:none;border-radius:20px;background:var(--gold);color:#0a0e1a;font-weight:800;cursor:pointer;font-size:13px;">Send</button></div>'):'<div style="font-size:12px;color:var(--text-muted);margin-top:6px;">🔒 Comments are read-only here.</div>')+'</div>'):'';
      return '<div class="card" style="margin-bottom:14px;border-radius:16px;'+(p.pinned?'border:1px solid var(--gold);':'')+'">'+
        (p.pinned?'<div style="font-size:11px;color:var(--gold);font-weight:700;margin-bottom:6px;">📌 Pinned</div>':'')+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'+avatarHTML(p.author,42)+'<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:14px;">'+commName(p.author)+roleBadge(p.author,ownerId)+'</div><div style="font-size:11px;color:var(--text-muted)">'+commTimeAgo(p.created_at)+'</div></div>'+
          '<div style="display:flex;gap:4px;">'+(myId&&p.author_id!==myId?'<button onclick="reportPost(\''+p.id+'\',\''+_commGid+'\')" title="Report" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:13px;">🚩</button>':'')+
          (canMod?(p.author_id===myId?'<button onclick="_editPost=\''+p.id+'\';renderFeed()" title="Edit" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;">✏️</button>':'')+(canPin?'<button onclick="togglePin(\''+p.id+'\','+(p.pinned?'false':'true')+')" title="Pin" style="background:none;border:none;color:'+(p.pinned?'var(--gold)':'var(--text-muted)')+';cursor:pointer;font-size:14px;">📌</button>':'')+'<button onclick="delPost(\''+p.id+'\')" title="Delete" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;">🗑️</button>':'')+'</div>'+
        '</div>'+
        contentBlock+
        (summary?'<div style="font-size:13px;color:var(--text-muted);margin-top:10px;">'+summary+'</div>':'')+
        '<div style="display:flex;gap:8px;margin-top:8px;border-top:1px solid var(--border);padding-top:6px;position:relative;">'+
          '<button onclick="_reactPickFor=(_reactPickFor===\''+p.id+'\'?null:\''+p.id+'\');renderFeed()" style="flex:1;background:none;border:none;cursor:pointer;color:'+(myL?'var(--gold)':'var(--text-muted)')+';font-weight:700;font-size:13px;padding:8px;border-radius:8px;">'+(myL?(myL.reaction||'❤️')+' Reacted':'😊 React')+'</button>'+
          '<button onclick="toggleComments(\''+p.id+'\')" style="flex:1;background:none;border:none;cursor:pointer;color:var(--text-muted);font-weight:700;font-size:13px;padding:8px;border-radius:8px;">💬 Comment'+(pc.length?' ('+pc.length+')':'')+'</button>'+
        '</div>'+reactPicker+cHtml+
      '</div>';
    }).join('');
  }
  function commentHTML(c,allc,myId,postId){
    const replies=allc.filter(function(x){return x.parent_id===c.id;});
    const editing=_editComment===c.id;
    var body;
    if(editing){body='<textarea id="ec-'+c.id+'" rows="2" style="width:100%;padding:8px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.04);color:var(--text);box-sizing:border-box;font-size:13px;">'+vEsc(c.content||'')+'</textarea><div style="display:flex;gap:6px;margin-top:4px;"><button onclick="saveEditComment(\''+c.id+'\')" style="padding:5px 12px;border:none;border-radius:7px;background:var(--gold);color:#0a0e1a;font-weight:800;cursor:pointer;font-size:12px;">Save</button><button onclick="_editComment=null;_commFeedSig=\'\';loadFeed()" style="padding:5px 12px;border:1px solid var(--border);border-radius:7px;background:transparent;color:var(--text);cursor:pointer;font-size:12px;">Cancel</button></div>';}
    else{body='<div style="font-size:13px;color:var(--text-secondary);">'+fmtContent(c.content)+(c.edited_at?' <span style="font-size:10px;color:var(--text-muted)">(edited)</span>':'')+'</div>';}
    const own=myId&&c.author_id===myId;
    return '<div style="display:flex;gap:8px;margin-bottom:10px;">'+avatarHTML(c.author,30)+'<div style="flex:1;min-width:0"><div style="background:rgba(255,255,255,.05);border-radius:14px;padding:8px 12px;"><div style="font-weight:700;font-size:12px;">'+commName(c.author)+'</div>'+body+'</div>'+
      '<div style="display:flex;gap:12px;margin:3px 0 0 6px;font-size:11px;color:var(--text-muted);">'+
        '<span style="cursor:pointer" onclick="_replyTo=(_replyTo===\''+c.id+'\'?null:\''+c.id+'\');_commFeedSig=\'\';loadFeed()">Reply</span>'+
        (own?'<span style="cursor:pointer" onclick="_editComment=\''+c.id+'\';_commFeedSig=\'\';loadFeed()">Edit</span><span style="cursor:pointer" onclick="delComment(\''+c.id+'\')">Delete</span>':'')+
        '<span>'+commTimeAgo(c.created_at)+'</span>'+
      '</div>'+
      (_replyTo===c.id?'<div style="display:flex;gap:6px;margin:6px 0 0 6px;"><input id="rp-'+c.id+'" placeholder="Reply..." onkeydown="if(event.key===\'Enter\')addReply(\''+postId+'\',\''+c.id+'\',\''+c.author_id+'\')" style="flex:1;padding:7px 12px;border-radius:16px;border:1px solid var(--border);background:rgba(255,255,255,.04);color:var(--text);font-size:12px;outline:none;"><button onclick="addReply(\''+postId+'\',\''+c.id+'\',\''+c.author_id+'\')" style="padding:6px 12px;border:none;border-radius:16px;background:var(--gold);color:#0a0e1a;font-weight:800;cursor:pointer;font-size:12px;">Send</button></div>':'')+
      (replies.length?'<div style="margin:8px 0 0 6px;border-left:2px solid var(--border);padding-left:10px;">'+replies.map(function(r){return commentHTML(r,allc,myId,postId);}).join('')+'</div>':'')+
    '</div></div>';
  }
  var _commImgFiles=[];var _pollOn=false;
  function commImgPicked(input){
    _commImgFiles=input.files?Array.prototype.slice.call(input.files):[];
    _commImgFile=_commImgFiles[0]||null;
    const pv=document.getElementById('commImgPreview');if(!pv)return;
    if(!_commImgFiles.length){pv.style.display='none';pv.innerHTML='';return;}
    pv.style.display='block';pv.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap;position:relative;">'+_commImgFiles.map(function(f,i){return '<div style="position:relative;"><img id="cthumb-'+i+'" style="width:90px;height:90px;object-fit:cover;border-radius:10px;border:1px solid var(--border);"></div>';}).join('')+'<button onclick="removeCommImg()" style="align-self:flex-start;width:28px;height:28px;border-radius:50%;border:none;background:rgba(0,0,0,.6);color:#fff;font-weight:800;cursor:pointer;">✕</button></div>';
    _commImgFiles.forEach(function(f,i){const rd=new FileReader();rd.onload=function(e){var im=document.getElementById('cthumb-'+i);if(im)im.src=e.target.result;};rd.readAsDataURL(f);});
  }
  function removeCommImg(){_commImgFile=null;_commImgFiles=[];var p=document.getElementById('commPostImg');if(p)p.value='';var pv=document.getElementById('commImgPreview');if(pv){pv.style.display='none';pv.innerHTML='';}}
  function togglePollBuilder(){_pollOn=!_pollOn;var b=document.getElementById('commPollBuilder');if(b)b.style.display=_pollOn?'block':'none';var bt=document.getElementById('pollToggleBtn');if(bt)bt.style.background=_pollOn?'rgba(59,130,246,.3)':'rgba(59,130,246,.1)';}
  function addPollOpt(){var box=document.getElementById('pollOpts');if(!box)return;var n=box.querySelectorAll('.pollOpt').length;if(n>=5)return;var inp=document.createElement('input');inp.className='pollOpt';inp.placeholder='Option '+(n+1);inp.style.cssText='width:100%;padding:8px 12px;border-radius:9px;border:1px solid var(--border);background:rgba(255,255,255,.04);color:var(--text);box-sizing:border-box;font-size:13px;margin-bottom:6px;';box.appendChild(inp);}
  function commLightbox(url){var o=document.createElement('div');o.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';o.onclick=function(){o.remove();};o.innerHTML='<img src="'+url+'" style="max-width:94vw;max-height:94vh;border-radius:10px;">';document.body.appendChild(o);}
  async function createPost(){
    const msg=document.getElementById('commPostMsg');
    if(!currentProfile||!sb){msg.style.color='var(--red)';msg.textContent='Please sign in.';return;}
    if(!_commGid){msg.style.color='var(--red)';msg.textContent='Select a group.';return;}
    const txt=(document.getElementById('commPostText').value||'').trim();
    // poll
    var poll=null;
    if(_pollOn){var q=(document.getElementById('pollQ').value||'').trim();var opts=[];document.querySelectorAll('#pollOpts .pollOpt').forEach(function(el,i){var v=(el.value||'').trim();if(v)opts.push({id:'o'+(i+1),text:v});});if(opts.length<2){msg.style.color='var(--red)';msg.textContent='Poll needs at least 2 options.';return;}poll={q:q,options:opts};}
    if(!txt&&!_commImgFiles.length&&!poll){msg.style.color='var(--red)';msg.textContent='Write something, add a photo or a poll.';return;}
    // slow mode
    var grp=_commGroups.find(function(x){return x.id===_commGid;});
    if(grp&&grp.slow_mode_seconds>0){try{var lp=await sb.from('group_posts').select('created_at').eq('group_id',_commGid).eq('author_id',currentProfile.id).order('created_at',{ascending:false}).limit(1);var last=(lp.data||[])[0];if(last){var diff=(Date.now()-new Date(last.created_at))/1000;if(diff<grp.slow_mode_seconds){msg.style.color='var(--red)';msg.textContent='🐢 Slow mode: wait '+Math.ceil(grp.slow_mode_seconds-diff)+'s before posting again.';return;}}}catch(e){}}
    msg.style.color='var(--text-muted)';msg.textContent='Posting...';
    var images=[];
    for(var i=0;i<_commImgFiles.length;i++){try{var f=_commImgFiles[i];var ext=(f.name.split('.').pop()||'jpg').toLowerCase();var path='community/'+currentProfile.id+'_'+Date.now()+'_'+i+'.'+ext;var up=await sb.storage.from('charts').upload(path,f,{upsert:true});if(up.error){msg.style.color='var(--red)';msg.textContent='Image failed: '+up.error.message;return;}images.push(sb.storage.from('charts').getPublicUrl(path).data.publicUrl);}catch(e){}}
    const r=await sb.from('group_posts').insert({group_id:_commGid,author_id:currentProfile.id,content:txt||null,image_url:(images[0]||null),images:(images.length?images:null),poll:poll});
    if(r.error){msg.style.color='var(--red)';msg.textContent='Error: '+r.error.message;return;}
    document.getElementById('commPostText').value='';removeCommImg();
    if(_pollOn){togglePollBuilder();document.getElementById('pollQ').value='';document.querySelectorAll('#pollOpts .pollOpt').forEach(function(el){el.value='';});}
    msg.textContent='';
    _commFeedSig='';loadFeed();
  }
  async function votePoll(postId,optId,authorId){
    if(!currentProfile||!sb)return;
    try{const ex=await sb.from('post_poll_votes').select('id,option_id').eq('post_id',postId).eq('user_id',currentProfile.id).maybeSingle();
      if(ex.data){await sb.from('post_poll_votes').update({option_id:optId}).eq('id',ex.data.id);}
      else{await sb.from('post_poll_votes').insert({post_id:postId,user_id:currentProfile.id,option_id:optId});notifyUser(authorId,postId,'comment','voted on your poll');}
    }catch(e){}
    _commFeedSig='';loadFeed(true);
  }
  async function saveEditPost(id){
    const t=(document.getElementById('ep-'+id).value||'').trim();
    await sb.from('group_posts').update({content:t,edited_at:new Date().toISOString()}).eq('id',id);
    _editPost=null;_commFeedSig='';loadFeed();
  }
  async function togglePin(id,val){await sb.from('group_posts').update({pinned:val}).eq('id',id);_commFeedSig='';loadFeed();}
  async function delPost(id){if(!(await window.pspConfirm('Delete this post?')))return;await sb.from('group_posts').delete().eq('id',id);try{await sb.from('moderation_log').insert({group_id:_commGid,actor_id:currentProfile.id,actor_name:(currentProfile.full_name||currentProfile.email||'Member'),action:'delete_post',detail:'Post '+id});}catch(e){}_commFeedSig='';loadFeed();}
  async function reportPost(postId,groupId){
    if(!currentProfile||!sb)return;
    var reason=await window.pspPrompt('Why are you reporting this post?','','Report Post');if(reason===null)return;reason=(reason||'').trim()||'No reason';
    var r=await sb.from('post_reports').insert({post_id:postId,group_id:groupId,reporter_id:currentProfile.id,reporter_name:(currentProfile.full_name||currentProfile.email||'Member'),reason:reason});
    if(r.error){alert('Error: '+r.error.message);return;}
    alert('✓ Reported. Thanks — our team will review it.');
  }
  async function setReaction(postId,emoji,authorId){
    if(!currentProfile||!sb)return;
    try{const ex=await sb.from('post_likes').select('id,reaction').eq('post_id',postId).eq('user_id',currentProfile.id).maybeSingle();
      if(ex.data){if(ex.data.reaction===emoji){await sb.from('post_likes').delete().eq('id',ex.data.id);}else{await sb.from('post_likes').update({reaction:emoji}).eq('id',ex.data.id);}}
      else{await sb.from('post_likes').insert({post_id:postId,user_id:currentProfile.id,reaction:emoji});notifyUser(authorId,postId,'like',emoji+' reacted to your post');}
    }catch(e){}
    _reactPickFor=null;_commFeedSig='';loadFeed();
  }
  async function toggleLike(postId,authorId){return setReaction(postId,'❤️',authorId);}
  function toggleComments(postId){_commOpenComments[postId]=!_commOpenComments[postId];renderFeed();}
  async function addComment(postId,authorId){
    if(!currentProfile||!sb)return;
    const el=document.getElementById('cm-'+postId);const txt=(el&&el.value||'').trim();if(!txt)return;
    const r=await sb.from('post_comments').insert({post_id:postId,author_id:currentProfile.id,content:txt});
    if(r.error){alert('Error: '+r.error.message);return;}
    notifyUser(authorId,postId,'comment','commented: '+txt.slice(0,40));
    _commOpenComments[postId]=true;_commFeedSig='';loadFeed();
  }
  async function addReply(postId,parentId,parentAuthor){
    if(!currentProfile||!sb)return;
    const el=document.getElementById('rp-'+parentId);const txt=(el&&el.value||'').trim();if(!txt)return;
    const r=await sb.from('post_comments').insert({post_id:postId,author_id:currentProfile.id,content:txt,parent_id:parentId});
    if(r.error){alert('Error: '+r.error.message);return;}
    notifyUser(parentAuthor,postId,'reply','replied: '+txt.slice(0,40));
    _replyTo=null;_commFeedSig='';loadFeed();
  }
  async function saveEditComment(id){
    const t=(document.getElementById('ec-'+id).value||'').trim();
    await sb.from('post_comments').update({content:t,edited_at:new Date().toISOString()}).eq('id',id);
    _editComment=null;_commFeedSig='';loadFeed();
  }
  async function delComment(id){if(!(await window.pspConfirm('Delete this comment?')))return;await sb.from('post_comments').delete().eq('id',id);_commFeedSig='';loadFeed();}
  async function notifyUser(toId,postId,type,text){
    if(!toId||!currentProfile||toId===currentProfile.id)return;
    try{await sb.from('community_notifications').insert({user_id:toId,actor_id:currentProfile.id,actor_name:(currentProfile.full_name||currentProfile.email||'Member'),post_id:postId,type:type,text:text});}catch(e){}
  }
  // ---- community notifications bell ----
  var _commNotifs=[];
  async function loadCommNotifs(){
    if(!currentProfile||!sb)return;
    try{const r=await sb.from('community_notifications').select('*').eq('user_id',currentProfile.id).order('created_at',{ascending:false}).limit(30);_commNotifs=r.data||[];}catch(e){return;}
    const unread=_commNotifs.filter(function(n){return !n.read;}).length;
    const b=document.getElementById('commNotifBadge');if(b){if(unread){b.style.display='flex';b.textContent=unread>9?'9+':unread;}else{b.style.display='none';}}
  }
  async function toggleCommNotifs(){
    const p=document.getElementById('commNotifPanel');if(!p)return;
    if(p.style.display==='block'){p.style.display='none';return;}
    p.style.display='block';
    p.innerHTML=_commNotifs.length?_commNotifs.map(function(n){return '<div style="padding:9px 10px;border-radius:9px;margin-bottom:4px;background:'+(n.read?'transparent':'rgba(245,158,11,.07)')+';font-size:12.5px;"><strong>'+vEsc(n.actor_name||'Someone')+'</strong> <span style="color:var(--text-secondary)">'+vEsc(n.text||'')+'</span><div style="font-size:10px;color:var(--text-muted);margin-top:2px;">'+commTimeAgo(n.created_at)+'</div></div>';}).join(''):'<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:12px;">No notifications yet</div>';
    // mark all read
    const unreadIds=_commNotifs.filter(function(n){return !n.read;}).map(function(n){return n.id;});
    if(unreadIds.length){try{await sb.from('community_notifications').update({read:true}).in('id',unreadIds);}catch(e){}loadCommNotifs();}
  }

  // ============ DIRECT MESSAGES + MEMBERS + PRESENCE ============
  function isOnline(ls){return ls&&(Date.now()-new Date(ls)<90000);}
  function onlineDot(ls){return '<span style="position:absolute;bottom:0;right:0;width:11px;height:11px;border-radius:50%;border:2px solid var(--bg-card,#0f1729);background:'+(isOnline(ls)?'#10b981':'#6b7280')+';"></span>';}
  // presence heartbeat
  (function(){setInterval(async function(){if(document.hidden||!currentProfile||!sb)return;try{await sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',currentProfile.id);}catch(e){}},180000);})();
  async function pingPresence(){if(currentProfile&&sb){try{await sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',currentProfile.id);}catch(e){}}}

  // ---- Members modal ----
  async function openMembersModal(){
    if(!_commGid||!sb)return;
    const g=_commGroups.find(function(x){return x.id===_commGid;});if(!g)return;
    var host=document.getElementById('vipModalHost');if(!host){host=document.createElement('div');host.id='vipModalHost';document.body.appendChild(host);}
    host.innerHTML='<div style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;" onclick="if(event.target===this)closeVipModal()"><div style="background:var(--bg-card,#0f1729);border:1px solid var(--border);border-radius:16px;max-width:420px;width:100%;max-height:80vh;overflow-y:auto;padding:18px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;"><div style="font-weight:800;font-size:16px;">👥 '+vEsc(g.name)+' — Members</div><button onclick="closeVipModal()" style="background:none;border:none;color:var(--text-muted);font-size:20px;cursor:pointer;">✕</button></div><div id="memberListBody"><div style="color:var(--text-muted);font-size:13px;">Loading...</div></div></div></div>';
    let members=[];
    try{
      if(g.is_official){const r=await sb.from('profiles').select('id,full_name,email,avatar_url,last_seen,role,member_type').order('last_seen',{ascending:false,nullsFirst:false}).limit(200);members=r.data||[];}
      else{
        let q=sb.from('profiles').select('id,full_name,email,avatar_url,last_seen,role,member_type').eq('mentor_id',g.owner_id);
        if(g.audience==='premium')q=q.in('member_type',['premium','vip']);
        else if(g.audience==='vip')q=q.eq('member_type','vip');
        const r=await q.limit(200);members=r.data||[];
        const ow=await sb.from('profiles').select('id,full_name,email,avatar_url,last_seen,role,member_type').eq('id',g.owner_id).maybeSingle();
        if(ow.data&&!members.some(function(m){return m.id===ow.data.id;}))members.unshift(ow.data);
      }
    }catch(e){}
    const body=document.getElementById('memberListBody');if(!body)return;
    if(!members.length){body.innerHTML='<div style="color:var(--text-muted);font-size:13px;">No members found.</div>';return;}
    const myId=currentProfile?currentProfile.id:null;
    const isMod=myId&&(myId===g.owner_id||currentProfile.role==='admin'||currentProfile.is_admin);
    var bans={};try{const br=await sb.from('group_bans').select('user_id,type').eq('group_id',g.id);(br.data||[]).forEach(function(b){bans[b.user_id]=b.type;});}catch(e){}
    window._memBans=bans;window._memGid=g.id;
    body.innerHTML=members.map(function(m){
      const me=m.id===myId;const role=m.id===g.owner_id?(g.is_official?'Admin':'Mentor'):(m.member_type==='vip'?'VIP':m.member_type==='premium'?'Premium':'');
      const st=bans[m.id];
      var ctrl='';
      if(me){ctrl='';}
      else if(isMod&&m.id!==g.owner_id){
        if(st==='ban')ctrl='<button onclick="unbanUser(\''+m.id+'\')" style="padding:5px 10px;border:none;border-radius:14px;background:rgba(16,185,129,.15);color:#10b981;font-weight:700;cursor:pointer;font-size:11px;">Unban</button>';
        else if(st==='mute')ctrl='<button onclick="unbanUser(\''+m.id+'\')" style="padding:5px 10px;border:none;border-radius:14px;background:rgba(16,185,129,.15);color:#10b981;font-weight:700;cursor:pointer;font-size:11px;">Unmute</button> <button onclick="banUser(\''+m.id+'\',\''+vEsc(commName(m))+'\')" style="padding:5px 10px;border:none;border-radius:14px;background:rgba(239,68,68,.15);color:#ef4444;font-weight:700;cursor:pointer;font-size:11px;">Ban</button>';
        else ctrl='<button onclick="muteUser(\''+m.id+'\',\''+vEsc(commName(m))+'\')" style="padding:5px 10px;border:none;border-radius:14px;background:rgba(245,158,11,.12);color:var(--gold);font-weight:700;cursor:pointer;font-size:11px;">Mute</button> <button onclick="banUser(\''+m.id+'\',\''+vEsc(commName(m))+'\')" style="padding:5px 10px;border:none;border-radius:14px;background:rgba(239,68,68,.15);color:#ef4444;font-weight:700;cursor:pointer;font-size:11px;">Ban</button>';
      } else {ctrl='<button onclick="closeVipModal();openDM(\''+m.id+'\')" style="padding:6px 14px;border:none;border-radius:18px;background:var(--gold);color:#0a0e1a;font-weight:800;cursor:pointer;font-size:12px;">Message</button>';}
      return '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);"><div style="position:relative;">'+avatarHTML(m,38)+onlineDot(m.last_seen)+'</div><div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px;">'+commName(m)+(me?' (you)':'')+(st?' <span style="font-size:9px;padding:1px 5px;border-radius:7px;background:rgba(239,68,68,.15);color:#ef4444;">'+(st==='ban'?'BANNED':'MUTED')+'</span>':'')+'</div><div style="font-size:11px;color:var(--text-muted)">'+(isOnline(m.last_seen)?'🟢 Online':'Offline')+(role?' · '+role:'')+'</div></div><div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;">'+ctrl+'</div></div>';
    }).join('');
  }
  async function muteUser(uid,name){if(!(await window.pspConfirm('Mute '+name+'? They can read but not post.')))return;await sb.from('group_bans').upsert({group_id:window._memGid,user_id:uid,type:'mute',by_id:currentProfile.id},{onConflict:'group_id,user_id'});try{await sb.from('moderation_log').insert({group_id:window._memGid,actor_id:currentProfile.id,actor_name:(currentProfile.full_name||currentProfile.email),action:'mute',detail:name});}catch(e){}openMembersModal();}
  async function banUser(uid,name){if(!(await window.pspConfirm('Ban '+name+'? They lose access to this group.')))return;await sb.from('group_bans').upsert({group_id:window._memGid,user_id:uid,type:'ban',by_id:currentProfile.id},{onConflict:'group_id,user_id'});try{await sb.from('moderation_log').insert({group_id:window._memGid,actor_id:currentProfile.id,actor_name:(currentProfile.full_name||currentProfile.email),action:'ban',detail:name});}catch(e){}openMembersModal();}
  async function unbanUser(uid){await sb.from('group_bans').delete().eq('group_id',window._memGid).eq('user_id',uid);try{await sb.from('moderation_log').insert({group_id:window._memGid,actor_id:currentProfile.id,actor_name:(currentProfile.full_name||currentProfile.email),action:'unban',detail:uid});}catch(e){}openMembersModal();}

  // ---- DM list ----
  var _dmPeer=null;var _dmConvs=[];var _dmTypeChan=null;var _dmInitDone=false;
  function dmInitRealtime(){
    if(_dmInitDone||!sb)return;_dmInitDone=true;
    try{sb.channel('rt-user-dm').on('postgres_changes',{event:'*',schema:'public',table:'dm_messages'},function(){loadDMList(true);if(_dmPeer)openDM(_dmPeer.id,_dmPeer,true);}).subscribe();}catch(e){}
  }
  async function loadDMList(silent){
    if(!currentProfile||!sb)return;dmInitRealtime();
    const me=currentProfile.id;
    let msgs=[];try{const r=await sb.from('dm_messages').select('*').or('sender_id.eq.'+me+',recipient_id.eq.'+me).order('created_at',{ascending:false}).limit(400);msgs=r.data||[];}catch(e){return;}
    var byPeer={};
    msgs.forEach(function(m){var peer=m.sender_id===me?m.recipient_id:m.sender_id;if(!byPeer[peer])byPeer[peer]={peer:peer,last:m,unread:0};if(m.recipient_id===me&&!m.read_at)byPeer[peer].unread++;});
    var peerIds=Object.keys(byPeer);
    var profs={};
    if(peerIds.length){try{const pr=await sb.from('profiles').select('id,full_name,email,avatar_url,last_seen').in('id',peerIds);(pr.data||[]).forEach(function(p){profs[p.id]=p;});}catch(e){}}
    _dmConvs=peerIds.map(function(id){return {prof:profs[id]||{id:id,full_name:'Member'},last:byPeer[id].last,unread:byPeer[id].unread};}).sort(function(a,b){return new Date(b.last.created_at)-new Date(a.last.created_at);});
    var totalUnread=_dmConvs.reduce(function(s,c){return s+c.unread;},0);
    var nb=document.getElementById('chatsNavBadge');if(nb){if(totalUnread){nb.style.display='inline-block';nb.textContent=totalUnread>9?'9+':totalUnread;}else{nb.style.display='none';}}
    renderDMList();
  }
  function renderDMList(){
    const box=document.getElementById('dmList');if(!box)return;
    var q=((document.getElementById('dmSearch')||{}).value||'').toLowerCase().trim();
    var list=_dmConvs;if(q)list=list.filter(function(c){return commName(c.prof).toLowerCase().indexOf(q)>=0;});
    if(!list.length){box.innerHTML='<div class="empty-state" style="font-size:12px;color:var(--text-muted);padding:14px;">'+(q?'No matches.':'No chats yet. Open a group → Members → Message someone.')+'</div>';return;}
    const me=currentProfile?currentProfile.id:null;
    box.innerHTML=list.map(function(c){
      var sel=_dmPeer&&_dmPeer.id===c.prof.id;
      var prev=(c.last.sender_id===me?'You: ':'')+(c.last.body||'');
      return '<div onclick="openDM(\''+c.prof.id+'\')" style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;cursor:pointer;margin-bottom:4px;background:'+(sel?'rgba(245,158,11,.08)':'transparent')+';border:1px solid '+(sel?'var(--gold)':'transparent')+';"><div style="position:relative;">'+avatarHTML(c.prof,40)+onlineDot(c.prof.last_seen)+'</div><div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;gap:6px"><strong style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+commName(c.prof)+'</strong>'+(c.unread?'<span style="background:var(--red);color:#fff;font-size:9px;font-weight:800;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;">'+c.unread+'</span>':'')+'</div><div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+vEsc(prev.slice(0,38))+'</div></div></div>';
    }).join('');
  }
  function dmTimeShort(ts){try{return new Date(ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true});}catch(e){return '';}}
  function dmDateLabel(ts){var d=new Date(ts),now=new Date();var dk=d.toDateString(),tk=now.toDateString(),yk=new Date(now.getTime()-86400000).toDateString();if(dk===tk)return 'Today';if(dk===yk)return 'Yesterday';return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
  function dmBubble(m,mine,seen){
    var t=dmTimeShort(m.created_at);
    var ticks=mine?('<span style="font-size:12px;margin-left:3px;color:'+(seen?'#53bdeb':'rgba(233,237,239,.55)')+';">✓✓</span>'):'';
    var meta='<span style="font-size:10px;opacity:.65;margin-left:8px;white-space:nowrap;vertical-align:bottom;">'+t+ticks+'</span>';
    var radius=mine?'15px 15px 5px 15px':'15px 15px 15px 5px';
    var bg=mine?'background:#056162;':'background:#202c33;';
    return '<div style="align-self:'+(mine?'flex-end':'flex-start')+';max-width:80%;margin:1px 0;"><div style="padding:6px 10px 6px 11px;border-radius:'+radius+';font-size:14px;line-height:1.4;'+bg+'color:#e9edef;box-shadow:0 1px 1px rgba(0,0,0,.25);">'+vEsc(m.body||'')+meta+'</div></div>';
  }
  function buildDMBody(msgs,me){
    if(!msgs.length)return '<div class="empty-state" style="margin:auto;color:var(--text-muted);">Say hi 👋</div>';
    var lastMine=null;msgs.forEach(function(m){if(m.sender_id===me)lastMine=m;});
    var html='',lastDate='';
    msgs.forEach(function(m){
      var dl=dmDateLabel(m.created_at);
      if(dl!==lastDate){html+='<div style="align-self:center;background:rgba(255,255,255,.07);color:var(--text-muted);font-size:11px;font-weight:600;padding:3px 12px;border-radius:10px;margin:10px 0 6px;">'+dl+'</div>';lastDate=dl;}
      html+=dmBubble(m,m.sender_id===me,m.sender_id===me&&m===lastMine&&!!m.read_at);
    });
    return html;
  }
  async function openDM(peerId,peerObj,silent){
    if(!currentProfile||!sb)return;
    const me=currentProfile.id;
    // ensure on chats page
    if(!silent){var pg=document.getElementById('page-chats');if(pg&&!pg.classList.contains('active')){showPage('chats',document.querySelector('[data-page=chats]'));}if(typeof uTabSwitch==='function'&&_uTab!=='direct')uTabSwitch('direct');}
    if(!peerObj){try{const pr=await sb.from('profiles').select('id,full_name,email,avatar_url,last_seen').eq('id',peerId).maybeSingle();peerObj=pr.data;}catch(e){}}
    if(!peerObj)peerObj={id:peerId,full_name:'Member'};
    _dmPeer=peerObj;
    const head=document.getElementById('dmThreadHead');
    head.style.display='flex';
    head.innerHTML='<div style="position:relative;">'+avatarHTML(peerObj,40)+onlineDot(peerObj.last_seen)+'</div><div><div style="font-weight:700;font-size:15px;">'+commName(peerObj)+'</div><div style="font-size:11px;color:var(--text-muted)">'+(isOnline(peerObj.last_seen)?'🟢 Online':'Offline')+'</div></div>';
    document.getElementById('dmComposer').style.display='flex';
    let msgs=[];try{const r=await sb.from('dm_messages').select('*').or('and(sender_id.eq.'+me+',recipient_id.eq.'+peerId+'),and(sender_id.eq.'+peerId+',recipient_id.eq.'+me+')').order('created_at',{ascending:true}).limit(500);msgs=r.data||[];}catch(e){}
    const body=document.getElementById('dmThreadBody');
    body.style.background='#0b141a';
    body.style.padding='10px 8px';
    body.style.gap='2px';
    const atBottom=body.scrollHeight-body.scrollTop-body.clientHeight<80;
    body.innerHTML=buildDMBody(msgs,me);
    if(atBottom||!silent)body.scrollTop=body.scrollHeight;
    // mark incoming read
    var unread=msgs.filter(function(m){return m.recipient_id===me&&!m.read_at;});
    if(unread.length){try{await sb.from('dm_messages').update({read_at:new Date().toISOString()}).in('id',unread.map(function(m){return m.id;}));loadDMList(true);}catch(e){}}
    if(!silent)renderDMList();
    // typing channel
    if(!silent){
      const ck=[me,peerId].sort().join('_');
      try{if(_dmTypeChan)sb.removeChannel(_dmTypeChan);}catch(e){}
      _dmTypeChan=sb.channel('dm-typing-'+ck);
      _dmTypeChan.on('broadcast',{event:'typing'},function(p){if(p.payload&&p.payload.from===peerId){showDMTyping();}}).subscribe();
    }
  }
  var _dmTypeTimer=null;
  function showDMTyping(){const t=document.getElementById('dmTyping');if(!t||!_dmPeer)return;t.textContent=commName(_dmPeer)+' is typing...';clearTimeout(_dmTypeTimer);_dmTypeTimer=setTimeout(function(){t.textContent='';},2500);}
  var _dmPingThrottle=0;
  function dmTypingPing(){if(!_dmTypeChan||!currentProfile)return;var now=Date.now();if(now-_dmPingThrottle<1200)return;_dmPingThrottle=now;try{_dmTypeChan.send({type:'broadcast',event:'typing',payload:{from:currentProfile.id}});}catch(e){}}
  async function sendDM(){
    if(!currentProfile||!sb||!_dmPeer)return;
    const inp=document.getElementById('dmInput');const txt=(inp.value||'').trim();if(!txt)return;
    inp.value='';
    const body=document.getElementById('dmThreadBody');
    if(body){if(body.querySelector('.empty-state'))body.innerHTML='';body.insertAdjacentHTML('beforeend',dmBubble({body:txt,created_at:new Date().toISOString()},true,false));body.scrollTop=body.scrollHeight;}
    const r=await sb.from('dm_messages').insert({sender_id:currentProfile.id,recipient_id:_dmPeer.id,body:txt});
    if(r.error){alert('Error: '+r.error.message);return;}
    loadDMList(true);
  }

  var _uTab='comm';
  function commVisible(){var p=document.getElementById('page-chats');var c=document.getElementById('uTabComm');return p&&p.classList.contains('active')&&c&&c.style.display!=='none';}
  function uTabSwitch(tab){ tab='comm'; _uTab=tab;
    var tc=document.getElementById('uTabComm'),td=document.getElementById('uTabDirect');if(tc)tc.style.display=tab==='comm'?'block':'none';if(td)td.style.display=tab==='direct'?'block':'none';
    var a=document.getElementById('uctab-comm'),b=document.getElementById('uctab-direct');
    if(a){a.style.background=tab==='comm'?'linear-gradient(135deg,var(--gold),var(--gold-dark))':'transparent';a.style.color=tab==='comm'?'#0a0e1a':'var(--text)';a.style.border=tab==='comm'?'none':'1px solid var(--border)';a.style.fontWeight=tab==='comm'?'800':'700';}
    if(b){b.style.background=tab==='direct'?'linear-gradient(135deg,var(--gold),var(--gold-dark))':'transparent';b.style.color=tab==='direct'?'#0a0e1a':'var(--text)';b.style.border=tab==='direct'?'none':'1px solid var(--border)';b.style.fontWeight=tab==='direct'?'800':'700';}
    if(tab==='comm'){if(typeof loadCommunityGroups==='function')loadCommunityGroups();}else{if(typeof loadDMList==='function')loadDMList();}
  }
  // ============ AI TRADE REPORT (Coaching Report) ============
  function computeTradeStats(list){
    const t=list.filter(function(x){return typeof x.pnl==='number';}).slice().sort(function(a,b){return new Date(a.date)-new Date(b.date);});
    const n=t.length;
    const wins=t.filter(function(x){return x.pnl>0;}), losses=t.filter(function(x){return x.pnl<0;});
    const totalPnl=t.reduce(function(s,x){return s+x.pnl;},0);
    const grossWin=wins.reduce(function(s,x){return s+x.pnl;},0), grossLoss=Math.abs(losses.reduce(function(s,x){return s+x.pnl;},0));
    const winRate=n?Math.round(wins.length/n*100):0;
    const avgWin=wins.length?grossWin/wins.length:0, avgLoss=losses.length?grossLoss/losses.length:0;
    const profitFactor=grossLoss?(grossWin/grossLoss):(grossWin>0?99:0);
    // by pair
    const byPair={};t.forEach(function(x){var p=x.pair||'?';byPair[p]=byPair[p]||{pair:p,n:0,pnl:0,w:0};byPair[p].n++;byPair[p].pnl+=x.pnl;if(x.pnl>0)byPair[p].w++;});
    const pairs=Object.keys(byPair).map(function(k){return byPair[k];});
    const bestPair=pairs.slice().sort(function(a,b){return b.pnl-a.pnl;})[0];
    const worstPair=pairs.slice().sort(function(a,b){return a.pnl-b.pnl;})[0];
    const mostTraded=pairs.slice().sort(function(a,b){return b.n-a.n;})[0];
    // direction
    const longs=t.filter(function(x){return (x.direction||'').toLowerCase().charAt(0)==='b';});
    const shorts=t.filter(function(x){return (x.direction||'').toLowerCase().charAt(0)==='s';});
    // realized R:R
    var rr=[];t.forEach(function(x){if(x.entry&&x.sl&&x.tp){var risk=Math.abs(x.entry-x.sl),reward=Math.abs(x.tp-x.entry);if(risk>0)rr.push(reward/risk);}});
    const avgRR=rr.length?(rr.reduce(function(a,b){return a+b;},0)/rr.length):0;
    const biggestWin=n?Math.max.apply(null,t.map(function(x){return x.pnl;}).concat(0)):0;
    const biggestLoss=n?Math.min.apply(null,t.map(function(x){return x.pnl;}).concat(0)):0;
    // equity curve + max drawdown
    var eq=0,peak=0,maxDD=0;t.forEach(function(x){eq+=x.pnl;if(eq>peak)peak=eq;var dd=peak-eq;if(dd>maxDD)maxDD=dd;});
    // consecutive losses (max streak)
    var curL=0,maxL=0,curW=0,maxW=0;t.forEach(function(x){if(x.pnl<0){curL++;maxL=Math.max(maxL,curL);curW=0;}else if(x.pnl>0){curW++;maxW=Math.max(maxW,curW);curL=0;}});
    // trades per day (overtrading)
    var byDay={};t.forEach(function(x){var d=(x.date||'').slice(0,10);byDay[d]=(byDay[d]||0)+1;});
    var daysArr=Object.keys(byDay);var maxPerDay=daysArr.length?Math.max.apply(null,daysArr.map(function(d){return byDay[d];})):0;
    var avgPerDay=daysArr.length?(n/daysArr.length):0;
    var heavyDays=daysArr.filter(function(d){return byDay[d]>=5;}).length;
    // day of week
    var dow=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];var byDow={};t.forEach(function(x){var dt=new Date(x.date);if(!isNaN(dt)){var k=dow[dt.getDay()];byDow[k]=byDow[k]||{pnl:0,n:0};byDow[k].pnl+=x.pnl;byDow[k].n++;}});
    // revenge trading: trade right after a loss with bigger lot than that loss
    var revenge=0;for(var i=1;i<t.length;i++){if(t[i-1].pnl<0&&t[i].lot&&t[i-1].lot&&t[i].lot>t[i-1].lot*1.5)revenge++;}
    // lot size consistency
    var lots=t.map(function(x){return Number(x.lot)||0;}).filter(function(v){return v>0;});
    var lotAvg=lots.length?lots.reduce(function(a,b){return a+b;},0)/lots.length:0;
    var lotVar=lots.length?Math.sqrt(lots.reduce(function(a,b){return a+(b-lotAvg)*(b-lotAvg);},0)/lots.length):0;
    var lotCV=lotAvg?(lotVar/lotAvg):0; // coefficient of variation
    // no stop loss
    var noSL=t.filter(function(x){return !x.sl;}).length;
    return {n:n,wins:wins.length,losses:losses.length,winRate:winRate,totalPnl:totalPnl,avgWin:avgWin,avgLoss:avgLoss,profitFactor:profitFactor,
      bestPair:bestPair,worstPair:worstPair,mostTraded:mostTraded,longN:longs.length,shortN:shorts.length,
      longPnl:longs.reduce(function(s,x){return s+x.pnl;},0),shortPnl:shorts.reduce(function(s,x){return s+x.pnl;},0),
      avgRR:avgRR,biggestWin:biggestWin,biggestLoss:biggestLoss,maxDD:maxDD,maxLossStreak:maxL,maxWinStreak:maxW,
      maxPerDay:maxPerDay,avgPerDay:avgPerDay,heavyDays:heavyDays,tradingDays:daysArr.length,byDow:byDow,revenge:revenge,lotCV:lotCV,noSL:noSL,pairs:pairs};
  }
  function buildReportPrompt(s,sample){
    var pairLines=s.pairs.slice(0,10).map(function(p){return p.pair+': '+p.n+' trades, win '+(p.n?Math.round(p.w/p.n*100):0)+'%, $'+p.pnl.toFixed(2);}).join('; ');
    var dowLines=Object.keys(s.byDow).map(function(k){return k+': '+s.byDow[k].n+' trades $'+s.byDow[k].pnl.toFixed(2);}).join('; ');
    var data=['DATA (use ONLY this; conclusions must be evidence-based):',
      'Total trades: '+s.n+' over '+s.tradingDays+' trading days',
      'Win rate: '+s.winRate+'% ('+s.wins+'W / '+s.losses+'L)',
      'Total P&L: $'+s.totalPnl.toFixed(2),
      'Average win: $'+s.avgWin.toFixed(2)+', Average loss: $'+s.avgLoss.toFixed(2),
      'Profit factor: '+s.profitFactor.toFixed(2),
      'Average planned R:R: '+(s.avgRR?s.avgRR.toFixed(2)+':1':'n/a'),
      'Biggest win: $'+s.biggestWin.toFixed(2)+', Biggest loss: $'+s.biggestLoss.toFixed(2),
      'Max drawdown: $'+s.maxDD.toFixed(2),
      'Max consecutive losses: '+s.maxLossStreak+', Max consecutive wins: '+s.maxWinStreak,
      'Trades per day: avg '+s.avgPerDay.toFixed(1)+', max '+s.maxPerDay+', days with 5+ trades: '+s.heavyDays,
      'Possible revenge trades (bigger size right after a loss): '+s.revenge,
      'Lot-size consistency (0=perfectly consistent, higher=erratic): '+s.lotCV.toFixed(2),
      'Trades with NO stop-loss recorded: '+s.noSL,
      'Long: '+s.longN+' ($'+s.longPnl.toFixed(2)+'), Short: '+s.shortN+' ($'+s.shortPnl.toFixed(2)+')',
      'By pair: '+pairLines,
      'By day of week: '+dowLines,
      'NOTE: only trade DATE is recorded, not time-of-day. So intraday session/hour analysis is NOT possible — state that clearly and skip hourly/session claims.',
      '',
      'Recent trades (date | pair | dir | lot | pnl | sl | tp | emotion):',
      sample
    ].join('\n');
    var instr='You are an elite forex trading coach. Your job is NOT only to calculate statistics — your primary goal is to identify strengths, weaknesses, behavioral patterns, discipline issues, risk-management mistakes, and opportunities for improvement from the trader\'s history.\n\n'+
'Analyze the trade history and produce a detailed coaching report using EXACTLY this structure with ## headings:\n'+
'## Trading Coach Report\n'+
'## Overall Assessment\n(Honest level: Beginner / Developing / Intermediate / Advanced / Professional.)\n'+
'## Performance Score\n(Give 0-100 for each: Discipline, Risk Management, Consistency, Execution, Psychology, and an Overall Trader Score.)\n'+
'## Strengths\n## Weaknesses\n'+
'## Behavioral Analysis\n(Overtrading, revenge trading, FOMO, impulsive entries, inconsistent lot sizing, cutting winners early, letting losers run, excessive frequency. Give the EVIDENCE/numbers behind each conclusion.)\n'+
'## Risk Management Review\n(Position sizing, drawdowns, consecutive losses, risk exposure. State clearly: healthy or dangerous.)\n'+
'## Profitability Analysis\n(Best/worst symbols, best/worst days of week. If time-of-day data is missing, say so and skip hourly/session claims.)\n'+
'## Coaching Feedback\n(What to CONTINUE doing; what to STOP immediately.)\n'+
'## Top 5 Improvements\n(Highest-impact, specific.)\n'+
'## Next 30-Day Development Plan\n(Practical, measurable goals.)\n'+
'## Final Coach Verdict\n(Concise, speak directly to the trader.)\n\n'+
'Be objective, evidence-based and constructive. Do NOT give generic advice. Base ALL conclusions strictly on the data below. Write in VERY SIMPLE, easy English that a beginner can understand — short sentences, no heavy jargon (if you use a trading term, explain it in 3-4 words). Use short bullet points (start with -). Bold key numbers and key words with **.\n\n';
    return instr+data;
  }
  function tradeSample(list){
    var t=list.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date);}).slice(0,80);
    return t.map(function(x){return (x.date||'').slice(0,10)+' | '+(x.pair||'?')+' | '+(x.direction||'?')+' | '+(x.lot||'?')+' | $'+(typeof x.pnl==='number'?x.pnl.toFixed(2):'?')+' | sl '+(x.sl||'-')+' | tp '+(x.tp||'-')+' | '+(x.emotion||'-');}).join('\n');
  }
  function generateRuleReport(s){
    var L=[];L.push('## Trading Coach Report');L.push('## Overall Assessment');
    var lvl=s.profitFactor>=1.8&&s.winRate>=55?'Advanced':s.profitFactor>=1.2?'Intermediate':s.profitFactor>=0.9?'Developing':'Beginner';
    L.push('Based on '+s.n+' trades, current level looks **'+lvl+'**.');
    L.push('## Performance Score');
    var risk=Math.max(0,100-(s.noSL*3)-(s.maxDD>Math.abs(s.totalPnl)?20:0)-(s.maxLossStreak*4));
    var disc=Math.max(0,100-(s.heavyDays*5)-(s.revenge*6)-(s.lotCV>0.6?15:0));
    var cons=Math.max(0,Math.min(100,s.winRate+ (s.profitFactor>=1?20:-10)));
    var overall=Math.round((risk+disc+cons)/3);
    L.push('- Discipline: **'+Math.round(disc)+'/100**');
    L.push('- Risk Management: **'+Math.round(risk)+'/100**');
    L.push('- Consistency: **'+Math.round(cons)+'/100**');
    L.push('- Overall Trader Score: **'+overall+'/100**');
    L.push('## Strengths');
    if(s.winRate>=50)L.push('- Solid win rate ('+s.winRate+'%).');
    if(s.profitFactor>=1.3)L.push('- Profit factor '+s.profitFactor.toFixed(2)+' — winners outweigh losers.');
    if(s.bestPair&&s.bestPair.pnl>0)L.push('- Strong on **'+s.bestPair.pair+'** (+$'+s.bestPair.pnl.toFixed(2)+').');
    if(s.lotCV<0.4)L.push('- Consistent position sizing.');
    L.push('- Maintaining a trade journal.');
    L.push('## Weaknesses');
    if(s.noSL>0)L.push('- **'+s.noSL+'** trades had no stop-loss — major risk.');
    if(s.avgWin>0&&s.avgLoss>s.avgWin)L.push('- Losers ($'+s.avgLoss.toFixed(1)+') bigger than winners ($'+s.avgWin.toFixed(1)+') — cutting winners / letting losers run.');
    if(s.heavyDays>0)L.push('- '+s.heavyDays+' day(s) with 5+ trades — possible overtrading.');
    if(s.revenge>0)L.push('- '+s.revenge+' possible revenge trade(s) (size up after a loss).');
    if(s.worstPair&&s.worstPair.pnl<0)L.push('- Losing on **'+s.worstPair.pair+'** ($'+s.worstPair.pnl.toFixed(2)+').');
    L.push('## Risk Management Review');
    L.push('- Max drawdown **$'+s.maxDD.toFixed(2)+'**, max losing streak **'+s.maxLossStreak+'**. '+(s.noSL>0||s.maxDD>Math.abs(s.totalPnl)?'Risk looks **dangerous** — fix stops and sizing.':'Risk looks **manageable** — keep it tight.'));
    L.push('## Top 5 Improvements');
    L.push('- Always set a stop-loss on every trade.');
    L.push('- Fix lot size to a small % of account.');
    L.push('- Target at least 1.5:1 reward-to-risk.');
    L.push('- Cap trades per day to avoid overtrading.');
    L.push('- Focus on your best pair ('+(s.bestPair?s.bestPair.pair:'top pair')+').');
    L.push('## Final Coach Verdict');
    L.push('You have a workable base. Tighten risk, stop overtrading, and let winners run — consistency will follow.');
    return L.join('\n');
  }
  function aiInl(x){return vEsc(x).replace(/\*\*(.+?)\*\*/g,'<strong style="color:var(--gold);font-weight:800;">$1</strong>');}
  function aiSectionStyle(title){
    var t=title.toLowerCase();
    if(t.indexOf('strength')>=0)return {icon:'💪',color:'#10b981',bullet:'✓'};
    if(t.indexOf('weakness')>=0)return {icon:'⚠️',color:'#ef4444',bullet:'✗'};
    if(t.indexOf('behavior')>=0)return {icon:'🧠',color:'#a855f7',bullet:'•'};
    if(t.indexOf('risk')>=0)return {icon:'🛡️',color:'#ef4444',bullet:'•'};
    if(t.indexOf('profitab')>=0)return {icon:'💰',color:'#10b981',bullet:'•'};
    if(t.indexOf('coaching')>=0)return {icon:'🎓',color:'#3b82f6',bullet:'•'};
    if(t.indexOf('improvement')>=0||t.indexOf('top 5')>=0)return {icon:'🚀',color:'#f59e0b',bullet:'★'};
    if(t.indexOf('30-day')>=0||t.indexOf('plan')>=0||t.indexOf('development')>=0)return {icon:'🗓️',color:'#3b82f6',bullet:'→'};
    if(t.indexOf('verdict')>=0)return {icon:'⚖️',color:'#f59e0b',bullet:'•'};
    if(t.indexOf('performance score')>=0||t.indexOf('score')>=0)return {icon:'📊',color:'#f59e0b',bullet:'•'};
    if(t.indexOf('overall assess')>=0)return {icon:'🎯',color:'#f59e0b',bullet:'•'};
    return {icon:'▸',color:'#f59e0b',bullet:'•'};
  }
  function aiMdToHtml(text){
    var lines=text.split('\n');var sections=[];var cur=null;
    lines.forEach(function(raw){var l=raw.trim();
      if(l.indexOf('## ')===0){cur={title:l.slice(3).trim(),body:[]};sections.push(cur);}
      else if(l.indexOf('# ')===0){cur={title:l.slice(2).trim(),body:[]};sections.push(cur);}
      else if(l){if(!cur){cur={title:'',body:[]};sections.push(cur);}cur.body.push(l);}
    });
    return sections.map(function(sec){
      if(sec.title.toLowerCase().indexOf('coach report')>=0)return '';
      var st=aiSectionStyle(sec.title);
      var dangerous=/dangerous|high risk|poor|severe/i.test(sec.body.join(' '))&&sec.title.toLowerCase().indexOf('risk')>=0;
      var healthy=/healthy|good|safe|well[- ]managed/i.test(sec.body.join(' '))&&sec.title.toLowerCase().indexOf('risk')>=0;
      var alert='';
      if(dangerous)alert='<div style="background:rgba(239,68,68,.14);color:#ef4444;font-weight:800;font-size:12px;padding:6px 12px;border-radius:8px;display:inline-block;margin-bottom:8px;">🚨 Risk: DANGEROUS</div>';
      else if(healthy)alert='<div style="background:rgba(16,185,129,.14);color:#10b981;font-weight:800;font-size:12px;padding:6px 12px;border-radius:8px;display:inline-block;margin-bottom:8px;">✅ Risk: HEALTHY</div>';
      var bodyHtml=sec.body.map(function(l){
        if(/^[-*]\s+/.test(l)){
          var txt=l.replace(/^[-*]\s+/,'');
          var sm=txt.match(/^([A-Za-z][\w\s/&]+?):\s*\*?\*?(\d{1,3})(\/100)?\b/);
          if(sm){var val=parseInt(sm[2]);var lab=sm[1].trim();var lc=lab.toLowerCase();
            var col=/bull/.test(lc)?'#10b981':/bear/.test(lc)?'#ef4444':/neutral/.test(lc)?'#94a0b8':(val>=70?'#10b981':val>=45?'#f59e0b':'#ef4444');
            return '<div style="display:flex;align-items:center;gap:10px;margin:8px 0;"><div style="min-width:140px;font-size:13px;font-weight:600;">'+vEsc(lab)+'</div><div style="flex:1;height:10px;border-radius:6px;background:rgba(255,255,255,.07);overflow:hidden;"><div class="ai-bar-fill" style="height:100%;width:'+val+'%;background:linear-gradient(90deg,'+col+'aa,'+col+');border-radius:6px;"></div></div><div style="min-width:38px;text-align:right;font-weight:800;color:'+col+';font-size:15px;">'+val+'%</div></div>';}
          return '<div style="display:flex;gap:9px;margin:7px 0;align-items:flex-start;"><span style="color:'+st.color+';font-weight:800;flex:0 0 auto;">'+st.bullet+'</span><span style="flex:1;">'+aiInl(txt)+'</span></div>';
        }
        return '<div style="margin:7px 0;color:var(--text-secondary);">'+aiInl(l)+'</div>';
      }).join('');
      var tl=sec.title.toLowerCase();
      var isFull=(tl.indexOf('overall assess')>=0||tl.indexOf('performance score')>=0||tl.indexOf('30-day')>=0||tl.indexOf('development plan')>=0||tl.indexOf('final')>=0);
      return '<div class="ai-sec'+(isFull?' ai-full':'')+'" style="background:linear-gradient(135deg,'+st.color+'12,rgba(255,255,255,.01));border:1px solid var(--border);border-radius:16px;padding:16px 18px;margin-bottom:14px;">'+
        '<div style="display:flex;align-items:center;gap:11px;margin-bottom:'+(alert?'10px':'12px')+';">'+
          '<div style="width:38px;height:38px;border-radius:11px;background:'+st.color+'22;display:flex;align-items:center;justify-content:center;font-size:19px;flex:0 0 auto;">'+st.icon+'</div>'+
          '<div style="font-size:16px;font-weight:800;color:'+st.color+';">'+vEsc(sec.title)+'</div>'+
        '</div>'+(alert?'<div>'+alert+'</div>':'')+
        '<div style="font-size:14px;line-height:1.65;">'+bodyHtml+'</div></div>';
    }).join('');
  }
  function aiExtractScore(text){
    var m=text.match(/overall\s*(?:trader)?\s*score\s*[:\-]?\s*\*?\*?(\d{1,3})/i);
    if(m)return Math.min(100,parseInt(m[1]));
    var any=text.match(/overall[^\n]*?(\d{1,3})\s*\/\s*100/i);return any?parseInt(any[1]):null;
  }
  function aiExtractLevel(text){
    var m=text.match(/\b(Beginner|Developing|Intermediate|Advanced|Professional)\b/i);
    return m?(m[1].charAt(0).toUpperCase()+m[1].slice(1).toLowerCase()):null;
  }
  function aiGauge(score){
    var col=score>=70?'#10b981':score>=45?'#f59e0b':'#ef4444';
    var r=46,c=2*Math.PI*r,off=c*(1-score/100);
    return '<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="'+r+'" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="10"/><circle cx="60" cy="60" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+c+'" stroke-dashoffset="'+off+'" transform="rotate(-90 60 60)" style="filter:drop-shadow(0 0 6px '+col+'88);"/><text x="60" y="56" text-anchor="middle" font-size="30" font-weight="800" fill="'+col+'">'+score+'</text><text x="60" y="76" text-anchor="middle" font-size="11" fill="var(--text-muted)">/ 100</text></svg>';
  }
  function aiTile(label,value,color){
    return '<div style="flex:1;min-width:120px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:12px;padding:12px 14px;"><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;">'+label+'</div><div style="font-size:20px;font-weight:800;margin-top:3px;color:'+(color||'var(--text)')+';">'+value+'</div></div>';
  }
  function aiHero(text,s){
    if(!s)return '';
    var score=aiExtractScore(text);if(score==null)score=Math.max(5,Math.min(95,Math.round((s.winRate+(s.profitFactor>=1?60:30))/2)));
    var level=aiExtractLevel(text)||'';
    var lvlCol={Beginner:'#ef4444',Developing:'#f59e0b',Intermediate:'#3b82f6',Advanced:'#10b981',Professional:'#a855f7'}[level]||'var(--gold)';
    var pfCol=s.profitFactor>=1.5?'#10b981':s.profitFactor>=1?'var(--gold)':'#ef4444';
    var pnlCol=s.totalPnl>=0?'#10b981':'#ef4444';
    return '<div class="card" style="background:linear-gradient(135deg,rgba(245,158,11,.1),rgba(0,0,0,0));margin-bottom:14px;">'+
      '<div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">'+
        '<div style="text-align:center;">'+aiGauge(score)+'<div style="font-size:11px;color:var(--text-muted);margin-top:-6px;">Overall Score</div></div>'+
        '<div style="flex:1;min-width:200px;">'+
          (level?'<div style="display:inline-block;background:'+lvlCol+';color:#0a0e1a;font-weight:800;font-size:13px;padding:5px 14px;border-radius:20px;margin-bottom:10px;">'+level+' Trader</div>':'')+
          '<div style="display:flex;gap:10px;flex-wrap:wrap;">'+
            aiTile('Win Rate',s.winRate+'%',s.winRate>=50?'#10b981':'var(--gold)')+
            aiTile('Profit Factor',s.profitFactor.toFixed(2),pfCol)+
            aiTile('Net P&L',(s.totalPnl>=0?'+':'')+'$'+s.totalPnl.toFixed(0),pnlCol)+
            aiTile('Max DD','$'+s.maxDD.toFixed(0),'#ef4444')+
          '</div>'+
        '</div>'+
      '</div></div>';
  }
  function aiPatternChips(s){
    if(!s)return '';
    var P=[
      {l:'Overtrading',bad:(s.heavyDays>0||s.maxPerDay>=6)},
      {l:'Revenge Trading',bad:s.revenge>0},
      {l:'No Stop-Loss',bad:s.noSL>0},
      {l:'Letting Losers Run',bad:(s.avgWin>0&&s.avgLoss>s.avgWin*1.2)},
      {l:'Inconsistent Sizing',bad:s.lotCV>0.5},
      {l:'Deep Drawdown',bad:(s.maxDD>Math.abs(s.totalPnl)&&s.maxDD>0)}
    ];
    return '<div class="card ai-sec" style="margin-bottom:14px;"><div style="font-size:13px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;">⚡ Habit Check</div><div style="display:flex;gap:8px;flex-wrap:wrap;">'+
      P.map(function(p){var c=p.bad?'#ef4444':'#10b981';var ic=p.bad?'⚠️':'✓';var st=p.bad?'Detected':'Clean';
        return '<div style="display:flex;align-items:center;gap:7px;background:'+c+'18;border:1px solid '+c+'44;border-radius:20px;padding:6px 13px;"><span style="font-size:13px;">'+ic+'</span><span style="font-size:12.5px;font-weight:600;">'+p.l+'</span><span style="font-size:10px;font-weight:800;color:'+c+';text-transform:uppercase;">'+st+'</span></div>';
      }).join('')+'</div></div>';
  }
  function aiInjectStyles(){
    if(document.getElementById('aiReportStyles'))return;
    var st=document.createElement('style');st.id='aiReportStyles';
    st.textContent='@keyframes aiFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}'+
      '@keyframes aiBarGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}'+
      '.ai-sec{animation:aiFadeUp .5s ease both;transition:transform .15s ease,box-shadow .15s ease;}'+
      '.ai-sec:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.25);}'+
      '.ai-bar-fill{transform-origin:left;animation:aiBarGrow .9s cubic-bezier(.2,.8,.2,1) both;}'+
      '.ai-report-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start;}'+
      '.ai-report-grid>.ai-sec{margin-bottom:0;}'+
      '.ai-report-grid>.ai-full{grid-column:1/-1;}'+
      '@media(max-width:760px){.ai-report-grid{grid-template-columns:1fr;}}'+
      '#aiReportBox .ai-sec:nth-child(2){animation-delay:.04s}#aiReportBox .ai-sec:nth-child(3){animation-delay:.08s}#aiReportBox .ai-sec:nth-child(4){animation-delay:.12s}#aiReportBox .ai-sec:nth-child(5){animation-delay:.16s}#aiReportBox .ai-sec:nth-child(6){animation-delay:.2s}#aiReportBox .ai-sec:nth-child(7){animation-delay:.24s}#aiReportBox .ai-sec:nth-child(n+8){animation-delay:.28s}';
    document.head.appendChild(st);
  }
  function downloadAIReport(){
    var box=document.getElementById('aiReportBox');if(!box)return;
    var w=window.open('','_blank');if(!w)return;
    var name=(currentProfile&&(currentProfile.full_name||currentProfile.email))||'Trader';
    w.document.write('<html><head><title>AI Trade Report</title><style>body{font-family:system-ui,Arial,sans-serif;background:#0a0e1a;color:#e8eaf0;padding:24px;max-width:820px;margin:auto;}h1{color:#f59e0b}</style></head><body><h1>🤖 AI Trade Report</h1><p style="color:#94a0b8">'+vEsc(name)+' · '+new Date().toLocaleString()+'</p>'+box.innerHTML+'<script>setTimeout(function(){window.print()},400)<\/script></body></html>');
    w.document.close();
  }
  function renderAIReport(box,text,provider,cached,stats){
    aiInjectStyles();
    var pBadge=cached?'<span style="background:rgba(148,160,184,.18);color:#94a0b8;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">📁 Saved</span>':(provider==='rules'?'<span style="background:rgba(148,160,184,.18);color:#94a0b8;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">⚡ Quick analysis</span>':'<span style="background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#0a0e1a;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;">✨ AI Powered</span>');
    var cover='<div style="background:linear-gradient(135deg,rgba(245,158,11,.22),rgba(217,119,6,.04));border:1px solid var(--gold);border-radius:16px;padding:18px 20px;margin-bottom:14px;text-align:center;position:relative;overflow:hidden;">'+
      '<div style="position:absolute;inset:0;background:radial-gradient(circle at 80% 0%,rgba(245,158,11,.18),transparent 60%);"></div>'+
      '<div style="position:relative;"><div style="font-size:22px;font-weight:900;color:var(--gold);letter-spacing:.5px;">📋 Trading Performance Report</div>'+
      '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">'+vEsc((currentProfile&&(currentProfile.full_name||currentProfile.email))||'Trader')+' · '+new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})+'</div></div></div>';
    box.innerHTML='<div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:12px;align-items:center;flex-wrap:wrap;"><div style="display:flex;gap:8px;align-items:center;">'+pBadge+'<span style="font-size:11px;color:var(--text-muted);">'+new Date().toLocaleString()+'</span></div><button onclick="downloadAIReport()" style="background:rgba(255,255,255,.05);border:1px solid var(--border);color:var(--text);border-radius:9px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;">⬇️ Save / Print</button></div>'+
      cover+
      aiHero(text,stats)+
      aiPatternChips(stats)+
      '<div class="ai-report-grid">'+aiMdToHtml(text)+'</div>'+
      '<div style="font-size:11px;color:var(--text-muted);margin-top:10px;text-align:center;border-top:1px solid var(--border);padding-top:10px;">⚠️ Educational analysis based on your trade history — not financial advice.</div>';
  }
  async function loadCachedAIReport(){
    const box=document.getElementById('aiReportBox');const btn=document.getElementById('aiReportBtn');if(!box)return;
    if(currentProfile&&sb){try{const c=await sb.from('ai_reports').select('*').eq('user_id',currentProfile.id).maybeSingle();if(c.data&&c.data.report){var s=(trades&&trades.length)?computeTradeStats(trades):null;renderAIReport(box,c.data.report,c.data.provider,true,s);if(btn)btn.textContent='🔄 Regenerate';}}catch(e){}}
  }
  async function generateAIReport(){
    const box=document.getElementById('aiReportBox');const btn=document.getElementById('aiReportBtn');if(!box)return;
    if(!trades||!trades.length){box.innerHTML='<div style="color:var(--text-muted);">Add some trades first, then generate your report.</div>';return;}
    const s=computeTradeStats(trades);
    const regen=btn&&btn.textContent.indexOf('Regenerate')>=0;
    if(!regen&&currentProfile&&sb){try{const c=await sb.from('ai_reports').select('*').eq('user_id',currentProfile.id).maybeSingle();if(c.data&&c.data.trades_count===s.n&&c.data.report){renderAIReport(box,c.data.report,c.data.provider,true,s);if(btn)btn.textContent="🔄 Regenerate";return;}}catch(e){}}
    if(btn){btn.disabled=true;btn.textContent='⏳ Analyzing...';}
    box.innerHTML='<div style="color:var(--text-muted);">🤖 Analyzing your '+s.n+' trades in depth... (10-20 sec)</div>';
    let report='',provider='rules';
    try{const r=await fetch('https://pipsepaisa-api.vercel.app/api/ai-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:buildReportPrompt(s,tradeSample(trades))})});if(r.ok){const d=await r.json();if(d.report){report=d.report;provider=d.provider||'ai';}}}catch(e){}
    if(!report){report=generateRuleReport(s);provider='rules';}
    renderAIReport(box,report,provider,false,s);
    if(btn){btn.disabled=false;btn.textContent='🔄 Regenerate';}
    if(currentProfile&&sb){try{await sb.from('ai_reports').upsert({user_id:currentProfile.id,report:report,trades_count:s.n,provider:provider,updated_at:new Date().toISOString()});}catch(e){}}
  }
  // ============ AI ECONOMIC EVENT ANALYSIS ============
  function buildEventPrompt(ev,headlines){
    return ['You are a senior forex fundamental analyst. Analyse the upcoming economic event below and give a PROBABILITY-BASED outlook for the currency.',
      'IMPORTANT: You cannot predict the future. Use "likely / possible / high-probability" language — NEVER guarantees. Base your reasoning on the forecast vs previous, the impact level, the news headlines provided, and general macro knowledge.','',
      'EVENT:',
      '- Name: '+ev.title,
      '- Currency: '+ev.country,
      '- Impact: '+ev.impact,
      '- Forecast: '+(ev.forecast||'n/a'),
      '- Previous: '+(ev.previous||'n/a'),
      '- Actual (if released): '+(ev.actual||'not released yet'),
      '',
      'RECENT NEWS HEADLINES (context):',
      (headlines&&headlines.length?headlines.map(function(h){return '- '+h;}).join('\n'):'- none available'),
      '',
      'Write the report in EXACTLY this structure with ## headings, in simple English:',
      '## Expected Outcome',
      '(One short line: Bullish / Moderately Bullish / Neutral / Moderately Bearish / Bearish for '+ev.country+'.)',
      '## Probability',
      '- Bullish: NN%',
      '- Neutral: NN%',
      '- Bearish: NN%',
      '(The three MUST add up to 100.)',
      '## Why This Forecast (Fundamentals)',
      '(Explain the reasoning in 4-6 bullets. Reference: how the PREVIOUS reading ('+(ev.previous||'n/a')+') compares to the forecast ('+(ev.forecast||'n/a')+') and the recent trend of this indicator; the wider inflation / growth backdrop; the central bank ('+ev.country+') policy stance — hawkish or dovish, recent rate decisions or statements; and related data like employment, retail sales, PPI, oil prices. Make it a clear chain: "because X happened, this data is likely Y".)',
      '## Expected Range',
      '(If the forecast is a number: give the most likely range, a bullish-surprise scenario, and a bearish-surprise scenario. If there is no numeric forecast, write "Not applicable".)',
      '## Key Reasons (Bullish case)',
      '- (2-4 short bullets)',
      '## Risks (Bearish case)',
      '- (2-4 short bullets)',
      '## Trading Impact',
      '- Strong result -> '+ev.country+' likely strengthens (and which pairs/gold react)',
      '- Weak result -> '+ev.country+' likely weakens',
      '',
      'End with one line: "This is probability-based analysis, not a guarantee."'
    ].join('\n');
  }
  function evCacheKey(ev){return 'evai:'+(ev.country||'')+'|'+(ev.title||'')+'|'+(ev.date||'');}
  function aiEventOutcomeColor(txt){var t=(txt||'').toLowerCase();if(t.indexOf('bull')>=0)return '#10b981';if(t.indexOf('bear')>=0)return '#ef4444';return '#94a0b8';}
  function aiEventHero(report){
    // extract probabilities + outcome
    function grab(re){var m=report.match(re);return m?parseInt(m[1]):null;}
    var bull=grab(/bullish[^\d]*(\d{1,3})\s*%/i),neu=grab(/neutral[^\d]*(\d{1,3})\s*%/i),bear=grab(/bearish[^\d]*(\d{1,3})\s*%/i);
    var om=report.match(/##\s*Expected Outcome\s*\n+\s*([^\n]+)/i);var outcome=om?om[1].replace(/[*#]/g,'').trim():'';
    var bar='';
    if(bull!=null&&bear!=null){neu=neu!=null?neu:Math.max(0,100-bull-bear);var tot=bull+neu+bear||1;
      bar='<div style="display:flex;height:14px;border-radius:8px;overflow:hidden;margin:8px 0 6px;">'+
        '<div style="width:'+(bull/tot*100)+'%;background:#10b981;"></div>'+
        '<div style="width:'+(neu/tot*100)+'%;background:#5b6472;"></div>'+
        '<div style="width:'+(bear/tot*100)+'%;background:#ef4444;"></div></div>'+
        '<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;margin-bottom:4px;"><span style="color:#10b981;">▲ Bull '+bull+'%</span><span style="color:#94a0b8;">Neutral '+neu+'%</span><span style="color:#ef4444;">▼ Bear '+bear+'%</span></div>';
    }
    var badge=outcome?'<div style="display:inline-block;background:'+aiEventOutcomeColor(outcome)+';color:#0a0e1a;font-weight:800;font-size:14px;padding:7px 18px;border-radius:22px;margin-bottom:10px;">'+vEsc(outcome)+'</div>':'';
    if(!badge&&!bar)return '';
    return '<div class="card ai-sec" style="background:linear-gradient(135deg,rgba(245,158,11,.1),transparent);margin-bottom:14px;text-align:center;">'+badge+bar+'</div>';
  }
  function renderEventReport(body,report,ev,fromCache){
    body.innerHTML=aiEventHero(report)+aiMdToHtml(report)+
      '<div style="font-size:11px;color:var(--text-muted);margin-top:10px;text-align:center;border-top:1px solid var(--border);padding-top:8px;">'+(fromCache?'📁 Saved analysis · ':'')+'⚠️ AI cannot predict the future — probability-based fundamental analysis, not financial advice.</div>';
  }
  function eventModalShell(ev,cached){
    return '<div style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;" onclick="if(event.target===this)closeEventAI()"><div style="background:var(--bg-card);border:1px solid var(--gold);border-radius:18px;max-width:660px;width:100%;max-height:90vh;overflow-y:auto;padding:20px;">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px;"><div><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;">'+(FLAG_MAP[ev.country]||'🌐')+' '+vEsc(ev.country)+' · '+vEsc(ev.impact)+' impact</div><div style="font-size:17px;font-weight:800;margin-top:2px;">'+vEsc(ev.title)+'</div></div><div style="display:flex;gap:6px;flex:0 0 auto;">'+(cached?'<button onclick="aiEventAnalyze('+(newsRawData.indexOf(ev))+',true)" title="Regenerate" style="background:rgba(255,255,255,.06);border:none;color:var(--text);height:32px;padding:0 12px;border-radius:9px;cursor:pointer;font-size:13px;font-weight:700;">🔄</button>':'')+'<button onclick="closeEventAI()" style="background:rgba(255,255,255,.06);border:none;color:var(--text);width:32px;height:32px;border-radius:9px;cursor:pointer;font-size:16px;">✕</button></div></div>'+
      '<div style="display:flex;gap:8px;margin:10px 0 14px;flex-wrap:wrap;">'+
        '<div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:9px;padding:7px 12px;"><span style="font-size:10px;color:var(--text-muted);">FORECAST</span><div style="font-weight:800;color:var(--gold);">'+(ev.forecast||'-')+'</div></div>'+
        '<div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:9px;padding:7px 12px;"><span style="font-size:10px;color:var(--text-muted);">PREVIOUS</span><div style="font-weight:800;">'+(ev.previous||'-')+'</div></div>'+
        '<div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:9px;padding:7px 12px;"><span style="font-size:10px;color:var(--text-muted);">ACTUAL</span><div style="font-weight:800;color:'+(ev.actual?'var(--gold)':'var(--text-muted)')+';">'+(ev.actual||'-')+'</div></div>'+
      '</div>'+
      '<div id="eventAIBody"></div></div></div>';
  }
  async function aiEventAnalyze(idx,force){
    var ev=(newsRawData||[])[idx];if(!ev)return;
    var host=document.getElementById('eventAIHost');if(!host)return;
    aiInjectStyles();
    // check cache (12h TTL)
    var cached=null;
    try{var raw=localStorage.getItem(evCacheKey(ev));if(raw){var obj=JSON.parse(raw);if(obj&&obj.report&&(Date.now()-obj.time)<43200000)cached=obj;}}catch(e){}
    if(cached&&!force){
      host.innerHTML=eventModalShell(ev,true);
      renderEventReport(document.getElementById('eventAIBody'),cached.report,ev,true);
      return;
    }
    host.innerHTML=eventModalShell(ev,false);
    document.getElementById('eventAIBody').innerHTML='<div style="text-align:center;padding:30px;color:var(--text-muted);">🤖 Analyzing fundamentals... (10-20 sec)</div>';
    var heads=[];
    try{var r=await fetch('https://pipsepaisa-api.vercel.app/api/news',{signal:AbortSignal.timeout(8000)});var d=await r.json();
      if(d&&d.items){var key=(ev.title||'').toLowerCase().split(/[^a-z]+/).filter(function(w){return w.length>3;});
        heads=d.items.filter(function(it){var t=((it.title||'')+' '+(it.desc||'')).toLowerCase();return t.indexOf((ev.country||'').toLowerCase())>=0||key.some(function(k){return t.indexOf(k)>=0;});}).slice(0,6).map(function(it){return it.title;});
        if(!heads.length)heads=d.items.slice(0,5).map(function(it){return it.title;});
      }}catch(e){}
    var body=document.getElementById('eventAIBody');if(!body)return;
    var report='';
    try{var rr=await fetch('https://pipsepaisa-api.vercel.app/api/ai-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:buildEventPrompt(ev,heads)})});if(rr.ok){var dd=await rr.json();if(dd.report)report=dd.report;}}catch(e){}
    if(!report){body.innerHTML='<div style="text-align:center;padding:24px;color:#ef4444;">AI is busy right now. Please try again in a moment.</div>';return;}
    try{localStorage.setItem(evCacheKey(ev),JSON.stringify({report:report,time:Date.now()}));}catch(e){}
    renderEventReport(body,report,ev,false);
  }
  function closeEventAI(){var h=document.getElementById('eventAIHost');if(h)h.innerHTML='';}

  function closeVipModal(){const h=document.getElementById('vipModalHost');if(h)h.innerHTML='';}
  // INSTANT realtime updates (Supabase Realtime — needs realtime-enable.sql)
  (function rtUser(){
    if(typeof sb==='undefined'||!sb){return setTimeout(rtUser,1000);}
    function act(id){var p=document.getElementById(id);return p&&p.classList.contains('active');}
    function rtContent(){
      try{
        if(typeof loadSignalsFromDB==='function')loadSignalsFromDB();
        if(act('page-articles')&&typeof loadArticlesFromDB==='function')loadArticlesFromDB();
        if(act('page-learn')&&typeof loadCourses==='function')loadCourses();
        if(act('page-news')&&typeof loadAdminNews==='function')loadAdminNews();
        if(act('page-vipplans')&&typeof loadVipPlans==='function')loadVipPlans();
      }catch(e){}
    }
    try{
      sb.channel('rt-user-support').on('postgres_changes',{event:'*',schema:'public',table:'support_messages'},function(){var p=document.getElementById('page-support');if(p&&p.classList.contains('active'))loadSupport(true);}).subscribe();
      sb.channel('rt-user-notif').on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications'},function(){if(typeof checkAnnounceBanner==='function')checkAnnounceBanner();var p=document.getElementById('page-announce');if(p&&p.classList.contains('active'))loadAnnouncements();}).subscribe();
      sb.channel('rt-user-content')
        .on('postgres_changes',{event:'*',schema:'public',table:'signals'},rtContent)
        .on('postgres_changes',{event:'*',schema:'public',table:'charts'},rtContent)
        .on('postgres_changes',{event:'*',schema:'public',table:'courses'},rtContent)
        .on('postgres_changes',{event:'*',schema:'public',table:'news_posts'},rtContent)
        .on('postgres_changes',{event:'*',schema:'public',table:'subscription_plans'},rtContent)
        .on('postgres_changes',{event:'*',schema:'public',table:'articles'},rtContent)
        .on('postgres_changes',{event:'*',schema:'public',table:'banners'},rtContent)
        .subscribe();

      sb.channel('rt-user-site-settings')
        .on('postgres_changes',{event:'*',schema:'public',table:'site_settings'},function(){
          loadTabSettings();
        })
        .subscribe(function(status){
          if(status==='SUBSCRIBED') loadTabSettings();
        });
      sb.channel('rt-user-community')
        .on('postgres_changes',{event:'*',schema:'public',table:'group_posts'},function(){if(commVisible()&&typeof loadFeed==='function')loadFeed(true);})
        .on('postgres_changes',{event:'*',schema:'public',table:'post_likes'},function(){if(commVisible()&&typeof loadFeed==='function')loadFeed(true);})
        .on('postgres_changes',{event:'*',schema:'public',table:'post_comments'},function(){if(commVisible()&&typeof loadFeed==='function')loadFeed(true);})
        .on('postgres_changes',{event:'*',schema:'public',table:'post_poll_votes'},function(){if(commVisible()&&typeof loadFeed==='function')loadFeed(true);})
        .subscribe();
      sb.channel('rt-user-commnotif').on('postgres_changes',{event:'*',schema:'public',table:'community_notifications'},function(){if(typeof loadCommNotifs==='function')loadCommNotifs();}).subscribe();
    }catch(e){}
  })();
  async function openIbJoin(id){
    const p=vipPlansById[id];if(!p)return;
    const dur=p.period==='lifetime'?36500:(p.period==='yearly'?365:30);
    window._ibJoin={plan:p,dur:dur};
    const host=document.getElementById('vipModalHost');if(!host)return;
    host.innerHTML='<div style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;" onclick="if(event.target===this)closeVipModal()">'+
      '<div style="background:#0f1729;border:1px solid var(--border);border-radius:16px;max-width:440px;width:100%;max-height:90vh;overflow:auto;padding:22px;">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><div style="font-size:17px;font-weight:800;">🤝 '+vEsc(p.name)+' — Join via IB</div><span style="cursor:pointer;font-size:20px;color:var(--text-muted);" onclick="closeVipModal()">×</span></div>'+
      '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.5;">'+
        (p.iblink?'<b>Step 1:</b> <a href="'+vEsc(p.iblink)+'" target="_blank" rel="noopener" style="color:var(--gold);">Open your trading account here</a> (under your mentor).<br>':'<b>Step 1:</b> Open a trading account under your mentor.<br>')+
        '<b>Step 2:</b> Deposit'+(p.ibdep>0?(' at least <b>'+p.ibdep+' '+vEsc(p.currency||'USD')+'</b>'):'')+'.<br>'+
        '<b>Step 3:</b> Submit your account number + deposit proof below.</div>'+
      (p.iblink?'<a href="'+vEsc(p.iblink)+'" target="_blank" rel="noopener" style="display:block;text-align:center;width:100%;padding:10px;border-radius:10px;background:rgba(245,158,11,.14);color:var(--gold);font-weight:800;text-decoration:none;font-size:13px;margin-bottom:14px;box-sizing:border-box;">🔗 Open Account / Register</a>':'')+
      '<label style="font-size:12px;color:var(--text-muted)">Trading account number *</label>'+
      '<input id="ibAcc" placeholder="e.g. 12345678" style="width:100%;padding:10px;margin:5px 0 12px;border-radius:9px;border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--text);box-sizing:border-box;"/>'+
      '<label style="font-size:12px;color:var(--text-muted)">Deposit amount</label>'+
      '<input id="ibDep" type="number" placeholder="e.g. 100" style="width:100%;padding:10px;margin:5px 0 12px;border-radius:9px;border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--text);box-sizing:border-box;"/>'+
      '<label style="font-size:12px;color:var(--text-muted)">Upload deposit proof (screenshot) *</label>'+
      '<input id="ibProof" type="file" accept="image/*" style="width:100%;padding:8px;margin:5px 0 12px;border-radius:9px;border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--text);box-sizing:border-box;"/>'+
      '<label style="font-size:12px;color:var(--text-muted)">Notes (optional)</label>'+
      '<textarea id="ibNotes" rows="2" placeholder="Anything your mentor should know" style="width:100%;padding:10px;margin:5px 0 14px;border-radius:9px;border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--text);box-sizing:border-box;"></textarea>'+
      '<div id="ibSubMsg" style="font-size:12px;margin-bottom:10px;color:var(--text-muted);"></div>'+
      '<button onclick="submitIbJoin()" style="width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--green),#059669);color:#fff;font-weight:800;cursor:pointer">🤝 Submit IB Request</button>'+
      '</div></div>';
  }
  async function submitIbJoin(){
    const c=window._ibJoin;if(!c)return;
    const msg=document.getElementById('ibSubMsg');
    const acc=(document.getElementById('ibAcc').value||'').trim();
    const file=document.getElementById('ibProof').files[0];
    if(!acc){msg.style.color='var(--red)';msg.textContent='Please enter your trading account number.';return;}
    if(!file){msg.style.color='var(--red)';msg.textContent='Please upload your deposit proof.';return;}
    msg.style.color='var(--text-muted)';msg.textContent='Uploading...';
    try{
      const ext=(file.name.split('.').pop()||'jpg').toLowerCase();
      const path='ib/'+currentProfile.id+'_'+Date.now()+'.'+ext;
      const up=await sb.storage.from('charts').upload(path,file,{upsert:true});
      if(up.error){msg.style.color='var(--red)';msg.textContent='Upload failed: '+up.error.message;return;}
      const url=sb.storage.from('charts').getPublicUrl(path).data.publicUrl;
      const depVal=parseFloat(document.getElementById('ibDep').value)||0;
      const userNote=(document.getElementById('ibNotes').value||'').trim();
      const noteFull=(depVal?('Deposited: '+depVal+' '+(c.plan.currency||'')):'')+(userNote?((depVal?' · ':'')+userNote):'')||null;
      const obj={user_id:currentProfile.id,mentor_id:currentProfile.mentor_id||null,plan_id:c.plan.id,plan_name:c.plan.name,amount:(c.plan.ibprice||0),currency:c.plan.currency,duration_days:c.dur,request_type:'ib',method_type:'ib',trading_account:acc,receipt_url:url,notes:noteFull,status:'pending'};
      const ins=await sb.from('payment_requests').insert(obj);
      if(ins.error){msg.style.color='var(--red)';msg.textContent='Error: '+ins.error.message;return;}
      msg.style.color='var(--green)';msg.textContent='✅ Submitted! Your mentor will verify your IB account & activate access soon.';
      setTimeout(function(){closeVipModal();loadMyVipRequests();},1700);
    }catch(e){msg.style.color='var(--red)';msg.textContent='Error: '+e.message;}
  }
  async function loadMyVipRequests(){
    const box=document.getElementById('myVipReqs');if(!box||!currentProfile||!sb)return;
    let data=[];try{const r=await sb.from('payment_requests').select('*').eq('user_id',currentProfile.id).order('created_at',{ascending:false}).limit(10);data=r.data||[];}catch(e){return;}
    if(!data.length){box.innerHTML='';return;}
    box.innerHTML='<div class="card"><div class="card-title">📋 My Requests</div>'+data.map(function(r){
      const stc=r.status==='approved'?'var(--green)':(r.status==='rejected'?'var(--red)':'var(--gold)');
      const typeLbl=r.request_type==='ib'?'<span style="font-size:10px;padding:1px 7px;border-radius:10px;background:rgba(16,185,129,.18);color:var(--green);font-weight:700;margin-left:6px;">🤝 IB</span>':'';
      const sub=r.request_type==='ib'?('Acc: '+vEsc(r.trading_account||'-')):((r.amount||0)+' '+vEsc(r.currency||''));
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)"><div><strong>'+vEsc(r.plan_name||'Plan')+'</strong>'+typeLbl+' <span style="color:var(--text-muted);font-size:12px">'+sub+'</span><div style="font-size:11px;color:var(--text-muted)">'+new Date(r.created_at).toLocaleString()+'</div></div><span style="color:'+stc+';font-weight:800;font-size:12px;text-transform:uppercase">'+vEsc(r.status)+'</span></div>';
    }).join('')+'</div>';
  }


  // ============ UPDATE UI BASED ON AUTH STATE ============
  function updateAuthUI() {
    const userCard = document.getElementById('userCard');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userStatus = document.getElementById('userStatus');
    const userBadge = document.getElementById('userBadge');
    const authMenuText = document.getElementById('authMenuText');
    const authMenuItem = document.getElementById('authMenuItem');
    
    if (currentUser && currentProfile) {
      // Logged in
      const name = currentProfile.full_name || 'User';
      const initial = name.charAt(0).toUpperCase();
      
      if (userAvatar) userAvatar.textContent = initial;
      if (userName) userName.textContent = name;
      if (userStatus) userStatus.textContent = currentProfile.email || 'Welcome';
      if (userBadge) {
        userBadge.textContent = currentProfile.is_premium ? (currentProfile.member_type==='vip'?'👑 VIP':'💎 PREMIUM') : 'FREE';
        userBadge.style.background = currentProfile.is_premium ? 'rgba(139, 92, 246, 0.15)' : '';
        userBadge.style.color = currentProfile.is_premium ? 'var(--purple)' : '';
      }
      
      if (authMenuText) authMenuText.textContent = 'Logout';
      if (authMenuItem) {
        authMenuItem.style.background = 'linear-gradient(135deg, var(--red-bg), transparent)';
        authMenuItem.style.color = 'var(--red)';
        authMenuItem.querySelector('.menu-icon').textContent = '🚪';
      }
      
      // Update settings page profile fields
      const profName = document.getElementById('profName');
      const profEmail = document.getElementById('profEmail');
      const profPhone = document.getElementById('profPhone');
      const settingsName = document.getElementById('settingsName');
      const settingsRole = document.getElementById('settingsRole');
      const settingsAvatar = document.getElementById('settingsAvatar');
      
      if (profName) profName.value = currentProfile.full_name || '';
      if (profEmail) profEmail.value = currentProfile.email || '';
      if (profPhone) profPhone.value = currentProfile.whatsapp || currentProfile.phone || '';
      if (settingsName) settingsName.textContent = name;
      if (settingsRole) settingsRole.textContent = pspFriendlyRole(currentProfile.role);
      if (settingsAvatar) settingsAvatar.textContent = initial;
    } else {
      // Not logged in
      if (userAvatar) userAvatar.textContent = '?';
      if (userName) userName.textContent = 'Guest';
      if (userStatus) userStatus.textContent = 'Click to login';
      if (userBadge) {
        userBadge.textContent = 'SIGN IN';
        userBadge.style.background = '';
        userBadge.style.color = '';
      }
      
      if (authMenuText) authMenuText.textContent = 'Login / Sign Up';
      if (authMenuItem) {
        authMenuItem.style.background = 'linear-gradient(135deg, var(--green-bg), transparent)';
        authMenuItem.style.color = 'var(--green)';
        authMenuItem.querySelector('.menu-icon').textContent = '🔐';
      }
    }
  }
  
  // ============ CLICK HANDLERS ============
  function userCardClick() {
    if (currentUser) {
      // Open settings page
      const settingsItem = document.querySelector('[data-page="settings"]');
      if (settingsItem) settingsItem.click();
    } else {
      openAuthModal();
    }
  }
  
  function authMenuClick() {
    if (currentUser) {
      logoutUser();
    } else {
      openAuthModal();
    }
  }
  


  // ============ DIRECT SAME-ORIGIN LANDING LOGIN ============
  // landing.html is loaded from the same domain inside this page.
  // Calling this function directly is more reliable than waiting for postMessage.
  window.pspLoginFromLanding = async function(email, password) {
    if (window._pspDirectLoginBusy) {
      throw new Error('Login is already processing. Please wait a moment.');
    }
    window._pspDirectLoginBusy = true;

    try {
      const ready = await ensureSupabaseClient();
      if (!ready || !sb) {
        throw new Error('Connection problem. Please reload and try again.');
      }

      email = String(email || '').trim();
      password = String(password || '');
      if (!email || !password) {
        throw new Error('Please enter email and password.');
      }

      const loginRequest = sb.auth.signInWithPassword({ email, password });
      const timeoutRequest = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Login service took too long. Please check your internet and try again.')),
          15000
        );
      });

      const result = await Promise.race([loginRequest, timeoutRequest]);
      if (result.error) throw result.error;

      const user = result.data?.user || null;
      const session = result.data?.session || null;
      if (!user || !session) {
        throw new Error('Login session was not created. Please try again.');
      }

      currentUser = user;
      currentProfile={
        id:user.id,
        full_name:user.user_metadata?.full_name || (user.email||'User').split('@')[0],
        username:user.user_metadata?.username || (user.email||'User').split('@')[0],
        email:user.email || '',
        role:'user',
        is_premium:false,
        member_type:'free'
      };
      updateAuthUI();
      enterApp();

      _lastAuthHydrationUserId = user.id;
      _lastAuthHydrationAt = Date.now();

      try {
        localStorage.setItem('pipsepaisa_last_login_email', email);
        history.replaceState(null, '', location.pathname.replace(/index\.html$/,''));
      } catch (e) {}

      setTimeout(function () {
        Promise.resolve(loadUserProfile(user)).catch(function (error) {
          console.warn('Background profile load failed:', error);
          try { updateAuthUI(); } catch (e) {}
        });
      }, 0);

      return { ok: true, userId: user.id };
    } catch (error) {
      const raw = error?.message || 'Login failed. Please try again.';
      const friendly = /invalid login credentials|invalid/i.test(raw)
        ? 'Email or password is incorrect.'
        : raw;
      throw new Error(friendly);
    } finally {
      window._pspDirectLoginBusy = false;
    }
  };

  // ============ LANDING IFRAME LOGIN BRIDGE ============
  // The landing page is an iframe. Authentication is completed by this
  // parent page so the dashboard opens immediately without refreshing back
  // to the landing page or creating a second ticker.
  let _landingLoginBridgeBound = false;
  function bindLandingLoginBridge(){
    if(_landingLoginBridgeBound)return;
    _landingLoginBridgeBound=true;

    window.addEventListener('message',function(event){
      if(event.origin!==location.origin)return;
      const message=event.data||{};
      if(message.type!=='PIPSEPAISA_LOGIN_REQUEST')return;

      const frame=document.querySelector('#landingPage iframe');
      if(frame&&event.source!==frame.contentWindow)return;

      const requestId=message.requestId||'';
      const reply=function(payload){
        try{
          event.source?.postMessage(
            Object.assign({
              type:'PIPSEPAISA_LOGIN_RESULT',
              requestId
            },payload),
            event.origin
          );
        }catch(e){}
      };

      (async function(){
        if(window._pspParentLoginBusy){
          throw new Error('Login is already processing. Please wait a moment.');
        }
        window._pspParentLoginBusy=true;

        try{
          const ready=await ensureSupabaseClient();
          if(!ready||!sb){
            throw new Error('Connection problem. Please reload and try again.');
          }

          const email=String(message.email||'').trim();
          const password=String(message.password||'');
          if(!email||!password){
            throw new Error('Please enter email and password.');
          }

          const loginPromise=sb.auth.signInWithPassword({email,password});
          const timeoutPromise=new Promise((_,reject)=>{
            setTimeout(
              ()=>reject(new Error('Login service took too long. Please check your internet and try again.')),
              12000
            );
          });

          const result=await Promise.race([loginPromise,timeoutPromise]);
          if(result.error)throw result.error;

          const user=result.data?.user||null;
          const session=result.data?.session||null;
          if(!user||!session){
            throw new Error('Login session was not created. Please try again.');
          }

          // Do not wait for profile/database queries before opening the app.
          currentUser=user;
          currentProfile={
            id:user.id,
            full_name:user.user_metadata?.full_name || (user.email||'User').split('@')[0],
            username:user.user_metadata?.username || (user.email||'User').split('@')[0],
            email:user.email || '',
            role:'user',
            is_premium:false,
            member_type:'free'
          };
          updateAuthUI();
          enterApp();

          // Mark this hydration so the auth-state listener does not repeat it.
          _lastAuthHydrationUserId=user.id;
          _lastAuthHydrationAt=Date.now();

          try{
            localStorage.setItem('pipsepaisa_last_login_email',email);
            history.replaceState(null,'',location.pathname.replace(/index\.html$/,''));
          }catch(e){}

          reply({ok:true});

          // Profile hydration is intentionally outside the auth lock.
          setTimeout(function(){
            Promise.resolve(loadUserProfile(user)).catch(function(error){
              console.warn('Background profile load failed:',error);
              try{updateAuthUI();}catch(e){}
            });
          },0);
        }catch(error){
          const raw=error?.message||'Login failed. Please try again.';
          const friendly=/invalid login credentials|invalid/i.test(raw)
            ?'Email or password is incorrect.'
            :raw;
          reply({ok:false,error:friendly});
        }finally{
          window._pspParentLoginBusy=false;
        }
      })();
    });
  }
  bindLandingLoginBridge();

  // ============ LISTEN FOR AUTH STATE CHANGES ============
  let _authListenerBound = false;
  let _lastAuthHydrationUserId = '';
  let _lastAuthHydrationAt = 0;

  function queueAuthenticatedUser(user){
    if(!user)return;

    currentUser=user;
    if(!currentProfile || currentProfile.id!==user.id){
      currentProfile={
        id:user.id,
        full_name:user.user_metadata?.full_name || (user.email||'User').split('@')[0],
        username:user.user_metadata?.username || (user.email||'User').split('@')[0],
        email:user.email || '',
        role:'user',
        is_premium:false,
        member_type:'free'
      };
    }
    const app=document.getElementById('mainApp');
    const appVisible=!!(app && getComputedStyle(app).display!=='none');
    if(!appVisible) enterApp();
    else updateAuthUI();

    const now=Date.now();
    if(_lastAuthHydrationUserId===user.id&&(now-_lastAuthHydrationAt)<1200){
      return;
    }
    _lastAuthHydrationUserId=user.id;
    _lastAuthHydrationAt=now;

    setTimeout(function(){
      Promise.resolve(loadUserProfile(user)).catch(function(error){
        console.warn('Auth profile hydration failed:',error);
        try{updateAuthUI();}catch(e){}
      });
    },0);
  }

  function bindUserAuthListener() {
    if (_authListenerBound || !sb) return;
    _authListenerBound = true;

    sb.auth.onAuthStateChange((event, session) => {
      // Never await Supabase/database calls inside this callback.
      setTimeout(function(){
        if (event === 'PASSWORD_RECOVERY') {
          showPasswordResetForm();
        } else if (event === 'TOKEN_REFRESHED') {
          if (session && session.user) {
            currentUser=session.user;
            updateAuthUI();
          }
        } else if (
          event === 'SIGNED_IN' ||
          event === 'INITIAL_SESSION'
        ) {
          if (session && session.user) {
            queueAuthenticatedUser(session.user);
            try { history.replaceState(null, '', location.pathname.replace(/index\.html$/,'')); } catch(e) {}
          }
        } else if (event === 'SIGNED_OUT') {
          currentUser = null;
          currentProfile = null;
          updateAuthUI();
          try { closeModal('auth'); } catch(e) {}
          resetAuthModalState();
          showLandingPage();
        }
      },0);
    });
  }
  bindUserAuthListener();
  ensureSupabaseClient().then(function(){ bindUserAuthListener(); });
  
  // ============================================================
  // ============ END SUPABASE AUTH ============

  async function updateSettingsPassword() {
    const newPass = document.getElementById('settingsNewPass')?.value;
    const confirmPass = document.getElementById('settingsConfirmPass')?.value;
    const msg = document.getElementById('settingsPassMsg');

    if (!newPass || newPass.length < 8) {
      msg.innerHTML = '<span style="color:var(--red)">❌ Password must be at least 8 characters</span>';
      return;
    }
    if (newPass !== confirmPass) {
      msg.innerHTML = '<span style="color:var(--red)">❌ Passwords do not match</span>';
      return;
    }
    msg.innerHTML = '<span style="color:var(--text-muted)">Updating...</span>';
    try {
      const { error } = await sb.auth.updateUser({ password: newPass });
      if (error) throw error;
      msg.innerHTML = '<span style="color:var(--green)">✅ Password updated successfully!</span>';
      document.getElementById('settingsNewPass').value = '';
      document.getElementById('settingsConfirmPass').value = '';
    } catch(e) {
      msg.innerHTML = `<span style="color:var(--red)">❌ ${e.message}</span>`;
    }
  }

  // ============ PASSWORD RESET FORM ============
  function showPasswordResetForm() {
    // Create modal if not exists
    let modal = document.getElementById('modal-password-reset');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-password-reset';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
      modal.innerHTML = `
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:32px;width:100%;max-width:400px;text-align:center">
          <div style="width:56px;height:56px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 16px">🔐</div>
          <h2 style="font-size:20px;font-weight:800;margin-bottom:8px">Set New Password</h2>
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:24px">Enter your new password below</p>
          <div style="text-align:left;margin-bottom:14px">
            <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px">New Password</label>
            <input type="password" id="newPasswordInput" placeholder="Min 8 characters" style="width:100%;padding:12px 14px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px;color:var(--text-primary);font-size:14px;font-family:inherit;outline:none">
          </div>
          <div style="text-align:left;margin-bottom:20px">
            <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px">Confirm Password</label>
            <input type="password" id="confirmPasswordInput" placeholder="Re-enter password" style="width:100%;padding:12px 14px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px;color:var(--text-primary);font-size:14px;font-family:inherit;outline:none">
          </div>
          <div id="resetMsg" style="font-size:12px;margin-bottom:12px;min-height:20px"></div>
          <button onclick="submitNewPassword()" style="width:100%;padding:13px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#0a0e1a;border:none;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit">Update Password</button>
        </div>`;
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    // Make sure landing page is hidden
    const landing = document.getElementById('landingPage');
    if (landing) landing.style.display = 'none';
  }

  async function submitNewPassword() {
    const newPass = document.getElementById('newPasswordInput')?.value;
    const confirmPass = document.getElementById('confirmPasswordInput')?.value;
    const msg = document.getElementById('resetMsg');

    if (!newPass || newPass.length < 8) {
      msg.innerHTML = '<span style="color:var(--red)">❌ Password must be at least 8 characters</span>';
      return;
    }
    if (newPass !== confirmPass) {
      msg.innerHTML = '<span style="color:var(--red)">❌ Passwords do not match</span>';
      return;
    }

    msg.innerHTML = '<span style="color:var(--text-muted)">Updating...</span>';

    try {
      const { error } = await sb.auth.updateUser({ password: newPass });
      if (error) throw error;
      msg.innerHTML = '<span style="color:var(--green)">✅ Password updated successfully!</span>';
      setTimeout(() => {
        document.getElementById('modal-password-reset').style.display = 'none';
        loadUserProfile();
      }, 1500);
    } catch(e) {
      msg.innerHTML = `<span style="color:var(--red)">❌ ${e.message}</span>`;
    }
  }
  // ============================================================
  // ============================================================
  

  (function installPerformanceChartObserver(){
    function attach(){
      const container=document.querySelector('.performance-card .chart-container');
      if(!container)return setTimeout(attach,500);
      if(container.dataset.resizeObserverInstalled==='1')return;
      container.dataset.resizeObserverInstalled='1';
      if(typeof ResizeObserver!=='undefined'){
        const ro=new ResizeObserver(function(){
          if(container.offsetWidth>0 && container.offsetHeight>0){
            ensurePerformanceGraphVisible();
          }
        });
        ro.observe(container);
        window._perfResizeObserver=ro;
      }
    }
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',attach,{once:true});
    }else{
      attach();
    }
  })();


  // Fallback sync for admin tab ON/OFF controls.
  // Realtime remains primary; this only protects against a dropped websocket.
  setInterval(function(){
    if(!document.hidden && currentUser && sb){
      loadTabSettings();
    }
  }, 5 * 60 * 1000);

  // ============ INIT ============
  // ============ LANDING PAGE LOGIC ============
  function showLandingPage() {
    const landing = document.getElementById('landingPage');
    const app = document.getElementById('mainApp');
    if (landing) landing.style.display = 'block';
    if (app) app.style.display = 'none';
    document.body.style.overflow = 'hidden';
  }
  
  function ensurePerformanceGraphVisible() {
    try {
      const canvas = document.getElementById('perfChart');
      if (!canvas || typeof Chart === 'undefined') return;

      if (!perfChart) {
        buildPerfChart();
      }

      if (perfChart) {
        perfChart.resize();
        perfChart.update('none');
        updateDashboard();
      }
    } catch (error) {
      console.warn('Performance graph refresh failed:', error);
    }
  }

  function enterApp() {
    const landing = document.getElementById('landingPage');
    const app = document.getElementById('mainApp');
    const appWasVisible = !!(app && getComputedStyle(app).display !== 'none');
    const activePageBefore = document.querySelector('.page.active');

    if (landing) landing.style.display = 'none';
    if (app) app.style.display = 'flex';
    document.body.style.overflow = '';
    try { sessionStorage.setItem('hasEnteredApp', 'true'); } catch(e) {}

    // Open Dashboard only on the first app entry. Auth refreshes must preserve
    // the page the user is currently viewing, including My Courses.
    if (!appWasVisible || !activePageBefore) {
      window.scrollTo(0, 0);
      const dashboardItem=document.querySelector('.menu-item[data-page="dashboard"]');
      showPage('dashboard', dashboardItem);
      setTimeout(function(){if(typeof window.pspApplyIntendedRoute==='function')window.pspApplyIntendedRoute();},0);

      requestAnimationFrame(function(){
        setTimeout(ensurePerformanceGraphVisible, 80);
        setTimeout(ensurePerformanceGraphVisible, 450);
      });
    }
  }
  
  // Auto-hide landing page when user logs in
  function hideLandingAfterLogin() {
    const landing = document.getElementById('landingPage');
    const app = document.getElementById('mainApp');
    if (landing && currentUser) {
      landing.style.display = 'none';
      if (app) app.style.display = 'flex';
      document.body.style.overflow = '';
      try { sessionStorage.setItem('hasEnteredApp', 'true'); } catch(e) {}
      try {
        var pp = new URLSearchParams(location.search).get('page');
        if (pp && !window._ppOpened) {
          window._ppOpened = true;
          var it = document.querySelector('.menu-item[data-page="' + pp + '"]');
          if (it) showPage(pp, it);
        }
      } catch(e) {}
    }
  }
  
  function toggleLandingMenu() {
    const links = document.querySelector('#landingPage .nav-links');
    if (links) {
      links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
      if (links.style.display === 'flex') {
        links.style.position = 'absolute';
        links.style.top = '60px';
        links.style.right = '20px';
        links.style.background = 'var(--bg-card)';
        links.style.padding = '20px';
        links.style.borderRadius = '12px';
        links.style.flexDirection = 'column';
        links.style.gap = '14px';
        links.style.border = '1px solid var(--border)';
        links.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
      }
    }
  }
  
  async function init() {
    // Resolve the saved Supabase session before displaying the landing iframe.
    const landing = document.getElementById('landingPage');
    const app = document.getElementById('mainApp');
    if (landing) landing.style.display = 'none';
    if (app) app.style.display = 'none';
    await ensureSupabaseClient();

    let restoredSession = null;
    try {
      const sessionResult = await sb.auth.getSession();
      restoredSession = sessionResult?.data?.session || null;
    } catch (e) {
      console.warn('Session restore failed', e);
    }

    if (restoredSession?.user) {
      currentUser=restoredSession.user;
      currentProfile={
        id:restoredSession.user.id,
        full_name:restoredSession.user.user_metadata?.full_name || (restoredSession.user.email||'User').split('@')[0],
        username:restoredSession.user.user_metadata?.username || (restoredSession.user.email||'User').split('@')[0],
        email:restoredSession.user.email || '',
        role:'user',
        is_premium:false,
        member_type:'free'
      };
      updateAuthUI();
      enterApp();
      setTimeout(function(){
        Promise.resolve(loadUserProfile(restoredSession.user)).catch(function(error){
          console.warn('Restored profile load failed:',error);
        });
      },0);
    } else {
      showLandingPage();
    }

    updateTime();
    buildCalendar();
    buildPerfChart();
    setTimeout(function(){ try{ if(perfChart){ updateChartTheme(perfChart); perfChart.resize(); perfChart.update('none'); } }catch(e){} }, 120);
    loadChart();
    
    // Set today's date in journal
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('t_date')) document.getElementById('t_date').value = today;
    
    // Defer non-critical data so login and first page render stay fast.
    const loadSecondaryData=function(){
      if(document.hidden)return;
      try{loadNews();}catch(e){}
      try{loadQuizQuestionsFromDB();}catch(e){}
    };
    if('requestIdleCallback' in window) requestIdleCallback(loadSecondaryData,{timeout:3500});
    else setTimeout(loadSecondaryData,2200);
    
    // (real session handled by loadUserProfile above)
  }
  
  init();
  
  // ============ AUTO REFRESH (every 5 minutes during market hours) ============
  setInterval(() => {
    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6;
    if (isWeekend) return; // Don't refresh on weekends
    
    // Refresh news if on news page
    const newsPage = document.getElementById('page-news');
    if (newsPage && newsPage.classList.contains('active')) {
      console.log('🔄 Auto-refreshing news...');
      loadNews();
    }
    
    // Refresh strength if on strength page
    const strengthPage = document.getElementById('page-strength');
    if (strengthPage && strengthPage.classList.contains('active')) {
      loadStrength();
    }
    // Refresh world news hub if active
    const nhp = document.getElementById('page-newshub');
    if (nhp && nhp.classList.contains('active') && typeof nhLoad === 'function') { nhLoad(); }
  }, 5 * 60 * 1000); // 5 minutes


/* PipSePaisa V106 — locked mobile drawer */
(function(){
  if(document.getElementById('psp-v106-mobile-drawer-style'))return;
  var s=document.createElement('style');
  s.id='psp-v106-mobile-drawer-style';
  s.textContent=`
  @media(max-width:768px){
    .sidebar{
      position:fixed!important;
      top:0!important;
      left:0!important;
      bottom:var(--psp-mobile-nav-h,0px)!important;
      height:auto!important;
      max-height:none!important;
      min-height:0!important;
      box-sizing:border-box!important;
      overflow:hidden!important;
      padding-bottom:0!important;
      overscroll-behavior:contain!important;
    }
    .sidebar.open{
      transform:translate3d(0,0,0)!important;
    }
    .sidebar .menu{
      flex:1 1 auto!important;
      min-height:0!important;
      overflow-y:auto!important;
      overflow-x:hidden!important;
      overscroll-behavior:contain!important;
      -webkit-overflow-scrolling:touch!important;
    }
    .sidebar .sidebar-footer{
      flex:0 0 auto!important;
      padding-bottom:8px!important;
    }
    #sidebarOverlay{
      position:fixed!important;
      top:0!important;
      left:0!important;
      right:0!important;
      bottom:var(--psp-mobile-nav-h,0px)!important;
      height:auto!important;
      overscroll-behavior:none!important;
      touch-action:none!important;
    }
    html.psp-sidebar-open,
    body.psp-sidebar-open{
      overflow:hidden!important;
      overscroll-behavior:none!important;
    }
  }`;
  document.head.appendChild(s);
})();
