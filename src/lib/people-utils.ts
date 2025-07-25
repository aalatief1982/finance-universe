import { safeStorage } from "@/utils/safe-storage";
export interface Person {
  name: string;
  relation?: string;
  user?: boolean;
}

const PEOPLE_KEY = 'xpensia_people';

export const DEFAULT_PEOPLE: Person[] = [
  { name: 'None' }
];

export function getStoredPeople(): Person[] {
  try {
    const raw = safeStorage.getItem(PEOPLE_KEY);
    const userPeople: Person[] = raw ? JSON.parse(raw) : [];
    return [...DEFAULT_PEOPLE, ...userPeople];
  } catch {
    return [...DEFAULT_PEOPLE];
  }
}

export function getPeopleNames(): string[] {
  return getStoredPeople().map(p => p.name);
}

export function addUserPerson(person: Person, user = true) {
  if (!person.name.trim()) return;
  try {
    const raw = safeStorage.getItem(PEOPLE_KEY);
    const arr: Person[] = raw ? JSON.parse(raw) : [];
    if (!arr.some(p => p.name.toLowerCase() === person.name.toLowerCase())) {
      arr.push({ ...person, ...(user ? { user: true } : {}) });
      safeStorage.setItem(PEOPLE_KEY, JSON.stringify(arr));
    }
  } catch {
    // ignore
  }
}
