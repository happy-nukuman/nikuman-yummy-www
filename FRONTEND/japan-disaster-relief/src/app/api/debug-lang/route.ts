import { headers } from "next/headers";
import { detectDemoLang, parseAcceptLanguage } from "@/features/demo/i18n";

// 临时调试接口：查看浏览器实际发送的 Accept-Language 与判定结果。确认完可删除。
export async function GET() {
	const acceptLanguage = (await headers()).get("accept-language");
	return Response.json({
		acceptLanguage,
		parsed: parseAcceptLanguage(acceptLanguage),
		detected: detectDemoLang(parseAcceptLanguage(acceptLanguage)),
	});
}
