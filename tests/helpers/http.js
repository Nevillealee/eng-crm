function jsonRequest(url, method, body) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function readJson(response) {
  return response.json();
}

module.exports = {
  jsonRequest,
  readJson,
};
