export const copyToClipboard = async (text: string): Promise<boolean> => {
  // Try modern Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, falling back...', err);
    }
  }
  
  // Fallback for older browsers and in-app webviews (like Telegram internal browser)
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Prevent scrolling and layout shifts
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard failed', err);
    return false;
  }
};
