'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface OpenCVContextType {
  isReady: boolean;
}

const OpenCVContext = createContext<OpenCVContextType>({ isReady: false });

export const useOpenCV = () => useContext(OpenCVContext);

export function OpenCVProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkOpenCV = setInterval(() => {
      if ((window as any).cv) {
        setIsReady(true);
        clearInterval(checkOpenCV);
        console.log('OpenCV.js is ready');
      }
    }, 100);

    return () => clearInterval(checkOpenCV);
  }, []);

  return (
    <OpenCVContext.Provider value={{ isReady }}>
      {children}
    </OpenCVContext.Provider>
  );
}