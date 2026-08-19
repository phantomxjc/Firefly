import type { FriendLink, FriendsPageConfig } from "../types/friendsConfig";

// 可以在src/content/spec/friends.md中编写友链页面下方的自定义内容

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: "",

	// 是否显示底部自定义内容（friends.mdx 中的内容）
	showCustomContent: true,

	// 是否显示评论区，需要先在commentConfig.ts启用评论系统
	showComment: true,

	// 是否开启随机排序配置，如果开启，就会忽略权重，构建时进行一次随机排序
	randomizeSort: false,
};

// 友链配置
export const friendsConfig: FriendLink[] = [
	{
		title: "年华",
		imgurl:
			"https://avatars.githubusercontent.com/qwc-ch?v=4&s=640",
		desc: "欢迎来到我的小破站",
		siteurl: "https://blog.amamo.top",
		tags: ["Blog"],
		weight: 7,
		enabled: true,
	},
	{
		title: "临渊羡鱼",
		imgurl:
			"https://avatars.githubusercontent.com/ImYufish?v=4&s=640",
		desc: "Wander like a fish",
		siteurl: "https://x1anyu.cn",
		tags: ["Blog"],
		weight: 6,
		enabled: true,
	},
];

// 获取启用的友链列表，按权重降序排列
export function getEnabledFriends(): FriendLink[] {
	const enabled = friendsConfig.filter((link) => link.enabled !== false);
	if (friendsPageConfig.randomizeSort) {
		return enabled.sort(() => Math.random() - 0.5);
	}
	return enabled.sort((a, b) => b.weight - a.weight);
}