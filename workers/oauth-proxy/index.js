const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (pathname === "/auth") return handleAuth(url, env);
    if (pathname === "/callback") return handleCallback(url, env);
    if (pathname === "/") return new Response("Firefly CMS OAuth Proxy ✅", { headers: corsHeaders });
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
};

function handleAuth(url, env) {
  const clientId = env.GITHUB_CLIENT_ID;
  const redirectUri = `${url.origin}/callback`;
  const githubUrl = `${GITHUB_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user&state=${crypto.randomUUID()}`;
  return Response.redirect(githubUrl, 302);
}

async function handleCallback(url, env) {
  const code = url.searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });
  try {
    const resp = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${url.origin}/callback`,
      }),
    });
    const data = await resp.json();
    if (data.error) return new Response(`Error: ${data.error_description}`, { status: 400 });
    const html = `<!DOCTYPE html><html><body><script>
      (function(){
        var opener = window.opener || window.parent;
        if(opener) opener.postMessage("authorization:github:success:"+JSON.stringify({token:"${data.access_token}",provider:"github"}),"*");
        window.close();
      })();
    </script><p>正在关闭窗口...</p></body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (e) {
    return new Response(`OAuth Error: ${e.message}`, { status: 500 });
  }
}
