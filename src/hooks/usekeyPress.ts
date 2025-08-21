import { useState, useEffect, useCallback } from 'react';

const useKeyPress = (targetKeyCode: number): boolean => {
  const [keyPressed, setKeyPressed] = useState(false);

  const keyDownHandler = useCallback(({ keyCode }: KeyboardEvent) => {
    if (keyCode === targetKeyCode) {
      setKeyPressed(true);
    }
  }, [targetKeyCode]);

  const keyUpHandler = useCallback(({ keyCode }: KeyboardEvent) => {
    if (keyCode === targetKeyCode) {
      setKeyPressed(false);
    }
  }, [targetKeyCode]);

  useEffect(() => {
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
      document.removeEventListener('keyup', keyUpHandler);
    };
  }, [keyDownHandler, keyUpHandler]);

  return keyPressed;
};

export default useKeyPress;