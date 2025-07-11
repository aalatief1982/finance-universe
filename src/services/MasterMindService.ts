// MasterMindService.ts - Global Field-Token Learning Store with Position Awareness

import { PositionedToken } from '@/types/learning';

export type MasterTokenMap = {
  [token: string]: {
    field: string;
    count: number;
    lastUsed?: string;
    category?: string;
    subcategory?: string;
    positions?: {
      value: number;
      context?: {
        before?: string[];
        after?: string[];
      };
    }[];
  };
};

const MASTER_MIND_KEY = 'xpensia_master_mind_map';

class MasterMindService {
  private map: MasterTokenMap = {};

  constructor() {
    this.map = this.load();
  }

  private load(): MasterTokenMap {
    try {
      const stored = localStorage.getItem(MASTER_MIND_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      if (import.meta.env.MODE === 'development') {
        console.error('Failed to load MasterMind map:', e);
      }
      return {};
    }
  }

  private save(): void {
    localStorage.setItem(MASTER_MIND_KEY, JSON.stringify(this.map));
  }

  public registerToken(token: string, field: string, category?: string, subcategory?: string) {
    const normalized = token.toLowerCase();
    if (!this.map[normalized]) {
      this.map[normalized] = { 
        field, 
        count: 1, 
        lastUsed: new Date().toISOString(), 
        category, 
        subcategory,
        positions: []
      };
    } else {
      this.map[normalized].count++;
      this.map[normalized].lastUsed = new Date().toISOString();
    }
    this.save();
  }

  public registerTokenWithPosition(
    token: string, 
    field: string, 
    position: number, 
    context?: { before?: string[], after?: string[] },
    category?: string, 
    subcategory?: string
  ) {
    const normalized = token.toLowerCase();
    
    if (!this.map[normalized]) {
      this.map[normalized] = { 
        field, 
        count: 1, 
        lastUsed: new Date().toISOString(), 
        category, 
        subcategory,
        positions: [{ value: position, context }]
      };
    } else {
      this.map[normalized].count++;
      this.map[normalized].lastUsed = new Date().toISOString();
      
      // Add position if it doesn't exist
      if (!this.map[normalized].positions) {
        this.map[normalized].positions = [];
      }
      
      this.map[normalized].positions.push({ value: position, context });
      
      // Keep only the most recent 5 positions
      if (this.map[normalized].positions.length > 5) {
        this.map[normalized].positions.shift();
      }
    }
    
    this.save();
  }

  public getMap(): MasterTokenMap {
    return this.map;
  }

  public clear(): void {
    this.map = {};
    this.save();
  }
}

export const masterMindService = new MasterMindService();
