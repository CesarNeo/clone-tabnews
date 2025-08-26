import retry from "async-retry";

async function waitForAllServices() {
  async function waitForWebServer() {
    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      await response.json();
    }

    return retry(fetchStatusPage, { retries: 100 });
  }

  await waitForWebServer();
}

export default { waitForAllServices };
