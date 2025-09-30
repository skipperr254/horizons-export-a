import React, { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
        const handleStorageChange = (e) => {
            if (e.key === key) {
                try {
                    setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
                } catch (error) {
                    console.log(error);
                }
            }
        };
        
        // Add delay for Safari to prevent storage access conflicts
        const timeoutId = setTimeout(() => {
            window.addEventListener('storage', handleStorageChange);
        }, 100);
        
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('storage', handleStorageChange);
        };
    }
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;