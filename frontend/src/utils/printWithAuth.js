export async function printWithAuth(url) {
  const token = sessionStorage.getItem("hms_token");
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Print request failed (${res.status})`);
  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const win = window.open(blobUrl, "_blank");
  if (!win) throw new Error("Pop-up blocked. Please allow pop-ups for this site.");
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 120000);
  return win;
}
