// MasterMindService.ts - Global Field-Token Learning Store

export type MasterTokenMap = {
    [token: string]: {
      field: string;
      count: number;
      lastUsed?: string;
      category?: string;
      subcategory?: string;
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
        console.error('Failed to load MasterMind map:', e);
        return {};
      }
    }
  
    private save(): void {
      localStorage.setItem(MASTER_MIND_KEY, JSON.stringify(this.map));
    }
  
    public registerToken(token: string, field: string, category?: string, subcategory?: string) {
      const normalized = token.toLowerCase();
      if (!this.map[normalized]) {
        this.map[normalized] = { field, count: 1, lastUsed: new Date().toISOString(), category, subcategory };
      } else {
        this.map[normalized].count++;
        this.map[normalized].lastUsed = new Date().toISOString();
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
  