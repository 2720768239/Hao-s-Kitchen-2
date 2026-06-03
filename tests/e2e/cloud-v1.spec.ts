import { expect, test } from "@playwright/test";

test("chef opens and archives a meal while a guest submits dishes", async ({ browser }) => {
  const chef = await browser.newPage();
  const guest = await browser.newPage();

  await chef.goto("/chef/login");
  await chef.getByLabel("主厨口令").fill(process.env.E2E_CHEF_PASSWORD ?? "e2e-chef-password");
  await chef.getByRole("button", { name: "进入主厨工具台" }).click();
  await expect(chef.getByRole("button", { name: "英雄集结" })).toBeVisible();

  const archiveButton = chef.getByRole("button", { name: "群雄归隐" });
  if (await archiveButton.isEnabled()) {
    await archiveButton.click();
    await expect(chef.getByRole("button", { name: "英雄集结" })).toBeEnabled();
  }

  await chef.getByRole("button", { name: "英雄集结" }).click();
  const invite = await chef.getByLabel("邀请链接").inputValue();

  await guest.goto(invite);
  await guest.getByRole("button", { name: "馋这道 辣子鸡丁" }).click();
  const submitSelection = guest.getByRole("button", { name: "馋", exact: true });
  await expect(submitSelection).toBeEnabled();
  await submitSelection.click();
  await guest.getByLabel("名字").fill("小红");
  await guest.getByLabel("备注").fill("再来两碗米饭");
  await guest.getByRole("button", { name: "报上名来" }).click();

  await chef.goto("/chef/to-cook");
  await expect(chef.getByText("小红")).toBeVisible();

  await chef.goto("/chef");
  await chef.getByRole("button", { name: "群雄归隐" }).click();
  await guest.reload();
  await expect(guest.getByRole("heading", { name: "群雄归隐" })).toBeVisible();
});
