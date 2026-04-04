export interface Message {
  id: string;
  channel: string;
  text: string;
  html: string;
  date: string;
  images: string[];
  files: { name: string; size: string; localPath?: string }[];
  link: string;
  timestamp: number;
}
