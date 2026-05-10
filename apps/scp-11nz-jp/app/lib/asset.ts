/**
 * basePath を考慮したアセットパスを返す
 *
 * 例: NEXT_PUBLIC_BASE_PATH=/abc123 のとき、
 *     assetPath("/images/foo.png") → "/abc123/images/foo.png"
 */
export function assetPath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (!path.startsWith("/")) return basePath + "/" + path;
  return basePath + path;
}
