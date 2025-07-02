export interface Person {
  name: string;
  relation?: string;
  user?: boolean;
}

const PEOPLE_KEY = 'xpensia_people';

export const DEFAULT_PEOPLE: Person[] = [
  { name: 'Ahmed' },
  { name: 'Marwa' },
  { name: 'Youssef' },
  { name: 'Salma' },
  { name: 'Mazen' }
];

export function getStoredPeople(): Person[] {
  try {
    const raw = localStorage.getItem(PEOPLE_KEY);
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
    const raw = localStorage.getItem(PEOPLE_KEY);
    const arr: Person[] = raw ? JSON.parse(raw) : [];
    if (!arr.some(p => p.name.toLowerCase() === person.name.toLowerCase())) {
      arr.push({ ...person, ...(user ? { user: true } : {}) });
      localStorage.setItem(PEOPLE_KEY, JSON.stringify(arr));
    }
  } catch {
    // ignore
  }
}
