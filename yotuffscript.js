let messages = [];
let currentFacingMode = 'environment';
let currentlySpeaking = null;
let pendingCancellation = null;
let isRecording = false;
let recognition = null;
let isSending = false;
let cameraStream = null;
let attachedFiles = [];
let currentZoom = 1;
let maxZoom = 3;
let scrollTimeout;
let isAutoScrolling = false;	
let minZoom = 1;
const switchCameraBtn = document.getElementById('switchCameraBtn');
const MAX_FILES_PER_MESSAGE = 10
const INPUT_STORAGE_KEY = 'chat-input-draft';
const MAX_TOKENS = 200000;
const TOKEN_ESTIMATE_CHARS_PER_TOKEN = 4;
const messageList = document.getElementById('messageList');
const emptyState = document.getElementById('emptyState');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const resetBtn = document.getElementById('resetBtn');
const voiceBtn = document.getElementById('voiceBtn');
const voiceStatus = document.getElementById('voiceStatus');
const attachBtn = document.getElementById('attachBtn');
const cameraBtn = document.getElementById('cameraBtn');
const fileInput = document.getElementById('fileInput');
const cameraModal = document.getElementById('cameraModal');
const cameraVideo = document.getElementById('cameraVideo');
const closeCameraBtn = document.getElementById('closeCameraBtn');
const captureBtn = document.getElementById('captureBtn');
const attachedFileContainer = document.getElementById('attachedFileContainer');
const zoomSlider = document.getElementById('zoomSlider');
const zoomTrack = document.getElementById('zoomTrack');
const zoomThumb = document.getElementById('zoomThumb');
const zoomLabel = document.getElementById('zoomLabel');
const messageRenderState = new Map();
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false
});

const fileTypeIcons = {
  'image/jpeg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  'image/png': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  'image/gif': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  'image/webp': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  'image/svg+xml': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  'image/bmp': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  'application/pdf': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
  'application/msword': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
  'application/vnd.ms-excel': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linej lucide-file-text"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
  'text/html': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-code-corner"><path d="M4 12.15V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-3.35"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="m5 16-3 3 3 3"/><path d="m9 22 3-3-3-3"/></svg>`,
  'text/css': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-code-corner"><path d="M4 12.15V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-3.35"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="m5 16-3 3 3 3"/><path d="m9 22 3-3-3-3"/></svg>`,
  'text/javascript': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-code-corner"><path d="M4 12.15V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-3.35"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="m5 16-3 3 3 3"/><path d="m9 22 3-3-3-3"/></svg>`,
  'application/json': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-braces-corner"><path d="M14 22h4a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v6"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M5 14a1 1 0 0 0-1 1v2a1 1 0 0 1-1 1 1 1 0 0 1 1 1v2a1 1 0 0 0 1 1"/><path d="M9 22a1 1 0 0 0 1-1v-2a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-2a1 1 0 0 0-1-1"/></svg>`,
  'application/zip': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-archive"><circle cx="15" cy="19" r="2"/><path d="M20.9 19.8A2 2 0 0 0 22 18V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h5.1"/><path d="M15 11v-1"/><path d="M15 17v-2"/></svg>`,
  'application/x-rar-compressed': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-archive"><circle cx="15" cy="19" r="2"/><path d="M20.9 19.8A2 2 0 0 0 22 18V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h5.1"/><path d="M15 11v-1"/><path d="M15 17v-2"/></svg>`,
  'application/x-7z-compressed': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-archive"><circle cx="15" cy="19" r="2"/><path d="M20.9 19.8A2 2 0 0 0 22 18V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h5.1"/><path d="M15 11v-1"/><path d="M15 17v-2"/></svg>`,
  'video/mp4': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-play"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M15.033 13.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56v-4.704a.645.645 0 0 1 .967-.56z"/></svg>`,
  'video/webm': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-play"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M15.033 13.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56v-4.704a.645.645 0 0 1 .967-.56z"/></svg>`,
  'video/quicktime': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-play"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M15.033 13.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56v-4.704a.645.645 0 0 1 .967-.56z"/></svg>`,
  'default': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/></svg>`
};


function revealCharWithBlur(element, char, delay) {
  return new Promise(resolve => {
    setTimeout(() => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.display = 'inline-block';
      span.style.filter = `blur(${TYPING_CONFIG.initialBlur}px)`;
      span.style.opacity = '0';
      span.style.transition = `filter ${TYPING_CONFIG.blurDuration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${TYPING_CONFIG.blurDuration}ms ease-out`;
      
      element.appendChild(span);
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          span.style.filter = 'blur(0px)';
          span.style.opacity = '1';
        });
      });
      
      setTimeout(resolve, TYPING_CONFIG.charDelay);
    }, delay);
  });
}
function cleanupRenderState(id) {
  messageRenderState.delete(id);
}
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / TOKEN_ESTIMATE_CHARS_PER_TOKEN);
}
function calculateTotalTokens() {
  let totalTokens = 0;
  
  messages.forEach(msg => {
    totalTokens += estimateTokens(msg.content);
    

    if (msg.files && msg.files.length > 0) {
      msg.files.forEach(fileData => {
        if (fileData.textContent) {
          totalTokens += estimateTokens(fileData.textContent);
        }
        // Images roughly count as ~85 tokens each (Claude's estimate)
        if (isImageFile(fileData.file, fileData.base64Data)) {
          totalTokens += 85;
        }
      });
    }
  });
  
  return totalTokens;
}
function formatFileSize(bytes) {
  if (bytes === undefined || bytes === null) return '0 Bytes';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
function manageMemory() {
  const totalTokens = calculateTotalTokens();
  
  if (totalTokens > MAX_TOKENS) {
    const tokensToRemove = totalTokens - MAX_TOKENS;
    let tokensRemoved = 0;
    let messagesRemoved = 0;
    
    while (tokensRemoved < tokensToRemove && messages.length > 4) {
      const oldestMessage = messages[0];
      

      let messageTokens = estimateTokens(oldestMessage.content);
      if (oldestMessage.files) {
        oldestMessage.files.forEach(fileData => {
          if (fileData.textContent) {
            messageTokens += estimateTokens(fileData.textContent);
          }
          if (isImageFile(fileData.file, fileData.base64Data)) {
            messageTokens += 85;
          }
        });
      }
      
      messages.shift(); // Remove oldest message
      tokensRemoved += messageTokens;
      messagesRemoved++;
    }
    

    saveMessages();
    renderMessages();
    

    const finalTokenCount = calculateTotalTokens();
    notify.show(
      'Memory Managed',
      `Conversation exceeded ${MAX_TOKENS.toLocaleString()} tokens. Removed ${messagesRemoved} oldest message(s) to free up space. Current tokens: ${finalTokenCount.toLocaleString()}`,
      'info',
      6000
    );
    
    return true;
  }
  
  return false;
}
function constrainCodeBlockWidth() {
  const codeBlocks = document.querySelectorAll('.code-block-container');
  
  codeBlocks.forEach(container => {

    container.style.maxWidth = '';
    container.style.width = '';
    
    const contentWrapper = container.querySelector('.code-block-content');
    if (contentWrapper) {
      contentWrapper.style.maxWidth = '';
    }
    
    const preElement = container.querySelector('pre');
    if (preElement) {
      preElement.style.maxWidth = '';
    }
  });
}


function enhanceCodeBlocks() {
  document.querySelectorAll('.message.assistant .bubble .markdown-content pre').forEach((preElement, index) => {
    if (preElement.closest('.code-block-container')) {
      return;
    }

    const codeElement = preElement.querySelector('code');
    if (!codeElement) return;

    let language = 'text';
    const classList = Array.from(codeElement.classList);
    const langClass = classList.find(cls => cls.startsWith('language-'));
    if (langClass) {
      language = langClass.replace('language-', '');
    }

    const codeContent = codeElement.textContent;
    const charCount = codeContent.length;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-container';
    
    const header = document.createElement('div');
    header.className = 'code-block-header';
    header.innerHTML = `
      <div class="code-status">
        <span>${language}</span>
      </div>
      <div class="code-actions">
        <span class="char-count">${charCount} chars</span>
        <button class="copy-code-btn" data-code-index="${index}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        </button>
      </div>
    `;

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'code-block-content';
    
    const clonedPre = preElement.cloneNode(true);
    contentWrapper.appendChild(clonedPre);

    const footer = document.createElement('div');
    footer.className = 'code-block-footer';
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    footer.innerHTML = `
      <span class="timestamp">${timeStr}</span>
      <span class="separator">•</span>
      <span class="model-name">${modelSelectAPI.getValue().split('-')[1] || 'assistant'}</span>
      <button class="insert-code-btn" title="Insert at cursor">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    `;

    wrapper.appendChild(header);
    wrapper.appendChild(contentWrapper);
    wrapper.appendChild(footer);

    preElement.parentNode.replaceChild(wrapper, preElement);

    const copyBtn = header.querySelector('.copy-code-btn');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeContent);
        copyBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Copied!
        `;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          `;
        }, 2000);
        notify.show('Copied', 'Code copied to clipboard', 'success');
      } catch (err) {
        console.error('Copy failed:', err);
        notify.show('Error', 'Failed to copy code', 'error');
      }
    });

    const insertBtn = footer.querySelector('.insert-code-btn');
    insertBtn.addEventListener('click', () => {
      const currentValue = messageInput.value;
      const newValue = currentValue + (currentValue ? '\n\n' : '') + codeContent;
      messageInput.value = newValue;
      autoResizeTextarea();
      saveInputDraft();
      messageInput.focus();
      notify.show('Inserted', 'Code inserted into input', 'success');
    });
  });
  
  constrainCodeBlockWidth();
}





function getFileIcon(file) {
  if (!file || !file.type) {
    return fileTypeIcons['default'];
  }
  
  return fileTypeIcons[file.type] || fileTypeIcons['default'];
}

function isTextFile(file) {
  if (!file || !file.type) return false;
  const textTypes = ['text/plain','text/html','text/css','text/javascript','application/javascript','application/json','text/xml','application/xml','text/markdown','text/csv','application/x-sh','application/x-python-code','text/x-python','text/x-java-source','text/x-c','text/x-c++'];
  if (textTypes.includes(file.type)) return true;
  const textExtensions = ['.txt', '.js', '.html', '.css', '.json', '.md', '.py', '.java', '.c', '.cpp', '.h', '.xml', '.csv', '.sh', '.bat', '.yml', '.yaml'];
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  return textExtensions.includes(extension);
}

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function isImageFile(file, base64Data) {
  if (file && file.type) return file.type.startsWith('image/');
  if (typeof base64Data === 'string' && base64Data.startsWith('data:image/')) return true;
  return false;
}

function isVideoFile(file, base64Data) {
  if (file && file.type) return file.type.startsWith('video/');
  if (typeof base64Data === 'string' && base64Data.startsWith('data:video/')) return true;
  return false;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createFilePreviewHTML(file, base64Data) {
  if (!file || !file.name) {
    console.error('Invalid file object:', file);
    return '<div class="file-preview-error">Invalid file</div>';
  }
  const icon = getFileIcon(file);
  const size = formatFileSize(file.size || 0);
  if (isImageFile(file, base64Data)) {
    return `<div class="file-preview"><img src="${base64Data}" alt="${file.name}" class="file-preview-image"><div class="file-info" style="padding: 0.5rem; font-size: 0.75rem; color: #a3a3a3;">${icon} ${file.name} (${size})</div></div>`;
  } else {
    const extension = (file.name || '').split('.').pop().toLowerCase();
    return `<div class="file-preview"><div class="file-preview-document"><div class="file-icon ${extension}">${icon}</div><div class="file-info"><div><strong>${file.name}</strong></div><div style="color: #737373; font-size: 0.7rem; margin-top: 0.25rem;">${size} • ${file.type || 'Unknown'}</div></div><button class="file-download-btn" onclick="downloadFile('${file.name}', '${base64Data}')">Download</button></div></div>`;
  }
}

function createFileAttachmentText(file, textContent = null) {
  if (!file || !file.name) return '';
  const size = formatFileSize(file.size || 0);
  if (isImageFile(file) || isVideoFile(file)) return '';
  let attachmentText = `\n📎 ${file.name} (${size})`;
  if (textContent) {
    attachmentText += `\n\n[File Contents of ${file.name}:]\n${textContent}\n[End of ${file.name}]`;
  }
  return attachmentText;
}

function downloadFile(filename, base64Data) {
  const link = document.createElement('a');
  link.href = base64Data;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function displayAttachedFiles() {
  if (attachedFiles.length === 0) {
    attachedFileContainer.innerHTML = '';
    return;
  }
  let html = '';
  attachedFiles.forEach((fileData, index) => {
    if (!fileData || !fileData.file) {
      console.warn('Invalid file data at index', index);
      return;
    }
    const { file, base64Data } = fileData;
    const icon = getFileIcon(file);
    const size = formatFileSize(file.size || 0);
    html += `<div class="attached-file"><span>${icon}</span><span class="attached-file-name">${file.name}</span><span class="attached-file-size">${size}</span><svg class="remove-file" data-index="${index}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>`;
  });
  attachedFileContainer.innerHTML = html;
  attachedFileContainer.querySelectorAll('.remove-file').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      attachedFiles.splice(index, 1);
      displayAttachedFiles();
    });
  });
}

function initDragAndDrop() {
  const dropZone = document.body;
  let dragCounter = 0;
  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) dropZone.classList.remove('drag-over');
  });
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    if (attachedFiles.length + files.length > MAX_FILES_PER_MESSAGE) {
      notify.show('File Limit Exceeded', `You can only attach up to ${MAX_FILES_PER_MESSAGE} files per message. Currently attached: ${attachedFiles.length}`, 'error');
      return;
    }
    const maxTotalSize = 50 * 1024 * 1024;
    let totalSize = 0;
    for (const file of files) {
      totalSize += file.size;
    }
    if (totalSize > maxTotalSize) {
      notify.show('File Size Limit', 'Total file size exceeds 50MB limit', 'error');
      return;
    }
    for (const file of files) {
      try {
        const base64Data = await fileToBase64(file);
        let textContent = null;
        if (isTextFile(file)) {
          try {
            textContent = await readFileAsText(file);
          } catch (error) {
            console.error('Error reading text file:', error);
          }
        }
        attachedFiles.push({ file, base64Data, textContent });
      } catch (error) {
        console.error('Error reading file:', error);
        notify.show('File Error', `Failed to read ${file.name}`, 'error');
      }
    }
    displayAttachedFiles();
    if (files.length > 1) {
      notify.show('Files Added', `${files.length} files attached`, 'success');
    } else {
      notify.show('File Added', `${files[0].name} attached`, 'success');
    }
  });
}

function initCustomSelect(selectId) {
  const selectElement = document.getElementById(selectId);
  const trigger = selectElement.querySelector('.custom-select-trigger');
  const valueDisplay = selectElement.querySelector('.custom-select-value');
  const dropdown = selectElement.querySelector('.custom-select-dropdown');
  const options = selectElement.querySelectorAll('.custom-select-option');
  let selectedValue = '';
  let selectedCode = '';
  const savedValue = localStorage.getItem(`selected-${selectId}`);
  if (savedValue) {
    const savedOption = selectElement.querySelector(`[data-value="${savedValue}"]`);
    if (savedOption) {
      options.forEach(opt => opt.classList.remove('selected'));
      savedOption.classList.add('selected');
      valueDisplay.textContent = savedOption.textContent;
      selectedValue = savedOption.dataset.value;
      selectedCode = savedOption.dataset.code;
    }
  } else {
    const defaultSelected = selectElement.querySelector('.custom-select-option.selected');
    if (defaultSelected) {
      valueDisplay.textContent = defaultSelected.textContent;
      selectedValue = defaultSelected.dataset.value;
      selectedCode = defaultSelected.dataset.code;
    }
  }
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasOpen = selectElement.classList.contains('open');
    document.querySelectorAll('.custom-select.open').forEach(sel => sel.classList.remove('open'));
    if (!wasOpen) {
      selectElement.classList.add('open');
      positionDropdown(selectElement);
    }
  });
  window.addEventListener('resize', () => {
    document.querySelectorAll('.custom-select.open').forEach(selectElement => {
      positionDropdown(selectElement);
    });
  });
  options.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      options.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      valueDisplay.textContent = option.textContent;
      selectedValue = option.dataset.value;
      selectedCode = option.dataset.code;
      localStorage.setItem(`selected-${selectId}`, selectedValue);
      selectElement.classList.remove('open');
      if (selectId === 'languageSelect' && recognition) {
        recognition.lang = selectedValue;
      }
    });
  });
  document.addEventListener('click', () => {
    selectElement.classList.remove('open');
  });
  return {
    getValue: () => selectedValue,
    getCode: () => selectedCode,
    setValue: (value) => {
      const option = selectElement.querySelector(`[data-value="${value}"]`);
      if (option) {
        options.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        valueDisplay.textContent = option.textContent;
        selectedValue = option.dataset.value;
        selectedCode = option.dataset.code;
      }
    }
  };
}

const languageSelectAPI = initCustomSelect('languageSelect');
const modelSelectAPI = initCustomSelect('modelSelect');

function initZoomControls() {
  let isDragging = false;
  let startX = 0;
  let startZoom = 1;
  function updateZoom(zoom) {
    const effectiveMax = maxZoom <= minZoom ? 4 : maxZoom;
    const effectiveMin = minZoom;
    currentZoom = Math.max(effectiveMin, Math.min(effectiveMax, zoom));
    const range = effectiveMax - effectiveMin;
    const percent = range > 0 ? ((currentZoom - effectiveMin) / range) * 100 : 0;
    zoomTrack.style.width = percent + '%';
    zoomThumb.style.left = percent + '%';
    zoomLabel.textContent = currentZoom.toFixed(1) + 'x';
    if (cameraStream) {
      const track = cameraStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      if (capabilities.zoom) {
        track.applyConstraints({advanced: [{ zoom: currentZoom }]}).catch(err => console.log('Hardware zoom error:', err));
      }
      cameraVideo.style.transform = `scale(${currentZoom})`;
    }
  }
  function handleDragStart(e) {
    isDragging = true;
    startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    startZoom = currentZoom;
    e.preventDefault();
  }
  function handleDragMove(e) {
    if (!isDragging) return;
    const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - startX;
    const sliderWidth = zoomSlider.offsetWidth;
    const zoomDelta = (deltaX / sliderWidth) * (maxZoom <= minZoom ? 3 : maxZoom - minZoom);
    updateZoom(startZoom + zoomDelta);
  }
  function handleDragEnd() {
    isDragging = false;
  }
  zoomThumb.addEventListener('mousedown', handleDragStart);
  zoomThumb.addEventListener('touchstart', handleDragStart);
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('touchmove', handleDragMove, { passive: false });
  document.addEventListener('mouseup', handleDragEnd);
  document.addEventListener('touchend', handleDragEnd);
  cameraVideo.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
      cameraVideo.dataset.lastPinchDistance = distance;
    }
  }, { passive: false });
  cameraVideo.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
      const lastDistance = parseFloat(cameraVideo.dataset.lastPinchDistance);
      if (lastDistance) {
        const scale = distance / lastDistance;
        updateZoom(currentZoom * scale);
      }
      cameraVideo.dataset.lastPinchDistance = distance;
    }
  }, { passive: false });
  cameraVideo.addEventListener('touchend', () => {
    delete cameraVideo.dataset.lastPinchDistance;
  });
}

initZoomControls();
initDragAndDrop();

function generateId() {
  return Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function autoResizeTextarea() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

function saveInputDraft() {
  try {
    localStorage.setItem(INPUT_STORAGE_KEY, messageInput.value);
  } catch (e) {
    console.error('Failed to save input draft:', e);
  }
}

function loadInputDraft() {
  try {
    const draft = localStorage.getItem(INPUT_STORAGE_KEY);
    if (draft) {
      messageInput.value = draft;
      autoResizeTextarea();
    }
  } catch (e) {
    console.error('Failed to load input draft:', e);
  }
}

function clearInputDraft() {
  try {
    localStorage.removeItem(INPUT_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear input draft:', e);
  }
}

messageInput.addEventListener('input', () => {
  autoResizeTextarea();
  saveInputDraft();
});

messageInput.addEventListener('paste', async (e) => {
  const items = e.clipboardData.items;
  for (let item of items) {
    if (item.kind === 'file') {
      e.preventDefault();
      if (attachedFiles.length >= MAX_FILES_PER_MESSAGE) {
        notify.show('File Limit Reached', `You can only attach up to ${MAX_FILES_PER_MESSAGE} files per message`, 'error');
        break;
      }
      const file = item.getAsFile();
      if (file) {
        const base64Data = await fileToBase64(file);
        let textContent = null;
        if (isTextFile(file)) {
          try {
            textContent = await readFileAsText(file);
          } catch (error) {
            console.error('Error reading text file:', error);
          }
        }
        attachedFiles.push({ file, base64Data, textContent });
        displayAttachedFiles();
        notify.show('File Added', `${file.name} added from clipboard`, 'success');
      }
      break;
    }
  }
});

function saveMessages() {
  try {
    if (messages.length > 0) {
      const messagesToSave = messages.map(msg => ({
        ...msg,
        files: (msg.files || []).map(fileData => {
          if (!fileData || !fileData.file) {
            console.warn('Invalid file data in message:', fileData);
            return null;
          }
          
          return {
            file: {
              name: fileData.file.name || 'unknown',
              type: fileData.file.type || 'application/octet-stream',
              size: fileData.file.size || 0
            },
            base64Data: fileData.base64Data || '',
            textContent: fileData.textContent || null
          };
        }).filter(f => f !== null)
      }));
      localStorage.setItem('chat-messages', JSON.stringify(messagesToSave));
    }
  } catch (e) {
    console.error('Failed to save messages:', e);
    try {
      const messagesWithoutFiles = messages.map(msg => ({...msg, files: []}));
      localStorage.setItem('chat-messages', JSON.stringify(messagesWithoutFiles));
      notify.show('Warning', 'Messages saved without files (storage limit)', 'info');
    } catch (e2) {
      console.error('Failed to save even without files:', e2);
    }
  }
}

function loadMessages() {
  try {
    const stored = localStorage.getItem('chat-messages');
    if (stored) {
      const parsed = JSON.parse(stored);
      messages = parsed.map(msg => {
        const restoredFiles = (msg.files || []).map(fileData => {
          if (!fileData || !fileData.file || !fileData.base64Data) {
            console.error('Invalid file data in message:', fileData);
            return null;
          }
          return {
            file: {
              name: fileData.file.name || 'unknown', 
              type: fileData.file.type || 'application/octet-stream', 
              size: fileData.file.size || 0
            },
            base64Data: fileData.base64Data,
            textContent: fileData.textContent || null
          };
        }).filter(f => f !== null);
        return {...msg, files: restoredFiles, createdAt: new Date(msg.createdAt)};
      });
      renderMessages();
    }
  } catch (e) {
    console.error('Failed to load messages:', e);
    messages = [];
  }
}

function createMessageHTML(msg) {
  const isUser = msg.role === 'user';
  const avatarContent = isUser ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` : `<div class="orb" style="width: 32px; height: 32px; background: #1a1a2e;"><div class="orb-blur-container"><div class="orb-circle orb-circle-1" style="width: 14px; height: 14px; background: #9e9fef; opacity: 0.9;"></div><div class="orb-circle orb-circle-2" style="width: 11px; height: 11px; background: #c471ec; opacity: 0.85;"></div><div class="orb-circle orb-circle-3" style="width: 16px; height: 16px; background: #9bc761; opacity: 0.9;"></div><div class="orb-circle orb-circle-4" style="width: 8px; height: 8px; background: #6366f1; opacity: 0.8;"></div><div class="orb-circle orb-circle-5" style="width: 10px; height: 10px; background: #f472b6; opacity: 0.85;"></div></div><div class="orb-highlight"></div></div>`;
  let filePreviewsHtml = '';
  if (msg.files && msg.files.length > 0) {
    msg.files.forEach(fileData => {
      if (fileData && fileData.file && fileData.base64Data) {
        filePreviewsHtml += createFilePreviewHTML(fileData.file, fileData.base64Data);
      }
    });
  }
  const contentHtml = isUser ? `<p>${escapeHtml(msg.content)}</p>` : `<div class="markdown-content">${marked.parse(msg.content)}</div>`;
  let statusHtml = '';
  if (!isUser && msg.status) {
    if (msg.status === 'generating') {
      statusHtml = '<p class="status-text"><span class="gradient_text">Please wait....</span></p>';
    } else if (msg.status === 'generated') {
      statusHtml = '<p class="status-text generated">Generated</p>';
    } else if (msg.status === 'error') {
      statusHtml = `<p class="status-text error">Failed to send</p><button class="retry-btn" data-retry-id="${msg.id}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>Retry</button>`;
    }
  }
  return `<div class="message ${msg.role}" data-id="${msg.id}"><div class="avatar ${msg.role}">${avatarContent}</div><div class="message-content"><span class="role-label">${isUser ? 'You' : 'Assistant'}</span><div class="bubble">${contentHtml}${filePreviewsHtml}</div>${statusHtml}<span class="timestamp">${formatTime(msg.createdAt)}</span></div></div>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
function renderMessages() {
  if (messages.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    const messageElements = messageList.querySelectorAll('.message');
    messageElements.forEach(el => el.remove());
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    const messageElements = messageList.querySelectorAll('.message');
    messageElements.forEach(el => el.remove());
    messages.forEach(msg => {
      messageList.insertAdjacentHTML('beforeend', createMessageHTML(msg));
      

      const messageElement = messageList.querySelector(`[data-id="${msg.id}"]`);
      if (messageElement) {
        addCopyButtonToMessage(messageElement, msg.content);
      }
    });
    
    requestAnimationFrame(() => {
      messageList.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
      enhanceCodeBlocks();
    });
    
    document.querySelectorAll('.file-download-btn').forEach(btn => {
      const filePreview = btn.closest('.file-preview');
      const msgElement = btn.closest('.message');
      if (filePreview && msgElement) {
        const msgId = msgElement.dataset.id;
        const msg = messages.find(m => m.id === msgId);
        const fileIndex = Array.from(msgElement.querySelectorAll('.file-preview')).indexOf(filePreview);
        if (msg && msg.files && msg.files[fileIndex]) {
          btn.onclick = () => {
            downloadFile(msg.files[fileIndex].file.name, msg.files[fileIndex].base64Data);
          };
        }
      }
    });
    
    document.querySelectorAll('.retry-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const retryId = e.currentTarget.dataset.retryId;
        retryMessage(retryId);
      });
    });
    
    requestAnimationFrame(() => {
      isAutoScrolling = true;
      messageList.scrollTo({ top: messageList.scrollHeight, behavior: 'smooth' });
      messageList.dataset.userScrolling = 'false';
    });
  }
}


function updateMessageContent(id, content) {
  const msgElement = messageList.querySelector(`[data-id="${id}"] .bubble .markdown-content`);
  if (!msgElement) return;
  
  const msg = messages.find(m => m.id === id);
  if (!msg) return;


  msgElement.innerHTML = marked.parse(content);
  

  requestAnimationFrame(() => {
    msgElement.querySelectorAll('pre code').forEach((block) => {
      if (!block.dataset.highlighted) {
        hljs.highlightElement(block);
        block.dataset.highlighted = 'true';
      }
    });
    enhanceCodeBlocks();
    constrainCodeBlockWidth();
  });
  

  const isNearBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 150;
  const isUserScrolling = messageList.dataset.userScrolling === 'true';
  
  if (isNearBottom && !isUserScrolling) {
    requestAnimationFrame(() => {
      messageList.scrollTop = messageList.scrollHeight;
    });
  }
}

function highlightCode(container) {
  requestAnimationFrame(() => {
    container.querySelectorAll('pre code').forEach(block => {
      if (!block.dataset.highlighted) {
        hljs.highlightElement(block);
        block.dataset.highlighted = 'true';
      }
    });
    enhanceCodeBlocks();
    constrainCodeBlockWidth();
  });
}

function buildPartialHtml(element, revealLength) {
  let charCount = 0;
  
  function processNode(node) {

    if (node.nodeName === 'PRE' || node.nodeName === 'CODE') {
      return node.cloneNode(true);
    }
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const nodeEnd = charCount + text.length;
      
      if (charCount >= revealLength) {

        charCount += text.length;
        return document.createTextNode('');
      } else if (nodeEnd <= revealLength) {

        charCount += text.length;
        return document.createTextNode(text);
      } else {

        const visibleLength = revealLength - charCount;
        const visibleText = text.substring(0, visibleLength);
        charCount += text.length;
        return document.createTextNode(visibleText);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const clone = node.cloneNode(false);
      
      for (const child of node.childNodes) {
        const processed = processNode(child);
        if (processed) {
          clone.appendChild(processed);
        }
      }
      
      return clone;
    }
    
    return node.cloneNode(true);
  }
  
  const result = processNode(element);
  return result.innerHTML || '';
}


function applyBlurToNewChars(container, fromIndex, toIndex) {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {

        let parent = node.parentElement;
        while (parent && parent !== container) {
          if (parent.tagName === 'PRE' || parent.tagName === 'CODE') {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  let currentIndex = 0;
  const textNodesToWrap = [];
  
 
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.textContent;
    const nodeStart = currentIndex;
    const nodeEnd = currentIndex + text.length;
    

    if (nodeEnd > fromIndex && nodeStart < toIndex) {
      const revealStart = Math.max(0, fromIndex - nodeStart);
      const revealEnd = Math.min(text.length, toIndex - nodeStart);
      
      if (revealEnd > revealStart) {
        textNodesToWrap.push({
          node,
          text,
          revealStart,
          revealEnd
        });
      }
    }
    
    currentIndex = nodeEnd;
  }
  

  textNodesToWrap.forEach(({ node, text, revealStart, revealEnd }) => {
    const before = text.substring(0, revealStart);
    const newChars = text.substring(revealStart, revealEnd);
    const after = text.substring(revealEnd);
    
    const fragment = document.createDocumentFragment();
    

    if (before) {
      fragment.appendChild(document.createTextNode(before));
    }
    

    if (newChars) {
      const span = document.createElement('span');
      span.textContent = newChars;
      span.className = 'typing-char';
      span.style.display = 'inline-block';
      span.style.filter = `blur(${TYPING_CONFIG.initialBlur}px)`;
      span.style.opacity = '0';
      span.style.transition = `filter ${TYPING_CONFIG.blurDuration}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${TYPING_CONFIG.blurDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      span.style.transform = 'translateZ(0)';
      span.style.willChange = 'filter, opacity';
      fragment.appendChild(span);
      

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          span.style.filter = 'blur(0px)';
          span.style.opacity = '1';
        });
      });
    }
    

    if (after) {
      fragment.appendChild(document.createTextNode(after));
    }
    

    node.parentNode.replaceChild(fragment, node);
  });
}


function highlightCodeBlocks(container) {
  requestAnimationFrame(() => {
    container.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
    enhanceCodeBlocks();
  });
}


function cleanupMessageRenderState(id) {
  const state = messageRenderState.get(id);
  if (state && state.animationFrame) {
    cancelAnimationFrame(state.animationFrame);
  }
  messageRenderState.delete(id);
}

function extractTypableSegments(element) {
  const segments = [];
  let totalLength = 0;
  
  function traverse(node, inCodeBlock = false) {

    if (node.nodeName === 'PRE' || node.nodeName === 'CODE') {
      segments.push({
        type: 'skip',
        node: node.cloneNode(true),
        start: totalLength,
        end: totalLength
      });
      return;
    }
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text.length > 0 && !inCodeBlock) {
        segments.push({
          type: 'text',
          content: text,
          start: totalLength,
          end: totalLength + text.length,
          parentNode: node.parentNode
        });
        totalLength += text.length;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (const child of node.childNodes) {
        traverse(child, inCodeBlock);
      }
    }
  }
  
  traverse(element);
  
  return { segments, totalLength };
}


function buildVisibleHtml(element, textSegments, revealUpTo) {
  function processNode(node) {
    if (node.nodeName === 'PRE' || node.nodeName === 'CODE') {
      return node;
    }
    
    if (node.nodeType === Node.TEXT_NODE) {
      const segment = textSegments.segments.find(s => 
        s.type === 'text' && s.content === node.textContent
      );
      
      if (segment) {
        if (revealUpTo >= segment.end) {

          return node;
        } else if (revealUpTo > segment.start) {

          const visibleLength = revealUpTo - segment.start;
          const visibleText = segment.content.substring(0, visibleLength);
          return document.createTextNode(visibleText);
        } else {

          return document.createTextNode('');
        }
      }
      
      return node;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const clone = node.cloneNode(false);
      for (const child of node.childNodes) {
        clone.appendChild(processNode(child));
      }
      return clone;
    }
    
    return node;
  }
  
  const processed = processNode(element);
  return processed.innerHTML;
}


function applyBlurEffect(container, fromIndex, toIndex) {

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {

        let parent = node.parentElement;
        while (parent) {
          if (parent.tagName === 'PRE' || parent.tagName === 'CODE') {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  let currentIndex = 0;
  const nodesToProcess = [];
  
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.textContent;
    const nodeStart = currentIndex;
    const nodeEnd = currentIndex + text.length;
    

    if (nodeEnd > fromIndex && nodeStart < toIndex) {
      const revealStart = Math.max(0, fromIndex - nodeStart);
      const revealEnd = Math.min(text.length, toIndex - nodeStart);
      
      nodesToProcess.push({
        node,
        text,
        revealStart,
        revealEnd,
        nodeStart
      });
    }
    
    currentIndex = nodeEnd;
  }
  

  nodesToProcess.forEach(({ node, text, revealStart, revealEnd }) => {
    if (revealStart >= revealEnd) return;
    
    const before = text.substring(0, revealStart);
    const revealed = text.substring(revealStart, revealEnd);
    const after = text.substring(revealEnd);
    
    const wrapper = document.createElement('span');
    wrapper.style.display = 'inline';
    
    if (before) wrapper.appendChild(document.createTextNode(before));
    

    const blurSpan = document.createElement('span');
    blurSpan.textContent = revealed;
    blurSpan.style.display = 'inline-block';
    blurSpan.style.filter = `blur(${TYPING_CONFIG.initialBlur}px)`;
    blurSpan.style.opacity = '0';
    blurSpan.style.transition = `filter ${TYPING_CONFIG.blurDuration}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${TYPING_CONFIG.blurDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
    blurSpan.style.transform = 'translateZ(0)';
    blurSpan.style.willChange = 'filter, opacity';
    wrapper.appendChild(blurSpan);
    
    if (after) wrapper.appendChild(document.createTextNode(after));
    

    node.parentNode.replaceChild(wrapper, node);
    

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        blurSpan.style.filter = 'blur(0px)';
        blurSpan.style.opacity = '1';
      });
    });
  });
}




function updateMessageStatus(id, status) {
  const msgIndex = messages.findIndex(m => m.id === id);
  if (msgIndex !== -1) {
    messages[msgIndex].status = status;
    const msgElement = messageList.querySelector(`[data-id="${id}"]`);
    if (msgElement) {
      const messageContent = msgElement.querySelector('.message-content');
      const existingStatus = messageContent.querySelector('.status-text');
      const existingRetry = messageContent.querySelector('.retry-btn');
      if (existingStatus) existingStatus.remove();
      if (existingRetry) existingRetry.remove();
      if (status) {
        const timestamp = messageContent.querySelector('.timestamp');
        let statusHtml = '';
        if (status === 'generating') {
          statusHtml = '<p class="status-text"><span class="gradient_text">Generating...</span></p>';
        } else if (status === 'generated') {
          statusHtml = '<p class="status-text generated">Generated</p>';
        } else if (status === 'error') {
          statusHtml = `<p class="status-text error">Failed to send</p><button class="retry-btn" data-retry-id="${id}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>Retry</button>`;
        }
        timestamp.insertAdjacentHTML('beforebegin', statusHtml);
        const retryBtn = messageContent.querySelector('.retry-btn');
        if (retryBtn) {
          retryBtn.addEventListener('click', (e) => {
            const retryId = e.currentTarget.dataset.retryId;
            retryMessage(retryId);
          });
        }
      }
    }
  }
}

async function retryMessage(messageId) {
  const msgIndex = messages.findIndex(m => m.id === messageId);
  if (msgIndex === -1) return;
  
  let totalTokens = calculateTotalTokens();
  const effectiveMaxTokens = MAX_TOKENS * 0.75;
  let messagesRemoved = 0;
  
  while (totalTokens > effectiveMaxTokens && messages.length > 6) {
    const oldestMessage = messages[0];
    
    let messageTokens = estimateTokens(oldestMessage.content);
    if (oldestMessage.files) {
      oldestMessage.files.forEach(fileData => {
        if (fileData.textContent) {
          messageTokens += estimateTokens(fileData.textContent);
        }
        if (isImageFile(fileData.file, fileData.base64Data)) {
          messageTokens += 85;
        }
      });
    }
    
    messages.shift();
    messagesRemoved++;
    totalTokens = calculateTotalTokens();
  }
  
  if (messagesRemoved > 0) {
    notify.show(
      'Memory Management',
      `Removed ${messagesRemoved} old message(s) before retry. Tokens: ${totalTokens.toLocaleString()}`,
      'info',
      3000
    );
    saveMessages();
  }
  
  const failedMessage = messages[msgIndex];
  messages[msgIndex].status = 'generating';
  messages[msgIndex].content = '';
  renderMessages();
  await performSendMessage(failedMessage.id);
}


async function performSendMessage(assistantId) {
  try {

    let totalTokens = calculateTotalTokens();
    const hardLimit = 150000; // Hard limit at 150k tokens
    
    if (totalTokens > hardLimit) {
      const targetMessagesToKeep = Math.max(6, Math.floor(messages.length * 0.5));
      const toRemove = messages.length - targetMessagesToKeep;
      
      if (toRemove > 0) {
        for (let i = 0; i < toRemove; i++) {
          messages.shift();
        }
        
        notify.show(
          'Memory Management',
          `Removed ${toRemove} old messages (conversation was too long). Keeping last ${targetMessagesToKeep} messages.`,
          'info',
          4000
        );
        
        saveMessages();
        renderMessages();
        totalTokens = calculateTotalTokens();
        console.log(`After cleanup: ${totalTokens} tokens, ${messages.length} messages`);
      }
    }
    
    const apiMessages = messages.filter(m => m.status !== 'generating' && m.status !== 'error').map(m => {
      if (m.files && m.files.length > 0 && m.files.some(f => isImageFile(f.file, f.base64Data))) {
        const contentArray = [];
        if (m.content) {
          contentArray.push({type: 'text', text: m.content});
        }
        m.files.forEach(fileData => {
          if (isImageFile(fileData.file, fileData.base64Data)) {
            contentArray.push({type: 'image_url', image_url: {url: fileData.base64Data}});
          } else {
            const attachmentText = createFileAttachmentText(fileData.file, fileData.textContent);
            if (attachmentText) {
              contentArray.push({type: 'text', text: attachmentText});
            }
          }
        });
        return {role: m.role, content: contentArray};
      } else {
        let content = m.content;
        if (m.files && m.files.length > 0) {
          m.files.forEach(fileData => {
            const attachmentText = createFileAttachmentText(fileData.file, fileData.textContent);
            if (attachmentText) {
              content += attachmentText;
            }
          });
        }
        return {role: m.role, content};
      }
    });

    const languageInstruction = getLanguageInstruction();
    apiMessages.unshift({role: 'user', content: languageInstruction});

    const response = await fetch('https://diwness.cloud/v1/chat/completions', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        model: modelSelectAPI.getValue(), 
        messages: apiMessages, 
        stream: true, 
        max_tokens: 64000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      

      if (errorText.includes('too long') || errorText.includes('token') || response.status === 500) {
        console.log('API says too long, removing 75% of messages...');
        
        const keepCount = Math.max(4, Math.floor(messages.length * 0.25));
        const removeCount = messages.length - keepCount;
        
        if (removeCount > 0) {
          for (let i = 0; i < removeCount; i++) {
            messages.shift();
          }
          
          notify.show(
            'Memory Management',
            `Removed ${removeCount} messages. Retrying...`,
            'info',
            4000
          );
          
          saveMessages();
          renderMessages();
          

          return await performSendMessage(assistantId);
        } else {

          while (messages.length > 4) {
            messages.shift();
          }
          notify.show('Memory Management', 'Clearing old memory', 'info', 3000);
          saveMessages();
          renderMessages();
          return await performSendMessage(assistantId);
        }
      }
      
      throw new Error(`API error (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let sseBuffer = '';
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      sseBuffer += decoder.decode(value, { stream: true });
      
      const sseLines = sseBuffer.split('\n');
      sseBuffer = sseLines.pop() || '';
      
      for (const line of sseLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
        
        const data = trimmedLine.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content;
          
          if (delta) {
            fullContent += delta;
            
            const idx = messages.findIndex(m => m.id === assistantId);
            if (idx !== -1) {
              messages[idx].content = fullContent;
            }
            
            updateMessageContent(assistantId, fullContent);
          }
        } catch (e) {
          sseBuffer = trimmedLine + '\n' + sseBuffer;
        }
      }
    }

    cleanupRenderState(assistantId);
    updateMessageStatus(assistantId, 'generated');
    
    const messageElement = messageList.querySelector(`[data-id="${assistantId}"]`);
    if (messageElement) {
      addCopyButtonToMessage(messageElement, fullContent);
    }
    
    saveMessages();
    
  } catch (e) {
    console.error('Send message error:', e);
    cleanupRenderState(assistantId);
    
    const msgIndex = messages.findIndex(m => m.id === assistantId);
    if (msgIndex !== -1) {
      if (!messages[msgIndex].content) {
        messages[msgIndex].content = 'Failed to get response from the server.';
      }
      messages[msgIndex].status = 'error';
    }
    
    renderMessages();
    saveMessages();
  }
}


fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;
  if (attachedFiles.length + files.length > MAX_FILES_PER_MESSAGE) {
    notify.show('File Limit Exceeded', `You can only attach up to ${MAX_FILES_PER_MESSAGE} files per message. Currently attached: ${attachedFiles.length}`, 'error');
    fileInput.value = '';
    return;
  }
  const maxTotalSize = 50 * 1024 * 1024;
  let totalSize = 0;
  for (const file of files) {
    totalSize += file.size;
  }
  if (totalSize > maxTotalSize) {
    notify.show('File Size Limit', 'Total file size exceeds 50MB limit', 'error');
    fileInput.value = '';
    return;
  }
  for (const file of files) {
    try {
      const base64Data = await fileToBase64(file);
      let textContent = null;
      if (isTextFile(file)) {
        try {
          textContent = await readFileAsText(file);
        } catch (error) {
          console.error('Error reading text file:', error);
        }
      }
      attachedFiles.push({ file, base64Data, textContent });
    } catch (error) {
      console.error('Error reading file:', error);
      notify.show('File Error', `Failed to read ${file.name}`, 'error');
    }
  }
  displayAttachedFiles();
  fileInput.value = '';
  if (files.length > 1) {
    notify.show('Files Added', `${files.length} files attached`, 'success');
  }
});

cameraBtn.addEventListener('click', async () => {
  try {
    const constraints = {
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        zoom: true
      },
      audio: false
    };
    
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    cameraVideo.srcObject = cameraStream;
    
    await new Promise((resolve) => {
      cameraVideo.onloadedmetadata = () => {
        cameraVideo.play().catch(e => console.error("Play failed", e));
        
        const track = cameraStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        if (capabilities.zoom) {
          minZoom = capabilities.zoom.min || 1;
          maxZoom = capabilities.zoom.max || 3;
          currentZoom = capabilities.zoom.min || 1;
        } else {
          minZoom = 1;
          maxZoom = 5;
          currentZoom = 1;
        }
        
        const percent = ((currentZoom - minZoom) / (Math.max(1, maxZoom - minZoom))) * 100;
        zoomTrack.style.width = percent + '%';
        zoomThumb.style.left = percent + '%';
        zoomLabel.textContent = currentZoom.toFixed(1) + 'x';
        resolve();
      };
    });
    
    cameraModal.classList.add('active');
    cameraBtn.classList.add('active');
  } catch (error) {
    console.error('Camera access error:', error);
    notify.show('Camera Error', 'Could not access camera', 'error');
  }
});
switchCameraBtn.addEventListener('click', async () => {

  currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
  

  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
  }

  try {
    const constraints = {
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        zoom: true
      },
      audio: false
    };
    
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    cameraVideo.srcObject = cameraStream;
    
    await cameraVideo.play();
    
    notify.show('Camera Switched', `Now using ${currentFacingMode === 'user' ? 'front' : 'back'} camera`, 'success');
  } catch (error) {
    console.error('Camera switch error:', error);
    notify.show('Switch Failed', 'Could not switch camera', 'error');
  }
});
closeCameraBtn.addEventListener('click', () => {
  stopCamera();
});

captureBtn.addEventListener('click', () => {
  if (attachedFiles.length >= MAX_FILES_PER_MESSAGE) {
    notify.show('File Limit Reached', `You can only attach up to ${MAX_FILES_PER_MESSAGE} files per message`, 'error');
    return;
  }
  const canvas = document.createElement('canvas');
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(cameraVideo, 0, 0);
  canvas.toBlob(async (blob) => {
    const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
    const base64Data = await fileToBase64(file);
    attachedFiles.push({ file, base64Data, textContent: null });
    displayAttachedFiles();
    stopCamera();
    notify.show('Photo Captured', 'Image added from camera', 'success');
  }, 'image/jpeg', 0.95);
});

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
    cameraVideo.srcObject = null;
  }
  cameraModal.classList.remove('active');
  cameraBtn.classList.remove('active');
  currentZoom = 1;
}

function getLanguageInstruction() {
  const langCode = languageSelectAPI.getCode();
  const instructions = {
    'en': 'Please respond in English.', 
    'ru': 'Пожалуйста, отвечай на русском языке.', 
    'es': 'Por favor, responde en español.', 
    'fr': 'Veuillez répondre en français.', 
    'de': 'Bitte antworte auf Deutsch.', 
    'it': 'Si prega di rispondere in italiano.', 
    'pt': 'Por favor, responda em português.', 
    'ja': '日本語で返信してください。', 
    'ko': '한국어로 응답해 주세요。', 
    'zh': '请用中文回复。', 
    'ar': 'يرجى الرد باللغة العربية.', 
    'hi': 'कृपया हिंदी में जवाब दें।', 
    'tr': 'Lütfen Türkçe cevap verin.', 
    'pl': 'Proszę odpowiadać po polsku.', 
    'uk': 'Будь ласка, відповідайте українською.'
  };
  return instructions[langCode] || instructions['en'];
}

function positionDropdown(selectElement) {
  const dropdown = selectElement.querySelector('.custom-select-dropdown');
  const trigger = selectElement.querySelector('.custom-select-trigger');
  dropdown.classList.remove('flipped');
  const triggerRect = trigger.getBoundingClientRect();
  const spaceAbove = triggerRect.top;
  const spaceBelow = window.innerHeight - triggerRect.bottom;
  const dropdownHeight = Math.min(dropdown.scrollHeight, window.innerHeight * 0.5);
  const shouldFlip = spaceAbove < dropdownHeight + 50 && spaceBelow > spaceAbove;
  if (shouldFlip) {
    dropdown.classList.add('flipped');
  }
  dropdown.style.transform = shouldFlip ? 'translateY(10px)' : 'translateY(-10px)';
}

function cancelGeneration() {
  if (!pendingCancellation || !isSending) return;
  
  messages.splice(messages.length - 2, 2);
  messageInput.value = pendingCancellation.savedInput;
  
  attachedFiles = pendingCancellation.savedFiles.map(fileData => ({
    file: fileData.file,
    base64Data: fileData.base64Data,
    textContent: fileData.textContent || null
  }));
  
  autoResizeTextarea();
  displayAttachedFiles();
  saveInputDraft();
  renderMessages();
  saveMessages();
  
  isSending = false;
  sendBtn.disabled = false;
  disableCancelMode();
  
  notify.show('Cancelled', 'Message restored', 'info');
  messageInput.focus();
}

function enableCancelMode() {
  sendBtn.classList.add('cancel-mode');
  sendBtn.title = 'Cancel generation';
  sendBtn.disabled = false;
  
  const userMessage = messages[messages.length - 2];
  
  pendingCancellation = {
    userMessage: userMessage,
    assistantMessage: messages[messages.length - 1],
    savedFiles: userMessage.files || [],
    savedInput: userMessage.content
  };
}

async function sendMessage() {
  const content = messageInput.value.trim();
  
  if (pendingCancellation && isSending) {
    cancelGeneration();
    return;
  }
  
  if ((!content && attachedFiles.length === 0) || isSending) return;
  
  isSending = true;
  sendBtn.disabled = false;
  
  const userMessage = {
    id: generateId(), 
    role: 'user', 
    content: content || '', 
    files: attachedFiles.map(f => ({
      file: f.file,
      base64Data: f.base64Data,
      textContent: f.textContent || null
    })), 
    createdAt: new Date()
  };
  
  messages.push(userMessage);
  
  messageInput.value = '';
  messageInput.style.height = 'auto';
  clearInputDraft();
  
  attachedFiles = [];
  attachedFileContainer.innerHTML = '';
  fileInput.value = '';
  
  renderMessages();
  saveMessages();
  
  const assistantId = generateId();
  const assistantMessage = {
    id: assistantId, 
    role: 'assistant', 
    content: '', 
    status: 'generating', 
    createdAt: new Date()
  };
  
  messages.push(assistantMessage);
  renderMessages();
  
  enableCancelMode();
  
  await performSendMessage(assistantId);
  
  isSending = false;
  sendBtn.disabled = false;
  disableCancelMode();
  messageInput.focus();
}

function disableCancelMode() {
  sendBtn.classList.remove('cancel-mode');
  sendBtn.title = 'Send message';
  pendingCancellation = null;
}
function addCopyButtonToMessage(messageElement, content) {
  const messageContent = messageElement.querySelector('.message-content');
  if (!messageContent || messageContent.querySelector('.copy-message-btn')) return; // Already has copy button
  
  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-message-btn';
  copyBtn.setAttribute('aria-label', 'Copy message');
  copyBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
    Copy
  `;
  
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(content);
      copyBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copied!
      `;
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        `;
      }, 2000);
      notify.show('Copied', 'Message copied to clipboard', 'success');
    } catch (err) {
      console.error('Copy failed:', err);
      notify.show('Error', 'Failed to copy message', 'error');
    }
  });
  

  messageContent.appendChild(copyBtn);
}



const confirmBar = document.getElementById('confirmBar');
const cancelClearBtn = document.getElementById('cancelClearBtn');
const executeClearBtn = document.getElementById('executeClearBtn');

function clearChat() {
  confirmBar.classList.add('active');
}

cancelClearBtn.onclick = () => {
  confirmBar.classList.remove('active');
};

executeClearBtn.onclick = () => {
  messages = [];
  localStorage.removeItem('chat-messages');
  renderMessages();
  confirmBar.classList.remove('active');
  notify.show('System', 'History cleared', 'info');
};


const notify = {
  show(title, message, type = 'info', duration = 4000) {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    const icons = {
      success: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`, 
      error: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`, 
      info: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`
    };
    notification.innerHTML = `<div class="notification-icon">${icons[type]}</div><div class="notification-content"><div class="notification-title">${title}</div><div class="notification-message">${message}</div></div><div class="notification-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div><div class="notification-progress"><div class="notification-progress-bar" style="animation: shrink ${duration}ms linear forwards"></div></div>`;
    container.appendChild(notification);
    notification.querySelector('.notification-close').onclick = () => this.close(notification);
    setTimeout(() => this.close(notification), duration);
  },
  close(el) {
    if (el.classList.contains('closing')) return;
    el.classList.add('closing');
    el.addEventListener('animationend', () => el.remove());
  }
};

const style = document.createElement('style');
style.innerHTML = `
@keyframes shrink { 
  from { transform: scaleX(1); } 
  to { transform: scaleX(0); } 
} 

body.drag-over::after { 
  content: ''; 
  position: fixed; 
  top: 0; 
  left: 0; 
  right: 0; 
  bottom: 0; 
  background: rgba(99, 102, 241, 0.1); 
  border: 3px dashed rgba(99, 102, 241, 0.5); 
  z-index: 9999; 
  pointer-events: none; 
} 

.send-btn.cancel-mode { 
  background: rgba(239, 68, 68, 0.2) !important; 
  border: 2px solid #ef4444 !important; 
  cursor: pointer !important; 
  opacity: 1 !important; 
} 

.send-btn.cancel-mode:hover { 
  background: rgba(239, 68, 68, 0.3) !important; 
  transform: scale(1.05); 
} 

.send-btn.cancel-mode .orb { 
  animation: pulse-red 1.5s ease-in-out infinite; 
} 

@keyframes pulse-red { 
  0%, 100% { 
    opacity: 1; 
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); 
  } 
  50% { 
    opacity: 0.9; 
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); 
  } 
}

.code-block-container {
  width: 100%;
  max-width: 100%;
}

.code-block-content {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

.code-block-content pre {
  margin: 0;
  width: fit-content;
  min-width: 150%;
  max-width: max-content;
}

.code-block-content pre code {
  display: block;
  white-space: pre;
  word-wrap: normal;
  overflow-wrap: normal;
}
`;
document.head.appendChild(style);

function initSpeechRecognition() {
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionAPI) {
    console.error('Speech recognition not supported');
    voiceBtn.disabled = true;
    voiceBtn.title = 'Speech recognition not supported in this browser';
    return false;
  }
  
  recognition = new SpeechRecognitionAPI();
  recognition.continuous = true; // Keep listening
  recognition.interimResults = true;
  recognition.maxAlternatives = 3; // Get multiple interpretations
  recognition.lang = languageSelectAPI.getValue();
  
  let baseText = '';
  
  recognition.onstart = () => {
    console.log('Speech recognition started');
    isRecording = true;
    baseText = messageInput.value;
    voiceBtn.classList.add('recording');
    voiceStatus.classList.add('active');
  };
  
  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = 0; i < event.results.length; i++) {
      if (!event.results[i] || !event.results[i][0]) continue;
      
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }
    
    const fullText = baseText + (baseText ? ' ' : '') + finalTranscript + interimTranscript;
    messageInput.value = fullText.trim();
    autoResizeTextarea();
    
    if (finalTranscript) {
      saveInputDraft();
    }
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    

    if (event.error === 'no-speech' || event.error === 'aborted') {
      return;
    }
    
    isRecording = false;
    voiceBtn.classList.remove('recording');
    voiceStatus.classList.remove('active');
    baseText = '';
    
    if (event.error === 'not-allowed') {
      notify.show('Microphone Denied', 'Please allow microphone access', 'error');
    } else if (event.error === 'network') {
      notify.show('Network Error', 'Check your internet connection', 'error');
    }
  };
  
  recognition.onend = () => {
    console.log('Speech recognition ended');
    
    if (isRecording && voiceBtn.classList.contains('recording')) {
      try {
        recognition.start();
      } catch (e) {
        console.log('Could not restart recognition:', e);
      }
    } else {
      isRecording = false;
      voiceBtn.classList.remove('recording');
      voiceStatus.classList.remove('active');
      baseText = '';
    }
  };
  
  return true;
}

async function toggleVoiceInput() {
  if (!recognition) {
    if (!initSpeechRecognition()) {
      notify.show('Unsupported', 'Speech recognition is not supported in your browser.\n\nPlease try using Chrome, Edge, or Safari.', 'error');
      return;
    }
  }
  if (isRecording) {
    console.log('Stopping voice recognition');
    recognition.stop();
    return;
  }
  try {
    console.log('Starting voice recognition');
    recognition.lang = languageSelectAPI.getValue();
    recognition.start();
  } catch (error) {
    console.error('Failed to start recognition:', error);
  }
}

sendBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  sendMessage();
});
messageList.addEventListener('scroll', () => {
  if (isAutoScrolling) {
    isAutoScrolling = false;
    return;
  }
  
  messageList.dataset.userScrolling = 'true';
  
  clearTimeout(scrollTimeout);
  

  scrollTimeout = setTimeout(() => {
    const isNearBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 150;
    if (isNearBottom) {
      messageList.dataset.userScrolling = 'false';
    }
  }, 1000);
}, { passive: true });


messageList.addEventListener('wheel', (e) => {
  const isAtBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 10;
  if (isAtBottom && e.deltaY > 0) {

    messageList.dataset.userScrolling = 'false';
  }
}, { passive: true });
resetBtn.addEventListener('click', clearChat);
voiceBtn.addEventListener('click', toggleVoiceInput);
attachBtn.addEventListener('click', () => fileInput.click());

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
window.addEventListener('resize', () => {
  document.querySelectorAll('.custom-select.open').forEach(selectElement => {
    positionDropdown(selectElement);
  });
  constrainCodeBlockWidth();
});
loadMessages();
loadInputDraft();
initSpeechRecognition();

setTimeout(() => {
  messageInput.focus();
}, 2000);
