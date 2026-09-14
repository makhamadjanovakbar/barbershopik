/**
 * Единая точка импорта UI-примитивов.
 *
 * Позволяет писать:
 *   import { Button, Input, Card, Table, Badge, ProgressBar } from "@/components/ui";
 *
 * вместо шести отдельных импортов из разных файлов.
 */

export { default as Button } from "./Button";
export { default as Card } from "./Card";
export { default as Badge } from "./Badge";
export { default as ProgressBar } from "./ProgressBar";
export { default as Table, type Column } from "./Table";
export { Input, Select, Textarea } from "./Input";