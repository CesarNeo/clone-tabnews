import useSWR from "swr";

type TStatusResponse = {
  updated_at: string;
  dependencies: {
    database: {
      version: string;
      opened_connections: number;
      max_connections: number;
    };
  };
};

async function fetchApi(key: string) {
  const response = await fetch(key);
  const responseBody = await response.json();

  return responseBody;
}

function UpdatedAt() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchApi, {
    refreshInterval: 2000,
  });
  let updatedAtText = "carregando...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return <div>Última atualização: {updatedAtText}</div>;
}

function DatabaseStatus() {
  const { data, isLoading } = useSWR<TStatusResponse>(
    "/api/v1/status",
    fetchApi,
    {
      refreshInterval: 2000,
    },
  );

  if (isLoading && !data) {
    return <div>Carregando status do banco de dados...</div>;
  }

  const { version, opened_connections, max_connections } =
    data.dependencies.database;

  return (
    <div>
      <h2>Banco de Dados</h2>
      <p>Conexões disponíveis: {max_connections}</p>
      <p>Conexões abertas: {opened_connections}</p>
      <p>Versão do PostgreSQL: {version}</p>
    </div>
  );
}

function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DatabaseStatus />
    </>
  );
}

export default StatusPage;
