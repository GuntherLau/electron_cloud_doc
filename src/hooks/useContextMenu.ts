import { useEffect, useRef } from 'react';

const { Menu, MenuItem, getCurrentWindow } = window.require('@electron/remote');

interface MenuItemConfig {
  label: string;
  click?: () => void;
  accelerator?: string;
  role?: string;
  type?: string;
  enabled?: boolean;
}

const useContextMenu = (
  itemArr: MenuItemConfig[],
  targetSelector: string,
  deps: any[]
): React.MutableRefObject<HTMLElement | null> => {
  const clickedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const menu = new Menu();
    itemArr.forEach(item => {
      menu.append(new MenuItem(item));
    });

    const handleContextMenu = (e: MouseEvent) => {
      const target = document.querySelector(targetSelector);
      if (target && target.contains(e.target as Node)) {
        clickedElement.current = e.target as HTMLElement;
        menu.popup({ window: getCurrentWindow() });
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [itemArr, targetSelector, ...deps]);

  return clickedElement;
};

export default useContextMenu;