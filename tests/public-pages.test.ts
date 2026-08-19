import { describe, expect, it } from "vitest";

import { renderPublicPage } from "../server/public-pages";

describe("公開情報ページ", () => {
  it("プライバシーポリシーに連絡先とデータの取り扱いを表示する", () => {
    const html = renderPublicPage("policy");
    expect(html).toContain("Focus Flow プライバシーポリシー");
    expect(html).toContain("forcus.flow@gmail.com");
    expect(html).toContain("広告SDKおよび行動追跡SDKは使用しません");
  });

  it("サポートと利用条件のリンクを各公開ページへ表示する", () => {
    const html = renderPublicPage("help");
    expect(html).toContain('href="/policy"');
    expect(html).toContain('href="/terms"');
    expect(renderPublicPage("terms")).toContain("Focus Flow Plus");
  });
});
