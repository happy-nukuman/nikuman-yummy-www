// 灾害现场“把 App 分享给旁边的人”用的地址：取当前部署的入口地址本身，
// 不写死域名，本地开发、预览和线上都能扫到自己这一份。

/** 当前 App 的分享地址：去掉查询串、哈希和结尾斜杠，让二维码尽量短。 */
export function appShareUrl(href: string): string {
	const url = new URL(href);
	url.search = "";
	url.hash = "";
	const text = url.toString();
	return text.endsWith("/") ? text.slice(0, -1) : text;
}

/** 二维码下方给人读、给人手输的地址：省掉 https:// 前缀。 */
export function shareUrlLabel(shareUrl: string): string {
	return shareUrl.replace(/^https:\/\//, "");
}
