import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name: string): string =>
  name
    .split(' ') // スペースで文字列を分割
    .map((part) => part[0]) // 各文字列の最初の文字を取得
    .join('') // 各文字を結合
    .toUpperCase() // 大文字に変換
    .slice(0, 2); // 最初の2文字を返す
