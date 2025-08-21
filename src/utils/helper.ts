import { FileItem, FileStore } from '../types';

export const flattenArr = (arr: FileItem[]): FileStore => {
  return arr.reduce((map: FileStore, item: FileItem) => {
    map[item.id] = item;
    return map;
  }, {});
};

export const objToArr = (obj: FileStore): FileItem[] => {
  return Object.keys(obj).map(key => obj[key]);
};

export const getParentNode = (node: HTMLElement, parentClassName: string): HTMLElement | false => {
  let current: HTMLElement | null = node;
  while (current != null) {
    if (current.classList.contains(parentClassName)) {
      return current;
    }
    current = current.parentNode as HTMLElement;
  }
  return false;
};

export const timestampToString = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};