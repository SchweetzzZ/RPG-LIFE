import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../services/http';

export interface Resource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Relê do servidor sem apagar o que já está na tela. */
  reload: () => Promise<void>;
}

/**
 * Carrega dados da API ao montar e expõe `reload`. Sempre reler do servidor depois de uma ação
 * (fechar o dia, agendar, resgatar): `ready`/`canBuy` mudam conforme o saldo.
 */
export function useResource<T>(loader: () => Promise<T>): Resource<T> {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const requestId = useRef(0);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const result = await loaderRef.current();
      if (id !== requestId.current) return;
      setData(result);
      setError(null);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(errorMessage(err instanceof Error ? err : null, 'Falha ao carregar os dados'));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    return () => {
      requestId.current++;
    };
  }, [reload]);

  return { data, loading, error, reload };
}
