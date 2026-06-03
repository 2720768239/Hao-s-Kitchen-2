"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DishCreateFormProps = {
  nextSortOrder: number;
};

export function DishCreateForm({ nextSortOrder }: DishCreateFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch("/api/chef/uploads", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "图片上传失败");
    }

    const body = (await response.json()) as { path: string };
    setImagePath(body.path);
  }

  return (
    <form
      className="chef-card editor-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setMessage("");

        if (!imagePath) {
          setMessage("请先上传菜品图片");
          return;
        }

        setBusy(true);
        try {
          const response = await fetch("/api/chef/dishes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              imagePath,
              description,
              tags: tags
                .split(/[，,]/)
                .map((tag) => tag.trim())
                .filter(Boolean),
              sortOrder: nextSortOrder,
              isAvailable: true,
            }),
          });

          if (!response.ok) {
            const body = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new Error(body?.error ?? "新增菜品失败");
          }

          setName("");
          setDescription("");
          setTags("");
          setImagePath("");
          setMessage("菜品已新增");
          router.refresh();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "新增菜品失败");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>新增菜品</h2>
      <label>
        菜品图片
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            setMessage("");
            setBusy(true);
            try {
              await uploadImage(file);
              setMessage("图片已上传");
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "图片上传失败");
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {imagePath ? <p className="muted-dark">已选择：{imagePath}</p> : null}
      <label>
        菜名
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={20} required />
      </label>
      <label>
        描述
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={100} />
      </label>
      <label>
        标签
        <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="例如：下饭，招牌" />
      </label>
      {message ? <p className="form-message">{message}</p> : null}
      <button className="chef-primary" type="submit" disabled={busy}>
        {busy ? "处理中..." : "新增到菜单"}
      </button>
    </form>
  );
}
