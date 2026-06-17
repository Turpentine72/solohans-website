import { createContext, useContext, useState, useEffect } from 'react';
import { promos as promosApi } from '../lib/api';

const PromoContext = createContext();

export function PromoProvider({ children }) {
  const [activePromos, setActivePromos] = useState([]);

  const fetchPromos = async () => {
    try {
      const data = await promosApi.getActive();
      setActivePromos(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchPromos(); }, []);

  return (
    <PromoContext.Provider value={{ activePromos, refetch: fetchPromos }}>
      {children}
    </PromoContext.Provider>
  );
}

export const usePromos = () => useContext(PromoContext);