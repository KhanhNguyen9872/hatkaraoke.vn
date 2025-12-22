export interface Song {
  id: string; // YouTube Video ID
  title: string;
  channel: string;
  thumbnail: string;
  addedBy: 'Host' | 'Remote User';
  isPriority: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

export enum AppMode {
  HOST = 'HOST',
  REMOTE = 'REMOTE', // Simulation of the mobile view
}