import React, { useState } from 'react';
import { Copy, ExternalLink, FileText, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Message } from '../types';

interface MessageCardProps {
  message: Message;
}

const STANDARD_CONFIG_REGEX = /(vless|vmess|trojan|ss|ssr|tuic|hy2|wireguard):\/\/[^\s]+/gi;
const SLIPNET_CONFIG_REGEX = /(slipnet-enc|slipnet):\/\/[^\s]+/gi;

export const MessageCard: React.FC<MessageCardProps> = ({ message }) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedStandard, setCopiedStandard] = useState(false);
  const [copiedSlipnet, setCopiedSlipnet] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const standardConfigs = message.text.match(STANDARD_CONFIG_REGEX) || [];
  const slipnetConfigs = message.text.match(SLIPNET_CONFIG_REGEX) || [];

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyStandard = () => {
    if (standardConfigs.length > 0) {
      navigator.clipboard.writeText(standardConfigs.join('\n'));
      setCopiedStandard(true);
      setTimeout(() => setCopiedStandard(false), 2000);
    }
  };

  const handleCopySlipnet = () => {
    if (slipnetConfigs.length > 0) {
      navigator.clipboard.writeText(slipnetConfigs.join('\n'));
      setCopiedSlipnet(true);
      setTimeout(() => setCopiedSlipnet(false), 2000);
    }
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % message.images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + message.images.length) % message.images.length);

  const renderTextWithHighlights = (text: string) => {
    const parts = text.split(/(https?:\/\/[^\s]+|(?:vless|vmess|trojan|ss|ssr|tuic|hy2|wireguard|slipnet-enc|slipnet):\/\/[^\s]+|@[a-zA-Z0-9_]+|#[^\s]+)/gi);
    
    return parts.map((part, i) => {
      if (!part) return null;

      if (part.match(/^https?:\/\//i)) {
        return (
          <bdi key={i} dir="ltr">
            <a href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 hover:underline break-all">
              {part}
            </a>
          </bdi>
        );
      }
      if (part.match(/^(vless|vmess|trojan|ss|ssr|tuic|hy2|wireguard):\/\//i)) {
        return (
          <bdi key={i} dir="ltr">
            <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-1 py-0.5 rounded text-xs font-mono break-all inline-block my-0.5">
              {part}
            </span>
          </bdi>
        );
      }
      if (part.match(/^(slipnet-enc|slipnet):\/\//i)) {
        return (
          <bdi key={i} dir="ltr">
            <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-1 py-0.5 rounded text-xs font-mono break-all inline-block my-0.5">
              {part}
            </span>
          </bdi>
        );
      }
      if (part.match(/^@[a-zA-Z0-9_]+/)) {
        return (
          <bdi key={i} dir="ltr" className="text-blue-500">
            {part}
          </bdi>
        );
      }
      if (part.match(/^#/)) {
        return (
          <bdi key={i} dir="auto" className="text-blue-500">
            {part}
          </bdi>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-500/20">
              @{message.channel}
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              {new Date(message.timestamp).toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="flex gap-1.5">
            <a
              href={message.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
              title="Open in Telegram"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {message.text && (
          <div className="prose prose-sm dark:prose-invert max-w-none mb-5 whitespace-pre-wrap font-sans text-sm text-zinc-700 dark:text-zinc-300 break-words flex-1 leading-relaxed" dir="auto">
            {renderTextWithHighlights(message.text)}
          </div>
        )}

        {message.images && message.images.length > 0 && (
          <div className="relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 mb-5 group flex justify-center items-center h-64 sm:h-80">
            <img
              src={message.images[currentImageIndex]}
              alt={`Attachment ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              loading="lazy"
            />
            {message.images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.preventDefault(); prevImage(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  dir="ltr"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); nextImage(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  dir="ltr"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 px-2 py-1 rounded-full" dir="ltr">
                  {message.images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        idx === currentImageIndex ? 'bg-white' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {message.files && message.files.length > 0 && (
          <div className="space-y-2 mb-5">
            {message.files.map((file, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="p-2 bg-white dark:bg-zinc-700 rounded-lg shadow-sm">
                  <FileText size={18} className="text-blue-500 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate" dir="auto">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {file.size}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-2">
        <button
          onClick={handleCopyText}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors"
        >
          {copiedText ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          {copiedText ? 'کپی شد' : 'کپی متن'}
        </button>
        
        {standardConfigs.length > 0 && (
          <button
            onClick={handleCopyStandard}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-lg border border-blue-200 dark:border-blue-500/20 transition-colors"
          >
            {copiedStandard ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copiedStandard ? 'کپی شد' : `کپی کانفیگ (${standardConfigs.length})`}
          </button>
        )}

        {slipnetConfigs.length > 0 && (
          <button
            onClick={handleCopySlipnet}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-sm font-medium rounded-lg border border-purple-200 dark:border-purple-500/20 transition-colors"
          >
            {copiedSlipnet ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copiedSlipnet ? 'کپی شد' : `کپی اسلیپ‌نت (${slipnetConfigs.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
