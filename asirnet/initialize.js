

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

};

const styleString = localStorage.getItem('style');
if (styleString) {
    const s = JSON.parse(styleString);
    document.getElementById('body').style.backgroundColor = s.background;
}


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
    loadVibes();
    loadAllStories();
    loadProfilePosts('', 'content');
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

