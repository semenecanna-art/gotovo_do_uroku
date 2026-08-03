export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;

    const url = new URL(request.url);
    if (url.pathname.endsWith("/__next._full.txt")) {
      url.pathname = url.pathname.replace(/__next\._full\.txt$/, "index.txt");
      return env.ASSETS.fetch(new Request(url, request));
    }
    if (!url.pathname.includes(".")) {
      url.pathname = "/404.html";
      const notFound = await env.ASSETS.fetch(new Request(url, request));
      return new Response(notFound.body, {
        status: 404,
        headers: notFound.headers,
      });
    }
    return response;
  },
};
