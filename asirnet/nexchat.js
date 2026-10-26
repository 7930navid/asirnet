

function aires() {
     const el = document.getElementById('ai-box');
     
     el.classList.add('show');
     BackManager.register(closeRes);
}

function closeRes() {
     const el = document.getElementById('ai-box');
     const box = document.getElementById('conversasion-box');
     
     
    el.classList.remove('show');
    box.innerHTML = '';
    localStorage.removeItem('nexchat_session_id');
     
     BackManager.unregister(closeRes);
}


(() => {

'use strict';
    
    const AI_API = 'https://nexchat-server-qhm5.onrender.com/api/chat';


    const input = document.getElementById('message-to-ai');
    const conversation = document.getElementById('conversasion-box');
    const sendButton = document.querySelector(
        '[onclick="sendToAi()"]'
    );
    const actionIcon = document.getElementById('action-icon');

    if (!input || !conversation) {
        console.error(
            'NexChat: Required chat elements were not found.'
        );
        return;
    }

    // ======================================
    // SESSION
    // ======================================

    function createSessionId() {
        if (window.crypto?.randomUUID) {
            return window.crypto.randomUUID();
        }

        return 'session-' + Date.now().toString(36) +
            '-' + Math.random().toString(36).slice(2);
    }

    let sessionId;

    try {
        sessionId = sessionStorage.getItem('nexchat_session_id');

        if (!sessionId) {
            sessionId = createSessionId();

            sessionStorage.setItem(
                'nexchat_session_id',
                sessionId
            );
        }
    } catch {
        sessionId = createSessionId();
    }

    // ======================================
    // LOAD CSS AND JS CDN LIBRARIES
    // ======================================

    function loadCSS(url) {
        return new Promise(resolve => {
            const link = document.createElement('link');

            link.rel = 'stylesheet';
            link.href = url;

            link.onload = () => resolve(true);
            link.onerror = () => {
                console.warn('CSS CDN failed:', url);
                resolve(false);
            };

            document.head.appendChild(link);
        });
    }

    const loadedScripts = {};

    function loadScript(url, globalName) {
        if (globalName && window[globalName]) {
            return Promise.resolve(true);
        }

        if (loadedScripts[url]) {
            return loadedScripts[url];
        }

        loadedScripts[url] = new Promise(resolve => {
            const script = document.createElement('script');

            script.src = url;
            script.async = true;

            script.onload = () => {
                resolve(
                    !globalName || Boolean(window[globalName])
                );
            };

            script.onerror = () => {
                console.warn('JS CDN failed:', url);
                resolve(false);
            };

            document.head.appendChild(script);
        });

        return loadedScripts[url];
    }

    const librariesReady = (async () => {
        await Promise.all([
            loadCSS(
                'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css'
            ),
            loadCSS(
                'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css'
            )
        ]);

        const purifierOK = await loadScript(
            'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.2.6/purify.min.js',
            'DOMPurify'
        );

        const markedOK = await loadScript(
            'https://cdn.jsdelivr.net/npm/marked@15.0.7/marked.min.js',
            'marked'
        );

        const highlightOK = await loadScript(
            'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js',
            'hljs'
        );

        const katexOK = await loadScript(
            'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js',
            'katex'
        );

        let autoRenderOK = false;

        if (katexOK) {
            autoRenderOK = await loadScript(
                'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js',
                'renderMathInElement'
            );
        }

        return {
            purifierOK,
            markedOK,
            highlightOK,
            katexOK,
            autoRenderOK
        };
    })();

    // ======================================
    // COPY UTILITIES
    // ======================================

    async function copyText(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                showToast('Copied!');
                return true;
            }
        } catch {
            // Use fallback
        }

        const temp = document.createElement('textarea');

        temp.value = text;
        temp.readOnly = true;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';

        document.body.appendChild(temp);
        temp.select();
        temp.setSelectionRange(0, temp.value.length);

        let copied = false;

        try {
            copied = document.execCommand('copy');
        } catch {
            copied = false;
        }

        temp.remove();

        showToast(copied ? 'Copied!' : 'Copy failed. Try again.');

        return copied;
    }

    function showToast(message) {
        document.querySelector('.nc-copy-toast')?.remove();

        const toast = document.createElement('div');

        toast.className = 'nc-copy-toast';
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 1800);
    }

    // ======================================
    // CREATE MESSAGE ELEMENTS
    // ======================================

    function createMessageRow(type, label) {
        const row = document.createElement('div');
        row.className = `nc-message-row ${type}`;

        const avatar = document.createElement('div');
        avatar.className = 'nc-avatar';
        avatar.textContent = type === 'ai' ? 'N' : 'U';
        avatar.setAttribute('aria-hidden', 'true');

        const main = document.createElement('div');
        main.className = 'nc-message-main';

        const name = document.createElement('div');
        name.className = 'nc-message-label';
        name.textContent = label;

        const bubble = document.createElement('div');
        bubble.className = 'nc-bubble';

        main.append(name, bubble);

        if (type === 'ai') {
            row.append(avatar, main);
        } else {
            row.append(main, avatar);
        }

        conversation.appendChild(row);

        return { row, bubble, main };
    }

    // ======================================
    // RENDER AI RESPONSE
    // ======================================

    async function renderAIResponse(bubble, text) {
        const libs = await librariesReady;

        if (!libs.markedOK || !window.marked) {
            bubble.textContent = text;
            return;
        }

        try {
            const rawHTML = window.marked.parse(text, {
                gfm: true,
                breaks: true
            });

            // Never inject untrusted HTML without sanitizing it.
            if (!libs.purifierOK || !window.DOMPurify) {
                bubble.textContent = text;
                return;
            }

            bubble.innerHTML = window.DOMPurify.sanitize(rawHTML, {
                USE_PROFILES: { html: true }
            });

            bubble.querySelectorAll('a').forEach(link => {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            });

            // Syntax highlighting and copy-code controls
            bubble.querySelectorAll('pre').forEach(pre => {
                const code = pre.querySelector('code');

                if (!code) return;

                if (
                    pre.parentElement?.classList.contains(
                        'nc-code-wrap'
                    )
                ) {
                    return;
                }

                if (libs.highlightOK && window.hljs) {
                    try {
                        window.hljs.highlightElement(code);
                    } catch (error) {
                        console.warn('Highlight error:', error);
                    }
                }

                const wrapper = document.createElement('div');
                wrapper.className = 'nc-code-wrap';

                const top = document.createElement('div');
                top.className = 'nc-code-top';

                const langClass = [...code.classList].find(
                    cls => cls.startsWith('language-')
                );

                const language = document.createElement('span');
                language.textContent = langClass
                    ? langClass.replace('language-', '')
                    : 'Code';

                const copyButton = document.createElement('button');
                copyButton.type = 'button';
                copyButton.className = 'nc-copy-code';
                copyButton.textContent = 'Copy code';

                copyButton.addEventListener('click', async () => {
                    const success = await copyText(code.textContent);

                    if (success) {
                        copyButton.textContent = 'Copied!';

                        setTimeout(() => {
                            copyButton.textContent = 'Copy code';
                        }, 1500);
                    }
                });

                top.append(language, copyButton);

                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.append(top, pre);
            });

            // KaTeX math rendering
            if (
                libs.katexOK &&
                libs.autoRenderOK &&
                typeof window.renderMathInElement === 'function'
            ) {
                try {
                    window.renderMathInElement(bubble, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '\\[', right: '\\]', display: true },
                            { left: '\\(', right: '\\)', display: false }
                        ],
                        throwOnError: false,
                        strict: 'ignore'
                    });
                } catch (error) {
                    console.warn('Math render error:', error);
                }
            }
        } catch (error) {
            console.warn('Markdown render error:', error);
            bubble.textContent = text;
        }
    }

    // ======================================
    // AI MESSAGE COPY BUTTON
    // ======================================

    function addAIActions(main, responseText) {
        const actions = document.createElement('div');
        actions.className = 'nc-message-actions';

        const copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.className = 'nc-action-btn';
        copyButton.textContent = '▢ Copy';

        copyButton.addEventListener('click', async () => {
            const success = await copyText(responseText);

            if (success) {
                copyButton.textContent = '✓ Copied';

                setTimeout(() => {
                    copyButton.textContent = '▢ Copy';
                }, 1500);
            }
        });

        actions.appendChild(copyButton);
        main.appendChild(actions);
    }

    // ======================================
    // LOADING INDICATOR
    // ======================================

    function showLoading() {
        const message = createMessageRow('ai', 'NexChat AI');

        const dots = document.createElement('div');
        dots.className = 'nc-thinking';
        dots.setAttribute('aria-label', 'AI is thinking');

        for (let i = 0; i < 3; i++) {
            dots.appendChild(document.createElement('span'));
        }

        message.bubble.appendChild(dots);

        return message;
    }

    // ======================================
    // SEND MESSAGE
    // ======================================

    let isSending = false;

    window.sendToAi = async function sendToAi() {
        if (isSending) return;

        const prompt = input.value.trim();

        if (!prompt) return;

        isSending = true;

        if (sendButton) {
            sendButton.disabled = true;
            sendButton.style.opacity = '0.6';
        }

        if (actionIcon) {
            actionIcon.style.opacity = '0.6';
        }

        // Show user message
        const userMessage = createMessageRow('user', 'You');
        userMessage.bubble.textContent = prompt;

        input.value = '';

        // Show loading
        const loading = showLoading();
        conversation.scrollTop = conversation.scrollHeight;

        try {
            const response = await fetch(AI_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt,
                    sessionId
                })
            });

            const responseText = await response.text();

            let data;

            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error(
                    response.ok
                        ? 'Server returned an invalid response.'
                        : `Server error: ${response.status}`
                );
            }

            if (!response.ok) {
                throw new Error(
                    data.error || `Request failed: ${response.status}`
                );
            }

            if (typeof data.reply !== 'string') {
                throw new Error('API response does not contain a reply.');
            }

            if (data.sessionId) {
                sessionId = data.sessionId;

                try {
                    sessionStorage.setItem(
                        'nexchat_session_id',
                        sessionId
                    );
                } catch {
                    // Continue without storage
                }
            }

            loading.row.remove();

            const aiMessage = createMessageRow('ai', 'NexChat AI');

            await renderAIResponse(aiMessage.bubble, data.reply);
            addAIActions(aiMessage.main, data.reply);

            conversation.scrollTop = conversation.scrollHeight;

        } catch (error) {
            console.error('NexChat API error:', error);

            loading.row.remove();

            const errorMessage = createMessageRow('ai', 'NexChat AI');

            errorMessage.bubble.classList.add('nc-error');

            errorMessage.bubble.textContent =
                error.message === 'Failed to fetch'
                    ? 'Cannot connect to the server. Check your internet, API URL, and CORS settings.'
                    : error.message || 'Something went wrong.';

            conversation.scrollTop = conversation.scrollHeight;

        } finally {
            isSending = false;

            if (sendButton) {
                sendButton.disabled = false;
                sendButton.style.opacity = '1';
            }

            if (actionIcon) {
                actionIcon.style.opacity = '1';
            }
        }
    };

})();