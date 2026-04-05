/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { MessageCard } from './components/MessageCard';
import { Search, Filter, RefreshCw, Copy, Check } from 'lucide-react';
import { Message } from './types';
import { copyToClipboard } from './utils';

const STANDARD_CONFIG_REGEX = /(vless|vmess|trojan|ss|ssr|tuic|hy2|wireguard):\/\/[^\s]+/gi;
const SLIPNET_CONFIG_REGEX = /(slipnet-enc|slipnet):\/\/[^\s]+/gi;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [channels, setChannels] = useState<string[]>([]);
  const [copiedAllStandard, setCopiedAllStandard] = useState(false);
  const [copiedAllSlipnet, setCopiedAllSlipnet] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = messages;

    if (selectedChannel) {
      result = result.filter(msg => msg.channel === selectedChannel);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(msg => 
        msg.text.toLowerCase().includes(term) || 
        msg.channel.toLowerCase().includes(term)
      );
    }

    setFilteredMessages(result);
  }, [messages, selectedChannel, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Add a timestamp query parameter to bypass browser caching
      const response = await fetch(`${import.meta.env.BASE_URL}data.json?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data: Message[] = await response.json();
      
      // Sort by date descending
      data.sort((a, b) => b.timestamp - a.timestamp);
      
      setMessages(data);
      setFilteredMessages(data);
      
      // Extract unique channels
      const uniqueChannels = Array.from(new Set(data.map(msg => msg.channel)));
      setChannels(uniqueChannels);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAllStandardConfigs = async () => {
    let allConfigs: string[] = [];
    filteredMessages.forEach(msg => {
      const configs = msg.text.match(STANDARD_CONFIG_REGEX);
      if (configs) {
        allConfigs = [...allConfigs, ...configs];
      }
    });

    if (allConfigs.length > 0) {
      const success = await copyToClipboard(allConfigs.join('\n'));
      if (success) {
        setCopiedAllStandard(true);
        setTimeout(() => setCopiedAllStandard(false), 2000);
      }
    }
  };

  const handleCopyAllSlipnetConfigs = async () => {
    let allConfigs: string[] = [];
    filteredMessages.forEach(msg => {
      const configs = msg.text.match(SLIPNET_CONFIG_REGEX);
      if (configs) {
        allConfigs = [...allConfigs, ...configs];
      }
    });

    if (allConfigs.length > 0) {
      const success = await copyToClipboard(allConfigs.join('\n'));
      if (success) {
        setCopiedAllSlipnet(true);
        setTimeout(() => setCopiedAllSlipnet(false), 2000);
      }
    }
  };

  const totalStandardConfigs = filteredMessages.reduce((acc, msg) => {
    const configs = msg.text.match(STANDARD_CONFIG_REGEX);
    return acc + (configs ? configs.length : 0);
  }, 0);

  const totalSlipnetConfigs = filteredMessages.reduce((acc, msg) => {
    const configs = msg.text.match(SLIPNET_CONFIG_REGEX);
    return acc + (configs ? configs.length : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans" dir="rtl">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
                <Filter size={20} />
              </div>
              <h1 className="text-xl font-bold tracking-tight" dir="ltr">Telegram Magazine</h1>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
              <div className="relative group w-full sm:w-auto">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="جستجو در پیام‌ها..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pr-10 pl-4 py-2.5 bg-zinc-100 dark:bg-zinc-800/50 border border-transparent focus:border-blue-500/30 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                />
              </div>
              
              <select
                value={selectedChannel || ''}
                onChange={(e) => setSelectedChannel(e.target.value || null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800/50 border border-transparent focus:border-blue-500/30 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none cursor-pointer text-sm"
                dir="ltr"
              >
                <option value="">همه کانال‌ها</option>
                {channels.map(channel => (
                  <option key={channel} value={channel}>@{channel}</option>
                ))}
              </select>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyAllStandardConfigs}
                  disabled={totalStandardConfigs === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:dark:bg-zinc-800 disabled:text-zinc-500 text-white text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-sm"
                >
                  {copiedAllStandard ? <Check size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Copy size={16} className="sm:w-[18px] sm:h-[18px]" />}
                  <span className="hidden sm:inline">{copiedAllStandard ? 'کپی شد' : `کپی همه کانفیگ‌ها (${totalStandardConfigs})`}</span>
                  <span className="sm:hidden">{copiedAllStandard ? 'کپی شد' : `کانفیگ (${totalStandardConfigs})`}</span>
                </button>

                <button
                  onClick={handleCopyAllSlipnetConfigs}
                  disabled={totalSlipnetConfigs === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-300 disabled:dark:bg-zinc-800 disabled:text-zinc-500 text-white text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-sm"
                >
                  {copiedAllSlipnet ? <Check size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Copy size={16} className="sm:w-[18px] sm:h-[18px]" />}
                  <span className="hidden sm:inline">{copiedAllSlipnet ? 'کپی شد' : `کپی همه اسلیپ‌نت‌ها (${totalSlipnetConfigs})`}</span>
                  <span className="sm:hidden">{copiedAllSlipnet ? 'کپی شد' : `اسلیپ‌نت (${totalSlipnetConfigs})`}</span>
                </button>

                <button
                  onClick={fetchData}
                  className="p-2 sm:p-2.5 text-zinc-500 bg-zinc-100 dark:bg-zinc-800/50 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors flex-shrink-0"
                  title="بروزرسانی"
                >
                  <RefreshCw size={18} className={`sm:w-[20px] sm:h-[20px] ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-zinc-500 font-medium">
              نمایش {filteredMessages.length} پیام
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMessages.map((msg) => (
                <MessageCard key={msg.id} message={msg} />
              ))}
            </div>

            {filteredMessages.length === 0 && (
              <div className="text-center py-20 text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                <p className="text-lg font-medium">هیچ پیامی یافت نشد.</p>
                <p className="text-sm mt-2">لطفاً فیلترها یا عبارت جستجو را تغییر دهید.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

