"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DishRecord } from "@/server/chef-service";

export function DishEditor({ dish }: { dish: DishRecord }) {
  const router = useRouter();
  const [name, setName] = useState(dish.name);
  const [description, setDescription] = useState(dish.description);
  const [tags, setTags] = useState(dish.tags.join("，"));
  const [imagePath, setImagePath] = useState(dish.imagePath);
  const [isAvailable, setIsAvailable] = useState(dish.isAvailable);
  const [message, setMessage] = useState("");

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
        const response = await fetch(`/api/chef/dishes/${dish.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            imagePath,
            description,
            tags: tags
              .split(/[，,]/)
              .map((tag) => tag.trim())
              .filter(Boolean),
            isAvailable,
          }),
        });

        if (response.ok) {
          router.push("/chef/dishes");
          router.refresh();
        } else {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          setMessage(body?.error ?? "保存失败");
        }
      }}
    >
      <label>
        菜名
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={20} required />
      </label>
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
            try {
              await uploadImage(file);
              setMessage("图片已上传");
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "图片上传失败");
            }
          }}
        />
      </label>
      <p className="muted-dark">当前图片：{imagePath}</p>
      <label>
        描述
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={100} />
      </label>
      <label>
        标签
        <input value={tags} onChange={(event) => setTags(event.target.value)} />
      </label>
      <label className="switch-line">
        是否上架
        <input type="checkbox" checked={isAvailable} onChange={(event) => setIsAvailable(event.target.checked)} />
      </label>
      {message ? <p className="form-message">{message}</p> : null}
      <button className="chef-primary" type="submit">
        保存
      </button>
    </form>
  );
}
