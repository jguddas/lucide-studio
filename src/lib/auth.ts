import NextAuth from "next-auth";
import { GitHubEmail, GitHubProfile } from "next-auth/providers/github";
import { OAuthConfig } from "next-auth/providers";

const GitHubProvider: OAuthConfig<GitHubProfile> = {
  id: "github",
  name: "GitHub",
  type: "oauth",
  authorization: {
    url: "https://github.com/login/oauth/authorize",
    params: { scope: "read:user repo" },
  },
  token: "https://github.com/login/oauth/access_token",
  userinfo: {
    url: "https://api.github.com/user",
    async request({
      tokens,
      provider,
    }: Parameters<OAuthConfig<GitHubProfile>["userinfo"]["request"]>[0]) {
      const profile = await fetch(provider.userinfo?.url as URL, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "User-Agent": "authjs",
        },
      }).then(async (res) => await res.json());

      profile.access_token = tokens.access_token;

      return profile;
    },
  },
  profile(profile) {
    return {
      name: profile.name,
      image: JSON.stringify(profile),
    };
  },
  style: { logo: "/github.svg", bg: "#24292f", text: "#fff" },
};

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  providers: [GitHubProvider],
});
