import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { mockPatients, mockMammograms } from '../data/mockData';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [patients, setPatients] = useState(mockPatients);
  const [mammograms, setMammograms] = useState(mockMammograms);
  const [savedMammograms, setSavedMammograms] = useState(() =>
    mammograms.filter((m) => m.saved).map((m) => m.id),
  );
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const toggleSaved = useCallback(
    (id) => {
      setSavedMammograms((prev) => {
        const isSaved = prev.includes(id);
        const next = isSaved ? prev.filter((m) => m !== id) : [...prev, id];
        showToast(
          isSaved ? 'Mamografía quitada de guardadas.' : 'Mamografía guardada.',
          isSaved ? 'error' : 'success',
        );
        return next;
      });
    },
    [showToast],
  );

  const addPatient = useCallback(
    (patient) => {
      const newPatient = { ...patient, id: `p${Date.now()}`, priority: null };
      setPatients((prev) => [newPatient, ...prev]);
      showToast('Paciente registrado correctamente.');
      return newPatient;
    },
    [showToast],
  );

  const addMammogram = useCallback(
    (mammogram) => {
      const newMammogram = {
        id: `m${Date.now()}`,
        saved: false,
        ...mammogram,
      };
      setMammograms((prev) => [newMammogram, ...prev]);
      return newMammogram;
    },
    [],
  );

  const value = useMemo(
    () => ({
      patients,
      mammograms,
      savedMammograms,
      toasts,
      showToast,
      toggleSaved,
      addPatient,
      addMammogram,
    }),
    [patients, mammograms, savedMammograms, toasts, showToast, toggleSaved, addPatient, addMammogram],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe usarse dentro de <DataProvider>.');
  }
  return context;
}