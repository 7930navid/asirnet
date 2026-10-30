let postOrEdit;
returnUser(); 
    
function returnUser() {

    let user;
    let userOth;
    let unique;
    
    const userId = JSON.parse(localStorage.getItem('user'));
    
    const userPages = JSON.parse(localStorage.getItem('page')) || [];

    const group = JSON.parse(localStorage.getItem('group')) || {};

    const activePage = JSON.parse(localStorage.getItem('active')) || {};
    
    const pagesContainer = document.querySelector('#pages main');
    
    if (Array.isArray(userPages) && userPages.length > 0 && activePage.type === 'page') {

      userPages.forEach(p => {
          if (p.id === activePage.id) {
              unique = p.id;
              userOth = p;
        }
       });


    } else if (activePage.type === 'group') {
        unique = group.id;        
        userOth = {
            username: group.groupname,
            email: group.id,
            avatar: group.avatar,
            cover_photo: group.cover_photo,
            bio: group.type,
            admin_email: encodeURIComponent(JSON.stringify(group.admin_email)),
            members_email: encodeURIComponent(JSON.stringify(group.members_email)),
            short_discription: group.short_discription,
            purpus: group.purpus,
            type: 'group'
      };        
    } else {
        unique = u.email;
        userOth = userId;
    }
    
    userPages.forEach(p => {
              if (pagesContainer) {
              pagesContainer.innerHTML = '';
              const page = document.createElement('button');
              page.style = `
                  padding: 0;
                  margin: 20px 0;
                  border: 1px solid black;
                  border-radius: 20px;
                  height: 100px;
              `;
              page.innerHTML = `
                  <nav class="page-card" onclick="switchToPage('${p.id}')">
                      <section>
                          <img src="${p.avatar}" alt="">
                      </section>
                      <label>${p.username}</label>
                  </nav>
              `;
              pagesContainer.appendChild(page);
          }
      });  

    
    user = {
        unique: unique,
          ...userOth
    };
    
    
    return user || null;
}

function switchToPage(id) {
    localStorage.setItem('active', JSON.stringify({
        id: id,
        type: 'page'
    }));
    
    location.reload();
}

function prepearUserForSend(status) {

   const userInfo = returnUser();
   const userId = JSON.parse(localStorage.getItem('user'));
    
   let email = userInfo.email;
   let username = userInfo.username;
   let avatar = userInfo.avatar;
   
   if(status != 'allowed') {
        email = userId.email;
        username = userId.username;
        avatar = userId.avatar;       
   }

   if (userInfo.type && userInfo.type == 'page' && status === 'allowed') {
        email = userInfo.id;
   }
    
   const info = {
        username: username,
        email: email,
        avatar: avatar,
        from: userInfo.type || 'id'
   };
    
   return info || null;
}

function switchAccount() {
    const el = document.getElementById('accounts-div-container');
    el.classList.add('show');
    BackManager.register(removeSwitchAccount);
}

function removeSwitchAccount() {
    const el = document.getElementById('accounts-div-container');
    el.classList.remove('show');
    BackManager.unregister(removeSwitchAccount);
}

function postGenarate(e) {
  e.stopPropagation();
    const el = document.getElementById('ai-prompt');

    el.classList.add('show');
    
    window.addEventListener('click', (e) => {
        el.classList.remove('show');
    });
}


function createSessionId() {
        if (window.crypto?.randomUUID) {
            return window.crypto.randomUUID();
        }

        return 'session-' + Date.now().toString(36) +
            '-' + Math.random().toString(36).slice(2);
    }


function onActiveGroup(info) {
    const i = decodeURIComponent(info);
    
    localStorage.setItem('group', i);
    localStorage.setItem('active', JSON.stringify({
        type: 'group',
        id: JSON.parse(i).id
    }));
    
    location.reload();
}

renderGroups();
async function renderGroups() {

    const container = document.querySelector('#groups main');

    const u = JSON.parse(localStorage.getItem('user'));

    try {
        const res = await fetch(
            'https://group-server-xlcs.onrender.com/api/groups'
        );

        if (!res.ok) {
            throw new Error('Request has not been sent');
        }

        const data = await res.json();

        const showingData = data.filter(g =>
            (Array.isArray(g.admin_email)
                ? g.admin_email
                : [g.admin_email]
            ).includes(u.email) ||

            (Array.isArray(g.members_email)
                ? g.members_email
                : [g.members_email]
            ).includes(u.email)
        );
        
        let isAdmin;
        container.innerHTML = "";

        if (showingData.length === 0) {
          container.innerHTML = `
              <div>No Groups</div>
          `;
          return;  
        }
        
        
        showingData.forEach(g => {

        if (g.admin_email.includes(u.email)) {
            isAdmin = true;
        }
        
        let groupInfo = encodeURIComponent(JSON.stringify(g));

            const page = document.createElement('button');
            
            page.onclick = () => onActiveGroup(groupInfo);

            page.style = `
                padding: 0;
                margin: 20px 0;
                border: 1px solid black;
                border-radius: 20px;
                height: 100px;
                position: relative;
            `;

            page.innerHTML = `
                <nav class="page-card">
                    <section>
                        <img src="${g.avatar}" alt="">
                    </section>
                    <label>${g.groupname}</label>
                </nav>
                <pre style="
              display: none;
              font-size: 20px;
              padding: 5px;
              position: absolute;
              right: 8px;
              border-radius: 10px;
              font-weight: bold;
              background: linear-gradient(135deg, cyan, lightgreen);
              color: purple;
                " id="panal${g.id}"> Admin </pre>
            `;

            container.appendChild(page);
            
            if(isAdmin) {
             document.getElementById(`panal${g.id}`).style.display = 'flex';    
            }
            
        });

    } catch (err) {
        console.error(err);
        onalert('Something went wrong');
         container.innerHTML = `
              <div>Network error</div>
          `;
         return;  
    }
}

async function askAi() {

    const el = document.getElementById('postGeneration');

    const sendable = document.querySelector('#ai-prompt textarea');
    
    
    const btn = document.querySelector('#ai-prompt button');
    
    const postBox = document.getElementById('postword');
    
    let sessionId = createSessionId();

    const prompt = `
    '${sendable.value.trim()}' Make a post with this prompt in the language that I have given you, and donot tell anything more, just give the prompt and donot put any hashtags.
    `;
    
    if (!prompt) return;

    btn.disabled = true;
    btn.innerText = 'Creating...';
    
    const payload = JSON.stringify({ prompt, sessionId });
    
    try {
        const response = await fetch('https://nexchat-server-qhm5.onrender.com/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload       
      });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'AI response failed');
            onalert('Something went wrong');
        }

       if (data.sessionId) {
            sessionId = data.sessionId;
            sessionStorage.setItem('nexchat_session_id', sessionId);
        }
        
        el.style.display = 'none';
        postBox.value = data.reply;
        
        sendable.value = '';
        
    } catch (err) {
        console.error(err);
        onalert('AI response has not been found');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Create';
    }
}


(() => {
    const page = document.getElementById('postword');
    const genDiv = document.getElementById('postGeneration');

    page.addEventListener('focus', () => {
        page.placeholder = 'Write something... ';
        genDiv.style.display = 'none';
    });

    page.addEventListener('blur', () => {
      if(!page.value) {
        page.placeholder = '';
        genDiv.style.display = 'block';
       }
    });

})();



function summery(json) {

    const pad = document.getElementById('message-to-ai');
    const btn = document.getElementById('message-send-btn');
    const text =  JSON.parse(decodeURIComponent(json));
    
    pad.value = `'${text.post.text}' \n\n write something about this post.`;
    btn.click();
    aires();
    
}

async function tr(json, lang, place) {

    const post = JSON.parse(decodeURIComponent(json));
    const pad = document.getElementsByName(`textPost${post.id}${place}`)[0];
    const btn = document.getElementById(`trBtn${post.id}${place}`);

    try {        
        const languages = ['Bangla', 'English', 'Arabic', 'Turkish', 'Germany', 'Hindi', 'French'];
        const langs = ['bn', 'en', 'ar', 'tr', 'de', 'hi', 'fr'];
        const trLang = languages.indexOf(lang);
        
        if (trLang === -1) {
            throw new Error("Invalid language selected");
        }
        
        if (btn) {
            btn.innerText = "🌐 Translating...";
            btn.disabled = true;
        }
        
        const text = post.post.text;
        const to = langs[trLang];    
        const payload = { text, to };
        
        const res = await fetch('https://translation-d10z.onrender.com/api/translate/auto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Something went wrong while translating');
        }
        
       if (pad) {
           pad.innerText = data.translatedText;
           if (btn) {
               btn.innerText = "🌐 See original";
               btn.disabled = false;
               btn.onclick = () => originalText(json, lang, place, text, pad, btn);
           }
       } else {
           console.error('pad is required');
       }
        
    } catch (error) {
        console.error(error);
        onalert(error.message);
        if (btn) {
            btn.innerText = "🌐 Translate to " + lang;
            btn.disabled = false;
        }
    }
}

function originalText(json, lang, place, originalTextContent, pad, btn) {
    pad.innerText = originalTextContent;
    btn.innerText = "🌐 Translate to " + lang;
    btn.onclick = () => tr(json, lang, place);
}


 
function menuOpen() {
    document.getElementById("MainMenuAside").classList.add('show');    
    document.getElementById("footerOnMenu").classList.add('show');    
    document.getElementById("MainMenuContent").classList.add('show');  

      BackManager.register(menuClose);  
}

function menuClose() {
    document.getElementById("MainMenuContent").classList.remove('show'); 
    document.getElementById("footerOnMenu").classList.remove('show');    

       setTimeout(() => {   
        document.getElementById("MainMenuAside").classList.remove('show'); 
    }, 400);   
    
   BackManager.unregister(menuClose);  
}

let postImgFiles = '';
let postImageBase64 = ''; 

function loadpostIMG(e) {
    postImgFiles = '';
    createpost('IMGpost');

    const file = e.target.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        onalert("Sorry, video isn’t supported");
        return;
    }

    postImgFiles = file;

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.width = "100%";
    wrapper.style.maxHeight = "500px";
    wrapper.style.borderBottomLeftRadius = "40px";
    wrapper.style.borderBottomRightRadius = "40px";
    wrapper.style.display= "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";

    const img = document.createElement("img");
    img.id = 'imgPost';
    img.style.height = '100%';
    img.style.maxHeight = '500px';
    img.style.objectFit = "contain";

    wrapper.appendChild(img);
    imgcont.style.display = "flex";
    imgcont.innerHTML = "";
    imgcont.appendChild(wrapper);

    const reader = new FileReader();

    reader.onload = function(evt) {
        const tempImg = new Image();

        tempImg.onload = function() {
            const canvas = document.createElement("canvas");
            canvas.width = tempImg.width;
            canvas.height = tempImg.height;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);

            const base64 = canvas.toDataURL("image/jpeg", 0.5);

            postImageBase64 = base64; 

            img.src = base64;
        };

        tempImg.src = evt.target.result;
    };

    reader.readAsDataURL(file);
}

/* ---------- Helpers ---------- */
const $ = id => document.getElementById(id);
const qs = sel => document.querySelector(sel);

let postLocation ="";
let feeling ="";


function input(id, quesText) {
    $('loc-feel').style.opacity = "1";
    $('loc-feel').style.transform = "translateX(0)";
    $('inputText').innerText = quesText;

   $("inputData").onclick = () => {
      if(!$('dataInput').value) {
         onalert('Write something first!');
      } else {
         $(id).innerText = $("dataInput").value;
  if(id == "location" || id == "location2") {
             postLocation = $("dataInput").value;   
          } else {
             feeling = $("dataInput").value;       
          }                 
          $("dataInput").value = "";
         $('loc-feel').style.transform = "translateX(100%)";
         $('loc-feel').style.opacity = "0";
      }
   };
   $("removeData").onclick = () => {
         $("dataInput").value = "";
         if(id == "location") {
             postLocation ="";   
          } else {
             feeling ="";       
          }                 
          $('loc-feel').style.transform = "translateX(100%)";
         $('loc-feel').style.opacity = "0";
         $(id).innerText = '___';   
   }
  BackManager.register(cancel);
}

function cancel() {
  BackManager.unregister(cancel);
         $('loc-feel').style.transform = "translateX(100%)";
         $('loc-feel').style.opacity = "0";
}


let selectedVideoFile = null;
let selectedVideoSrc = "";


/* --------- Story Pages ------- */
const FPage = `
<div id="changePort" class="stryPort">
    
   <main style="display:flex; flex-direction: column; justify-content: center; align-items: center; margin: 30px;">
       
     <div id="port" style="display: flex; flex-direction: column; background: transparent; justify-content: center; align-items: center; ">
       
     <section style="width: 100%; margin-bottom: 40%;">
       
      <button onclick="closeStoryPort('b')" style="display: flex; justify-content: center; align-items: center; font-size: 90px; font-weight: bold; color: red; border: none; border-radius: 90px; margin: 90px; background: none; width: 70px; height: 70px;">
          ×
      </button>
      </section>
       
      <input type="file" id="storyFile" accept="video/*" hidden onchange="loadFromGallery(event)">
      

            <button onclick="openGallery()" style="font-size: 30px; width: 400px; height: 200px; background: linear-gradient(-30deg,indigo,blue); border: none; border-radius: 20px; color: white; box-shadow: 0 0 30px green; font-weight: bold;" id="shakeDesign">
          Create Your Story
            </button>
    
        </div>
     
 
    <div style="display: none" id="storyChange">
  
<video id="storyVideo" controls style="width: 100%; max-height: 70%;border-radius: 20px; display: none; margin-top: 30px; background: black;"></video>


<section style="overflow: auto">
  <table align="center">
    <tr>
      <td><button onclick="onconfirm('Do you want to cancel??', 'Are you sure to cancel current operation? Your current progress will be lost! Press OK button if you’re sure.', 'OK', closeStoryPort, '', '#4f46e5')" class="videoBtn">Close</button></td>
      <td><button onclick="openGallery()" class="videoBtn">Change</button></td>
      <td><button onclick="prepearStory()" class="videoBtn">Create</button></td>
    </tr>
  </table>
</section>
</div>

 </main>

</div>
`;

const SPage = ` <br><br>
 <table cellpadding="5" style="margin: 20px;"><tr><td>
    <video id="prepearVideo" muted style="width: 200px; height: 150px; border: 5px solid red;"></video></td>
    
    <td>
<textarea id="storyCaption" placeholder="Write something about this video..." style=" height:150px;border:none;padding:20px;font-size:30px;border-radius:20px; font-family: 'SolaimanLipi', 'Noto Sans Bengali', Arial, sans-serif; background: none;" class="storyErr"></textarea>
</td>

 </tr></table>
   
 <div style="width: 100%; height: 200px; background: none; display: flex; align-items: center; justify-content: flex-end; padding-right: 20px; flex-direction: row;">   
<button class="submitpost" onclick="appClsBtn()" 
    style="background: rgba(0,0,0,0.2); padding:20px; border:none; border-radius:10px; color:white; transition:0.3s; margin:20px; font-size:20px; width: fit-content;">
    Cancel
</button>
<button class="submitpost" onclick="sendStory()" 
    style="background:red; padding:20px; border:none; border-radius:10px; color:white; transition:0.3s; margin:20px; font-size:20px; width: fit-content;" id="submit-story">
    Post Story
</button>

</div>
<section id="stry-ongoing">
     <section class="loadContainer">
     <section class="main-loading-focus"></section>
     <section class="loading-message">Story is posting...<br><span>Please wait a while</span></section>
     </section>
</section>


`;

/* ---------- Open / Close ---------- */
function openGallery(){ 
if(guest) return guestWarn();

$("storyFile").click(); 
}

function openStoryPort(){ 
if(guest) return guestWarn();

BackManager.register(closeStoryPort, 'b');
const page =  document.getElementById("stryPort");
page.style.transform = 'translateY(0)';
page.style.opacity = '1';
page.innerHTML = FPage;

setTimeout(() => {
    darkModeActivate(isDark);
}, 0);
}

function closeStoryPort(o){
  const el = $("stryPort");
el.style.transform = 'translateY(100%)';
el.style.opacity = '0';

}

/* ---------- Load video from gallery ---------- */
function loadFromGallery(e){

  const file = e.target.files[0];
  if(!file) return;

  if(!file.type.startsWith("video")){
    onalert("Only video is supported");
    return;
  }

  selectedVideoFile = file;
  selectedVideoSrc = URL.createObjectURL(file);

  $("storyChange").style.display = "flex";
  const video = $("storyVideo");
  video.src = selectedVideoSrc;
  video.style.display = "block";
  qs('#port').style.display = "none";

  setTimeout(()=>video.play().catch(()=>{}),1000);
   BackManager.register(openStoryPort);
}

/* ---------- Reset / Close story prep ---------- */
function appClsBtn(){
  document.getElementById("stryPort").innerHTML = FPage;
  setTimeout(() => {
    darkModeActivate(isDark);
   }, 0);
    const video = $("storyVideo");
  if(video){ 
      video.pause(); 
      video.currentTime=0; 
  }
    BackManager.register(closeStoryPort, 'b');

}

/* ---------- Prepare story screen ---------- */
function prepearStory(){
 if(!selectedVideoFile) return onalert("Please select a video first!");

 qs("#changePort").innerHTML = SPage;
   BackManager.register(closeStoryPort, 'a');

  const pv = document.getElementById("prepearVideo");
  setTimeout(()=>pv.play().catch(()=>{}),1000);
  darkModeActivate(isDark);
}

async function sendStory(){
  if(!selectedVideoFile) return onalert("No video selected");
  const user = prepearUserForSend('no');
  
  const btn = document.querySelector('#submit-story');
  btn.disabled = true;
  btn.style.background = 'gray';

  const fd = new FormData();
  fd.append("storyVideo", selectedVideoFile);
  fd.append("caption", $("storyCaption")?.value || "");
  fd.append("username", user.username || "");
  fd.append("email", user.email || "");
  fd.append("avatar", user.avatar || "");
    document.getElementById('stry-ongoing').style.display = 'flex';

  try {
    const response = await fetch("https://story-server-9d2k.onrender.com/upload-story", {
      method: "POST",
      body: fd
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
      onalert('something went wrong');
document.getElementById('stry-ongoing').style.display = 'none';
    }

    const data = await response.json();
    
    onalert("Story uploaded ✅");
document.getElementById('stry-ongoing').style.display = 'none';
  btn.forEach(b => {b.disabled = false});
    closeStoryPort();
  } catch (error) {
 document.getElementById('stry-ongoing').style.display = 'none';
    console.error("Story upload failed:", error);
 onalert("Upload failed! Please try again.");
   } finally {
  btn.disabled = false;
  btn.style.background = 'red';
   }
}

loadAllStories();

async function loadAllStories() {

    let container = document.getElementById('container');
    
    let loader =  document.getElementById('stryLoadingDivs');
    
    container.innerHTML = "";
    loader.style.display = 'flex';
    
  try {

    const res = await fetch("https://story-server-9d2k.onrender.com/stories");

    const stories = await res.json();

    loader.style.display = 'none';

    if (!stories.length) {
      container.innerHTML = `<div class="story" style="margin-left: 10px;">
 <p style="font-size: 26px; text-align: center; color: white;">No story uploaded yet.</p>
      </div>`;
      return;
    }


    stories.forEach(story => {
      /* ---------- Story Card ---------- */
      const btn = document.createElement("button");
      btn.style = `
        width:230px;
        height:400px;
        margin:10px;
        border-radius:12px;
        overflow:hidden;
        border:none;
        cursor:pointer;
        position:relative;
        background:black;
        box-shadow: 10px 10px 20px rgba(128,128,128,0.6);
      `;

      /* ---------- Video thumbnail ---------- */
      const video = document.createElement("video");
      video.src = story.path;
      video.muted = true;
      video.preload = "metadata";
      video.playsInline = true;
      video.style = `
        width:100%;
        height:100%;
        object-fit:cover;
        pointer-events:none;
      `;
      video.onloadeddata = () =>
      video.pause();
      /* ---------- Avatar ---------- */
      const avatar = document.createElement("img");
      avatar.src = story.avatar;
      avatar.style = `
        position:absolute;
        top:10px;
        right:10px;
        width:55px;
        height:55px;
        border-radius:50%;
        border: 6px solid black;
        z-index: 100;
      `;

      /* ---------- Username ---------- */
      const username = document.createElement("div");
      username.innerText = story.username || "Anonymous";
      username.style = `
        position:absolute;
        top:0;
        left:0;
        width:50%;
        padding:10px;
        font-size:20px;
        font-weight : bold;
        color:white;
        text-align:left;
        text-shadow: 0 0 15px black;
      `;
      /* ---------- Caption ---------- */
      const caption = document.createElement("div");
      caption.innerText = story.caption || "";
      caption.style = `
        position:absolute;
        bottom:0;
        left:0;
        width: 90%;
        padding:10px;
        font-size:20px;
        font-weight: normal;
        color:white;
        text-align:left;
        text-shadow: 0 0 15px black;
      `;

      /* ---------- Assemble ---------- */
      btn.appendChild(video);
      btn.appendChild(caption);
      btn.appendChild(avatar);
      btn.appendChild(username);

      /* ---------- Click action ---------- */
      btn.onclick = () => showStoryModal(story);

      container.appendChild(btn);
    }); 

  } catch (err) {

    console.error(err);

    loader.style.display = 'none';

    container.innerHTML = `
       <div class="story" style="margin-left: 10px; width: 400px; flex-direction: column;">
         <p style="font-size: 26px; text-align: center; color: red; font-weight: bold;" class="storyErr">Network error</p>
         <p style="font-size: 18px; text-align: center; color: gray; font-weight: bold;">Couldn't load stories due to internet connection. Please check your internet connection first!</p>
         <button class="vibe-retry-btn" onclick="loadAllStories()">Retry</button>
         
       </div>`;
  
   }

  }
function closeStryMmodal(over) {over.remove()}

/* ---------- Custom modal ---------- */
function showStoryModal(story) {

  // remove old modal if exists
  const old = document.getElementById("storyModalOverlay");
  if (old) old.remove();

  /* ---------- Overlay ---------- */
  const overlay = document.createElement("div");
  overlay.id = "storyModalOverlay";
  overlay.style = `
    position:fixed;
    inset:0;
    background:black;
    z-index:1000;
    display:flex;
    justify-content:center;
    align-items:center;
    animation: appStry 0.4s ease;
  `;

  BackManager.register(closeStryMmodal, overlay);
  /* ---------- Story Box ---------- */
  const box = document.createElement("div");
  box.style = `
    position:relative;
    width:100%;
    height:100%;
    display:flex;
    flex-direction:column;
    align-items:center;
  `;

  /* ---------- Header (avatar + name) ---------- */
  const header = document.createElement("div");
  header.style = `
    position:absolute;
    top:15px;
    left:15px;
    display:flex;
    align-items:center;
    gap:10px;
    z-index:2;
  `;

  const avatar = document.createElement("img");
  avatar.src = story.avatar;
  avatar.style = `
    width:54px;
    height:54px;
    border-radius:50%;
    border:5px solid white;
  `;


// Application
const username = document.createElement("span");

const formattedTime = getShortTime(story.created_at);

username.innerText = `${story.username || "Anonymous"} • ${formattedTime}`;

username.style.cssText = `
  color: white;
  font-size: 30px;
  font-weight: 600;
`;

  header.appendChild(avatar);
  header.appendChild(username);

  /* ---------- Close button ---------- */
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "×";
  closeBtn.style = `
    position:absolute;
    top:10px;
    right:15px;
    font-size:72px;
    color:white;
    background:none;
    border:none;
    cursor:pointer;
    z-index: 2;
    margin-right: 5%;
  `;
  closeBtn.onclick = () => overlay.remove();

  /* ---------- Video ---------- */
  const video = document.createElement("video");
  video.src = story.path;
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;
  video.style = `
    width: 95%;
    margin:auto;
    border-radius: 20px;
    bottom : 30px;
  `;

  /* ---------- Caption ---------- */
  const caption = document.createElement("div");
  caption.innerText = story.caption || "";
  caption.style = `
    position:absolute;
    bottom:20px;
    left:0;
    width:60%;
    padding:20px;
    color:white;
    font-size:30px;
    text-align:left;
    background:none;
    z-index:2;
  `;
  /* --------- Story Reactions ------- */
  const reactpanal = document.createElement("div");
  reactpanal.innerHTML = `
  <button onclick="reactAppear(${story.id},'👍')" class="storyReactBtn"> <img src="https://i.ibb.co.com/NgV9p5jg/like.png" alt="" border="0" width="70"> </button> <hr style="width:100%; background: black; height: 2px;">
  <button onclick="reactAppear(${story.id},'♥️')" class="storyReactBtn"> <img src="https://i.ibb.co.com/0RZS0W0F/heart.png" alt="" border="0" width="70"> </button> <hr style="width:100%; background: black; height: 2px;">
  <button id="storyComPort${story.id}" onclick="storyComPort(${story.id})" class="storyReactBtn"> <img src="https://i.ibb.co.com/hRNSdTgD/comment.png" alt="" border="0" width="70"> <div id="stryComCount${story.id}" style="font-size: 20px; text-align: center; margin-top: 10px;"></div></button>  <hr style="width:100%; background: black; height: 2px;">
  <button onclick="" class="storyReactBtn"> <img src="https://i.ibb.co.com/1GVLrGM7/hamburger.png" alt="" border="0" width="70"> </button> 
  `;
  reactpanal.style = `
     position: fixed;
     bottom: 25%;
     right: 20px;
     border-radius: 20px;
     background: rgba(255,255,255,0.4);
     z-index: 2;
     display: flex;
     flex-direction: column;
     padding: 20px;
  `;
  /* -------- React Count --------- */
  const react = document.createElement('button');
  react.id = `reactCount${story.id}`;
  react.style =`
      background: none;
      border: none;
      font-size: 25px;
      font-weight: bold;
      color: white;
      position: absolute;
      z-index: 2;
      right: 10px;
      bottom: 20px;
      width: 20%;
   `;

  /* -------- react panal --------- */
  const panal = document.createElement('div');
  panal.id = `stryReact${story.id}`;
  panal.className = 'todark';
  panal.style =`
     position: fixed;
     background: white;
     border-top-right-radius: 40px; 
     border-top-left-radius: 40px; 
     width: 100%;
     height: 60%;
     z-index: 1010;
     display: block;
     bottom: 0;
     padding: 20px;
     transition: all 0.4s ease;
     opacity: 0;
     transform: translateY(100%);
   `;
   panal.innerHTML = `
    <h1 style="color: green; margin-left: 20px; position: relative; z-index: 10; width: 100%; background: none; backdrop-filter: blur(12px); "> Reactions: </h1><hr> 
  <div id="appearReactors${story.id}" style="margin-top: 20px; padding: 30px;">Loading reactors...</div>    
   `;
  /* -------- Comment Box --------- */
 const comBox = document.createElement('div');
 comBox.id = `commentBox${story.id}`;
 comBox.innerHTML=`
 <div style="     
     position: fixed;
     background: white;
     border-top-right-radius: 40px; 
     border-top-left-radius: 40px; 
     width: 100%;
     height: 60%;
     z-index: 1010;
     display: block;
     bottom: 0;"    
     class="ondmode">
  
<div style="padding: 30px; overflow: auto">
    <h1 style="color: green; position: relative; z-index: 10; width: 100%; background: none; backdrop-filter: blur(12px);"> Comments: </h1>
    <hr>
 <div id="showStoryCom${story.id}" style="padding-top: 30px;">
 </div>
 </div>
    <div style="position: fixed; display: flex; z-index: 1014; bottom: 0px; width: 100%; padding: 25px; background: transparent; border-top: 2px solid black;">
    <input id="storycom" type="text" placeholder="Write a comment about this story..." style="font-size: 25px; padding: 25px; border-radius: 90px; width: 70%; box-shadow: 0 0 8px gray; border: none; background: none;" class="storyErr"/>
        <button onclick="sendStoryCom(${story.id})" id="sendStoryCom${story.id}" style="background: none; margin-left: 30px; border: none; border-radius: 90px; box-shadow: 0 0 8px gray; padding: 0 20px;" class="storyErr">  
           <img src="https://i.ibb.co.com/JZTLHkQ/send.png" alt="" width="50">
        </button>
  </div>
</div>
 `;
   comBox.style = `
    position: fixed;
    background: none;
    width: 100%;
    height: 100%;
    z-index: 1009;
    bottom: 0;
    right: 0;
    transition: all 0.4s ease;
    opacity: 0;
    transform: translateY(100%);
`;
  /* ---------- Assemble ---------- */
  box.appendChild(header);
  box.appendChild(closeBtn);
  box.appendChild(panal);
  box.appendChild(comBox);
  box.appendChild(reactpanal);
  box.appendChild(video);
  box.appendChild(caption);
  box.appendChild(react);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
    reactCounts(story.id);

 const comPort = document.getElementById(`storyComPort${story.id}`);
const boxOfCom = document.getElementById(`commentBox${story.id}`);

 const reactPort = document.getElementById(`stryReact${story.id}`);
 const reactBtn = document.getElementById(`reactCount${story.id}`);

comPort.addEventListener('click', () => {
  boxOfCom.style.transform = 'translateY(0)';
  boxOfCom.style.opacity = '1';
  prepearForCloseC(story.id);
  darkModeActivate(isDark);
});

window.addEventListener('popstate', () => {
  boxOfCom.style.transform = 'translateY(100%)';
  boxOfCom.style.opacity = '0';
  reactCounts(story.id);
});

reactBtn.addEventListener('click', () => {
  reactPort.style.transform = 'translateY(0)';
  reactPort.style.opacity = '1';
  reactorsOnStory(story.id);
  prepearForCloseR(story.id);
  darkModeActivate(isDark);
});

}

// Time Shortener Function
const getShortTime = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 52) return `${weeks}w`;
  
  const years = Math.floor(weeks / 52);
  return `${years}y`;
};


function prepearForCloseR(id) {
 BackManager.register(closeReactMmodal, id);   
}
function closeReactMmodal(id) {
 const reactPort = document.getElementById(`stryReact${id}`);
    
  reactPort.style.transform = 'translateY(100%)';
  reactPort.style.opacity = '0';
  reactCounts(id);
  BackManager.unregister(closeReactMmodal, id);
}

function prepearForCloseC(id) {
 BackManager.register(closeComMmodal, id);   
}
function closeComMmodal(id) {
 const reactPort = document.getElementById(`commentBox${id}`);
    
  reactPort.style.transform = 'translateY(100%)';
  reactPort.style.opacity = '0';
  reactCounts(id);
 BackManager.unregister(closeComMmodal, id);   
}


function removePost(el) {
    const target = document.getElementById(el);
    if (target && target.parentElement) {
        target.parentElement.classList.add('remove');
    } else {
        console.error("Element or Parent not found!");
    }
}

function closealertAdv(id, postId) {
    document.getElementById(id).style.display = 'none';
    updateCounts(postId);
}

// Open menu 
function postMenu(e) { 

if(guest) return guestWarn();

e.stopPropagation();

const menu = document.getElementById("postMenu"); 

        menu.classList.add('show'); 

        BackManager.register(clzpostMenu); 
    } 

// Close menu 
function clzpostMenu() { 
document.getElementById("postMenu").classList.remove('show'); 
    BackManager.unregister(clzpostMenu); 
} 

 document.getElementById("postMenu") .addEventListener("click", (e) => { 
e.stopPropagation(); 
    }); document.addEventListener("click", () => {
     clzpostMenu(); 
  }); 

let receiver_id ="";

async function connect(reqBtn) {
if(guest) return guestWarn();

const el = reqBtn || document.querySelector("#connectionBtn");

const user = JSON.parse(localStorage.getItem('user'));
const sender_id = user.email;

        if(el){
            el.innerText = "On process..";
            el.disabled = true;
         }

    try {

        const res = await fetch(`https://connection-server-9bzk.onrender.com/connections`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sender_id,
                receiver_id
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Request Failed");
        }
        if(res.ok){
            el.innerText = "Request sent";
            el.disabled = true;
            }

        onalert(data.message);

    } catch (err) {

        onalert(err.message);
        console.error(err);
        if(el){
            el.innerText = "Add Connection";
            el.disabled = false;
            }

    }

}

async function handleFollow(followerEmail, followedId, reqBtn) {

    reqBtn.innerText = 'On process..';
    reqBtn.disabled = true;
    
    try {
        const response = await fetch('https://page-server-jqce.onrender.com/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                follower: followerEmail,
                followed: followedId
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('Followed successfully! Updated followers:', result.followers);
        reqBtn.innerText = 'Unfollow';
        reqBtn.disabled = false;
        reqBtn.onclick = () => handleUnfollow(followerEmail, followedId, reqBtn);
        } else {
            onalert(result.message);
        reqBtn.innerText = 'Follow';
        reqBtn.disabled = false;
    
        }
    } catch (err) {
        console.error('Error:', err);
        onalert('Failed to follow');
        reqBtn.innerText = 'Follow';
        reqBtn.disabled = false;
    } 
}

async function handleUnfollow(followerEmail, followedId, reqBtn) {

    reqBtn.innerText = 'On process..';
    reqBtn.disabled = true;
    
    try {
        const response = await fetch('https://page-server-jqce.onrender.com/unfollow', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                follower: followerEmail,
                followed: followedId
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('Unfollowed successfully! Updated followers:', result.followers);
        reqBtn.innerText = 'Follow';
        reqBtn.disabled = false;
        reqBtn.onclick = () => handleFollow(followerEmail, followedId, reqBtn);
        } else {
            alert(result.message);
        reqBtn.innerText = 'Unfollow';
        reqBtn.disabled = false;
        }
    } catch (err) {
        console.error('Error:', err);
        reqBtn.innerText = 'Unfollow';
        reqBtn.disabled = false;
    }
    
}


// ==================== JOIN GROUP ====================

async function joinGroup(groupId, btn) {

    btn.innerText = 'On process..';
    btn.disabled = true;

    try {
        const user = JSON.parse(localStorage.getItem('user'));

        if (!user || !user.email) {
            onalert('Please sign in first.');
            return;
        }

        const res = await fetch(
            `https://group-server-xlcs.onrender.com/api/groups/${encodeURIComponent(groupId)}/join`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: user.email
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error('Req has not been sent');
            onalert(data.error || data.message || 'Failed to join group.');
            return;
        }
        
        btn.innerText = 'Leave';
        btn.disabled = false;
        btn.onclick = () => leaveGroup(groupId, btn);

        onalert(data.message || 'Successfully joined the group!');

        console.log('Joined group:', data.group);

        return data.group;

    } catch (err) {
        console.error('Join group error:', err);
        onalert('Network error. Please try again.');
        btn.innerText = 'Join';
        btn.disabled = false;
    }
    
}


// ==================== LEAVE GROUP ====================

async function leaveGroup(groupId, btn) {

    btn.innerText = 'On process..';
    btn.disabled = true;

    try {
        const user = JSON.parse(localStorage.getItem('user'));

        if (!user || !user.email) {
            onalert('Please sign in first.');
            return;
        }

        const res = await fetch(
            `https://group-server-xlcs.onrender.com/api/groups/${encodeURIComponent(groupId)}/leave`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: user.email
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error('Req has not been sent');
            onalert(data.error || data.message || 'Failed to leave group.');
            return;
        }

        onalert(data.message || 'Successfully left the group.');

        btn.innerText = 'Join';
        btn.disabled = false;
        btn.onclick = () => joinGroup(groupId, btn);
        console.log('Left group:', data.group);

    } catch (err) {
        btn.innerText = 'Leave';
        btn.disabled = false;
        console.error('Leave group error:', err);
        onalert('Network error. Please try again.');
    }
   
}

async function positionCheck(email, type, btn) {

     const u = JSON.parse(localStorage.getItem('user'));
    
    let API;
    
    if (type === 'id') {
      API = `https://connection-server-9bzk.onrender.com/friends/${encodeURIComponent(email)}`;
    } else if (type === 'page') {
      API =`https://page-server-jqce.onrender.com/get-followers/${email}`  
    } else if (type === 'group') {
       API = `https://group-server-xlcs.onrender.com/api/groups/${email}`    
    } else {
        console.error('Type is required');
        btn.style.display = 'none';
        return;
    } 
    
    try {
    
        const res = await fetch(API);
        
        if(!res.ok) {
            throw new Error('Req has not been sent');
            btn.style.display = 'none';
            return;
        }
        
        const data = await res.json();
        
        if (type === 'group') {

         const admins = data.admin_email;
         if(admins.includes(u.email)) {
            btn.innerText = 'Admin'; 
            btn.disabled = true;
            return;
         } 
                
         const members = data.members_email;
         if(members.includes(u.email)) {
            btn.innerText = 'Leave'; 
            btn.onclick = () => console.log();
            return;
         } 
         
            btn.innerText = 'Join';          
            btn.onclick = () => joinGroup(email, btn);
                
        } else if (type === "page") {

          if(data.followers.includes(u.email)) {
                btn.innerText = 'Unfollow';          
                btn.onclick = () =>  handleUnfollow(u.email, email, btn);
              
          } else {
                btn.innerText = 'Follow';          
                btn.onclick = () => handleFollow(u.email, email, btn);
              
          }
        } else {

          for (const i of data.data) {
            
                if (i.sender_id === u.email || i.receiver_id === u.email) {
                    btn.innerText = 'Connected';          
                    btn.disabled = true;
                    return;
                }
           }
          
           btn.innerText = 'Add Connection';          
           btn.disabled = false;
           btn.onclick = () => connect(btn);
           receiver_id = email;          
        }
        
    } catch(err) {
        console.error(err);
        btn.style.display = 'none';
    }
        
}

async function messageWithNexttalk() {
if(guest) return guestWarn();

  if (!receiver_id) {
    alert("Receiver ID parameter missing!");
    return;
  }

  const backendUrl = `https://nextalk-user-server.onrender.com/get/api/verify-receiver/${receiver_id}`;

  try {
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.text();
 
    if (response.ok && data == 'yes') {
      startChatSession(receiver_id);
    } else if (response.ok && data == 'no') {
    onalert('Cannot send messages');
    } else {
      const errorMessage = data.message || "User does not exist in our database.";
      console.error(`Cannot send message due to: ${errorMessage}`);
    onalert('something went wrong');
    }

  } catch (error) {
    console.error("Network or server error:", error);
    onalert("Cannot send message due to a network connection issue. Please try again!");
  }
}



function startChatSession(friendEmail) {
            if (!friendEmail) return;
            window.location.href = `https://7930navid.github.io/nextalk/nextalk-chat.html?friend=${encodeURIComponent(friendEmail)}`;
  
}

function showOtherInfo(key, from) {

    if (from === "id") {
        showOtherProf(key);
    } else if (from === "page") {
        showOtherPage(key);        
    } else if (from === "group") {
        showOtherGroup(key);        
    } else {
        console.error('Type is required');
        return;
    }
}

async function showOtherProf(email) {
    const overlay = document.getElementById("otherProf");
    const upperlay = document.getElementById("othProfInfo");
    const nameEl = document.getElementById("othProfName");
    const bioEl = document.getElementById("otherProfdiv");
    const picEl = document.getElementById("othProfPic");
    const postsDiv = document.getElementById("otherPosts");
    const reelsDiv = document.getElementById("otherReels");
    const friendList = document.getElementById("showOnes");
    const postTab = document.getElementById('postTab');
    const clipTab = document.getElementById('clipTab');
    const reqBtn = document.getElementById('connectionBtn');
    

    overlay.classList.add("show");


    BackManager.register(remove);

    receiver_id ="";
    receiver_id = email;
    
    postTab.addEventListener('click', () => {
      tabSelectOth(postTab);
      postsDiv.innerHTML ="";
      reelsDiv.innerHTML ="";
      loadProfilePosts(email, 'otherPosts');      
    });
    clipTab.addEventListener('click', () => {
      tabSelectOth(clipTab);
      postsDiv.innerHTML ="";
      reelsDiv.innerHTML ="";
      clipNovas(email, 'otherReels');
         
    });

    postsDiv.innerHTML = "";
    reelsDiv.innerHTML ="";

    const token = localStorage.getItem("token");

    try {
        /* 🔹 Fetch profile */
        const userRes = await fetch(
            `https://users-server-xyvg.onrender.com/me?email=${encodeURIComponent(email)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!userRes.ok) throw new Error("Profile not found");
        const user = await userRes.json();

        nameEl.innerText = user.username || "Unknown";
        bioEl.innerText = user.bio || "No bio";
        picEl.src = user.avatar || "";
        picEl.addEventListener('click', (e) => {
          disProf(user.avatar);   
        });
       
        upperlay.style.backgroundImage = `url('${user.cover_photo}')`;
        
        $('othadd').innerText = user.address;
        $('othstatus').innerText = user.status;
        $('othmerst').innerText = user.marital_status;
        $('othgender').innerText = user.gender;
        $('othlang').innerText = user.language;
        $('othedu').innerText = user.education;
        
        positionCheck(email, 'id', reqBtn);
        loadConnections(receiver_id, 'showOnes');
        loadProfilePosts(email, 'otherPosts')

    } catch (err) {
        console.error(err);
        loadConnections('netErr', 'showOnes');
        postsDiv.innerHTML = `
         <div style="display: flex; justify-content: center; align-items: center; width: auto; min-height: 250px; padding: 20px;">
        <div style="text-align: center; background: rgba(255, 255, 255, 0.05); padding: 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid rgba(200,200,200,0.2);">
            <div style="font-size: 45px; margin-bottom: 10px;">⚠️</div>
            <h2 style="color: #ff4d4d; font-size: 30px; margin-bottom: 8px;">Network Error</h2>
            <p style="color: gray; font-size: 20px; margin-bottom: 20px;">Failed to load posts. Please check your connection.</p>
            <button onclick="showOtherProf('${email}')" style="background: linear-gradient(135deg, #ff8008, #ffc837); color: white; padding: 10px 25px; border-radius: 25px; border: none; font-size: 22px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(255,128,8,0.3);">
                 Retry
            </button>
        </div>
    </div>`;
    }
}

function removeOtherGroup() {
    const overlay = document.getElementById("groupShow");
    const moreEl = document.getElementById("group-discription");
    overlay.classList.remove('show');    
    moreEl.innerHTML = '';
}

async function showOtherGroup(id) {
    const overlay = document.getElementById("groupShow");
    const upperlay = document.getElementById("groupInfo");
    const nameEl = document.getElementById("groupProfName");
    const bioEl = document.getElementById("groupProfdiv");
    const picEl = document.getElementById("groupProfPic");
    const postsDiv = document.getElementById("groupPosts");
    const moreEl = document.getElementById("group-discription");
    const btn = document.getElementById("joinBtn");
    

    overlay.classList.add("show");

    moreEl.style = `
         background: rgba(200,200,200,0.1);
         padding: 20px;
         margin: 20px;
         border-radius: 20px;
     `; 



    BackManager.register(removeOtherGroup);

    postsDiv.innerHTML = "";
    
    const token = "";

    try {
        const res = await fetch(`https://group-server-xlcs.onrender.com/api/groups/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!res.ok) throw new Error("Profile not found");
        const user = await res.json();

        nameEl.innerText = user.groupname;
        bioEl.innerText = user.purpus;
        picEl.src = user.avatar || "";
        picEl.addEventListener('click', (e) => {
          disProf(user.avatar);   
        });
        upperlay.style.backgroundImage = `url('${user.cover_photo}')`;
        
        adminActiveLoad(user.admin_email, '#oth-group-admins');

        loadActiveMembers(user.members_email, '#showMembers');
        positionCheck(id, 'group', btn);
        
        if(user.purpus) {
         const div = document.createElement('div');
         div.style = `
             font-size: 25px;
             color: purple;
             margin: 15px;
             margin-left: 0;
         `;
         div.innerHTML = `<b>Purpus : ${user.purpus}</b>`;
          moreEl.appendChild(div);
         }    

        if(user.short_discription) {
          const div = document.createElement('div');
         div.style = `
             font-size: 22px;
         `;
         div.innerText = user.short_discription;
         moreEl.appendChild(div);
        }    

        
        loadProfilePosts(id, 'groupPosts')

    } catch (err) {
        console.error(err);
        loadConnections('netErr', 'showOnes');
        postsDiv.innerHTML = `
         <div style="display: flex; justify-content: center; align-items: center; width: auto; min-height: 250px; padding: 20px;">
        <div style="text-align: center; background: rgba(255, 255, 255, 0.05); padding: 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid rgba(200,200,200,0.2);">
            <div style="font-size: 45px; margin-bottom: 10px;">⚠️</div>
            <h2 style="color: #ff4d4d; font-size: 30px; margin-bottom: 8px;">Network Error</h2>
            <p style="color: gray; font-size: 20px; margin-bottom: 20px;">Failed to load posts. Please check your connection.</p>
            <button onclick="showOtherGroup('${id}')" style="background: linear-gradient(135deg, #ff8008, #ffc837); color: white; padding: 10px 25px; border-radius: 25px; border: none; font-size: 22px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(255,128,8,0.3);">
                 Retry
            </button>
        </div>
    </div>`;
    }
}

function removeOtherPage() {
    const overlay = document.getElementById("pageShow");
    overlay.classList.remove('show');    
}

async function showOtherPage(id) {
    const overlay = document.getElementById("pageShow");
    const upperlay = document.getElementById("pageInfo");
    const nameEl = document.getElementById("pageProfName");
    const picEl = document.getElementById("pageProfPic");
    const postsDiv = document.getElementById("otherPagePosts");
    const moreEl = document.getElementById("page-discription");
    const btn = document.getElementById("followBtn");
    
    overlay.classList.add("show");

    BackManager.register(removeOtherPage);

    postsDiv.innerHTML = "";
    
    const token = "";

    try {
        const res = await fetch(`https://page-server-jqce.onrender.com/api/pages/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!res.ok) { 
            throw new Error("Profile not found");
            return;
        }
        
        const user = await res.json();
        
        nameEl.innerText = user.username;
        picEl.src = user.avatar || "";
        picEl.addEventListener('click', (e) => {
          disProf(user.avatar);   
        });
        upperlay.style.backgroundImage = `url('${user.cover_photo}')`;
        
        user.websites.forEach(m => {
            const div = document.createElement('div');
            div.className = 'page-link-card';
            div.innerHTML = `
              <div>
                <label>${m.title}</label>
                <a class="site-links" href="${m.url}">VISIT SITE</a>
              </div>

              <div>
                 <u>${m.url}</u>
              </div>
            `;
        
           moreEl.appendChild(div);
        });

        
        positionCheck(id, 'page', btn);
        
        loadFollowers(id, '#showOtherFollowers');
                
        loadProfilePosts(id, 'otherPagePosts')

    } catch (err) {
        console.error(err);
        loadConnections('netErr', 'showOnes');
        postsDiv.innerHTML = `
         <div style="display: flex; justify-content: center; align-items: center; width: auto; min-height: 250px; padding: 20px;">
        <div style="text-align: center; background: rgba(255, 255, 255, 0.05); padding: 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid rgba(200,200,200,0.2);">
            <div style="font-size: 45px; margin-bottom: 10px;">⚠️</div>
            <h2 style="color: #ff4d4d; font-size: 30px; margin-bottom: 8px;">Network Error</h2>
            <p style="color: gray; font-size: 20px; margin-bottom: 20px;">Failed to load posts. Please check your connection.</p>
            <button onclick="showOtherProf('${email}')" style="background: linear-gradient(135deg, #ff8008, #ffc837); color: white; padding: 10px 25px; border-radius: 25px; border: none; font-size: 22px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(255,128,8,0.3);">
                 Retry
            </button>
        </div>
    </div>`;
    }
}


function closealert(id) {
    document.getElementById(id).style.display = "none";
}

function remove() {
     const overlay = document.getElementById("otherProf");
    const upperlay = document.getElementById("othProfInfo");
    const nameEl = document.getElementById("othProfName");
    const bioEl = document.getElementById("otherProfdiv");
    const picEl = document.getElementById("othProfPic");
    const postsDiv = document.getElementById("otherPosts");
    const friendList = document.getElementById("showOnes");

    nameEl.innerText ="";
    bioEl.innerText ="";
    picEl.src ="";
    postsDiv.innerHTML ="";
    friendList.innerHTML ="";
    receiver_id ="";
    overlay.classList.remove("show");
    resetbtn.disabled = false;
    BackManager.unregister(remove);
}

let allChange;

function profile() {

if(guest) return guestWarn();

    const profileBtn = document.getElementById('profPicture');
    profileBtn.disabled = true;

    const u = returnUser();
    const s = JSON.parse(styleString);

    const change = document.getElementById('allChange');
    
    allChange = change.outerHTML;  
      
    change.innerHTML =`
 <div id="profdiv">
     <table align="center"><tr><td width="270">
     <img id="profPic" onclick="disProf('${u.avatar}')">       
      <div id="editbtn">
         <a href="../profileEdit.html">
      <button>
         <img src="https://i.ibb.co.com/HfyLkxKy/edit.png" alt="" border="0" width="30">
      </button>
          </a>
        </div>
         </div>
    </td><td width="400">
     <p id="userName"></p>
     <h3 id="profileBio"></h3>
  </td></tr></table>
      </div>
      
 <div id="moreInfo"></div>     
    

  <div class="tab-switching" id="tabs" style="display: none">
      
    <div class="tab-items active" onclick="profile(); loadProfile();">Posts</div>
    <div class="tab-items" onclick="tabSelect(this); ownerClips('${u.unique}', '${u.avatar}')">ClipNovas</div>
  </div>
  
 <div id="ownerPosts"></div>
 <div style="height: 300px;width: 100%;"></div> 
    
    `;
    
    if(u.type === 'page') {
        moreInfoPage();
        loadFollowers(u.unique, '#followerList');  
        $('editbtn').style.display = 'none';      
    } else if (u.type === 'group') {
        moreInfoGroup(); 
        adminActiveLoad(u.admin_email, '#admin-panel div');
        loadActiveMembers(u.members_email, '#memberList');   
    } else {
        moreInfoAcc();
        loadConnections(u.unique, 'connectionList');
        $('editbtn').style.display = 'flex';      
        $('tabs').style.display = 'flex';      
    }

        loadProfilePosts(u.unique, 'ownerPosts');    

        darkModeActivate(isDark);
    

    document.getElementById('profPic').src =`${u.avatar}`;       
    document.getElementById('userName').innerHTML = `${u.username}`;  
         
    if(u.bio) {
        document.getElementById('profileBio').innerHTML = `${u.bio}`;         
    } else {
        document.getElementById('profileBio').style.display = 'none';         
        
    }
    document.getElementById('profdiv').style.backgroundImage =
  `url('${u.cover_photo}')`;

    BackManager.register(home);      
}


function moreInfoAcc() {
    const container = document.getElementById('moreInfo');
    const more = localStorage.getItem('info');
    const m = JSON.parse(more);
    
    container.innerHTML = `

      <div style="position: relative; width: 100%;">
       <a href="../pickInfo.html" style="margin: 20px; padding: 10px; font-size: 20px; width: auto; box-shadow: 2px 2px 7px lightgray; border-radius: 14px; color: black; text-decoration: none; z-index: 900; position: absolute; right: 30px; display: flex; align-items: center;" id="infoBtn">   

 <img src="https://i.ibb.co.com/HfyLkxKy/edit.png" alt="" style="width: 20px; margin-right: 10px">
          <span> Edit info</span>

</a>
       
       </div>
<div class="Id-information" id="profileMore">
<section>Address</section>
  <div>
      <img src="https://api.iconify.design/lucide:map-pin.svg?color=%23475569">
      <span id="add">${m.address}</span>
  </div> 
  <section>Status</section>
  <div>
      <img src="https://api.iconify.design/lucide:briefcase.svg?color=%23475569">
      <span id="status">${m.status || m.status_custom}</span>
  </div>
  <section>Marital Status</section>
  <div>
      <img src="https://api.iconify.design/lucide:heart.svg?color=%23475569">
      <span id="merst">${m.marital_status || m.marital_custom}</span>
  </div> 
  <section>Gender</section>
  <div>
      <img src="https://api.iconify.design/lucide:user.svg?color=%23475569">
      <span id="gender">${m.gender || m.gender_custom}</span>
  </div> 
  <section>Language</section>
  <div>
      <img src="https://api.iconify.design/lucide:languages.svg?color=%23475569">
      <span id="lang">${m.language || m.language_custom}</span>
  </div>
  <section>Education</section>
  <div>
      <img src="https://api.iconify.design/lucide:graduation-cap.svg?color=%23475569">
      <span id="edu">${m.education || m.education_custom}</span>
  </div>
     
  </div> 
    <br><br><br> 
 
  <h1 class="storyErr">Connected Persons</h1><hr>
  <div id="connectionList">

  <div class="friendShow">
  <div class="main-loading-focus"></div>
  <br>
  <h3>Loading ones...</h3>  
  </div>      

  <div class="friendShow">
  <div class="main-loading-focus"></div>
  <br>
  <h3>Loading ones...</h3>  
  </div>      

  <div class="friendShow">
  <div class="main-loading-focus"></div>
  <br>
  <h3>Loading ones...</h3>  
  </div>      

  </div><hr>
    
    `;
    
    
}

function moreInfoPage() {

    const container = document.getElementById('moreInfo');
    const more = returnUser();
    const m = more.websites || [];
    
    container.innerHTML = `

      <div style="position: relative; width: 100%;">
       <button onclick="location.href = '../pageEdit.html'" style="margin: 20px; padding: 10px; font-size: 20px; width: auto; box-shadow: 2px 2px 7px lightgray; border-radius: 14px; color: black; text-decoration: none; z-index: 900; position: absolute; right: 30px; display: flex; align-items: center; border: none;" id="infoBtn">   

 <img src="https://i.ibb.co.com/HfyLkxKy/edit.png" alt="" style="width: 20px; margin-right: 10px">
          <span> Edit page </span>

</button>
       
       </div>
       
<div id="pageMore">
    <div style='padding-top: 100px; background: none;'></div>
</div> 

    <br><br><br> 
 
  <h1 class="storyErr">Followers</h1><hr>
  <div id="followerList">

  <div class="friendShow">
  <div class="main-loading-focus"></div>
  <br>
  <h3>Loading ones...</h3>  
  </div>      

  <div class="friendShow">
  <div class="main-loading-focus"></div>
  <br>
  <h3>Loading ones...</h3>  
  </div>      

  <div class="friendShow">
  <div class="main-loading-focus"></div>
  <br>
  <h3>Loading ones...</h3>  
  </div>      

  </div><hr>
    
    `;


    const urls = document.getElementById('pageMore');
    m.forEach(m => {
        const div = document.createElement('div');
        div.className = 'page-link-card';
        div.innerHTML = `
          <div>
            <label>${m.title}</label>
            <a class="site-links" href="${m.url}">VISIT SITE</a>
          </div>

          <div>
             <u>${m.url}</u>
          </div>
        `;
        
       urls.appendChild(div);
    });
    
}

function moreInfoGroup() {

    const container = document.getElementById('moreInfo');
    const more = returnUser();
    const members = more.members_email || [];
    const admins = more.admin_email || [];
    const account = JSON.parse(localStorage.getItem('user'));
    
    container.innerHTML = `

      <div style="position: relative; width: 100%;">
       <button onclick="location.href = '../groupEdit.html'" style="margin: 20px; padding: 10px; font-size: 20px; width: auto; box-shadow: 2px 2px 7px lightgray; border-radius: 14px; color: black; text-decoration: none; z-index: 900; position: absolute; right: 30px; display: none; align-items: center; border: none;" id="infoBtn">   

 <img src="https://i.ibb.co.com/HfyLkxKy/edit.png" alt="" style="width: 20px; margin-right: 10px">
          <span> Edit group </span>

</button>
       
       </div>

    <div>
    <div style="padding-top: 100px"></div> 
    <div id="groupMore"></div>
    </div> 

   <div id="admin-panel">
       <h1 class="storyErr" style="margin-top: 100px;">Admins</h1>
       <div>
           <div class="postLoad"></div>
       </div>
   </div>

    <br><br><br> 
 
  <h1 class="storyErr">Members</h1><hr>
  <div id="memberList">

  <div class="friendShow">
  <div class="main-loading-focus"></div>
  <br>
  <h3>Loading ones...</h3>  
  </div>      

  <div class="friendShow">
  <div class="main-loading-focus"></div>
  <br>
  <h3>Loading ones...</h3>  
  </div>      

  <div class="friendShow">
  <div class="main-loading-focus"></div>
  <br>
  <h3>Loading ones...</h3>  
  </div>      

  </div><hr>
    
    `;

    const moreEl = document.getElementById('groupMore');
    moreEl.style = `
         background: rgba(200,200,200,0.1);
         padding: 20px;
         margin: 20px;
         border-radius: 20px;
     `; 
    if(more.purpus) {
     const div = document.createElement('div');
     div.style = `
         font-size: 25px;
         color: purple;
         margin: 15px;
         margin-left: 0;
     `;
     div.innerHTML = `<b>Purpus : ${more.purpus}</b>`;
     moreEl.appendChild(div);
    }    

    if(more.short_discription) {
     const div = document.createElement('div');
     div.style = `
         font-size: 22px;
     `;
     div.innerText = more.short_discription;
     moreEl.appendChild(div);
    }  
   
    const adminArray = JSON.parse(decodeURIComponent(admins)); 

    if(adminArray.includes(account.email)) {
     const editBtn = document.getElementById('infoBtn'); 
     editBtn.style.display = 'flex';
    }  
}


function home() {
    const profileBtn = document.getElementById('profPicture');
    const change = document.getElementById('allChange');
    const m = localStorage.getItem('dark');
    
       if(allChange) {
    change.innerHTML = allChange;           
       } else {
           location.reload();
       }
     darkModeActivate(m);
     profileBtn.disabled = false;
}

function ownerClips(email, avatar) {
    const allChange = document.getElementById('ownerPosts');
    
    allChange.innerHTML = `
        <div id="showClip"></div>`;
    
     document.getElementById('showClip').innerHTML = reelUploadBtn;
   
    const el = document.getElementById('clipUpload');
    if (el) {
        el.style.backgroundImage = `url('${avatar}')`;
    }

    clipNovas(email, 'showClip');    
}


function helperForLoad() {
document.getElementById('takeClip').click();
}

let selectedReels = null;
let selectedReelSrc ="";

function loadReels(e) {
  const file = e.target.files[0];
  if(!file) return;

  if(!file.type.startsWith("video")) {
    onalert("Only video is supported");
    return;
  }
  
  const u = returnUser();

  selectedReels = file;
  selectedReelSrc = URL.createObjectURL(file);

  const video = $("clip-nova");
  video.src = selectedReelSrc;
  $('clip-take-overlay').classList.add('open');
  qs('.clip-header h3').innerText = u.username;
  qs('.clip-header img').src = u.avatar;
  
  setTimeout(()=>video.play().catch(()=>{}),1000);
   BackManager.register(closeReelPage);
}

const reelUploadBtn = ` 
     <div class="clipUpload" id="clipUpload" onclick="helperForLoad()">
     <input type="file" accept="video/*" onchange="loadReels(event)" id="takeClip" hidden>
      <div class="labal">
           <svg width="50" height="50" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Horizontal Line -->
  <line 
    x1="8" 
    y1="32" 
    x2="56" 
    y2="32" 
    stroke="white" 
    stroke-width="3.5" 
    stroke-linecap="round"
  />
  
  <!-- Vertical Line -->
  <line 
    x1="32" 
    y1="8" 
    x2="32" 
    y2="56" 
    stroke="white" 
    stroke-width="3.5" 
    stroke-linecap="round"
  />
    </svg>
      </div>
  </div>
`;

function closeReelPage() {
  $('clip-take-overlay').classList.remove('open');
  $("clip-nova").pause();

    let el = qs('.clip-header button');
        el.disabled = false;
        el.innerText = 'Post';
        el.style.background = 'blue';
    BackManager.register(closeReelPage);}

async function uploadClip() {
    let el = qs('.clip-header button');

    try {
        const u = prepearUserForSend('not');
        let email = u.email || "";
        let username = u.username || "";
        let avatar = u.avatar || "";

        let location = $('clip-location')?.value || "";
        let feelings = $('clip-feeling')?.value || ""; 
        let tags_people = taggedEmailList || []; 

 
        let videoFile = selectedReels;
        let caption = $('clip-caption').value || '';
        
        if(!videoFile) {
            onalert("Pleaae select a video file!");
            return;          
        }

        const formData = new FormData();
        formData.append("username", username);
        formData.append("avatar", avatar);
        formData.append("email", email);
        formData.append("location", location);
        formData.append("feelings", feelings);
        formData.append("caption", caption);
        
        formData.append("tags_people", JSON.stringify(tags_people));
        
        formData.append("video", videoFile);

        el.disabled = true;
        el.innerText = 'Posting...';
        el.style.background = 'gray';
        
        const response = await fetch('https://reels-server-40uv.onrender.com/api/reels', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            onalert("Clip has been posted successfully");

        el.disabled = false;
        el.innerText = 'Post';
        el.style.background = 'blue';
        
            
        } else {
            onalert(` ${data.error || 'Unknown error'}`);

        el.disabled = false;
        el.innerText = 'Post';
        el.style.background = 'blue';
        
        }

    } catch (err) {
        console.error("Upload error:", err);
        onalert("Please check your network");

        el.disabled = false;
        el.innerText = 'Post';
        el.style.background = 'blue';
        
    }
}

async function clipNovas(email, place) {

    let pl = document.getElementById(place);
    if (!pl) return; 
    
    let el =     document.getElementById(`netErrClip${place}`);

    if(el) el.style.display = 'none';
        
    const u = returnUser();
    
    let i;
    if(email === u.unique) {i = 5}
    else {i = 6}

    for (let j = 1; j <= i; j++) {
        let loaderDiv = document.createElement('div');
        loaderDiv.className = 'loaderClip';
        pl.appendChild(loaderDiv);
     }
     
        const loaders = pl.querySelectorAll('.loaderClip');

    try {
        const response = await fetch(`https://reels-server-40uv.onrender.com/api/reels/user?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        loaders.forEach((i) => {i.style.display = 'none'});

        if (response.ok) {
        
           if(data.length < 1) {
                pl.innerHTML = `
             <div>
                 No clips yet
             </div>
            `               
           }
          
            data.forEach(item => {
                const showClip = document.createElement('div');
                showClip.innerHTML = `
                <button style="border: none; background: none; animation: divAppear 0.35s ease-in forwards;" id="openBtn${item.id}">
                    <video src="${item.vid}" id="reel${item.id}" class="clips" onclick="window.location.href='../reels.html?show=${item.id}'"></video>
                </button>
                `;
                pl.appendChild(showClip);
                
                let clip = document.getElementById(`reel${item.id}`);
                if (clip) {
                    setTimeout(() => { clip.pause(); }, 100);
                }
            });

        } else {
            console.error("Error fetching reels:", data.error);
            onalert(data.error || "Failed to load reels");
        }

    } catch (err) {
        console.error("Network or Server error:", err);
        loaders.forEach((i) => {i.style.display = 'none'});
        
     pl.innerHTML = '';
        
     if(place === 'showClip') {
     document.getElementById('showClip').innerHTML = reelUploadBtn;
   
    const el = document.getElementById('clipUpload');
            if (el) {
        el.style.backgroundImage = `url('${u.avatar}')`;
              }
            
     }
            
     let errMessage = document.createElement('div');
        errMessage.className = 'netErrClip';
        errMessage.id = `netErrClip${place}`;
        errMessage.innerHTML = `
       <p style="color: red; font-size: 30px; font-weight: bold; text-shadow: 0 0 3px white; text-align: center;">Network Error</p> 
       <button onclick="clipNovas('${email}', '${place}')" class="vibe-retry-btn">Retry</button>
        `;
        errMessage.style = 'display: flex; flex-direction: column; justify-content: center; align-items: center;';
        pl.appendChild(errMessage);
        if(el) el.style.display = 'flex';

    } finally {
        darkModeActivate(isDark);
    }
}


function tabSelect(btnEl) {
    const allTabs = document.querySelectorAll('.tab-items');
    allTabs.forEach(tab => tab.classList.remove('active'));

    btnEl.classList.add('active');
}
function tabSelectOth(btnEl) {
    const allTabs = document.querySelectorAll('.tab-btns');
    allTabs.forEach(tab => tab.classList.remove('active'));

    btnEl.classList.add('active');
}

let connectEmail;
async function loadConnections(email, place) {

    const display = document.getElementById(place);

     const token = localStorage.getItem('token');

    try {
    
        if(email === 'netErr') {
          throw new Error('Network error');
          return;
        } else {
          connectEmail = email;
        }

        const res = await fetch(`https://connection-server-9bzk.onrender.com/friends/${encodeURIComponent(email)}`);

        if (!res.ok) {
            onalert('Something went wrong');
            console.error(errorData?.message || 'Something went wrong');
            return;
        }

        const friend = await res.json();

        const friendsArray = friend.data || friend;

        if(friendsArray.length == 0) {
                display.innerHTML= `
                    <div class="friendShow">
                          <h3>No connected person</h3>  
                    </div>`
    return;
}


        const enrichedFriends = await Promise.all(
            friendsArray.map(async (f) => {
let oth = "";
oth = f.sender_id == email? f.receiver_id : f.sender_id

                const res = await fetch(
                    `https://users-server-xyvg.onrender.com/me?email=${encodeURIComponent(oth)}`, {
                method: 'GET',
                headers: {
             Authorization: `Bearer ${token}`
                }
                    });

                const data = await res.json();

                return {
                    ...f,
                    profile: data
                };

            })
        );



        display.innerHTML = "";

        enrichedFriends.forEach(f => {


            const prof = document.createElement('div');

            prof.innerHTML = `
<div class="friendShow" onclick="showOtherInfo('${f.profile.email}', 'id')">
   <img src="${f.profile.avatar}" alt="${f.profile.username}">
   <h3>${f.profile.username}</h3>
   <p>${f.profile.email}</p>
</div>            `;

            display.appendChild(prof);

        });

    } catch (err) {
    
        console.error(err);
        
        display.innerHTML= `
          <div class="friendShow" style='background: rgba(255,0,0,0.2); border: 1px solid red;'>
            <h3 style="color: red; font-size: 25px;">Network <br> Error</h3>  
            <button class="vibe-retry-btn" onclick="loadConnections('${connectEmail}', '${place}')">
                Retry
            </button>
          </div>`;
            
    }
}    


async function loadFollowers(userId, containerSelector) {

    const container = document.querySelector(containerSelector);
    if (!container) return;

    try {
        const res = await fetch(`https://page-server-jqce.onrender.com/get-followers/${userId}`);
        const data = await res.json();
        
        if (!res.ok || !data.success || !data.followers || data.followers.length === 0) {
            container.innerHTML = '<p style="color: #94a3b8; text-align: center;">No followers yet.</p>';
            return;
        }

        const emailArray = data.followers;

        const userPromises = emailArray.map(async (email) => {
            try {
                const userRes = await fetch(`https://users-server-xyvg.onrender.com/me?email=${encodeURIComponent(email)}`);
                const userData = await userRes.json();
                return userData; 

            } catch (err) {
                console.error(`Failed to fetch user data for ${email}:`, err);
                onalert('Something went wrong');
                return null;
            }
        });

        const users = await Promise.all(userPromises);
        
        const validUsers = users.filter(user => user !== null);
        
        container.innerHTML = '';

        if (validUsers.length === 0) {
            container.innerHTML = '<p style="color: #94a3b8; text-align: center;">No followers found.</p>';
            return;
        }

        validUsers.forEach(user => {
            const card = document.createElement('div');

            card.innerHTML = `
            <div class="friendShow" onclick="showOtherInfo('${user.email}', 'id')">
   <img src="${user.avatar}" alt="${user.username}">
   <h3>${user.username}</h3>
   <p>${user.email}</p>
</div>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading followers:', error);
        container.innerHTML = `<div class="friendShow" style='background: rgba(255,0,0,0.2); border: 1px solid red;'>
            <h3 style="color: red; font-size: 25px;">Network <br> Error</h3>  
            <button class="vibe-retry-btn" onclick="loadFollowers('${userId}', '${containerSelector}')">
                Retry
            </button>
          </div>`;
    } 
}


async function loadGroupMember(email) {

    let emailArray;

    try {
        emailArray = Array.isArray(email)
            ? email
            : JSON.parse(decodeURIComponent(email));
    } catch (err) {
        console.error('Invalid email data:', err);

        return {
            failed: true,
            message: 'Invalid email data'
        };
    }

    if (!Array.isArray(emailArray)) {
        return {
            failed: true,
            message: 'Email data must be an array'
        };
    }

    const userPromises = emailArray.map(async (memberEmail) => {
        try {
            const userRes = await fetch(
                `https://users-server-xyvg.onrender.com/me?email=${encodeURIComponent(memberEmail)}`
            );

            if (!userRes.ok) {
                throw new Error(`HTTP Error: ${userRes.status}`);
            }

            return await userRes.json();

        } catch (err) {
            console.error(
                `Failed to fetch user data for ${memberEmail}:`,
                err
            );

            return null;
        }
    });

    const users = await Promise.all(userPromises);

    const validUsers = users.filter(user => user !== null);

    console.log('users:', validUsers);

    if (validUsers.length > 0) {
        return validUsers;
    }

    return {
        failed: true,
        message: 'Network Error or no users found'
    };
}


async function adminActiveLoad(email, place) {

    const container = document.querySelector(place);
    
    const admins = await loadGroupMember(email);
    
    container.innerHTML = '';
    
    if(admins.failed) {
        container.innerHTML = `
           <div class="admin-card" style="font-size: 30px; color: red;">
              NETWORK ERROR 
           </div>
        `;
        return;
    }
    
    admins.forEach(a => {
    
        const adminCard = document.createElement('div');
        adminCard.onclick = () => showOtherInfo(a.email, 'id');
        adminCard.className = 'admin-card';
        adminCard.innerHTML = `
         <img src="${a.avatar}" alt="">
         <div>
             <h2>${a.username}</h2>
             <p>${a.email}</p>
         </div>`;
         
         container.appendChild(adminCard);
    });
    
}


async function loadActiveMembers(email, place) {

    const container = document.querySelector(place);
    
    const members = await loadGroupMember(email);
    
    container.innerHTML = '';
    if(members.failed) {
        container.innerHTML = `
           <div class="admin-card" style="font-size: 30px; color: red;">
              NETWORK ERROR 
           </div>
        `;
        return;
    }
    members.forEach(m => {
    
        const memberCard = document.createElement('div');
        memberCard.innerHTML = `
            <div class="friendShow" onclick="showOtherProf('${m.email}')">
               <img src="${m.avatar}" alt="${m.username}">
               <h3>${m.username}</h3>
               <p>${m.email}</p>
            </div>
`;
         
         container.appendChild(memberCard);
    });
    
    
}



function disProf(avatar) {
document.getElementById("displayPic").src = avatar;
 let p = document.querySelector(".profDis");
 p.style.opacity = "1";
 p.style.visibility = "visible";
 p.addEventListener("click", () => {closeDisProf()});
 BackManager.register(closeDisProf);
}
function closeDisProf() {
 let p = document.querySelector(".profDis");
 p.style.opacity = "0";
 p.style.visibility = "hidden";    
 BackManager.unregister(closeDisProf);
    
}

function setting() {
if(guest) return guestWarn();
location.href = '../setting.html';
  }

function notification() {
if(guest) return guestWarn();
    
location.href = '../notification.html';
  }

/* ========= DEFAULT BACK BUTTON MANAGER ========= */
const BackManager = (function () {
    let stack = [];

    window.addEventListener("popstate", () => {
        if (stack.length > 0) {
            const item = stack.pop();
            if (typeof item === "function") {
                item();
            }
        }
    });

    return {
        register(closeFn, ...args) {
            if (typeof closeFn === "function") {
                history.pushState({ ui: true }, "");

                if (args.length > 0) {
                    stack.push(() => closeFn(...args));
                } else {
                    stack.push(closeFn);
                }
            }
        },

        unregister(closeFn) {
            stack = stack.filter(fn => fn !== closeFn);
        },

        clear() {
            stack = [];
        }
    };
})();


/* ========= SEARCH PAD ========= */
function searchpad() {
    const pad = document.getElementById("searchpad");
    if (!pad) return;

    pad.style.display = "block";

    setTimeout(() => {
        pad.classList.add("show");
    }, 10);

    BackManager.register(closeSearchPad);
}

function closeSearchPad() {
    const pad = document.getElementById("searchpad");
    if (!pad) return;

    pad.classList.remove("show");

    setTimeout(() => {
        pad.style.display = "none";
    }, 450);
    BackManager.unregister(closeSearchPad);
}



function tag() {
    if(taggedEmailList.length == 0) {
document.getElementById('tagPeople').style.transform = 'translateY(0)'; 
    BackManager.register(closeTagPage);   

    } else {
 onconfirm('Attention!!', 'Do you want to remove your previously tagged peoples and select new ones?', 'Yes', reOpen, '', '#4f46e5')       
    } 
}

function reOpen() {
   taggedEmailList = [];
   tag();
}

function closeTagPage(check) {
document.getElementById('searchBar').value ="";
document.getElementById('comingUsers').innerHTML ="";
document.getElementById('tagPeople').style.transform = 'translateY(100%)'; 

    const taggedBtn = document.getElementById('taggedBtn'); 
    const taggedBtn2 = document.getElementById('taggedBtn2'); 
    const taggedBtn3 = document.getElementById('with-other'); 
    const taggedAllBtns = document.querySelectorAll('.editLowerBtns button section'); 

    if (taggedBtn) taggedBtn.style.display = 'block';
    if (taggedBtn2) taggedBtn2.style.display = 'block';       
    if (taggedBtn3) taggedBtn3.style.display = 'block';
    
    if (taggedAllBtns) {
        taggedAllBtns.forEach(e => { e.style.display = 'block'; });
    }
       

    if(check != 'a') {
    taggedEmailList = [];
   }
      clearTags();
    BackManager.unregister(closeTagPage);   
}

function clearTags() {
    if(taggedEmailList.length == 0) {
    
const taggedBtn = document.getElementById('taggedBtn'); 
const taggedBtn2 = document.getElementById('taggedBtn2'); 
const taggedBtn3 = document.getElementById('with-other'); 
const taggedAllBtns = document.querySelectorAll('.editLowerBtns button section');

    if (taggedBtn) taggedBtn.style.display = 'none';
    if (taggedBtn2) taggedBtn2.style.display = 'none';       
    if (taggedBtn3) taggedBtn3.style.display = 'none';
    
    if (taggedAllBtns) {
        taggedAllBtns.forEach(e => { e.style.display = 'none'});
    }

    }

}

function removeTag(email) {
    const user = returnUser();

    taggedEmailList = taggedEmailList.filter(
        user => user.email !== email
    );

    showTagged();
    clearTags();
}

function closeTagged(param) {
 
if(param == 'r') taggedEmailList = []
 document.getElementById('taggedShow').style.transform = 'translateX(100%)';   
}

async function comeUsers() {
    let searchElement = document.getElementById("searchBar").value.trim();
    let showingDisplay = document.getElementById("comingUsers");

    if (!searchElement) {
        alertShow("Please Write something here to search");
        return;
    }
    
    let token = 123;

    showingDisplay.innerHTML =`
    <div class="loadUsers"></div>
    <div class="loadUsers"></div>
    <div class="loadUsers"></div>
    <div class="loadUsers"></div>
    <div class="loadUsers"></div>
    <div class="loadUsers"></div>
    `;  
    
    try {
        const res = await fetch(
            `https://users-server-xyvg.onrender.com/search?q=${encodeURIComponent(searchElement)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        // HTTP status check
        if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status}`);
        showingDisplay.innerHTML = '';
        alertShow("Something went wrong");
        }

        const users = await res.json();

        // Array check
        if (!Array.isArray(users) || users.length === 0) {
            alertShow("No user found");
            showingDisplay.innerHTML = "";
            return;
        }

        showingDisplay.innerHTML = users.map(user => `
            <button onclick="tagAdd(this,'${user.email}','${user.username}', '${user.avatar}')" class="tagIds">
                <img src="${user.avatar}">
                <br>
                <div>${user.username}</div>
                <br>
                <p>${user.email}</p>
            </button>
        `).join("");

    } catch (err) {
        showingDisplay.innerHTML = '';
        console.error(err);
        alertShow("Something went wrong");
    }
}


let taggedEmailList = [];
function tagAdd(btn, email, name, avatar) {
    
        btn.classList.toggle("selected");
        
    const userIndex = taggedEmailList.findIndex(user => user.email === email);

    if (userIndex === -1) {
        taggedEmailList.push({
            email: email || "",
            name: name || "",
            avatar: avatar || ""
        });
    } else {
        taggedEmailList.splice(userIndex, 1);
    }
}

function showTagged(c) {
    const taggedShow = document.getElementById('taggedShow');
    const container = document.getElementById('personWise');

    if (taggedShow) {
        taggedShow.style.transform = 'translate(0)';
    }

    if (typeof BackManager !== 'undefined' && BackManager.register) {
        BackManager.register(closeTagged, c);
    }

    if (!container) return;

    if (taggedEmailList.length === 0) {
        container.innerHTML = `<p style="padding:15px; text-align:center; color:gray;">No tagged persons</p>`;
        return;
    }
    
    container.innerHTML = taggedEmailList.map(i => `
        <div class="tag-card">
    <div onclick="showOtherProf('${i.email}'); closeTagged('${c}')">
   <div style="display: flex; gap: 10px; flex-direction: row; align-items: center">
           <div>
               <img src="${i.avatar}" alt="">
           </div>
            <div>
                <h3>${i.name || 'User'}</h3>
                <p>${i.email || ''}</p>
            </div>
     </div>
   </div>
            <button
                onclick="removeTag('${i.email}')"
                style="display:${c === 'r' ? 'none' : 'block'}"
                class="tagCloseBtn">
                ✕
            </button>
            
        </div>
     
    `).join("");
    darkModeActivate(isDark); 
}



function appOthers(others) {
    let targetData = others;

    if (typeof targetData === "string") {
        try {
            const decodedData = decodeURIComponent(targetData);
            targetData = JSON.parse(decodedData);
        } catch (err) {
            try {
                targetData = JSON.parse(targetData);
            } catch (innerErr) {
                targetData = [];
            }
        }
    }

    if (targetData && typeof targetData === "object" && !Array.isArray(targetData)) {
        targetData = [targetData];
    }

    taggedEmailList = [];

    if (Array.isArray(targetData) && targetData.length > 0) {
        targetData.forEach((o) => {
            if (o && typeof o === "object") {
                taggedEmailList.push({
                    email: o.email || o.userEmail || "",
                    name: o.name || o.username || "Tagged User",
                    avatar: o.avatar || ""
                });
            }
        });
    }
    
    showTagged("r");
}




function alertShow(alert) {
   document.getElementById('faultMass').innerText = alert;
   setTimeout(() => {
   document.getElementById('faultMass').innerText = "";       
   },4000); 
}

function postBG(id) {
 const p = document.getElementById("pBG");
 p.style.opacity = '1';
 p.style.visibility = 'visible';
 const m = document.getElementById("bgPost");
 m.style.opacity = '1';
 m.style.bottom = '0px';
    BackManager.register(closePostBG);
    postOrEdit = id;

}

function closePostBG() {
 const p = document.getElementById("pBG");
 p.style.opacity = '0';
 p.style.visibility = 'hidden';
 const m = document.getElementById("bgPost");
 m.style.opacity = '0';
 m.style.bottom = '-300px';    
}

function removePostingImg() {
    document.getElementById('imgcont').style.display = 'none';
    
    const El = document.getElementById('Imgword');
     
    El.style.fontSize = '30px';  
    El.style.color = 'black';  
    El.style.textShadow = 'none';  
    El.style.textAlign = 'left';  
    El.style.background = 'none';  
    El.style.fontWeight = 'normal'; 
}

async function pad(v) {

    const search = document.getElementById('search').value.trim();

    if (!search && (v === 'y')) {
document.getElementById("showBox").style.display = 'flex';

        document.getElementById("searchresult").innerHTML = `
            <div
                style="color:red;font-size:20px;font-weight:bold;"
                id="searchalert">
            </div>
        `;

        document.getElementById("searchalert").innerHTML =
            "Please search anything before!";

        setTimeout(() => {
            document.getElementById("showBox").style.display = 'none';
        }, 2000);

        return;
    }

    document.getElementById('showBox').style.display = 'flex';

    const showDiv = document.getElementById("searchresult");

    try {

        const token = localStorage.getItem("token");
        const res = await fetch(
            `https://users-server-xyvg.onrender.com/search?q=${encodeURIComponent(search)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        const users = await res.json();
        if (users.length === 0) {

            showDiv.innerHTML = `
                <p style="color:red; font-size: 30px;">
                    No user found for <b>${search}</b>
                </p>
            `;

        } else {

            showDiv.innerHTML = users.map(user => `
                <button
                    onclick="closeSearchPad(); showOtherProf('${user.email}')" 
              style="background:none;width:70%;border:none;">
<table border="0" class="userShowing" cellspacing="18"><tr><td style="width: 60px; height: 60px; border-radius: 0px; background: rgba(255,255,255,0.4);">
<img src="${user.avatar}" width="90" height="90"></td><td>     
                    <div style="
                        margin:5px;
                        padding:10px;
                        color:red;
                        font-weight: bold;
                        width:100%;
                        text-align:left;
                        font-size: 20px;
                        width: 500px;
                    ">

                        ${user.username}
                   </div> <p style="font-size: 15px; color: green; text-align: left; margin-left: 20px">${user.email}</p>
                </button>
      </td></tr></table>
            `).join("");
        }
    } catch (err) {
       console.error(err);
        alertSome();
    }
}

function alertSome(){

document.getElementById("searchresult").innerHTML = `<div style="color: red; font-size: 20px; font-weight: bold;" id="searchalert"></div>`;
   document.getElementById("searchalert").innerText = "Please check your network connection!"; 
  setTimeout(() => {
        document.getElementById("showBox").style.display = 'none';              
        }, 2000) 
}

function createpost(id) {
    const u = returnUser();

    const nameEl1 = document.getElementById('idName');
    const nameEl2 = document.getElementById('accName');
    const signEl1 = document.getElementById('idSign');
    const signEl2 = document.getElementById('accSign');

    if (nameEl1) nameEl1.innerText = u.username;
    if (nameEl2) nameEl2.innerText = u.username;
    if (signEl1) signEl1.src = u.avatar;
    if (signEl2) signEl2.src = u.avatar;

    setTimeout(() => {
        document.getElementById(id).classList.add("show");
    }, 10);
    
    if(id === "postpage") {
        postOrEdit = 'postword';
    }else if (id === 'IMGpost'){
        postOrEdit = 'IMGword';        
    }
    BackManager.register(closePostpage);
}


function closePostpage(){
   const pad1 = document.getElementById("postpage");
   const pad2 = document.getElementById("IMGpost");
   const btn = document.getElementById('bgDefaultBtn');
            
    pad1.classList.remove("show");
    pad2.classList.remove("show");
    btn.click();
   
    document.getElementById('location').innerText="___";
    document.getElementById('feeling').innerText ="___";
    postLocation ="";
    feeling ="";
 }


/* =========================
   BACKGROUND + TEXT STYLE
========================= */
function textBG(c1, c2, bg) {
    const i = document.getElementById(postOrEdit);
   
    if (c1 && c2) {
        i.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;

        if (c1 === "none" && c2 === "none") {
            i.style.textAlign = "justify";
            i.style.textShadow = "0 0 5px white";
            i.style.background = 'none';
            
            if(isDark === 'false') {
                i.style.color = 'rgb(0,0,0)';                
            } else if(isDark === 'true') {
                i.style.color = 'rgb(255,255,255)';                                
            } else {
                console.warn('Mode is required');
            
        }
            
        } else {
            i.style.color = "white";
            i.style.textAlign = "center";
            i.style.textShadow = "0 0 5px gray";
        }
    } else if (bg) {
        i.style.background = "none";
        i.style.backgroundImage = `url(${bg})`;
        i.style.backgroundSize = "cover";
        i.style.backgroundPosition = "center";

        i.style.color = "white";
        i.style.textAlign = "center";
        i.style.textShadow = "0 0 10px black";
    }

}


/* =========================
   FONT SIZE PANEL
========================= */
function fontSize(el) {
    const f = document.getElementById("textFont");
    f.style.transform = "translate(0)";
  BackManager.register(closeFontSize);
  
  postOrEdit = el;    
}

function demoShow() {
    const pickFrom = document.getElementById("textSize");
    const applyTo = document.querySelector("#demo div");

    const size = String(pickFrom.value);
    if(size <= 70 && size >= 20) {
      applyTo.style.fontSize = `${size}px`;
      } else {
          onalert('Size must be between 20px and 70px');
      }
   }

function applySize(el) {

   const givenSize = document.getElementById('textSize');
   const appliedSize = document.getElementById(postOrEdit);
   
  if(givenSize.value <= 70 && givenSize.value >= 20){
    appliedSize.style.fontSize = givenSize.value + "px";
    changeSize(givenSize.value);
    closeFontSize();
    } else if (!givenSize.value) { 
    onalert('Please type a size first!');
    } else {
    onalert('Font size must be between 20px and 70px');
    }
  
 }

function closeFontSize() {
    const f = document.getElementById("textFont");
    f.style.transform = "translateY(700px)";
  BackManager.unregister(closeFontSize);
}

function changeSize(size) {
    const i = document.getElementById(postOrEdit);
    i.style.fontSize = size;
    let s = Number(size);
    if(s >= 35) {
    i.style.fontWeight = 'bold';        
    }else {
    i.style.fontWeight = 'normal';        
    }

}

/* =========================
   COLLECT POST DATA
========================= */
function collectPostData() {

    const plainText = document.getElementById("postword");
    const imagePost = document.getElementById("Imgword");

    let el ="";
    el = plainText;
    if (!plainText || !plainText.value.trim()) {
    el = imagePost;
    }
    
    const cs = window.getComputedStyle(el);
    
    let textColor = cs.color;
    let textBg = cs.background;
    let targetBg = 'rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box';
    

    if(isDark === 'true' && textBg === targetBg) {
        textColor = 'black';
    }

    return {
        text: el.value || el.innerText,

        feelings: feeling || "",

        location: postLocation || "",

        others: taggedEmailList || [],

        style: {
            color: textColor,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            textAlign: cs.textAlign,
            textShadow: cs.textShadow,
            background: cs.background,
            backgroundImage: cs.backgroundImage,
            backgroundSize: cs.backgroundSize,
            backgroundPosition: cs.backgroundPosition
        },

        image: postImageBase64 || ""
    };
}




/* === 1. POST SUBMIT (CLEAN & PRODUCTION READY) === */
async function postsubmit() {

    const user = prepearUserForSend('allowed');

    if (!user?.username || !user?.email) {
        onPostAlert("User not found!");
        return;
    }

    const postData = collectPostData();

    if (!postData.text?.trim() && !postData.image) {
        onPostAlert("Please insert something first!");
        return;
    }

    const loader = document.getElementById("postLoading");
    if (loader) loader.style.display = "flex";
    const btn = document.getElementById("postsubmit");
    if (btn) {
        btn.style.background = "gray";
        btn.disabled = true;
    }
    

    try {
    
        closePostpage();

        const payload = {
            user: {
                username: user.username,
                email: user.email
            },
            avatar: user.avatar || "",
            post: {
                text: postData.text || "",
                style: postData.style || {},
                image: postData.image || ""
            },
            from: user.from || 'id',
            feelings: postData.feelings || null,
            location: postData.location || null,
            others: Array.isArray(postData.others) ? postData.others : []
        };
        
        const res = await fetch("https://posts-server-kmha.onrender.com/post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            onPostAlert(data?.message || "Server error!");
            throw new Error(data?.message);
            return;
        }

        loadProfilePosts('', 'content')
        closePostpage();

        // UI Reset
        const postInput = document.getElementById("postword");
        const postPreview = document.getElementById("postPreview");
        
        if (postInput) postInput.value = "";
        postImageBase64 = "";
        if (postPreview) postPreview.style.display = "none";

    } catch (err) {
        console.error("Post Submission Error:", err);
        onPostAlert("Network error!");
    } finally {
        if (loader) loader.style.display = "none";
        if (btn) {
            btn.style.background = "blue";
            btn.disabled = false;
        }
    }
}



function onPostAlert(alert) {

const id = document.querySelector(".onPostAlert");

if(id) {
    id.innerText = alert;
    setTimeout(() => {
    document.querySelector(".onPostAlert").innerText =""
    }, 2000)
  }

}

function escapeHTML(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function applyPostStyle(el, style) {

  if (!style) return console.error('Style missing');
  
  Object.keys(style).forEach(k => {
    el.style[k] = style[k];
  });
}


let reactorsSetup;

async function reactors(postId) {

  try {
    const res = await fetch(
      `https://interacts-server-xpbo.onrender.com/likes/${postId}`
    );
    const data = await res.json();

    const container = document.getElementById('reactAppear');
    reactorsSetup = container.innerHTML;
    container.innerHTML = ""; // clear previous

    if (!data.likes || data.likes.length === 0) {
      container.innerHTML = `<p>No likes yet 😐</p>`;
      return;
    }

    // 🔹 Map likes to HTML
    const listHTML = data.likes
      .map(l => {
        return `
          <table class="likeAppear" onclick="showOtherProf('${l.email}'); closeLikeContainer('${postId}')">
            <tr>
              <td>
                <div><img src="${l.avatar}" style="width: 50px; height: 50px; border-radius: 90px; border: 2px solid white; box-shadow: 2px 0 0 green"></div>
              </td>
              <td>
                <h2>${l.username}</h2>
              </td>
              <td><p style="box-shadow:0 0 0px white; padding: 0; margin:0; background: none; width: 150px;">
                reacted with
              </p></td>
              <td style="font-size:20px"><section>
                ${l.reaction}</section>
              </td>
            </tr>
          </table>
        `;
          })
      .join("");

    container.innerHTML = listHTML;

  } catch (err) {
    console.error("Reactors fetch error:", err);
container.innerHTML = `  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
<p style="color: red; font-weight: bold; font-size: 30px; text-align: center; background: none; box-shadow: none;">Network error</p>
  <p style="color: gray; background: none; box-shadow: none; text-align: center; font-size: 20px;">Couldn't load comments due to internet connection. Please check your connection!</p>
  <button onclick="" style="border: none; border-radius: 10px; color: white; padding: 20px; font-size: 28px; background: orange;">Reload Page</button>
        </div>`;
  } finally {
    darkModeActivate(isDark);
    }
}

function showMoreInfo(id, value) {
  let el = document.getElementById(`othInfo${id}${value}`);
  let fl = document.querySelectorAll('.hideAndSick button');

  if (el) {
    el.classList.toggle('show');
  }

  fl.forEach(btn => {
    btn.classList.toggle('active');
  });
}

function onDisImg(img, caption) {
const el = qs('#onDisImg');
const image = qs('#onDisImg img');
const cap = qs('#onDisImg aside p');
el.classList.add('show');
image.src = img;
cap.innerText = caption;
  BackManager.register(closeOnDisImg);  
}

function closeOnDisImg() {
const el = qs('#onDisImg');
const elEl = document.querySelectorAll('#onDisImg *');
elEl.forEach(e => {e.innerHTML = ""});
el.classList.remove('show');
    
}


async function reactorsOnStory(postId) {

  try {
    const res = await fetch(
      `https://interacts-server-xpbo.onrender.com/likes/${postId}`
    );

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json();
    const container = document.getElementById(`appearReactors${postId}`);

    if (!container) return;

    if (!data.likes || data.likes.length === 0) {
      container.innerHTML = `<p>No likes yet 😐</p>`;
      return;
    }

        let typeOfReact = "";
    // 🔹 Map likes to HTML (সরাসরি map-এর ভেতরে reaction লজিক বসানো হয়েছে)
    const listHTML = data.likes
      .map(l => {
        if (l.reaction === '👍') {
          typeOfReact = '👍 — liked';
        } else if (l.reaction === '♥️') {
          typeOfReact = '❤️ — loved';
        } else {
          typeOfReact = '❓';
        }

        return `
<div style="
  display: flex;
  background: rgba(255, 255, 255, 0.4); 
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1); 
  border-radius: 16px; 
  padding: 12px 16px; 
  margin-bottom: 12px; 
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;
" onclick="showOtherProf('${l.email}')">
  <img src="${l.avatar}" style="
    width: 60px; 
    height: 60px; 
    border-radius: 50%; 
    object-fit: cover; 
    border: 2px solid #22c55e; 
    margin-right: 14px;
    flex-shrink: 0;
  ">


  <div style="
    font-size: 24px; 
    line-height: 1.4; 
    color: #e2e8f0; 
    display: flex; 
    align-items: center; 
    flex-wrap: wrap; 
    gap: 4px;
    display: flex;
  ">
    <strong style="color: black; font-weight: 600;" class="storyErr">${l.username}</strong>
    <span style="color: #94a3b8;">has</span>
    <span style="
      background: rgba(110, 231, 183, 0.12); 
      color: #6ee7b7; 
      padding: 2px 8px; 
      border-radius: 6px; 
      font-weight: 500; 
      font-size: 22px;
    ">
      ${typeOfReact}
    </span>
    <span style="color: #94a3b8;">your story.</span>
  </div>
</div>
        `;
      })
      .join("");

    container.innerHTML = listHTML;

  } catch (err) {
    console.error("Reactors fetch error:", err);
    
    const container = document.getElementById(`appearReactors${postId}`);
    if (container) {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
          <p style="color: red; font-weight: bold; font-size: 30px; text-align: center; background: none; box-shadow: none;">Network error</p>
          <p style="color: gray; background: none; box-shadow: none; text-align: center; font-size: 20px;">Couldn't load comments due to internet connection. Please check your connection!</p>
          <button onclick="home()" style="border: none; border-radius: 10px; color: white; padding: 20px; font-size: 28px; background: orange; cursor: pointer;">Reload Page</button>
        </div>`;
    }
  } finally {
    darkModeActivate(isDark);
  }
}



function comSec(appear) {
if(guest) return guestWarn();

const el = document.getElementById(`comPen${appear}`);
    el.classList.add("show");
  BackManager.register(closeComSec, appear);    
}

function closeComSec(close) {
const el = document.getElementById(`comPen${close}`);
    el.classList.remove("show");
}

let comSetup;
async function comText(postId) {
    const box = document.getElementById('commentAppear');
    comSetup = box.innerHTML;

  BackManager.register(containerClose, postId);    
    try {
        const res = await fetch(`https://interacts-server-xpbo.onrender.com/comments/${postId}`);

        const comments = await res.json();
        if (!comments || comments.length === 0) {
            box.innerHTML = "<p style='color: red;'>No comments yet</p>";
            return;
        }

        const currentUser = returnUser(); 
        const currentEmail = currentUser ? currentUser.email : null;

        box.innerHTML = "";

        comments.forEach(c => {
            const div = document.createElement("div");

    let comId = `${c.id}`;        


            const menuHTML = (currentEmail && currentEmail === c.email) ? `
                <div class="comMenu" style="display:none; position: absolute; right: 110px; top: 50px; border:1px solid gray; background:white; border-radius: 2px; padding: 0px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);width: 200px;">
            <button
 style="background: none; border: none; border-bottom: 1px solid black; width: 100%;"           
             onclick="editCom(${comId}, '${postId}', '${c.comment.replace(/'/g, "\\'").replace(/\n/g, "\\n")}')"><div style="margin:0px;font-size:18px;text-align:left; padding: 10px;">Edit comment</div></button>
          
                  <button style="background: none; border: none; width: 100%; margin-top: 0px;" onclick="deleteCom(${c.id}, '${postId}')"><div style="margin:0px;font-size:18px;text-align:left; padding: 10px; color:red">Delete comment</div></button>
                </div>
            ` : "";

            div.innerHTML = `
            <div style="position: relative; margin-bottom: 30px;">
              <table>
                <tr>
                  <td valign="top"><img src="${c.avatar}" style="width: 50px; height: 50px; border-radius: 90px; border: 2px solid white; box-shadow: 2px 0 0 green" onclick="showOtherProf('${c.email}'); closeComSec('${postId}')"></td>
                  <td>
                    <div style="
                        background: rgba(0,0,0,0.1);   
                        padding: 10px; 
                        border-radius: 10px;
                        width: 500px;
                        margin-left: 30px;
                        border-left: 5px solid gray;">
                      <table>
                        <tr>
                          <td><h3 style="color: green; margin: 0; width: 470px;" onclick="showOtherProf('${c.email}'); closeComSec('${postId}')" class="storyErr">${c.username}</h3></td>
                          <td>
                            ${menuHTML ? `<button class="dropdownBtn storyErr" style="width: 20px; background: none; border: none; height: 40px; color: green; font-size: 20px; margin-left: 0px">⋮</button>` : ""}
                          </td>
                        </tr>
                      </table>
                      <hr style="background: gray;">
                      
   <div id="commentText${c.id}" >                   
                      <p style="text-align: justify; font-size: 18px; margin:0; box-shadow: none; background: 0; padding: 0; width: 100%;">${c.comment.replace(/\n/g, "<br>")}</p>
                      ${menuHTML}
                    </div>
                  </td>
                </tr>
              </table>
            </div>
            `;

            box.appendChild(div);

            // Dropdown toggle only if menu exists
            if (menuHTML) {
                const dropdownBtn = div.querySelector(".dropdownBtn");
                const menu = div.querySelector(".comMenu");

                dropdownBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const isOpen = menu.style.display === "block";
                    document.querySelectorAll(".comMenu").forEach(m => m.style.display = "none"); // close all
                    menu.style.display = isOpen ? "none" : "block";
                });
            }
        });

        // Close dropdown if click outside
        document.addEventListener("click", () => {
            document.querySelectorAll(".comMenu").forEach(menu => menu.style.display = "none");
        });

    } catch (err) {
        console.error(err);
        box.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
<p style="color: red; font-weight: bold; font-size: 30px; text-align: center; background: none; box-shadow: none;">Network error</p>
  <p style="color: gray; background: none; box-shadow: none; text-align: center; font-size: 20px;">Couldn't load comments due to internet connection. Please check your connection!</p>
  <button onclick="" style="border: none; border-radius: 10px; color: white; padding: 20px; font-size: 28px; background: orange;">Reload Page</button>
        </div>`;
    } finally {
 darkModeActivate(isDark);
    }
}

async function storyComPort(postId) {
    const box = document.getElementById(`showStoryCom${postId}`);
    box.innerHTML = "Loading comments...";

    try {
        const res = await fetch(`https://interacts-server-xpbo.onrender.com/comments/${postId}`);
        const comments = await res.json();

        if (!comments || comments.length === 0) {
            box.innerHTML = "<p style='color: red;'>No comments yet</p>";
            return;
        }

        const currentUser = returnUser(); 

        const currentEmail = currentUser ? currentUser.email : null;

        box.innerHTML = "";

        comments.forEach(c => {
            const div = document.createElement("div");

    let comId = `${c.id}`;        


            const menuHTML = (currentEmail && currentEmail === c.email) ? `
                <div class="comMenu" style="display:none; position: absolute; right: 110px; top: 50px; border:1px solid gray; background:white; border-radius: 2px; padding: 0px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);width: 200px;">
            <button
 style="background: none; border: none; border-bottom: 1px solid black; width: 100%;"           
             onclick="editCom(${comId}, '${postId}', '${c.comment.replace(/'/g, "\\'").replace(/\n/g, "\\n")}')"><div style="margin:0px;font-size:18px;text-align:left; padding: 10px;">Edit comment</div></button>
          
                  <button style="background: none; border: none; width: 100%; margin-top: 0px;" onclick="deleteCom(${c.id}, ${postId})"><div style="margin:0px;font-size:18px;text-align:left; padding: 10px; color:red">Delete comment</div></button>
                </div>
            ` : "";

            div.innerHTML = `
            <div style="position: relative; margin-bottom: 30px;">
              <table>
                <tr>
                  <td valign="top"><img src="${c.avatar}" style="width: 50px; height: 50px; border-radius: 90px; border: 2px solid white; box-shadow: 2px 0 0 green" onclick="showOtherProf('${c.email}')"></td>
                  <td>
                    <div style="
                        background: rgba(0,0,0,0.1);   
                        padding: 10px; 
                        border-radius: 10px;
                        width: 500px;
                        margin-left: 30px;
                        border-left: 5px solid gray;">
                      <table>
                        <tr>
                          <td><h3 style="color: green; margin: 0; width: 470px;" onclick="showOtherProf('${c.email}')">${c.username}</h3></td>
                          <td>
                            ${menuHTML ? `<button class="dropdownBtn" style="width: 20px; background: none; border: none; height: 40px; color: green; font-size: 20px; margin-left: 0px">⋮</button>` : ""}
                          </td>
                        </tr>
                      </table>
                      <hr style="background: green;">
                      
   <div id="commentText${c.id}">                   
                      <p style="text-align: justify; font-size: 18px; margin:0; box-shadow: none; background: 0; padding: 0; width: 100%;">${c.comment.replace(/\n/g, "<br>")}</p>
                      ${menuHTML}
                    </div>
                  </td>
                </tr>
              </table>
            </div>
            `;

            box.appendChild(div);

            // Dropdown toggle only if menu exists
            if (menuHTML) {
                const dropdownBtn = div.querySelector(".dropdownBtn");
                const menu = div.querySelector(".comMenu");

                dropdownBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const isOpen = menu.style.display === "block";
                    document.querySelectorAll(".comMenu").forEach(m => m.style.display = "none"); // close all
                    menu.style.display = isOpen ? "none" : "block";
                });
            }
        });

        // Close dropdown if click outside
        document.addEventListener("click", () => {
            document.querySelectorAll(".comMenu").forEach(menu => menu.style.display = "none");
        });

    } catch (err) {
        console.error(err);
        box.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
<p style="color: red; font-weight: bold; font-size: 30px; text-align: center; background: none; box-shadow: none;">Network error</p>
  <p style="color: gray; background: none; box-shadow: none; text-align: center; font-size: 20px;">Couldn't load comments due to internet connection. Please check your connection!</p>
  <button onclick="" style="border: none; border-radius: 10px; color: white; padding: 20px; font-size: 28px; background: orange;">Reload Page</button>
        </div>`;
    }
}


async function updateCounts(postId) {
      const likeEl = document.getElementById(`likeCount${postId}`);
    const commentEl = document.getElementById(`commentCount${postId}`);

    try {
        const res = await fetch(`https://interacts-server-xpbo.onrender.com/api/counts/${postId}`);
        if (!res.ok) throw new Error("Failed to fetch counts");

        const data = await res.json();
        if (likeEl) likeEl.textContent = `${data.likes} reactions`;
        if (commentEl) commentEl.textContent = `${data.comments} comments`;

    } catch (err) {
        console.error(`Error updating counts for post ${postId}:`, err);
        if (likeEl) likeEl.textContent = "– reactions";
        if (commentEl) commentEl.textContent = "– comments";
    } 
}

async function reactCounts(postId) {
    const likeEl = document.getElementById(`reactCount${postId}`);
     const commentEl = document.getElementById(`stryComCount${postId}`);

    try {
        const res = await fetch(`https://interacts-server-xpbo.onrender.com/api/counts/${postId}`);
        if (!res.ok) throw new Error("Failed to fetch counts");

        const data = await res.json(); 
       if (likeEl) likeEl.innerText = `${data.likes} reactions`;
        if (commentEl) commentEl.textContent = `${data.comments}`;

    } catch (err) {
        console.error(`Error updating counts for post ${postId}:`, err);
        if (likeEl) likeEl.innerText = "-- reactions";
       if (commentEl) commentEl.textContent = "_ _ _";

   }
}

async function sendCom(postId) {
    const overlay = document.getElementById(`comPen${postId}`);
    const textarea = overlay.querySelector(".comWord");
    const btn = overlay.querySelector(".comButton");
    const comment = textarea.value.trim();

    if (!comment) {
        onalert("Please write a comment first!");
        return;
    }

    const user = returnUser();
    if (!user || !user.username || !user.email) {
        onalert("User not found!");
        return;
    }

    btn.disabled = true;   document.getElementById("loaderCom").classList.add("show");

    try {
         const res = await fetch("https://interacts-server-xpbo.onrender.com/comment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                postId: postId,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                comment
            })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            console.error("Server Error:", res.status, data);
            document.getElementById("loaderCom").classList.remove("show");

            onalert(data.message || "Failed to send comment!");
            return;
        }

        textarea.value = "";
        closeComSec(postId);
        updateCounts(postId);
        onalert("Comment posted ✅");

    } catch (err) {
        console.error("Network / JS Error:", err);
        onalert("Network error!");
    } finally {
        document.getElementById("loaderCom").classList.remove("show");
        btn.disabled = false;
    }
}

async function sendStoryCom(postId) {
    const overlay = document.getElementById(`commentBox${postId}`);
    const textarea = overlay.querySelector("#storycom");
    const btn = overlay.querySelector(`#sendStoryCom${postId}`);
    const comment = textarea.value.trim();

    if (!comment) {
        onalert("Please write a comment first!");
        return;
    }

    const user = returnUser();
    if (!user || !user.username || !user.email) {
        onalert("User not found!");
        return;
    }

    btn.disabled = true;

    try {
        const res = await fetch("https://interacts-server-xpbo.onrender.com/comment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                postId: Number(postId),
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                comment
            })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            console.error("Server Error:", res.status, data);
            onalert(data.message || "Failed to send comment!");
            return;
        }


        textarea.value = "";
        reactCounts(postId);
        onalert("Comment posted ✅");

    } catch (err) {
        console.error("Network / JS Error:", err);
        onalert("Network error!");
    } finally {
        btn.disabled = false;
        storyComPort(postId);
    }
}

async function reactAppear(postId, emoji) {
if(guest) return guestWarn();

document.querySelectorAll(".appearFlex").forEach(p => {
        p.classList.remove("show");
                });

  try {
    const user = returnUser();
    

    if (!user || !user.email || !user.username) {
      onalert("You must be logged in to react!");
      return;
    }

    const res = await fetch(
      "https://interacts-server-xpbo.onrender.com/react",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          postId: postId,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          reaction: emoji
        })
      }
    );

    const data = await res.json();

    if (res.ok) {
     
const el = document.getElementById(`react${postId}`);
if(el) el.innerHTML = emoji;

      updateCounts(postId);
      return;
    } else {
      onalert(data.message || "You have already reacted!");
    }

  } catch (err) {
    console.error("Error sending reaction:", err);
    onalert("It seems network error!");
  }
}




function loadProfile() {
    if(user) {
        const u = returnUser();
document.getElementById("userName").innerHTML = u.username;
document.getElementById("profileBio").innerHTML = u.bio;

    }

}

function backtoprofile() {
    profile();
    document.querySelector('#backbtn').innerHTML = "";
}


async function loadProfilePosts(email, place) {
    if (!place) {
        console.error("place argument is required!");
        return;
    }
        const contentDiv = document.getElementById(place);
        const user = returnUser();
        
        contentDiv.innerHTML = `
        <div class="postLoad"></div>
        <div class="postLoad"></div>
        <div class="postLoad"></div>
        `;
         darkModeActivate(isDark);

    try {
    
        let res;
        
     if(!email) {
         res = await fetch("https://posts-server-kmha.onrender.com/post");
         
      } else if (email) {
      
        res = await fetch(`https://posts-server-kmha.onrender.com/postOfAnUser/${email}`);
    
    }
        const data = await res.json();

        if (!res.ok) {
            onalert(data.message || "Error to fetch posts!");
            throw new Error('res is not ok');
            return;
        }

        if (data.length === 0) {
            contentDiv.innerHTML = `<p style="text-align:center;font-size:20px;padding:20px;">No posts yet</p>`;
            return;
        }
        
        const info = JSON.parse(localStorage.getItem('info'));
        const lang = info.language || info.language_custom;
        
        contentDiv.innerHTML = '';
        data.forEach(post => {
        
            const safeText = escapeHTML(post.post?.text || "");
            const htmlText = safeText.replace(/\n/g, "<br>");

            const copyText = encodeURIComponent(post.post?.text || "");
            const emailSafe = encodeURIComponent(post.email || "");
            const safeOthers = encodeURIComponent(JSON.stringify(post.others || []));
            const safePost = encodeURIComponent(JSON.stringify(post || {}));

            const div = document.createElement("div");
            div.className = 'postshow';
            div.id = `showPost${post.id}`;

            const formattedTime = getShortTime(post.created_at);


            div.innerHTML = `

 <div style="visibility: hidden" id="postDiv${post.id}${place}"></div>

    <div style="display: flex; width: 100%;">
<img src="${post.avatar}" style="width: 60px; height: 60px; border-radius: 90px; border: 4px solid white; margin:10px;" onclick="showOtherInfo('${post.email}', '${post.from}')">


<h2 onclick="showOtherInfo('${post.email}', '${post.from}')">
<button class="profileBtn"
 data-email="${emailSafe}"
 style="background:none;border:none;font-size:25px;font-weight:bold;color:green;">
<div style="font-size:30px;text-align:left;">${post.username}<span style="color:gray; font-size:30px"> • ${formattedTime}</span></div>
</button>
</h2>

<div style="position: relative; flex-grow: 1;  display: flex; justify-content: flex-end;">
    
<div style="display: flex; justify-content: flex-end; gap: 10px">
    
<div class="hideAndSick" style="display:${(post.feelings || post.location || (post.others?.length > 0)) ? 'block' : 'none'}">
  <button onclick="showMoreInfo('${post.id}', '${place}')">
   <img src="https://i.ibb.co.com/Z6JbsJqd/down-arrow.png" width="50" class="imgChange">
  </button>
</div>
 
<button id="options${post.id}" style="background: none; border: none; margin-top: 15px;">   
    <img src="https://i.ibb.co.com/TM577zLY/menu-burger.png" width="40" class="imgChange">
</button>

<button onclick="removePost('postDiv${post.id}${place}')" style="background: none; border: none; margin-top: 15px;">   
    <img src="https://i.ibb.co.com/Gvf0ydqH/close.png" width="40" class="imgChange">
</button>

</div>

<div id="menu${post.id}" style="display:none; position:absolute; right:0; top:45px; background:white; border:1px solid gray; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.2); width:300px; margin-right: 30px; z-index:1000; overflow:hidden; transform-origin: top right; animation: dropdownShow 0.4s ease;" class="postedMenuDarl"> 
   
   ${place === 'ownerPosts' ? `
   <button style="position:relative;width:100%;padding:10px;border:none;background:none;text-align:left;font-size:25px;" 
onclick="editPost('${safePost}'); closealert('menu${post.id}')">Edit</button>
   <hr>
   ` : ''}

   <button style="position:relative;width:100%;padding:10px;border:none;background:none;text-align:left;font-size:25px;" onclick="navigator.clipboard.writeText(decodeURIComponent('${copyText}')); closealert('menu${post.id}')">Copy</button>

   ${place === 'ownerPosts' ? `
   <hr>
   <button style="position:relative;width:100%;padding:10px;border:none;background:none;text-align:left;color:red;font-size:25px;" onclick="deletePost('${post.id}'); closealert('menu${post.id}')">Delete</button>
   ` : ''}

</div>
</div>

</div>

<button id="connectBtn${post.id}${place}" style="background: none; border: 1px solid blue; font-size: 25px; font-weight: bold; margin: 10px; margin-left: 10%; color: blue; padding: 10px; border-radius: 12px; min-width: 120px; height: 60px; display: flex; align-items: center; justify-content: center;"></button>


<div class="othInfo" id="othInfo${post.id}${place}">
<p class="postInfo" id="feelShow" style="display:${post.feelings ? 'block' : 'none'};"><img src="https://i.ibb.co.com/My4XHcsy/happy.png"> ${post.feelings}</p>

<p class="postInfo" id="locShow" style="display:${post.location ? 'block' : 'none'};"><img src="https://i.ibb.co.com/kgCWpqgc/map.png"> ${post.location}</p>

<p class="postInfo"
   style="display:${Array.isArray(post.others) && post.others.length ? 'block' : 'none'}; color:purple"
   onclick="appOthers('${safeOthers}')">
   <img src="https://i.ibb.co.com/39jD6F2q/customer.png">
   <u style="color:purple">With other ones</u>
</p>
</div>


<hr style="background: gray; height: 1.3px; margin: 20px;">

<p class="postText" id="textPost${post.id}" name="textPost${post.id}${place}" style="font-size:30px; padding:20px; border-radius:5px;"></p>

${post.post?.image ? `
<div id="box${post.id}" style="display: flex; justify-content: center; align-items: center; background: none;">
    <img src="${post.post.image}" style="max-width: 100%; border: 1px solid black; border-radius: 6px; cursor:pointer;" onclick="onDisImg('${post.post.image}', '${post.post.text || ''}')">
</div>` : ''}

 <div class="post-prods">
     <button onclick="tr('${safePost}', '${lang}', '${place}')" id="trBtn${post.id}${place}">
         🌐 Translate to ${lang}
     </button>
     <button onclick="summery('${safePost}')">
         ✨ Ask AI
     </button>
 </div>
    
<div id="countReactions">
<div id="countByOrder${post.id}" style="text-align:right">
<button id="likeCount${post.id}" onclick="likeContainer('${post.id}'); reactors('${post.id}')"></button><br>
<button id="commentCount${post.id}" onclick="appContainer('${post.id}'); comText('${post.id}')"></button>
</div>
</div>

<div id="reactPanal">
<button style="border-left:none;font-size:30px;" id="react${post.id}">
<img src="https://i.ibb.co.com/NgV9p5jg/like.png" width="40" class="imgChange">
</button>

<button onclick="comSec('${post.id}');" id="comSec${post.id}">
<img src="https://i.ibb.co.com/hRNSdTgD/comment.png" width="40" class="imgChange">
</button>
<button>
<img src="https://i.ibb.co.com/C5fxp0rs/share-1.png" width="30" class="imgChange">
</button><br>
</div>

<div id="appearFlex${post.id}" class="appearFlex">
<button onclick="reactAppear('${post.id}','👍')">👍</button>
<button onclick="reactAppear('${post.id}','♥️')">♥️</button>

<div id="reactsMore${post.id}${place}" class="moreReacts"></div>

<button onclick="reactPlus()" style="font-size: 30px; color: red;">+</button>

</div>

<div id="comPen${post.id}" class="secDivCon">
<div class="comSecDiv">
  <div class="comHeader">
    <h2>Write a comment about this post</h2>
    <button onclick="closeComSec('${post.id}')" style="background: none; border: none; padding: 0px; font-size: 30px;">×</button>
  </div>
  <hr>
  <div class="comBody">
    <textarea class="comWord" rows="8" placeholder="Enter text.."></textarea>
    <button onclick="sendCom('${post.id}')" class="comButton">
      <img src="https://i.ibb.co.com/JZTLHkQ/send.png">
    </button>
  </div>

<div id="loaderCom" class="inlineLoader">
    <div class="loadingBox">
        <div class="spinner"></div>
        <div class="textContainer">
            <h2>Loading...</h2>
            <p>Please wait...</p>
        </div>
    </div>
    <div class="loading-line"></div>
</div>

</div>
</div>

        </div>
        
`;


div.querySelector(".postText").innerHTML = htmlText;
            
            contentDiv.appendChild(div);

            const reacts = JSON.parse(localStorage.getItem('reacts')) || [];
            const reactDiv = document.getElementById(`reactsMore${post.id}${place}`);

            reacts.forEach((r) => {
                const reactBtn = document.createElement('button');
                reactBtn.innerText = r;
                reactBtn.onclick = () => reactAppear(post.id, r)

                reactDiv.appendChild(reactBtn);                    
            });
            
            const reqBtn = document.getElementById(`connectBtn${post.id}${place}`);
            
           
            
            const profBtn = document.getElementById(`btn${post.id}${place}`);
            positionCheck(post.email, post.from, reqBtn);
            updateCounts(post.id);
            darkModeActivate(isDark);
            applyPostStyle(div.querySelector(".postText"), post.post?.style);

            // React button panel toggle
            const reactBtn = div.querySelector(`#react${post.id}`);
            const reactPanel = div.querySelector(`#appearFlex${post.id}`);

            reactBtn?.addEventListener("click", (e) => {
                e.stopPropagation();

                document.querySelectorAll(".appearFlex").forEach(p => {
        p.classList.remove("show");

 
               });

                if (!reactPanel.classList.contains("show")) {
                    reactPanel.classList.add("show");
                }
            });

            reactPanel?.addEventListener("click", (e) => {
                e.stopPropagation();
            });

            // Options menu toggle
            const optionsBtn = div.querySelector(`#options${post.id}`);
            const menuDiv = div.querySelector(`#menu${post.id}`);

            optionsBtn?.addEventListener("click", (e) => {
                e.stopPropagation();

                document.querySelectorAll('[id^="menu"]').forEach(m => {
                    if (m.id !== `menu${post.id}`) {
                        m.style.display = "none";
                    }
                });

                menuDiv.style.display = (menuDiv.style.display === "block") ? "none" : "block";
            });

            menuDiv?.addEventListener("click", (e) => {
                e.stopPropagation();
            });
        });
        
        setTimeout(() => {
            darkM();
         setTimeout(() => {
              darkM();
            }, 500);
          }, 500);

    } catch (err) {
        console.error(err);

    contentDiv.innerHTML = '';
    contentDiv.innerHTML = `
    
    <div style="display: flex; justify-content: center; align-items: center; width: auto; min-height: 250px; padding: 20px;">
        <div style="text-align: center; background: rgba(255, 255, 255, 0.05); padding: 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid rgba(200,200,200,0.2);">
            <div style="font-size: 45px; margin-bottom: 10px;">⚠️</div>
            <h2 style="color: #ff4d4d; font-size: 30px; margin-bottom: 8px;">Network Error</h2>
            <p style="color: gray; font-size: 20px; margin-bottom: 20px;">Failed to load posts. Please check your connection.</p>
            <button onclick="loadProfilePosts('${email || ''}', '${place}')" style="background: linear-gradient(135deg, #ff8008, #ffc837); color: white; padding: 10px 25px; border-radius: 25px; border: none; font-size: 22px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(255,128,8,0.3);">
                 Retry
            </button>
        </div>
    </div>`;
       }
}

document.addEventListener("click", () => {
    document.querySelectorAll(".appearFlex").forEach(p => p.classList.remove("show"));
    document.querySelectorAll('[id^="menu"]').forEach(m => m.style.display = "none");
});


function loadEditIMG(e, id) {
    postImgFiles = '';

    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        onalert("Sorry, video isn’t supported ");
        return;
    }

    postImgFiles = file;
    
    const img = document.querySelector(`#box${id} img`);

    const reader = new FileReader();

    reader.onload = function(evt) {
        const tempImg = new Image();

        tempImg.onload = function() {
            const canvas = document.createElement("canvas");
            canvas.width = tempImg.width;
            canvas.height = tempImg.height;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);

            const base64 = canvas.toDataURL("image/jpeg", 0.5);

            postImageBase64 = base64; 

            img.src = base64;
        };

        tempImg.src = evt.target.result;
    };

    reader.readAsDataURL(file);
}

let safeStorage = {
    postText: '',
    html: '',
    picture: '',
    style: {}
}


// 🔹 Edit Post
function editPost(postObj) {
    const post = JSON.parse(decodeURIComponent(postObj));

    const oldDiv = document.getElementById(`textPost${post.id}`);

    safeStorage.postText = oldDiv.innerText;    

    const inputElement = document.createElement('textarea');

    const computedStyle = window.getComputedStyle(oldDiv);
    
    for (let i = 0; i < computedStyle.length; i++) {
    const property = computedStyle[i];
    const value = computedStyle.getPropertyValue(property);
    inputElement.style.setProperty(property, value);
    safeStorage.style[property] = value;
    }
    
if (computedStyle.fontSize) {
    let currentSize = parseInt(computedStyle.fontSize);
    let newSize = currentSize - 10;
    let inputSize = currentSize - 10;
    
    inputElement.style.setProperty('font-size', inputSize + 'px', 'important');
    safeStorage.style['font-size'] = newSize + 'px';
}
    
    safeStorage.picture = document.querySelector(`#box${post.id} img`)?.src;

    inputElement.style.display = 'block';
    inputElement.style.width = '96%';
    inputElement.id = `edit${post.id}`;
    inputElement.value = oldDiv.innerText;
    oldDiv.replaceWith(inputElement);
    
    const changeEl = document.getElementById(`remove${post.id}`);
    
    safeStorage.html = changeEl.innerHTML;

    changeEl.innerHTML = `
    <div class="editLowerBtns" id="btnsDiv${post.id}">
    <button onclick="postBG('edit${post.id}')">Change Background</button>    
    <button onclick="fontSize('edit${post.id}')">Adjust Font Size</button>    
    <input type="text" placeholder="Add / Edit location" id="loc${post.id}">    
    <input type="text" placeholder="Add / Edit feeling" id="feel${post.id}"> 
        <button>   
    <div onclick="tag()">Tag people</div>    
    <section onclick="showTagged('')">With other ones</section>    
        </button>
        <label>
    <button onclick="document.getElementById('imageEdit${post.id}').click()">Change image
       <input type="file" accept="image/*" id="imageEdit${post.id}" onchange="loadEditIMG(event, '${post.id}')" style="display: none">  
        </button> 
       </label>
        </div>
        
    <div class="editBottomBtns">
        
      <button onclick="cancelChange('${post.id}')" style="background: red;">Cancel</button>
      <button onclick="savePost('${post.id}')" style="background: green;" id="editBtn${post.id}">Save</button>
    
    </div>     
    `; 
    
    const closings = document.querySelectorAll('.editLowerBtns button');

    if (post.post.image) {

        closings[0].style.setProperty('display', 'none', 'important');
        closings[1].style.setProperty('display', 'none', 'important');
    
        inputElement.style.height = '200px';
    
    } else {
    
        closings[3].style.display = 'none';
        inputElement.style.height = '400px';
    
    }  
     
 }
 
 
function cancelChange(postId) {
    const editInput = document.getElementById(`edit${postId}`);
    
    const originalDiv = document.createElement('div');
    originalDiv.id = `textPost${postId}`;
    originalDiv.innerText = safeStorage.postText;
    
    for (let property in safeStorage.style) {
        originalDiv.style.setProperty(property, safeStorage.style[property]);
    }
    
    editInput.replaceWith(originalDiv);
    
    const changeEl = document.getElementById(`remove${postId}`);
    changeEl.innerHTML = safeStorage.html;
    
    const imgElement = document.querySelector(`#box${postId} img`);
    if (imgElement && safeStorage.picture) {
        imgElement.src = safeStorage.picture;
    }
}


function collectEditData(id) {
    const el = document.getElementById(`edit${id}`);
    const image = document.querySelector(`#box${id} img`);
    const feel = document.getElementById(`feel${id}`);
    const location = document.getElementById(`loc${id}`);
    
    const cs = window.getComputedStyle(el);
    let textColor = cs.color;
    if (textColor === 'white' || textColor === 'rgb(255, 255, 255)') {
        textColor = 'black';
    }
    
    
    return {
        post: el.value || el.innerText,

        feelings: feel.value || "",

        location: location.value || "",

        others: taggedEmailList || [],

        style: {
            color: textColor,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            textAlign: cs.textAlign,
            textShadow: cs.textShadow,
            background: cs.background,
            backgroundImage: cs.backgroundImage,
            backgroundSize: cs.backgroundSize,
            backgroundPosition: cs.backgroundPosition
        },

        image: postImageBase64 || safeStorage.picture || ""
    };
}

 
 
// 🔹 Save Post (PUT)
async function savePost(id) {
    const editBtn = document.getElementById(`editBtn${id}`);
    const user = returnUser();
    
    editBtn.innerHTML = `
        <div style="border: 3px solid gray; border-top: 3px solid white; height: 80%; aspect-ratio: 1 / 1; border-radius: 50%;  animation: spin 1.5s linear infinite;"></div>`;

    const postData = collectEditData(id);

    try {

    const payload = {
            post: {
                text: postData.post || "",
                style: postData.style || {},
                image: postData.image || ""
            },
            feelings: postData.feelings || null,
            location: postData.location || null,
            others: Array.isArray(postData.others) ? postData.others : []
            };
        
        
        const res = await fetch(`https://posts-server-kmha.onrender.com/post/${user.email}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        editBtn.innerHTML = 'Done';
        onalert(data.message);
        loadProfilePosts(user.email, 'ownerPosts');

    } catch(err) {
        editBtn.innerHTML = 'Save';
        console.error("Error saving post:", err);
        onalert("Failed to save post.");
    }
}

// 🔹 Delete Post
function deletePost(id) {
     onconfirm("","Are you sure to delete this post?", "Delete", DeletePost, id, "red");
    }
    
async function DeletePost(id){
    const user = returnUser();
    const deleteDiv = document.getElementById(`showPost${id}`);
    
    let preserve = deleteDiv.innerHTML;
    
    deleteDiv.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; padding: 30px; font-size: 30px; color: red; background: none; width: 100%;">Post Deleting...<br>
        <div style="border: 3px solid lightgray; border-top: 3px solid red; height: 40px; aspect-ratio: 1 / 1; border-radius: 50%;  animation: spin 1.5s linear infinite;"></div></div>`;

    try {
        const res = await fetch(`https://posts-server-kmha.onrender.com/post/${user.email}/${id}`, { method: "DELETE" });
        if (!res.ok) {
        onalert("Failed to delete post.");
        deleteDiv.innerHTML = preserve;
        console.error("Error deleting post: res has not been sent");
          }        
        const data = await res.json();
        onalert(data.message);
        loadProfilePosts(user.email, 'ownerPosts');

    } catch (err) {
        onalert("Failed to delete post.");
        deleteDiv.innerHTML = preserve;
        console.error("Error deleting post:", err);
    }
}


// 🔹 Edit comment
function editCom(comId, postId, encodedText) {
    let commentDiv = document.getElementById(`commentText${comId}`);

    if (!commentDiv) return;

    const currentText = decodeURIComponent(encodedText);

    commentDiv.innerHTML = `
        <textarea id="editArea${comId}" style="width:80%; height:80px; margin: 20px; border: 2px solid green; border-radius: 20px; box-shadow: 0 0 5px lightgreen; color: green; padding: 10px;    font-family: 'SolaimanLipi', 'Noto Sans Bengali', Arial, sans-serif;
">${currentText}</textarea>
        <br>
        <div style="text-align:right;">
        <button id="saveBtn${comId}" style="border: none; border-radius: 5px; background: rgb(0,200,0); color: rgb(255,255,255); padding: 4px;width: 100px;">Save</button>
        <button id="cancelBtn${comId}" style="border: none; border-radius: 5px; background: rgb(200,0,0); color: rgb(255,255,255); padding: 4px;width: 100px;">Cancel</button>
</div>
    `;

    document.getElementById(`saveBtn${comId}`).onclick = async () => {

    const user = returnUser();
        const newComment = document.getElementById(`editArea${comId}`).value.trim();
        if (!newComment) return onalert("Comment cannot be empty!");

        try {
            const res = await fetch(`https://interacts-server-xpbo.onrender.com/comment/${user.email}/${comId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newComment })
            });
            const data = await res.json();
            if (!res.ok) return onalert(data.message || "Failed to update comment");

            onalert("Comment updated ✅");
            comText(postId); // Refresh comments
        } catch (err) {
            console.error(err);
            onalert("Network error: could not update comment.");
        }
    };

    document.getElementById(`cancelBtn${comId}`).onclick = () => {
        commentDiv.innerHTML = currentText;
    };
}


// 🔹 Delete comment
async function deleteCom(commentId, postId) {
    const user = returnUser();
    if (!user || !user.email) {
        onalert("User not found!");
        return;
    }


    try {
        const res = await fetch(
            `https://interacts-server-xpbo.onrender.com/comment/${user.email}/${commentId}`,
            { method: "DELETE" }
        );

        const data = await res.json();


        if (!res.ok) {
            onalert(data.message || "Failed to delete comment.");
            return;
        }

        onalert("Comment deleted ✅");

        // Update the comments section for this post
    if (postId) {
    try {
        comText(postId);
    } catch (err) {
        storyComPort(postId);
    }
    }
  } catch (err) {
        console.error("Error deleting comment:", err);
        onalert("Network error: could not delete comment.");
    }
}


let closePlace = document.querySelector('#body');

function closeImoji(id) {
    document.getElementById(`appearFlex${id}`).style.display ='none';
}

function containerClose(container){
const el = document.getElementById('comments');
    el.classList.remove("show");

const port = document.getElementById('commentAppear');
    port.innerHTML = comSetup; 
    
    updateCounts(container);
}

function appContainer(container) {
const el = document.getElementById('comments');
    el.classList.add("show");

}

function likeContainer(container) {
const el = document.getElementById('reactors');
    el.classList.add("show");
BackManager.register(closeLikeContainer, container);
}

function closeLikeContainer(container){
const el = document.getElementById('reactors');
    el.classList.remove("show");

const port = document.getElementById('reactAppear');
    port.innerHTML = reactorsSetup; // clear previous

    updateCounts(container);
}



function appLink(postId) {
onalert('under constraction!');
}

function copyPost(postWord) {

  const cleanText = postWord
    .replace(/<br\s*\/?>/gi, "\n");

  navigator.clipboard.writeText(cleanText)
    .then(() => onalert("Post copied ✅"))
    .catch(() => onalert("Copy failed ❌"));
}


function onalert(alertWord) {
document.getElementById("warnOverlay").classList.add("warnShow");
 document.querySelector("#wordSet").innerText = alertWord; 
 setTimeout((c) => {
document.getElementById("warnOverlay").classList.remove("warnShow");
 }, 3000)

}

function onconfirm(text, word, btn, func, innB, color) {
  const overlay = document.getElementById("alertOverlay");
  const alertBox = document.getElementById("customAlert");
  const confirmText = document.getElementById("confirm-text");
  const confirmWord = document.getElementById("confirm-word");
  const confirmBtn = document.getElementById("confirm-btn");

  overlay.classList.add("show");
  alertBox.classList.add("show");
  confirmText.innerText = text;
  confirmWord.innerText = word;

  // Clear previous button content
  confirmBtn.innerHTML = "";

  const button = document.createElement("button");
  button.id = "conBtn";
  button.className = "btn-ok";
  button.innerText = btn;
  button.style.background = color;

  button.addEventListener("click", () => {
    closeAlert();
    if (typeof func === "function") func(innB);
  });

  confirmBtn.appendChild(button);
}

function closeAlert(){
  document.getElementById("alertOverlay").classList.remove("show");
  document.getElementById("customAlert").classList.remove("show");
}


function openShareModal() {
    document.getElementById('vibeModal').style.display = 'flex';
  BackManager.register(closeModalDirect);
}

function closeModalDirect() {
    document.getElementById('vibeModal').style.display = 'none';
  BackManager.unregister(closeModalDirect);
}

function closeShareModal(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeModalDirect();
    }
}

async function sendvibe() {
if(guest) return guestWarn();

    const u = prepearUserForSend('not');

    let e = u?.email;
    let un = u?.username;
    let av = u?.avatar || '';
    let t = document.getElementById('modalText')?.value?.trim();

    if (!e) return onalert('Email required');
    if (!un) return onalert('Username required');
    if (!t) return onalert('Text required');

    if (!t.trim()) {
        alert("Please write something before posting!");
        return;
    }

    const payload = {
        email: e,
        username: un,
        vibe: t,
        avatar: av,
    };
    

try {
    const response = await fetch('https://posts-server-kmha.onrender.com/api/add-vibe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (response.ok && result.success) {
        document.getElementById('modalText').value = '';
        if (typeof onalert === 'function') {
            onalert('Vibe posted successfully!');
        }
    } else {
        console.error('Error adding vibe:', result.error || 'Server error');
        if (typeof onalert === 'function') {
            onalert(result.error || 'Failed to post vibe');
        }
    }

} catch (err) {
    console.error('Fetch error:', err);
    if (typeof onalert === 'function') {
        onalert('Network error!');
    }
}

}

async function loadVibes() {
    const vibesContainer = document.querySelector('#vibes-show');  
    if (!vibesContainer) return;
 
document.getElementById('vibe-error').style.display = 'none';
 document.getElementById('vibe-loader').style.display = 'flex';

    try {
        const response = await fetch('https://posts-server-kmha.onrender.com/api/get-vibes');
        const result = await response.json();

        if (response.ok && result.success && Array.isArray(result.data)) {
            vibesContainer.innerHTML = '';

            if (result.data.length === 0) {
                const vibeEmpty = document.createElement('div');
                vibeEmpty.className = 'vibes-div';
                vibeEmpty.innerHTML = `
                    <div class="vibes-text" style="text-align: center;">
                        No vibe has been submitted yet!                  
                    </div>
                    <div class="vibes-footer">
                        <div>— Empty text</div>
                    </div>
                `;
                vibesContainer.appendChild(vibeEmpty); 
document.getElementById('vibe-loader').style.display = 'none';
                return;           
            }
            
document.getElementById('vibe-loader').style.display = 'none';
            result.data.forEach(item => {
                const vibeCard = document.createElement('div');
                vibeCard.className = 'vibes-div';

                vibeCard.dataset.email = item.email || '';
                vibeCard.dataset.username = item.username || '';
                vibeCard.dataset.avatar = item.avatar || '';
                vibeCard.dataset.vibe = item.vibe || '';

                const fullText = item.vibe || '';
                const isLongText = fullText.length > 50;
                const displayText = isLongText ? fullText.substring(0, 50) + '... ' : fullText;

                vibeCard.innerHTML = `
                    <div class="vibes-text">
                        ${displayText}${isLongText ? '<span class="vibes-more">see more</span>' : ''}
                    </div>
                    <div class="vibes-footer">
                        <div>— ${item.username || 'Anonymous'}</div>
                    </div>
                `;

                vibesContainer.appendChild(vibeCard);
            });
        } else {
            console.error('Failed to load vibes:', result.error || 'Unknown error');
        }

    } catch (err) {
        console.error('Error fetching vibes:', err);
        document.getElementById('vibe-loader').style.display = 'none';
document.getElementById('vibe-error').style.display = 'flex';

    }
}


const vibesContainer = document.querySelector('#vibes-show');
if (vibesContainer) {
    vibesContainer.addEventListener('click', (event) => {
        const card = event.target.closest('.vibes-div');
        if (card && card.dataset.vibe) {
            const { email, username, avatar, vibe } = card.dataset;
            vibeDisShow(email, username, avatar, vibe);
        }
    });
}

document.addEventListener('DOMContentLoaded', loadHome);

function vibeDisShow(e, u, a, v) {
    const overlay = document.getElementById('showVibeText');
    const card = document.getElementById('showVibeText-card');

document.getElementById('urName').innerText = u ;   
document.getElementById('urAvatar').src = a;   
document.getElementById('urVibe').innerText  = v;   

    overlay.classList.add('show');
    card.classList.remove('bounce');
    card.classList.add('show');      

    setTimeout(() => {
        card.classList.remove('show');
        card.classList.add('bounce');
    }, 200);

    if (typeof BackManager !== 'undefined') {
        BackManager.register(closeVibeModal);
    }
}

function closeVibeModal() {
    const overlay = document.getElementById('showVibeText');
    const card = document.getElementById('showVibeText-card');

    card.classList.remove('show', 'bounce');
    overlay.classList.remove('show');
}

const emojisList = [
    // Dislike / Negative
    "👎", "🙄", "😒", "🤨", "😑",
    // Care / Support / Hug
    "🫂", "🫶", "🤗", "🤲", "🤝",
    // Haha / Laugh
    "😂", "🤣", "😆", "😅", "😹",
    // Sad / Cry
    "😢", "😭", "😥", "😞", "😔", "💧",
    // Angry / Frustrated
    "😡", "😠", "🤬", "😤", "👿",
    // Wow / Shocked
    "😲", "😮", "🤯", "😯", "😳",
    // Thinking / Curious
    "🤔", "🧐", "🤫", "🤷‍♂️", "🤷‍♀️",
    // Cool / Fire / Energy
    "🔥", "😎", "🚀", "⚡", "💯",
    // Celebrate / Party / Fun
    "🎉", "🥳", "👏", "🙌", "✨", "🍻",
    // Cute / Funny / Extra
    "🤡", "👻", "💀", "💩", "🦄", "👀"
];


function reactPlus() {
    let overlay = document.getElementById("reactPlusOverlay");
    if (!overlay) {
        const htmlTemplate = `
        <div id="reactPlusOverlay" class="react-plus-overlay">
            <div id="reactPlusModal" class="react-plus-modal">
                <div class="react-plus-header">
                    <h3>Select Reactions <span id="reactCount">(0/12)</span></h3>
                    <button class="react-plus-close" onclick="closeReactPlus()">×</button>
                </div>
                <div class="react-plus-selected-preview" id="reactPreviewContainer"></div>
                <div class="react-plus-grid" id="reactPlusGrid"></div>
                <div class="react-plus-footer">
                    <button class="react-plus-ok-btn" id="reactPlusOkBtn">OK</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', htmlTemplate);
        overlay = document.getElementById("reactPlusOverlay");

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeReactPlus();
        });
    }

    // Load saved emojis from localStorage
    let savedReacts = [];
    try {
        const stored = localStorage.getItem('reacts');
        if (stored) {
            savedReacts = JSON.parse(stored);
            if (!Array.isArray(savedReacts)) savedReacts = [];
        }
    } catch (err) {
        savedReacts = [];
    }

    let currentSelected = [...savedReacts];

    // Render Function
    const renderGridAndPreview = () => {
        const grid = document.getElementById("reactPlusGrid");
        const previewContainer = document.getElementById("reactPreviewContainer");
        const countSpan = document.getElementById("reactCount");

        // 1. Update Preview Chip Container
        previewContainer.innerHTML = "";
        countSpan.innerText = `(${currentSelected.length}/12)`;

        currentSelected.forEach(emoji => {
            const chip = document.createElement("div");
            chip.className = "preview-chip";
            chip.innerHTML = `
                <span>${emoji}</span>
                <span class="remove-chip-btn">×</span>
            `;

            // Click chip cross to remove
            chip.querySelector(".remove-chip-btn").addEventListener("click", () => {
                currentSelected = currentSelected.filter(e => e !== emoji);
                renderGridAndPreview();
            });

            previewContainer.appendChild(chip);
        });

        // Auto-scroll preview to rightmost
        previewContainer.scrollLeft = previewContainer.scrollWidth;

        // 2. Update Emoji Grid items
        grid.innerHTML = "";
        emojisList.forEach(emoji => {
            const item = document.createElement("div");
            item.className = "emoji-item";
            item.innerText = emoji;

            if (currentSelected.includes(emoji)) {
                item.classList.add("selected");
            }

            item.addEventListener("click", () => {
                if (currentSelected.includes(emoji)) {
                    currentSelected = currentSelected.filter(e => e !== emoji);
                } else {
                    if (currentSelected.length >= 12) {
                        alert("You can select a maximum of 12 reactions!");
                        return;
                    }
                    currentSelected.push(emoji);
                }
                renderGridAndPreview();
            });

            grid.appendChild(item);
        });
    };

    renderGridAndPreview();

    // OK Button Event
    const okBtn = document.getElementById("reactPlusOkBtn");
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);

    newOkBtn.addEventListener("click", () => {
        localStorage.setItem('reacts', JSON.stringify(currentSelected));
        closeReactPlus();
        window.location.reload();
    });

    // Display animation
    setTimeout(() => {
        overlay.classList.add("show");
    }, 10);
    
    BackManager.register(closeReactPlus);
}

function closeReactPlus() {
    const overlay = document.getElementById("reactPlusOverlay");
    if (overlay) {
        overlay.classList.remove("show");
    }
    BackManager.unregister(closeReactPlus);
}
