
'use strict';
    
    
function getEmailFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const email = params.get('givenEmail');
  
  if (email) {
    const decodedEmail = decodeURIComponent(email);
    showOtherProf(decodedEmail);
          }
  
}

window.addEventListener('DOMContentLoaded', () => {
  getEmailFromUrl();
});


 function offerGuest() {
 document.getElementById('offerinf').classList.add('show');   
}
function cenMess() {
 document.getElementById('offerinf').classList.remove('show');  
 setTimeout(() => {offerGuest()}, 30000);
}

function guestWarn() {
const fEl = document.getElementById('guestAlert');
const sEl = document.getElementById('guestAlert-card');
fEl.classList.toggle('show');
sEl.classList.toggle('show');
}

    const guest = localStorage.getItem("guest") || null;

window.onload = function () {
    const user = localStorage.getItem("user");
    const info = localStorage.getItem("info");

    let u ="";

    if (user) {
        u = JSON.parse(user);
    } else if (guest) {
        u = JSON.parse(guest);
        offerGuest(); 
    } else {
     location.href = "sign_in.html";
    }

    if(!info && !guest) {
     location.href = "pickInfo.html";        
    }
        document.getElementById('profPicture').innerHTML =
            `<img src="${u.avatar}">`;

document.getElementById('footerMenuProf').src = u.avatar;

document.getElementById('footerMenuId').innerHTML = u.username;
        document.querySelector('.story-inner').style.backgroundImage = `url(${u.avatar})`;
        document.querySelector('.story-inner').style.backgroundSize = "cover";
        document.querySelector('.story-inner').style.backgroundPosition = "center";

        loadProfilePosts('', 'content')
    
};

const styleString = localStorage.getItem('style');
if (styleString) {
    const s = JSON.parse(styleString);
    document.getElementById('body').style.backgroundColor = s.background;
}

function showLoader(targetId = "content", title = "Loading posts...", message = "Please wait while we fetch the latest for you.") { 
    const loading = `
    <div style="width: 100%; display: flex; justify-content: center; align-items: center;">    
        <div class="loader-container">
        <!-- Center Animated Ring & Logo -->
        <div class="avatar-orbit">
            <div class="orbit-ring"></div>
            <div class="orbit-dot"></div>
            <div class="logo-box">
                <img src="https://i.ibb.co.com/2mLxg7s/asirnet-just-logo.png" alt="Logo">
            </div>
        </div>

        <!-- Typography -->
        <h2 class="loader-title">${title}</h2>
        <p class="loader-subtext">${message}</p>

        <!-- Wave Dots -->
        <div class="dot-wave">
            <div class="circle-dot"></div>
            <div class="circle-dot"></div>
            <div class="circle-dot"></div>
            <div class="circle-dot"></div>
            <div class="circle-dot"></div>
            <div class="circle-dot"></div>
        </div>

        <!-- Pulse Divider Line -->
        <div class="pulse-divider">
            <span class="line"></span>
            <svg class="pulse-icon" viewBox="0 0 24 24" width="24" height="24">
                <path d="M3 12h3l2-5 4 10 3-7 2 2h4" stroke="#3b82f6" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="line"></span>
        </div>

        <!-- Warning Alert Box Container -->
        <div class="warn"></div>
    </div>`;

    const target = document.getElementById(targetId);   
    if (target) target.innerHTML = loading;    
}

function showWarning(targetSelector = ".warn", message = "Network seems slow.", subMessage = "Check your connection and try again.", retryFunc = null) { 
    const warnEl = document.querySelector(targetSelector); 
    if (!warnEl) return; 

    warnEl.innerHTML = `
    <div class="warning-card">
        <div class="warning-left">
            <div class="wifi-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                    <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                    <path d="M8.53 16.11a6 6 0 0 1 6.94 0"></path>
                    <line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"></line>
                </svg>
            </div>
            <div class="warning-text-group">
                <div class="warning-main-text">${message}</div>
                <div class="warning-sub-text">${subMessage}</div>
            </div>
        </div>
        <button class="retryBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Retry
        </button>
    </div></div>
`;    

    const btn = warnEl.querySelector(".retryBtn");   
    if (btn) {       
        btn.addEventListener("click", () => {           
            if (typeof retryFunc === "function") {               
                retryFunc(); 
            } else {               
                console.warn("No retry function provided, default reload"); 
                location.reload();                         
            }       
        });   
    }    
}

function warning(func, interval = 3000, duration = 0, delay = 3000) { 
    if (typeof func !== "function") { 
        console.error("⚠ You must provide a function to run!"); 
        return; 
    } 
    const timeoutId = setTimeout(() => {       
        const intervalId = setInterval(() => {           
            func();       
        }, interval);        
        if (duration > 0) {           
            setTimeout(() => {               
                clearInterval(intervalId);              
            }, duration);       
        }   }, delay);    
    return timeoutId;    
}

// Execution
showLoader("content", "Loading posts...");

warning(() => {
    showWarning(".warn", "Network seems slow.", "Check your connection and try again.", () => { 
        loadHome();
    });
}, 3000, 3000, 3000); 


let isDark = localStorage.getItem('dark');
const isBall = localStorage.getItem('ball');
const isGuest = localStorage.getItem('isGuest');

function setRootProperty(property, value) {
    document.documentElement.style.setProperty(property, value);
}

darkModeActivate(isDark);
BallActivate(isBall);

function darkM() {

    let darkMode;
    
    if(isDark === 'false') {
       darkMode = 'true';
       darkModeActivate('true');
    } else {
       darkMode = 'false';
       darkModeActivate('false');
    }
       localStorage.setItem('dark', darkMode);
       isDark = darkMode;
    
}


function postDivMode(dark) {
  const els = document.querySelectorAll('.postText');

  els.forEach((e) => {
    const s = window.getComputedStyle(e);
    const bg = s.backgroundColor;
    
    if(s.backgroundImage === 'none') {

    if (dark === 'false') {

      if (bg === 'rgb(255, 255, 255)') {
        e.style.background = 'rgba(0, 0, 0, 0)';
        e.style.color = 'rgb(0, 0, 0)';
      } else if (bg === 'rgba(0, 0, 0, 0)') {
        e.style.color = 'rgb(0, 0, 0)';
      }

      
    } else {

      if (bg === 'rgb(0, 0, 0)') {
        e.style.background = 'rgba(0, 0, 0, 0)';
        e.style.color = 'rgb(255, 255, 255)';
      } else if (bg === 'rgba(0, 0, 0, 0)') {
        e.style.color = 'rgb(255, 255, 255)';
      }

    }
        
    }

  });

}



function darkModeActivate(isDark) {

    postDivMode(isDark);
    
    const elements = document.querySelectorAll('*');

    elements.forEach(el => {

        if (isDark === 'true') {
                el.classList.add('dark');
        } else if (isDark === 'false') {
                el.classList.remove('dark');
        }
    });
}

function BallActivate(state) {
if (state === 'true') {
 document.querySelector('.quick-ball').style.display = 'flex'; 
 document.querySelector('.headerBtn').style.display = 'none'; 
    document.getElementById('footer').style.display = 'none';  
        document.getElementById('postMenu').style.display = 'none';  
    }
}

function loadHome() {
    loadProfilePosts('', 'content');
    loadVibes();
    loadAllStories();
}  
 
const endpoints = [
    "https://users-server-xyvg.onrender.com/get/users",
    "https://posts-server-kmha.onrender.com/get/posts",
    "https://interacts-server-xpbo.onrender.com/get/interact",
    "https://story-server-9d2k.onrender.com/get/story",
    "https://nextalk-user-server.onrender.com/get/nextalk-users-server",
    "https://connection-server-9bzk.onrender.com/get/connection",
    "https://nextalk-9yw9.onrender.com/get/nextalk",
    "https://reels-server-40uv.onrender.com/get/reels"
];


async function startServerPing() {

    try {
        const startTime = performance.now();

        const responses = await Promise.all(
            endpoints.map(url => 
                fetch(url)
                    .then(res => ({ url, status: res.status, ok: res.ok }))
                    .catch(err => ({ url, ok: false, error: err.message }))
            )
        );

        const duration = ((performance.now() - startTime) / 1000).toFixed(2);

        responses.forEach(res => {
            if (!res.ok) {
                console.log(`❌ Failed: ${res.url} | Error: ${res.error || 'Bad Status'}`);
            }
        });

    } catch (globalError) {
        console.error("Critical error in ping cycle:", globalError);
    } finally {
        setTimeout(startServerPing, 5000);
    }
}

startServerPing();


